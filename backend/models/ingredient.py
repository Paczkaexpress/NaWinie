from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum
from ..database import Base

class UnitType(enum.Enum):
    ML = "ml"
    G = "g"
    SZT = "szt"

class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    unit_type = Column(Enum(UnitType), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships (commented out until models are implemented)
    # recipe_ingredients = relationship("RecipeIngredient", back_populates="ingredient")
    # popularity = relationship("IngredientPopularity", back_populates="ingredient", uselist=False) 