# API Endpoint Implementation Plan: Recipes API

## 1. Przegląd punktu końcowego

API przepisów składa się z 7 głównych endpointów obsługujących pełny cykl życia przepisów w aplikacji "Na Winie". Obejmuje operacje CRUD, wyszukiwanie po składnikach, oraz system oceniania. API obsługuje paginację, filtrowanie i sortowanie dla optymalnego doświadczenia użytkownika.

## 2. Szczegóły żądania

### GET `/recipes`
- **Metoda HTTP**: GET
- **Struktura URL**: `/api/recipes`
- **Parametry**:
  - Opcjonalne: `page` (int, default: 1), `limit` (int, default: 10), `complexity` (enum: easy/medium/hard), `authorId` (UUID), `sortBy` (string: name/rating/prep_time/created_at), `sortOrder` (string: asc/desc)
- **Request Body**: Brak

### GET `/recipes/find-by-ingredients`
- **Metoda HTTP**: GET
- **Struktura URL**: `/api/recipes/find-by-ingredients`
- **Parametry**:
  - Wymagane: `ingredientIds` (comma-separated UUIDs)
- **Request Body**: Brak

### POST `/recipes`
- **Metoda HTTP**: POST
- **Struktura URL**: `/api/recipes`
- **Parametry**: Brak
- **Request Body**: 
```json
{
  "name": "string",
  "preparation_time_minutes": "integer",
  "complexity_level": "easy|medium|hard",
  "steps": [{"step": 1, "description": "string"}],
  "ingredients": [{"ingredient_id": "uuid", "amount": "number", "is_optional": "boolean", "substitute_recommendation": "string|null"}]
}
```

### GET `/recipes/{recipeId}`
- **Metoda HTTP**: GET
- **Struktura URL**: `/api/recipes/{recipeId}`
- **Parametry**:
  - Wymagane: `recipeId` (UUID w ścieżce)
- **Request Body**: Brak

### PUT `/recipes/{recipeId}`
- **Metoda HTTP**: PUT
- **Struktura URL**: `/api/recipes/{recipeId}`
- **Parametry**:
  - Wymagane: `recipeId` (UUID w ścieżce)
- **Request Body**: Częściowa aktualizacja (wszystkie pola opcjonalne)

### DELETE `/recipes/{recipeId}`
- **Metoda HTTP**: DELETE
- **Struktura URL**: `/api/recipes/{recipeId}`
- **Parametry**:
  - Wymagane: `recipeId` (UUID w ścieżce)
- **Request Body**: Brak

### POST `/recipes/{recipeId}/rate`
- **Metoda HTTP**: POST
- **Struktura URL**: `/api/recipes/{recipeId}/rate`
- **Parametry**:
  - Wymagane: `recipeId` (UUID w ścieżce)
- **Request Body**:
```json
{
  "rating": "integer (1-5)"
}
```

## 3. Wykorzystywane typy

### Istniejące typy (z src/types.ts):
- `CreateRecipeCommand`
- `UpdateRecipeCommand`
- `RecipeListItemDto`
- `RecipeDetailDto`
- `PaginatedRecipesDto`
- `RateRecipeCommand`
- `RecipeRatingDto`
- `RecipeStep`
- `CreateRecipeIngredientCommand`
- `RecipeIngredientDto`

### Nowe typy Pydantic do utworzenia:
```python
# Request Models
class RecipeListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=10, ge=1, le=100)
    complexity: Optional[ComplexityLevel] = None
    authorId: Optional[UUID] = None
    sortBy: Optional[SortField] = Field(default="created_at")
    sortOrder: Optional[SortOrder] = Field(default="desc")

class FindByIngredientsQuery(BaseModel):
    ingredientIds: str = Field(..., description="Comma-separated UUIDs")
    
    @field_validator('ingredientIds')
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
    steps: List[RecipeStepModel] = Field(..., min_items=1)
    ingredients: List[RecipeIngredientModel] = Field(..., min_items=1)

class UpdateRecipeRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    preparation_time_minutes: Optional[int] = Field(None, gt=0)
    complexity_level: Optional[ComplexityLevel] = None
    steps: Optional[List[RecipeStepModel]] = None
    ingredients: Optional[List[RecipeIngredientModel]] = None

class RateRecipeRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)

# Response Models
class RecipeListResponse(BaseModel):
    data: List[RecipeListItemDto]
    pagination: PaginationInfo

class RecipeDetailResponse(BaseModel):
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

class RatingUpdateResponse(BaseModel):
    average_rating: float
    total_votes: int

# Supporting Models
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
```

## 4. Szczegóły odpowiedzi

