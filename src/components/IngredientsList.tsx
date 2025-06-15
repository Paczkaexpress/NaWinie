import React, { memo } from 'react';
import type { RecipeIngredientDto } from '../types';

interface IngredientItemProps {
  ingredient: RecipeIngredientDto;
}

const IngredientItem = memo(function IngredientItem({ ingredient }: IngredientItemProps) {
  const { name, amount, unit_type, is_optional, substitute_recommendation } = ingredient;

  return (
    <li className="flex items-start py-2 border-b border-gray-100 last:border-b-0">
      <div className="flex-1">
        <div className="flex items-center">
          <span className="font-medium text-gray-900">
            {amount} {unit_type} {name}
          </span>
          {is_optional && (
            <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              opcjonalne
            </span>
          )}
        </div>
        {substitute_recommendation && (
          <p className="mt-1 text-sm text-gray-600">
            <span className="font-medium">Zamiennik:</span> {substitute_recommendation}
          </p>
        )}
      </div>
    </li>
  );
});

interface IngredientsListProps {
  ingredients: RecipeIngredientDto[];
  className?: string;
}

const IngredientsList = memo(function IngredientsList({ ingredients, className = '' }: IngredientsListProps) {
  if (!ingredients || ingredients.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 text-center ${className}`}>
        <p className="text-gray-500">Brak składników do wyświetlenia</p>
      </div>
    );
  }

  // Separate required and optional ingredients
  const requiredIngredients = ingredients.filter(ingredient => !ingredient.is_optional);
  const optionalIngredients = ingredients.filter(ingredient => ingredient.is_optional);

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <svg 
            className="w-6 h-6 mr-2 text-green-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
            />
          </svg>
          Składniki ({ingredients.length})
        </h2>
        
        {requiredIngredients.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Wymagane składniki</h3>
            <ul className="space-y-0">
              {requiredIngredients.map((ingredient) => (
                <IngredientItem 
                  key={ingredient.ingredient_id} 
                  ingredient={ingredient} 
                />
              ))}
            </ul>
          </div>
        )}
        
        {optionalIngredients.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Składniki opcjonalne</h3>
            <ul className="space-y-0">
              {optionalIngredients.map((ingredient) => (
                <IngredientItem 
                  key={ingredient.ingredient_id} 
                  ingredient={ingredient} 
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
});

export default IngredientsList; 