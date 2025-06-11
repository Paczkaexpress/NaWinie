from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
import time

from ..database import get_db
from ..models.requests import (
    RecipeListQuery, FindByIngredientsQuery, CreateRecipeRequest, 
    UpdateRecipeRequest, RateRecipeRequest, ComplexityLevel, SortField, SortOrder
)
from ..models.responses import (
    RecipeListResponse, RecipeDetailResponse, RatingUpdateResponse
)
from ..services.recipe_service import RecipeService
from ..dependencies.auth import get_current_user, get_current_user_optional
from ..models.user import User
from ..utils.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter()

def get_recipe_service(db: Session = Depends(get_db)) -> RecipeService:
    """Dependency to get recipe service instance"""
    return RecipeService(db)

@router.get("/", response_model=RecipeListResponse)
async def get_recipes(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    complexity: Optional[ComplexityLevel] = Query(None, description="Filter by complexity level"),
    authorId: Optional[UUID] = Query(None, description="Filter by author ID"),
    sortBy: SortField = Query(SortField.CREATED_AT, description="Sort field"),
    sortOrder: SortOrder = Query(SortOrder.DESC, description="Sort order"),
    recipe_service: RecipeService = Depends(get_recipe_service)
):
    """
    Get a paginated list of recipes with optional filtering and sorting.
    
    - **page**: Page number (default: 1)
    - **limit**: Items per page (1-100, default: 10)
    - **complexity**: Filter by difficulty level (easy/medium/hard)
    - **authorId**: Filter by author UUID
    - **sortBy**: Sort field (name/rating/prep_time/created_at)
    - **sortOrder**: Sort order (asc/desc)
    """
    try:
        logger.info(f"Getting recipes list - page: {page}, limit: {limit}, complexity: {complexity}")
        
        query_params = RecipeListQuery(
            page=page,
            limit=limit,
            complexity=complexity,
            authorId=authorId,
            sortBy=sortBy,
            sortOrder=sortOrder
        )
        
        result = await recipe_service.get_recipes_list(query_params)
        
        logger.info(f"Successfully retrieved {len(result.data)} recipes")
        return result
        
    except ValueError as e:
        logger.error(f"Invalid query parameters: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error retrieving recipes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/find-by-ingredients", response_model=RecipeListResponse)
