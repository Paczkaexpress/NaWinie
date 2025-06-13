# Architektura UI dla NaWinie (Na co mam Winię?)

## 1. Przegląd struktury UI

Aplikacja NaWinie to platforma do wyszukiwania przepisów na podstawie dostępnych składników. Struktura UI jest zorganizowana wokół głównego przepływu użytkownika: od wyboru składników do wyświetlenia pasujących przepisów. Interfejs jest zoptymalizowany pod kątem użytkowników desktopowych, z naciskiem na prostotę i efektywność.

### Główne założenia:
- Design desktop-first
- Tryb jasny (light mode)
- Dostępność podstawowa przez shadcn/ui
- Infinite scroll dla list przepisów
- Responsywność: 3 kolumny (≥1024px), 2 kolumny (≥640px)
- Persystencja stanu w URL i localStorage

## 2. Lista widoków

### Strona Główna (Home)
- **Ścieżka**: `/`
- **Główny cel**: Wyszukiwanie przepisów na podstawie składników
- **Kluczowe informacje**:
  - Lista wybranych składników
  - Grid przepisów (popularne lub dopasowane)
  - Status zalogowania
- **Kluczowe komponenty**:
  - Input dodawania składników z przyciskiem usuwania
  - Przycisk "Wyczyść listę" z potwierdzeniem
  - Grid przepisów z infinite scroll
  - Kafelki przepisów (zdjęcie, nazwa, ocena, czas)
- **Względy UX/Dostępność**:
  - Natychmiastowa aktualizacja listy przepisów
  - Persystencja składników w URL
  - Wskaźniki ładowania podczas fetching
  - Toast dla operacji na liście składników

### Szczegóły Przepisu (Recipe Detail)
- **Ścieżka**: `/recipes/:id`
- **Główny cel**: Prezentacja pełnych informacji o przepisie
- **Kluczowe informacje**:
  - Zdjęcie przepisu
  - Nazwa, czas przygotowania, ocena
  - Lista składników
  - Kroki przygotowania
  - System oceniania (dla zalogowanych)
- **Kluczowe komponenty**:
  - Galeria zdjęć
  - Sekcja oceniania z gwiazdkami
  - Lista kroków
  - Przycisk powrotu
- **Względy UX/Dostępność**:
  - Przekierowanie do logowania przy próbie oceny
  - Toast potwierdzający ocenę
  - Zachowanie scroll position

### Dodawanie Przepisu (Add Recipe)
- **Ścieżka**: `/recipes/new`
- **Główny cel**: Umożliwienie dodania nowego przepisu
- **Kluczowe informacje**:
  - Formularz dodawania przepisu
  - Upload zdjęcia
  - Lista składników z jednostkami
- **Kluczowe komponenty**:
  - Form z walidacją
  - Uploader zdjęć (max 1MB)
  - Dynamiczna lista składników
  - Textarea na kroki
- **Względy UX/Dostępność**:
  - Walidacja w locie
  - Preview zdjęcia
  - Toast sukcesu i przekierowanie
  - Zabezpieczenie przed przypadkowym opuszczeniem

### Panel Użytkownika (User Panel)
- **Ścieżka**: `/me`
- **Główny cel**: Zarządzanie domyślnymi składnikami
- **Kluczowe informacje**:
  - Lista "zawsze obecnych" składników
  - Opcje CRUD dla składników
- **Kluczowe komponenty**:
  - Lista składników z akcjami
  - Formularz dodawania składnika
- **Względy UX/Dostępność**:
  - Instant feedback przy zmianach
  - Potwierdzenia usuwania
  - Toast dla operacji CRUD

### Logowanie/Rejestracja (Auth)
- **Ścieżka**: `/auth/login`, `/auth/register`
- **Główny cel**: Autentykacja użytkownika
- **Kluczowe informacje**:
  - Formularze logowania/rejestracji
  - Komunikaty błędów
  - RetURL do poprzedniej strony
- **Kluczowe komponenty**:
  - Formularze z walidacją
  - Przyciski submit
  - Linki między formami
- **Względy UX/Dostępność**:
  - Jasne komunikaty błędów
  - Zabezpieczenie przed multi-submit
  - Automatyczne przekierowanie po sukcesie

## 3. Mapa podróży użytkownika

### Główny przepływ - Wyszukiwanie przepisu:
1. Wejście na stronę główną
2. Dodawanie składników do listy
3. Przeglądanie dopasowanych przepisów
4. Wejście w szczegóły przepisu
5. (Opcjonalnie) Ocena przepisu
   - Jeśli niezalogowany → Logowanie → Powrót do przepisu
   - Jeśli zalogowany → Bezpośrednia ocena

### Przepływ dodawania przepisu:
1. Zalogowanie
2. Przejście do formularza dodawania
3. Wypełnienie danych i upload zdjęcia
4. Potwierdzenie i przekierowanie do szczegółów

### Przepływ zarządzania składnikami:
1. Zalogowanie
2. Przejście do panelu użytkownika
3. Zarządzanie listą domyślnych składników
4. Automatyczna synchronizacja z główną listą

## 4. Układ i struktura nawigacji

### Główna nawigacja:
- Logo (link do home) - lewy górny róg
- Przyciski Auth (Login/Register) lub User Menu - prawy górny róg
- Przycisk "Dodaj przepis" - widoczny dla zalogowanych

### User Menu (dropdown):
- Panel użytkownika
- Wyloguj

### Nawigacja kontekstowa:
- Breadcrumbs w widokach zagnieżdżonych
- Przyciski powrotu w szczegółach przepisu
- Linki w toastach (np. do nowo dodanego przepisu)

## 5. Kluczowe komponenty

### RecipeCard
- Kafelek przepisu używany w gridzie
- Zawiera: zdjęcie, nazwa, ocena, czas
- Klikalny w całości
- Lazy loading dla zdjęć

### IngredientList
- Lista składników z akcjami
- Używana w Home i User Panel
- Obsługa usuwania i czyszczenia

### RatingComponent
- System gwiazdek do oceniania
- Obsługa stanu zalogowania
- Feedback wizualny

### AuthGuard
- HOC do zabezpieczania tras
- Obsługa przekierowań
- Zarządzanie RetURL

### Toast Provider
- Globalne powiadomienia
- Różne typy: sukces, błąd, info
- Opcjonalne akcje w toaście

### ImageUploader
- Komponent do uploadu zdjęć
- Walidacja rozmiaru i formatu
- Preview

### InfiniteGrid
- Grid z infinite scroll
- Skeleton loading
- Obsługa błędów i retry 