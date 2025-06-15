# Plan implementacji widoku Szczegóły Przepisu

## 1. Przegląd
Widok Szczegóły Przepisu umożliwia użytkownikom przeglądanie kompletnych informacji o wybranym przepisie, w tym zdjęcia, listy składników, kroków przygotowania oraz możliwość oceniania przepisu. Widok jest dostępny dla wszystkich użytkowników, jednak funkcja oceniania wymaga uwierzytelnienia.

## 2. Routing widoku
Widok będzie dostępny na ścieżce: `/recipes/[id]` gdzie `[id]` to UUID przepisu.

## 3. Struktura komponentów
```
RecipeDetailPage (główny kontener)
├── RecipeHeader (zdjęcie i tytuł)
│   ├── RecipeImage (zdjęcie przepisu)
│   └── RecipeTitleSection (nazwa przepisu)
├── RecipeInfo (podstawowe informacje)
│   ├── PrepTimeDisplay (czas przygotowania)
│   ├── DifficultyBadge (poziom trudności)
│   └── RatingDisplay (średnia ocena)
├── IngredientsList (lista składników)
│   └── IngredientItem[] (pojedyncze składniki)
├── StepsList (kroki przygotowania)
│   └── StepItem[] (pojedyncze kroki)
├── RatingComponent (system oceniania)
│   └── StarRating (gwiazdki)
└── BackButton (powrót do poprzedniej strony)
```

## 4. Szczegóły komponentów

### RecipeDetailPage
- **Opis komponentu**: Główny kontener widoku odpowiedzialny za pobieranie danych przepisu i zarządzanie stanem całego widoku
- **Główne elementy**: Layout z sekcjami dla nagłówka, informacji, składników, kroków i oceniania
- **Obsługiwane interakcje**: Pobieranie danych przepisu, obsługa stanów ładowania i błędów
- **Obsługiwana walidacja**: Walidacja prawidłowego UUID w parametrze URL, sprawdzenie istnienia przepisu
- **Typy**: RecipeDetailDto, LoadingState, ErrorState
- **Propsy**: id (string) - UUID przepisu z parametrów URL

### RecipeHeader
- **Opis komponentu**: Sekcja nagłówkowa zawierająca zdjęcie przepisu i jego nazwę
- **Główne elementy**: img element dla zdjęcia przepisu, h1 dla nazwy przepisu
- **Obsługiwane interakcje**: Lazy loading zdjęcia, fallback dla brakującego zdjęcia
- **Obsługiwana walidacja**: Walidacja czy zdjęcie istnieje (image_data nie jest null/undefined)
- **Typy**: string (name), string? (image_data)
- **Propsy**: name: string, imageData?: string

### RecipeInfo
- **Opis komponentu**: Sekcja wyświetlająca podstawowe informacje o przepisie
- **Główne elementy**: div z informacjami o czasie, trudności i ocenie, Badge komponenty z shadcn/ui
- **Obsługiwane interakcje**: Wyświetlanie formatowanego czasu, kolorowego badge'a trudności
- **Obsługiwana walidacja**: Sprawdzenie czy preparation_time_minutes > 0, czy complexity_level to valid enum
- **Typy**: number (preparation_time_minutes), 'easy'|'medium'|'hard' (complexity_level), number (average_rating), number (total_votes)
- **Propsy**: prepTime: number, difficulty: 'easy'|'medium'|'hard', averageRating: number, totalVotes: number

### IngredientsList
- **Opis komponentu**: Lista wszystkich składników wymaganych do przepisu
- **Główne elementy**: ul element z listą IngredientItem komponentów
- **Obsługiwane interakcje**: Wyświetlanie składników z jednostkami, oznaczanie opcjonalnych składników
- **Obsługiwana walidacja**: Sprawdzenie czy lista składników nie jest pusta, czy amount > 0 dla każdego składnika
- **Typy**: RecipeIngredientDto[]
- **Propsy**: ingredients: RecipeIngredientDto[]

### IngredientItem
- **Opis komponentu**: Pojedynczy element listy składników
- **Główne elementy**: li element z nazwą składnika, ilością, jednostką i opcjonalnym oznaczeniem
- **Obsługiwane interakcje**: Wyróżnienie opcjonalnych składników, wyświetlanie substytutów
- **Obsługiwana walidacja**: Sprawdzenie czy name nie jest pusty, czy amount jest liczbą dodatnią
- **Typy**: RecipeIngredientDto
- **Propsy**: ingredient: RecipeIngredientDto

