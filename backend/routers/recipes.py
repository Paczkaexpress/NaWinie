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
from ..utils.rate_limiter import rate_limit_dependency

logger = get_logger(__name__)

router = APIRouter()

def get_recipe_service(db: Session = Depends(get_db)) -> RecipeService:
    """Dependency to get recipe service instance"""
    return RecipeService(db)

@router.get(
    "/recipes",
    response_model=RecipeListResponse,
    summary="Get recipes list with filtering and pagination",
    description="""
    ## Get Recipes List
    
    Retrieve a paginated list of recipes with optional filtering and sorting capabilities.
    
    ### Features:
    - **Pagination**: Control page and limit (max 100 per page)
    - **Filtering**: Filter by complexity level and author
    - **Sorting**: Sort by name, rating, prep time, or creation date
    - **Performance**: Optimized queries with proper indexing
    
    ### Query Parameters:
    - `page`: Page number (default: 1, min: 1)
    - `limit`: Items per page (default: 10, min: 1, max: 100)
    - `complexity`: Filter by difficulty (EASY, MEDIUM, HARD)
    - `authorId`: Filter by recipe author UUID
    - `sortBy`: Sort field (name, rating, prep_time, created_at)
    - `sortOrder`: Sort direction (asc, desc)
    
    ### Example Response:
    ```json
    {
        "data": [
            {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "name": "Spaghetti Carbonara",
                "preparation_time_minutes": 30,
                "complexity_level": "MEDIUM",
                "author_id": "123e4567-e89b-12d3-a456-426614174001",
                "average_rating": 4.5,
                "total_votes": 12,
                "created_at": "2024-01-01T12:00:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 10,
            "total": 1,
            "pages": 1
        }
    }
    ```
    """,
    responses={
        200: {
            "description": "Successfully retrieved recipes list",
            "content": {
                "application/json": {
                    "example": {
                        "data": [
                            {
                                "id": "123e4567-e89b-12d3-a456-426614174000",
                                "name": "Spaghetti Carbonara", 
                                "preparation_time_minutes": 30,
                                "complexity_level": "MEDIUM",
                                "author_id": "123e4567-e89b-12d3-a456-426614174001",
                                "average_rating": 4.5,
                                "total_votes": 12,
                                "created_at": "2024-01-01T12:00:00Z"
                            }
                        ],
                        "pagination": {
                            "page": 1,
                            "limit": 10, 
                            "total": 1,
                            "pages": 1
                        }
                    }
                }
            }
        },
        400: {
            "description": "Invalid query parameters",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid page number: must be >= 1"}
                }
            }
        },
        422: {
            "description": "Validation error in query parameters",
            "content": {
                "application/json": {
                    "example": {
                        "detail": [
                            {
                                "loc": ["query", "limit"],
                                "msg": "ensure this value is less than or equal to 100",
                                "type": "value_error.number.not_le"
                            }
                        ]
                    }
                }
            }
        },
        500: {"description": "Internal server error"}
    }
)
async def get_recipes(
    page: int = Query(1, ge=1, description="Page number (starting from 1)"),
    limit: int = Query(10, ge=1, le=100, description="Number of items per page (max 100)"),
    complexity: Optional[str] = Query(None, description="Filter by complexity: EASY, MEDIUM, HARD"),
    authorId: Optional[UUID] = Query(None, description="Filter by author UUID"),
    sortBy: Optional[str] = Query("created_at", description="Sort field: name, rating, prep_time, created_at"),
    sortOrder: Optional[str] = Query("desc", description="Sort order: asc, desc"),
    db: Session = Depends(get_db)
):
    """Get paginated list of recipes with optional filtering and sorting"""
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
        
        recipe_service = RecipeService(db)
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