### Kody statusu:
- **200 OK**: Pomyślne pobranie danych (GET)
- **201 Created**: Pomyślne utworzenie przepisu (POST)
- **204 No Content**: Pomyślne usunięcie (DELETE)
- **400 Bad Request**: Nieprawidłowe parametry zapytania lub ciało żądania
- **401 Unauthorized**: Brak tokenu autoryzacji lub nieprawidłowy token
- **403 Forbidden**: Brak uprawnień (np. próba edycji cudzego przepisu)
- **404 Not Found**: Przepis nie został znaleziony
- **409 Conflict**: Konflikt (np. użytkownik już ocenił przepis)
- **422 Unprocessable Entity**: Błędy walidacji Pydantic
- **500 Internal Server Error**: Błędy serwera

### Struktury odpowiedzi:
Wszystkie odpowiedzi zgodne ze specyfikacją API, z dodatkowymi polami błędów dla przypadków niepowodzenia.

## 5. Przepływ danych

### Architektura warstw:
1. **Router Layer**: Obsługa HTTP requests, walidacja parametrów
2. **Service Layer**: Logika biznesowa, orkiestracja operacji
3. **Repository Layer**: Interakcja z bazą danych Supabase
4. **Database Layer**: PostgreSQL via Supabase

### Przepływ dla GET `/recipes`:
1. Router waliduje parametry zapytania
2. Service pobiera przepisy z bazy z filtrowaniem/sortowaniem
3. Service aplikuje paginację
4. Zwrócenie sformatowanej odpowiedzi

### Przepływ dla POST `/recipes`:
1. Router waliduje JWT token i ciało żądania
2. Service waliduje istnienie składników
3. Service tworzy przepis w transakcji
4. Service tworzy powiązania ze składnikami
5. Zwrócenie utworzonego przepisu

### Przepływ dla `/find-by-ingredients`:
1. Router waliduje listę ingredient IDs
2. Service pobiera przepisy pasujące do składników
3. Service aktualizuje popularność składników (background task)
4. Service dodaje domyślne składniki użytkownika (jeśli autoryzowany)
5. Zwrócenie posortowanych wyników

## 6. Względy bezpieczeństwa

### Autoryzacja:
- **JWT Token**: Wymagany dla POST, PUT, DELETE, POST rate
- **User Context**: Wyodrębnienie user_id z tokenu JWT
- **Ownership Validation**: Sprawdzenie autorstwa dla PUT/DELETE

### Walidacja danych:
- **Pydantic Models**: Automatyczna walidacja typów i formatów
- **UUID Validation**: Sprawdzenie poprawności UUIDs
- **Range Validation**: Rating 1-5, preparation_time > 0
- **Length Validation**: Limity długości nazw i opisów

### Zabezpieczenia bazy danych:
- **RLS Policies**: Wykorzystanie Row Level Security w Supabase
- **Prepared Statements**: Ochrona przed SQL injection
- **Transaction Safety**: Atomowość operacji wielotabelowych

### Rate Limiting:
- Implementacja w przyszłości dla ochrony przed spam

## 7. Obsługa błędów

### Scenariusze błędów:

#### 400 Bad Request:
- Nieprawidłowe parametry paginacji (page < 1, limit > 100)
- Niepoprawny format UUID w ingredientIds
- Nieprawidłowe wartości enum (complexity, sortBy, sortOrder)
- Brakujące wymagane pola w request body

#### 401 Unauthorized:
- Brak tokenu JWT
- Nieprawidłowy/wygasły token JWT
- Token bez wymaganych claims

#### 403 Forbidden:
- Próba edycji przepisu przez nie-autora
- Próba usunięcia przepisu przez nie-autora (bez uprawnień admin)

#### 404 Not Found:
- Przepis o podanym ID nie istnieje
- Jeden z ingredient_ids nie istnieje w bazie

#### 409 Conflict:
- Użytkownik już ocenił dany przepis (wymaga implementacji tabeli recipe_ratings)
- Próba utworzenia przepisu z duplikowaną nazwą (opcjonalne)

#### 422 Unprocessable Entity:
- Błędy walidacji Pydantic (automatyczne)
- Nieprawidłowe typy danych

