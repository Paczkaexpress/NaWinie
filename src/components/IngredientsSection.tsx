import React, { useCallback, useEffect, useState } from 'react';
import type { RecipeIngredientFormData, IngredientDto } from '../types';
import IngredientInput from './IngredientInput';

interface IngredientsSectionProps {
  ingredients: RecipeIngredientFormData[];
  onIngredientsChange: (ingredients: RecipeIngredientFormData[]) => void;
  availableIngredients: IngredientDto[];
  errors: Array<{
    ingredient_id: string | null;
    amount: string | null;
    substitute_recommendation: string | null;
  }>;
}

const IngredientsSection: React.FC<IngredientsSectionProps> = React.memo(({
  ingredients,
  onIngredientsChange,
  availableIngredients,
  errors
}) => {
  const createNewIngredient = useCallback((): RecipeIngredientFormData => ({
    ingredient_id: '',
    amount: 0,
    is_optional: false,
    substitute_recommendation: null,
  }), []);

  const handleAddIngredient = useCallback(() => {
    const newIngredient = createNewIngredient();
    onIngredientsChange([...ingredients, newIngredient]);
  }, [ingredients, onIngredientsChange, createNewIngredient]);

  const handleIngredientChange = useCallback((index: number, updatedIngredient: RecipeIngredientFormData) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = updatedIngredient;
    onIngredientsChange(newIngredients);
  }, [ingredients, onIngredientsChange]);

  const handleRemoveIngredient = useCallback((index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    onIngredientsChange(newIngredients);
  }, [ingredients, onIngredientsChange]);

  // Ensure at least one ingredient input is present
  useEffect(() => {
    if (ingredients.length === 0) {
      onIngredientsChange([createNewIngredient()]);
    }
  }, [ingredients.length, onIngredientsChange, createNewIngredient]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Składniki <span className="text-red-500">*</span>
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Dodaj wszystkie składniki potrzebne do przygotowania przepisu
        </p>

        <div className="space-y-4">
          {ingredients.map((ingredient, index) => (
            <IngredientInput
              key={index}
              ingredient={ingredient}
              onChange={(updatedIngredient) => handleIngredientChange(index, updatedIngredient)}
              onRemove={() => handleRemoveIngredient(index)}
              availableIngredients={availableIngredients}
              error={errors[index] || null}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddIngredient}
          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Dodaj składnik
        </button>

        {ingredients.length === 0 && (
          <p className="mt-2 text-sm text-red-600">
            Przepis musi zawierać co najmniej jeden składnik
          </p>
        )}
      </div>
    </div>
  );
});

IngredientsSection.displayName = 'IngredientsSection';

export default IngredientsSection; 