# API Endpoint Implementation Plan: GET /users/me/recipe-views

## 1. Przegląd punktu końcowego

Endpoint `GET /users/me/recipe-views` służy do pobierania historii przeglądania przepisów aktualnie uwierzytelnionego użytkownika. Endpoint wymaga uwierzytelnienia poprzez token JWT, obsługuje paginację i zwraca listę rekordów przeglądania przepisów z dołączonymi nazwami przepisów dla wygody klienta. Jest to endpoint tylko do odczytu, który pozwala użytkownikom na przeglądanie swojej aktywności w aplikacji.

## 2. Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/users/me/recipe-views`
- **Parametry**:
  - **Wymagane**: Token uwierzytelniający w nagłówku `Authorization: Bearer <token>`
  - **Opcjonalne**: 
    - `page` (integer): Numer strony dla paginacji (domyślnie: 1, minimum: 1)
    - `limit` (integer): Liczba elementów na stronę (domyślnie: 10, minimum: 1, maksimum: 100)
- **Request Body**: Brak (metoda GET)

## 3. Wykorzystywane typy

### Istniejące typy (z src/types.ts):
- **Response DTO**: `PaginatedUserRecipeViewHistoryDto` i `UserRecipeViewHistoryItemDto`:
  ```typescript
  export type UserRecipeViewHistoryItemDto = Pick<RecipeViews, 'id' | 'recipe_id' | 'view_start' | 'view_end' | 'created_at'> & {
    recipe_name: string;
  };
  
  export type PaginatedUserRecipeViewHistoryDto = PaginatedResponse<UserRecipeViewHistoryItemDto>;
  ```
- **Pagination DTO**: `PaginationInfo`

### Nowe typy do utworzenia:
- **Pydantic Response Models** (backend/models/responses.py):
  ```python
  from pydantic import BaseModel
  from datetime import datetime
  from typing import Optional, List

  class RecipeViewHistoryItem(BaseModel):
      id: str
      recipe_id: str
      recipe_name: str
      view_start: datetime
      view_end: Optional[datetime] = None
      created_at: datetime
      
      class Config:
          from_attributes = True

  class PaginationInfo(BaseModel):
      page: int
      limit: int
      total_items: int
      total_pages: int

  class PaginatedRecipeViewHistory(BaseModel):
      data: List[RecipeViewHistoryItem]
      pagination: PaginationInfo
  ```

- **Query Parameters Model** (backend/models/requests.py):
  ```python
  from pydantic import BaseModel, Field
  from typing import Optional

  class RecipeViewHistoryQuery(BaseModel):
      page: Optional[int] = Field(default=1, ge=1, description="Page number")
      limit: Optional[int] = Field(default=10, ge=1, le=100, description="Items per page")
  ```

## 4. Szczegóły odpowiedzi

### Pomyślna odpowiedź (200 OK):
```json
{
  "data": [
    {
      "id": "uuid-string",
      "recipe_id": "uuid-string",
      "recipe_name": "Simple Pancakes",
      "view_start": "2023-12-01T10:00:00.000Z",
      "view_end": "2023-12-01T10:05:30.000Z",
      "created_at": "2023-12-01T10:00:00.000Z"
    },
    {
      "id": "uuid-string-2",
      "recipe_id": "uuid-string-2",
      "recipe_name": "Chocolate Cake",
      "view_start": "2023-11-30T15:20:00.000Z",
      "view_end": null,
      "created_at": "2023-11-30T15:20:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total_items": 25,
    "total_pages": 3
  }
}
```

### Kody stanu błędów:
- **400 Bad Request**: Nieprawidłowe parametry paginacji (page < 1, limit > 100)
- **401 Unauthorized**: Brak tokenu lub nieprawidłowy token uwierzytelniający
- **500 Internal Server Error**: Błędy po stronie serwera (problemy z bazą danych)

## 5. Przepływ danych

