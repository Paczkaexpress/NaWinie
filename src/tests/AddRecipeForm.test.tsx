/// <reference types="vitest/globals" />
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddRecipeForm from '../components/AddRecipeForm';

// Mock the hooks to control their behavior in tests
vi.mock('../hooks/useAddRecipeForm', () => ({
  useAddRecipeForm: () => ({
    formData: {
      name: '',
      preparation_time_minutes: 0,
      complexity_level: 'easy',
      steps: [],
      ingredients: [],
      image: undefined,
    },
    isSubmitting: false,
    submitError: null,
    updateFormData: vi.fn(),
    submitForm: vi.fn().mockResolvedValue(true),
    resetForm: vi.fn(),
  }),
}));

vi.mock('../hooks/useFormValidation', () => ({
  useFormValidation: () => ({
    errors: {
      name: null,
      preparation_time_minutes: null,
      complexity_level: null,
      steps: [],
      ingredients: [],
      image: null,
      general: null,
    },
    isValid: true,
    validateForm: vi.fn().mockReturnValue(true),
    clearFieldError: vi.fn(),
  }),
}));

vi.mock('../hooks/useImageUpload', () => ({
  useImageUpload: () => ({
    imagePreview: null,
    uploadError: null,
    selectImage: vi.fn(),
    removeImage: vi.fn(),
  }),
}));

vi.mock('../hooks/useIngredients', () => ({
  useIngredients: () => ({
    ingredients: [
      { id: '1', name: 'Mąka', unit_type: 'g', created_at: '', updated_at: '' },
      { id: '2', name: 'Jajka', unit_type: 'szt', created_at: '', updated_at: '' },
    ],
    loading: false,
    error: null,
  }),
}));

vi.mock('../hooks/useFormPersistence', () => ({
  useFormPersistence: () => ({
    loadFormData: vi.fn(),
    clearFormData: vi.fn(),
    hasSavedData: false,
  }),
}));

