# Plan implementacji widoku Dodawania Przepisu

## 1. Przegląd
Widok dodawania przepisu umożliwia zalogowanym użytkownikom dodawanie nowych przepisów do bazy danych aplikacji. Widok składa się z kompleksowego formularza zawierającego podstawowe informacje o przepisie, listę składników, kroki przygotowania oraz opcjonalne zdjęcie. Implementacja zapewnia walidację w czasie rzeczywistym, obsługę błędów oraz intuicyjny interfejs użytkownika zgodny z zasadami UX aplikacji.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką `/recipes/new` i wymaga uwierzytelniania użytkownika. Niezalogowani użytkownicy będą automatycznie przekierowywani do strony logowania z parametrem `returnUrl=/recipes/new`.

## 3. Struktura komponentów
```
AddRecipePage
├── AuthGuard (wrapper zabezpieczający)
└── AddRecipeForm (główny formularz)
    ├── BasicInfoSection (podstawowe informacje)
    │   ├── NameInput (nazwa przepisu)
    │   ├── PreparationTimeInput (czas przygotowania)
    │   └── ComplexitySelector (poziom trudności)
    ├── ImageUploader (upload zdjęcia)
    ├── IngredientsSection (sekcja składników)
    │   └── IngredientInput[] (dynamiczna lista składników)
    ├── StepsSection (sekcja kroków)
    │   └── StepInput[] (dynamiczna lista kroków)
    └── FormActions (przyciski akcji)
        ├── SubmitButton (przycisk zapisz)
        └── CancelButton (przycisk anuluj)
```

## 4. Szczegóły komponentów

### AddRecipePage
- **Opis**: Główny komponent strony zawierający AuthGuard i formularz dodawania przepisu
- **Główne elementy**: Wrapper z AuthGuard, nagłówek strony, AddRecipeForm
- **Obsługiwane interakcje**: Przekierowanie do logowania dla niezalogowanych użytkowników
- **Obsługiwana walidacja**: Sprawdzenie stanu uwierzytelniania
- **Typy**: Brak własnych propsów
- **Propsy**: Brak

### AddRecipeForm
- **Opis**: Główny formularz zawierający wszystkie sekcje potrzebne do dodania przepisu
- **Główne elementy**: Form element, sekcje formularza, przyciski akcji
- **Obsługiwane interakcje**: Walidacja w czasie rzeczywistym, wysłanie formularza, anulowanie
- **Obsługiwana walidacja**: Wszystkie pola wymagane, format danych, limity długości
- **Typy**: CreateRecipeFormData, FormValidationState
- **Propsy**: Brak (samodzielny komponent)

### BasicInfoSection
- **Opis**: Sekcja zawierająca podstawowe informacje o przepisie
- **Główne elementy**: Input dla nazwy, input dla czasu, select dla trudności
- **Obsługiwane interakcje**: Wprowadzanie tekstu, wybór z listy
- **Obsługiwana walidacja**: Nazwa (1-100 znaków), czas (1-999 minut), trudność (EASY/MEDIUM/HARD)
- **Typy**: BasicRecipeInfo
- **Propsy**: values, onChange, errors

### ImageUploader
- **Opis**: Komponent do uploadu i preview zdjęcia przepisu
- **Główne elementy**: Drag & drop zone, preview zdjęcia, przycisk usuwania
- **Obsługiwane interakcje**: Drag & drop, kliknięcie, usuwanie zdjęcia
- **Obsługiwana walidacja**: Format pliku (JPEG, PNG), rozmiar (max 1MB)
- **Typy**: File, ImagePreview
- **Propsy**: onImageSelect, onImageRemove, preview, error

### IngredientsSection
- **Opis**: Sekcja zarządzania listą składników przepisu
- **Główne elementy**: Lista składników, przycisk dodawania nowego składnika
- **Obsługiwane interakcje**: Dodawanie, usuwanie, edycja składników
- **Obsługiwana walidacja**: Min. 1 składnik, poprawność danych każdego składnika
- **Typy**: RecipeIngredientFormData[], IngredientDto[]
- **Propsy**: ingredients, onIngredientsChange, availableIngredients, errors

### IngredientInput
- **Opis**: Pojedynczy wiersz do wprowadzania danych składnika
- **Główne elementy**: Select składnika, input ilości, checkbox opcjonalności, input rekomendacji zamiennika, przycisk usuwania
- **Obsługiwane interakcje**: Wybór składnika, wprowadzanie ilości, toggle opcjonalności, usuwanie
- **Obsługiwana walidacja**: Wybrany składnik, ilość > 0, format rekomendacji zamiennika
- **Typy**: RecipeIngredientFormData, IngredientDto
- **Propsy**: ingredient, onChange, onRemove, availableIngredients, error

