# API Endpoint Implementation Plan: GET /users/me

## 1. Przegląd punktu końcowego

Endpoint `GET /users/me` służy do pobierania profilu aktualnie uwierzytelnionego użytkownika. Jest to podstawowy endpoint autentyfikacji, który pozwala aplikacji klienckiej na pobranie danych profilu zalogowanego użytkownika. Endpoint wymaga uwierzytelnienia poprzez token JWT i zwraca dane profilu użytkownika zgodne z modelem UserDto.

## 2. Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/users/me` (z prefiksem /api zgodnie z istniejącą strukturą)
- **Parametry**:
  - **Wymagane**: Token uwierzytelniający w nagłówku `Authorization: Bearer <token>`
  - **Opcjonalne**: Brak
- **Request Body**: Brak (metoda GET)

## 3. Wykorzystywane typy

### Istniejące typy (z src/types.ts):
- **Response DTO**: `UserDto` - zawiera wszystkie wymagane pola odpowiedzi:
  ```typescript
  export type UserDto = Pick<Users, 'id' | 'email' | 'created_at' | 'updated_at'>;
  ```

### Nowe typy do utworzenia:
- **Pydantic Response Model** (backend/models/responses.py):
  ```python
  from pydantic import BaseModel
  from datetime import datetime
  from typing import Optional

  class UserResponse(BaseModel):
      id: str
      email: str
      created_at: datetime
      updated_at: Optional[datetime] = None
      
      class Config:
          from_attributes = True
  ```

## 4. Szczegóły odpowiedzi

### Pomyślna odpowiedź (200 OK):
```json
{
  "id": "uuid-string",
  "email": "user@example.com", 
  "created_at": "2023-12-01T10:00:00.000Z",
  "updated_at": "2023-12-01T12:30:00.000Z"
}
```

### Kody stanu błędów:
- **401 Unauthorized**: Brak tokenu lub nieprawidłowy token uwierzytelniający
- **404 Not Found**: Użytkownik nie został znaleziony w bazie danych
- **500 Internal Server Error**: Błędy po stronie serwera (problemy z bazą danych)

## 5. Przepływ danych

1. **Odbiór żądania**: FastAPI odbiera żądanie GET na `/api/users/me`
2. **Walidacja uwierzytelnienia**: Middleware/dependency sprawdza token JWT i wyodrębnia user_id
3. **Wywołanie serwisu**: UserService.get_current_user(user_id) 
4. **Zapytanie do bazy**: Zapytanie do tabeli `users` z filtrem WHERE id = user_id
5. **Zastosowanie RLS**: Supabase automatycznie aplikuje polityki RLS
6. **Mapowanie danych**: Konwersja wyniku SQLAlchemy na UserResponse Pydantic model
7. **Zwrócenie odpowiedzi**: JSON response z danymi użytkownika

### Interakcje z bazą danych:
- **Tabela**: `users`
- **Zapytanie**: `SELECT id, email, created_at, updated_at FROM users WHERE id = $1`
- **RLS Policy**: "Users can view their own profile" automatycznie filtruje wyniki

## 6. Względy bezpieczeństwa

### Uwierzytelnienie:
- **JWT Token Validation**: Wymagany ważny token JWT w nagłówku Authorization
- **Token Payload**: Musi zawierać user_id do identyfikacji użytkownika
- **Token Expiry**: Sprawdzenie ważności tokenu (exp claim)

### Autoryzacja:
- **Self-access only**: Użytkownik może dostać tylko własne dane
- **RLS Enforcement**: Polityki Row Level Security w Supabase zapewniają dodatkową warstwę bezpieczeństwa

### Walidacja danych:
- **Input Sanitization**: Walidacja user_id z tokenu (format UUID)
- **SQL Injection Protection**: Użycie parametryzowanych zapytań SQLAlchemy

## 7. Obsługa błędów

### 401 Unauthorized:
- **Przyczyny**: Brak tokenu, nieprawidłowy format, wygasły token, nieprawidłowy podpis
- **Response**: `{"detail": "Authentication required"}`
- **Logging**: Log poziom WARNING z informacją o próbie nieautoryzowanego dostępu

### 404 Not Found:
- **Przyczyny**: User_id z tokenu nie istnieje w bazie danych
- **Response**: `{"detail": "User not found"}`
- **Logging**: Log poziom ERROR - może wskazywać na problemy z synchronizacją danych

### 500 Internal Server Error:
- **Przyczyny**: Błędy połączenia z bazą danych, problemy z Supabase
- **Response**: `{"detail": "Internal server error"}`
- **Logging**: Log poziom ERROR z pełnym stack trace

### Centralized Error Handling:
- Użycie FastAPI HTTPException dla spójnej obsługi błędów
- Custom exception handlers dla specyficznych typów błędów

## 8. Rozważania dotyczące wydajności

### Optymalizacje zapytań:
- **Index Usage**: Użycie primary key index na users.id (automatycznie zoptymalizowane)
- **SELECT Specific Fields**: Pobieranie tylko potrzebnych kolumn
- **Connection Pooling**: Wykorzystanie SQLAlchemy connection pooling

### Caching Strategy:
- **Application Level**: Opcjonalne cachowanie profilu użytkownika (Redis/memory cache)
- **Cache TTL**: Krótki TTL (5-10 minut) dla danych profilu
- **Cache Invalidation**: Invalidacja przy aktualizacji profilu

### Monitoring:
- **Response Time Tracking**: Monitoring czasu odpowiedzi endpoint
- **Database Query Performance**: Tracking czasu wykonania zapytań
- **Error Rate Monitoring**: Monitoring częstotliwości błędów 401/404

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie struktury plików
- Utworzenie `backend/routers/` directory
- Utworzenie `backend/services/` directory
- Utworzenie `backend/dependencies/` directory dla auth dependencies

### Krok 2: Implementacja modeli Pydantic
- Utworzenie `backend/models/responses.py` z `UserResponse` model
- Aktualizacja `backend/models/__init__.py` z nowym importem

### Krok 3: Implementacja uwierzytelnienia
- Utworzenie `backend/dependencies/auth.py` z JWT validation dependency
- Implementacja `get_current_user_id()` dependency function
- Konfiguracja JWT secret i algorytmu

### Krok 4: Implementacja UserService
- Utworzenie `backend/services/user_service.py`
- Implementacja `get_user_by_id()` method
- Obsługa mapowania SQLAlchemy models na Pydantic responses

### Krok 5: Implementacja routera
- Utworzenie `backend/routers/users.py`
- Implementacja `GET /me` endpoint z właściwymi dependencies
- Konfiguracja error handling i response models

### Krok 6: Aktualizacja User model
- Modyfikacja `backend/models/user.py` aby pasować do schema bazy danych
- Zmiana id na UUID typ zgodnie z Supabase schema
- Usunięcie username i hashed_password (nie są używane w tym endpoint)

### Krok 7: Konfiguracja routingu
- Aktualizacja `backend/main.py` z nowym users router
- Dodanie właściwego prefixu `/api/users`

### Krok 8: Testowanie
- Unit testy dla UserService
- Integration testy dla endpoint
- Testy uwierzytelnienia i autoryzacji
- Testy scenariuszy błędów

### Krok 9: Dokumentacja
- Aktualizacja OpenAPI/Swagger documentation
- Dodanie przykładów request/response
- Dokumentacja error codes

### Krok 10: Deployment i monitoring
- Deployment na staging environment
- Konfiguracja logowania i monitoringu
- Testy end-to-end z frontendem 