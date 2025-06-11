from pydantic import BaseModel, Field, validator
from enum import Enum
from typing import Optional

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