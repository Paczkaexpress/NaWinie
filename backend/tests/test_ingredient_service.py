"""
Unit testy dla IngredientService.
"""

import pytest
from unittest.mock import Mock, patch
from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
import uuid
from datetime import datetime

from backend.services.ingredient_service import IngredientService
from backend.models.ingredient import Ingredient, UnitType
from backend.models.requests import CreateIngredientRequest, IngredientQueryParams
from backend.models.responses import IngredientResponse, PaginatedIngredientsResponse


class TestIngredientService:
    """Testy dla metod IngredientService."""
    
    def test_get_ingredients_success(self, db_session):
        """Test pomyślnego pobierania listy składników."""
        # Setup - dodaj testowe składniki
        ingredient1 = Ingredient(
            id=uuid.uuid4(),
            name="Flour",
            unit_type=UnitType.G,
            created_at=datetime.utcnow()
        )
        ingredient2 = Ingredient(
            id=uuid.uuid4(),
            name="Milk",
            unit_type=UnitType.ML,
            created_at=datetime.utcnow()
        )
        
        db_session.add_all([ingredient1, ingredient2])
        db_session.commit()
        
        # Test
        service = IngredientService(db_session)
        query_params = IngredientQueryParams(page=1, limit=20)
        result = service.get_ingredients(query_params)
        
        # Assertions
        assert isinstance(result, PaginatedIngredientsResponse)
        assert len(result.data) == 2
        assert result.pagination.total_items == 2
        assert result.pagination.page == 1
        assert result.pagination.total_pages == 1
        
        # Sprawdź składniki
        ingredient_names = [ing.name for ing in result.data]
        assert "Flour" in ingredient_names
        assert "Milk" in ingredient_names
    
    def test_get_ingredients_with_search(self, db_session):
        """Test wyszukiwania składników po nazwie."""
        # Setup
        ingredient1 = Ingredient(
            id=uuid.uuid4(),
            name="Vanilla Extract",
            unit_type=UnitType.ML
        )
        ingredient2 = Ingredient(
            id=uuid.uuid4(),
            name="Chocolate Chips",
            unit_type=UnitType.G
        )
        
        db_session.add_all([ingredient1, ingredient2])
        db_session.commit()
        
        # Test - wyszukaj "vanilla"
        service = IngredientService(db_session)
        query_params = IngredientQueryParams(search="vanilla")
        result = service.get_ingredients(query_params)
        
        # Assertions
        assert len(result.data) == 1
        assert result.data[0].name == "Vanilla Extract"
        assert result.pagination.total_items == 1
    
    def test_get_ingredients_with_sorting(self, db_session):
        """Test sortowania składników."""
        # Setup
        ingredient1 = Ingredient(
            id=uuid.uuid4(),
            name="Zebra Spice",
            unit_type=UnitType.G
        )
        ingredient2 = Ingredient(
            id=uuid.uuid4(),
            name="Apple Sauce",
            unit_type=UnitType.ML
        )
        
        db_session.add_all([ingredient1, ingredient2])
        db_session.commit()
        
        # Test - sortuj po nazwie desc
        service = IngredientService(db_session)
        query_params = IngredientQueryParams(sortBy="name", sortOrder="desc")
        result = service.get_ingredients(query_params)
        
        # Assertions
        assert len(result.data) == 2
        assert result.data[0].name == "Zebra Spice"  # Z przed A
        assert result.data[1].name == "Apple Sauce"
    
    def test_get_ingredients_pagination(self, db_session):
        """Test paginacji składników."""
        # Setup - dodaj 5 składników
        ingredients = [
            Ingredient(id=uuid.uuid4(), name=f"Ingredient {i}", unit_type=UnitType.G)
            for i in range(5)
        ]
        
        db_session.add_all(ingredients)
        db_session.commit()
        
        # Test - pobierz 2 składniki na stronę
        service = IngredientService(db_session)
        query_params = IngredientQueryParams(page=1, limit=2)
        result = service.get_ingredients(query_params)
        
        # Assertions
        assert len(result.data) == 2
        assert result.pagination.total_items == 5
        assert result.pagination.total_pages == 3
        assert result.pagination.page == 1
        assert result.pagination.limit == 2
    
    def test_create_ingredient_success(self, db_session):
        """Test pomyślnego utworzenia składnika."""
        # Setup
        ingredient_data = CreateIngredientRequest(
            name="New Spice",
            unit_type=UnitType.G
        )
        user_id = "123e4567-e89b-12d3-a456-426614174000"
        
        # Test
        service = IngredientService(db_session)
        result = service.create_ingredient(ingredient_data, user_id)
        
        # Assertions
        assert isinstance(result, IngredientResponse)
        assert result.name == "New Spice"
        assert result.unit_type == "g"
        assert result.id is not None
        
        # Sprawdź w bazie danych
        db_ingredient = db_session.query(Ingredient).filter(Ingredient.name == "New Spice").first()
        assert db_ingredient is not None
        assert db_ingredient.unit_type == UnitType.G
    
    def test_create_ingredient_duplicate_name(self, db_session):
        """Test próby utworzenia składnika z istniejącą nazwą."""
        # Setup - dodaj istniejący składnik
        existing_ingredient = Ingredient(
            id=uuid.uuid4(),
            name="Existing Spice",
            unit_type=UnitType.G
        )
        db_session.add(existing_ingredient)
        db_session.commit()
        
        # Test - spróbuj dodać składnik z tą samą nazwą
        ingredient_data = CreateIngredientRequest(
            name="Existing Spice",
            unit_type=UnitType.ML
        )
        user_id = "123e4567-e89b-12d3-a456-426614174000"
        
        service = IngredientService(db_session)
        
        # Assertions
        with pytest.raises(HTTPException) as exc_info:
            service.create_ingredient(ingredient_data, user_id)
        
        assert exc_info.value.status_code == 409
        assert "already exists" in exc_info.value.detail
    
    def test_create_ingredient_case_insensitive_duplicate(self, db_session):
        """Test próby utworzenia składnika z nazwą różniącą się wielkością liter."""
        # Setup
        existing_ingredient = Ingredient(
            id=uuid.uuid4(),
            name="Salt",
            unit_type=UnitType.G
        )
        db_session.add(existing_ingredient)
        db_session.commit()
        
        # Test - spróbuj dodać "SALT"
        ingredient_data = CreateIngredientRequest(
            name="SALT",
            unit_type=UnitType.G
        )
        user_id = "123e4567-e89b-12d3-a456-426614174000"
        
        service = IngredientService(db_session)
        
        # Assertions
        with pytest.raises(HTTPException) as exc_info:
            service.create_ingredient(ingredient_data, user_id)
        
        assert exc_info.value.status_code == 409
    
    def test_get_ingredient_by_id_success(self, db_session):
        """Test pomyślnego pobierania składnika po ID."""
        # Setup
        ingredient_id = uuid.uuid4()
        ingredient = Ingredient(
            id=ingredient_id,
            name="Test Ingredient",
            unit_type=UnitType.SZT
        )
        db_session.add(ingredient)
        db_session.commit()
        
        # Test
        service = IngredientService(db_session)
        result = service.get_ingredient_by_id(str(ingredient_id))
        
        # Assertions
        assert isinstance(result, IngredientResponse)
        assert result.id == ingredient_id
        assert result.name == "Test Ingredient"
        assert result.unit_type == "szt"
    
    def test_get_ingredient_by_id_not_found(self, db_session):
        """Test pobierania nieistniejącego składnika."""
        # Setup
        non_existent_id = str(uuid.uuid4())
        
        # Test
        service = IngredientService(db_session)
        
        # Assertions
        with pytest.raises(HTTPException) as exc_info:
            service.get_ingredient_by_id(non_existent_id)
        
        assert exc_info.value.status_code == 404
        assert "not found" in exc_info.value.detail
    
    def test_get_ingredient_by_id_invalid_uuid(self, db_session):
        """Test pobierania składnika z nieprawidłowym UUID."""
        # Test
        service = IngredientService(db_session)
        
        # Assertions
        with pytest.raises(HTTPException) as exc_info:
            service.get_ingredient_by_id("invalid-uuid")
        
        assert exc_info.value.status_code == 422
        assert "Invalid ingredient ID format" in exc_info.value.detail


