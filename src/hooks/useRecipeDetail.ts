import { useState, useEffect } from 'react';
import type { RecipeDetailDto } from '../types';

export type RecipeDetailState = {
  recipe: RecipeDetailDto | null;
  isLoading: boolean;
  error: string | null;
};

export function useRecipeDetail(recipeId: string | undefined) {
  const [state, setState] = useState<RecipeDetailState>({
    recipe: null,
    isLoading: false,
    error: null,
  });

  const fetchRecipe = async (id: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch(`/api/recipes/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Przepis nie został znaleziony');
        }
        if (response.status === 422) {
          throw new Error('Nieprawidłowy identyfikator przepisu');
        }
        throw new Error('Błąd podczas pobierania przepisu');
      }
      
      const recipe: RecipeDetailDto = await response.json();
      setState(prev => ({ ...prev, recipe, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
    }
  };

  const retry = () => {
    if (recipeId) {
      fetchRecipe(recipeId);
    }
  };

  useEffect(() => {
    if (recipeId) {
      fetchRecipe(recipeId);
    } else {
      setState({ recipe: null, isLoading: false, error: null });
    }
  }, [recipeId]);

  return { ...state, retry };
} 