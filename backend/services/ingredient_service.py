from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy import func, or_
from fastapi import HTTPException, status
from typing import Optional, List
import uuid
import logging
import math

from ..models.ingredient import Ingredient, UnitType
from ..models.responses import IngredientResponse, PaginatedIngredientsResponse, PaginationInfo
from ..models.requests import CreateIngredientRequest, IngredientQueryParams

logger = logging.getLogger(__name__)

class IngredientService:
    """Serwis do obsługi operacji na składnikach."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_ingredients(self, query_params: IngredientQueryParams) -> PaginatedIngredientsResponse:
        """
        Pobiera listę składników z obsługą paginacji, wyszukiwania i sortowania.
        
        Args:
            query_params: Parametry zapytania (page, limit, search, sortBy, sortOrder)
            
        Returns:
            PaginatedIngredientsResponse: Paginowana lista składników
            
        Raises:
            HTTPException: 500 w przypadku błędów bazy danych
        """
        try:
            # Bazowe zapytanie
            query = self.db.query(Ingredient)
            
            # Filtrowanie - wyszukiwanie po nazwie
            if query_params.search:
                search_term = f"%{query_params.search.strip()}%"
                query = query.filter(Ingredient.name.ilike(search_term))
            
            # Sortowanie
            sort_column = getattr(Ingredient, query_params.sortBy)
            if query_params.sortOrder == "desc":
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
            
            # Liczenie całkowitej liczby wyników
            total_items = query.count()
            
            # Paginacja
            offset = (query_params.page - 1) * query_params.limit
            ingredients = query.offset(offset).limit(query_params.limit).all()
            
            # Obliczanie liczby stron
            total_pages = math.ceil(total_items / query_params.limit) if total_items > 0 else 1
            
            # Konwersja na response models
            ingredient_responses = [
                IngredientResponse(
                    id=ingredient.id,
                    name=ingredient.name,
                    unit_type=ingredient.unit_type.value,
                    created_at=ingredient.created_at,
                    updated_at=ingredient.updated_at
                )
                for ingredient in ingredients
            ]
            
            pagination_info = PaginationInfo(
                page=query_params.page,
                limit=query_params.limit,
                total_items=total_items,
                total_pages=total_pages
            )
            
            logger.info(f"Retrieved {len(ingredients)} ingredients (page {query_params.page}, search: '{query_params.search}')")
            
            return PaginatedIngredientsResponse(
                data=ingredient_responses,
                pagination=pagination_info
            )
            
        except SQLAlchemyError as e:
            logger.error(f"Database error while retrieving ingredients: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
        except Exception as e:
            logger.error(f"Unexpected error while retrieving ingredients: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
    
    def create_ingredient(self, ingredient_data: CreateIngredientRequest, user_id: str) -> IngredientResponse:
        """
        Tworzy nowy składnik z sprawdzeniem unikalności nazwy.
        
        Args:
            ingredient_data: Dane nowego składnika
            user_id: UUID użytkownika tworzącego składnik (do logowania)
            
        Returns:
            IngredientResponse: Utworzony składnik
            
        Raises:
            HTTPException: 409 jeśli składnik o podanej nazwie już istnieje
            HTTPException: 500 w przypadku błędów bazy danych
        """
        try:
            # Sprawdzenie czy składnik o takiej nazwie już istnieje
            existing_ingredient = self.db.query(Ingredient).filter(
                func.lower(Ingredient.name) == func.lower(ingredient_data.name)
            ).first()
            
            if existing_ingredient:
                logger.warning(f"Attempt to create duplicate ingredient: '{ingredient_data.name}' by user {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Ingredient with this name already exists"
                )
            
            # Tworzenie nowego składnika
            new_ingredient = Ingredient(
                name=ingredient_data.name,
                unit_type=UnitType(ingredient_data.unit_type.value)
            )
            
            self.db.add(new_ingredient)
            self.db.commit()
            self.db.refresh(new_ingredient)
            
            logger.info(f"Ingredient created successfully: '{ingredient_data.name}' (ID: {new_ingredient.id}) by user {user_id}")
            
            # Konwersja na response model
            return IngredientResponse(
                id=new_ingredient.id,
                name=new_ingredient.name,
                unit_type=new_ingredient.unit_type.value,
                created_at=new_ingredient.created_at,
                updated_at=new_ingredient.updated_at
            )
            
        except HTTPException:
            # Re-raise HTTP exceptions (already handled)
            raise
        except IntegrityError as e:
            # Rollback transaction on integrity error
            self.db.rollback()
            logger.error(f"Integrity error while creating ingredient: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ingredient with this name already exists"
            )
        except SQLAlchemyError as e:
            # Rollback transaction on database error
            self.db.rollback()
            logger.error(f"Database error while creating ingredient: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
        except Exception as e:
            # Rollback transaction on unexpected error
            self.db.rollback()
            logger.error(f"Unexpected error while creating ingredient: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
    
    def get_ingredient_by_id(self, ingredient_id: str) -> IngredientResponse:
        """
        Pobiera składnik z bazy danych na podstawie ID.
        
        Args:
            ingredient_id: UUID składnika jako string
            
        Returns:
            IngredientResponse: Dane składnika
            
        Raises:
            HTTPException: 400 jeśli ingredient_id ma nieprawidłowy format UUID
            HTTPException: 404 jeśli składnik nie został znaleziony
            HTTPException: 500 w przypadku błędów bazy danych
        """
        try:
            # Walidacja formatu UUID
            try:
                uuid_obj = uuid.UUID(ingredient_id)
            except ValueError:
                logger.warning(f"Invalid UUID format provided: {ingredient_id}")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Invalid ingredient ID format"
                )
            
            # Zapytanie do bazy danych
            ingredient = self.db.query(Ingredient).filter(Ingredient.id == uuid_obj).first()
            
            if ingredient is None:
                logger.info(f"Ingredient not found: {ingredient_id}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Ingredient not found"
                )
            
            logger.info(f"Ingredient retrieved successfully: {ingredient_id}")
            
            # Konwersja na response model
            return IngredientResponse(
                id=ingredient.id,
                name=ingredient.name,
                unit_type=ingredient.unit_type.value,
                created_at=ingredient.created_at,
                updated_at=ingredient.updated_at
            )
            
        except HTTPException:
            # Re-raise HTTP exceptions (already handled)
            raise
        except SQLAlchemyError as e:
            logger.error(f"Database error while retrieving ingredient {ingredient_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
        except Exception as e:
            logger.error(f"Unexpected error while retrieving ingredient {ingredient_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )

# Factory function dla dependency injection
def get_ingredient_service(db: Session) -> IngredientService:
    """
    Factory function do tworzenia IngredientService z dependency injection.
    
    Args:
        db: Sesja SQLAlchemy
        
    Returns:
        IngredientService: Instancja serwisu
    """
    return IngredientService(db) 