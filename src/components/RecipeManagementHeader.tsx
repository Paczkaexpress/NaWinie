import React from 'react';
import type { RecipeHeaderProps } from '../types';

const RecipeManagementHeader: React.FC<RecipeHeaderProps> = ({
  recipe,
  isAuthor,
  onEdit,
  onDelete,
  onBack
}) => {
  const getComplexityLabel = (level: string) => {
    switch (level) {
      case 'easy': return 'Łatwy';
      case 'medium': return 'Średni';
      case 'hard': return 'Trudny';
      default: return level;
    }
  };

  const getComplexityColor = (level: string) => {
    switch (level) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="mb-8">
      {/* Breadcrumb and back button */}
      <div className="mb-4">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Powrót
        </button>
      </div>

      {/* Main header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        {/* Recipe title and metadata */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {recipe.name}
          </h1>
          
          {/* Recipe metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {/* Preparation time */}
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {recipe.preparation_time_minutes} min
            </div>

            {/* Complexity level */}
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(recipe.complexity_level)}`}>
              {getComplexityLabel(recipe.complexity_level)}
            </div>

            {/* Rating */}
            {recipe.average_rating && recipe.total_votes && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {recipe.average_rating.toFixed(1)} ({recipe.total_votes} {recipe.total_votes === 1 ? 'ocena' : 'ocen'})
              </div>
            )}

            {/* Created date */}
            <div className="text-gray-500">
              Utworzono: {new Date(recipe.created_at).toLocaleDateString('pl-PL')}
            </div>
          </div>
        </div>

        {/* Action buttons - only visible to author */}
        {isAuthor && (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onEdit}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edytuj
            </button>
            
            <button
              onClick={onDelete}
              className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Usuń
            </button>
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="mt-6 border-b border-gray-200"></div>
    </div>
  );
};

export default RecipeManagementHeader; 