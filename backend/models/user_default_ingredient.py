from sqlalchemy import Column, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from backend.database import Base

class UserDefaultIngredient(Base):
    __tablename__ = "user_default_ingredients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="default_ingredients")
    ingredient = relationship("Ingredient")
    
    # Unique constraint to prevent duplicates
    __table_args__ = (
        Index('idx_user_ingredient_unique', 'user_id', 'ingredient_id', unique=True),
        Index('idx_user_default_ingredients_user_id', 'user_id'),
    ) 