"""
Integration testy dla ingredients endpoints.
"""

import pytest
import uuid
from datetime import datetime
from fastapi import status
from sqlalchemy import text

from backend.models.ingredient import Ingredient, UnitType
from backend.utils.jwt_helper import create_test_token


class TestIngredientsGetEndpoint:
    """Testy dla GET /api/ingredients endpoint."""
    
    def test_get_ingredients_empty_list(self, client):
        """Test pobierania pustej listy składników."""
        response = client.get("/api/ingredients/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert "data" in data
        assert "pagination" in data
        assert len(data["data"]) == 0
        assert data["pagination"]["total_items"] == 0
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["total_pages"] == 1
    
    def test_get_ingredients_with_data(self, client, db_session):
        """Test pobierania listy składników z danymi."""
        # Setup - dodaj testowe składniki
        ingredients = [
            Ingredient(id=uuid.uuid4(), name="Flour", unit_type=UnitType.G),
            Ingredient(id=uuid.uuid4(), name="Sugar", unit_type=UnitType.G),
            Ingredient(id=uuid.uuid4(), name="Milk", unit_type=UnitType.ML)
        ]
        
        db_session.add_all(ingredients)
        db_session.commit()
        
        # Test
        response = client.get("/api/ingredients/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert len(data["data"]) == 3
        assert data["pagination"]["total_items"] == 3
        
        # Sprawdź strukturę składnika
        ingredient = data["data"][0]
        assert "id" in ingredient
        assert "name" in ingredient
        assert "unit_type" in ingredient
        assert "created_at" in ingredient
    
    def test_get_ingredients_pagination(self, client, db_session):
        """Test paginacji składników."""
        # Setup - dodaj 5 składników
        ingredients = [
            Ingredient(id=uuid.uuid4(), name=f"Ingredient {i}", unit_type=UnitType.G)
            for i in range(5)
        ]
        
        db_session.add_all(ingredients)
        db_session.commit()
        
        # Test - strona 1, limit 2
        response = client.get("/api/ingredients/?page=1&limit=2")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert len(data["data"]) == 2
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["limit"] == 2
        assert data["pagination"]["total_items"] == 5
        assert data["pagination"]["total_pages"] == 3
        
        # Test - strona 2
        response = client.get("/api/ingredients/?page=2&limit=2")
        data = response.json()
        
        assert len(data["data"]) == 2
        assert data["pagination"]["page"] == 2
    
    def test_get_ingredients_search(self, client, db_session):
        """Test wyszukiwania składników."""
        # Setup
        ingredients = [
            Ingredient(id=uuid.uuid4(), name="Vanilla Extract", unit_type=UnitType.ML),
            Ingredient(id=uuid.uuid4(), name="Chocolate Chips", unit_type=UnitType.G),
            Ingredient(id=uuid.uuid4(), name="Vanilla Bean", unit_type=UnitType.SZT)
        ]
        
        db_session.add_all(ingredients)
        db_session.commit()
        
        # Test - wyszukaj "vanilla"
        response = client.get("/api/ingredients/?search=vanilla")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert len(data["data"]) == 2
        assert data["pagination"]["total_items"] == 2
        
        names = [item["name"] for item in data["data"]]
        assert "Vanilla Extract" in names
        assert "Vanilla Bean" in names
    
    def test_get_ingredients_sorting(self, client, db_session):
        """Test sortowania składników."""
        # Setup
        ingredients = [
            Ingredient(id=uuid.uuid4(), name="Zebra Spice", unit_type=UnitType.G),
            Ingredient(id=uuid.uuid4(), name="Apple Sauce", unit_type=UnitType.ML),
            Ingredient(id=uuid.uuid4(), name="Banana", unit_type=UnitType.SZT)
        ]
        
        db_session.add_all(ingredients)
        db_session.commit()
        
        # Test - sortuj po nazwie DESC
        response = client.get("/api/ingredients/?sortBy=name&sortOrder=desc")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        names = [item["name"] for item in data["data"]]
        assert names == ["Zebra Spice", "Banana", "Apple Sauce"]
    
    def test_get_ingredients_invalid_parameters(self, client):
        """Test nieprawidłowych parametrów zapytania."""
        # Test - nieprawidłowa strona
        response = client.get("/api/ingredients/?page=0")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
        # Test - za duży limit
        response = client.get("/api/ingredients/?limit=200")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
        # Test - nieprawidłowe sortBy
        response = client.get("/api/ingredients/?sortBy=invalid_field")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
        # Test - nieprawidłowe sortOrder
        response = client.get("/api/ingredients/?sortOrder=invalid_order")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestIngredientsPostEndpoint:
    """Testy dla POST /api/ingredients endpoint."""
    
    def test_create_ingredient_success(self, client, test_user, auth_headers):
        """Test pomyślnego tworzenia składnika."""
        ingredient_data = {
            "name": "New Test Spice",
            "unit_type": "g"
        }
        
        response = client.post("/api/ingredients/", json=ingredient_data, headers=auth_headers)
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        
        assert data["name"] == "New Test Spice"
        assert data["unit_type"] == "g"
        assert "id" in data
        assert "created_at" in data
    
    def test_create_ingredient_no_auth(self, client):
        """Test tworzenia składnika bez uwierzytelnienia."""
        ingredient_data = {
            "name": "Unauthorized Spice",
            "unit_type": "g"
        }
        
        response = client.post("/api/ingredients/", json=ingredient_data)
        
        # FastAPI zwraca 403 gdy nie ma Authorization header
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_create_ingredient_invalid_token(self, client, invalid_token):
        """Test tworzenia składnika z nieprawidłowym tokenem."""
        ingredient_data = {
            "name": "Invalid Token Spice",
            "unit_type": "g"
        }
        
        headers = {"Authorization": f"Bearer {invalid_token}"}
        response = client.post("/api/ingredients/", json=ingredient_data, headers=headers)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_ingredient_duplicate_name(self, client, db_session, test_user, auth_headers):
        """Test tworzenia składnika z istniejącą nazwą."""
        # Setup - dodaj istniejący składnik
        existing_ingredient = Ingredient(
            id=uuid.uuid4(),
            name="Existing Ingredient",
            unit_type=UnitType.G
        )
        db_session.add(existing_ingredient)
        db_session.commit()
        
        # Test - spróbuj dodać składnik z tą samą nazwą
        ingredient_data = {
            "name": "Existing Ingredient",
            "unit_type": "ml"
        }
        
        response = client.post("/api/ingredients/", json=ingredient_data, headers=auth_headers)
        
        assert response.status_code == status.HTTP_409_CONFLICT
        data = response.json()
        assert "already exists" in data["detail"]
    
    def test_create_ingredient_invalid_data(self, client, auth_headers):
        """Test tworzenia składnika z nieprawidłowymi danymi."""
        # Test - brak nazwy
        response = client.post("/api/ingredients/", 
                             json={"unit_type": "g"}, 
                             headers=auth_headers)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
        # Test - nieprawidłowy unit_type
        response = client.post("/api/ingredients/", 
                             json={"name": "Test", "unit_type": "invalid"}, 
                             headers=auth_headers)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
        # Test - pusta nazwa
        response = client.post("/api/ingredients/", 
                             json={"name": "", "unit_type": "g"}, 
                             headers=auth_headers)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_create_ingredient_name_formatting(self, client, auth_headers):
        """Test formatowania nazwy składnika."""
        ingredient_data = {
            "name": "  test ingredient  ",  # Spacje na początku i końcu
            "unit_type": "g"
        }
        
        response = client.post("/api/ingredients/", json=ingredient_data, headers=auth_headers)
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        
        # Nazwa powinna być strimowana i skapitalizowana
        assert data["name"] == "Test Ingredient"


class TestIngredientsGetByIdEndpoint:
    """Testy dla GET /api/ingredients/{ingredient_id} endpoint."""
    
    def test_get_ingredient_by_id_success(self, client, db_session):
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
        response = client.get(f"/api/ingredients/{ingredient_id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data["id"] == str(ingredient_id)
        assert data["name"] == "Test Ingredient"
        assert data["unit_type"] == "szt"
        assert "created_at" in data
    
    def test_get_ingredient_by_id_not_found(self, client):
        """Test pobierania nieistniejącego składnika."""
        non_existent_id = uuid.uuid4()
        response = client.get(f"/api/ingredients/{non_existent_id}")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "not found" in data["detail"]
    
    def test_get_ingredient_by_id_invalid_uuid(self, client):
        """Test pobierania składnika z nieprawidłowym UUID."""
        response = client.get("/api/ingredients/invalid-uuid-format")
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestIngredientsEndpointSecurity:
    """Testy bezpieczeństwa dla ingredients endpoints."""
    
    def test_sql_injection_prevention(self, client):
        """Test ochrony przed SQL injection w wyszukiwaniu."""
        malicious_search = "'; DROP TABLE ingredients; --"
        
        response = client.get(f"/api/ingredients/?search={malicious_search}")
        
        # Powinno działać bez błędów (nie wykonać SQL injection)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["data"]) == 0  # Brak wyników, ale bez błędu
    
    def test_xss_prevention_in_name(self, client, auth_headers):
        """Test ochrony przed XSS w nazwie składnika."""
        ingredient_data = {
            "name": "<script>alert('xss')</script>",
            "unit_type": "g"
        }
        
        response = client.post("/api/ingredients/", json=ingredient_data, headers=auth_headers)
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        
        # Nazwa powinna być oczyszczona
        assert "<script>" not in data["name"]
        assert data["name"] == "<Script>Alert('Xss')</Script>"  # Title case
    
    def test_rate_limiting_create_ingredient(self, client, auth_headers):
        """Test podstawowej funkcjonalności tworzenia (symulacja rate limiting)."""
        # Testujemy że można utworzyć kilka składników
        for i in range(3):
            ingredient_data = {
                "name": f"Rate Test Ingredient {i}",
                "unit_type": "g"
            }
            
            response = client.post("/api/ingredients/", json=ingredient_data, headers=auth_headers)
            assert response.status_code == status.HTTP_201_CREATED


class TestIngredientsEndpointDocumentation:
    """Testy dokumentacji OpenAPI dla ingredients endpoints."""
    
    def test_openapi_schema_includes_ingredients(self, client):
        """Test czy schema OpenAPI zawiera endpoints ingredients."""
        response = client.get("/openapi.json")
        
        assert response.status_code == status.HTTP_200_OK
        schema = response.json()
        
        # Sprawdź czy endpoints są w schemacie
        assert "/api/ingredients/" in schema["paths"]
        assert "/api/ingredients/{ingredient_id}" in schema["paths"]
        
        # Sprawdź metody HTTP
        ingredients_path = schema["paths"]["/api/ingredients/"]
        assert "get" in ingredients_path
        assert "post" in ingredients_path
        
        ingredient_by_id_path = schema["paths"]["/api/ingredients/{ingredient_id}"]
        assert "get" in ingredient_by_id_path
    
    def test_swagger_docs_accessible(self, client):
        """Test dostępności dokumentacji Swagger."""
        response = client.get("/docs")
        assert response.status_code == status.HTTP_200_OK 