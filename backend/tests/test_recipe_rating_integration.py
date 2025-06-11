"""
Integration tests for Recipe Rating system.
Tests the complete workflow including average rating calculations.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import uuid
from datetime import datetime

from backend.models.recipe import Recipe, RecipeRating, ComplexityLevel
from backend.models.user import User


class TestRecipeRatingIntegration:
    """Integration tests for complete rating workflow"""
    
    def test_complete_rating_workflow(self, client: TestClient, db_session: Session):
        """Test complete rating workflow with multiple users"""
        # Create multiple users
        users = []
        for i in range(5):
            user = User(
                id=uuid.uuid4(),
                email=f"user{i}@example.com",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            users.append(user)
            db_session.add(user)
        db_session.commit()
        
        # Create author (different from raters)
        author = User(
            id=uuid.uuid4(),
            email="author@example.com",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db_session.add(author)
        db_session.commit()
        
        # Create recipe
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Test Recipe for Rating",
            preparation_time_minutes=45,
            complexity_level=ComplexityLevel.MEDIUM,
            steps=[
                {"step": 1, "description": "First step"},
                {"step": 2, "description": "Second step"}
            ],
            author_id=author.id
        )
        db_session.add(recipe)
        db_session.commit()
        
        # Initial state - no ratings
        response = client.get(f"/api/recipes/{recipe.id}")
        assert response.status_code == 200
        recipe_data = response.json()["data"]
        assert recipe_data["average_rating"] == 0.0
        assert recipe_data["total_votes"] == 0
        
        # Add ratings from different users
        from backend.utils.jwt_helper import create_test_token
        ratings = [5, 4, 3, 4, 5]  # Expected average: 4.2
        
        for i, rating in enumerate(ratings):
            user_token = create_test_token(str(users[i].id))
            headers = {"Authorization": f"Bearer {user_token}"}
            
            rating_data = {"rating": rating}
            response = client.post(f"/api/recipes/{recipe.id}/rate", 
                                 json=rating_data, headers=headers)
            
            assert response.status_code == 200
            data = response.json()
            
            # Check progressive average calculation
            expected_avg = sum(ratings[:i+1]) / (i+1)
            assert abs(data["average_rating"] - expected_avg) < 0.01
            assert data["total_votes"] == i + 1
        
        # Final verification - get recipe details
        response = client.get(f"/api/recipes/{recipe.id}")
        assert response.status_code == 200
        recipe_data = response.json()["data"]
        assert abs(recipe_data["average_rating"] - 4.2) < 0.01
        assert recipe_data["total_votes"] == 5
        
        # Verify all ratings in database
        db_ratings = db_session.query(RecipeRating).filter(
            RecipeRating.recipe_id == recipe.id
        ).all()
        assert len(db_ratings) == 5
        assert {r.rating for r in db_ratings} == {3, 4, 5}
        
        # Verify recipe was updated in database
        db_recipe = db_session.query(Recipe).filter(Recipe.id == recipe.id).first()
        assert abs(db_recipe.average_rating - 4.2) < 0.01
        assert db_recipe.total_votes == 5
    
    def test_rating_precision_and_rounding(self, client: TestClient, db_session: Session):
        """Test that rating calculations maintain proper precision"""
        # Create users
        users = []
        for i in range(3):
            user = User(
                id=uuid.uuid4(),
                email=f"user{i}@example.com",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            users.append(user)
            db_session.add(user)
        db_session.commit()
        
        # Create recipe
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Precision Test Recipe",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.EASY,
            steps=[{"step": 1, "description": "Test step"}],
            author_id=users[0].id
        )
        db_session.add(recipe)
        db_session.commit()
        
        # Add ratings that create non-round average: 1, 2, 3 = 2.0
        from backend.utils.jwt_helper import create_test_token
        ratings = [1, 2, 3]
        
        for i, rating in enumerate(ratings):
            user_token = create_test_token(str(users[i].id))
            headers = {"Authorization": f"Bearer {user_token}"}
            
            rating_data = {"rating": rating}
            response = client.post(f"/api/recipes/{recipe.id}/rate", 
                                 json=rating_data, headers=headers)
            assert response.status_code == 200
        
        # Verify final average is exactly 2.0
        response = client.get(f"/api/recipes/{recipe.id}")
        assert response.status_code == 200
        recipe_data = response.json()["data"]
        assert recipe_data["average_rating"] == 2.0
        assert recipe_data["total_votes"] == 3
    
    def test_rating_with_recipe_list_endpoint(self, client: TestClient, db_session: Session):
        """Test that ratings appear correctly in recipe list"""
        # Create users and recipes
        user1 = User(
            id=uuid.uuid4(),
            email="user1@example.com",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        user2 = User(
            id=uuid.uuid4(),
            email="user2@example.com",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db_session.add_all([user1, user2])
        db_session.commit()
        
        # Create recipes with different ratings
        recipe1 = Recipe(
            id=uuid.uuid4(),
            name="High Rated Recipe",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.EASY,
            steps=[{"step": 1, "description": "Step 1"}],
            author_id=user1.id,
            average_rating=4.5,
            total_votes=10
        )
        recipe2 = Recipe(
            id=uuid.uuid4(),
            name="Low Rated Recipe",
            preparation_time_minutes=60,
            complexity_level=ComplexityLevel.HARD,
            steps=[{"step": 1, "description": "Step 1"}],
            author_id=user2.id,
            average_rating=2.3,
            total_votes=7
        )
        db_session.add_all([recipe1, recipe2])
        db_session.commit()
        
        # Test recipe list shows ratings
        response = client.get("/api/recipes/")
        assert response.status_code == 200
        
        recipes_data = response.json()["data"]
        assert len(recipes_data) == 2
        
        # Find recipes by name and verify ratings
        high_rated = next(r for r in recipes_data if r["name"] == "High Rated Recipe")
        low_rated = next(r for r in recipes_data if r["name"] == "Low Rated Recipe")
        
        assert high_rated["average_rating"] == 4.5
        assert high_rated["total_votes"] == 10
        assert low_rated["average_rating"] == 2.3
        assert low_rated["total_votes"] == 7
    
    def test_rating_sorting_functionality(self, client: TestClient, db_session: Session):
        """Test sorting recipes by rating"""
        # Create user
        user = User(
            id=uuid.uuid4(),
            email="user@example.com",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db_session.add(user)
        db_session.commit()
        
        # Create recipes with known ratings
        recipes = [
            ("Recipe A", 4.8),
            ("Recipe B", 3.2),
            ("Recipe C", 4.1),
            ("Recipe D", 2.9)
        ]
        
        for name, rating in recipes:
            recipe = Recipe(
                id=uuid.uuid4(),
                name=name,
                preparation_time_minutes=30,
                complexity_level=ComplexityLevel.MEDIUM,
                steps=[{"step": 1, "description": "Step 1"}],
                author_id=user.id,
                average_rating=rating,
                total_votes=5
            )
            db_session.add(recipe)
        db_session.commit()
        
        # Test sorting by rating descending (highest first)
        response = client.get("/api/recipes/?sortBy=rating&sortOrder=desc")
        assert response.status_code == 200
        
        recipes_data = response.json()["data"]
        ratings = [r["average_rating"] for r in recipes_data]
        assert ratings == [4.8, 4.1, 3.2, 2.9]  # Descending order
        
        # Test sorting by rating ascending (lowest first)
        response = client.get("/api/recipes/?sortBy=rating&sortOrder=asc")
        assert response.status_code == 200
        
        recipes_data = response.json()["data"]
        ratings = [r["average_rating"] for r in recipes_data]
        assert ratings == [2.9, 3.2, 4.1, 4.8]  # Ascending order
    
    def test_rating_edge_cases(self, client: TestClient, db_session: Session):
        """Test edge cases in rating system"""
        # Create user and recipe
        user = User(
            id=uuid.uuid4(),
            email="user@example.com",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db_session.add(user)
        db_session.commit()
        
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Edge Case Recipe",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.MEDIUM,
            steps=[{"step": 1, "description": "Step 1"}],
            author_id=user.id
        )
        db_session.add(recipe)
        db_session.commit()
        
        from backend.utils.jwt_helper import create_test_token
        user_token = create_test_token(str(user.id))
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Test minimum rating (1)
        response = client.post(f"/api/recipes/{recipe.id}/rate", 
                             json={"rating": 1}, headers=headers)
        assert response.status_code == 200
        assert response.json()["average_rating"] == 1.0
        assert response.json()["total_votes"] == 1
        
        # Verify in recipe details
        response = client.get(f"/api/recipes/{recipe.id}")
        assert response.status_code == 200
        recipe_data = response.json()["data"]
        assert recipe_data["average_rating"] == 1.0
        assert recipe_data["total_votes"] == 1 