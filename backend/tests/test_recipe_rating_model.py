"""
Tests for RecipeRating model and database constraints.
"""

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
import uuid
from datetime import datetime

from backend.models.recipe import Recipe, RecipeRating, ComplexityLevel
from backend.models.user import User
from backend.models.ingredient import Ingredient, UnitType


class TestRecipeRatingModel:
    """Tests for RecipeRating model and constraints"""
    
    def test_create_valid_rating(self, db_session: Session, test_user: User):
        """Test creating a valid rating"""
        # Create a test recipe
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Test Recipe",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.MEDIUM,
            steps=[{"step": 1, "description": "Test step"}],
            author_id=test_user.id
        )
        db_session.add(recipe)
        db_session.commit()
        
        # Create a valid rating
        rating = RecipeRating(
            user_id=test_user.id,
            recipe_id=recipe.id,
            rating=4
        )
        db_session.add(rating)
        db_session.commit()
        
        # Verify rating was created
        saved_rating = db_session.query(RecipeRating).filter(
            RecipeRating.user_id == test_user.id,
            RecipeRating.recipe_id == recipe.id
        ).first()
        
        assert saved_rating is not None
        assert saved_rating.rating == 4
        assert saved_rating.user_id == test_user.id
        assert saved_rating.recipe_id == recipe.id
        assert saved_rating.created_at is not None
        assert saved_rating.updated_at is not None
    
    def test_rating_range_constraint_min(self, db_session: Session, test_user: User):
        """Test rating constraint - rating below 1 should fail"""
        # Create a test recipe
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Test Recipe",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.MEDIUM,
            steps=[{"step": 1, "description": "Test step"}],
            author_id=test_user.id
        )
        db_session.add(recipe)
        db_session.commit()
        
        # Try to create rating with value 0 (below minimum)
        rating = RecipeRating(
            user_id=test_user.id,
            recipe_id=recipe.id,
            rating=0
        )
        db_session.add(rating)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_rating_range_constraint_max(self, db_session: Session, test_user: User):
        """Test rating constraint - rating above 5 should fail"""
        # Create a test recipe
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Test Recipe",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.MEDIUM,
            steps=[{"step": 1, "description": "Test step"}],
            author_id=test_user.id
        )
        db_session.add(recipe)
        db_session.commit()
        
        # Try to create rating with value 6 (above maximum)
        rating = RecipeRating(
            user_id=test_user.id,
            recipe_id=recipe.id,
            rating=6
        )
        db_session.add(rating)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_unique_user_recipe_constraint(self, db_session: Session, test_user: User):
        """Test unique constraint - same user cannot rate same recipe twice"""
        # Create a test recipe
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Test Recipe",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.MEDIUM,
            steps=[{"step": 1, "description": "Test step"}],
            author_id=test_user.id
        )
        db_session.add(recipe)
        db_session.commit()
        
        # Create first rating
        rating1 = RecipeRating(
            user_id=test_user.id,
            recipe_id=recipe.id,
            rating=4
        )
        db_session.add(rating1)
        db_session.commit()
        
        # Try to create second rating for same user and recipe
        rating2 = RecipeRating(
            user_id=test_user.id,
            recipe_id=recipe.id,
            rating=5
        )
        db_session.add(rating2)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_different_users_can_rate_same_recipe(self, db_session: Session, test_user: User):
        """Test that different users can rate the same recipe"""
        # Create another user
        other_user = User(
            id=uuid.uuid4(),
            email="other@example.com",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db_session.add(other_user)
        
        # Create a test recipe
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Test Recipe",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.MEDIUM,
            steps=[{"step": 1, "description": "Test step"}],
            author_id=test_user.id
        )
        db_session.add(recipe)
        db_session.commit()
        
        # Create rating from first user
        rating1 = RecipeRating(
            user_id=test_user.id,
            recipe_id=recipe.id,
            rating=4
        )
        db_session.add(rating1)
        
        # Create rating from second user
        rating2 = RecipeRating(
            user_id=other_user.id,
            recipe_id=recipe.id,
            rating=5
        )
        db_session.add(rating2)
        db_session.commit()
        
        # Verify both ratings exist
        ratings = db_session.query(RecipeRating).filter(
            RecipeRating.recipe_id == recipe.id
        ).all()
        
        assert len(ratings) == 2
        assert {r.rating for r in ratings} == {4, 5}
        assert {r.user_id for r in ratings} == {test_user.id, other_user.id}
    
    def test_rating_relationships(self, db_session: Session, test_user: User):
        """Test that relationships work correctly"""
        # Create a test recipe
        recipe = Recipe(
            id=uuid.uuid4(),
            name="Test Recipe",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.MEDIUM,
            steps=[{"step": 1, "description": "Test step"}],
            author_id=test_user.id
        )
        db_session.add(recipe)
        db_session.commit()
        
        # Create a rating
        rating = RecipeRating(
            user_id=test_user.id,
            recipe_id=recipe.id,
            rating=4
        )
        db_session.add(rating)
        db_session.commit()
        
        # Test relationships
        assert rating.user == test_user
        assert rating.recipe == recipe
        assert rating in recipe.ratings
        assert rating in test_user.recipe_ratings
    
    def test_valid_rating_boundaries(self, db_session: Session, test_user: User):
        """Test that ratings of 1 and 5 (boundaries) are valid"""
        # Create test recipes
        recipe1 = Recipe(
            id=uuid.uuid4(),
            name="Test Recipe 1",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.MEDIUM,
            steps=[{"step": 1, "description": "Test step"}],
            author_id=test_user.id
        )
        recipe2 = Recipe(
            id=uuid.uuid4(),
            name="Test Recipe 2",
            preparation_time_minutes=30,
            complexity_level=ComplexityLevel.MEDIUM,
            steps=[{"step": 1, "description": "Test step"}],
            author_id=test_user.id
        )
        db_session.add_all([recipe1, recipe2])
        db_session.commit()
        
        # Create another user for second rating
        other_user = User(
            id=uuid.uuid4(),
            email="other@example.com",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db_session.add(other_user)
        db_session.commit()
        
        # Create ratings with boundary values
        rating_min = RecipeRating(
            user_id=test_user.id,
            recipe_id=recipe1.id,
            rating=1  # Minimum valid rating
        )
        rating_max = RecipeRating(
            user_id=other_user.id,
            recipe_id=recipe2.id,
            rating=5  # Maximum valid rating
        )
        
        db_session.add_all([rating_min, rating_max])
        db_session.commit()
        
        # Verify both ratings were saved
        saved_ratings = db_session.query(RecipeRating).all()
        assert len(saved_ratings) == 2
        assert {r.rating for r in saved_ratings} == {1, 5} 