import React, { useState, useCallback, useEffect } from 'react';
import { useRecipeDetail, useAuth } from '../hooks';
import { RatingService } from '../lib/ratingService';
import type { RecipeRatingDto } from '../types';

// Component imports
import BackButton from './BackButton';
import RecipeHeader from './RecipeHeader';
import RecipeInfo from './RecipeInfo';
import IngredientsList from './IngredientsList';
import StepsList from './StepsList';
import RatingComponent from './RatingComponent';
import RecipeDetailSkeleton from './RecipeDetailSkeleton';

interface RecipeDetailPageProps {
  recipeId: string;
  className?: string;
}

// Simple client-side toast component
const ClientToast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`${
          type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } px-4 py-2 rounded shadow text-white transition-opacity cursor-pointer`}
        onClick={onClose}
      >
        {message}
      </div>
    </div>
  );
};

export default function RecipeDetailPage({ recipeId, className = '' }: RecipeDetailPageProps) {
  const { recipe, isLoading, error, retry } = useRecipeDetail(recipeId);
  const { isAuthenticated } = useAuth();
  const [currentRating, setCurrentRating] = useState<RecipeRatingDto | null>(null);
  const [ratingRefresh, setRatingRefresh] = useState(0); // Force rating refresh
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Safe toast function that works with SSR
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (typeof window !== 'undefined') {
      setToast({ message, type });
    }
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  // Get current rating data from RatingService (localStorage)
  const getCurrentRatingData = useCallback(() => {
    if (!recipe) return null;
    
    const storedRating = RatingService.getRating(recipeId);
    if (storedRating) {
      return {
        average_rating: storedRating.average_rating,
        total_votes: storedRating.total_votes
      };
    }
    
    return {
      average_rating: recipe.average_rating,
      total_votes: recipe.total_votes
    };
  }, [recipe, recipeId, ratingRefresh]); // Include ratingRefresh to force recalculation

  const handleRatingSubmitted = useCallback((rating: RecipeRatingDto) => {
    setCurrentRating(rating);
    setRatingRefresh(prev => prev + 1); // Force refresh of rating data
    showToast('Dziękujemy za ocenę przepisu!', 'success');
  }, [showToast]);

  const handleRetry = useCallback(() => {
    retry();
  }, [retry]);

  // Loading state
  if (isLoading) {
    return <RecipeDetailSkeleton className={className} />;
  }

  // Error state
  if (error) {
    return (
      <div className={`max-w-4xl mx-auto px-4 py-8 ${className}`}>
        <BackButton className="mb-6" />
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <svg 
            className="w-16 h-16 text-red-400 mx-auto mb-4" 
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
          
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Wystąpił problem
          </h2>
          
          <p className="text-red-700 mb-6">
            {error}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-200"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              Spróbuj ponownie
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors duration-200"
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                />
              </svg>
              Strona główna
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No recipe found
  if (!recipe) {
    return (
      <div className={`max-w-4xl mx-auto px-4 py-8 ${className}`}>
        <BackButton className="mb-6" />
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <svg 
            className="w-16 h-16 text-gray-400 mx-auto mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Przepis nie został znaleziony
          </h2>
          
          <p className="text-gray-600 mb-6">
            Nie znaleźliśmy przepisu o podanym identyfikatorze. Może został usunięty lub przeniesiony.
          </p>
          
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
              />
            </svg>
            Przejdź do strony głównej
          </button>
        </div>
      </div>
    );
  }

  // Main recipe view - Get current rating data from RatingService
  const displayRating = getCurrentRatingData() || {
    average_rating: recipe.average_rating,
    total_votes: recipe.total_votes
  };

  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 ${className}`}>
      {/* Back Button */}
      <BackButton className="mb-6" />

      {/* Recipe Header */}
      <RecipeHeader 
        name={recipe.name}
        imageData={recipe.image_data}
        className="mb-6"
      />

      {/* Recipe Info */}
      <RecipeInfo
        prepTime={recipe.preparation_time_minutes}
        difficulty={recipe.complexity_level}
        averageRating={displayRating.average_rating}
        totalVotes={displayRating.total_votes}
        className="mb-6"
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Ingredients */}
        <IngredientsList 
          ingredients={recipe.ingredients}
          className="lg:col-span-1"
        />

        {/* Rating Component */}
        <RatingComponent
          recipeId={recipe.id}
          isAuthenticated={isAuthenticated}
          onRatingSubmitted={handleRatingSubmitted}
          className="lg:col-span-1"
        />
      </div>

      {/* Steps */}
      <StepsList 
        steps={recipe.steps}
        className="mb-6"
      />

      {/* Share Button */}
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Podoba Ci się ten przepis?
        </h3>
        <p className="text-gray-600 mb-4">
          Udostępnij go swoim znajomym!
        </p>
                 <button
           onClick={() => {
             navigator.clipboard.writeText(window.location.href);
             showToast('Link do przepisu został skopiowany!', 'success');
           }}
           className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-200"
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
      </div>

      {/* Client-side toast */}
      {toast && (
        <ClientToast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
} 