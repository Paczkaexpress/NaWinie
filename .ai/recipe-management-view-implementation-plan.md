# Plan implementacji widoku zarządzania przepisami

## 1. Przegląd
Widok zarządzania przepisami umożliwia zalogowanym użytkownikom edytowanie, usuwanie oraz ocenianie przepisów. Widok jest dostępny tylko dla uwierzytelnionych użytkowników i zapewnia pełne operacje CRUD na przepisach, z uwzględnieniem zasad autoryzacji (tylko autor może edytować/usuwać swoje przepisy).

## 2. Routing widoku
- Główna ścieżka: `/recipes/{recipeId}/manage`
- Ścieżka edycji: `/recipes/{recipeId}/edit`
- Widok jest chroniony przez AuthGuard i wymaga uwierzytelnienia

## 3. Struktura komponentów
```
RecipeManagementView
├── RecipeManagementHeader
│   ├── RecipeTitle
│   ├── RecipeMetadata (czas, trudność, ocena)
│   └── ActionButtons (Edit, Delete, Back)
├── RecipeDetailsSection
│   ├── RecipeImage
│   ├── RecipeIngredients
│   └── RecipeSteps  
├── RecipeRatingSection (dla nie-autorów)
│   ├── RatingDisplay
│   └── RatingInput
└── RecipeEditModal
    ├── EditRecipeForm
    │   ├── BasicInfoSection
    │   ├── IngredientsSection
    │   └── StepsSection
    └── FormActions (Save, Cancel)
```

## 4. Szczegóły komponentów

### RecipeManagementView
- **Opis komponentu**: Główny kontener widoku zarządzania przepisem, obsługuje routing i stan globalny komponentu
- **Główne elementy**: Header z akcjami, sekcja szczegółów przepisu, sekcja oceniania (dla nie-autorów), modal edycji
- **Obsługiwane interakcje**: Przejście do edycji, usuwanie przepisu, ocenianie, powrót do listy
- **Obsługiwana walidacja**: Sprawdzenie autorstwa przepisu, walidacja uprawnień do edycji/usuwania
- **Typy**: RecipeManagementViewProps, RecipeManagementState
- **Propsy**: recipeId (string), initialRecipe (RecipeDetailDto), currentUser (UserDto)

### RecipeManagementHeader  
- **Opis komponentu**: Nagłówek widoku z tytułem przepisu, metadanymi i przyciskami akcji
- **Główne elementy**: Tytuł przepisu, informacje o czasie i trudności, przyciski Edit/Delete/Back
- **Obsługiwane interakcje**: Kliknięcie Edit (otwiera modal), kliknięcie Delete (pokazuje potwierdzenie), kliknięcie Back (powrót)
- **Obsługiwana walidacja**: Sprawdzenie czy użytkownik jest autorem (ukrycie przycisków Edit/Delete dla nie-autorów)
- **Typy**: RecipeHeaderProps
- **Propsy**: recipe (RecipeDetailDto), isAuthor (boolean), onEdit (function), onDelete (function), onBack (function)

### RecipeDetailsSection
- **Opis komponentu**: Sekcja wyświetlająca szczegóły przepisu - zdjęcie, składniki, kroki
- **Główne elementy**: Komponent zdjęcia przepisu, lista składników z ilościami, ponumerowana lista kroków
- **Obsługiwane interakcje**: Możliwość powiększenia zdjęcia, oznaczanie składników jako opcjonalnych
- **Obsługiwana walidacja**: Walidacja dostępności zdjęcia, sprawdzenie poprawności danych składników
- **Typy**: RecipeDetailsSectionProps  
- **Propsy**: recipe (RecipeDetailDto), isEditable (boolean)

### RecipeRatingSection
- **Opis komponentu**: Sekcja umożliwiająca ocenianie przepisu przez użytkowników niebędących autorami
- **Główne elementy**: Wyświetlanie aktualnej oceny, input gwiazdek do oceniania, przycisk Submit
- **Obsługiwane interakcje**: Kliknięcie gwiazdek (ustawienie oceny), submit oceny
- **Obsługiwana walidacja**: Walidacja oceny (1-5), sprawdzenie czy użytkownik już ocenił, blokada dla autorów
- **Typy**: RecipeRatingSectionProps, RatingState
- **Propsy**: recipeId (string), currentRating (RecipeRatingDto), isAuthor (boolean), onRatingSubmit (function)

### RecipeEditModal
- **Opis komponentu**: Modal z formularzem edycji przepisu, pozwala na aktualizację wszystkich danych przepisu
- **Główne elementy**: Formularz z polami na dane podstawowe, sekcja składników, sekcja kroków, przyciski Save/Cancel
- **Obsługiwane interakcje**: Edycja pól formularza, dodawanie/usuwanie składników i kroków, zapisywanie zmian
- **Obsługiwana walidacja**: Walidacja nazwy (1-255 znaków), czasu przygotowania (>0), listy składników (min 1), kroków (min 1)
- **Typy**: RecipeEditModalProps, EditRecipeFormData, EditFormValidationState
- **Propsy**: isOpen (boolean), recipe (RecipeDetailDto), onSave (function), onCancel (function)

