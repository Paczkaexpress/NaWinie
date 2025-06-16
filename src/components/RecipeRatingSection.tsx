import React, { useState, useEffect } from 'react';
import type { RecipeRatingSectionProps, RatingComponentState } from '../types';
import { useRecipeRating } from '../hooks/useRecipeRating';

const RecipeRatingSection: React.FC<RecipeRatingSectionProps> = ({
  recipeId,
  currentRating,
  isAuthor,
  hasUserRated,
  onRatingSubmit
}) => {
  const [ratingState, setRatingState] = useState<RatingComponentState>({
    selectedRating: 0,
    isSubmitting: false,
    error: null
  });

  const [showThankYou, setShowThankYou] = useState(false);
  const { isSubmitting: hookSubmitting, error: hookError, submitRating } = useRecipeRating(recipeId);

  // Sync with hook state
  useEffect(() => {
    setRatingState(prev => ({
      ...prev,
      isSubmitting: hookSubmitting,
      error: hookError
    }));
  }, [hookSubmitting, hookError]);

  const handleStarClick = (rating: number) => {
    if (isAuthor || hasUserRated || ratingState.isSubmitting) return;
    setRatingState(prev => ({ ...prev, selectedRating: rating, error: null }));
  };

  const handleStarHover = (rating: number) => {
    if (isAuthor || hasUserRated || ratingState.isSubmitting) return;
    setRatingState(prev => ({ ...prev, selectedRating: rating }));
  };

  const handleMouseLeave = () => {
    if (isAuthor || hasUserRated || ratingState.isSubmitting) return;
    setRatingState(prev => ({ ...prev, selectedRating: 0 }));
  };

  const handleSubmitRating = async () => {
    if (!ratingState.selectedRating || ratingState.selectedRating < 1 || ratingState.selectedRating > 5) {
      setRatingState(prev => ({ ...prev, error: 'Wybierz ocenę od 1 do 5 gwiazdek' }));
      return;
    }

    try {
      const result = await submitRating(ratingState.selectedRating);
      if (result) {
        setShowThankYou(true);
        setTimeout(() => setShowThankYou(false), 3000);
        await onRatingSubmit(ratingState.selectedRating);
        setRatingState(prev => ({ ...prev, selectedRating: 0 }));
      }
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const renderStars = (rating: number, interactive: boolean = false, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8'
    };

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && handleStarClick(star)}
            onMouseEnter={() => interactive && handleStarHover(star)}
            disabled={!interactive || ratingState.isSubmitting}
            className={`${sizeClasses[size]} transition-colors ${
              interactive 
                ? 'cursor-pointer hover:scale-110 transform transition-transform' 
                : 'cursor-default'
            } ${ratingState.isSubmitting ? 'opacity-50' : ''}`}
          >
            <svg
              className={`w-full h-full ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 fill-current'
              }`}
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  // Don't show rating section for authors
  if (isAuthor) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Oceń przepis
      </h3>

      {/* Current Rating Display */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {renderStars(currentRating.average_rating, false, 'md')}
            <span className="text-lg font-MEDIUM text-gray-900">
              {currentRating.average_rating > 0 ? currentRating.average_rating.toFixed(1) : '0.0'}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            ({currentRating.total_votes} {currentRating.total_votes === 1 ? 'ocena' : 'ocen'})
          </div>
        </div>
      </div>

      {/* User Rating Section */}
      {hasUserRated ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center text-green-700">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Dziękujemy za ocenę tego przepisu!
          </div>
        </div>
      ) : showThankYou ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg animate-pulse">
          <div className="flex items-center text-green-700">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Dziękujemy za ocenę!
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-MEDIUM text-gray-700 mb-2">
              Jak oceniasz ten przepis?
            </label>
            <div 
              className="flex items-center space-x-2"
              onMouseLeave={handleMouseLeave}
            >
              {renderStars(ratingState.selectedRating, true, 'lg')}
              {ratingState.selectedRating > 0 && (
                <span className="ml-3 text-lg font-MEDIUM text-gray-700">
                  {ratingState.selectedRating} / 5
                </span>
              )}
            </div>
            {ratingState.selectedRating > 0 && (
              <p className="mt-1 text-sm text-gray-600">
                {ratingState.selectedRating === 1 && "Słaby przepis"}
                {ratingState.selectedRating === 2 && "Przeciętny przepis"}
                {ratingState.selectedRating === 3 && "Dobry przepis"}
                {ratingState.selectedRating === 4 && "Bardzo dobry przepis"}
                {ratingState.selectedRating === 5 && "Doskonały przepis!"}
              </p>
            )}
          </div>

          {/* Error Message */}
          {ratingState.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-800 text-sm">{ratingState.error}</div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmitRating}
            disabled={ratingState.selectedRating === 0 || ratingState.isSubmitting}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ratingState.isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {ratingState.isSubmitting ? 'Zapisywanie...' : 'Oceń przepis'}
          </button>
        </div>
      )}

      {/* Rating Guidelines */}
      <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-sm text-gray-600">
          <p className="font-MEDIUM mb-2">Wskazówki dotyczące oceniania:</p>
          <ul className="space-y-1 text-xs">
            <li>• 5 gwiazdek - przepis doskonały, polecam wszystkim</li>
            <li>• 4 gwiazdki - bardzo dobry przepis z drobnymi niedociągnięciami</li>
            <li>• 3 gwiazdki - dobry przepis, wart wypróbowania</li>
            <li>• 2 gwiazdki - przeciętny przepis, ma swoje wady</li>
            <li>• 1 gwiazdka - przepis wymaga znaczących poprawek</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RecipeRatingSection; 