### StepsSection
- **Opis**: Sekcja zawierająca kroki przygotowania przepisu
- **Główne elementy**: Lista kroków, przycisk dodawania nowego kroku
- **Obsługiwane interakcje**: Dodawanie, usuwanie, edycja, zmiana kolejności kroków
- **Obsługiwana walidacja**: Min. 1 krok, opis każdego kroku (1-500 znaków)
- **Typy**: RecipeStepFormData[]
- **Propsy**: steps, onStepsChange, errors

### StepInput
- **Opis**: Pojedynczy wiersz do wprowadzania opisu kroku
- **Główne elementy**: Numer kroku, textarea opisu, przyciski przesuwania, przycisk usuwania
- **Obsługiwane interakcje**: Wprowadzanie tekstu, zmiana kolejności, usuwanie
- **Obsługiwana walidacja**: Opis (1-500 znaków)
- **Typy**: RecipeStepFormData
- **Propsy**: step, onChange, onRemove, onMoveUp, onMoveDown, error

## 5. Typy

```typescript
// Dane formularza
interface CreateRecipeFormData {
  name: string;
  preparation_time_minutes: number;
  complexity_level: 'EASY' | 'MEDIUM' | 'HARD';
  steps: RecipeStepFormData[];
  ingredients: RecipeIngredientFormData[];
  image?: File;
}

// Składnik w formularzu
interface RecipeIngredientFormData {
  ingredient_id: string;
  amount: number;
  is_optional: boolean;
  substitute_recommendation: string | null;
}

// Krok w formularzu
interface RecipeStepFormData {
  step: number;
  description: string;
}

// Podstawowe informacje przepisu
interface BasicRecipeInfo {
  name: string;
  preparation_time_minutes: number;
  complexity_level: 'EASY' | 'MEDIUM' | 'HARD';
}

// Stan walidacji formularza
interface FormValidationState {
  name: string | null;
  preparation_time_minutes: string | null;
  complexity_level: string | null;
  steps: Array<string | null>;
  ingredients: Array<{
    ingredient_id: string | null;
    amount: string | null;
    substitute_recommendation: string | null;
  }>;
  image: string | null;
  general: string | null;
}

// Preview zdjęcia
interface ImagePreview {
  file: File;
  url: string;
}
```

## 6. Zarządzanie stanem

Widok wykorzystuje niestandardowe hooki do zarządzania stanem:

### useAddRecipeForm
- **Cel**: Zarządzanie głównym stanem formularza i koordynacja wysyłania danych
- **Funkcjonalność**: Agregacja danych z wszystkich sekcji, walidacja, wywołanie API
- **Stan**: formData, isSubmitting, submitError

### useFormValidation
- **Cel**: Walidacja w czasie rzeczywistym wszystkich pól formularza
- **Funkcjonalność**: Walidacja poszczególnych pól, agregacja błędów
- **Stan**: errors, isValid

### useIngredientsList
- **Cel**: Zarządzanie dynamiczną listą składników
- **Funkcjonalność**: Dodawanie, usuwanie, edycja składników
- **Stan**: ingredients, availableIngredients

### useStepsList
- **Cel**: Zarządzanie dynamiczną listą kroków
- **Funkcjonalność**: Dodawanie, usuwanie, edycja, zmiana kolejności kroków
- **Stan**: steps

### useImageUpload
- **Cel**: Obsługa uploadu i preview zdjęcia
- **Funkcjonalność**: Walidacja pliku, generowanie preview, usuwanie zdjęcia
- **Stan**: imagePreview, uploadError

## 7. Integracja API

### POST /recipes
- **Typ żądania**: CreateRecipeCommand
- **Typ odpowiedzi**: RecipeDetailDto
- **Nagłówki**: Authorization: Bearer {token}
- **Obsługa błędów**: 400 (Bad Request), 401 (Unauthorized), 500 (Server Error)

### GET /ingredients
- **Cel**: Pobieranie listy dostępnych składników dla autouzupełniania
- **Typ odpowiedzi**: PaginatedIngredientsDto
- **Parametry**: search, limit

## 8. Interakcje użytkownika

1. **Wypełnianie podstawowych informacji**:
   - Wprowadzanie nazwy przepisu
   - Ustawienie czasu przygotowania (minuty)
   - Wybór poziomu trudności z dropdown

2. **Upload zdjęcia**:
   - Drag & drop lub kliknięcie w obszar uploadu
   - Preview zdjęcia po wyborze
   - Możliwość usunięcia zdjęcia

3. **Dodawanie składników**:
   - Kliknięcie "Dodaj składnik" tworzy nowy wiersz
   - Wybór składnika z listy z autouzupełnianiem
   - Wprowadzenie ilości
   - Oznaczenie jako opcjonalny
   - Dodanie rekomendacji zamiennika
   - Usunięcie składnika

4. **Dodawanie kroków**:
   - Kliknięcie "Dodaj krok" tworzy nowy wiersz
   - Wprowadzenie opisu kroku
   - Zmiana kolejności kroków
   - Usunięcie kroku