## 5. Typy

### Nowe typy DTO i ViewModel:
```typescript
// Props dla głównego widoku
export type RecipeManagementViewProps = {
  recipeId: string;
  initialRecipe?: RecipeDetailDto;
  currentUser: UserDto;
};

// Stan widoku zarządzania
export type RecipeManagementState = {
  recipe: RecipeDetailDto | null;
  isLoading: boolean;
  error: string | null;
  isEditModalOpen: boolean;
  isDeleting: boolean;
  deleteConfirmOpen: boolean;
};

// Props dla nagłówka
export type RecipeHeaderProps = {
  recipe: RecipeDetailDto;
  isAuthor: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
};

// Props dla sekcji szczegółów
export type RecipeDetailsSectionProps = {
  recipe: RecipeDetailDto;
  isEditable: boolean;
};

// Props dla sekcji oceniania  
export type RecipeRatingSectionProps = {
  recipeId: string;
  currentRating: RecipeRatingDto;
  isAuthor: boolean;
  hasUserRated: boolean;
  onRatingSubmit: (rating: number) => Promise<void>;
};

// Stan oceniania
export type RatingState = {
  selectedRating: number;
  isSubmitting: boolean;
  error: string | null;
};

// Props dla modalu edycji
export type RecipeEditModalProps = {
  isOpen: boolean;
  recipe: RecipeDetailDto;
  onSave: (data: UpdateRecipeCommand) => Promise<void>;
  onCancel: () => void;
};

// Dane formularza edycji
export type EditRecipeFormData = {
  name: string;
  preparation_time_minutes: number;
  complexity_level: 'easy' | 'medium' | 'hard';
  steps: RecipeStepFormData[];
  ingredients: RecipeIngredientFormData[];
};

// Stan walidacji formularza edycji
export type EditFormValidationState = {
  name: string | null;
  preparation_time_minutes: string | null;
  complexity_level: string | null;
  steps: Array<string | null>;
  ingredients: Array<{
    ingredient_id: string | null;
    amount: string | null;
  }>;
  general: string | null;
};
```

## 6. Zarządzanie stanem
Widok wykorzystuje kombinację lokalnego stanu React i custom hook'a `useRecipeManagement`:

```typescript
// Custom hook do zarządzania stanem przepisu
const useRecipeManagement = (recipeId: string, currentUser: UserDto) => {
  // Stan przepisu i operacji
  // Funkcje do aktualizacji, usuwania, oceniania
  // Obsługa błędów i ładowania
};

// Hook do zarządzania formularzem edycji
const useRecipeEditForm = (initialRecipe: RecipeDetailDto) => {
  // Stan formularza i walidacji
  // Funkcje do obsługi zmian w formularzu
  // Logika walidacji
};

// Hook do zarządzania ocenami
const useRecipeRating = (recipeId: string) => {
  // Stan oceniania
  // Funkcja submit oceny
  // Obsługa stanu po ocenieniu
};
```

## 7. Integracja API
Widok integruje się z trzema głównymi endpointami:

### GET /recipes/{recipeId}
- **Typ żądania**: Brak body
- **Typ odpowiedzi**: RecipeDetailResponse
- **Zastosowanie**: Pobranie szczegółów przepisu przy ładowaniu widoku

### PUT /recipes/{recipeId}
- **Typ żądania**: UpdateRecipeRequest (częściowa aktualizacja)
- **Typ odpowiedzi**: RecipeDetailResponse  
- **Zastosowanie**: Aktualizacja przepisu po edycji w modalu
- **Warunki**: Wymaga uwierzytelnienia, użytkownik musi być autorem

### DELETE /recipes/{recipeId}
- **Typ żądania**: Brak body
- **Typ odpowiedzi**: Status 204 No Content
- **Zastosowanie**: Usunięcie przepisu po potwierdzeniu
- **Warunki**: Wymaga uwierzytelnienia, użytkownik musi być autorem lub administratorem

### POST /recipes/{recipeId}/rate
- **Typ żądania**: RateRecipeRequest { rating: number }
- **Typ odpowiedzi**: RatingUpdateResponse { average_rating: number, total_votes: number }
- **Zastosowanie**: Ocena przepisu przez użytkownika
- **Warunki**: Wymaga uwierzytelnienia, użytkownik nie może być autorem, jedna ocena na użytkownika

## 8. Interakcje użytkownika

### Edycja przepisu:
1. Kliknięcie przycisku "Edit" → otwarcie modalu edycji
2. Modyfikacja danych w formularzu → walidacja w czasie rzeczywistym
3. Kliknięcie "Save" → wywołanie PUT API → aktualizacja widoku → zamknięcie modalu
4. Kliknięcie "Cancel" → potwierdzenie odrzucenia zmian → zamknięcie modalu

### Usuwanie przepisu:
1. Kliknięcie przycisku "Delete" → wyświetlenie dialogu potwierdzenia
2. Potwierdzenie usunięcia → wywołanie DELETE API → przekierowanie do listy przepisów
3. Anulowanie → zamknięcie dialogu

