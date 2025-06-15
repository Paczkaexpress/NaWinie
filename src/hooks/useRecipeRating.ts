import { useState } from 'react';
import type { RecipeRatingDto } from '../types';
import { useAuth } from './useAuth';
import { authService } from '../lib/auth';

interface UseRecipeRatingReturn {
  isSubmitting: boolean;
  error: string | null;
  submitRating: (rating: number) => Promise<RecipeRatingDto | null>;
}

export function useRecipeRating(recipeId: string): UseRecipeRatingReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const submitRating = async (rating: number): Promise<RecipeRatingDto | null> => {
    // Clear any previous errors
    setError(null);

    // Check if user is authenticated
    if (!user) {
      setError('Musisz być zalogowany aby ocenić przepis');
      return null;
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      setError('Nieprawidłowa ocena. Wybierz od 1 do 5 gwiazdek');
      return null;
    }

    setIsSubmitting(true);

    try {
      // Get current session for authentication token
      const session = await authService.getSession();
      if (!session?.access_token) {
        setError('Musisz być zalogowany aby ocenić przepis');
        return null;
      }

      console.log('⭐ Submitting rating via API:', {
        recipeId,
        rating,
        userId: user.id
      });

      const response = await fetch(`/api/recipes/${recipeId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ rating })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
        
        // Handle specific error cases with Polish messages
        if (response.status === 409) {
          setError('Już oceniłeś ten przepis');
          return null;
        }
        
        if (response.status === 401) {
          setError('Musisz być zalogowany aby ocenić przepis');
          return null;
        }
        
        if (response.status >= 500) {
          setError('Błąd podczas wysyłania oceny');
          return null;
        }
        
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const result = await response.json() as RecipeRatingDto;
      
      console.log('✅ Rating submitted successfully:', result);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Błąd podczas wysyłania oceny';
      console.error('❌ Error submitting rating:', err);
      setError(errorMessage);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    error,
    submitRating
  };
}

// Keep the old interface for backward compatibility with existing components
export function useRecipeRatingLegacy(): {
  isSubmitting: boolean;
  error: string | null;
  submitRating: (recipeId: string, rating: number) => Promise<RecipeRatingDto | null>;
} {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const submitRating = async (recipeId: string, rating: number): Promise<RecipeRatingDto | null> => {
    // Clear any previous errors
    setError(null);

    // Check if user is authenticated
    if (!user) {
      setError('Musisz być zalogowany aby ocenić przepis');
      return null;
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      setError('Nieprawidłowa ocena. Wybierz od 1 do 5 gwiazdek');
      return null;
    }

    setIsSubmitting(true);

    try {
      // Get current session for authentication token
      const session = await authService.getSession();
      if (!session?.access_token) {
        setError('Musisz być zalogowany aby ocenić przepis');
        return null;
      }

      console.log('⭐ Submitting rating via API:', {
        recipeId,
        rating,
        userId: user.id
      });

      const response = await fetch(`/api/recipes/${recipeId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ rating })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
        
        // Handle specific error cases with Polish messages
        if (response.status === 409) {
          setError('Już oceniłeś ten przepis');
          return null;
        }
        
        if (response.status === 401) {
          setError('Musisz być zalogowany aby ocenić przepis');
          return null;
        }
        
        if (response.status >= 500) {
          setError('Błąd podczas wysyłania oceny');
          return null;
        }
        
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const result = await response.json() as RecipeRatingDto;
      
      console.log('✅ Rating submitted successfully:', result);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Błąd podczas wysyłania oceny';
      console.error('❌ Error submitting rating:', err);
      setError(errorMessage);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    error,
    submitRating
  };
} 