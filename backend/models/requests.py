from pydantic import BaseModel, Field, validator, field_validator
from enum import Enum
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class UnitType(str, Enum):
    ML = "ml"
    G = "g"
    SZT = "szt"

class CreateIngredientRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Nazwa składnika")
    unit_type: UnitType = Field(..., description="Typ jednostki miary")
    
    @validator('name')
    def validate_name(cls, v):
        v = v.strip()
        if not v:
            raise ValueError('Nazwa składnika nie może być pusta')
        return v.title()  # Capitalize first letter

class IngredientQueryParams(BaseModel):
    page: int = Field(default=1, ge=1, description="Numer strony")
    limit: int = Field(default=20, ge=1, le=100, description="Liczba elementów na stronę")
    search: Optional[str] = Field(default=None, max_length=100, description="Wyszukiwanie po nazwie")
    sortBy: Optional[str] = Field(default="name", pattern="^(name|unit_type|created_at)$")
    sortOrder: Optional[str] = Field(default="asc", pattern="^(asc|desc)$")

class AddUserDefaultIngredientCommand(BaseModel):
    ingredient_id: UUID = Field(..., description="ID składnika do dodania do domyślnych")
    
    class Config:
        schema_extra = {
            "example": {
                "ingredient_id": "123e4567-e89b-12d3-a456-426614174000"
            }
        }

# === Recipe Request Models ===

class ComplexityLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class SortField(str, Enum):
    NAME = "name"
    RATING = "rating"
    PREP_TIME = "prep_time"
    CREATED_AT = "created_at"

class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"

class RecipeStepModel(BaseModel):
    step: int = Field(..., ge=1)
    description: str = Field(..., min_length=1)

class RecipeIngredientModel(BaseModel):
    ingredient_id: UUID
    amount: float = Field(..., gt=0)
    is_optional: bool = Field(default=False)
    substitute_recommendation: Optional[str] = None

class RecipeListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=10, ge=1, le=100)
    complexity: Optional[ComplexityLevel] = None
    authorId: Optional[UUID] = None
    sortBy: Optional[SortField] = Field(default=SortField.CREATED_AT)
    sortOrder: Optional[SortOrder] = Field(default=SortOrder.DESC)

class FindByIngredientsQuery(BaseModel):
    ingredientIds: str = Field(..., description="Comma-separated UUIDs")
    
    @field_validator('ingredientIds')
    @classmethod
    def validate_ingredient_ids(cls, v):
        try:
            ids = [UUID(id.strip()) for id in v.split(',') if id.strip()]
            if not ids:
                raise ValueError("At least one ingredient ID is required")
            return v
        except ValueError:
            raise ValueError("Invalid UUID format in ingredientIds")

class CreateRecipeRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    preparation_time_minutes: int = Field(..., gt=0)
    complexity_level: ComplexityLevel
    steps: List[RecipeStepModel] = Field(..., min_length=1)
    ingredients: List[RecipeIngredientModel] = Field(..., min_length=1)

class UpdateRecipeRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    preparation_time_minutes: Optional[int] = Field(None, gt=0)
    complexity_level: Optional[ComplexityLevel] = None
    steps: Optional[List[RecipeStepModel]] = None
    ingredients: Optional[List[RecipeIngredientModel]] = None

class RateRecipeRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5) 

class RecipeViewHistoryQuery(BaseModel):
    """Model parametrów zapytania dla historii przeglądania przepisów."""
    page: int = Field(default=1, ge=1, description="Numer strony")
    limit: int = Field(default=10, ge=1, le=100, description="Liczba elementów na stronę")
    
    class Config:
        schema_extra = {
            "example": {
                "page": 1,
                "limit": 10
            }
        } 