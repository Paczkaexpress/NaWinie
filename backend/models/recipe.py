from sqlalchemy import Column, String, Integer, Text, DateTime, Float, ForeignKey, JSON, Enum as SQLEnum, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
import uuid

from ..database import Base

class ComplexityLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class Recipe(Base):
    __tablename__ = "recipes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    preparation_time_minutes = Column(Integer, nullable=False)
    complexity_level = Column(SQLEnum(ComplexityLevel), nullable=False)
    steps = Column(JSON, nullable=False)  # Store as JSON array
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    average_rating = Column(Float, default=0.0)
    total_votes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    author = relationship("User", back_populates="recipes")
    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")
    ratings = relationship("RecipeRating", back_populates="recipe", cascade="all, delete-orphan")
    recipe_views = relationship("RecipeView", back_populates="recipe")

class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.id"), nullable=False)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=False)
    amount = Column(Float, nullable=False)
    is_optional = Column(String, default="false")  # Store as string to match Supabase
    substitute_recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    recipe = relationship("Recipe", back_populates="ingredients")
    ingredient = relationship("Ingredient", back_populates="recipe_ingredients")

class RecipeRating(Base):
    __tablename__ = "recipe_ratings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 scale
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="recipe_ratings")
    recipe = relationship("Recipe", back_populates="ratings")
    
    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='rating_range_check'),
        UniqueConstraint('user_id', 'recipe_id', name='unique_user_recipe_rating'),
    ) 