from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Annotated

from ..database import get_db
from ..dependencies.auth import get_current_user_id
from ..services.user_service import get_user_service, UserService
from ..services.recipe_view_service import get_recipe_view_service, RecipeViewService
from ..models.responses import UserResponse, PaginatedRecipeViewHistory
from ..models.requests import RecipeViewHistoryQuery

router = APIRouter()

@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    description="Retrieves the profile of the currently authenticated user",
    responses={
        200: {
            "description": "User profile retrieved successfully",
            "model": UserResponse
        },
        401: {
            "description": "Authentication required",
            "content": {
                "application/json": {
                    "example": {"detail": "Authentication required"}
                }
            }
        },
        404: {
            "description": "User not found",
            "content": {
                "application/json": {
                    "example": {"detail": "User not found"}
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
async def get_current_user_profile(
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    db: Annotated[Session, Depends(get_db)]
) -> UserResponse:
    """
    Pobiera profil aktualnie uwierzytelnionego użytkownika.
    
    Ten endpoint wymaga uwierzytelnienia poprzez token JWT w nagłówku Authorization.
    Token musi zawierać prawidłowy user_id w payload.
    
    Args:
        current_user_id: ID użytkownika wyodrębnione z JWT token
        db: Sesja bazy danych (dependency injection)
        
    Returns:
        UserResponse: Profil użytkownika zawierający id, email, created_at, updated_at
        
    Raises:
        HTTPException 401: Brak lub nieprawidłowy token uwierzytelniający
        HTTPException 404: Użytkownik nie został znaleziony w bazie danych
        HTTPException 500: Błędy po stronie serwera
    """
    try:
        # Utwórz serwis użytkowników
        user_service = get_user_service(db)
        
        # Pobierz profil użytkownika przez serwis
        user_profile = user_service.get_current_user(current_user_id)
        return user_profile
        
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
    "/me/recipe-views",
    response_model=PaginatedRecipeViewHistory,
    status_code=status.HTTP_200_OK,
    summary="Get user's recipe view history",
    description="Retrieves the paginated recipe view history of the currently authenticated user",
    responses={
        200: {
            "description": "Recipe view history retrieved successfully",
            "model": PaginatedRecipeViewHistory
        },
        400: {
            "description": "Invalid pagination parameters",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid pagination parameters"}
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
async def get_user_recipe_view_history(
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(default=1, ge=1, description="Numer strony"),
    limit: int = Query(default=10, ge=1, le=100, description="Liczba elementów na stronę")
) -> PaginatedRecipeViewHistory:
    """
    Pobiera paginowaną historię przeglądania przepisów aktualnie uwierzytelnionego użytkownika.
    
    Ten endpoint wymaga uwierzytelnienia poprzez token JWT w nagłówku Authorization.
    Token musi zawierać prawidłowy user_id w payload. Endpoint obsługuje paginację i zwraca
    listę rekordów przeglądania przepisów z dołączonymi nazwami przepisów.
    
    Args:
        current_user_id: ID użytkownika wyodrębnione z JWT token
        db: Sesja bazy danych (dependency injection)
        page: Numer strony dla paginacji (domyślnie: 1, minimum: 1)
        limit: Liczba elementów na stronę (domyślnie: 10, minimum: 1, maksimum: 100)
        
    Returns:
        PaginatedRecipeViewHistory: Paginowana lista historii przeglądania przepisów
        
    Raises:
        HTTPException 400: Nieprawidłowe parametry paginacji
        HTTPException 401: Brak lub nieprawidłowy token uwierzytelniający  
        HTTPException 500: Błędy po stronie serwera
    """
    try:
        # Walidacja parametrów paginacji jest już wykonana przez Query validators
        
        # Utwórz serwis historii przeglądania przepisów
        recipe_view_service = get_recipe_view_service(db)
        
        # Pobierz historię przeglądania przepisów użytkownika
        recipe_view_history = recipe_view_service.get_user_recipe_views(
            user_id=current_user_id,
            page=page,
            limit=limit
        )
        
        return recipe_view_history
        
    except HTTPException:
        # Re-raise HTTP exceptions from service layer
        raise
    except Exception as e:
        # Catch any unexpected errors and return 500
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        ) 