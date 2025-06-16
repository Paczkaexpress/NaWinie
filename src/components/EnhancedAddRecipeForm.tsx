import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import { SkipLink, LiveAnnouncement, ProgressIndicator, AccessibleFieldset } from './AccessibilityImprovements';
import AddRecipeForm from './AddRecipeForm';

interface EnhancedAddRecipeFormProps {
  // Props for future customization
}

const EnhancedAddRecipeForm: React.FC<EnhancedAddRecipeFormProps> = () => {
  const [announcement, setAnnouncement] = React.useState<string>('');
  const [formProgress, setFormProgress] = React.useState({ current: 0, total: 4 });

  // Calculate form completion progress based on form data
  const calculateProgress = React.useCallback(() => {
    let completed = 0;
    const total = 4;
    
    // This will be connected to form state via custom events
    const checkFormState = () => {
      const state = JSON.parse(sessionStorage.getItem('current_recipe_form_state') || '{}');
      
      // Check if basic info is filled
      if (state.name?.trim() && state.preparation_time_minutes > 0) completed++;
      
      // Check if image is uploaded
      if (state.image) completed++;
      
      // Check if ingredients are added
      if (state.ingredients?.length > 0) completed++;
      
      // Check if steps are added
      if (state.steps?.length > 0) completed++;
      
      return completed;
    };

    const currentProgress = checkFormState();
    setFormProgress({ current: currentProgress, total });
  }, []);

  // Monitor form changes for progress updates via custom events
  React.useEffect(() => {
    const handleFormStateChange = () => {
      calculateProgress();
    };

    // Listen for custom form state changes
    window.addEventListener('recipeFormStateChange', handleFormStateChange);
    
    // Initial calculation
    const timer = setTimeout(calculateProgress, 500);

    return () => {
      window.removeEventListener('recipeFormStateChange', handleFormStateChange);
      clearTimeout(timer);
    };
  }, [calculateProgress]);

  const handleFormSubmitSuccess = () => {
    setAnnouncement('Przepis został pomyślnie zapisany! Przekierowywanie...');
  };

  const handleFormSubmitError = (error: string) => {
    setAnnouncement(`Błąd podczas zapisywania przepisu: ${error}`);
  };

  const handleErrorBoundaryError = (error: Error, errorInfo: React.ErrorInfo) => {
    setAnnouncement('Wystąpił krytyczny błąd w formularzu. Strona zostanie odświeżona.');
    
    // Log to monitoring service
    console.error('Form error boundary triggered:', error, errorInfo);
    
    // Auto-refresh after 3 seconds if in development
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  };

  return (
    <ErrorBoundary onError={handleErrorBoundaryError}>
      <div className="min-h-screen bg-gray-50">
        {/* Skip Link for Accessibility */}
        <SkipLink targetId="main-form">
          Przejdź do formularza dodawania przepisu
        </SkipLink>

        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Page Header with Progress */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Dodaj nowy przepis
            </h1>
            
            <ProgressIndicator
              current={formProgress.current}
              total={formProgress.total}
              label="Postęp wypełniania formularza"
            />
            
            <p className="mt-2 text-sm text-gray-600">
              Wypełnij wszystkie sekcje aby dodać przepis
            </p>
          </div>

          {/* Live Announcements for Screen Readers */}
          {announcement && (
            <LiveAnnouncement
              message={announcement}
              priority="assertive"
              id="form-announcements"
            />
          )}

          {/* Main Form Container */}
          <div id="main-form" className="bg-white shadow-lg rounded-lg">
            <div className="px-6 py-8">
              <AddRecipeForm />
            </div>
          </div>

          {/* Form Help and Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">
              Wskazówki dotyczące wypełniania formularza
            </h2>
            
            <AccessibleFieldset legend="Podstawowe informacje">
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Nazwa przepisu powinna być unikalna i opisowa</li>
                <li>• Czas przygotowania podawaj w minutach</li>
                <li>• Wybierz poziom trudności odpowiadający Twoim umiejętnościom</li>
              </ul>
            </AccessibleFieldset>

            <AccessibleFieldset legend="Zdjęcie" className="mt-4">
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Zdjęcie powinno mieć dobrej jakości i przedstawiać gotowe danie</li>
                <li>• Akceptowane formaty: JPEG, PNG, WebP</li>
                <li>• Maksymalny rozmiar pliku: 1MB</li>
              </ul>
            </AccessibleFieldset>

            <AccessibleFieldset legend="Składniki" className="mt-4">
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Wyszukaj składniki w bazie danych</li>
                <li>• Podaj dokładne ilości</li>
                <li>• Zaznacz składniki opcjonalne</li>
                <li>• Dodaj ewentualne zamienniki</li>
              </ul>
            </AccessibleFieldset>

            <AccessibleFieldset legend="Kroki przygotowania" className="mt-4">
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Opisz każdy krok jasno i szczegółowo</li>
                <li>• Uporządkuj kroki logicznie</li>
                <li>• Użyj strzałek aby zmienić kolejność kroków</li>
              </ul>
            </AccessibleFieldset>
          </div>

          {/* Keyboard Navigation Help */}
          <div className="mt-6 text-center">
            <details className="bg-gray-100 rounded-lg p-4">
              <summary className="cursor-pointer text-sm font-MEDIUM text-gray-700 hover:text-gray-900">
                Skróty klawiszowe i nawigacja
              </summary>
              <div className="mt-4 text-left">
                <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="font-MEDIUM text-gray-900">Tab / Shift+Tab</dt>
                    <dd className="text-gray-600">Nawigacja między polami</dd>
                  </div>
                  <div>
                    <dt className="font-MEDIUM text-gray-900">Enter</dt>
                    <dd className="text-gray-600">Aktywacja przycisków</dd>
                  </div>
                  <div>
                    <dt className="font-MEDIUM text-gray-900">Escape</dt>
                    <dd className="text-gray-600">Zamknięcie menu/dialogów</dd>
                  </div>
                  <div>
                    <dt className="font-MEDIUM text-gray-900">Ctrl+S</dt>
                    <dd className="text-gray-600">Zapisz przepis (gdy formularz jest wypełniony)</dd>
                  </div>
                </dl>
              </div>
            </details>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default EnhancedAddRecipeForm; 