from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

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