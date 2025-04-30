from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    instructions = Column(Text)
    difficulty = Column(Integer)  # 1-5 scale
    preparation_time = Column(Integer)  # in minutes
    created_at = Column(DateTime, default=datetime.utcnow)
    author_id = Column(Integer, ForeignKey("users.id"))
    average_rating = Column(Float, default=0.0)
    
    # Relationships
    author = relationship("User", back_populates="recipes")
    ingredients = relationship("RecipeIngredient", back_populates="recipe")
    ratings = relationship("Rating", back_populates="recipe")

class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"))
    amount = Column(Float)
    unit = Column(String)
    
    # Relationships
    recipe = relationship("Recipe", back_populates="ingredients")
    ingredient = relationship("Ingredient", back_populates="recipes") 