@router.get(
    "/recipes/find-by-ingredients",
    response_model=RecipeListResponse,
    summary="Find recipes by ingredients",
    description="""
    ## Find Recipes by Ingredients
    
    Search for recipes that contain specified ingredients with intelligent relevance scoring.
    
    ### Features:
    - **Relevance Scoring**: Recipes with more matching ingredients ranked higher
    - **Flexible Search**: Find recipes with any combination of ingredients
    - **Performance**: Optimized database queries with proper indexing
    - **Optional Authentication**: Authenticated users get personalized results
    
    ### Algorithm:
    1. Find all recipes containing any of the specified ingredients
    2. Calculate relevance score based on number of matching ingredients  
    3. Sort by relevance score (highest first)
    4. Apply pagination to results
    
    ### Query Parameters:
    - `ingredientIds`: Comma-separated list of ingredient UUIDs (required)
    
    ### Example Usage:
    ```
    GET /api/recipes/find-by-ingredients?ingredientIds=uuid1,uuid2,uuid3
    ```
    
    ### Example Response:
    ```json
    {
        "data": [
            {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "name": "Spaghetti Carbonara",
                "preparation_time_minutes": 30,
                "complexity_level": "MEDIUM", 
                "author_id": "123e4567-e89b-12d3-a456-426614174001",
                "average_rating": 4.5,
                "total_votes": 12,
                "created_at": "2024-01-01T12:00:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 50,
            "total": 1,
            "pages": 1
        }
    }
    ```
    """,
    responses={
        200: {
            "description": "Successfully found recipes matching ingredients",
            "content": {
                "application/json": {
                    "example": {
                        "data": [
                            {
                                "id": "123e4567-e89b-12d3-a456-426614174000",
                                "name": "Spaghetti Carbonara",
                                "preparation_time_minutes": 30,
                                "complexity_level": "MEDIUM",
                                "author_id": "123e4567-e89b-12d3-a456-426614174001", 
                                "average_rating": 4.5,
                                "total_votes": 12,
                                "created_at": "2024-01-01T12:00:00Z"
                            }
                        ],
                        "pagination": {
                            "page": 1,
                            "limit": 50,
                            "total": 1, 
                            "pages": 1
                        }
                    }
                }
            }
        },
        400: {
            "description": "Invalid ingredient IDs format",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid UUID format in ingredientIds"}
                }
            }
        },
        404: {
            "description": "One or more ingredient IDs not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid ingredient IDs: ['123e4567-e89b-12d3-a456-426614174999']"}
                }
            }
        },
        500: {"description": "Internal server error"}
    }
)
async def find_recipes_by_ingredients(
    ingredientIds: str = Query(..., description="Comma-separated list of ingredient UUIDs"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Find recipes that contain specified ingredients"""
    try:
        logger.info(f"Finding recipes by ingredients: {ingredientIds}")
        
        query_params = FindByIngredientsQuery(ingredientIds=ingredientIds)
        user_id = current_user.id if current_user else None
        
        recipe_service = RecipeService(db)
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

@router.post(
    "/recipes",
    response_model=RecipeDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new recipe",
    description="""
    ## Create New Recipe
    
    Create a new recipe with ingredients, steps, and metadata. Requires authentication.
    
    ### Features:
    - **Authentication Required**: Must provide valid JWT token
    - **Ingredient Validation**: Validates all ingredient IDs exist in database
    - **Atomic Operation**: Recipe creation is transactional (all or nothing)
    - **Rich Metadata**: Supports complexity levels, preparation time, detailed steps
    
    ### Request Body:
    - `name`: Recipe name (1-255 characters, required)
    - `preparation_time_minutes`: Prep time in minutes (positive integer, required)
    - `complexity_level`: Difficulty level (EASY/MEDIUM/HARD, required)
    - `steps`: List of preparation steps with order and description (required)
    - `ingredients`: List of ingredients with amounts and optional flags (required)
    
    ### Example Request:
    ```json
    {
        "name": "Classic Spaghetti Carbonara",
        "preparation_time_minutes": 30,
        "complexity_level": "MEDIUM",
        "steps": [
            {"step": 1, "description": "Boil water for pasta"},
            {"step": 2, "description": "Cook spaghetti al dente"},
            {"step": 3, "description": "Mix eggs with cheese"}
        ],
        "ingredients": [
            {
                "ingredient_id": "123e4567-e89b-12d3-a456-426614174000",
                "amount": 400.0,
                "is_optional": False,
                "substitute_recommendation": None
            }
        ]
    }
    ```
    """,
    responses={
        201: {
            "description": "Recipe created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "data": {
                            "id": "123e4567-e89b-12d3-a456-426614174000",
                            "name": "Classic Spaghetti Carbonara",
                            "preparation_time_minutes": 30,
                            "complexity_level": "MEDIUM",
                            "steps": [
                                {"step": 1, "description": "Boil water for pasta"}
                            ],
                            "author_id": "123e4567-e89b-12d3-a456-426614174001",
                            "average_rating": 0.0,
                            "total_votes": 0,
                            "created_at": "2024-01-01T12:00:00Z",
                            "updated_at": "2024-01-01T12:00:00Z",
                            "ingredients": [
                                {
                                    "id": "123e4567-e89b-12d3-a456-426614174000",
                                    "name": "Spaghetti",
                                    "amount": 400.0,
                                    "unit": "grams",
                                    "is_optional": False,
                                    "substitute_recommendation": None
                                }
                            ]
                        }
                    }
                }
            }
        },
        400: {
            "description": "Invalid ingredient IDs or validation error",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid ingredient IDs: ['123e4567-e89b-12d3-a456-426614174999']"}
                }
            }
        },
        401: {
            "description": "Authentication required",
            "content": {
                "application/json": {
                    "example": {"detail": "Not authenticated"}
                }
            }
        },
        422: {
            "description": "Validation error in request body",
            "content": {
                "application/json": {
                    "example": {
                        "detail": [
                            {
                                "loc": ["body", "name"],
                                "msg": "field required",
                                "type": "value_error.missing"
                            }
                        ]
                    }
                }
            }
        },
        500: {"description": "Internal server error"}
    }
)
async def create_recipe(
    recipe_data: CreateRecipeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new recipe with authentication and validation"""
    start_time = time.time()
    
    try:
        logger.info(f"Creating new recipe: {recipe_data.name} by user {current_user.id}")
        
        recipe_service = RecipeService(db)
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

@router.get(
    "/recipes/{recipe_id}",
    response_model=RecipeDetailResponse,
    summary="Get recipe details by ID",
    description="""
    ## Get Recipe Details
    
    Retrieve detailed information about a specific recipe including ingredients, steps, and ratings.
    
    ### Features:
    - **Complete Recipe Data**: Full recipe details with ingredients and preparation steps
    - **Rating Information**: Current average rating and total votes
    - **Ingredient Details**: Ingredient names, amounts, units, and optional flags
    - **Performance Optimized**: Single query with proper joins
    
    ### Path Parameters:
    - `recipe_id`: Recipe UUID (required)
    
    ### Example Response:
    ```json
    {
        "data": {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "name": "Classic Spaghetti Carbonara",
            "preparation_time_minutes": 30,
            "complexity_level": "MEDIUM",
            "steps": [
                {"step": 1, "description": "Boil water for pasta"},
                {"step": 2, "description": "Cook spaghetti al dente"}
            ],
            "author_id": "123e4567-e89b-12d3-a456-426614174001",
            "average_rating": 4.5,
            "total_votes": 12,
            "created_at": "2024-01-01T12:00:00Z",
            "updated_at": "2024-01-01T12:00:00Z",
            "ingredients": [
                {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "name": "Spaghetti",
                    "amount": 400.0,
                    "unit": "grams",
                    "is_optional": False,
                    "substitute_recommendation": None
                }
            ]
        }
    }
    ```
    """,
    responses={
        200: {
            "description": "Recipe details retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "data": {
                            "id": "123e4567-e89b-12d3-a456-426614174000",
                            "name": "Classic Spaghetti Carbonara",
                            "preparation_time_minutes": 30,
                            "complexity_level": "MEDIUM",
                            "steps": [{"step": 1, "description": "Boil water for pasta"}],
                            "author_id": "123e4567-e89b-12d3-a456-426614174001",
                            "average_rating": 4.5,
                            "total_votes": 12,
                            "created_at": "2024-01-01T12:00:00Z",
                            "updated_at": "2024-01-01T12:00:00Z",
                            "ingredients": [
                                {
                                    "id": "123e4567-e89b-12d3-a456-426614174000",
                                    "name": "Spaghetti",
                                    "amount": 400.0,
                                    "unit": "grams", 
                                    "is_optional": False,
                                    "substitute_recommendation": None
                                }
                            ]
                        }
                    }
                }
            }
        },
        404: {
            "description": "Recipe not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Recipe not found"}
                }
            }
        },
        422: {
            "description": "Invalid UUID format",
            "content": {
                "application/json": {
                    "example": {
                        "detail": [
                            {
                                "loc": ["path", "recipe_id"],
                                "msg": "invalid UUID format",
                                "type": "type_error.uuid"
                            }
                        ]
                    }
                }
            }
        },
        500: {"description": "Internal server error"}
    }
)
async def get_recipe_by_id(
    recipe_id: UUID,
    db: Session = Depends(get_db),
    _rate_limit: None = Depends(rate_limit_dependency("recipe_get"))
):
    """Get detailed information about a specific recipe"""
    try:
        logger.info(f"Getting recipe details for ID: {recipe_id}")
        
        recipe_service = RecipeService(db)
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

