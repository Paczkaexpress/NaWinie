import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, useRecipeToasts } from '../hooks/useToast';

// Mock window.location
const mockLocation = {
  href: '',
  reload: vi.fn()
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

describe('useToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with empty toasts array', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('should add a toast when showToast is called', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('success', 'Test Title', 'Test Message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'success',
      title: 'Test Title',
      message: 'Test Message',
      duration: 5000
    });
    expect(result.current.toasts[0].id).toBeDefined();
  });

  it('should add success toast with showSuccess', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showSuccess('Success Title', 'Success Message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'success',
      title: 'Success Title',
      message: 'Success Message'
    });
  });

  it('should add error toast with longer duration', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showError('Error Title', 'Error Message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'error',
      title: 'Error Title',
      message: 'Error Message',
      duration: 7000
    });
  });

  it('should add warning toast', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showWarning('Warning Title', 'Warning Message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'warning',
      title: 'Warning Title',
      message: 'Warning Message'
    });
  });

  it('should add info toast', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showInfo('Info Title', 'Info Message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'info',
      title: 'Info Title',
      message: 'Info Message'
    });
  });

  it('should remove toast by id', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showSuccess('Test', 'Message');
    });

    const toastId = result.current.toasts[0].id;
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should clear all toasts', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showSuccess('Test 1');
      result.current.showError('Test 2');
      result.current.showWarning('Test 3');
    });

    expect(result.current.toasts).toHaveLength(3);

    act(() => {
      result.current.clearAllToasts();
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should auto-remove toast after duration', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('success', 'Test', 'Message', { duration: 1000 });
    });

    expect(result.current.toasts).toHaveLength(1);
    const toastId = result.current.toasts[0].id;

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should not auto-remove toast with duration 0', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('success', 'Test', 'Message', { duration: 0 });
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.toasts).toHaveLength(1);
  });

  it('should accept custom options', () => {
    const { result } = renderHook(() => useToast());
    
    const customAction = { label: 'Custom Action', onClick: vi.fn() };
    
    act(() => {
      result.current.showToast('info', 'Custom Title', 'Custom Message', {
        duration: 3000,
        action: customAction
      });
    });

    expect(result.current.toasts[0]).toMatchObject({
      type: 'info',
      title: 'Custom Title',
      message: 'Custom Message',
      duration: 3000,
      action: customAction
    });
  });
});

