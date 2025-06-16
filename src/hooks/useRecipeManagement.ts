import { useState, useEffect, useCallback } from 'react';
import type { 
  RecipeDetailDto, 
  RecipeManagementState, 
  UpdateRecipeCommand, 
  UserDto 
} from '../types';
import { authService } from '../lib/auth';
import { useAuth } from './useAuth';

export function useRecipeManagement(recipeId: string, currentUser: UserDto) {
  const [state, setState] = useState<RecipeManagementState>({
    recipe: null,
    isLoading: true,
    error: null,
    isEditModalOpen: false,
    isDeleting: false,
    deleteConfirmOpen: false,
  });

  const { user } = useAuth();

  // Fetch recipe data
  const fetchRecipe = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch(`/api/recipes/${recipeId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Przepis nie został znaleziony');
        }
        if (response.status === 401) {
          throw new Error('Brak uprawnień do wyświetlenia tego przepisu');
        }
        throw new Error('Błąd podczas pobierania przepisu');
      }

      const recipe: RecipeDetailDto = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        recipe, 
        isLoading: false, 
        error: null 
      }));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd';
      setState(prev => ({ 
        ...prev, 
        recipe: null, 
        error: errorMessage, 
        isLoading: false 
      }));
    }
  }, [recipeId]);

  // Update recipe
  const updateRecipe = useCallback(async (data: UpdateRecipeCommand): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const session = await authService.getSession();
      if (!session?.access_token) {
        throw new Error('Musisz być zalogowany aby edytować przepis');
      }

      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Brak uprawnień do edycji tego przepisu');
        }
        if (response.status === 403) {
          throw new Error('Nie masz uprawnień do edycji tego przepisu');
        }
        if (response.status === 404) {
          throw new Error('Przepis nie został znaleziony');
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Nieprawidłowe dane przepisu');
        }
        throw new Error('Błąd podczas aktualizacji przepisu');
      }

      const updatedRecipe: RecipeDetailDto = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        recipe: updatedRecipe, 
        isLoading: false, 
        isEditModalOpen: false 
      }));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Błąd podczas aktualizacji przepisu';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoading: false 
      }));
      throw error;
    }
  }, [recipeId]);

  // Delete recipe
  const deleteRecipe = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isDeleting: true, error: null }));

      const session = await authService.getSession();
      if (!session?.access_token) {
        throw new Error('Musisz być zalogowany aby usunąć przepis');
      }

      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Brak uprawnień do usunięcia tego przepisu');
        }
        if (response.status === 403) {
          throw new Error('Nie masz uprawnień do usunięcia tego przepisu');
        }
        if (response.status === 404) {
          throw new Error('Przepis nie został znaleziony');
        }
        throw new Error('Błąd podczas usuwania przepisu');
      }

      // Redirect to recipes list after successful deletion
      window.location.href = '/recipes';
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Błąd podczas usuwania przepisu';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isDeleting: false,
        deleteConfirmOpen: false 
      }));
      throw error;
    }
  }, [recipeId]);

  // Check if current user is the author
  const isAuthor = useCallback((): boolean => {
    if (!state.recipe || !user) return false;
    return state.recipe.author_id === user.id;
  }, [state.recipe, user]);

  // Modal controls
  const openEditModal = useCallback(() => {
    setState(prev => ({ ...prev, isEditModalOpen: true }));
  }, []);

  const closeEditModal = useCallback(() => {
    setState(prev => ({ ...prev, isEditModalOpen: false }));
  }, []);

  const openDeleteConfirm = useCallback(() => {
    setState(prev => ({ ...prev, deleteConfirmOpen: true }));
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setState(prev => ({ ...prev, deleteConfirmOpen: false }));
  }, []);

  // Initialize data
  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  return {
    ...state,
    updateRecipe,
    deleteRecipe,
    isAuthor: isAuthor(),
    openEditModal,
    closeEditModal,
    openDeleteConfirm,
    closeDeleteConfirm,
    refetch: fetchRecipe,
  };
} 