1. **Odbiór żądania**: FastAPI odbiera żądanie GET na `/api/users/me/recipe-views`
2. **Walidacja parametrów**: Pydantic waliduje query parameters (page, limit)
3. **Walidacja uwierzytelnienia**: Auth dependency sprawdza token JWT i wyodrębnia user_id
4. **Wywołanie serwisu**: RecipeViewService.get_user_recipe_views(user_id, page, limit)
5. **Zapytanie do bazy**: JOIN query między recipe_views i recipes z paginacją
6. **Zastosowanie RLS**: Supabase automatycznie aplikuje polityki RLS dla recipe_views
7. **Obliczenie paginacji**: Counting total items i obliczenie total_pages
8. **Mapowanie danych**: Konwersja wyników SQLAlchemy na Pydantic models
9. **Zwrócenie odpowiedzi**: JSON response z paginowaną listą

### Interakcje z bazą danych:
- **Tabele**: `recipe_views` (JOIN) `recipes`
- **Zapytanie główne**:
  ```sql
  SELECT 
    rv.id, rv.recipe_id, rv.view_start, rv.view_end, rv.created_at,
    r.name as recipe_name
  FROM recipe_views rv
  JOIN recipes r ON rv.recipe_id = r.id
  WHERE rv.user_id = $1
  ORDER BY rv.created_at DESC
  LIMIT $2 OFFSET $3
  ```
- **Zapytanie count**:
  ```sql
  SELECT COUNT(*) FROM recipe_views WHERE user_id = $1
  ```
- **RLS Policy**: "Users can view their own recipe view history"

## 6. Względy bezpieczeństwa

### Uwierzytelnienie:
- **JWT Token Validation**: Wymagany ważny token JWT w nagłówku Authorization
- **Token Payload**: Musi zawierać user_id do identyfikacji użytkownika
- **Token Expiry**: Sprawdzenie ważności tokenu (exp claim)

### Autoryzacja:
- **Self-access only**: Użytkownik może dostać tylko własną historię przeglądania
- **RLS Enforcement**: Polityki Row Level Security w Supabase zapewniają dodatkową warstwę bezpieczeństwa
- **Recipe Privacy**: JOIN z recipes nie ujawnia prywatnych przepisów innych użytkowników

### Walidacja danych:
- **Input Sanitization**: Walidacja parametrów paginacji przez Pydantic
- **SQL Injection Protection**: Użycie parametryzowanych zapytań SQLAlchemy
- **Range Validation**: Ograniczenie limit do maksimum 100 elementów

### Ochrona przed atakami:
- **Rate Limiting**: Opcjonalne ograniczenie liczby requestów per użytkownik
- **Information Disclosure**: Nie ujawnianie informacji o istnieniu przepisów innych użytkowników

## 7. Obsługa błędów

### 400 Bad Request:
- **Przyczyny**: page < 1, limit < 1 lub limit > 100, nieprawidłowy format parametrów
- **Response**: `{"detail": "Invalid pagination parameters", "errors": {...}}`
- **Logging**: Log poziom INFO z informacją o błędnych parametrach

### 401 Unauthorized:
- **Przyczyny**: Brak tokenu, nieprawidłowy format, wygasły token, nieprawidłowy podpis
- **Response**: `{"detail": "Authentication required"}`
- **Logging**: Log poziom WARNING z informacją o próbie nieautoryzowanego dostępu

### 500 Internal Server Error:
- **Przyczyny**: Błędy połączenia z bazą danych, problemy z Supabase, błędy JOIN
- **Response**: `{"detail": "Internal server error"}`
- **Logging**: Log poziom ERROR z pełnym stack trace

### Centralized Error Handling:
- Użycie FastAPI HTTPException dla spójnej obsługi błędów
- Custom exception handlers dla specyficznych typów błędów
- Graceful handling pustych wyników (zwracanie pustej listy z prawidłową paginacją)

## 8. Rozważania dotyczące wydajności

