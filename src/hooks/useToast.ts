import { useState, useCallback } from 'react';
import type { Toast, ToastType } from '../components/ToastNotification';

interface UseToastReturn {
  toasts: Toast[];
  showToast: (type: ToastType, title: string, message?: string, options?: Partial<Toast>) => void;
  showSuccess: (title: string, message?: string, options?: Partial<Toast>) => void;
  showError: (title: string, message?: string, options?: Partial<Toast>) => void;
  showWarning: (title: string, message?: string, options?: Partial<Toast>) => void;
  showInfo: (title: string, message?: string, options?: Partial<Toast>) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const generateId = () => {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    options?: Partial<Toast>
  ) => {
    const id = generateId();
    const toast: Toast = {
      id,
      type,
      title,
      message,
      duration: 5000,
      ...options
    };

    setToasts(current => [...current, toast]);

    // Auto-remove if duration is set
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }
  }, [removeToast]);

  const showSuccess = useCallback((
    title: string,
    message?: string,
    options?: Partial<Toast>
  ) => {
    showToast('success', title, message, options);
  }, [showToast]);

  const showError = useCallback((
    title: string,
    message?: string,
    options?: Partial<Toast>
  ) => {
    showToast('error', title, message, { duration: 7000, ...options });
  }, [showToast]);

  const showWarning = useCallback((
    title: string,
    message?: string,
    options?: Partial<Toast>
  ) => {
    showToast('warning', title, message, options);
  }, [showToast]);

  const showInfo = useCallback((
    title: string,
    message?: string,
    options?: Partial<Toast>
  ) => {
    showToast('info', title, message, options);
  }, [showToast]);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearAllToasts
  };
};

// Recipe-specific toast messages
export const useRecipeToasts = () => {
  const toast = useToast();

  return {
    ...toast,
    // Recipe management specific toasts
    showRecipeSaved: (recipeName: string) =>
      toast.showSuccess(
        'Przepis zapisany!',
        `Zmiany w przepisie "${recipeName}" zostały pomyślnie zapisane.`,
        { duration: 4000 }
      ),
    
    showRecipeDeleted: (recipeName: string) =>
      toast.showSuccess(
        'Przepis usunięty',
        `Przepis "${recipeName}" został trwale usunięty.`,
        { duration: 4000 }
      ),
    
    showRecipeRated: (rating: number) =>
      toast.showSuccess(
        'Ocena dodana!',
        `Dziękujemy za ocenę ${rating} ${rating === 1 ? 'gwiazdka' : rating < 5 ? 'gwiazdek' : 'gwiazdek'}!`,
        { duration: 3000 }
      ),
    
    showRecipeError: (action: string, error?: string) =>
      toast.showError(
        `Błąd ${action}`,
        error || `Wystąpił problem podczas ${action}. Spróbuj ponownie.`,
        { 
          duration: 8000,
          action: {
            label: 'Spróbuj ponownie',
            onClick: () => window.location.reload()
          }
        }
      ),
    
    showValidationError: (message: string) =>
      toast.showWarning(
        'Sprawdź dane',
        message,
        { duration: 6000 }
      ),
    
    showNetworkError: () =>
      toast.showError(
        'Brak połączenia',
        'Sprawdź połączenie internetowe i spróbuj ponownie.',
        {
          duration: 0, // Don't auto-dismiss
          action: {
            label: 'Spróbuj ponownie',
            onClick: () => window.location.reload()
          }
        }
      ),
    
    showAuthError: () =>
      toast.showError(
        'Brak autoryzacji',
        'Musisz być zalogowany, aby wykonać tę akcję.',
        {
          duration: 7000,
          action: {
            label: 'Zaloguj się',
            onClick: () => window.location.href = '/login'
          }
        }
      ),
    
    showPermissionError: () =>
      toast.showError(
        'Brak uprawnień',
        'Nie masz uprawnień do wykonania tej akcji.',
        { duration: 6000 }
      ),
    
    showImageUploadError: () =>
      toast.showError(
        'Błąd przesyłania zdjęcia',
        'Nie udało się przesłać zdjęcia. Sprawdź format i rozmiar pliku.',
        { duration: 7000 }
      ),
    
    showImageUploadSuccess: () =>
      toast.showSuccess(
        'Zdjęcie dodane!',
        'Zdjęcie zostało pomyślnie przesłane.',
        { duration: 3000 }
      ),
    
    showIngredientAdded: () =>
      toast.showInfo(
        'Składnik dodany',
        'Nowy składnik został dodany do listy.',
        { duration: 2000 }
      ),
    
    showStepAdded: () =>
      toast.showInfo(
        'Krok dodany',
        'Nowy krok został dodany do przepisu.',
        { duration: 2000 }
      ),
    
    showDraftSaved: () =>
      toast.showInfo(
        'Wersja robocza zapisana',
        'Twoje zmiany zostały automatycznie zapisane.',
        { duration: 2000 }
      )
  };
};

export default useToast; 