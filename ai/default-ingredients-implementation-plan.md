# API Endpoint Implementation Plan: User Default Ingredients Management

## 1. Przegląd punktu końcowego

Implementacja endpointów do zarządzania domyślnymi składnikami użytkownika. System pozwala użytkownikom na definiowanie listy składników, które zawsze mają w domu (np. sól, pieprz, olej), co ułatwia filtrowanie przepisów i planowanie posiłków.

**Główne funkcjonalności:**
- Pobieranie listy domyślnych składników użytkownika
- Dodawanie nowych składników do listy domyślnych
- Usuwanie składników z listy domyślnych

## 2. Szczegóły żądania

### 2.1 GET /api/users/me/default-ingredients
- **Metoda HTTP:** GET
- **Struktura URL:** `/api/users/me/default-ingredients`
- **Parametry:**
  - Wymagane: Authorization header (Bearer token)
  - Opcjonalne: query parameters dla paginacji (page, limit)
- **Request Body:** Brak

### 2.2 POST /api/users/me/default-ingredients
- **Metoda HTTP:** POST
- **Struktura URL:** `/api/users/me/default-ingredients`
- **Parametry:**
  - Wymagane: Authorization header (Bearer token)
- **Request Body:** `AddUserDefaultIngredientCommand`

### 2.3 DELETE /api/users/me/default-ingredients/{ingredient_id}
- **Metoda HTTP:** DELETE
- **Struktura URL:** `/api/users/me/default-ingredients/{ingredient_id}`
- **Parametry:**
  - Wymagane: Authorization header (Bearer token), ingredient_id (UUID w ścieżce)
- **Request Body:** Brak

## 3. Wykorzystywane typy

### DTOs:
- `UserDefaultIngredientDto` - reprezentuje domyślny składnik użytkownika z detalami
- `UserDefaultIngredientAddedDto` - potwierdzenie dodania składnika

### Command Models:
- `AddUserDefaultIngredientCommand` - dane do dodania składnika do domyślnych

### Database Models:
- `UserDefaultIngredient` - model ORM dla tabeli user_default_ingredients
- `Ingredient` - model ORM dla tabeli ingredients

## 4. Szczegóły odpowiedzi

### GET /api/users/me/default-ingredients
- **200 OK:** Lista domyślnych składników użytkownika
```json
{
  "data": [
    {
      "ingredient_id": "uuid",
      "name": "string",
      "unit_type": "ml|g|szt",
      "created_at": "timestamp"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total_items": 10,
    "total_pages": 1
  }
}
```

### POST /api/users/me/default-ingredients
- **201 Created:** Składnik dodany pomyślnie
```json
{
  "user_id": "uuid",
  "ingredient_id": "uuid",
  "created_at": "timestamp"
}
```

### DELETE /api/users/me/default-ingredients/{ingredient_id}
- **204 No Content:** Składnik usunięty pomyślnie

## 5. Przepływ danych

### GET Request Flow:
1. Walidacja JWT tokenu → ekstraktowanie user_id
2. Zapytanie do bazy: JOIN user_default_ingredients + ingredients
3. Zastosowanie paginacji
4. Zwrócenie sformatowanych danych

### POST Request Flow:
1. Walidacja JWT tokenu → ekstraktowanie user_id
2. Walidacja request body (ingredient_id format)
3. Sprawdzenie czy składnik istnieje w tabeli ingredients
4. Sprawdzenie czy składnik nie jest już dodany do domyślnych
5. Dodanie rekordu do user_default_ingredients
6. Zwrócenie potwierdzenia

### DELETE Request Flow:
1. Walidacja JWT tokenu → ekstraktowanie user_id
2. Walidacja ingredient_id (UUID format)
3. Sprawdzenie czy relacja user-ingredient istnieje
4. Usunięcie rekordu z user_default_ingredients
5. Zwrócenie statusu 204

## 6. Względy bezpieczeństwa

### Uwierzytelnianie:
- JWT Bearer token wymagany dla wszystkich endpointów
- Walidacja tokenu poprzez dependency injection

### Autoryzacja:
- Użytkownik może zarządzać tylko swoimi domyślnymi składnikami
- user_id ekstraktowany z JWT tokenu, nie z parametrów żądania

### Walidacja danych:
- Walidacja UUID dla ingredient_id
- Sprawdzenie istnienia składnika przed dodaniem
- Zapobieganie duplikatom w tabeli user_default_ingredients

### Rate Limiting:
- Implementacja podstawowego rate limitingu dla endpointów modyfikujących

## 7. Obsługa błędów

### Potencjalne błędy i kody stanu:

- **400 Bad Request:**
  - Nieprawidłowy format ingredient_id (nie UUID)
  - Nieprawidłowe dane w request body
  - Składnik już istnieje w domyślnych użytkownika (POST)

- **401 Unauthorized:**
  - Brak tokenu autoryzacji
  - Nieprawidłowy/wygasły token JWT

- **404 Not Found:**
  - Składnik o podanym ID nie istnieje
  - Próba usunięcia nieistniejącego domyślnego składnika

- **409 Conflict:**
  - Próba dodania składnika który już jest w domyślnych

- **500 Internal Server Error:**
  - Błędy połączenia z bazą danych
  - Nieoczekiwane błędy aplikacji

### Struktura odpowiedzi błędu:
```json
{
  "detail": "Error message",
  "error_code": "INGREDIENT_NOT_FOUND",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje bazy danych:
- Index na kolumnie (user_id, ingredient_id) w user_default_ingredients
- JOIN optimization dla GET endpoint
- Limit maksymalnej liczby domyślnych składników na użytkownika (np. 100)

### Caching:
- Cache domyślnych składników użytkownika (Redis)
- TTL: 1 godzina lub do następnej modyfikacji

### Paginacja:
- Domyślny limit: 50 składników na stronę
- Maksymalny limit: 100 składników na stronę

## 9. Etapy wdrożenia

### Krok 1: Struktura projektu
- Utworzenie katalogu `backend/routers/`
- Utworzenie pliku `user_default_ingredients.py`
- Utworzenie katalogu `backend/services/`

### Krok 2: Modele bazy danych
- Stworzenie modelu ORM `UserDefaultIngredient` w `backend/models/`
- Aktualizacja `__init__.py` w models
- Sprawdzenie i aktualizacja modelu `Ingredient`

### Krok 3: Service Layer
- Implementacja `UserDefaultIngredientsService` w `backend/services/`
- Metody: `get_user_defaults()`, `add_default()`, `remove_default()`
- Logika biznesowa i walidacja

### Krok 4: Authentication Dependency
- Implementacja JWT validation dependency
- Funkcja do ekstraktowania user_id z tokenu

### Krok 5: Router Implementation
- Implementacja wszystkich trzech endpointów
- Walidacja Pydantic models
- Dependency injection dla service i auth

### Krok 6: Error Handling
- Custom exception handlers
- Standardized error responses
- Logging mechanism

### Krok 7: Testing
- Unit tests dla service layer
- Integration tests dla endpoints
- Error scenario testing

### Krok 8: Documentation
- OpenAPI/Swagger documentation
- Request/response examples
- Error code documentation

### Krok 9: Integration
- Aktualizacja `main.py` - include router
- Database migration jeśli potrzebna
- Environment configuration

### Krok 10: Performance & Security
- Rate limiting implementation
- Input sanitization
- Performance monitoring setup 