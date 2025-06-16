import React, { useState } from 'react';
import type { RecipeDetailsSectionProps } from '../types';

const RecipeDetailsSection: React.FC<RecipeDetailsSectionProps> = ({
  recipe,
  isEditable
}) => {
  const [imageExpanded, setImageExpanded] = useState(false);

  return (
    <div className="space-y-8">
      {/* Recipe Image */}
      {recipe.image_data && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Zdjęcie przepisu</h2>
            <div className="relative">
              <img
                src={`data:image/jpeg;base64,${recipe.image_data}`}
                alt={recipe.name}
                className={`w-full rounded-lg cursor-pointer transition-all duration-300 ${
                  imageExpanded ? 'max-h-none' : 'max-h-96 object-cover'
                }`}
                onClick={() => setImageExpanded(!imageExpanded)}
              />
              <button
                onClick={() => setImageExpanded(!imageExpanded)}
                className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                title={imageExpanded ? 'Zmniejsz' : 'Powiększ'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {imageExpanded ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9l6 6m0-6l-6 6m12-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ingredients Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Składniki ({recipe.ingredients.length})
          </h2>
          <div className="space-y-3">
            {recipe.ingredients.map((ingredient, index) => (
              <div
                key={`${ingredient.ingredient_id}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <span className="font-MEDIUM text-gray-900">
                      {ingredient.name}
                    </span>
                    {ingredient.is_optional && (
                      <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                        opcjonalny
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-MEDIUM text-gray-900">
                    {ingredient.amount} {ingredient.unit_type}
                  </div>
                  {ingredient.substitute_recommendation && (
                    <div className="text-xs text-gray-500 mt-1">
                      Można zastąpić: {ingredient.substitute_recommendation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Sposób przygotowania ({recipe.steps.length} {recipe.steps.length === 1 ? 'krok' : 'kroków'})
          </h2>
          <div className="space-y-4">
            {recipe.steps.map((step, index) => (
              <div
                key={step.step}
                className="flex space-x-4"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    {step.step}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recipe Metadata */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Informacje o przepisie</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Autor</div>
              <div className="font-MEDIUM text-gray-900">
                {recipe.author_id}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Data utworzenia</div>
              <div className="font-MEDIUM text-gray-900">
                {new Date(recipe.created_at).toLocaleDateString('pl-PL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
            {recipe.updated_at && new Date(recipe.updated_at) > new Date(recipe.created_at) && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Ostatnia modyfikacja</div>
                <div className="font-MEDIUM text-gray-900">
                  {new Date(recipe.updated_at).toLocaleDateString('pl-PL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            )}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">ID przepisu</div>
              <div className="font-mono text-sm text-gray-900 break-all">
                {recipe.id}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailsSection; 