@router.put(
    "/recipes/{recipe_id}",
    response_model=RecipeDetailResponse,
    summary="Update an existing recipe",
    description="""
    ## Update Recipe
    
    Update an existing recipe with new data. Only the recipe author can update their recipes.
    
    ### Features:
    - **Ownership Validation**: Only recipe author can update
    - **Partial Updates**: All fields are optional, only provided fields are updated
    - **Ingredient Validation**: New ingredient IDs are validated if provided
    - **Atomic Operation**: Recipe update is transactional
    
    ### Path Parameters:
    - `recipe_id`: Recipe UUID to update (required)
    
    ### Request Body (all fields optional):
    - `name`: New recipe name (1-255 characters)
    - `preparation_time_minutes`: New prep time (positive integer)
    - `complexity_level`: New difficulty level (EASY/MEDIUM/HARD)
    - `steps`: New preparation steps list
    - `ingredients`: New ingredients list with amounts
    
    ### Example Request:
    ```json
    {
        "name": "Updated Classic Spaghetti Carbonara",
        "preparation_time_minutes": 25,
        "complexity_level": "EASY"
    }
    ```
    """,
    responses={
        200: {
            "description": "Recipe updated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "data": {
                            "id": "123e4567-e89b-12d3-a456-426614174000",
                            "name": "Updated Classic Spaghetti Carbonara",
                            "preparation_time_minutes": 25,
                            "complexity_level": "EASY",
                            "steps": [{"step": 1, "description": "Boil water for pasta"}],
                            "author_id": "123e4567-e89b-12d3-a456-426614174001",
                            "average_rating": 4.5,
                            "total_votes": 12,
                            "created_at": "2024-01-01T12:00:00Z",
                            "updated_at": "2024-01-01T13:00:00Z",
                            "ingredients": []
                        }
                    }
                }
            }
        },
        400: {
            "description": "Invalid ingredient IDs or validation error",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid ingredient IDs: ['123e4567-e89b-12d3-a456-426614174999']"}
                }
            }
        },
        401: {
            "description": "Authentication required",
            "content": {
                "application/json": {
                    "example": {"detail": "Not authenticated"}
                }
            }
        },
        404: {
            "description": "Recipe not found or access denied",
            "content": {
                "application/json": {
                    "example": {"detail": "Recipe not found or access denied"}
                }
            }
        },
        422: {
            "description": "Validation error",
            "content": {
                "application/json": {
                    "example": {
                        "detail": [
                            {
                                "loc": ["body", "preparation_time_minutes"],
                                "msg": "ensure this value is greater than 0",
                                "type": "value_error.number.not_gt"
                            }
                        ]
                    }
                }
            }
        },
        500: {"description": "Internal server error"}
    }
)
async def update_recipe(
    recipe_id: UUID,
    recipe_data: UpdateRecipeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing recipe (only by owner)"""
    start_time = time.time()
    
    try:
        logger.info(f"Updating recipe {recipe_id} by user {current_user.id}")
        
        recipe_service = RecipeService(db)
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

@router.delete(
    "/recipes/{recipe_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a recipe",
    description="""
    ## Delete Recipe
    
    Delete an existing recipe. Only the recipe author can delete their recipes.
    
    ### Features:
    - **Ownership Validation**: Only recipe author can delete
    - **Cascade Deletion**: Removes all associated data (ratings, ingredients)
    - **Atomic Operation**: Deletion is transactional
    - **No Content Response**: Returns 204 status on success
    
    ### Path Parameters:
    - `recipe_id`: Recipe UUID to delete (required)
    
    ### Security:
    - Requires valid JWT authentication
    - Only recipe author can perform deletion
    - Soft delete approach (recipe marked as deleted, not physically removed)
    """,
    responses={
        204: {
            "description": "Recipe deleted successfully (no content returned)"
        },
        401: {
            "description": "Authentication required",
            "content": {
                "application/json": {
                    "example": {"detail": "Not authenticated"}
                }
            }
        },
        404: {
            "description": "Recipe not found or access denied",
            "content": {
                "application/json": {
                    "example": {"detail": "Recipe not found or access denied"}
                }
            }
        },
        422: {
            "description": "Invalid UUID format",
            "content": {
                "application/json": {
                    "example": {
                        "detail": [
                            {
                                "loc": ["path", "recipe_id"],
                                "msg": "invalid UUID format",
                                "type": "type_error.uuid"
                            }
                        ]
                    }
                }
            }
        },
        500: {"description": "Internal server error"}
    }
)
async def delete_recipe(
    recipe_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a recipe (only by owner)"""
    try:
        logger.info(f"Deleting recipe {recipe_id} by user {current_user.id}")
        
        recipe_service = RecipeService(db)
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

@router.post(
    "/recipes/{recipe_id}/rate",
    response_model=RatingUpdateResponse,
    summary="Rate a recipe",
    description="""
    ## Rate Recipe
    
    Submit a rating for a recipe. Each user can only rate a recipe once.
    
    ### Features:
    - **Rating Scale**: 1-5 stars (integer values only)
    - **One Rating Per User**: Users can only rate each recipe once
    - **Average Calculation**: Automatically updates recipe's average rating
    - **Vote Tracking**: Maintains total vote count
    
    ### Path Parameters:
    - `recipe_id`: Recipe UUID to rate (required)
    
    ### Request Body:
    - `rating`: Integer rating from 1 to 5 (required)
    
    ### Example Request:
    ```json
    {
        "rating": 5
    }
    ```
    
    ### Response:
    Returns updated rating statistics for the recipe.
    
    ### Business Rules:
    - Users cannot rate their own recipes
    - One rating per user per recipe (no updates allowed)
    - Rating must be integer between 1 and 5 inclusive
    - Average rating calculated with precision to 1 decimal place
    """,
    responses={
        200: {
            "description": "Recipe rated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "average_rating": 4.3,
                        "total_votes": 13
                    }
                }
            }
        },
        400: {
            "description": "Invalid rating value",
            "content": {
                "application/json": {
                    "example": {"detail": "Rating must be between 1 and 5"}
                }
            }
        },
        401: {
            "description": "Authentication required",
            "content": {
                "application/json": {
                    "example": {"detail": "Not authenticated"}
                }
            }
        },
        404: {
            "description": "Recipe not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Recipe not found"}
                }
            }
        },
        409: {
            "description": "User has already rated this recipe",
            "content": {
                "application/json": {
                    "example": {"detail": "User has already rated this recipe"}
                }
            }
        },
        422: {
            "description": "Validation error",
            "content": {
                "application/json": {
                    "example": {
                        "detail": [
                            {
                                "loc": ["body", "rating"],
                                "msg": "ensure this value is less than or equal to 5",
                                "type": "value_error.number.not_le"
                            }
                        ]
                    }
                }
            }
        },
        500: {"description": "Internal server error"}
    }
)
async def rate_recipe(
    recipe_id: UUID,
    rating_data: RateRecipeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rate a recipe (one rating per user per recipe)"""
    start_time = time.time()
    
    try:
        logger.info(f"Rating recipe {recipe_id} with {rating_data.rating} by user {current_user.id}")
        
        recipe_service = RecipeService(db)
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
