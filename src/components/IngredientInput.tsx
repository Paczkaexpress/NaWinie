import React, { useCallback, useState, useMemo } from 'react';
import type { RecipeIngredientFormData, IngredientDto } from '../types';

interface IngredientInputProps {
  ingredient: RecipeIngredientFormData;
  onChange: (ingredient: RecipeIngredientFormData) => void;
  onRemove: () => void;
  availableIngredients: IngredientDto[];
  error: {
    ingredient_id: string | null;
    amount: string | null;
    substitute_recommendation: string | null;
  } | null;
}

const IngredientInput: React.FC<IngredientInputProps> = React.memo(({
  ingredient,
  onChange,
  onRemove,
  availableIngredients,
  error
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Find selected ingredient details
  const selectedIngredient = useMemo(() => {
    return availableIngredients.find(ing => ing.id === ingredient.ingredient_id);
  }, [availableIngredients, ingredient.ingredient_id]);

  // Filter ingredients based on search term
  const filteredIngredients = useMemo(() => {
    if (!searchTerm) return availableIngredients.slice(0, 10); // Show first 10 by default
    
    return availableIngredients
      .filter(ing => 
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 10); // Limit to 10 results
  }, [availableIngredients, searchTerm]);

  const handleIngredientSelect = useCallback((selectedIngredient: IngredientDto) => {
    onChange({
      ...ingredient,
      ingredient_id: selectedIngredient.id,
    });
    setSearchTerm('');
    setShowDropdown(false);
  }, [ingredient, onChange]);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onChange({
      ...ingredient,
      amount: value,
    });
  }, [ingredient, onChange]);

  const handleOptionalToggle = useCallback(() => {
    onChange({
      ...ingredient,
      is_optional: !ingredient.is_optional,
    });
  }, [ingredient, onChange]);

  const handleSubstituteChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...ingredient,
      substitute_recommendation: e.target.value || null,
    });
  }, [ingredient, onChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  }, []);

  const handleSearchFocus = useCallback(() => {
    setShowDropdown(true);
  }, []);

  const handleSearchBlur = useCallback(() => {
    // Delay hiding dropdown to allow click on items
    setTimeout(() => setShowDropdown(false), 200);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border border-gray-200 rounded-lg">
      {/* Ingredient Selection */}
      <div className="md:col-span-4 relative">
        <label htmlFor={`ingredient-search-${ingredient.ingredient_id || 'new'}`} className="block text-sm font-MEDIUM text-gray-700 mb-1">
          Składnik <span className="text-red-500">*</span>
        </label>
        
        {selectedIngredient ? (
          <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-300 rounded-md">
            <span className="text-sm text-gray-900">{selectedIngredient.name}</span>
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...ingredient,
                  ingredient_id: '',
                });
                setSearchTerm('');
              }}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Usuń wybrany składnik"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <input
              id={`ingredient-search-${ingredient.ingredient_id || 'new'}`}
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              placeholder="Wyszukaj składnik..."
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error?.ingredient_id 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-blue-500'
              }`}
            />
            
            {showDropdown && filteredIngredients.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredIngredients.map((ing) => (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => handleIngredientSelect(ing)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  >
                    <div className="text-sm text-gray-900">{ing.name}</div>
                    <div className="text-xs text-gray-500">{ing.unit_type}</div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        
        {error?.ingredient_id && (
          <p className="mt-1 text-sm text-red-600">{error.ingredient_id}</p>
        )}
      </div>

      {/* Amount */}
      <div className="md:col-span-2">
        <label htmlFor={`ingredient-amount-${ingredient.ingredient_id || 'new'}`} className="block text-sm font-MEDIUM text-gray-700 mb-1">
          Ilość <span className="text-red-500">*</span>
        </label>
        <input
          id={`ingredient-amount-${ingredient.ingredient_id || 'new'}`}
          type="number"
          value={ingredient.amount || ''}
          onChange={handleAmountChange}
          placeholder="100"
          min="0"
          step="0.1"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error?.amount 
              ? 'border-red-300 focus:border-red-500' 
              : 'border-gray-300 focus:border-blue-500'
          }`}
        />
        {selectedIngredient && (
          <p className="mt-1 text-xs text-gray-500">{selectedIngredient.unit_type}</p>
        )}
        {error?.amount && (
          <p className="mt-1 text-sm text-red-600">{error.amount}</p>
        )}
      </div>

      {/* Optional checkbox */}
      <div className="md:col-span-2 flex items-center">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={ingredient.is_optional}
            onChange={handleOptionalToggle}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Opcjonalny</span>
        </label>
      </div>

      {/* Substitute recommendation */}
      <div className="md:col-span-3">
        <label htmlFor={`ingredient-substitute-${ingredient.ingredient_id || 'new'}`} className="block text-sm font-MEDIUM text-gray-700 mb-1">
          Zamiennik
        </label>
        <input
          id={`ingredient-substitute-${ingredient.ingredient_id || 'new'}`}
          type="text"
          value={ingredient.substitute_recommendation || ''}
          onChange={handleSubstituteChange}
          placeholder="np. masło zamiast oleju"
          maxLength={100}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error?.substitute_recommendation 
              ? 'border-red-300 focus:border-red-500' 
              : 'border-gray-300 focus:border-blue-500'
          }`}
        />
        {error?.substitute_recommendation && (
          <p className="mt-1 text-sm text-red-600">{error.substitute_recommendation}</p>
        )}
      </div>

      {/* Remove button */}
      <div className="md:col-span-1 flex items-end">
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
});

IngredientInput.displayName = 'IngredientInput';

export default IngredientInput; 