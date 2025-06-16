"""
Tests for Recipe API endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import uuid
from datetime import datetime

from backend.models.recipe import Recipe, RecipeIngredient, RecipeRating, ComplexityLevel
from backend.models.ingredient import Ingredient, UnitType
from backend.models.user import User


class TestRecipeListEndpoint:
    """Tests for GET /api/recipes endpoint"""
    
    def test_get_recipes_empty_list(self, client: TestClient, db_session: Session):
        """Test getting recipes when database is empty"""
        response = client.get("/api/recipes/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["data"] == []
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["limit"] == 10
        assert data["pagination"]["total_items"] == 0
        assert data["pagination"]["total_pages"] == 0
    
    def test_get_recipes_with_data(self, client: TestClient, db_session: Session, test_user: User):
        """Test getting recipes with sample data"""
        # Create test recipes
        recipe1 = Recipe(
            id=uuid.uuid4(),
            name="Easy Pasta",
            preparation_time_minutes=15,
            complexity_level=ComplexityLevel.EASY,
            steps=[{"step": 1, "description": "Boil water"}],
            author_id=test_user.id,
            average_rating=4.5,
            total_votes=10
        )
        recipe2 = Recipe(
            id=uuid.uuid4(),
            name="Complex Soup",
            preparation_time_minutes=45,
            complexity_level=ComplexityLevel.HARD,
            steps=[{"step": 1, "description": "Prepare ingredients"}],
            author_id=test_user.id,
            average_rating=3.8,
            total_votes=5
        )
        
        db_session.add_all([recipe1, recipe2])
        db_session.commit()
        
        response = client.get("/api/recipes/")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 2
        assert data["pagination"]["total_items"] == 2
        assert data["pagination"]["total_pages"] == 1
        
        # Check recipe data structure
        recipe_data = data["data"][0]
        assert "id" in recipe_data
        assert "name" in recipe_data
        assert "preparation_time_minutes" in recipe_data
        assert "complexity_level" in recipe_data
        assert "author_id" in recipe_data
        assert "average_rating" in recipe_data
        assert "total_votes" in recipe_data
    
    def test_get_recipes_pagination(self, client: TestClient, db_session: Session, test_user: User):
        """Test pagination functionality"""
        # Create 15 test recipes
        recipes = []
        for i in range(15):
            recipe = Recipe(
                id=uuid.uuid4(),
                name=f"Recipe {i+1}",
                preparation_time_minutes=10 + i,
                complexity_level=ComplexityLevel.EASY,
                steps=[{"step": 1, "description": f"Step for recipe {i+1}"}],
                author_id=test_user.id
            )
            recipes.append(recipe)
        
        db_session.add_all(recipes)
        db_session.commit()
        
        # Test first page
        response = client.get("/api/recipes/?page=1&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 5
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["limit"] == 5
        assert data["pagination"]["total_items"] == 15
        assert data["pagination"]["total_pages"] == 3
        
        # Test second page
        response = client.get("/api/recipes/?page=2&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 5
        assert data["pagination"]["page"] == 2
        
        # Test last page
        response = client.get("/api/recipes/?page=3&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 5
        assert data["pagination"]["page"] == 3
    
    def test_get_recipes_filter_by_complexity(self, client: TestClient, db_session: Session, test_user: User):
        """Test filtering by complexity level"""
        # Create recipes with different complexity levels
        EASY_recipe = Recipe(
            id=uuid.uuid4(),
            name="Easy Recipe",
            preparation_time_minutes=15,
            complexity_level=ComplexityLevel.EASY,
            steps=[{"step": 1, "description": "Easy step"}],
            author_id=test_user.id
        )
        HARD_recipe = Recipe(
            id=uuid.uuid4(),
            name="Hard Recipe",
            preparation_time_minutes=60,
            complexity_level=ComplexityLevel.HARD,
            steps=[{"step": 1, "description": "Hard step"}],
            author_id=test_user.id
        )
        
        db_session.add_all([EASY_recipe, HARD_recipe])
        db_session.commit()
        
        # Test filter by EASY
        response = client.get("/api/recipes/?complexity=EASY")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 1
        assert data["data"][0]["complexity_level"] == "EASY"
        
        # Test filter by HARD
        response = client.get("/api/recipes/?complexity=HARD")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 1
        assert data["data"][0]["complexity_level"] == "HARD"


class TestRecipeCreateEndpoint:
    """Tests for POST /api/recipes endpoint"""
    
    def test_create_recipe_success(self, client: TestClient, db_session: Session, test_user: User, auth_headers: dict):
        """Test successful recipe creation"""
        # Create test ingredient
        ingredient = Ingredient(
            id=uuid.uuid4(),
            name="Test Ingredient",
            unit_type=UnitType.G
        )
        db_session.add(ingredient)
        db_session.commit()
        
        recipe_data = {
            "name": "Test Recipe",
            "preparation_time_minutes": 30,
            "complexity_level": "MEDIUM",
            "steps": [
                {"step": 1, "description": "First step"},
                {"step": 2, "description": "Second step"}
            ],
            "ingredients": [
                {
                    "ingredient_id": str(ingredient.id),
                    "amount": 100.0,
                    "is_optional": False,
                    "substitute_recommendation": "Can use similar ingredient"
                }
            ]
        }
        
        response = client.post("/api/recipes/", json=recipe_data, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.json()
        recipe_response = data["data"]
        
        assert recipe_response["name"] == "Test Recipe"
        assert recipe_response["preparation_time_minutes"] == 30
        assert recipe_response["complexity_level"] == "MEDIUM"
        assert len(recipe_response["steps"]) == 2
        assert len(recipe_response["ingredients"]) == 1
        assert recipe_response["author_id"] == str(test_user.id)
        assert recipe_response["average_rating"] == 0.0
        assert recipe_response["total_votes"] == 0
    
    def test_create_recipe_unauthorized(self, client: TestClient, db_session: Session):
        """Test recipe creation without authentication"""
        recipe_data = {
            "name": "Test Recipe",
            "preparation_time_minutes": 30,
            "complexity_level": "EASY",
            "steps": [{"step": 1, "description": "Step 1"}],
            "ingredients": []
        }
        
        response = client.post("/api/recipes/", json=recipe_data)
        assert response.status_code == 403  # No Authorization header
    
    def test_create_recipe_invalid_ingredient(self, client: TestClient, db_session: Session, test_user: User, auth_headers: dict):
        """Test recipe creation with non-existent ingredient"""
        non_existent_ingredient_id = uuid.uuid4()
        
        recipe_data = {
            "name": "Test Recipe",
            "preparation_time_minutes": 30,
            "complexity_level": "EASY",
            "steps": [{"step": 1, "description": "Step 1"}],
            "ingredients": [
                {
                    "ingredient_id": str(non_existent_ingredient_id),
                    "amount": 100.0,
                    "is_optional": False
                }
            ]
        }
        
        response = client.post("/api/recipes/", json=recipe_data, headers=auth_headers)
        assert response.status_code == 400
        assert "Invalid ingredient IDs" in response.json()["detail"]
    
    def test_create_recipe_validation_errors(self, client: TestClient, test_user: User, auth_headers: dict):
        """Test various validation errors"""
        # Empty name
        recipe_data = {
            "name": "",
            "preparation_time_minutes": 30,
            "complexity_level": "EASY",
            "steps": [{"step": 1, "description": "Step 1"}],
            "ingredients": []
        }
        response = client.post("/api/recipes/", json=recipe_data, headers=auth_headers)
        assert response.status_code == 422
        
        # Invalid preparation time
        recipe_data = {
            "name": "Valid Name",
            "preparation_time_minutes": 0,
            "complexity_level": "EASY",
            "steps": [{"step": 1, "description": "Step 1"}],
            "ingredients": []
        }
        response = client.post("/api/recipes/", json=recipe_data, headers=auth_headers)
        assert response.status_code == 422
        
        # Invalid complexity level
        recipe_data = {
            "name": "Valid Name",
            "preparation_time_minutes": 30,
            "complexity_level": "invalid",
            "steps": [{"step": 1, "description": "Step 1"}],
            "ingredients": []
        }
        response = client.post("/api/recipes/", json=recipe_data, headers=auth_headers)
        assert response.status_code == 422
        
        # Empty steps
        recipe_data = {
            "name": "Valid Name",
            "preparation_time_minutes": 30,
            "complexity_level": "EASY",
            "steps": [],
            "ingredients": []
        }
        response = client.post("/api/recipes/", json=recipe_data, headers=auth_headers)
        assert response.status_code == 422


class TestRecipeDetailEndpoint:
    """Tests for GET /api/recipes/{recipe_id} endpoint"""
    
    def test_get_recipe_by_id_success(self, client: TestClient, db_session: Session, test_user: User):
        """Test getting recipe details by ID"""
        # Create test ingredient
        ingredient = Ingredient(
            id=uuid.uuid4(),
            name="Test Ingredient",
            unit_type=UnitType.G
        )
        db_session.add(ingredient)
        db_session.commit()
        
        # Create test recipe
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Test Recipe",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.MEDIUM,
            steps=[
                {"step": 1, "description": "First step"},
                {"step": 2, "description": "Second step"}
            ],
            author_id=test_user.id,
            average_rating=4.2,
            total_votes=8
        )
        db_session.add(recipe)
        db_session.commit()
        
        # Create recipe ingredient
        recipe_ingredient = RecipeIngredient(
            id=uuid.uuid4(),
            recipe_id=recipe.id,
            ingredient_id=ingredient.id,
            amount=100.0,
            is_optional="false",
            substitute_recommendation="Can use similar ingredient"
        )
        db_session.add(recipe_ingredient)
        db_session.commit()
        
        response = client.get(f"/api/recipes/{recipe.id}")
        
        assert response.status_code == 200
        data = response.json()
        recipe_data = data["data"]
        
        assert recipe_data["id"] == str(recipe.id)
        assert recipe_data["name"] == "Test Recipe"
        assert recipe_data["preparation_time_minutes"] == 30
        assert recipe_data["complexity_level"] == "MEDIUM"
        assert len(recipe_data["steps"]) == 2
        assert recipe_data["steps"][0]["step"] == 1
        assert recipe_data["steps"][0]["description"] == "First step"
        assert len(recipe_data["ingredients"]) == 1
        assert recipe_data["ingredients"][0]["name"] == "Test Ingredient"
        assert recipe_data["ingredients"][0]["amount"] == 100.0
        assert recipe_data["average_rating"] == 4.2
        assert recipe_data["total_votes"] == 8
    
    def test_get_recipe_by_id_not_found(self, client: TestClient):
        """Test getting non-existent recipe"""
        non_existent_id = uuid.uuid4()
        response = client.get(f"/api/recipes/{non_existent_id}")
        
        assert response.status_code == 404
        assert "Recipe not found" in response.json()["detail"]
    
    def test_get_recipe_by_id_invalid_uuid(self, client: TestClient):
        """Test getting recipe with invalid UUID"""
        response = client.get("/api/recipes/invalid-uuid")
        
        assert response.status_code == 422


class TestRecipeUpdateEndpoint:
    """Tests for PUT /api/recipes/{recipe_id} endpoint"""
    
    def test_update_recipe_success(self, client: TestClient, db_session: Session, test_user: User, auth_headers: dict):
        """Test successful recipe update"""
        # Create test recipe
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Original Recipe",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.EASY,
            steps=[{"step": 1, "description": "Original step"}],
            author_id=test_user.id
        )
        db_session.add(recipe)
        db_session.commit()
        
        update_data = {
            "name": "Updated Recipe",
            "preparation_time_minutes": 45,
            "complexity_level": "MEDIUM"
        }
        
        response = client.put(f"/api/recipes/{recipe.id}", json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        recipe_data = data["data"]
        
        assert recipe_data["name"] == "Updated Recipe"
        assert recipe_data["preparation_time_minutes"] == 45
        assert recipe_data["complexity_level"] == "MEDIUM"
    
    def test_update_recipe_unauthorized(self, client: TestClient, db_session: Session, test_user: User):
        """Test recipe update without authentication"""
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Test Recipe",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.EASY,
            steps=[{"step": 1, "description": "Step 1"}],
            author_id=test_user.id
        )
        db_session.add(recipe)
        db_session.commit()
        
        update_data = {"name": "Updated Recipe"}
        
        response = client.put(f"/api/recipes/{recipe.id}", json=update_data)
        assert response.status_code == 403
    
    def test_update_recipe_not_owner(self, client: TestClient, db_session: Session, test_user: User):
        """Test recipe update by non-owner"""
        # Create another user
        other_user = User(
            id=uuid.uuid4(),
            email="other@example.com",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db_session.add(other_user)
        db_session.commit()
        
        # Create recipe owned by other user
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Other User Recipe",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.EASY,
            steps=[{"step": 1, "description": "Step 1"}],
            author_id=other_user.id
        )
        db_session.add(recipe)
        db_session.commit()
        
        # Try to update with different user token
        from backend.utils.jwt_helper import create_test_token
        different_user_token = create_test_token(str(test_user.id))
        headers = {"Authorization": f"Bearer {different_user_token}"}
        
        update_data = {"name": "Updated Recipe"}
        response = client.put(f"/api/recipes/{recipe.id}", json=update_data, headers=headers)
        assert response.status_code == 404  # Recipe not found or access denied


class TestRecipeRatingEndpoint:
    """Tests for POST /api/recipes/{recipe_id}/rate endpoint"""
    
    def test_rate_recipe_success(self, client: TestClient, db_session: Session, test_user: User, auth_headers: dict):
        """Test successful recipe rating"""
        # Create test recipe
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Test Recipe",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.EASY,
            steps=[{"step": 1, "description": "Step 1"}],
            author_id=test_user.id,
            average_rating=0.0,
            total_votes=0
        )
        db_session.add(recipe)
        db_session.commit()
        
        rating_data = {"rating": 5}
        
        response = client.post(f"/api/recipes/{recipe.id}/rate", json=rating_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["average_rating"] == 5.0
        assert data["total_votes"] == 1
    
    def test_rate_recipe_unauthorized(self, client: TestClient, db_session: Session, test_user: User):
        """Test rating without authentication"""
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Test Recipe",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.EASY,
            steps=[{"step": 1, "description": "Step 1"}],
            author_id=test_user.id
        )
        db_session.add(recipe)
        db_session.commit()
        
        rating_data = {"rating": 5}
        
        response = client.post(f"/api/recipes/{recipe.id}/rate", json=rating_data)
        assert response.status_code == 403
    
    def test_rate_recipe_invalid_rating(self, client: TestClient, db_session: Session, test_user: User, auth_headers: dict):
        """Test rating with invalid rating value"""
        # Create test recipe
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Test Recipe",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.EASY,
            steps=[{"step": 1, "description": "Step 1"}],
            author_id=test_user.id
        )
        db_session.add(recipe)
        db_session.commit()
        
        # Test invalid rating (too high)
        rating_data = {"rating": 6}
        response = client.post(f"/api/recipes/{recipe.id}/rate", json=rating_data, headers=auth_headers)
        assert response.status_code == 422  # Pydantic validation error
        
        # Test invalid rating (too low)
        rating_data = {"rating": 0}
        response = client.post(f"/api/recipes/{recipe.id}/rate", json=rating_data, headers=auth_headers)
        assert response.status_code == 422  # Pydantic validation error

    def test_rate_recipe_duplicate_rating(self, client: TestClient, db_session: Session, test_user: User, auth_headers: dict):
        """Test that user cannot rate same recipe twice"""
        # Create test recipe
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Test Recipe",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.EASY,
            steps=[{"step": 1, "description": "Step 1"}],
            author_id=test_user.id
        )
        db_session.add(recipe)
        db_session.commit()
        
        # First rating should succeed
        rating_data = {"rating": 4}
        response = client.post(f"/api/recipes/{recipe.id}/rate", json=rating_data, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["average_rating"] == 4.0
        assert response.json()["total_votes"] == 1
        
        # Second rating should fail
        rating_data = {"rating": 5}
        response = client.post(f"/api/recipes/{recipe.id}/rate", json=rating_data, headers=auth_headers)
        assert response.status_code == 409  # Conflict
        assert "already rated" in response.json()["detail"]


class TestRecipeFindByIngredientsEndpoint:
    """Tests for GET /api/recipes/find-by-ingredients endpoint"""
    
    def test_find_recipes_by_ingredients_success(self, client: TestClient, db_session: Session, test_user: User):
        """Test successful recipe search by ingredients"""
        # Create test ingredients
        ingredient1 = Ingredient(id=uuid.uuid4(), name="Flour", unit_type=UnitType.G)
        ingredient2 = Ingredient(id=uuid.uuid4(), name="Sugar", unit_type=UnitType.G)
        ingredient3 = Ingredient(id=uuid.uuid4(), name="Eggs", unit_type=UnitType.SZT)
        db_session.add_all([ingredient1, ingredient2, ingredient3])
        db_session.commit()
        
        # Create test recipes
        recipe1 = Recipe(
            id=uuid.uuid4(),
            name="Cake",
            preparation_time_minutes=60,
            complexity_level=ComplexityLevel.MEDIUM,
            steps=[{"step": 1, "description": "Mix ingredients"}],
            author_id=test_user.id
        )
        recipe2 = Recipe(
            id=uuid.uuid4(),
            name="Bread",
            preparation_time_minutes=90,
            complexity_level=ComplexityLevel.HARD,
            steps=[{"step": 1, "description": "Knead dough"}],
            author_id=test_user.id
        )
        db_session.add_all([recipe1, recipe2])
        db_session.commit()
        
        # Add recipe ingredients
        # Recipe1 uses flour and sugar
        recipe1_ingredients = [
            RecipeIngredient(id=uuid.uuid4(), recipe_id=recipe1.id, ingredient_id=ingredient1.id, amount=200.0, is_optional="false"),
            RecipeIngredient(id=uuid.uuid4(), recipe_id=recipe1.id, ingredient_id=ingredient2.id, amount=100.0, is_optional="false")
        ]
        # Recipe2 uses only flour
        recipe2_ingredients = [
            RecipeIngredient(id=uuid.uuid4(), recipe_id=recipe2.id, ingredient_id=ingredient1.id, amount=300.0, is_optional="false")
        ]
        db_session.add_all(recipe1_ingredients + recipe2_ingredients)
        db_session.commit()
        
        # Search for recipes with flour and sugar
        ingredient_ids = f"{ingredient1.id},{ingredient2.id}"
        response = client.get(f"/api/recipes/find-by-ingredients?ingredientIds={ingredient_ids}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return both recipes, with recipe1 first (more matches)
        assert len(data["data"]) == 2
        assert data["data"][0]["name"] == "Cake"  # Should be first due to more ingredient matches
        assert data["data"][1]["name"] == "Bread"
    
    def test_find_recipes_by_ingredients_single_ingredient(self, client: TestClient, db_session: Session, test_user: User):
        """Test search with single ingredient"""
        # Create test ingredient
        ingredient = Ingredient(id=uuid.uuid4(), name="Tomato", unit_type=UnitType.SZT)
        db_session.add(ingredient)
        db_session.commit()
        
        # Create recipe with this ingredient
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Tomato Soup",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.EASY,
            steps=[{"step": 1, "description": "Cook tomatoes"}],
            author_id=test_user.id
        )
        db_session.add(recipe)
        db_session.commit()
        
        recipe_ingredient = RecipeIngredient(
            id=uuid.uuid4(),
            recipe_id=recipe.id,
            ingredient_id=ingredient.id,
            amount=5.0,
            is_optional="false"
        )
        db_session.add(recipe_ingredient)
        db_session.commit()
        
        response = client.get(f"/api/recipes/find-by-ingredients?ingredientIds={ingredient.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 1
        assert data["data"][0]["name"] == "Tomato Soup"
    
    def test_find_recipes_by_ingredients_no_matches(self, client: TestClient, db_session: Session):
        """Test search with ingredients that don't match any recipes"""
        # Create ingredient that's not used in any recipe
        ingredient = Ingredient(id=uuid.uuid4(), name="Rare Spice", unit_type=UnitType.G)
        db_session.add(ingredient)
        db_session.commit()
        
        response = client.get(f"/api/recipes/find-by-ingredients?ingredientIds={ingredient.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 0
    
    def test_find_recipes_by_ingredients_invalid_uuid(self, client: TestClient):
        """Test search with invalid UUID format"""
        response = client.get("/api/recipes/find-by-ingredients?ingredientIds=invalid-uuid")
        
        assert response.status_code == 400
        assert "Invalid UUID format" in response.json()["detail"]
    
    def test_find_recipes_by_ingredients_nonexistent_ingredient(self, client: TestClient):
        """Test search with non-existent ingredient ID"""
        non_existent_id = uuid.uuid4()
        response = client.get(f"/api/recipes/find-by-ingredients?ingredientIds={non_existent_id}")
        
        assert response.status_code == 400
        assert "Invalid ingredient IDs" in response.json()["detail"]
    
    def test_find_recipes_by_ingredients_empty_list(self, client: TestClient):
        """Test search with empty ingredient list"""
        response = client.get("/api/recipes/find-by-ingredients?ingredientIds=")
        
        assert response.status_code == 400
        assert "Invalid UUID format" in response.json()["detail"]
    
    def test_find_recipes_by_ingredients_mixed_valid_invalid(self, client: TestClient, db_session: Session):
        """Test search with mix of valid and invalid ingredient IDs"""
        # Create one valid ingredient
        valid_ingredient = Ingredient(id=uuid.uuid4(), name="Valid Ingredient", unit_type=UnitType.G)
        db_session.add(valid_ingredient)
        db_session.commit()
        
        # Mix valid and invalid IDs
        invalid_id = uuid.uuid4()
        ingredient_ids = f"{valid_ingredient.id},{invalid_id}"
        
        response = client.get(f"/api/recipes/find-by-ingredients?ingredientIds={ingredient_ids}")
        
        assert response.status_code == 400
        assert "Invalid ingredient IDs" in response.json()["detail"]
    
    def test_find_recipes_by_ingredients_with_auth(self, client: TestClient, db_session: Session, test_user: User, auth_headers: dict):
        """Test search with authentication (should work the same but may trigger background tasks)"""
        # Create test ingredient
        ingredient = Ingredient(id=uuid.uuid4(), name="Test Ingredient", unit_type=UnitType.G)
        db_session.add(ingredient)
        db_session.commit()
        
        # Create recipe
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Auth Test Recipe",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.EASY,
            steps=[{"step": 1, "description": "Test step"}],
            author_id=test_user.id
        )
        db_session.add(recipe)
        db_session.commit()
        
        recipe_ingredient = RecipeIngredient(
            id=uuid.uuid4(),
            recipe_id=recipe.id,
            ingredient_id=ingredient.id,
            amount=100.0,
            is_optional="false"
        )
        db_session.add(recipe_ingredient)
        db_session.commit()
        
        response = client.get(
            f"/api/recipes/find-by-ingredients?ingredientIds={ingredient.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 1
        assert data["data"][0]["name"] == "Auth Test Recipe"


class TestRecipeDeleteEndpoint:
    """Tests for DELETE /api/recipes/{recipe_id} endpoint"""
    
    def test_delete_recipe_success(self, client: TestClient, db_session: Session, test_user: User, auth_headers: dict):
        """Test successful recipe deletion"""
        # Create test recipe
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Recipe to Delete",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.EASY,
            steps=[{"step": 1, "description": "Step 1"}],
            author_id=test_user.id
        )
        db_session.add(recipe)
        db_session.commit()
        
        response = client.delete(f"/api/recipes/{recipe.id}", headers=auth_headers)
        
        assert response.status_code == 204
        
        # Verify recipe is deleted
        deleted_recipe = db_session.query(Recipe).filter(Recipe.id == recipe.id).first()
        assert deleted_recipe is None
    
    def test_delete_recipe_unauthorized(self, client: TestClient, db_session: Session, test_user: User):
        """Test recipe deletion without authentication"""
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Recipe to Delete",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.EASY,
            steps=[{"step": 1, "description": "Step 1"}],
            author_id=test_user.id
        )
        db_session.add(recipe)
        db_session.commit()
        
        response = client.delete(f"/api/recipes/{recipe.id}")
        assert response.status_code == 403
    
    def test_delete_recipe_not_owner(self, client: TestClient, db_session: Session, test_user: User):
        """Test recipe deletion by non-owner"""
        # Create another user
        other_user = User(
            id=uuid.uuid4(),
            email="other@example.com",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db_session.add(other_user)
        db_session.commit()
        
        # Create recipe owned by other user
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Other User Recipe",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.EASY,
            steps=[{"step": 1, "description": "Step 1"}],
            author_id=other_user.id
        )
        db_session.add(recipe)
        db_session.commit()
        
        # Try to delete with different user token
        from backend.utils.jwt_helper import create_test_token
        different_user_token = create_test_token(str(test_user.id))
        headers = {"Authorization": f"Bearer {different_user_token}"}
        
        response = client.delete(f"/api/recipes/{recipe.id}", headers=headers)
        assert response.status_code == 404  # Recipe not found or access denied
    
    def test_delete_recipe_not_found(self, client: TestClient, test_user: User, auth_headers: dict):
        """Test deletion of non-existent recipe"""
        non_existent_id = uuid.uuid4()
        response = client.delete(f"/api/recipes/{non_existent_id}", headers=auth_headers)
        
        assert response.status_code == 404