async def find_recipes_by_ingredients(
    ingredientIds: str = Query(..., description="Comma-separated ingredient UUIDs"),
    recipe_service: RecipeService = Depends(get_recipe_service),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Find recipes that can be made with the specified ingredients.
    
    - **ingredientIds**: Comma-separated list of ingredient UUIDs
    """
    try:
        logger.info(f"Finding recipes by ingredients: {ingredientIds}")
        
        query_params = FindByIngredientsQuery(ingredientIds=ingredientIds)
        user_id = current_user.id if current_user else None
        
        result = await recipe_service.find_recipes_by_ingredients(query_params, user_id)
        
        logger.info(f"Found {len(result.data)} recipes matching ingredients")
        return result
        
    except ValueError as e:
        logger.error(f"Invalid ingredient IDs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error finding recipes by ingredients: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/", response_model=RecipeDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_recipe(
    recipe_data: CreateRecipeRequest,
    recipe_service: RecipeService = Depends(get_recipe_service),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new recipe. Requires authentication.
    
    - **name**: Recipe name (1-255 characters)
    - **preparation_time_minutes**: Preparation time in minutes (>0)
    - **complexity_level**: Difficulty level (easy/medium/hard)
    - **steps**: List of preparation steps
    - **ingredients**: List of required ingredients with amounts
    """
    start_time = time.time()
    
    try:
        logger.info(f"Creating new recipe: {recipe_data.name} by user {current_user.id}")
        
        result = await recipe_service.create_recipe(recipe_data, current_user.id)
        
        # Log endpoint performance
        duration_ms = (time.time() - start_time) * 1000
        logger.info(f"POST /api/recipes/ completed in {duration_ms} ms")
        
        logger.info(f"Successfully created recipe with ID: {result.data.id}")
        return result
        
    except ValueError as e:
        duration_ms = (time.time() - start_time) * 1000
        logger.info(f"POST /api/recipes/ failed in {duration_ms} ms (400)")
        logger.error(f"Invalid recipe data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        logger.info(f"POST /api/recipes/ failed in {duration_ms} ms (500)")
        logger.error(f"Error creating recipe: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/{recipe_id}", response_model=RecipeDetailResponse)
async def get_recipe_details(
    recipe_id: UUID,
    recipe_service: RecipeService = Depends(get_recipe_service)
):
    """
    Get detailed information about a specific recipe.
    
    - **recipe_id**: UUID of the recipe
    """
    try:
        logger.info(f"Getting recipe details for ID: {recipe_id}")
        
        result = await recipe_service.get_recipe_by_id(recipe_id)
        
        if not result:
            logger.warning(f"Recipe not found: {recipe_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipe not found"
            )
        
        logger.info(f"Successfully retrieved recipe: {result.data.name}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving recipe {recipe_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.put("/{recipe_id}", response_model=RecipeDetailResponse)
async def update_recipe(
    recipe_id: UUID,
    recipe_data: UpdateRecipeRequest,
    recipe_service: RecipeService = Depends(get_recipe_service),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing recipe. Only the recipe author can update their recipe.
    
    - **recipe_id**: UUID of the recipe to update
    - All fields are optional for partial updates
    """
    start_time = time.time()
    
    try:
        logger.info(f"Updating recipe {recipe_id} by user {current_user.id}")
        
        result = await recipe_service.update_recipe(recipe_id, recipe_data, current_user.id)
        
        if not result:
            duration_ms = (time.time() - start_time) * 1000
            logger.info(f"PUT /api/recipes/{recipe_id} failed in {duration_ms} ms (404)")
            logger.warning(f"Recipe not found or access denied: {recipe_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipe not found or access denied"
            )
        
        duration_ms = (time.time() - start_time) * 1000
        logger.info(f"PUT /api/recipes/{recipe_id} completed in {duration_ms} ms")
        
        logger.info(f"Successfully updated recipe: {recipe_id}")
        return result
        
    except HTTPException:
        raise
    except ValueError as e:
        duration_ms = (time.time() - start_time) * 1000
        logger.info(f"PUT /api/recipes/{recipe_id} failed in {duration_ms} ms (400)")
        logger.error(f"Invalid update data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        logger.info(f"PUT /api/recipes/{recipe_id} failed in {duration_ms} ms (500)")
        logger.error(f"Error updating recipe {recipe_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(
    recipe_id: UUID,
    recipe_service: RecipeService = Depends(get_recipe_service),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a recipe. Only the recipe author can delete their recipe.
    
    - **recipe_id**: UUID of the recipe to delete
    """
    try:
        logger.info(f"Deleting recipe {recipe_id} by user {current_user.id}")
        
        success = await recipe_service.delete_recipe(recipe_id, current_user.id)
        
        if not success:
            logger.warning(f"Recipe not found or access denied: {recipe_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipe not found or access denied"
            )
        
        logger.info(f"Successfully deleted recipe: {recipe_id}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting recipe {recipe_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/{recipe_id}/rate", response_model=RatingUpdateResponse)
async def rate_recipe(
    recipe_id: UUID,
    rating_data: RateRecipeRequest,
    recipe_service: RecipeService = Depends(get_recipe_service),
    current_user: User = Depends(get_current_user)
):
    """
    Rate a recipe. Each user can only rate a recipe once.
    
    - **recipe_id**: UUID of the recipe to rate
    - **rating**: Rating value (1-5)
    """
    start_time = time.time()
    
    try:
        logger.info(f"Rating recipe {recipe_id} with {rating_data.rating} by user {current_user.id}")
        
        result = await recipe_service.rate_recipe(recipe_id, rating_data.rating, current_user.id)
        
        if not result:
            duration_ms = (time.time() - start_time) * 1000
            logger.info(f"POST /api/recipes/{recipe_id}/rate failed in {duration_ms} ms (404)")
            logger.warning(f"Recipe not found: {recipe_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipe not found"
            )
        
        duration_ms = (time.time() - start_time) * 1000
        logger.info(f"POST /api/recipes/{recipe_id}/rate completed in {duration_ms} ms")
        
        logger.info(f"Successfully rated recipe {recipe_id}")
        return result
        
    except HTTPException:
        raise
    except ValueError as e:
        duration_ms = (time.time() - start_time) * 1000
        logger.info(f"POST /api/recipes/{recipe_id}/rate failed in {duration_ms} ms (409)")
        logger.error(f"Rating conflict or invalid data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        logger.info(f"POST /api/recipes/{recipe_id}/rate failed in {duration_ms} ms (500)")
        logger.error(f"Error rating recipe {recipe_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        ) 
