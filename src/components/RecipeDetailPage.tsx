import React, { useState, useEffect } from 'react';
import { useRecipeRatingLegacy } from '../hooks/useRecipeRating';
import { useAuth } from '../hooks/useAuth';
import { getRecipeById } from '../lib/api';
import type { RecipeDetailDto } from '../types';

// Component imports
import BackButton from './BackButton';
import RecipeHeader from './RecipeHeader';
import RecipeInfo from './RecipeInfo';
import IngredientsList from './IngredientsList';
import StepsList from './StepsList';
import RatingComponent from './RatingComponent';
import RecipeDetailSkeleton from './RecipeDetailSkeleton';

interface RecipeDetailPageProps {
  initialRecipe?: RecipeDetailDto;
  recipeId?: string;
}

export default function RecipeDetailPage({ initialRecipe, recipeId }: RecipeDetailPageProps) {
  const [recipe, setRecipe] = useState<RecipeDetailDto | null>(initialRecipe || null);
  const [isLoading, setIsLoading] = useState(!initialRecipe);
  const [error, setError] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [showRatingSuccess, setShowRatingSuccess] = useState(false);
  const [showLinkCopied, setShowLinkCopied] = useState(false);
  
  const { submitRating, isSubmitting: isSubmittingRating, error: ratingError } = useRecipeRatingLegacy();
  const { isAuthenticated, user } = useAuth();

  // Load recipe data if recipeId is provided but no initialRecipe
  useEffect(() => {
    if (recipeId && !initialRecipe) {
      const loadRecipe = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const recipeData = await getRecipeById(recipeId);
          setRecipe(recipeData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load recipe');
        } finally {
          setIsLoading(false);
        }
      };
      
      loadRecipe();
    }
  }, [recipeId, initialRecipe]);

  // Show loading skeleton while data is loading
  if (isLoading) {
    return (
      <div data-testid="recipe-detail-skeleton" className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20 mb-6"></div>
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
            <div className="h-64 md:h-80 lg:h-96 bg-gray-200"></div>
            <div className="p-6">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Wystąpił problem</h2>
          <p className="text-gray-600 mb-6">Przepis nie został znaleziony</p>
          <div className="space-x-4">
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                if (recipeId) {
                  // Retry loading the recipe
                  const loadRecipe = async () => {
                    try {
                      const recipeData = await getRecipeById(recipeId);
                      setRecipe(recipeData);
                    } catch (err) {
                      console.error('Error loading recipe:', err);
                      setError(err instanceof Error ? err.message : 'Failed to load recipe');
                    } finally {
                      setIsLoading(false);
                    }
                  };
                  loadRecipe();
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Spróbuj ponownie
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors inline-block"
            >
              Strona główna
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if recipe is null
  if (!recipe) {
    return null;
  }

  const handleRatingSubmit = async () => {
    if (!selectedRating || !recipe) return;

    const result = await submitRating(recipe.id, selectedRating);
    
    if (result) {
      // Update the local recipe state with the new rating data
      setRecipe(prev => prev ? ({
        ...prev,
        average_rating: result.average_rating,
        total_votes: result.total_votes
      }) : prev);
      
      setShowRatingSuccess(true);
      setSelectedRating(null);
      
      // Hide success message after 3 seconds
      setTimeout(() => setShowRatingSuccess(false), 3000);
      
      // Also refresh the recipe data from the database to ensure consistency
      try {
        const updatedRecipe = await getRecipeById(recipe.id);
        setRecipe(updatedRecipe);
      } catch (error) {
        console.error('Error refreshing recipe data:', error);
        // Don't show error to user since the rating was successful
      }
    }
  };

  const renderStars = (rating: number, interactive = false, onClick?: (rating: number) => void) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onClick?.(star)}
            aria-label={interactive ? `Oceń ${star} ${star === 1 ? 'gwiazdką' : 'gwiazdkami'}` : undefined}
            className={`
              ${interactive ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}
              transition-all duration-200
              ${star <= rating
                ? 'text-yellow-400'
                : 'text-gray-300'
              }
            `}
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center px-4 py-2 mb-6 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
      >
        <svg 
          className="w-4 h-4 mr-2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 19l-7-7 7-7" 
          />
        </svg>
        Wróć do poprzedniej strony
      </button>

      {/* Recipe Header with Image */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
        {/* Recipe Image */}
        <div className="aspect-w-16 aspect-h-9 md:aspect-h-6">
          {recipe?.image_data ? (
            <img
              src={recipe.image_data.startsWith('data:image/') ? recipe.image_data : `data:image/jpeg;base64,${recipe.image_data}`}
              alt={`Recipe: ${recipe.name}`}
              className="w-full h-64 md:h-80 lg:h-96 object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-64 md:h-80 lg:h-96 bg-gray-200 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <svg 
                  className="w-16 h-16 mx-auto mb-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
                <p className="text-sm">No recipe image</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Recipe Title and Info */}
        <div className="p-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{recipe?.name || 'Untitled Recipe'}</h1>
          
          {/* Rating Display */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              {renderStars(recipe.average_rating || 0)}
              <span className="text-lg font-medium text-gray-700">
                {recipe.average_rating ? recipe.average_rating.toFixed(1) : '0.0'}
              </span>
              <span className="text-sm text-gray-500">
                ({recipe.total_votes || 0} {recipe.total_votes === 1 ? 'ocena' : 'ocen'})
              </span>
            </div>
          </div>

          {/* Recipe Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><span className="font-medium">Prep Time:</span> {recipe?.preparation_time_minutes || 0} min</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span><span className="font-medium">Difficulty:</span>{' '}
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  (recipe?.difficulty_level === 'easy' || recipe?.complexity_level === 'easy') ? 'bg-green-100 text-green-800' :
                  (recipe?.difficulty_level === 'medium' || recipe?.complexity_level === 'medium') ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {(recipe?.difficulty_level === 'easy' || recipe?.complexity_level === 'easy') ? 'Łatwy' : 
                   (recipe?.difficulty_level === 'medium' || recipe?.complexity_level === 'medium') ? 'Średni' : 
                   (recipe?.difficulty_level === 'hard' || recipe?.complexity_level === 'hard') ? 'Trudny' : 'nieznany'}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span><span className="font-medium">Servings:</span> {recipe?.servings || 1}</span>
            </div>
          </div>

          {/* Description */}
          {recipe.description && (
            <p className="text-gray-700 leading-relaxed">{recipe.description}</p>
          )}
        </div>
      </div>

      {/* Success Message */}
      {showRatingSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-800 font-medium">Dziękujemy za ocenę przepisu!</p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Ingredients */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Składniki ({recipe.ingredients?.length || 0})
          </h2>
          <ul className="space-y-3">
            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 transition-colors">
                  <span className="flex-shrink-0 w-2 h-2 bg-orange-400 rounded-full mt-2"></span>
                  <div className="flex-1">
                    <span className={`font-medium ${ingredient?.is_optional ? 'text-gray-600 italic' : 'text-gray-800'}`}>
                      {ingredient?.amount || 0} {ingredient?.unit_type || 'unit'} {ingredient?.name || 'Unknown ingredient'}
                      {ingredient?.is_optional && (
                        <span className="text-xs text-gray-500 ml-2 px-2 py-1 bg-gray-100 rounded-full">optional</span>
                      )}
                    </span>
                    {ingredient?.substitute_recommendation && (
                      <p className="text-sm text-gray-500 mt-1">
                        <span className="font-medium">Alternative:</span> {ingredient.substitute_recommendation}
                      </p>
                    )}
                  </div>
                </li>
              ))
            ) : (
              <li className="text-gray-500 italic text-center py-4">No ingredients listed</li>
            )}
          </ul>
        </div>

        {/* Rating Component */}
        {isAuthenticated && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Oceń przepis
            </h3>
            
            {ratingError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {ratingError}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your rating:</label>
                <div className="flex items-center gap-1">
                  {renderStars(selectedRating || 0, true, setSelectedRating)}
                </div>
              </div>
              <button
                onClick={handleRatingSubmit}
                disabled={!selectedRating || isSubmittingRating}
                className="w-full px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isSubmittingRating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Rating'
                )}
              </button>
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Rate this recipe</h3>
            <p className="text-blue-800 mb-4">
              Share your experience with this recipe by giving it a rating.
            </p>
            <a 
              href="/auth" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Log in to rate
            </a>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Sposób przygotowania ({recipe.steps?.length || 0} kroków)
        </h2>
        <ol className="space-y-4">
          {recipe.steps && recipe.steps.length > 0 ? (
            recipe.steps.map((step, index) => (
              <li key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white text-sm font-bold rounded-full flex items-center justify-center">
                  {typeof step === 'object' ? step?.step || index + 1 : index + 1}
                </span>
                <p className="text-gray-800 leading-relaxed flex-1">
                  {typeof step === 'object' ? step?.description || 'No description' : step || 'No description'}
                </p>
              </li>
            ))
          ) : (
            <li className="text-gray-500 italic text-center py-8">No instructions provided</li>
          )}
        </ol>
      </div>

      {/* Nutritional Information */}
      {recipe.nutrition_facts && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Nutrition Facts
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(recipe.nutrition_facts).map(([key, value]) => (
              <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900 capitalize text-sm">
                  {key.replace('_', ' ')}
                </div>
                <div className="text-2xl font-bold text-blue-600 mt-1">{String(value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Podoba Ci się ten przepis?
        </h3>
        <p className="text-gray-600 mb-4">
          Podziel się nim z rodziną i przyjaciółmi!
        </p>
        <button
          onClick={async () => {
            if (navigator.clipboard && window.location) {
              try {
                await navigator.clipboard.writeText(window.location.href);
                // Show success message by updating state
                setShowLinkCopied(true);
                setTimeout(() => setShowLinkCopied(false), 3000);
              } catch (error) {
                alert('Nie można skopiować linku. Proszę skopiować URL ręcznie.');
              }
            } else {
              alert('Nie można skopiować linku. Proszę skopiować URL ręcznie.');
            }
          }}
          className="inline-flex items-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-colors duration-200"
        >
          <svg 
            className="w-4 h-4 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
            />
          </svg>
          Skopiuj link
        </button>
        
        {/* Copy Link Success Message */}
        {showLinkCopied && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">Link do przepisu został skopiowany!</p>
          </div>
        )}
      </div>
    </div>
  );
} 