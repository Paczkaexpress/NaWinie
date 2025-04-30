from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from backend.database import Base

class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    category = Column(String, index=True)  # e.g., "dairy", "meat", "vegetable"
    is_common = Column(Boolean, default=False)  # for ingredients that are usually available
    
    # Relationships
    recipes = relationship("RecipeIngredient", back_populates="ingredient") 