### StepsList
- **Opis komponentu**: Lista kroków przygotowania przepisu
- **Główne elementy**: ol element z numerowaną listą StepItem komponentów
- **Obsługiwane interakcje**: Wyświetlanie kroków w odpowiedniej kolejności
- **Obsługiwana walidacja**: Sprawdzenie czy lista kroków nie jest pusta, czy numery kroków są prawidłowe (1,2,3...)
- **Typy**: RecipeStep[]
- **Propsy**: steps: RecipeStep[]

### StepItem
- **Opis komponentu**: Pojedynczy krok przygotowania
- **Główne elementy**: li element z numerem kroku i opisem
- **Obsługiwane interakcje**: Wyróżnienie aktualnego kroku podczas przewijania
- **Obsługiwana walidacja**: Sprawdzenie czy description nie jest pusty, czy step jest liczbą dodatnią
- **Typy**: RecipeStep
- **Propsy**: step: RecipeStep

### RatingComponent
- **Opis komponentu**: System oceniania przepisu dostępny dla zalogowanych użytkowników
- **Główne elementy**: StarRating komponent, przycisk logowania dla niezalogowanych
- **Obsługiwane interakcje**: Ocenianie przepisu (1-5 gwiazdek), przekierowanie do logowania
- **Obsługiwana walidacja**: Sprawdzenie stanu uwierzytelnienia, walidacja oceny (1-5), sprawdzenie czy użytkownik już ocenił
- **Typy**: RateRecipeCommand, RecipeRatingDto, boolean (isAuthenticated)
- **Propsy**: recipeId: string, isAuthenticated: boolean, onRatingSubmitted: (rating: RecipeRatingDto) => void

### StarRating
- **Opis komponentu**: Komponent gwiazdek do wizualnego oceniania
- **Główne elementy**: 5 button elementów z ikonami gwiazdek
- **Obsługiwane interakcje**: Hover efekty, kliknięcie gwiazdek, wysyłanie oceny
- **Obsługiwana walidacja**: Sprawdzenie czy rating jest między 1 a 5
- **Typy**: number (rating), function (onRate)
- **Propsy**: currentRating?: number, onRate: (rating: number) => void, disabled?: boolean

## 5. Typy
```typescript
// Główny typ danych przepisu (już zdefiniowany w types.ts)
export type RecipeDetailDto = Omit<Recipes, 'steps'> & {
  steps: RecipeStep[];
  ingredients: RecipeIngredientDto[];
  image_data?: string;
};

// Typ składnika w przepisie (już zdefiniowany)
export type RecipeIngredientDto = RecipeIngredients & Pick<Ingredients, 'name' | 'unit_type'>;

// Typ kroku przepisu (już zdefiniowany)
export type RecipeStep = {
  step: number;
  description: string;
};

// Nowe typy dla widoku
export type RecipeDetailViewState = {
  recipe: RecipeDetailDto | null;
  isLoading: boolean;
  error: string | null;
  isRatingLoading: boolean;
  ratingError: string | null;
};

export type RecipeRatingState = {
  hasRated: boolean;
  currentUserRating?: number;
  isSubmitting: boolean;
};
```

## 6. Zarządzanie stanem
Widok będzie wykorzystywał następujące mechanizmy zarządzania stanem:
- **useState** dla lokalnego stanu komponentu (ładowanie, błędy, dane przepisu)
- **Custom hook useRecipeDetail(id)** do pobierania danych przepisu z API
- **Custom hook useRecipeRating(recipeId)** do obsługi oceniania przepisu
- **Custom hook useAuth()** do sprawdzania stanu uwierzytelnienia użytkownika
- **Local state** dla UI interakcji (hover efekty w ocenianiu)

## 7. Integracja API
Widok będzie integrował się z następującymi endpointami:

### GET `/recipes/{recipeId}`
- **Typ żądania**: brak body, recipeId w path params
- **Typ odpowiedzi**: RecipeDetailDto
- **Obsługa błędów**: 404 (przepis nie znaleziony), 422 (nieprawidłowy UUID), 500 (błąd serwera)

