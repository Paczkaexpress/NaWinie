/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddRecipeForm from '../components/AddRecipeForm';

// Simple mocks for hooks
vi.mock('../hooks/useAddRecipeForm', () => ({
  useAddRecipeForm: () => ({
    formData: {
      name: '',
      preparation_time_minutes: 0,
      complexity_level: 'EASY',
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
    validateField: vi.fn(),
    validateForm: vi.fn(),
    clearErrors: vi.fn(),
    clearFieldError: vi.fn(),
  }),
}));

vi.mock('../hooks/useImageUpload', () => ({
  useImageUpload: () => ({
    imagePreview: null,
    uploadError: null,
    isUploading: false,
    selectImage: vi.fn(),
    removeImage: vi.fn(),
    clearError: vi.fn(),
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
    searchIngredients: vi.fn(),
    refetch: vi.fn(),
  }),
}));

vi.mock('../hooks/useFormPersistence', () => ({
  useFormPersistence: () => ({
    saveFormData: vi.fn(),
    loadFormData: vi.fn(),
    clearFormData: vi.fn(),
    hasSavedData: false,
  }),
}));

describe('AddRecipeForm Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<AddRecipeForm />)).not.toThrow();
  });

  it('displays main form sections', () => {
    render(<AddRecipeForm />);
    
    // Check for section headers using simple text queries
    expect(screen.queryByText('Podstawowe informacje')).toBeTruthy();
    expect(screen.queryByText('Zdjęcie przepisu')).toBeTruthy();
    expect(screen.queryByText(/Składniki \(/)).toBeTruthy();
    expect(screen.queryByText(/Sposób przygotowania \(/)).toBeTruthy();
  });

  it('has form input fields', () => {
    render(<AddRecipeForm />);
    
    // Check for input elements by their values or placeholders
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
    
    const numberInputs = screen.getAllByRole('spinbutton');
    expect(numberInputs.length).toBeGreaterThan(0);
    
    const selectInputs = screen.getAllByRole('combobox');
    expect(selectInputs.length).toBeGreaterThan(0);
  });

  it('has action buttons', () => {
    render(<AddRecipeForm />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    
    // Check for specific button text
    expect(screen.queryByText(/anuluj/i)).toBeTruthy();
    expect(screen.queryByText(/zapisz/i)).toBeTruthy();
    
    // Use getByRole to get specific buttons
    const addIngredientButton = screen.getByRole('button', { name: /dodaj składnik/i });
    expect(addIngredientButton).toBeTruthy();
    
    const addStepButton = screen.getByRole('button', { name: /dodaj krok/i });
    expect(addStepButton).toBeTruthy();
  });

  it('allows basic interactions', async () => {
    const user = userEvent.setup();
    render(<AddRecipeForm />);
    
    // Try to interact with add buttons using more specific selectors
    const addIngredientBtn = screen.getByRole('button', { name: /dodaj składnik/i });
    await user.click(addIngredientBtn);
    
    const addStepBtn = screen.getByRole('button', { name: /dodaj krok/i });
    await user.click(addStepBtn);
    
    // These interactions should not throw errors
    expect(true).toBe(true);
  });
}); 