from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from fastapi import HTTPException, status

from ..models.user_default_ingredient import UserDefaultIngredient
from ..models.ingredient import Ingredient
from ..models.user import User
from ..models.requests import AddUserDefaultIngredientCommand
from ..models.responses import (
    UserDefaultIngredientDto, 
    UserDefaultIngredientAddedDto,
    PaginatedUserDefaultIngredientsResponse,
    PaginationInfo
)

class UserDefaultIngredientsService:
    """Serwis do zarządzania domyślnymi składnikami użytkowników."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_defaults(
        self, 
        user_id: UUID, 
        page: int = 1, 
        limit: int = 50
    ) -> PaginatedUserDefaultIngredientsResponse:
        """
        Pobiera listę domyślnych składników użytkownika z paginacją.
        
        Args:
            user_id: ID użytkownika
            page: Numer strony (domyślnie 1)
            limit: Liczba elementów na stronę (domyślnie 50, max 100)
            
        Returns:
            PaginatedUserDefaultIngredientsResponse: Paginowana lista składników
            
        Raises:
            HTTPException: 400 jeśli parametry paginacji są nieprawidłowe
        """
        # Walidacja parametrów paginacji
        if page < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Numer strony musi być większy niż 0"
            )
        
        if limit < 1 or limit > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit musi być między 1 a 100"
            )
        
        # Oblicz offset
        offset = (page - 1) * limit
        
        # Zapytanie z JOIN do ingredients
        query = (
            self.db.query(UserDefaultIngredient, Ingredient)
            .join(Ingredient, UserDefaultIngredient.ingredient_id == Ingredient.id)
            .filter(UserDefaultIngredient.user_id == user_id)
            .order_by(Ingredient.name)
        )
        
        # Policz całkowitą liczbę elementów
        total_items = query.count()
        
        # Pobierz elementy z paginacją
        items = query.offset(offset).limit(limit).all()
        
        # Konwertuj na DTOs
        data = []
        for user_default, ingredient in items:
            dto = UserDefaultIngredientDto(
                ingredient_id=ingredient.id,
                name=ingredient.name,
                unit_type=ingredient.unit_type.value,
                created_at=user_default.created_at
            )
            data.append(dto)
        
        # Oblicz liczbę stron
        total_pages = (total_items + limit - 1) // limit
        
        pagination = PaginationInfo(
            page=page,
            limit=limit,
            total_items=total_items,
            total_pages=total_pages
        )
        
        return PaginatedUserDefaultIngredientsResponse(
            data=data,
            pagination=pagination
        )
    
    def add_default(
        self, 
        user_id: UUID, 
        command: AddUserDefaultIngredientCommand
    ) -> UserDefaultIngredientAddedDto:
        """
        Dodaje składnik do listy domyślnych użytkownika.
        
        Args:
            user_id: ID użytkownika
            command: Dane składnika do dodania
            
        Returns:
            UserDefaultIngredientAddedDto: Potwierdzenie dodania
            
        Raises:
            HTTPException: 400 jeśli składnik nie istnieje lub już jest w domyślnych
            HTTPException: 404 jeśli składnik nie istnieje
        """
        # Sprawdź czy składnik istnieje
        ingredient = self.db.query(Ingredient).filter(
            Ingredient.id == command.ingredient_id
        ).first()
        
        if not ingredient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Składnik o ID {command.ingredient_id} nie istnieje"
            )
        
        # Sprawdź czy składnik nie jest już w domyślnych
        existing = self.db.query(UserDefaultIngredient).filter(
            and_(
                UserDefaultIngredient.user_id == user_id,
                UserDefaultIngredient.ingredient_id == command.ingredient_id
            )
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Składnik '{ingredient.name}' już jest w domyślnych"
            )
        
        # Sprawdź limit domyślnych składników (max 100)
        count = self.db.query(func.count(UserDefaultIngredient.id)).filter(
            UserDefaultIngredient.user_id == user_id
        ).scalar()
        
        if count >= 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Przekroczono maksymalną liczbę domyślnych składników (100)"
            )
        
        # Dodaj składnik do domyślnych
        new_default = UserDefaultIngredient(
            user_id=user_id,
            ingredient_id=command.ingredient_id
        )
        
        self.db.add(new_default)
        self.db.commit()
        self.db.refresh(new_default)
        
        return UserDefaultIngredientAddedDto(
            user_id=user_id,
            ingredient_id=command.ingredient_id,
            created_at=new_default.created_at
        )
    
    def remove_default(self, user_id: UUID, ingredient_id: UUID) -> bool:
        """
        Usuwa składnik z listy domyślnych użytkownika.
        
        Args:
            user_id: ID użytkownika
            ingredient_id: ID składnika do usunięcia
            
        Returns:
            bool: True jeśli składnik został usunięty
            
        Raises:
            HTTPException: 404 jeśli relacja nie istnieje
        """
        # Znajdź relację user-ingredient
        default_ingredient = self.db.query(UserDefaultIngredient).filter(
            and_(
                UserDefaultIngredient.user_id == user_id,
                UserDefaultIngredient.ingredient_id == ingredient_id
            )
        ).first()
        
        if not default_ingredient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Składnik nie jest w domyślnych użytkownika"
            )
        
        # Usuń relację
        self.db.delete(default_ingredient)
        self.db.commit()
        
        return True 