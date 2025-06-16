import React from 'react';
import type { RecipeIngredientFormData } from '../types';
import { useIngredients } from '../hooks/useIngredients';
import IngredientSearchInput from './IngredientSearchInput';

export interface IngredientsSectionProps {
  ingredients: RecipeIngredientFormData[];
  onIngredientsChange: (ingredients: RecipeIngredientFormData[]) => void;
  errors: any;
}

const IngredientsSection: React.FC<IngredientsSectionProps> = ({
  ingredients,
  onIngredientsChange,
  errors
}) => {
  const { loading: ingredientsLoading } = useIngredients();

  const onAddIngredient = () => {
    const newIngredient: RecipeIngredientFormData = {
      ingredient_id: '',
      amount: 0,
      is_optional: false,
      substitute_recommendation: null
    };
    onIngredientsChange([...ingredients, newIngredient]);
  };

  const onRemoveIngredient = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    onIngredientsChange(newIngredients);
  };

  const onUpdateIngredient = (index: number, updates: Partial<RecipeIngredientFormData>) => {
    const newIngredients = ingredients.map((ingredient, i) => 
      i === index ? { ...ingredient, ...updates } : ingredient
    );
    onIngredientsChange(newIngredients);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Składniki ({ingredients.length})
        </h3>
        <button
          type="button"
          onClick={onAddIngredient}
          className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Dodaj składnik
        </button>
      </div>

      {ingredients.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <p>Brak składników. Kliknij "Dodaj składnik" aby dodać pierwszy składnik.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ingredients.map((ingredient, index) => {
            const ingredientErrors = errors?.ingredients?.[index] || { ingredient_id: null, amount: null };
            
            return (
              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-MEDIUM text-gray-700">
                    Składnik {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveIngredient(index)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                    title="Usuń składnik"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ingredient Selection */}
                  <div>
                    <label className="block text-sm font-MEDIUM text-gray-700 mb-1">
                      Składnik *
                    </label>
                    <IngredientSearchInput
                      value={ingredient.ingredient_id}
                      onChange={(ingredientId) => onUpdateIngredient(index, { ingredient_id: ingredientId })}
                      error={ingredientErrors.ingredient_id}
                      disabled={ingredientsLoading}
                      placeholder="Wyszukaj składnik..."
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-MEDIUM text-gray-700 mb-1">
                      Ilość *
                    </label>
                    <input
                      type="number"
                      value={ingredient.amount}
                      onChange={(e) => onUpdateIngredient(index, { amount: Number(e.target.value) })}
                      min="0"
                      step="0.1"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        ingredientErrors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="np. 250"
                    />
                    {ingredientErrors.amount && (
                      <p className="mt-1 text-sm text-red-600">{ingredientErrors.amount}</p>
                    )}
                  </div>
                </div>

                {/* Optional and Substitute Recommendation */}
                <div className="mt-4 space-y-3">
                  {/* Optional Checkbox */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`optional-${index}`}
                      checked={ingredient.is_optional}
                      onChange={(e) => onUpdateIngredient(index, { is_optional: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`optional-${index}`} className="ml-2 text-sm text-gray-700">
                      Składnik opcjonalny
                    </label>
                  </div>

                  {/* Substitute Recommendation */}
                  <div>
                    <label className="block text-sm font-MEDIUM text-gray-700 mb-1">
                      Sugerowany zamiennik (opcjonalnie)
                    </label>
                    <input
                      type="text"
                      value={ingredient.substitute_recommendation || ''}
                      onChange={(e) => onUpdateIngredient(index, { 
                        substitute_recommendation: e.target.value || null 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="np. można zastąpić mlekiem kokosowym"
                      maxLength={200}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IngredientsSection; 