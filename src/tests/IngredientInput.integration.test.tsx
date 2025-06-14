/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IngredientInput from '../components/IngredientInput';
import type { RecipeIngredientFormData, IngredientDto } from '../types';

describe('IngredientInput Integration', () => {
  const mockIngredients: IngredientDto[] = [
    { id: '1', name: 'Mąka pszenna', unit_type: 'g', created_at: '', updated_at: '' },
    { id: '2', name: 'Jajka', unit_type: 'szt', created_at: '', updated_at: '' },
    { id: '3', name: 'Mleko', unit_type: 'ml', created_at: '', updated_at: '' },
  ];

  const mockIngredient: RecipeIngredientFormData = {
    ingredient_id: '',
    amount: 0,
    is_optional: false,
    substitute_recommendation: null,
  };

  const defaultProps = {
    ingredient: mockIngredient,
    onChange: vi.fn(),
    onRemove: vi.fn(),
    availableIngredients: mockIngredients,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<IngredientInput {...defaultProps} />)).not.toThrow();
  });

  it('displays ingredient input structure', () => {
    render(<IngredientInput {...defaultProps} />);
    
    // Check for basic input elements
    const textInputs = screen.getAllByRole('textbox');
    expect(textInputs.length).toBeGreaterThan(0);
    
    const numberInputs = screen.getAllByRole('spinbutton');
    expect(numberInputs.length).toBeGreaterThan(0);
    
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('shows search placeholder when no ingredient selected', () => {
    render(<IngredientInput {...defaultProps} />);
    
    expect(screen.queryByPlaceholderText(/wyszukaj składnik/i)).toBeTruthy();
  });

  it('displays selected ingredient information', () => {
    const selectedIngredient = {
      ...mockIngredient,
      ingredient_id: '1',
    };
    
    render(
      <IngredientInput 
        {...defaultProps} 
        ingredient={selectedIngredient}
      />
    );
    
    // Should show the selected ingredient name
    expect(screen.queryByText('Mąka pszenna')).toBeTruthy();
  });

  it('shows amount input with proper value', () => {
    const ingredientWithAmount = {
      ...mockIngredient,
      ingredient_id: '1',
      amount: 250,
    };
    
    render(
      <IngredientInput 
        {...defaultProps} 
        ingredient={ingredientWithAmount}
      />
    );
    
    const amountInput = screen.getByDisplayValue('250');
    expect(amountInput).toBeTruthy();
  });

  it('shows optional checkbox state', () => {
    const optionalIngredient = {
      ...mockIngredient,
      is_optional: true,
    };
    
    render(
      <IngredientInput 
        {...defaultProps} 
        ingredient={optionalIngredient}
      />
    );
    
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('displays error messages when present', () => {
    const error = {
      ingredient_id: 'Wybierz składnik',
      amount: 'Ilość musi być większa niż 0',
      substitute_recommendation: null,
    };
    
    render(<IngredientInput {...defaultProps} error={error} />);
    
    expect(screen.queryByText('Wybierz składnik')).toBeTruthy();
    expect(screen.queryByText('Ilość musi być większa niż 0')).toBeTruthy();
  });

  it('allows basic interactions', async () => {
    const user = userEvent.setup();
    const onChangeMock = vi.fn();
    const onRemoveMock = vi.fn();
    
    render(
      <IngredientInput 
        {...defaultProps} 
        onChange={onChangeMock}
        onRemove={onRemoveMock}
      />
    );
    
    // Try clicking the remove button
    const removeButton = screen.getAllByRole('button')[0];
    await user.click(removeButton);
    
    expect(onRemoveMock).toHaveBeenCalled();
  });

  it('shows substitute recommendation input', () => {
    const ingredientWithSubstitute = {
      ...mockIngredient,
      substitute_recommendation: 'masło zamiast oleju',
    };
    
    render(
      <IngredientInput 
        {...defaultProps} 
        ingredient={ingredientWithSubstitute}
      />
    );
    
    const substituteInput = screen.getByDisplayValue('masło zamiast oleju');
    expect(substituteInput).toBeTruthy();
  });
}); 