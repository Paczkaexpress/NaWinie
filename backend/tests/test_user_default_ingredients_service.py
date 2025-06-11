"""
Unit tests for UserDefaultIngredientsService.
"""

import pytest
from uuid import UUID, uuid4
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.services.user_default_ingredients_service import UserDefaultIngredientsService
from backend.models.user_default_ingredient import UserDefaultIngredient
from backend.models.ingredient import Ingredient, UnitType
from backend.models.user import User
from backend.models.requests import AddUserDefaultIngredientCommand
from backend.models.responses import (
    UserDefaultIngredientDto,
    UserDefaultIngredientAddedDto,
    PaginatedUserDefaultIngredientsResponse
)


class TestUserDefaultIngredientsService:
    """Test suite for UserDefaultIngredientsService."""
    
    @pytest.fixture
    def service(self, db_session: Session):
        """Create service instance."""
        return UserDefaultIngredientsService(db_session)
    
    @pytest.fixture
    def test_ingredient(self, db_session: Session):
        """Create a test ingredient."""
        ingredient = Ingredient(
            id=uuid4(),
            name="Sól",
            unit_type=UnitType.G
        )
        db_session.add(ingredient)
        db_session.commit()
        db_session.refresh(ingredient)
        return ingredient
    
    @pytest.fixture
    def test_ingredient2(self, db_session: Session):
        """Create a second test ingredient."""
        ingredient = Ingredient(
            id=uuid4(),
            name="Pieprz",
            unit_type=UnitType.G
        )
        db_session.add(ingredient)
        db_session.commit()
        db_session.refresh(ingredient)
        return ingredient
    
    @pytest.fixture
    def test_user_default(self, db_session: Session, test_user: User, test_ingredient: Ingredient):
        """Create a test user default ingredient."""
        default = UserDefaultIngredient(
            user_id=test_user.id,
            ingredient_id=test_ingredient.id
        )
        db_session.add(default)
        db_session.commit()
        db_session.refresh(default)
        return default

    def test_get_user_defaults_empty_list(self, service: UserDefaultIngredientsService, test_user: User):
        """Test getting empty list of user defaults."""
        result = service.get_user_defaults(test_user.id)
        
        assert isinstance(result, PaginatedUserDefaultIngredientsResponse)
        assert len(result.data) == 0
        assert result.pagination.total_items == 0
        assert result.pagination.total_pages == 0
        assert result.pagination.page == 1
        assert result.pagination.limit == 50

    def test_get_user_defaults_with_data(
        self, 
        service: UserDefaultIngredientsService, 
        test_user: User, 
        test_user_default: UserDefaultIngredient,
        test_ingredient: Ingredient
    ):
        """Test getting list of user defaults with data."""
        result = service.get_user_defaults(test_user.id)
        
        assert isinstance(result, PaginatedUserDefaultIngredientsResponse)
        assert len(result.data) == 1
        assert result.pagination.total_items == 1
        assert result.pagination.total_pages == 1
        
        dto = result.data[0]
        assert isinstance(dto, UserDefaultIngredientDto)
        assert dto.ingredient_id == test_ingredient.id
        assert dto.name == test_ingredient.name
        assert dto.unit_type == test_ingredient.unit_type.value

    def test_get_user_defaults_pagination(
        self, 
        service: UserDefaultIngredientsService, 
        test_user: User,
        test_ingredient: Ingredient,
        test_ingredient2: Ingredient,
        db_session: Session
    ):
        """Test pagination of user defaults."""
        # Add multiple defaults
        default1 = UserDefaultIngredient(user_id=test_user.id, ingredient_id=test_ingredient.id)
        default2 = UserDefaultIngredient(user_id=test_user.id, ingredient_id=test_ingredient2.id)
        
        db_session.add_all([default1, default2])
        db_session.commit()
        
        # Test first page with limit 1
        result = service.get_user_defaults(test_user.id, page=1, limit=1)
        
        assert len(result.data) == 1
        assert result.pagination.total_items == 2
        assert result.pagination.total_pages == 2
        assert result.pagination.page == 1
        assert result.pagination.limit == 1
        
        # Test second page
        result2 = service.get_user_defaults(test_user.id, page=2, limit=1)
        
        assert len(result2.data) == 1
        assert result2.pagination.page == 2

    def test_get_user_defaults_invalid_pagination(self, service: UserDefaultIngredientsService, test_user: User):
        """Test error handling for invalid pagination parameters."""
        # Test page < 1
        with pytest.raises(HTTPException) as exc_info:
            service.get_user_defaults(test_user.id, page=0)
        
        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "Numer strony musi być większy niż 0" in str(exc_info.value.detail)
        
        # Test limit < 1
        with pytest.raises(HTTPException) as exc_info:
            service.get_user_defaults(test_user.id, limit=0)
        
        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "Limit musi być między 1 a 100" in str(exc_info.value.detail)
        
        # Test limit > 100
        with pytest.raises(HTTPException) as exc_info:
            service.get_user_defaults(test_user.id, limit=101)
        
        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "Limit musi być między 1 a 100" in str(exc_info.value.detail)

    def test_add_default_success(
        self, 
        service: UserDefaultIngredientsService, 
        test_user: User, 
        test_ingredient: Ingredient
    ):
        """Test successfully adding ingredient to defaults."""
        command = AddUserDefaultIngredientCommand(ingredient_id=test_ingredient.id)
        
        result = service.add_default(test_user.id, command)
        
        assert isinstance(result, UserDefaultIngredientAddedDto)
        assert result.user_id == test_user.id
        assert result.ingredient_id == test_ingredient.id
        assert result.created_at is not None

    def test_add_default_ingredient_not_found(self, service: UserDefaultIngredientsService, test_user: User):
        """Test adding non-existent ingredient to defaults."""
        fake_ingredient_id = uuid4()
        command = AddUserDefaultIngredientCommand(ingredient_id=fake_ingredient_id)
        
        with pytest.raises(HTTPException) as exc_info:
            service.add_default(test_user.id, command)
        
        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert f"Składnik o ID {fake_ingredient_id} nie istnieje" in str(exc_info.value.detail)

    def test_add_default_already_exists(
        self, 
        service: UserDefaultIngredientsService, 
        test_user: User, 
        test_ingredient: Ingredient,
        test_user_default: UserDefaultIngredient
    ):
        """Test adding ingredient that's already in defaults."""
        command = AddUserDefaultIngredientCommand(ingredient_id=test_ingredient.id)
        
        with pytest.raises(HTTPException) as exc_info:
            service.add_default(test_user.id, command)
        
        assert exc_info.value.status_code == status.HTTP_409_CONFLICT
        assert f"Składnik '{test_ingredient.name}' już jest w domyślnych" in str(exc_info.value.detail)

    def test_add_default_max_limit(
        self, 
        service: UserDefaultIngredientsService, 
        test_user: User,
        db_session: Session
    ):
        """Test adding ingredient when max limit is reached."""
        # Create 100 default ingredients
        for i in range(100):
            ingredient = Ingredient(
                id=uuid4(),
                name=f"Ingredient {i}",
                unit_type=UnitType.G
            )
            db_session.add(ingredient)
            db_session.flush()
            
            default = UserDefaultIngredient(
                user_id=test_user.id,
                ingredient_id=ingredient.id
            )
            db_session.add(default)
        
        db_session.commit()
        
        # Try to add 101st ingredient
        new_ingredient = Ingredient(
            id=uuid4(),
            name="Extra Ingredient",
            unit_type=UnitType.G
        )
        db_session.add(new_ingredient)
        db_session.commit()
        
        command = AddUserDefaultIngredientCommand(ingredient_id=new_ingredient.id)
        
        with pytest.raises(HTTPException) as exc_info:
            service.add_default(test_user.id, command)
        
        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "Przekroczono maksymalną liczbę domyślnych składników (100)" in str(exc_info.value.detail)

    def test_remove_default_success(
        self, 
        service: UserDefaultIngredientsService, 
        test_user: User, 
        test_ingredient: Ingredient,
        test_user_default: UserDefaultIngredient
    ):
        """Test successfully removing ingredient from defaults."""
        result = service.remove_default(test_user.id, test_ingredient.id)
        
        assert result is True

    def test_remove_default_not_found(
        self, 
        service: UserDefaultIngredientsService, 
        test_user: User,
        test_ingredient: Ingredient
    ):
        """Test removing ingredient that's not in defaults."""
        with pytest.raises(HTTPException) as exc_info:
            service.remove_default(test_user.id, test_ingredient.id)
        
        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Składnik nie jest w domyślnych użytkownika" in str(exc_info.value.detail)

    def test_remove_default_wrong_user(
        self, 
        service: UserDefaultIngredientsService, 
        test_ingredient: Ingredient,
        test_user_default: UserDefaultIngredient,
        db_session: Session
    ):
        """Test removing ingredient from defaults by wrong user."""
        # Create different user
        other_user = User(
            id=uuid4(),
            email="other@example.com"
        )
        db_session.add(other_user)
        db_session.commit()
        
        with pytest.raises(HTTPException) as exc_info:
            service.remove_default(other_user.id, test_ingredient.id)
        
        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Składnik nie jest w domyślnych użytkownika" in str(exc_info.value.detail) 