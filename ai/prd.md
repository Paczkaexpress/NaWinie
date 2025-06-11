# Dokument wymagań produktu (PRD) - Na Winie (Grab & Cook)

## 1. Przegląd produktu
Projekt Na Winie (Grab & Cook) to internetowa aplikacja, która pomaga wykorzystać pozostałe składniki znajdujące się w lodówce, przekształcając je w smaczne i kreatywne posiłki. Aplikacja umożliwia użytkownikom wprowadzenie posiadanych produktów, po czym system sugeruje przepisy, które nie tylko ograniczają marnowanie jedzenia, ale także oszczędzają pieniądze i wprowadzają element zabawy do codziennego gotowania. Rozwiązanie ma być wdrożone w formie MVP przy użyciu popularnego frameworka i lokalnego hostingu, co pozwala na minimalizację kosztów produkcji.

## 2. Problem użytkownika
Użytkownicy napotykają trudności z wykorzystaniem składników, które zalegają w lodówce, głównie z powodu:
- Braku narzędzia, które automatycznie dopasowuje przepisy do posiadanej listy składników.
- Braku inspiracji do tworzenia kreatywnych posiłków z dostępnych produktów.
- Manualnego i czasochłonnego planowania posiłków, które nie uwzględnia realnie dostępnych składników.
- Niewygodnego zarządzania listą składników, która nie umożliwia oznaczania produktów jako „zawsze obecnych”.

## 3. Wymagania funkcjonalne
1. Sugerowanie przepisów:
   - System generuje propozycje przepisów na podstawie wprowadzonej listy składników, bez analizy proporcji.
   - Przepisy wyświetlane są w formie listy z możliwością filtrowania według liczby składników oraz stopnia trudności.

2. Interaktywna lista składników:
   - Możliwość dodawania, edycji oraz usuwania składników.
   - Opcja oznaczania niektórych składników jako „zawsze obecnych”, co ma wpływać na generowanie propozycji.

3. Dodawanie przepisów:
   - Umożliwienie użytkownikom dodawania nowych przepisów do bazy danych.
   - Proces dodawania odbywa się bez automatycznej moderacji, co umożliwia szybkie wdrożenie funkcjonalności MVP.

4. System ocen i monitorowania:
   - Mechanizm zbierania feedbacku w skali 1/5 dla każdej propozycji przepisu.
   - Monitorowanie liczby kliknięć na proponowane przepisy jako wskaźnik zaangażowania.

5. Uwierzytelnianie i autoryzacja:
   - Rejestracja nowego konta oraz logowanie użytkowników.
   - Dostęp do rozszerzonych funkcji (dodawanie przepisów, przegląd historii aktywności) tylko dla zalogowanych użytkowników.
   - Bezpieczne przechowywanie danych logowania oraz zarządzanie sesjami.

6. Testy jednostkowe:
   - Weryfikacja poprawności dopasowania przepisów do wprowadzonych składników (upewnienie się, że żaden składnik nie został pominięty).
   - Testowanie funkcji filtrowania i sortowania przepisów.
   - Testy logowania, rejestracji oraz bezpiecznego dostępu do danych.

## 4. Granice produktu
1. Zakres MVP:
   - Sugerowanie przepisów na podstawie listy składników.
   - Interaktywna lista składników z funkcjami dodawania, edycji oraz oznaczania pozycji jako „zawsze obecnych”.
   - Filtrowanie wyników według liczby składników i stopnia trudności.
   - Możliwość dodawania nowych przepisów przez użytkowników.
   - Mechanizmy zbierania ocen oraz monitorowania kliknięć.
   - Uwierzytelnianie użytkowników z funkcją rejestracji i logowania.

2. Poza zakresem MVP:
   - Automatyzacja uzupełniania listy składników.
   - Personalizacja rekomendacji przepisu na podstawie historii użytkownika.
   - Zaawansowane funkcje moderacji dodawanych przepisów.
   - Rozbudowana analiza proporcji składników w przepisach.

