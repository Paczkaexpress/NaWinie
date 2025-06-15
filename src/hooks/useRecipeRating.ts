import { useState } from 'react';
import type { RateRecipeCommand, RecipeRatingDto } from '../types';

export type RecipeRatingState = {
  hasRated: boolean;
  currentUserRating?: number;
  isSubmitting: boolean;
  error: string | null;
};

export function useRecipeRating(recipeId: string) {
  const [state, setState] = useState<RecipeRatingState>({
    hasRated: false,
    currentUserRating: undefined,
    isSubmitting: false,
    error: null,
  });

  const submitRating = async (rating: number): Promise<RecipeRatingDto | null> => {
    if (rating < 1 || rating > 5) {
      setState(prev => ({ ...prev, error: 'Nieprawidłowa ocena. Wybierz od 1 do 5 gwiazdek' }));
      return null;
    }

    try {
      setState(prev => ({ ...prev, isSubmitting: true, error: null }));
      
      const command: RateRecipeCommand = { rating };
      
      const response = await fetch(`/api/recipes/${recipeId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(command),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Musisz być zalogowany aby ocenić przepis');
        }
        if (response.status === 404) {
          throw new Error('Przepis nie został znaleziony');
        }
        if (response.status === 409) {
          throw new Error('Już oceniłeś ten przepis');
        }
        if (response.status === 400) {
          throw new Error('Nieprawidłowa ocena');
        }
        throw new Error('Błąd podczas wysyłania oceny');
      }
      
      const ratingResult: RecipeRatingDto = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        hasRated: true, 
        currentUserRating: rating,
        isSubmitting: false 
      }));
      
      return ratingResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd';
      setState(prev => ({ ...prev, error: errorMessage, isSubmitting: false }));
      return null;
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return { ...state, submitRating, clearError };
} 