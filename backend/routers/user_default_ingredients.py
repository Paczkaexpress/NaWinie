from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Annotated
from uuid import UUID

from ..database import get_db
from ..dependencies.auth import get_current_user_id
from ..services.user_default_ingredients_service import UserDefaultIngredientsService
from ..models.requests import AddUserDefaultIngredientCommand
from ..models.responses import (
    PaginatedUserDefaultIngredientsResponse,
    UserDefaultIngredientAddedDto
)
from ..utils.rate_limiter import rate_limit_dependency

router = APIRouter(prefix="/users/me/default-ingredients", tags=["user-default-ingredients"])

def get_user_default_ingredients_service(db: Session = Depends(get_db)) -> UserDefaultIngredientsService:
    """Factory function do tworzenia serwisu domyślnych składników."""
    return UserDefaultIngredientsService(db)

@router.get(
    "",
    response_model=PaginatedUserDefaultIngredientsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user's default ingredients",
    description="Retrieves the list of default ingredients for the authenticated user with pagination",
    responses={
        200: {
            "description": "Default ingredients retrieved successfully",
            "model": PaginatedUserDefaultIngredientsResponse
        },
        400: {
            "description": "Invalid pagination parameters",
            "content": {
                "application/json": {
                    "example": {"detail": "Numer strony musi być większy niż 0"}
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
async def get_user_default_ingredients(
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1, description="Numer strony"),
    limit: int = Query(50, ge=1, le=100, description="Liczba elementów na stronę"),
    service: UserDefaultIngredientsService = Depends(get_user_default_ingredients_service),
    _rate_limit: None = Depends(rate_limit_dependency("user_defaults_get"))
) -> PaginatedUserDefaultIngredientsResponse:
    """
    Pobiera listę domyślnych składników użytkownika z paginacją.
    
    Ten endpoint wymaga uwierzytelnienia poprzez token JWT w nagłówku Authorization.
    Zwraca paginowaną listę składników które użytkownik oznaczył jako domyślne.
    
    Args:
        current_user_id: ID użytkownika wyodrębnione z JWT token
        db: Sesja bazy danych (dependency injection)
        page: Numer strony (domyślnie 1, minimum 1)
        limit: Liczba elementów na stronę (domyślnie 50, minimum 1, maksimum 100)
        service: Serwis domyślnych składników (dependency injection)
        
    Returns:
        PaginatedUserDefaultIngredientsResponse: Paginowana lista domyślnych składników
        
    Raises:
        HTTPException 400: Nieprawidłowe parametry paginacji
        HTTPException 401: Brak lub nieprawidłowy token uwierzytelniający
        HTTPException 500: Błędy po stronie serwera
    """
    try:
        # Konwertuj user_id z string na UUID
        user_uuid = UUID(current_user_id)
        
        # Pobierz domyślne składniki przez serwis
        result = service.get_user_defaults(user_uuid, page, limit)
        return result
        
    except ValueError:
        # Nieprawidłowy format UUID
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nieprawidłowy format ID użytkownika"
        )
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
    "",
    response_model=UserDefaultIngredientAddedDto,
    status_code=status.HTTP_201_CREATED,
    summary="Add ingredient to user's defaults",
    description="Adds an ingredient to the authenticated user's list of default ingredients",
    responses={
        201: {
            "description": "Ingredient added to defaults successfully",
            "model": UserDefaultIngredientAddedDto
        },
        400: {
            "description": "Invalid request data or maximum limit reached",
            "content": {
                "application/json": {
                    "example": {"detail": "Przekroczono maksymalną liczbę domyślnych składników (100)"}
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
        404: {
            "description": "Ingredient not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Składnik o ID xxx nie istnieje"}
                }
            }
        },
        409: {
            "description": "Ingredient already in defaults",
            "content": {
                "application/json": {
                    "example": {"detail": "Składnik 'Sól' już jest w domyślnych"}
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
async def add_user_default_ingredient(
    command: AddUserDefaultIngredientCommand,
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    db: Annotated[Session, Depends(get_db)],
    service: UserDefaultIngredientsService = Depends(get_user_default_ingredients_service),
    _rate_limit: None = Depends(rate_limit_dependency("user_defaults_post"))
) -> UserDefaultIngredientAddedDto:
    """
    Dodaje składnik do listy domyślnych składników użytkownika.
    
    Ten endpoint wymaga uwierzytelnienia poprzez token JWT w nagłówku Authorization.
    Sprawdza czy składnik istnieje, czy nie jest już w domyślnych i czy nie przekroczono limitu.
    
    Args:
        command: Dane składnika do dodania (ingredient_id)
        current_user_id: ID użytkownika wyodrębnione z JWT token
        db: Sesja bazy danych (dependency injection)
        service: Serwis domyślnych składników (dependency injection)
        
    Returns:
        UserDefaultIngredientAddedDto: Potwierdzenie dodania składnika
        
    Raises:
        HTTPException 400: Nieprawidłowe dane lub przekroczony limit
        HTTPException 401: Brak lub nieprawidłowy token uwierzytelniający
        HTTPException 404: Składnik nie istnieje
        HTTPException 409: Składnik już jest w domyślnych
        HTTPException 500: Błędy po stronie serwera
    """
    try:
        # Konwertuj user_id z string na UUID
        user_uuid = UUID(current_user_id)
        
        # Dodaj składnik do domyślnych przez serwis
        result = service.add_default(user_uuid, command)
        return result
        
    except ValueError:
        # Nieprawidłowy format UUID
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nieprawidłowy format ID użytkownika"
        )
    except HTTPException:
        # Re-raise HTTP exceptions from service layer
        raise
    except Exception as e:
        # Catch any unexpected errors and return 500
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.delete(
    "/{ingredient_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove ingredient from user's defaults",
    description="Removes an ingredient from the authenticated user's list of default ingredients",
    responses={
        204: {
            "description": "Ingredient removed from defaults successfully"
        },
        400: {
            "description": "Invalid ingredient ID format",
            "content": {
                "application/json": {
                    "example": {"detail": "Nieprawidłowy format ID składnika"}
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
        404: {
            "description": "Ingredient not in user's defaults",
            "content": {
                "application/json": {
                    "example": {"detail": "Składnik nie jest w domyślnych użytkownika"}
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
async def remove_user_default_ingredient(
    ingredient_id: UUID,
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    db: Annotated[Session, Depends(get_db)],
    service: UserDefaultIngredientsService = Depends(get_user_default_ingredients_service),
    _rate_limit: None = Depends(rate_limit_dependency("user_defaults_delete"))
):
    """
    Usuwa składnik z listy domyślnych składników użytkownika.
    
    Ten endpoint wymaga uwierzytelnienia poprzez token JWT w nagłówku Authorization.
    Sprawdza czy relacja user-ingredient istnieje przed usunięciem.
    
    Args:
        ingredient_id: ID składnika do usunięcia z domyślnych
        current_user_id: ID użytkownika wyodrębnione z JWT token
        db: Sesja bazy danych (dependency injection)
        service: Serwis domyślnych składników (dependency injection)
        
    Returns:
        None: Status 204 No Content
        
    Raises:
        HTTPException 400: Nieprawidłowy format ID składnika lub użytkownika
        HTTPException 401: Brak lub nieprawidłowy token uwierzytelniający
        HTTPException 404: Składnik nie jest w domyślnych użytkownika
        HTTPException 500: Błędy po stronie serwera
    """
    try:
        # Konwertuj user_id z string na UUID
        user_uuid = UUID(current_user_id)
        
        # Usuń składnik z domyślnych przez serwis
        service.remove_default(user_uuid, ingredient_id)
        
        # Zwróć 204 No Content (FastAPI automatycznie obsługuje None return)
        return None
        
    except ValueError:
        # Nieprawidłowy format UUID
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nieprawidłowy format ID użytkownika"
        )
    except HTTPException:
        # Re-raise HTTP exceptions from service layer
        raise
    except Exception as e:
        # Catch any unexpected errors and return 500
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        ) 