describe('useRecipeToasts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
  });

  it('should show recipe saved toast', () => {
    const { result } = renderHook(() => useRecipeToasts());
    
    act(() => {
      result.current.showRecipeSaved('Test Recipe');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'success',
      title: 'Przepis zapisany!',
      message: 'Zmiany w przepisie "Test Recipe" zostały pomyślnie zapisane.',
      duration: 4000
    });
  });

  it('should show recipe deleted toast', () => {
    const { result } = renderHook(() => useRecipeToasts());
    
    act(() => {
      result.current.showRecipeDeleted('Test Recipe');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'success',
      title: 'Przepis usunięty',
      message: 'Przepis "Test Recipe" został trwale usunięty.',
      duration: 4000
    });
  });

  it('should show recipe rated toast with correct pluralization', () => {
    const { result } = renderHook(() => useRecipeToasts());
    
    // Test single star
    act(() => {
      result.current.showRecipeRated(1);
    });

    expect(result.current.toasts[0]).toMatchObject({
      type: 'success',
      title: 'Ocena dodana!',
      message: 'Dziękujemy za ocenę 1 gwiazdka!',
      duration: 3000
    });

    act(() => {
      result.current.clearAllToasts();
    });

    // Test multiple stars
    act(() => {
      result.current.showRecipeRated(3);
    });

    expect(result.current.toasts[0]).toMatchObject({
      type: 'success',
      title: 'Ocena dodana!',
      message: 'Dziękujemy za ocenę 3 gwiazdek!',
      duration: 3000
    });

    act(() => {
      result.current.clearAllToasts();
    });

    // Test 5 stars
    act(() => {
      result.current.showRecipeRated(5);
    });

    expect(result.current.toasts[0]).toMatchObject({
      type: 'success',
      title: 'Ocena dodana!',
      message: 'Dziękujemy za ocenę 5 gwiazdek!',
      duration: 3000
    });
  });

  it('should show recipe error toast with retry action', () => {
    const { result } = renderHook(() => useRecipeToasts());
    
    act(() => {
      result.current.showRecipeError('zapisywania', 'Custom error message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'error',
      title: 'Błąd zapisywania',
      message: 'Custom error message',
      duration: 8000
    });
    expect(result.current.toasts[0].action).toMatchObject({
      label: 'Spróbuj ponownie'
    });
  });

  it('should show network error toast without auto-dismiss', () => {
    const { result } = renderHook(() => useRecipeToasts());
    
    act(() => {
      result.current.showNetworkError();
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'error',
      title: 'Brak połączenia',
      message: 'Sprawdź połączenie internetowe i spróbuj ponownie.',
      duration: 0
    });
    expect(result.current.toasts[0].action).toMatchObject({
      label: 'Spróbuj ponownie'
    });
  });

  it('should show auth error toast with login action', () => {
    const { result } = renderHook(() => useRecipeToasts());
    
    act(() => {
      result.current.showAuthError();
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'error',
      title: 'Brak autoryzacji',
      message: 'Musisz być zalogowany, aby wykonać tę akcję.',
      duration: 7000
    });
    expect(result.current.toasts[0].action).toMatchObject({
      label: 'Zaloguj się'
    });
  });

  it('should show permission error toast', () => {
    const { result } = renderHook(() => useRecipeToasts());
    
    act(() => {
      result.current.showPermissionError();
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'error',
      title: 'Brak uprawnień',
      message: 'Nie masz uprawnień do wykonania tej akcji.',
      duration: 6000
    });
  });

  it('should show image upload error toast', () => {
    const { result } = renderHook(() => useRecipeToasts());
    
    act(() => {
      result.current.showImageUploadError();
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'error',
      title: 'Błąd przesyłania zdjęcia',
      message: 'Nie udało się przesłać zdjęcia. Sprawdź format i rozmiar pliku.',
      duration: 7000
    });
  });

  it('should show image upload success toast', () => {
    const { result } = renderHook(() => useRecipeToasts());
    
    act(() => {
      result.current.showImageUploadSuccess();
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'success',
      title: 'Zdjęcie dodane!',
      message: 'Zdjęcie zostało pomyślnie przesłane.',
      duration: 3000
    });
  });

  it('should show validation error toast', () => {
    const { result } = renderHook(() => useRecipeToasts());
    
    act(() => {
      result.current.showValidationError('Custom validation message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'warning',
      title: 'Sprawdź dane',
      message: 'Custom validation message',
      duration: 6000
    });
  });

  it('should show ingredient added toast', () => {
    const { result } = renderHook(() => useRecipeToasts());
    
    act(() => {
      result.current.showIngredientAdded();
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'info',
      title: 'Składnik dodany',
      message: 'Nowy składnik został dodany do listy.',
      duration: 2000
    });
  });

  it('should show step added toast', () => {
    const { result } = renderHook(() => useRecipeToasts());
    
    act(() => {
      result.current.showStepAdded();
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'info',
      title: 'Krok dodany',
      message: 'Nowy krok został dodany do przepisu.',
      duration: 2000
    });
  });

  it('should show draft saved toast', () => {
    const { result } = renderHook(() => useRecipeToasts());
    
    act(() => {
      result.current.showDraftSaved();
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'info',
      title: 'Wersja robocza zapisana',
      message: 'Twoje zmiany zostały automatycznie zapisane.',
      duration: 2000
    });
  });

  it('should handle toast action callbacks', () => {
    const { result } = renderHook(() => useRecipeToasts());
    
    act(() => {
      result.current.showNetworkError();
    });

    const toast = result.current.toasts[0];
    const reloadSpy = vi.spyOn(window.location, 'reload');
    
    act(() => {
      toast.action?.onClick();
    });

    expect(reloadSpy).toHaveBeenCalled();
  });

  it('should handle auth error login redirect', () => {
    const { result } = renderHook(() => useRecipeToasts());
    
    act(() => {
      result.current.showAuthError();
    });

    const toast = result.current.toasts[0];
    
    act(() => {
      toast.action?.onClick();
    });

    expect(mockLocation.href).toBe('/login');
  });
}); 