class TestIngredientServiceEdgeCases:
    """Testy edge cases dla IngredientService."""
    
    def test_get_ingredients_empty_database(self, db_session):
        """Test pobierania składników z pustej bazy."""
        service = IngredientService(db_session)
        query_params = IngredientQueryParams()
        result = service.get_ingredients(query_params)
        
        assert len(result.data) == 0
        assert result.pagination.total_items == 0
        assert result.pagination.total_pages == 1  # Minimum 1 strona
    
    def test_get_ingredients_search_no_results(self, db_session):
        """Test wyszukiwania bez wyników."""
        # Setup - dodaj składnik
        ingredient = Ingredient(
            id=uuid.uuid4(),
            name="Sugar",
            unit_type=UnitType.G
        )
        db_session.add(ingredient)
        db_session.commit()
        
        # Test - wyszukaj coś co nie istnieje
        service = IngredientService(db_session)
        query_params = IngredientQueryParams(search="nonexistent")
        result = service.get_ingredients(query_params)
        
        assert len(result.data) == 0
        assert result.pagination.total_items == 0
    
    @patch('backend.services.ingredient_service.logger')
    def test_database_error_handling(self, mock_logger, db_session):
        """Test obsługi błędów bazy danych."""
        # Setup - mock database error
        db_session.query = Mock(side_effect=SQLAlchemyError("Database connection lost"))
        
        service = IngredientService(db_session)
        query_params = IngredientQueryParams()
        
        # Test
        with pytest.raises(HTTPException) as exc_info:
            service.get_ingredients(query_params)
        
        # Assertions
        assert exc_info.value.status_code == 500
        assert "Internal server error" in exc_info.value.detail
        mock_logger.error.assert_called()
    
    def test_create_ingredient_name_validation(self, db_session):
        """Test walidacji nazwy składnika w CreateIngredientRequest."""
        # Test z pustą nazwą
        with pytest.raises(ValueError):
            CreateIngredientRequest(name="", unit_type=UnitType.G)
        
        # Test z samymi spacjami
        with pytest.raises(ValueError):
            CreateIngredientRequest(name="   ", unit_type=UnitType.G) 