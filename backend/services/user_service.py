from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from typing import Optional
import uuid
import logging

from ..models.user import User
from ..models.responses import UserResponse

logger = logging.getLogger(__name__)

class UserService:
    """Serwis do obsługi operacji na użytkownikach."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """
        Pobiera użytkownika z bazy danych na podstawie ID.
        
        Args:
            user_id: UUID użytkownika jako string
            
        Returns:
            User: Obiekt użytkownika lub None jeśli nie znaleziono
            
        Raises:
            HTTPException: 400 jeśli user_id ma nieprawidłowy format UUID
            HTTPException: 404 jeśli użytkownik nie został znaleziony
            HTTPException: 500 w przypadku błędów bazy danych
        """
        try:
            # Walidacja formatu UUID
            try:
                uuid_obj = uuid.UUID(user_id)
            except ValueError:
                logger.warning(f"Invalid UUID format provided: {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid user ID format"
                )
            
            # Zapytanie do bazy danych
            user = self.db.query(User).filter(User.id == uuid_obj).first()
            
            if user is None:
                logger.error(f"User not found: {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            logger.info(f"User retrieved successfully: {user_id}")
            return user
            
        except HTTPException:
            # Re-raise HTTP exceptions (already handled)
            raise
        except SQLAlchemyError as e:
            logger.error(f"Database error while retrieving user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
        except Exception as e:
            logger.error(f"Unexpected error while retrieving user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
    
    def get_current_user(self, user_id: str) -> UserResponse:
        """
        Pobiera profil aktualnego użytkownika i konwertuje na UserResponse.
        
        Główna metoda do użycia w endpoint /users/me.
        
        Args:
            user_id: UUID użytkownika jako string (z JWT token)
            
        Returns:
            UserResponse: Pydantic model z danymi użytkownika
            
        Raises:
            HTTPException: Różne kody błędów w zależności od sytuacji
        """
        user = self.get_user_by_id(user_id)
        
        # Konwersja SQLAlchemy model na Pydantic response model
        user_response = UserResponse(
            id=str(user.id),
            email=user.email,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
        
        logger.info(f"User profile retrieved for: {user_id}")
        return user_response

# Factory function dla dependency injection
def get_user_service(db: Session) -> UserService:
    """
    Factory function do tworzenia UserService z dependency injection.
    
    Args:
        db: Sesja SQLAlchemy
        
    Returns:
        UserService: Instancja serwisu
    """
    return UserService(db) 