## 5. Historyjki użytkowników
- ID: US-001  
  Tytuł: Wprowadzenie składników i uzyskanie propozycji przepisu (Guest User)  
  Opis: Jako niezalogowany użytkownik chcę wprowadzić listę składników, aby otrzymać zestaw kreatywnych propozycji przepisów dostosowanych do dostępnych produktów.  
  Kryteria akceptacji:
  - Użytkownik może dodać składniki do interaktywnej listy.
  - System wyświetla co najmniej trzy propozycje przepisów dopasowanych do wprowadzonych składników.
  - Użytkownik ma możliwość filtrowania wyników według liczby składników oraz stopnia trudności.

- ID: US-002  
  Tytuł: Uwierzytelnianie i dostęp do dodatkowych funkcji (Authenticated User)  
  Opis: Jako zarejestrowany użytkownik chcę się zalogować, aby uzyskać dostęp do rozszerzonych funkcji, takich jak dodawanie przepisów oraz przeglądanie historii moich aktywności.  
  Kryteria akceptacji:
  - System umożliwia bezpieczną rejestrację i logowanie.
  - Po zalogowaniu użytkownik uzyskuje dostęp do panelu z funkcjami dodawania przepisu i przeglądania historii.
  - Sesja użytkownika jest zarządzana w sposób zapewniający bezpieczeństwo danych.

- ID: US-003  
  Tytuł: Dodawanie nowego przepisu (Recipe Contributor)  
  Opis: Jako zalogowany użytkownik chcę móc dodać nowy przepis do bazy, aby inni użytkownicy mogli korzystać z nowych inspiracji kulinarnych.  
  Kryteria akceptacji:
  - Formularz dodawania przepisu zawiera pola na nazwę, listę składników, opis i stopień trudności.
  - Po wysłaniu formularza przepis pojawia się w bazie i jest widoczny na liście propozycji.
  - System potwierdza przyjęcie przepisu użytkownikowi.

- ID: US-004  
  Tytuł: Bezpieczny dostęp i autoryzacja  
  Opis: Jako użytkownik chcę mieć pewność, że moje dane są chronione dzięki solidnym mechanizmom uwierzytelniania i autoryzacji.  
  Kryteria akceptacji:
  - Proces logowania sprawdza poprawność danych użytkownika.
  - Każda operacja związana z zarządzaniem danymi wymaga autoryzacji.
  - System zarządza sesjami użytkowników, gwarantując bezpieczeństwo i integralność danych.

- ID: US-005  
  Tytuł: Rejestracja konta  
  Opis: Jako nowy użytkownik chcę się zarejestrować, aby mieć dostęp do historii użytych przepisów i możliwości dodawania nowych przepisów.  
  Kryteria akceptacji:
  - Formularz rejestracyjny zawiera pola na adres e-mail oraz hasło.
  - Po poprawnym wypełnieniu formularza i weryfikacji danych konto jest aktywowane.
  - Użytkownik otrzymuje potwierdzenie pomyślnej rejestracji i zostaje automatycznie zalogowany.

- ID: US-006  
  Tytuł: Logowanie do aplikacji  
  Opis: Jako zarejestrowany użytkownik chcę móc się zalogować, aby mieć dostęp do historii użytych przepisów i możliwości dodawania nowego przepisu.  
  Kryteria akceptacji:
  - Po podaniu prawidłowych danych logowania użytkownik zostaje przekierowany do widoku generowania przepisów.
  - Przy błędnych danych logowania wyświetlany jest odpowiedni komunikat o nieprawidłowych danych.
  - Dane dotyczące logowania są przechowywane w bezpieczny sposób.

## 6. Metryki sukcesu
1. Średnia ocena feedbacku użytkowników wynosząca co najmniej 4/5.
2. Wysoki poziom zaangażowania mierzony liczbą kliknięć na proponowane przepisy.
3. Testy jednostkowe potwierdzające:
   - Poprawność dopasowania przepisów do wprowadzonych składników.
   - Działanie funkcji filtrowania i sortowania przepisów.
   - Bezpieczną rejestrację, logowanie oraz autoryzację użytkowników.
4. Ustalenie progów KPI dotyczących liczby kliknięć na przepisy (do dalszej weryfikacji) jako dodatkowego wskaźnika sukcesu.
