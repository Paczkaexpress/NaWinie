from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from .requests import ComplexityLevel, RecipeStepModel

class RecipeViewHistoryItem(BaseModel):
    """Model reprezentujący element historii przeglądania przepisów użytkownika."""
    id: str
    recipe_id: str
    recipe_name: str
    view_start: datetime
    view_end: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class PaginationInfo(BaseModel):
    """Model informacji o paginacji."""
    page: int
    limit: int
    total_items: int
    total_pages: int

class PaginatedRecipeViewHistory(BaseModel):
    """Model paginowanej historii przeglądania przepisów."""
    data: List[RecipeViewHistoryItem]
    pagination: PaginationInfo 

class UserResponse(BaseModel):
    """Model odpowiedzi dla danych profilu użytkownika."""
    id: str
    email: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class IngredientResponse(BaseModel):
    """Model odpowiedzi dla pojedynczego składnika."""
    id: UUID
    name: str
    unit_type: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PaginatedIngredientsResponse(BaseModel):
    """Model paginowanej odpowiedzi z listą składników."""
    data: List[IngredientResponse]
    pagination: PaginationInfo

class UserDefaultIngredientDto(BaseModel):
    """Model reprezentujący domyślny składnik użytkownika."""
    ingredient_id: UUID
    name: str
    unit_type: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserDefaultIngredientAddedDto(BaseModel):
    """Model potwierdzenia dodania składnika do domyślnych."""
    user_id: UUID
    ingredient_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

class PaginatedUserDefaultIngredientsResponse(BaseModel):
    """Model paginowanej odpowiedzi z listą domyślnych składników użytkownika."""
    data: List[UserDefaultIngredientDto]
    pagination: PaginationInfo 

# === Recipe Response Models ===

class RecipeIngredientDetail(BaseModel):
    """DTO representing a specific ingredient used within a recipe, including joined details."""
    id: UUID
    recipe_id: UUID
    ingredient_id: UUID
    amount: float
    is_optional: bool
    substitute_recommendation: Optional[str]
    name: str  # From joined ingredient table
    unit_type: str  # From joined ingredient table
    created_at: datetime

class RecipeListItemDto(BaseModel):
    """DTO representing a recipe item in a list view (omits detailed steps/ingredients)."""
    id: UUID
    name: str
    preparation_time_minutes: int
    complexity_level: ComplexityLevel
    author_id: UUID
    average_rating: float
    total_votes: int
    created_at: datetime
    updated_at: datetime

class RecipeDetailDto(BaseModel):
    """DTO representing the full details of a recipe, including steps and ingredients."""
    id: UUID
    name: str
    preparation_time_minutes: int
    complexity_level: ComplexityLevel
    steps: List[RecipeStepModel]
    author_id: UUID
    average_rating: float
    total_votes: int
    created_at: datetime
    updated_at: datetime
    ingredients: List[RecipeIngredientDetail]

class RecipeListResponse(BaseModel):
    """Response for recipe list endpoints with pagination."""
    data: List[RecipeListItemDto]
    pagination: PaginationInfo

class RecipeDetailResponse(BaseModel):
    """Response for single recipe detail endpoint."""
    data: RecipeDetailDto

class RatingUpdateResponse(BaseModel):
    """DTO representing the updated rating status of a recipe after a vote."""
    average_rating: float
    total_votes: int 