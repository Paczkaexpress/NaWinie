# API Endpoint Implementation Plan: Ingredients API

## 1. Przegląd punktu końcowego

Endpoints `/ingredients` służą do zarządzania składnikami w aplikacji Na Winie. Obejmują trzy kluczowe operacje:
- **GET `/ingredients`** - Pobieranie listy wszystkich dostępnych składników z obsługą paginacji, wyszukiwania i sortowania
- **POST `/ingredients`** - Dodawanie nowego składnika (wymaga uwierzytelnienia, potencjalnie admin-only)
- **GET `/ingredients/{ingredientId}`** - Pobieranie szczegółów konkretnego składnika

Te endpointy stanowią podstawę systemu składników, umożliwiając użytkownikom przeglądanie dostępnych składników oraz administratorom rozszerzanie bazy składników.

## 2. Szczegóły żądania

### GET `/ingredients`
- **Metoda HTTP**: GET
- **Struktura URL**: `/api/ingredients`
- **Parametry**:
  - **Wymagane**: Brak
  - **Opcjonalne**: 
    - `page` (int): Numer strony dla paginacji (domyślnie 1)
    - `limit` (int): Liczba elementów na stronę (domyślnie 20, max 100)
    - `search` (string): Wyszukiwanie po nazwie składnika
    - `sortBy` (string): Pole sortowania ('name', 'unit_type', 'created_at')
    - `sortOrder` (string): Kierunek sortowania ('asc', 'desc')
- **Request Body**: Brak

### POST `/ingredients`
- **Metoda HTTP**: POST
- **Struktura URL**: `/api/ingredients`
- **Parametry**:
  - **Wymagane**: Token uwierzytelniający w nagłówku `Authorization: Bearer <token>`
  - **Opcjonalne**: Brak
- **Request Body**:
```json
{
  "name": "New Spice",
  "unit_type": "g"
}
```

### GET `/ingredients/{ingredientId}`
- **Metoda HTTP**: GET
- **Struktura URL**: `/api/ingredients/{ingredientId}`
- **Parametry**:
  - **Wymagane**: `ingredientId` (UUID) - identyfikator składnika w ścieżce URL
  - **Opcjonalne**: Brak
- **Request Body**: Brak

## 3. Wykorzystywane typy

### Istniejące typy (z src/types.ts):
- **IngredientDto**: Reprezentuje pojedynczy składnik
- **PaginatedIngredientsDto**: Stronicowana odpowiedź z listą składników
- **CreateIngredientCommand**: Model dla tworzenia nowego składnika

### Nowe typy Pydantic do utworzenia:

**backend/models/requests.py**:
```python
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
    sortBy: Optional[str] = Field(default="name", regex="^(name|unit_type|created_at)$")
    sortOrder: Optional[str] = Field(default="asc", regex="^(asc|desc)$")
```

**backend/models/responses.py**:
```python
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from uuid import UUID

class IngredientResponse(BaseModel):
    id: UUID
    name: str
    unit_type: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PaginationInfo(BaseModel):
    page: int
    limit: int
    total_items: int
    total_pages: int

class PaginatedIngredientsResponse(BaseModel):
    data: List[IngredientResponse]
    pagination: PaginationInfo
```

## 4. Szczegóły odpowiedzi

### GET `/ingredients` - Pomyślna odpowiedź (200 OK):
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Flour",
      "unit_type": "g",
      "created_at": "2023-12-01T10:00:00.000Z",
      "updated_at": "2023-12-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 100,
    "total_pages": 5
  }
}
```

### POST `/ingredients` - Pomyślna odpowiedź (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "New Spice",
  "unit_type": "g",
  "created_at": "2023-12-01T12:00:00.000Z",
  "updated_at": "2023-12-01T12:00:00.000Z"
}
```

