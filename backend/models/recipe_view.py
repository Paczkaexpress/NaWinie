from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class RecipeView(Base):
    """Model reprezentujący rekordy przeglądania przepisów przez użytkowników."""
    __tablename__ = "recipe_views"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    recipe_id = Column(String, ForeignKey("recipes.id"), nullable=False, index=True)
    view_start = Column(DateTime, nullable=False, default=datetime.utcnow)
    view_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="recipe_views")
    recipe = relationship("Recipe", back_populates="recipe_views") 