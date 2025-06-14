/// <reference types="vitest/globals" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IngredientInput from '../components/IngredientInput';
import type { RecipeIngredientFormData, IngredientDto } from '../types';

describe('IngredientInput', () => {
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

  it('renders ingredient search input when no ingredient is selected', () => {
    render(<IngredientInput {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Wyszukaj składnik...')).toBeInTheDocument();
    expect(screen.getByLabelText(/składnik/i)).toBeInTheDocument();
  });

  it('renders amount input with proper attributes', () => {
    render(<IngredientInput {...defaultProps} />);
    
    const amountInput = screen.getByLabelText(/ilość/i);
    expect(amountInput).toBeInTheDocument();
    expect(amountInput).toHaveAttribute('type', 'number');
    expect(amountInput).toHaveAttribute('min', '0');
    expect(amountInput).toHaveAttribute('step', '0.1');
  });

  it('renders optional checkbox', () => {
    render(<IngredientInput {...defaultProps} />);
    
    const checkbox = screen.getByLabelText(/opcjonalny/i);
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('type', 'checkbox');
  });

  it('renders substitute recommendation input', () => {
    render(<IngredientInput {...defaultProps} />);
    
    const substituteInput = screen.getByLabelText(/zamiennik/i);
    expect(substituteInput).toBeInTheDocument();
    expect(substituteInput).toHaveAttribute('maxLength', '100');
  });

  it('renders remove button', () => {
    render(<IngredientInput {...defaultProps} />);
    
    const removeButton = screen.getByRole('button');
    expect(removeButton).toBeInTheDocument();
  });

  it('calls onChange when amount is changed', async () => {
    const user = userEvent.setup();
    render(<IngredientInput {...defaultProps} />);
    
    const amountInput = screen.getByLabelText(/ilość/i);
    await user.clear(amountInput);
    await user.type(amountInput, '250');
    
    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...mockIngredient,
      amount: 250,
    });
  });

  it('calls onChange when optional checkbox is toggled', async () => {
    const user = userEvent.setup();
    render(<IngredientInput {...defaultProps} />);
    
    const checkbox = screen.getByLabelText(/opcjonalny/i);
    await user.click(checkbox);
    
    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...mockIngredient,
      is_optional: true,
    });
  });

  it('calls onChange when substitute recommendation is changed', async () => {
    const user = userEvent.setup();
    render(<IngredientInput {...defaultProps} />);
    
    const substituteInput = screen.getByLabelText(/zamiennik/i);
    await user.type(substituteInput, 'masło zamiast oleju');
    
    expect(defaultProps.onChange).toHaveBeenLastCalledWith({
      ...mockIngredient,
      substitute_recommendation: 'masło zamiast oleju',
    });
  });

  it('calls onRemove when remove button is clicked', async () => {
    const user = userEvent.setup();
    render(<IngredientInput {...defaultProps} />);
    
    const removeButton = screen.getByRole('button');
    await user.click(removeButton);
    
    expect(defaultProps.onRemove).toHaveBeenCalledOnce();
  });

  it('shows dropdown when search input is focused', async () => {
    const user = userEvent.setup();
    render(<IngredientInput {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Wyszukaj składnik...');
    await user.click(searchInput);
    
    await waitFor(() => {
      expect(screen.getByText('Mąka pszenna')).toBeInTheDocument();
      expect(screen.getByText('Jajka')).toBeInTheDocument();
      expect(screen.getByText('Mleko')).toBeInTheDocument();
    });
  });

  it('filters ingredients when typing in search', async () => {
    const user = userEvent.setup();
    render(<IngredientInput {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Wyszukaj składnik...');
    await user.type(searchInput, 'mąka');
    
    await waitFor(() => {
      expect(screen.getByText('Mąka pszenna')).toBeInTheDocument();
      expect(screen.queryByText('Jajka')).not.toBeInTheDocument();
      expect(screen.queryByText('Mleko')).not.toBeInTheDocument();
    });
  });

  it('selects ingredient when clicked from dropdown', async () => {
    const user = userEvent.setup();
    render(<IngredientInput {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Wyszukaj składnik...');
    await user.click(searchInput);
    
    await waitFor(() => {
      expect(screen.getByText('Mąka pszenna')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Mąka pszenna'));
    
    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...mockIngredient,
      ingredient_id: '1',
    });
  });

  it('displays selected ingredient correctly', () => {
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
    
    expect(screen.getByText('Mąka pszenna')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Wyszukaj składnik...')).not.toBeInTheDocument();
  });

  it('shows unit type for selected ingredient', () => {
    const selectedIngredient = {
      ...mockIngredient,
      ingredient_id: '1',
      amount: 250,
    };
    
    render(
      <IngredientInput 
        {...defaultProps} 
        ingredient={selectedIngredient}
      />
    );
    
    expect(screen.getByText('g')).toBeInTheDocument();
  });

  it('displays error messages when present', () => {
    const error = {
      ingredient_id: 'Wybierz składnik',
      amount: 'Ilość musi być większa niż 0',
      substitute_recommendation: null,
    };
    
    render(<IngredientInput {...defaultProps} error={error} />);
    
    expect(screen.getByText('Wybierz składnik')).toBeInTheDocument();
    expect(screen.getByText('Ilość musi być większa niż 0')).toBeInTheDocument();
  });

  it('applies error styling when errors are present', () => {
    const error = {
      ingredient_id: 'Wybierz składnik',
      amount: null,
      substitute_recommendation: null,
    };
    
    render(<IngredientInput {...defaultProps} error={error} />);
    
    const searchInput = screen.getByPlaceholderText('Wyszukaj składnik...');
    expect(searchInput).toHaveClass('border-red-300');
  });
}); 