### GET `/ingredients/{ingredientId}` - Pomyślna odpowiedź (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Flour",
  "unit_type": "g",
  "created_at": "2023-12-01T10:00:00.000Z",
  "updated_at": "2023-12-01T10:00:00.000Z"
}
```

### Kody stanu błędów:
- **400 Bad Request**: Nieprawidłowe parametry zapytania, nieprawidłowe dane wejściowe
- **401 Unauthorized**: Brak tokenu uwierzytelniającego (POST)
- **403 Forbidden**: Brak uprawnień do dodawania składników (POST - jeśli admin-only)
- **404 Not Found**: Składnik nie został znaleziony (GET by ID)
- **409 Conflict**: Składnik o podanej nazwie już istnieje (POST)
- **422 Unprocessable Entity**: Nieprawidłowy format UUID
- **500 Internal Server Error**: Błędy po stronie serwera

## 5. Przepływ danych

### GET `/ingredients`:
1. **Odbiór żądania**: FastAPI odbiera żądanie GET z parametrami zapytania
2. **Walidacja parametrów**: Pydantic waliduje parametry paginacji, wyszukiwania i sortowania
3. **Wywołanie serwisu**: IngredientService.get_ingredients(query_params)
4. **Zapytanie do bazy**: Zapytanie z filtrowaniem, sortowaniem i paginacją
5. **Zliczanie wyników**: Osobne zapytanie COUNT dla total_items
6. **Mapowanie danych**: Konwersja na PaginatedIngredientsResponse
7. **Zwrócenie odpowiedzi**: JSON response z danymi i informacjami o paginacji

### POST `/ingredients`:
1. **Odbiór żądania**: FastAPI odbiera żądanie POST z JSON body
2. **Walidacja uwierzytelnienia**: JWT token validation dependency
3. **Walidacja danych**: Pydantic waliduje CreateIngredientRequest
4. **Sprawdzenie uprawnień**: Opcjonalna walidacja uprawnień administratora
5. **Wywołanie serwisu**: IngredientService.create_ingredient(data, user_id)
6. **Sprawdzenie unikalności**: Weryfikacja czy nazwa już nie istnieje
7. **Zapis do bazy**: INSERT do tabeli ingredients
8. **Mapowanie odpowiedzi**: Konwersja na IngredientResponse
9. **Zwrócenie odpowiedzi**: JSON response z nowym składnikiem (201)

### GET `/ingredients/{ingredientId}`:
1. **Odbiór żądania**: FastAPI odbiera żądanie GET z parametrem ścieżki
2. **Walidacja UUID**: FastAPI automatycznie waliduje format UUID
3. **Wywołanie serwisu**: IngredientService.get_ingredient_by_id(ingredient_id)
4. **Zapytanie do bazy**: SELECT z filtrem WHERE id = ingredient_id
5. **Sprawdzenie istnienia**: Sprawdzenie czy składnik został znaleziony
6. **Mapowanie danych**: Konwersja na IngredientResponse
7. **Zwrócenie odpowiedzi**: JSON response z danymi składnika

### Interakcje z bazą danych:
- **Tabela**: `ingredients`
- **Główne zapytania**:
  - SELECT z LIKE dla wyszukiwania
  - SELECT z ORDER BY dla sortowania
  - SELECT z LIMIT/OFFSET dla paginacji
  - INSERT dla tworzenia
  - SELECT by ID dla pobierania szczegółów

## 6. Względy bezpieczeństwa

### Uwierzytelnienie (POST endpoint):
- **JWT Token Validation**: Wymagany ważny token JWT
- **Token Payload**: Musi zawierać user_id i odpowiednie uprawnienia
- **Token Expiry**: Sprawdzenie ważności tokenu

### Autoryzacja:
- **Admin-only Creation**: Opcjonalna konfiguracja wymagająca uprawnień administratora
- **Rate Limiting**: Ograniczenie częstotliwości tworzenia składników
- **Input Validation**: Ścisła walidacja danych wejściowych

### Zabezpieczenia przed atakami:
- **SQL Injection**: Użycie parametryzowanych zapytań SQLAlchemy/Supabase
- **NoSQL Injection**: Sanityzacja parametrów wyszukiwania
- **XSS Prevention**: Walidacja i sanityzacja nazw składników
- **CSRF Protection**: Użycie JWT tokenów zamiast cookies

### Walidacja danych:
- **UUID Format**: Automatyczna walidacja przez FastAPI
- **Unit Type Enum**: Ograniczenie do dozwolonych wartości
- **Name Sanitization**: Trimming, kapitalizacja, sprawdzenie długości
- **Search Query Sanitization**: Escapowanie specjalnych znaków

## 7. Obsługa błędów

### 400 Bad Request:
- **Przyczyny**: Nieprawidłowe parametry zapytania, nieprawidłowe dane JSON
- **Przykłady**: Ujemna wartość page, limit > 100, nieznane sortBy
- **Response**: `{"detail": "Invalid query parameters"}`
- **Logging**: Log poziom WARNING z detalami błędnej walidacji

### 401 Unauthorized:
- **Przyczyny**: Brak tokenu, nieprawidłowy token, wygasły token
- **Response**: `{"detail": "Authentication required"}`
- **Logging**: Log poziom WARNING z IP address i user agent

### 403 Forbidden:
- **Przyczyny**: Brak uprawnień administratora (jeśli wymagane)
- **Response**: `{"detail": "Insufficient permissions"}`
- **Logging**: Log poziom WARNING z user_id próbującego dostępu

### 404 Not Found:
- **Przyczyny**: Składnik o podanym ID nie istnieje
- **Response**: `{"detail": "Ingredient not found"}`
- **Logging**: Log poziom INFO z próbowanym ingredient_id

### 409 Conflict:
- **Przyczyny**: Składnik o podanej nazwie już istnieje
- **Response**: `{"detail": "Ingredient with this name already exists"}`
- **Logging**: Log poziom INFO z próbą duplikacji

### 422 Unprocessable Entity:
- **Przyczyny**: Nieprawidłowy format UUID, błędne dane JSON
- **Response**: FastAPI automatycznie generuje szczegółowe błędy walidacji
- **Logging**: Log poziom INFO z detalami błędów walidacji

### 500 Internal Server Error:
- **Przyczyny**: Błędy bazy danych, problemy z Supabase, nieoczekiwane wyjątki
- **Response**: `{"detail": "Internal server error"}`
- **Logging**: Log poziom ERROR z pełnym stack trace

### Centralized Error Handling:
- Custom exception handlers dla różnych typów błędów
- Strukturalne logowanie z kontekstem żądania
- Error tracking i monitoring (Sentry/podobne narzędzia)

## 8. Rozważania dotyczące wydajności

### Optymalizacje zapytań:
- **Database Indexes**: 
  - Index na ingredients.name dla wyszukiwania (GIN trgm_ops)
  - Index na ingredients.unit_type dla filtrowania
  - Index na ingredients.created_at dla sortowania
- **Query Optimization**:
  - Use of prepared statements
  - Efficient LIKE queries z proper indexing
  - Batch operations dla bulk inserts

### Paginacja:
- **Cursor-based pagination**: Rozważenie dla lepszej wydajności przy dużych zbiorach
- **Limit Controls**: Maksymalny limit 100 elementów na stronę
- **Count Optimization**: Cachowanie total_items dla częstych zapytań

### Caching Strategy:
- **Application Level Cache**: Redis cache dla popularnych wyszukiwań
- **Cache Keys**: Struktura klucza: `ingredients:list:{hash_of_params}`
- **TTL**: 15 minut dla list składników, 1 godzina dla pojedynczych składników
- **Cache Invalidation**: Invalidacja po utworzeniu/aktualizacji składnika

### Search Optimization:
- **Full-text search**: Wykorzystanie PostgreSQL FTS lub Elasticsearch
- **Autocomplete**: Prefix matching z dedykowanym indeksem
- **Search Analytics**: Tracking popularnych wyszukiwań dla optymalizacji

### Rate Limiting:
- **Per-user limits**: 100 GET requests/minute, 10 POST requests/minute
- **Global limits**: Protection przed DDoS attacks
- **Sliding window**: Dokładniejsze śledzenie limitów

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie struktury plików
- Utworzenie `backend/routers/` directory (jeśli nie istnieje)
- Utworzenie `backend/services/` directory
- Utworzenie `backend/models/requests.py` i `backend/models/responses.py`
- Aktualizacja `backend/models/__init__.py`

### Krok 2: Aktualizacja modelu bazy danych
- Modyfikacja `backend/models/ingredient.py` zgodnie z schema Supabase
- Zmiana ID na UUID, dodanie unit_type enum
- Usunięcie category i is_common (zgodnie z aktualnym schema)
- Dodanie proper timestamps i constraints

### Krok 3: Implementacja modeli Pydantic
- Utworzenie enum UnitType
- Implementacja CreateIngredientRequest z walidatorami
- Implementacja IngredientQueryParams z validation
- Implementacja IngredientResponse i PaginatedIngredientsResponse

### Krok 4: Implementacja IngredientService
- Utworzenie `backend/services/ingredient_service.py`
- Implementacja `get_ingredients()` z filtering, sorting, pagination
- Implementacja `create_ingredient()` z uniqueness check
- Implementacja `get_ingredient_by_id()` z proper error handling
- Implementacja `increment_ingredient_popularity()` integration

### Krok 5: Implementacja Authentication Dependencies
- Aktualizacja `backend/dependencies/auth.py` (jeśli istnieje)
- Implementacja JWT validation dependency
- Opcjonalna implementacja admin permission check

### Krok 6: Implementacja Ingredients Router
- Utworzenie `backend/routers/ingredients.py`
- Implementacja GET `/` endpoint z query params
- Implementacja POST `/` endpoint z authentication
- Implementacja GET `/{ingredient_id}` endpoint
- Konfiguracja proper response models i error handling

### Krok 7: Konfiguracja Error Handling
- Implementacja custom exception handlers
- Konfiguracja structured logging
- Integration z monitoring tools

### Krok 8: Aktualizacja głównej aplikacji
- Aktualizacja `backend/main.py` z ingredients router
- Konfiguracja proper prefix `/api/ingredients`
- Aktualizacja CORS settings jeśli potrzebne

### Krok 9: Implementacja testów
- Unit testy dla IngredientService methods
- Integration testy dla wszystkich endpoints
- Performance testy dla pagination i search
- Security testy dla authentication i input validation

### Krok 10: Optimizations i Monitoring
- Implementacja caching strategy
- Konfiguracja rate limiting
- Setup monitoring i alerting
- Performance tuning based na load testing

### Krok 11: Dokumentacja i Deployment
- Aktualizacja OpenAPI/Swagger documentation
- Dodanie example requests/responses
- Documentation error codes i rate limits
- Deployment na staging i production environments 