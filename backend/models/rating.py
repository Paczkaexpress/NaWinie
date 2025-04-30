from sqlalchemy import Column, Integer, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    rating = Column(Float)  # 1-5 scale
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="ratings")
    recipe = relationship("Recipe", back_populates="ratings") 