from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from fastapi import HTTPException, status
from typing import List, Tuple
import logging

from ..models.responses import RecipeViewHistoryItem, PaginatedRecipeViewHistory, PaginationInfo
from ..models.recipe_view import RecipeView
from ..models.recipe import Recipe

logger = logging.getLogger(__name__)

class RecipeViewService:
    """Serwis do zarządzania historią przeglądania przepisów."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_recipe_views(self, user_id: str, page: int, limit: int) -> PaginatedRecipeViewHistory:
        """
        Pobiera paginowaną historię przeglądania przepisów dla użytkownika.
        
        Args:
            user_id: ID użytkownika
            page: Numer strony (zaczyna się od 1)
            limit: Liczba elementów na stronę
            
        Returns:
            PaginatedRecipeViewHistory: Paginowana lista historii przeglądania
            
        Raises:
            HTTPException 500: Błędy bazy danych
        """
        try:
            logger.info(f"Fetching recipe view history for user {user_id}, page {page}, limit {limit}")
            
            # Oblicz offset dla paginacji
            offset = (page - 1) * limit
            
            # Query główne z JOIN do pobrania nazwy przepisu
            query = (
                self.db.query(
                    RecipeView.id,
                    RecipeView.recipe_id,
                    RecipeView.view_start,
                    RecipeView.view_end,
                    RecipeView.created_at,
                    Recipe.name.label('recipe_name')
                )
                .join(Recipe, RecipeView.recipe_id == Recipe.id)
                .filter(RecipeView.user_id == user_id)
                .order_by(desc(RecipeView.created_at))
            )
            
            # Pobierz całkowitą liczbę elementów
            total_items = query.count()
            
            # Wykonaj zapytanie z paginacją
            results = query.offset(offset).limit(limit).all()
            
            # Mapuj wyniki na modele Pydantic
            history_items = [
                RecipeViewHistoryItem(
                    id=str(row.id),
                    recipe_id=str(row.recipe_id),
                    recipe_name=row.recipe_name,
                    view_start=row.view_start,
                    view_end=row.view_end,
                    created_at=row.created_at
                )
                for row in results
            ]
            
            # Oblicz informacje o paginacji
            total_pages = (total_items + limit - 1) // limit  # Ceiling division
            
            pagination_info = PaginationInfo(
                page=page,
                limit=limit,
                total_items=total_items,
                total_pages=total_pages
            )
            
            logger.info(f"Retrieved {len(history_items)} recipe views for user {user_id}")
            
            return PaginatedRecipeViewHistory(
                data=history_items,
                pagination=pagination_info
            )
            
        except Exception as e:
            logger.error(f"Error fetching recipe view history for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )

def get_recipe_view_service(db: Session) -> RecipeViewService:
    """Factory function do tworzenia instancji RecipeViewService."""
    return RecipeViewService(db) 