describe('AddRecipeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form sections', () => {
    render(<AddRecipeForm />);
    
    // Check if main sections are rendered
    expect(screen.getByText('Podstawowe informacje')).toBeInTheDocument();
    expect(screen.getByText('Zdjęcie przepisu')).toBeInTheDocument();
    expect(screen.getByText('Składniki')).toBeInTheDocument();
    expect(screen.getByText('Kroki przygotowania')).toBeInTheDocument();
    
    // Check form buttons
    expect(screen.getByRole('button', { name: /anuluj/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zapisz przepis/i })).toBeInTheDocument();
  });

  it('displays recipe name input with proper attributes', () => {
    render(<AddRecipeForm />);
    
    const nameInput = screen.getByLabelText(/nazwa przepisu/i);
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveAttribute('type', 'text');
    expect(nameInput).toHaveAttribute('maxLength', '100');
    expect(nameInput).toHaveAttribute('placeholder');
  });

  it('displays preparation time input with proper attributes', () => {
    render(<AddRecipeForm />);
    
    const timeInput = screen.getByLabelText(/czas przygotowania/i);
    expect(timeInput).toBeInTheDocument();
    expect(timeInput).toHaveAttribute('type', 'number');
    expect(timeInput).toHaveAttribute('min', '1');
    expect(timeInput).toHaveAttribute('max', '999');
  });

  it('displays complexity level selector', () => {
    render(<AddRecipeForm />);
    
    const complexitySelect = screen.getByLabelText(/poziom trudności/i);
    expect(complexitySelect).toBeInTheDocument();
    
    // Check options
    expect(screen.getByRole('option', { name: /łatwy/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /średni/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /trudny/i })).toBeInTheDocument();
  });

  it('shows image upload area', () => {
    render(<AddRecipeForm />);
    
    expect(screen.getByText(/kliknij aby wybrać plik/i)).toBeInTheDocument();
    expect(screen.getByText(/jpeg, png, webp do 1mb/i)).toBeInTheDocument();
  });

  it('displays add ingredient button', () => {
    render(<AddRecipeForm />);
    
    const addIngredientBtn = screen.getByRole('button', { name: /dodaj składnik/i });
    expect(addIngredientBtn).toBeInTheDocument();
  });

  it('displays add step button', () => {
    render(<AddRecipeForm />);
    
    const addStepBtn = screen.getByRole('button', { name: /dodaj krok/i });
    expect(addStepBtn).toBeInTheDocument();
  });

  it('calls window.history.back when cancel button is clicked', () => {
    const mockBack = vi.fn();
    Object.defineProperty(window, 'history', {
      value: { back: mockBack },
      writable: true,
    });

    render(<AddRecipeForm />);
    
    const cancelBtn = screen.getByRole('button', { name: /anuluj/i });
    fireEvent.click(cancelBtn);
    
    expect(mockBack).toHaveBeenCalledOnce();
  });

  it('disables submit button when form is invalid', () => {
    // Mock invalid form
    vi.mocked(require('../hooks/useFormValidation').useFormValidation).mockReturnValue({
      errors: {
        name: 'Nazwa jest wymagana',
        preparation_time_minutes: null,
        complexity_level: null,
        steps: [],
        ingredients: [],
        image: null,
        general: null,
      },
      isValid: false,
      validateForm: vi.fn().mockReturnValue(false),
      clearFieldError: vi.fn(),
    });

    render(<AddRecipeForm />);
    
    const submitBtn = screen.getByRole('button', { name: /zapisz przepis/i });
    expect(submitBtn).toBeDisabled();
  });

  it('shows loading state when submitting', () => {
    // Mock submitting state
    vi.mocked(require('../hooks/useAddRecipeForm').useAddRecipeForm).mockReturnValue({
      formData: {
        name: 'Test Recipe',
        preparation_time_minutes: 30,
        complexity_level: 'easy',
        steps: [],
        ingredients: [],
        image: undefined,
      },
      isSubmitting: true,
      submitError: null,
      updateFormData: vi.fn(),
      submitForm: vi.fn().mockResolvedValue(true),
      resetForm: vi.fn(),
    });

    render(<AddRecipeForm />);
    
    const submitBtn = screen.getByRole('button', { name: /zapisywanie/i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
  });

  it('displays error messages when present', () => {
    // Mock form with errors
    vi.mocked(require('../hooks/useFormValidation').useFormValidation).mockReturnValue({
      errors: {
        name: null,
        preparation_time_minutes: null,
        complexity_level: null,
        steps: [],
        ingredients: [],
        image: null,
        general: 'Przepis musi zawierać co najmniej jeden składnik',
      },
      isValid: false,
      validateForm: vi.fn().mockReturnValue(false),
      clearFieldError: vi.fn(),
    });

    render(<AddRecipeForm />);
    
    expect(screen.getByText('Przepis musi zawierać co najmniej jeden składnik')).toBeInTheDocument();
  });

  it('shows ingredients loading state', () => {
    // Mock loading ingredients
    vi.mocked(require('../hooks/useIngredients').useIngredients).mockReturnValue({
      ingredients: [],
      loading: true,
      error: null,
    });

    render(<AddRecipeForm />);
    
    expect(screen.getByText('Ładowanie składników...')).toBeInTheDocument();
  });

  it('shows ingredients error when loading fails', () => {
    // Mock ingredients error
    vi.mocked(require('../hooks/useIngredients').useIngredients).mockReturnValue({
      ingredients: [],
      loading: false,
      error: 'Nie udało się pobrać składników',
    });

    render(<AddRecipeForm />);
    
    expect(screen.getByText('Nie udało się pobrać składników')).toBeInTheDocument();
  });

  it('shows auto-save indicator when form has saved data', () => {
    // Mock saved data
    vi.mocked(require('../hooks/useFormPersistence').useFormPersistence).mockReturnValue({
      loadFormData: vi.fn(),
      clearFormData: vi.fn(),
      hasSavedData: true,
    });

    render(<AddRecipeForm />);
    
    expect(screen.getByText('Formularz zapisywany automatycznie')).toBeInTheDocument();
  });
}); 