class TestRecipeValidation:
    """Tests for recipe API validation and edge cases"""
    
    def test_recipe_list_validation_edge_cases(self, client: TestClient):
        """Test edge cases for recipe list validation"""
        # Test maximum limit
        response = client.get("/api/recipes/?limit=100")
        assert response.status_code == 200
        
        # Test valid UUID format for authorId
        valid_uuid = str(uuid.uuid4())
        response = client.get(f"/api/recipes/?authorId={valid_uuid}")
        assert response.status_code == 200
        
        # Test invalid UUID format for authorId
        response = client.get("/api/recipes/?authorId=invalid-uuid")
        assert response.status_code == 422
    
    def test_recipe_api_missing_parameters(self, client: TestClient):
        """Test API calls with missing required parameters"""
        # Missing ingredientIds parameter
        response = client.get("/api/recipes/find-by-ingredients")
        assert response.status_code == 422
    
    def test_recipe_complex_sorting_and_filtering(self, client: TestClient, db_session: Session, test_user: User):
        """Test complex combinations of sorting and filtering"""
        # Create recipes with various attributes
        recipes = [
            Recipe(
                id=uuid.uuid4(),
                name="A Easy Quick",
                preparation_time_minutes=10,
                complexity_level=ComplexityLevel.EASY,
                steps=[{"step": 1, "description": "Quick step"}],
                author_id=test_user.id,
                average_rating=3.0
            ),
            Recipe(
                id=uuid.uuid4(),
                name="B Medium Slow",
                preparation_time_minutes=60,
                complexity_level=ComplexityLevel.MEDIUM,
                steps=[{"step": 1, "description": "Slow step"}],
                author_id=test_user.id,
                average_rating=4.5
            ),
            Recipe(
                id=uuid.uuid4(),
                name="C Hard Fast",
                preparation_time_minutes=20,
                complexity_level=ComplexityLevel.HARD,
                steps=[{"step": 1, "description": "Fast step"}],
                author_id=test_user.id,
                average_rating=5.0
            )
        ]
        db_session.add_all(recipes)
        db_session.commit()
        
        # Test filter by MEDIUM complexity, sort by prep time ascending
        response = client.get("/api/recipes/?complexity=MEDIUM&sortBy=prep_time&sortOrder=asc")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 1
        assert data["data"][0]["complexity_level"] == "MEDIUM"
        
        # Test sort by rating descending
        response = client.get("/api/recipes/?sortBy=rating&sortOrder=desc")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 3
        assert data["data"][0]["average_rating"] == 5.0
        assert data["data"][1]["average_rating"] == 4.5
        assert data["data"][2]["average_rating"] == 3.0 
