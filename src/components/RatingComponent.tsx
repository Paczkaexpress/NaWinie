import React, { useCallback, useEffect } from 'react';
import { useAuth, useRecipeRating } from '../hooks';
import type { RecipeRatingDto } from '../types';
import StarRating from './StarRating';

interface RatingComponentProps {
  recipeId: string;
  isAuthenticated: boolean;
  onRatingSubmitted?: (rating: RecipeRatingDto) => void;
  className?: string;
}

export default function RatingComponent({ 
  recipeId, 
  isAuthenticated, 
  onRatingSubmitted,
  className = '' 
}: RatingComponentProps) {
  const { 
    hasRated, 
    currentUserRating, 
    isSubmitting, 
    error, 
    submitRating, 
    clearError 
  } = useRecipeRating(recipeId);

  const handleRatingSubmit = useCallback(async (rating: number) => {
    const result = await submitRating(rating);
    if (result && onRatingSubmitted) {
      onRatingSubmitted(result);
    }
  }, [submitRating, onRatingSubmitted]);

  const handleLoginRedirect = useCallback(() => {
    // Store current URL for redirect after login
    const currentUrl = window.location.href;
    window.location.href = `/auth?returnUrl=${encodeURIComponent(currentUrl)}`;
  }, []);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  if (!isAuthenticated) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg 
            className="w-5 h-5 mr-2 text-yellow-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
            />
          </svg>
          Oceń przepis
        </h3>
        
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Zaloguj się, aby ocenić ten przepis i pomóc innym użytkownikom.
          </p>
          
          <button
            onClick={handleLoginRedirect}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-MEDIUM rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
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
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" 
              />
            </svg>
            Zaloguj się aby ocenić
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <svg 
          className="w-5 h-5 mr-2 text-yellow-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
          />
        </svg>
        {hasRated ? 'Twoja ocena' : 'Oceń przepis'}
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg 
              className="w-4 h-4 text-red-400 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <StarRating
          currentRating={currentUserRating}
          onRate={handleRatingSubmit}
          disabled={isSubmitting || hasRated}
          size="lg"
        />
        
        {isSubmitting && (
          <div className="flex items-center text-blue-600">
            <svg 
              className="w-4 h-4 mr-2 animate-spin" 
              fill="none" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm">Wysyłanie...</span>
          </div>
        )}
      </div>

      {hasRated && currentUserRating && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <svg 
              className="w-4 h-4 inline mr-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
            Dziękujemy za ocenę! Twoja opinia pomaga innym użytkownikom.
          </p>
        </div>
      )}
    </div>
  );
} 