### Ocenianie przepisu:
1. Wybór oceny gwiazdkami → podświetlenie gwiazdek
2. Kliknięcie "Submit Rating" → wywołanie POST API → aktualizacja wyświetlanej oceny
3. Wyświetlenie komunikatu sukcesu → ukrycie sekcji oceniania

### Nawigacja:
1. Kliknięcie "Back" → powrót do poprzedniego widoku (lista przepisów/szczegóły)
2. Nawigacja przez breadcrumbs → przejście do właściwego widoku

## 9. Warunki i walidacja

### Warunki autoryzacji:
- **Edycja przepisu**: Użytkownik musi być autorem przepisu (`recipe.author_id === currentUser.id`)
- **Usuwanie przepisu**: Użytkownik musi być autorem lub administratorem
- **Ocenianie przepisu**: Użytkownik nie może być autorem (`recipe.author_id !== currentUser.id`)
- **Duplikowanie ocen**: Użytkownik może ocenić przepis tylko raz

### Walidacja formularza edycji:
- **Nazwa przepisu**: Wymagana, 1-255 znaków, bez pustych stringów
- **Czas przygotowania**: Wymagany, liczba całkowita > 0, max 9999 minut
- **Poziom trudności**: Wymagany, jedna z wartości: 'easy', 'medium', 'hard'
- **Składniki**: Minimum 1 składnik, każdy musi mieć: ingredient_id (UUID), amount (liczba > 0)
- **Kroki**: Minimum 1 krok, każdy krok musi mieć niepusty opis (1-1000 znaków)

### Walidacja oceny:
- **Wartość oceny**: Liczba całkowita od 1 do 5 (włącznie)
- **Jednorazowość**: Sprawdzenie czy użytkownik już ocenił przepis

## 10. Obsługa błędów

### Błędy autoryzacji:
- **401 Unauthorized**: Przekierowanie do strony logowania z returnUrl
- **403 Forbidden**: Wyświetlenie komunikatu "Brak uprawnień do tej operacji"
- **404 Not Found**: Wyświetlenie komunikatu "Przepis nie został znaleziony" + przycisk powrotu

### Błędy walidacji:
- **400 Bad Request**: Wyświetlenie szczegółowych błędów walidacji pod odpowiednimi polami formularza
- **422 Validation Error**: Wyświetlenie komunikatów błędów przy polach formularza

### Błędy konfliktów:
- **409 Conflict** (duplikacja oceny): "Już oceniłeś ten przepis"

### Błędy sieciowe:
- **500 Internal Server Error**: "Wystąpił błąd serwera. Spróbuj ponownie później."
- **Timeout/Network**: "Problemy z połączeniem. Sprawdź internet i spróbuj ponownie."

### Obsługa błędów w interfejsie:
- Toast notifications dla błędów globalnych
- Inline error messages przy polach formularza
- Error boundaries dla nieprzewidzianych błędów
- Retry buttons dla błędów sieciowych
- Loading states podczas operacji

## 11. Kroki implementacji

1. **Przygotowanie infrastruktury**
   - Utworzenie pliku `src/pages/recipes/[id]/manage.astro`
   - Dodanie tras w systemie routingu
   - Implementacja AuthGuard dla zabezpieczenia tras

2. **Implementacja custom hooks**
   - Utworzenie `useRecipeManagement` hook'a
   - Implementacja `useRecipeEditForm` hook'a  
   - Utworzenie `useRecipeRating` hook'a

3. **Implementacja komponentów podstawowych**
   - Utworzenie `RecipeManagementView` komponentu
   - Implementacja `RecipeManagementHeader`
   - Utworzenie `RecipeDetailsSection`

4. **Implementacja funkcji edycji**
   - Utworzenie `RecipeEditModal` komponentu
   - Implementacja `EditRecipeForm` z walidacją
   - Dodanie logiki zapisywania zmian

5. **Implementacja funkcji usuwania**
   - Dodanie dialogu potwierdzenia usunięcia
   - Implementacja logiki usuwania przepisu
   - Dodanie przekierowania po usunięciu

6. **Implementacja systemu oceniania**
   - Utworzenie `RecipeRatingSection` komponentu
   - Implementacja `RatingInput` z gwiazdkami
   - Dodanie logiki przesyłania ocen

7. **Stylizacja i UX**
   - Implementacja responsive design
   - Dodanie animacji i transition'ów
   - Stylizacja komponentów zgodnie z design system

8. **Obsługa błędów i walidacja**
   - Implementacja error boundaries
   - Dodanie toast notifications
   - Wdrożenie walidacji formularzy

9. **Optymalizacja i accessibility**
   - Dodanie klawiaturowej nawigacji
   - Implementacja ARIA labels
   - Optymalizacja wydajności (memoization)

10. **Testowanie**
    - Testy jednostkowe komponentów
    - Testy integracyjne hook'ów
    - Testy end-to-end scenariuszy użytkownika

11. **Dokumentacja i finalizacja**
    - Dokumentacja komponentów (Storybook)
    - Aktualizacja type definitions
    - Code review i refactoring 