5. **Zapisywanie przepisu**:
   - Walidacja wszystkich pól
   - Wysłanie formularza
   - Przekierowanie do szczegółów przepisu po sukcesie

## 9. Warunki i walidacja

### Walidacja pól (komponent BasicInfoSection):
- **Nazwa**: Wymagane, 1-100 znaków, unikalność nie sprawdzana
- **Czas przygotowania**: Wymagane, liczba całkowita 1-999 minut
- **Poziom trudności**: Wymagane, jedna z opcji: EASY, MEDIUM, HARD

### Walidacja zdjęcia (komponent ImageUploader):
- **Format**: JPEG, PNG, WebP
- **Rozmiar**: Maksymalnie 1MB
- **Opcjonalność**: Zdjęcie nie jest wymagane

### Walidacja składników (komponent IngredientsSection):
- **Minimum**: Co najmniej 1 składnik
- **Składnik**: Musi być wybrany z dostępnej listy
- **Ilość**: Liczba dodatnia, maksymalnie 999999
- **Zamiennik**: Opcjonalny, maksymalnie 100 znaków

### Walidacja kroków (komponent StepsSection):
- **Minimum**: Co najmniej 1 krok
- **Opis**: Wymagany, 1-500 znaków
- **Kolejność**: Automatycznie numerowane 1, 2, 3...

### Walidacja ogólna:
- **Uwierzytelnianie**: Sprawdzenie ważności tokenu przed wysłaniem
- **Połączenie**: Sprawdzenie połączenia z serwerem
- **Uprawnienia**: Sprawdzenie uprawnień użytkownika

## 10. Obsługa błędów

### Błędy uwierzytelniania:
- **401 Unauthorized**: Przekierowanie do strony logowania
- **403 Forbidden**: Komunikat o braku uprawnień
- **Token expired**: Automatyczne odświeżenie tokenu lub przekierowanie do logowania

### Błędy walidacji:
- **400 Bad Request**: Wyświetlenie komunikatów błędów przy odpowiednich polach
- **Błędy klienta**: Walidacja w czasie rzeczywistym z komunikatami pod polami

### Błędy sieciowe:
- **500 Server Error**: Toast z komunikatem "Błąd serwera, spróbuj ponownie"
- **Network Error**: Toast z komunikatem "Brak połączenia z internetem"
- **Timeout**: Toast z komunikatem "Przekroczono czas oczekiwania"

### Błędy uploadu zdjęcia:
- **Zbyt duży plik**: "Plik jest za duży (max 1MB)"
- **Nieprawidłowy format**: "Dozwolone formaty: JPEG, PNG, WebP"
- **Błąd uploadu**: "Nie udało się przesłać zdjęcia"

### Obsługa retry:
- Przycisk "Spróbuj ponownie" w przypadku błędów sieciowych
- Automatyczne ponowienie dla błędów przejściowych
- Zapisanie stanu formularza w localStorage jako backup

## 11. Kroki implementacji

1. **Przygotowanie struktury komponentów**:
   - Utworzenie pliku AddRecipePage.tsx
   - Implementacja AuthGuard wrapper
   - Stworzenie podstawowej struktury formularza

2. **Implementacja typów TypeScript**:
   - Definicja interfejsów dla danych formularza
   - Typy dla stanu walidacji
   - Typy dla komunikacji z API

3. **Implementacja BasicInfoSection**:
   - Komponenty input dla nazwy i czasu
   - Select dla poziomu trudności
   - Walidacja podstawowych pól

4. **Implementacja ImageUploader**:
   - Drag & drop funkcjonalność
   - Preview zdjęcia
   - Walidacja plików

5. **Implementacja IngredientsSection**:
   - Dynamiczna lista składników
   - Komponent IngredientInput
   - Integracja z API składników
   - Autouzupełnianie

6. **Implementacja StepsSection**:
   - Dynamiczna lista kroków
   - Komponent StepInput
   - Funkcjonalność zmiany kolejności

7. **Implementacja niestandardowych hooków**:
   - useAddRecipeForm
   - useFormValidation
   - useIngredientsList
   - useStepsList
   - useImageUpload

8. **Integracja z API**:
   - Implementacja wywołania POST /recipes
   - Obsługa błędów API
   - Przekierowanie po sukcesie

9. **Stylowanie i UX**:
   - Implementacja designu zgodnego z Tailwind/Shadcn
   - Animacje i przejścia
   - Responsywność

10. **Testowanie i debugowanie**:
    - Testy jednostkowe komponentów
    - Testy integracyjne formularza
    - Testy walidacji
    - Testy obsługi błędów

11. **Optymalizacja i finalizacja**:
    - Lazy loading komponentów
    - Optymalizacja wydajności
    - Dokumentacja komponentów
    - Przegląd kodu 