### Optymalizacje zapytań:
- **Index Usage**: Wykorzystanie indeksu `idx_recipe_views_user_time` (user_id, view_start)
- **JOIN Optimization**: Efficient JOIN z recipes table przez recipe_id index
- **LIMIT/OFFSET**: Paginacja z LIMIT/OFFSET dla kontroli rozmiaru response
- **SELECT Specific Fields**: Pobieranie tylko potrzebnych kolumn

### Caching Strategy:
- **Application Level**: Cachowanie pierwszej strony dla frequent users (Redis)
- **Cache TTL**: Średni TTL (30 minut) dla danych historycznych
- **Cache Invalidation**: Invalidacja przy dodaniu nowego recipe view
- **Query Result Caching**: Opcjonalne cachowanie wyników dla identical queries

### Performance Monitoring:
- **Response Time Tracking**: Monitoring czasu odpowiedzi endpoint
- **Database Query Performance**: Tracking czasu wykonania JOIN queries
- **Pagination Performance**: Monitoring wydajności dla różnych page offsets
- **Memory Usage**: Tracking zużycia pamięci dla różnych limit values

### Skalowanie:
- **Database Connection Pooling**: Optymalne wykorzystanie SQLAlchemy pool
- **Query Optimization**: Monitoring slow queries przez database profiling
- **Horizontal Scaling**: Przygotowanie do sharding po user_id w przyszłości

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie modeli Pydantic
- Dodanie `RecipeViewHistoryItem`, `PaginatedRecipeViewHistory` do `backend/models/responses.py`
- Dodanie `RecipeViewHistoryQuery` do `backend/models/requests.py`
- Aktualizacja `__init__.py` z nowymi importami

### Krok 2: Implementacja RecipeViewService
- Utworzenie `backend/services/recipe_view_service.py`
- Implementacja `get_user_recipe_views(user_id, page, limit)` method
- Implementacja helper functions dla count query i pagination logic
- Obsługa JOIN z recipes table dla recipe_name

### Krok 3: Rozszerzenie auth dependencies
- Upewnienie się, że `get_current_user_id()` dependency jest dostępne
- Opcjonalne: utworzenie specific dependency dla tego endpoint

### Krok 4: Implementacja SQLAlchemy models
- Sprawdzenie/aktualizacja `RecipeView` model w `backend/models/`
- Sprawdzenie/aktualizacja `Recipe` model dla JOIN operations
- Konfiguracja relationships między models jeśli potrzebne

### Krok 5: Implementacja routera
- Rozszerzenie `backend/routers/users.py` o nowy endpoint
- Implementacja `GET /me/recipe-views` z właściwymi dependencies
- Konfiguracja query parameters validation
- Implementacja response model i error handling

### Krok 6: Aktualizacja głównej aplikacji
- Sprawdzenie, czy users router jest właściwie skonfigurowany w `main.py`
- Upewnienie się, że routing `/api/users/me/recipe-views` działa poprawnie

### Krok 7: Implementacja testów
- Unit testy dla RecipeViewService (różne scenariusze paginacji)
- Integration testy dla endpoint (auth, query params, responses)
- Testy edge cases (empty results, large pages, invalid params)
- Performance testy dla różnych rozmiarów danych

### Krok 8: Dokumentacja i Logging
- Aktualizacja OpenAPI/Swagger documentation
- Dodanie przykładów request/response
- Konfiguracja structured logging dla endpoint
- Dokumentacja error codes i troubleshooting

### Krok 9: Security Testing
- Testy autoryzacji (próby dostępu do danych innych użytkowników)
- Testy input validation (edge cases dla pagination)
- Performance testing pod obciążeniem
- Security scanning dla SQL injection vulnerabilities

### Krok 10: Deployment i Monitoring
- Deployment na staging environment
- Konfiguracja alertów dla error rates i response times
- Testy end-to-end z frontendem
- Monitoring database performance dla nowych queries
- Gradual rollout z feature flags jeśli applicable 