### Logging błędów:
```python
# Struktura logowania
import logging
from datetime import datetime

logger = logging.getLogger("recipes_api")

def log_error(error_type: str, user_id: Optional[str], details: dict):
    logger.error({
        "timestamp": datetime.utcnow().isoformat(),
        "error_type": error_type,
        "user_id": user_id,
        "details": details
    })
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje bazy danych:
- **Indeksy**: Już zdefiniowane w schemacie (complexity_level, average_rating, created_at)
- **Materialized Views**: popular_ingredients dla częstych wyszukiwań
- **Query Optimization**: JOIN operations dla recipe_ingredients

### Caching:
- **Application Level**: Cache dla popularnych przepisów
- **Database Level**: Wykorzystanie Supabase connection pooling

### Paginacja:
- **Limit Controls**: Maksymalny limit 100 elementów na stronę
- **Offset Pagination**: Odpowiednie dla mniejszych zbiorów danych
- **Cursor Pagination**: Rozważenie w przyszłości dla większych zbiorów

### Background Tasks:
- **Popularity Updates**: Aktualizacja popularności składników w tle
- **Rating Calculations**: Przeliczanie średnich ocen asynchronicznie

## 9. Etapy wdrożenia

### Faza 1: Przygotowanie infrastruktury
1. **Aktualizacja modeli SQLAlchemy**:
   - Zmiana Integer na UUID dla primary keys
   - Dostosowanie nazw kolumn do schematu Supabase (title → name, difficulty → complexity_level)
   - Dodanie brakujących pól (total_votes, steps jako JSONB)

2. **Utworzenie struktury routerów**:
   ```
   backend/
   ├── routers/
   │   ├── __init__.py
   │   └── recipes.py
   ├── services/
   │   ├── __init__.py
   │   └── recipe_service.py
   ├── schemas/
   │   ├── __init__.py
   │   └── recipe_schemas.py
   └── dependencies/
       ├── __init__.py
       └── auth.py
   ```

3. **Konfiguracja Supabase połączenia**:
   - Aktualizacja database.py dla obsługi Supabase
   - Konfiguracja zmiennych środowiskowych

### Faza 2: Implementacja podstawowych endpointów
4. **Implementacja GET `/recipes`**:
   - Router z walidacją parametrów
   - Service z logiką filtrowania i sortowania
   - Testy jednostkowe

5. **Implementacja GET `/recipes/{recipeId}`**:
   - Router z walidacją UUID
   - Service z JOIN dla ingredients
   - Obsługa błędu 404

6. **Implementacja POST `/recipes`**:
   - Router z autoryzacją JWT
   - Service z walidacją składników
   - Transakcje dla atomowości operacji

### Faza 3: Implementacja zaawansowanych funkcji
7. **Implementacja GET `/recipes/find-by-ingredients`**:
   - Parser dla comma-separated UUIDs
   - Algorytm wyszukiwania z relevance scoring
   - Background task dla popularity updates

8. **Implementacja PUT `/recipes/{recipeId}`**:
   - Walidacja ownership
   - Partial update logic
   - Obsługa cascade updates dla ingredients

9. **Implementacja DELETE `/recipes/{recipeId}`**:
   - Walidacja ownership lub admin role
   - Cascade deletion handling
   - Soft delete vs hard delete decision

### Faza 4: System oceniania
10. **Utworzenie tabeli recipe_ratings**:
    ```sql
    create table recipe_ratings (
      id uuid primary key default uuid_generate_v4(),
      user_id uuid references users(id),
      recipe_id uuid references recipes(id),
      rating integer check (rating >= 1 and rating <= 5),
      created_at timestamptz default now(),
      updated_at timestamptz default now(),
      unique(user_id, recipe_id)
    );
    ```

11. **Implementacja POST `/recipes/{recipeId}/rate`**:
    - Walidacja range rating (1-5)
    - Sprawdzenie duplikatów
    - Przeliczanie average_rating
    - Trigger lub background task dla aktualizacji

### Faza 5: Testy i optymalizacja
12. **Testy integracyjne**:
    - Scenariusze end-to-end
    - Performance testing
    - Security testing

13. **Monitoring i logging**:
    - Structured logging
    - Error tracking
    - Performance metrics

14. **Dokumentacja API**:
    - OpenAPI/Swagger integration
    - Example requests/responses
    - Error code documentation

### Faza 6: Deployment i produkcja
15. **CI/CD Pipeline**:
    - GitHub Actions setup
    - Database migrations
    - DigitalOcean deployment

16. **Production monitoring**:
    - Health checks
    - Performance dashboards
    - Error alerting

### Dodatkowe usprawnienia (opcjonalne):
- **Search functionality**: Full-text search dla nazw przepisów
- **Image uploads**: Obsługa zdjęć przepisów
- **Recipe collections**: Grupowanie przepisów w kolekcje
- **Advanced filtering**: Czas przygotowania, kaloryczność
- **Recipe recommendations**: AI-based suggestions
- **Social features**: Komentarze, sharing 