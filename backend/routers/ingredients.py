from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import Annotated, Optional
from uuid import UUID

from ..database import get_db
from ..dependencies.auth import get_current_user_id
from ..services.ingredient_service import get_ingredient_service, IngredientService
from ..models.requests import CreateIngredientRequest, IngredientQueryParams
from ..models.responses import IngredientResponse, PaginatedIngredientsResponse
from ..utils.rate_limiter import rate_limit_dependency
from ..utils.cache import CacheManager

router = APIRouter()

@router.get(
    "/",
    response_model=PaginatedIngredientsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get ingredients list",
    description="Retrieves a paginated list of ingredients with optional search and sorting",
    responses={
        200: {
            "description": "Ingredients retrieved successfully",
            "model": PaginatedIngredientsResponse
        },
        400: {
            "description": "Invalid query parameters",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid query parameters"}
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Internal server error"}
                }
            }
        }
    }
)
async def get_ingredients(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    limit: Annotated[int, Query(ge=1, le=100, description="Items per page")] = 20,
    search: Annotated[Optional[str], Query(max_length=100, description="Search by name")] = None,
    sortBy: Annotated[str, Query(pattern="^(name|unit_type|created_at)$", description="Sort field")] = "name",
    sortOrder: Annotated[str, Query(pattern="^(asc|desc)$", description="Sort direction")] = "asc",
    _rate_limit: None = Depends(rate_limit_dependency("ingredients_get"))
) -> PaginatedIngredientsResponse:
    """
    Pobiera listę składników z obsługą paginacji, wyszukiwania i sortowania.
    
    Endpoint publiczny - nie wymaga uwierzytelnienia.
    
    Args:
        page: Numer strony (domyślnie 1)
        limit: Liczba elementów na stronę (1-100, domyślnie 20)
        search: Wyszukiwanie po nazwie składnika (opcjonalne)
        sortBy: Pole sortowania: name, unit_type, created_at (domyślnie name)
        sortOrder: Kierunek sortowania: asc, desc (domyślnie asc)
        db: Sesja bazy danych (dependency injection)
        
    Returns:
        PaginatedIngredientsResponse: Lista składników z informacjami o paginacji
        
    Raises:
        HTTPException 400: Nieprawidłowe parametry zapytania
        HTTPException 500: Błędy po stronie serwera
    """
    try:
        # Tworzenie parametrów zapytania
        query_params = IngredientQueryParams(
            page=page,
            limit=limit,
            search=search,
            sortBy=sortBy,
            sortOrder=sortOrder
        )
        
        # Sprawdź cache
        query_dict = query_params.model_dump()
        cached_result = CacheManager.get_cached_ingredients(query_dict)
        if cached_result:
            return PaginatedIngredientsResponse(**cached_result)
        
        # Utwórz serwis składników
        ingredient_service = get_ingredient_service(db)
        
        # Pobierz składniki przez serwis
        ingredients = ingredient_service.get_ingredients(query_params)
        
        # Cache wynik
        CacheManager.cache_ingredients(query_dict, ingredients.model_dump())
        
        return ingredients
        
    except HTTPException:
        # Re-raise HTTP exceptions from service layer
        raise
    except Exception as e:
        # Catch any unexpected errors and return 500
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post(
    "/",
    response_model=IngredientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new ingredient",
    description="Creates a new ingredient (requires authentication)",
    responses={
        201: {
            "description": "Ingredient created successfully",
            "model": IngredientResponse
        },
        400: {
            "description": "Invalid request data",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid request data"}
                }
            }
        },
        401: {
            "description": "Authentication required",
            "content": {
                "application/json": {
                    "example": {"detail": "Authentication required"}
                }
            }
        },
        409: {
            "description": "Ingredient with this name already exists",
            "content": {
                "application/json": {
                    "example": {"detail": "Ingredient with this name already exists"}
                }
            }
        },
        422: {
            "description": "Validation error",
            "content": {
                "application/json": {
                    "example": {"detail": "Validation error"}
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Internal server error"}
                }
            }
        }
    }
)
async def create_ingredient(
    ingredient_data: CreateIngredientRequest,
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    db: Annotated[Session, Depends(get_db)],
    _rate_limit: None = Depends(rate_limit_dependency("ingredients_post"))
) -> IngredientResponse:
    """
    Tworzy nowy składnik w systemie.
    
    Endpoint wymaga uwierzytelnienia poprzez token JWT w nagłówku Authorization.
    
    Args:
        ingredient_data: Dane nowego składnika (name, unit_type)
        current_user_id: ID użytkownika wyodrębnione z JWT token
        db: Sesja bazy danych (dependency injection)
        
    Returns:
        IngredientResponse: Utworzony składnik z jego danymi
        
    Raises:
        HTTPException 400: Nieprawidłowe dane żądania
        HTTPException 401: Brak lub nieprawidłowy token uwierzytelniający
        HTTPException 409: Składnik o podanej nazwie już istnieje
        HTTPException 422: Błędy walidacji danych
        HTTPException 500: Błędy po stronie serwera
    """
    try:
        # Utwórz serwis składników
        ingredient_service = get_ingredient_service(db)
        
        # Utwórz składnik przez serwis
        new_ingredient = ingredient_service.create_ingredient(ingredient_data, current_user_id)
        
        # Invaliduj cache po utworzeniu
        CacheManager.invalidate_ingredient_caches()
        
        return new_ingredient
        
    except HTTPException:
        # Re-raise HTTP exceptions from service layer
        raise
    except Exception as e:
        # Catch any unexpected errors and return 500
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get(
    "/{ingredient_id}",
    response_model=IngredientResponse,
    status_code=status.HTTP_200_OK,
    summary="Get ingredient by ID",
    description="Retrieves a specific ingredient by its ID",
    responses={
        200: {
            "description": "Ingredient retrieved successfully",
            "model": IngredientResponse
        },
        404: {
            "description": "Ingredient not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Ingredient not found"}
                }
            }
        },
        422: {
            "description": "Invalid ingredient ID format",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid ingredient ID format"}
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Internal server error"}
                }
            }
        }
    }
)
async def get_ingredient_by_id(
    ingredient_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    _rate_limit: None = Depends(rate_limit_dependency("ingredients_get_by_id"))
) -> IngredientResponse:
    """
    Pobiera szczegóły konkretnego składnika na podstawie ID.
    
    Endpoint publiczny - nie wymaga uwierzytelnienia.
    
    Args:
        ingredient_id: UUID składnika w ścieżce URL
        db: Sesja bazy danych (dependency injection)
        
    Returns:
        IngredientResponse: Dane składnika
        
    Raises:
        HTTPException 404: Składnik nie został znaleziony
        HTTPException 422: Nieprawidłowy format UUID
        HTTPException 500: Błędy po stronie serwera
    """
    try:
        # Sprawdź cache
        ingredient_id_str = str(ingredient_id)
        cached_result = CacheManager.get_cached_ingredient(ingredient_id_str)
        if cached_result:
            return IngredientResponse(**cached_result)
        
        # Utwórz serwis składników
        ingredient_service = get_ingredient_service(db)
        
        # Pobierz składnik przez serwis
        ingredient = ingredient_service.get_ingredient_by_id(ingredient_id_str)
        
        # Cache wynik
        CacheManager.cache_ingredient(ingredient_id_str, ingredient.model_dump())
        
        return ingredient
        
    except HTTPException:
        # Re-raise HTTP exceptions from service layer
        raise
    except Exception as e:
        # Catch any unexpected errors and return 500
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        ) 