"""
Integration tests for user default ingredients endpoints.
"""

import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.models.user import User
from backend.models.ingredient import Ingredient, UnitType
from backend.models.user_default_ingredient import UserDefaultIngredient


class TestUserDefaultIngredientsEndpoints:
    """Test suite for user default ingredients endpoints."""
    
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

    def test_get_user_defaults_unauthorized(self, client: TestClient):
        """Test getting user defaults without authentication."""
        response = client.get("/api/users/me/default-ingredients")
        
        assert response.status_code == 403  # Missing authorization header
        assert "detail" in response.json()

    def test_get_user_defaults_invalid_token(self, client: TestClient, invalid_token: str):
        """Test getting user defaults with invalid token."""
        response = client.get(
            "/api/users/me/default-ingredients",
            headers={"Authorization": f"Bearer {invalid_token}"}
        )
        
        assert response.status_code == 401
        assert response.json()["detail"] == "Authentication required"

    def test_get_user_defaults_empty_list(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test getting empty list of user defaults."""
        response = client.get("/api/users/me/default-ingredients", headers=auth_headers)
        
        assert response.status_code == 200
        
        data = response.json()
        assert "data" in data
        assert "pagination" in data
        assert len(data["data"]) == 0
        assert data["pagination"]["total_items"] == 0
        assert data["pagination"]["total_pages"] == 0
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["limit"] == 50

    def test_get_user_defaults_with_data(
        self, 
        client: TestClient, 
        auth_headers: dict,
        test_user: User,
        test_user_default: UserDefaultIngredient,
        test_ingredient: Ingredient
    ):
        """Test getting list of user defaults with data."""
        response = client.get("/api/users/me/default-ingredients", headers=auth_headers)
        
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["data"]) == 1
        assert data["pagination"]["total_items"] == 1
        assert data["pagination"]["total_pages"] == 1
        
        ingredient_data = data["data"][0]
        assert ingredient_data["ingredient_id"] == str(test_ingredient.id)
        assert ingredient_data["name"] == test_ingredient.name
        assert ingredient_data["unit_type"] == test_ingredient.unit_type.value
        assert "created_at" in ingredient_data

    def test_get_user_defaults_pagination(
        self, 
        client: TestClient, 
        auth_headers: dict,
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
        response = client.get(
            "/api/users/me/default-ingredients?page=1&limit=1",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["data"]) == 1
        assert data["pagination"]["total_items"] == 2
        assert data["pagination"]["total_pages"] == 2
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["limit"] == 1

    def test_get_user_defaults_invalid_pagination(self, client: TestClient, auth_headers: dict):
        """Test error handling for invalid pagination parameters."""
        # Test page < 1
        response = client.get(
            "/api/users/me/default-ingredients?page=0",
            headers=auth_headers
        )
        
        assert response.status_code == 422  # FastAPI validation error
        # Check that the error is about page validation
        assert "page" in str(response.json())
        
        # Test limit > 100
        response = client.get(
            "/api/users/me/default-ingredients?limit=101",
            headers=auth_headers
        )
        
        assert response.status_code == 422  # FastAPI validation error  
        # Check that the error is about limit validation
        assert "limit" in str(response.json())

    def test_add_user_default_success(
        self, 
        client: TestClient, 
        auth_headers: dict,
        test_user: User,
        test_ingredient: Ingredient
    ):
        """Test successfully adding ingredient to defaults."""
        payload = {"ingredient_id": str(test_ingredient.id)}
        
        response = client.post(
            "/api/users/me/default-ingredients",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        
        data = response.json()
        assert data["user_id"] == str(test_user.id)
        assert data["ingredient_id"] == str(test_ingredient.id)
        assert "created_at" in data

    def test_add_user_default_unauthorized(self, client: TestClient, test_ingredient: Ingredient):
        """Test adding ingredient without authentication."""
        payload = {"ingredient_id": str(test_ingredient.id)}
        
        response = client.post("/api/users/me/default-ingredients", json=payload)
        
        assert response.status_code == 403
        assert "detail" in response.json()

    def test_add_user_default_invalid_ingredient_id(self, client: TestClient, auth_headers: dict):
        """Test adding ingredient with invalid ID format."""
        payload = {"ingredient_id": "invalid-uuid"}
        
        response = client.post(
            "/api/users/me/default-ingredients",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 422  # Validation error
        assert "detail" in response.json() or "errors" in response.json()

    def test_add_user_default_ingredient_not_found(self, client: TestClient, auth_headers: dict):
        """Test adding non-existent ingredient."""
        fake_ingredient_id = str(uuid4())
        payload = {"ingredient_id": fake_ingredient_id}
        
        response = client.post(
            "/api/users/me/default-ingredients",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert f"Składnik o ID {fake_ingredient_id} nie istnieje" in response.json()["detail"]

    def test_add_user_default_already_exists(
        self, 
        client: TestClient, 
        auth_headers: dict,
        test_user: User,
        test_ingredient: Ingredient,
        test_user_default: UserDefaultIngredient
    ):
        """Test adding ingredient that's already in defaults."""
        payload = {"ingredient_id": str(test_ingredient.id)}
        
        response = client.post(
            "/api/users/me/default-ingredients",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 409
        assert f"Składnik '{test_ingredient.name}' już jest w domyślnych" in response.json()["detail"]

    def test_add_user_default_missing_body(self, client: TestClient, auth_headers: dict):
        """Test adding ingredient without request body."""
        response = client.post(
            "/api/users/me/default-ingredients",
            headers=auth_headers
        )
        
        assert response.status_code == 422  # Validation error

    def test_remove_user_default_success(
        self, 
        client: TestClient, 
        auth_headers: dict,
        test_user: User,
        test_ingredient: Ingredient,
        test_user_default: UserDefaultIngredient
    ):
        """Test successfully removing ingredient from defaults."""
        response = client.delete(
            f"/api/users/me/default-ingredients/{test_ingredient.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
        assert response.content == b""

    def test_remove_user_default_unauthorized(self, client: TestClient, test_ingredient: Ingredient):
        """Test removing ingredient without authentication."""
        response = client.delete(f"/api/users/me/default-ingredients/{test_ingredient.id}")
        
        assert response.status_code == 403
        assert "detail" in response.json()

    def test_remove_user_default_invalid_ingredient_id(self, client: TestClient, auth_headers: dict):
        """Test removing ingredient with invalid ID format."""
        response = client.delete(
            "/api/users/me/default-ingredients/invalid-uuid",
            headers=auth_headers
        )
        
        assert response.status_code == 422  # Validation error

    def test_remove_user_default_not_found(
        self, 
        client: TestClient, 
        auth_headers: dict,
        test_ingredient: Ingredient
    ):
        """Test removing ingredient that's not in defaults."""
        response = client.delete(
            f"/api/users/me/default-ingredients/{test_ingredient.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "Składnik nie jest w domyślnych użytkownika" in response.json()["detail"]

    def test_remove_user_default_nonexistent_ingredient(self, client: TestClient, auth_headers: dict):
        """Test removing non-existent ingredient."""
        fake_ingredient_id = str(uuid4())
        
        response = client.delete(
            f"/api/users/me/default-ingredients/{fake_ingredient_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "Składnik nie jest w domyślnych użytkownika" in response.json()["detail"]

    def test_user_isolation(
        self, 
        client: TestClient,
        test_ingredient: Ingredient,
        db_session: Session
    ):
        """Test that users can only see/modify their own defaults."""
        # Create two users
        user1 = User(id=uuid4(), email="user1@example.com")
        user2 = User(id=uuid4(), email="user2@example.com")
        
        db_session.add_all([user1, user2])
        db_session.commit()
        
        # Add default for user1
        default1 = UserDefaultIngredient(user_id=user1.id, ingredient_id=test_ingredient.id)
        db_session.add(default1)
        db_session.commit()
        
        # Create tokens for both users
        from backend.utils.jwt_helper import create_test_token
        user1_token = create_test_token(str(user1.id))
        user2_token = create_test_token(str(user2.id))
        
        user1_headers = {"Authorization": f"Bearer {user1_token}"}
        user2_headers = {"Authorization": f"Bearer {user2_token}"}
        
        # User1 should see their default
        response1 = client.get("/api/users/me/default-ingredients", headers=user1_headers)
        assert response1.status_code == 200
        assert len(response1.json()["data"]) == 1
        
        # User2 should see empty list
        response2 = client.get("/api/users/me/default-ingredients", headers=user2_headers)
        assert response2.status_code == 200
        assert len(response2.json()["data"]) == 0
        
        # User2 shouldn't be able to remove user1's default
        response3 = client.delete(
            f"/api/users/me/default-ingredients/{test_ingredient.id}",
            headers=user2_headers
        )
        assert response3.status_code == 404 