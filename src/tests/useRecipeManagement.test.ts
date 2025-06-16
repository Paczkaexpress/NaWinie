import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecipeManagement } from '../hooks/useRecipeManagement';
import type { RecipeDetailDto, UserDto } from '../types';
import { server } from './setup';
import { http, HttpResponse } from 'msw';

// Mock useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    isLoading: false,
    error: null
  })
}));

// Mock authService
vi.mock('../lib/auth', () => ({
  authService: {
    getSession: vi.fn().mockResolvedValue({
      access_token: 'mock-token',
      user: {
        id: 'user-1',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    })
  }
}));

describe('useRecipeManagement', () => {
  const mockUser: UserDto = {
    id: 'user-1',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockRecipe: RecipeDetailDto = {
    id: 'recipe-1',
    name: 'Test Recipe',
    description: 'Test Description',
    author_id: 'user-1',
    preparation_time_minutes: 30,
    complexity_level: 'medium',
    image_data: 'base64-image-data',
    average_rating: 4.5,
    total_votes: 10,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ingredients: [
      {
        ingredient_id: 'ing-1',
        name: 'Ingredient 1',
        amount: 100,
        unit_type: 'grams',
        is_optional: false,
        substitute_recommendation: null
      }
    ],
    steps: [
      { step: 1, description: 'Step 1' },
      { step: 2, description: 'Step 2' }
    ]
  };

  beforeEach(() => {
    server.resetHandlers();
    
    // Default handlers for all tests
    server.use(
      http.get('*/api/recipes/recipe-1', () => {
        return HttpResponse.json(mockRecipe);
      })
    );
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    expect(result.current.recipe).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.isEditModalOpen).toBe(false);
    expect(result.current.isDeleting).toBe(false);
    expect(result.current.deleteConfirmOpen).toBe(false);
  });

  it('should fetch recipe on mount', async () => {
    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should set recipe data after successful fetch', async () => {
    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle 404 error correctly', async () => {
    server.use(
      http.get('*/api/recipes/recipe-1', () => {
        return new HttpResponse(null, { status: 404 });
      })
    );

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    await waitFor(() => {
      expect(result.current.recipe).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Przepis nie został znaleziony');
    });
  });

  it('should handle 401 error correctly', async () => {
    server.use(
      http.get('*/api/recipes/recipe-1', () => {
        return new HttpResponse(null, { status: 401 });
      })
    );

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    await waitFor(() => {
      expect(result.current.error).toBe('Brak uprawnień do wyświetlenia tego przepisu');
    });
  });

  it('should handle generic fetch error', async () => {
    server.use(
      http.get('*/api/recipes/recipe-1', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    await waitFor(() => {
      expect(result.current.error).toBe('Błąd podczas pobierania przepisu');
    });
  });

  it('should handle network error', async () => {
    server.use(
      http.get('*/api/recipes/recipe-1', () => {
        return HttpResponse.error();
      })
    );

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    await waitFor(() => {
      expect(result.current.error).toMatch(/Failed to fetch|Network request failed|TypeError/);
    });
  });

  it('should determine if user is author correctly', async () => {
    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    await waitFor(() => {
      expect(result.current.isAuthor).toBe(true);
    });
  });

  it('should determine if user is not author correctly', async () => {
    const notOwnedRecipe = {
      ...mockRecipe,
      author_id: 'other-user'
    };

    server.use(
      http.get('*/api/recipes/recipe-1', () => {
        return HttpResponse.json(notOwnedRecipe);
      })
    );

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    await waitFor(() => {
      expect(result.current.isAuthor).toBe(false);
    });
  });

  it('should open and close edit modal', async () => {
    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    // Test opening modal
    act(() => {
      result.current.openEditModal();
    });

    expect(result.current.isEditModalOpen).toBe(true);

    // Test closing modal
    act(() => {
      result.current.closeEditModal();
    });

    expect(result.current.isEditModalOpen).toBe(false);
  });

  it('should open and close delete confirmation', async () => {
    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    // Test opening delete confirmation
    act(() => {
      result.current.openDeleteConfirm();
    });

    expect(result.current.deleteConfirmOpen).toBe(true);

    // Test closing delete confirmation
    act(() => {
      result.current.closeDeleteConfirm();
    });

    expect(result.current.deleteConfirmOpen).toBe(false);
  });

  it('should update recipe successfully', async () => {
    const updatedRecipe = { ...mockRecipe, name: 'Updated Recipe' };
    
    server.use(
      http.put('*/api/recipes/recipe-1', () => {
        return HttpResponse.json(updatedRecipe);
      })
    );

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    const updateData = {
      name: 'Updated Recipe',
      preparation_time_minutes: 30,
      complexity_level: 'medium' as const,
      steps: [{ step: 1, description: 'Updated Step' }],
      ingredients: []
    };

    // Test update
    await act(async () => {
      await result.current.updateRecipe(updateData);
    });

    expect(result.current.recipe).toEqual(updatedRecipe);
    expect(result.current.isEditModalOpen).toBe(false);
  });

  it('should handle update recipe 401 error', async () => {
    // Set up error handler from the start
    server.resetHandlers();
    server.use(
      http.get('*/api/recipes/recipe-1', () => {
        return HttpResponse.json(mockRecipe);
      }),
      http.put('*/api/recipes/recipe-1', () => {
        return new HttpResponse(null, { status: 401 });
      })
    );

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    const updateData = {
      name: 'Updated Recipe'
    };

    // Test update error
    await expect(act(async () => {
      await result.current.updateRecipe(updateData);
    })).rejects.toThrow('Brak uprawnień do edycji tego przepisu');

    // Wait for error state to be set
    await waitFor(() => {
      expect(result.current.error).toBe('Brak uprawnień do edycji tego przepisu');
    });
  });

  it('should handle update recipe 403 error', async () => {
    // Set up error handler from the start
    server.resetHandlers();
    server.use(
      http.get('*/api/recipes/recipe-1', () => {
        return HttpResponse.json(mockRecipe);
      }),
      http.put('*/api/recipes/recipe-1', () => {
        return new HttpResponse(null, { status: 403 });
      })
    );

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    const updateData = {
      name: 'Updated Recipe'
    };

    // Test update error
    await expect(act(async () => {
      await result.current.updateRecipe(updateData);
    })).rejects.toThrow('Nie masz uprawnień do edycji tego przepisu');

    // Wait for error state to be set
    await waitFor(() => {
      expect(result.current.error).toBe('Nie masz uprawnień do edycji tego przepisu');
    });
  });

  it('should handle update recipe 400 error with detail', async () => {
    // Set up error handler from the start
    server.resetHandlers();
    server.use(
      http.get('*/api/recipes/recipe-1', () => {
        return HttpResponse.json(mockRecipe);
      }),
      http.put('*/api/recipes/recipe-1', () => {
        return HttpResponse.json({ detail: 'Invalid data provided' }, { status: 400 });
      })
    );

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    const updateData = {
      name: 'Updated Recipe'
    };

    // Test update error
    await expect(act(async () => {
      await result.current.updateRecipe(updateData);
    })).rejects.toThrow('Invalid data provided');

    // Wait for error state to be set
    await waitFor(() => {
      expect(result.current.error).toBe('Invalid data provided');
    });
  });

  it('should delete recipe successfully', async () => {
    // Mock window.location.href for navigation
    const mockLocationSetter = vi.fn();
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        set href(value: string) {
          mockLocationSetter(value);
        }
      },
      writable: true
    });

    // Set up handlers from the start
    server.resetHandlers();
    server.use(
      http.get('*/api/recipes/recipe-1', () => {
        return HttpResponse.json(mockRecipe);
      }),
      http.delete('*/api/recipes/recipe-1', () => {
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    // Test delete
    await act(async () => {
      await result.current.deleteRecipe();
    });

    expect(mockLocationSetter).toHaveBeenCalledWith('/recipes');
  });

  it('should handle delete loading state', async () => {
    let resolvePromise: (value: any) => void;
    const deletePromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    // Set up handlers from the start
    server.resetHandlers();
    server.use(
      http.get('*/api/recipes/recipe-1', () => {
        return HttpResponse.json(mockRecipe);
      }),
      http.delete('*/api/recipes/recipe-1', async () => {
        await deletePromise;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    // Start delete operation
    act(() => {
      result.current.deleteRecipe();
    });

    // Check loading state
    expect(result.current.isDeleting).toBe(true);

    // Resolve the delete promise
    resolvePromise!(null);

    // Wait for completion
    await waitFor(() => {
      expect(result.current.isDeleting).toBe(false);
    });
  });

  it('should handle delete recipe error', async () => {
    // Set up error handler from the start
    server.resetHandlers();
    server.use(
      http.get('*/api/recipes/recipe-1', () => {
        return HttpResponse.json(mockRecipe);
      }),
      http.delete('*/api/recipes/recipe-1', () => {
        return new HttpResponse(null, { status: 403 });
      })
    );

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    // Test delete error
    await expect(act(async () => {
      await result.current.deleteRecipe();
    })).rejects.toThrow('Nie masz uprawnień do usunięcia tego przepisu');

    // Wait for error state to be set
    await waitFor(() => {
      expect(result.current.error).toBe('Nie masz uprawnień do usunięcia tego przepisu');
      expect(result.current.isDeleting).toBe(false);
      expect(result.current.deleteConfirmOpen).toBe(false);
    });
  });

  it('should refetch recipe data', async () => {
    const updatedRecipe = { ...mockRecipe, name: 'Refetched Recipe' };
    
    // Set up handlers from the start
    server.resetHandlers();
    let callCount = 0;
    server.use(
      http.get('*/api/recipes/recipe-1', () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json(mockRecipe);
        } else {
          return HttpResponse.json(updatedRecipe);
        }
      })
    );

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    // Test refetch
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.recipe).toEqual(updatedRecipe);
  });

  it('should handle refetch error', async () => {
    // Set up error handler from the start
    server.resetHandlers();
    let callCount = 0;
    server.use(
      http.get('*/api/recipes/recipe-1', () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json(mockRecipe);
        } else {
          return new HttpResponse(null, { status: 500 });
        }
      })
    );

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    // Test refetch error
    await act(async () => {
      await result.current.refetch();
    });

    // Wait for error state to be set
    await waitFor(() => {
      expect(result.current.error).toBe('Błąd podczas pobierania przepisu');
    });
  });
}); 