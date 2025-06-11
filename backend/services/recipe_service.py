from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, asc, func
from typing import Optional, List
from uuid import UUID
import asyncio

from ..models.recipe import Recipe, RecipeIngredient, RecipeRating, ComplexityLevel
from ..models.ingredient import Ingredient
from ..models.user import User
from ..models.requests import (
    RecipeListQuery, FindByIngredientsQuery, CreateRecipeRequest, 
    UpdateRecipeRequest, SortField, SortOrder
)
from ..models.responses import (
    RecipeListResponse, RecipeDetailResponse, RecipeListItemDto, 
    RecipeDetailDto, RecipeIngredientDetail, RatingUpdateResponse,
    PaginationInfo
)
from ..utils.logging_config import get_logger

logger = get_logger(__name__)

class RecipeService:
    """Service class for recipe operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def get_recipes_list(self, query: RecipeListQuery) -> RecipeListResponse:
        """
        Get paginated list of recipes with filtering and sorting
        """
        logger.info(f"Getting recipes list with query: {query}")
        
        # Build base query
        base_query = self.db.query(Recipe)
        
        # Apply filters
        if query.complexity:
            base_query = base_query.filter(Recipe.complexity_level == query.complexity)
        
        if query.authorId:
            base_query = base_query.filter(Recipe.author_id == query.authorId)
        
        # Apply sorting
        sort_column = self._get_sort_column(query.sortBy)
        if query.sortOrder == SortOrder.DESC:
            base_query = base_query.order_by(desc(sort_column))
        else:
            base_query = base_query.order_by(asc(sort_column))
        
        # Get total count for pagination
        total_count = base_query.count()
        
        # Apply pagination
        offset = (query.page - 1) * query.limit
        recipes = base_query.offset(offset).limit(query.limit).all()
        
        # Convert to DTOs
        recipe_dtos = [self._convert_to_list_item_dto(recipe) for recipe in recipes]
        
        # Calculate pagination info
        total_pages = (total_count + query.limit - 1) // query.limit
        pagination = PaginationInfo(
            page=query.page,
            limit=query.limit,
            total_items=total_count,
            total_pages=total_pages
        )
        
        return RecipeListResponse(data=recipe_dtos, pagination=pagination)
    
    async def find_recipes_by_ingredients(
        self, 
        query: FindByIngredientsQuery, 
        user_id: Optional[UUID] = None
    ) -> RecipeListResponse:
        """
        Find recipes that can be made with specified ingredients
        """
        logger.info(f"Finding recipes by ingredients: {query.ingredientIds}")
        
        # Parse ingredient IDs
        ingredient_ids = [UUID(id.strip()) for id in query.ingredientIds.split(',') if id.strip()]
        
        # Validate ingredients exist
        existing_ingredients = self.db.query(Ingredient.id).filter(
            Ingredient.id.in_(ingredient_ids)
        ).all()
        existing_ids = {ing.id for ing in existing_ingredients}
        
        invalid_ids = set(ingredient_ids) - existing_ids
        if invalid_ids:
            raise ValueError(f"Invalid ingredient IDs: {invalid_ids}")
        
        # Find recipes with matching ingredients
        # Count how many of the requested ingredients each recipe has
        recipe_matches = self.db.query(
            Recipe.id,
            func.count(RecipeIngredient.ingredient_id).label('match_count')
        ).join(
            RecipeIngredient, Recipe.id == RecipeIngredient.recipe_id
        ).filter(
            RecipeIngredient.ingredient_id.in_(ingredient_ids)
        ).group_by(Recipe.id).subquery()
        
        # Get recipes ordered by match count (most matching ingredients first)
        recipes = self.db.query(Recipe).join(
            recipe_matches, Recipe.id == recipe_matches.c.id
        ).order_by(desc(recipe_matches.c.match_count)).limit(50).all()
        
        # Convert to DTOs
        recipe_dtos = [self._convert_to_list_item_dto(recipe) for recipe in recipes]
        
        # Background task: update ingredient popularity
        if user_id:
            asyncio.create_task(self._update_ingredient_popularity(ingredient_ids))
        
        # Simple pagination info (no real pagination for this endpoint)
        pagination = PaginationInfo(
            page=1,
            limit=len(recipe_dtos),
            total_items=len(recipe_dtos),
            total_pages=1
        )
        
        return RecipeListResponse(data=recipe_dtos, pagination=pagination)
    
    async def get_recipe_by_id(self, recipe_id: UUID) -> Optional[RecipeDetailResponse]:
        """
        Get detailed recipe information by ID
        """
        logger.info(f"Getting recipe details for ID: {recipe_id}")
        
        recipe = self.db.query(Recipe).options(
            joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient)
        ).filter(Recipe.id == recipe_id).first()
        
        if not recipe:
            return None
        
        recipe_dto = self._convert_to_detail_dto(recipe)
        return RecipeDetailResponse(data=recipe_dto)
    
    async def create_recipe(
        self, 
        recipe_data: CreateRecipeRequest, 
        author_id: UUID
    ) -> RecipeDetailResponse:
        """
        Create a new recipe with ingredients
        """
        logger.info(f"Creating recipe: {recipe_data.name} for user {author_id}")
        
        # Validate ingredients exist
        ingredient_ids = [ing.ingredient_id for ing in recipe_data.ingredients]
        existing_ingredients = self.db.query(Ingredient.id).filter(
            Ingredient.id.in_(ingredient_ids)
        ).all()
        existing_ids = {ing.id for ing in existing_ingredients}
        
        invalid_ids = set(ingredient_ids) - existing_ids
        if invalid_ids:
            raise ValueError(f"Invalid ingredient IDs: {invalid_ids}")
        
        try:
            # Create recipe
            recipe = Recipe(
                name=recipe_data.name,
                preparation_time_minutes=recipe_data.preparation_time_minutes,
                complexity_level=recipe_data.complexity_level,
                steps=[{"step": step.step, "description": step.description} 
                       for step in recipe_data.steps],
                author_id=author_id
            )
            
            self.db.add(recipe)
            self.db.flush()  # Get recipe ID
            
            # Create recipe ingredients
            for ingredient_data in recipe_data.ingredients:
                recipe_ingredient = RecipeIngredient(
                    recipe_id=recipe.id,
                    ingredient_id=ingredient_data.ingredient_id,
                    amount=ingredient_data.amount,
                    is_optional="true" if ingredient_data.is_optional else "false",
                    substitute_recommendation=ingredient_data.substitute_recommendation
                )
                self.db.add(recipe_ingredient)
            
            self.db.commit()
            
            # Reload with ingredients
            recipe = self.db.query(Recipe).options(
                joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient)
            ).filter(Recipe.id == recipe.id).first()
            
            recipe_dto = self._convert_to_detail_dto(recipe)
            return RecipeDetailResponse(data=recipe_dto)
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating recipe: {str(e)}")
            raise
    
    async def update_recipe(
        self, 
        recipe_id: UUID, 
        recipe_data: UpdateRecipeRequest, 
        user_id: UUID
    ) -> Optional[RecipeDetailResponse]:
        """
        Update an existing recipe (only by author)
        """
        logger.info(f"Updating recipe {recipe_id} by user {user_id}")
        
        recipe = self.db.query(Recipe).filter(Recipe.id == recipe_id).first()
        
        if not recipe:
            return None
        
        # Check ownership
        if recipe.author_id != user_id:
            logger.warning(f"User {user_id} attempted to update recipe {recipe_id} by {recipe.author_id}")
            return None
        
        try:
            # Update recipe fields
            if recipe_data.name is not None:
                recipe.name = recipe_data.name
            if recipe_data.preparation_time_minutes is not None:
                recipe.preparation_time_minutes = recipe_data.preparation_time_minutes
            if recipe_data.complexity_level is not None:
                recipe.complexity_level = recipe_data.complexity_level
            if recipe_data.steps is not None:
                recipe.steps = [{"step": step.step, "description": step.description} 
                              for step in recipe_data.steps]
            
            # Update ingredients if provided
            if recipe_data.ingredients is not None:
                # Validate ingredients exist
                ingredient_ids = [ing.ingredient_id for ing in recipe_data.ingredients]
                existing_ingredients = self.db.query(Ingredient.id).filter(
                    Ingredient.id.in_(ingredient_ids)
                ).all()
                existing_ids = {ing.id for ing in existing_ingredients}
                
                invalid_ids = set(ingredient_ids) - existing_ids
                if invalid_ids:
                    raise ValueError(f"Invalid ingredient IDs: {invalid_ids}")
                
                # Remove existing ingredients
                self.db.query(RecipeIngredient).filter(
                    RecipeIngredient.recipe_id == recipe_id
                ).delete()
                
                # Add new ingredients
                for ingredient_data in recipe_data.ingredients:
                    recipe_ingredient = RecipeIngredient(
                        recipe_id=recipe.id,
                        ingredient_id=ingredient_data.ingredient_id,
                        amount=ingredient_data.amount,
                        is_optional="true" if ingredient_data.is_optional else "false",
                        substitute_recommendation=ingredient_data.substitute_recommendation
                    )
                    self.db.add(recipe_ingredient)
            
            self.db.commit()
            
            # Reload with ingredients
            recipe = self.db.query(Recipe).options(
                joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient)
            ).filter(Recipe.id == recipe.id).first()
            
            recipe_dto = self._convert_to_detail_dto(recipe)
            return RecipeDetailResponse(data=recipe_dto)
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating recipe {recipe_id}: {str(e)}")
            raise
    
    async def delete_recipe(self, recipe_id: UUID, user_id: UUID) -> bool:
        """
        Delete a recipe (only by author)
        """
        logger.info(f"Deleting recipe {recipe_id} by user {user_id}")
        
        recipe = self.db.query(Recipe).filter(Recipe.id == recipe_id).first()
        
        if not recipe:
            return False
        
        # Check ownership
        if recipe.author_id != user_id:
            logger.warning(f"User {user_id} attempted to delete recipe {recipe_id} by {recipe.author_id}")
            return False
        
        try:
            self.db.delete(recipe)
            self.db.commit()
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting recipe {recipe_id}: {str(e)}")
            raise
    
    async def rate_recipe(
        self, 
        recipe_id: UUID, 
        rating: int, 
        user_id: UUID
    ) -> Optional[RatingUpdateResponse]:
        """
        Rate a recipe (one rating per user per recipe)
        """
        logger.info(f"Rating recipe {recipe_id} with {rating} by user {user_id}")
        
        recipe = self.db.query(Recipe).filter(Recipe.id == recipe_id).first()
        
        if not recipe:
            return None
        
        # Check if user already rated this recipe
        existing_rating = self.db.query(RecipeRating).filter(
            and_(RecipeRating.recipe_id == recipe_id, RecipeRating.user_id == user_id)
        ).first()
        
        if existing_rating:
            raise ValueError("User has already rated this recipe")
        
        try:
            # Create new rating
            recipe_rating = RecipeRating(
                recipe_id=recipe_id,
                user_id=user_id,
                rating=rating
            )
            self.db.add(recipe_rating)
            
            # Recalculate average rating
            ratings = self.db.query(RecipeRating.rating).filter(
                RecipeRating.recipe_id == recipe_id
            ).all()
            
            total_ratings = len(ratings) + 1  # Include the new rating
            sum_ratings = sum(r.rating for r in ratings) + rating
            new_average = sum_ratings / total_ratings
            
            # Update recipe
            recipe.average_rating = round(new_average, 2)
            recipe.total_votes = total_ratings
            
            self.db.commit()
            
            return RatingUpdateResponse(
                average_rating=recipe.average_rating,
                total_votes=recipe.total_votes
            )
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error rating recipe {recipe_id}: {str(e)}")
            raise
    
    def _get_sort_column(self, sort_field: SortField):
        """Get SQLAlchemy column for sorting"""
        sort_mapping = {
            SortField.NAME: Recipe.name,
            SortField.RATING: Recipe.average_rating,
            SortField.PREP_TIME: Recipe.preparation_time_minutes,
            SortField.CREATED_AT: Recipe.created_at
        }
        return sort_mapping.get(sort_field, Recipe.created_at)
    
    def _convert_to_list_item_dto(self, recipe: Recipe) -> RecipeListItemDto:
        """Convert Recipe model to RecipeListItemDto"""
        return RecipeListItemDto(
            id=recipe.id,
            name=recipe.name,
            preparation_time_minutes=recipe.preparation_time_minutes,
            complexity_level=recipe.complexity_level,
            author_id=recipe.author_id,
            average_rating=recipe.average_rating,
            total_votes=recipe.total_votes,
            created_at=recipe.created_at,
            updated_at=recipe.updated_at
        )
    
    def _convert_to_detail_dto(self, recipe: Recipe) -> RecipeDetailDto:
        """Convert Recipe model to RecipeDetailDto"""
        # Convert ingredients
        ingredients = []
        for recipe_ingredient in recipe.ingredients:
            ingredient_dto = RecipeIngredientDetail(
                id=recipe_ingredient.id,
                recipe_id=recipe_ingredient.recipe_id,
                ingredient_id=recipe_ingredient.ingredient_id,
                amount=recipe_ingredient.amount,
                is_optional=recipe_ingredient.is_optional == "true",
                substitute_recommendation=recipe_ingredient.substitute_recommendation,
                name=recipe_ingredient.ingredient.name,
                unit_type=recipe_ingredient.ingredient.unit_type,
                created_at=recipe_ingredient.created_at
            )
            ingredients.append(ingredient_dto)
        
        # Convert steps from JSON to RecipeStepModel format
        from ..models.requests import RecipeStepModel
        steps = [RecipeStepModel(step=step["step"], description=step["description"]) 
                for step in recipe.steps]
        
        return RecipeDetailDto(
            id=recipe.id,
            name=recipe.name,
            preparation_time_minutes=recipe.preparation_time_minutes,
            complexity_level=recipe.complexity_level,
            steps=steps,
            author_id=recipe.author_id,
            average_rating=recipe.average_rating,
            total_votes=recipe.total_votes,
            created_at=recipe.created_at,
            updated_at=recipe.updated_at,
            ingredients=ingredients
        )
    
    async def _update_ingredient_popularity(self, ingredient_ids: List[UUID]):
        """Background task to update ingredient popularity"""
        try:
            # This would update ingredient_popularity table
            # For now, just log the action
            logger.info(f"Updating popularity for ingredients: {ingredient_ids}")
        except Exception as e:
            logger.error(f"Error updating ingredient popularity: {str(e)}") 