import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { RecipeDetailDto } from '../types';

export type RecipeDetailState = {
  recipe: RecipeDetailDto | null;
  isLoading: boolean;
  error: string | null;
};

export function useRecipeDetail(recipeId: string | undefined) {
  console.log('🎣 useRecipeDetail: Hook called with recipeId:', recipeId);
  
  const [state, setState] = useState<RecipeDetailState>(() => {
    console.log('🎣 useRecipeDetail: Initializing state');
    return {
      recipe: null,
      isLoading: !!recipeId, // Start loading if we have a recipeId
      error: null,
    };
  });
  
  console.log('🎣 useRecipeDetail: Current state:', state);

  const fetchRecipe = useCallback(async (id: string) => {
    try {
      console.log('🔍 useRecipeDetail: Fetching recipe with ID:', id);
      setState(prev => {
        console.log('🔄 useRecipeDetail: Setting loading to true, prev state:', prev);
        return { ...prev, isLoading: true, error: null };
      });
      
      // Use absolute URL for server-side compatibility
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4321';
      const url = `${baseUrl}/api/recipes/${id}`;
      console.log('🌐 useRecipeDetail: Fetching from URL:', url);
      
      const response = await fetch(url);
      console.log('📡 useRecipeDetail: Response status:', response.status);
      
      if (!response.ok) {
        console.log('❌ useRecipeDetail: Response not OK:', response.status);
        if (response.status === 404) {
          throw new Error('Przepis nie został znaleziony');
        }
        if (response.status === 422) {
          throw new Error('Nieprawidłowy identyfikator przepisu');
        }
        throw new Error('Błąd podczas pobierania przepisu');
      }
      
      const recipe: RecipeDetailDto = await response.json();
      console.log('✅ useRecipeDetail: Recipe fetched successfully:', recipe?.name);
      console.log('🔍 useRecipeDetail: Recipe data:', recipe);
      console.log('🔄 useRecipeDetail: About to update state with recipe');
      
      setState({
        recipe,
        isLoading: false,
        error: null
      });
      
      console.log('✅ useRecipeDetail: State update dispatched');
      
    } catch (error) {
      console.log('❌ useRecipeDetail: Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd';
      setState({ recipe: null, error: errorMessage, isLoading: false });
    }
  }, []);

  const retry = useCallback(() => {
    if (recipeId) {
      fetchRecipe(recipeId);
    }
  }, [recipeId, fetchRecipe]);

  console.log('📍 useRecipeDetail: About to define useEffect');

  useEffect(() => {
    console.log('🔄 useRecipeDetail: useEffect triggered with recipeId:', recipeId);
    console.log('🔄 useRecipeDetail: recipeId truthy check:', !!recipeId);
    
    if (recipeId) {
      console.log('🚀 useRecipeDetail: About to call fetchRecipe with:', recipeId);
      fetchRecipe(recipeId);
    } else {
      console.log('❌ useRecipeDetail: recipeId is falsy, resetting state');
      setState({ recipe: null, isLoading: false, error: null });
    }
  }, [recipeId, fetchRecipe]);

  console.log('📍 useRecipeDetail: useEffect defined, about to return');

  // Add a useEffect to watch state changes
  useEffect(() => {
    console.log('🔍 useRecipeDetail: State changed:', state);
  }, [state]);

  return { ...state, retry };
} 