### POST `/recipes/{recipeId}/rate`
- **Typ żądania**: RateRecipeCommand w body, Authorization header
- **Typ odpowiedzi**: RecipeRatingDto
- **Obsługa błędów**: 401 (brak uwierzytelnienia), 404 (przepis nie znaleziony), 409 (już oceniono), 400 (nieprawidłowa ocena)

## 8. Interakcje użytkownika
- **Przeglądanie przepisu**: Użytkownik może przewijać przez różne sekcje przepisu (składniki, kroki)
- **Ocenianie przepisu**: Zalogowany użytkownik może kliknąć na gwiazdki aby ocenić przepis (1-5)
- **Logowanie**: Niezalogowany użytkownik może kliknąć przycisk "Zaloguj się aby ocenić" 
- **Nawigacja**: Użytkownik może użyć przycisku "Wstecz" lub nawigacji przeglądarki
- **Udostępnianie**: URL przepisu można skopiować i udostępnić (permalink)

## 9. Warunki i walidacja
- **Parametr URL**: Sprawdzenie czy ID przepisu jest prawidłowym UUID
- **Istnienie przepisu**: Walidacja czy przepis o podanym ID istnieje w bazie danych
- **Stan uwierzytelnienia**: Sprawdzenie czy użytkownik jest zalogowany przed pokazaniem opcji oceniania
- **Ocena**: Walidacja czy wartość oceny jest liczbą całkowitą między 1 a 5
- **Dane przepisu**: Walidacja kompletności danych przepisu (nazwa, składniki, kroki)
- **Uprawnienia**: Sprawdzenie czy użytkownik może ocenić przepis (nie ocenił wcześniej)

## 10. Obsługa błędów
- **Błąd 404**: Wyświetlenie komunikatu "Przepis nie został znaleziony" z przyciskiem powrotu do strony głównej
- **Błąd sieci**: Toast z komunikatem "Błąd połączenia. Spróbuj ponownie" i przycisk retry
- **Błąd uwierzytelnienia**: Przekierowanie do strony logowania z RetURL
- **Błąd walidacji oceny**: Toast z komunikatem "Nieprawidłowa ocena. Wybierz od 1 do 5 gwiazdek"
- **Błąd już oceniono**: Toast z komunikatem "Już oceniłeś ten przepis"
- **Błąd ładowania zdjęcia**: Placeholder image z ikoną przepisu
- **Timeout API**: Toast z komunikatem o problemach z serwerem i opcją ponowienia

## 11. Kroki implementacji
1. **Utworzenie custom hooków**:
   - `useRecipeDetail(id)` - pobieranie danych przepisu
   - `useRecipeRating(recipeId)` - obsługa oceniania
   - `useAuth()` - sprawdzanie uwierzytelnienia

2. **Implementacja podstawowych komponentów UI**:
   - `RecipeImage` z lazy loading i fallback
   - `RecipeTitleSection` z responsywną typografią
   - `PrepTimeDisplay`, `DifficultyBadge`, `RatingDisplay`

3. **Implementacja list składników i kroków**:
   - `IngredientsList` i `IngredientItem` z formatowaniem jednostek
   - `StepsList` i `StepItem` z numeracją i stylizacją

4. **Implementacja systemu oceniania**:
   - `StarRating` z interaktywnymi gwiazdkami
   - `RatingComponent` z logiką uwierzytelniania

5. **Sestavienie głównego widoku**:
   - `RecipeDetailPage` z layout i zarządzaniem stanem
   - Integracja wszystkich komponentów
   - Dodanie `BackButton` i nawigacji

6. **Implementacja obsługi błędów**:
   - Error boundaries dla każdej sekcji
   - Loading states i skeleton components
   - Toast notifications dla użytkownika

7. **Dodanie responsywności**:
   - Mobile-first approach z Tailwind CSS
   - Testowanie na różnych rozmiarach ekranu
   - Optymalizacja dla dostępności

8. **Testy i optymalizacja**:
   - Unit testy dla hooków i logiki biznesowej
   - Integration testy dla API calls
   - Performance testing i lazy loading
   - Accessibility testing z screen readerami 