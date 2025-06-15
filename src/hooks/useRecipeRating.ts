import { useState } from 'react';
import type { RecipeRatingDto } from '../types';
import { useAuth } from './useAuth';
import { authService } from '../lib/auth';

interface UseRecipeRatingReturn {
  isLoading: boolean;
  error: string | null;
  submitRating: (recipeId: string, rating: number) => Promise<RecipeRatingDto | null>;
}

export function useRecipeRating(): UseRecipeRatingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const submitRating = async (recipeId: string, rating: number): Promise<RecipeRatingDto | null> => {
    // Check if user is authenticated
    if (!user || !token) {
      setError('You must be logged in to rate recipes');
      return null;
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      setError('Rating must be between 1 and 5');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('⭐ Submitting rating via API:', {
        recipeId,
        rating,
        userId: user.id
      });

      const response = await fetch(`/api/recipes/${recipeId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const result = await response.json() as RecipeRatingDto;
      
      console.log('✅ Rating submitted successfully:', result);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit rating';
      console.error('❌ Error submitting rating:', err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    submitRating
  };
} 