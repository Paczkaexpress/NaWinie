import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecipeManagement } from '../hooks/useRecipeManagement';
import type { RecipeDetailDto, UserDto } from '../types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock useAuth hook
const mockUser: UserDto = {
  id: 'user-1',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    error: null
  })
}));

// Mock authService
vi.mock('../lib/auth', () => ({
  authService: {
    getSession: vi.fn().mockResolvedValue({
      access_token: 'mock-token',
      user: mockUser
    })
  }
}));

// Mock window.location
const mockLocation = {
  href: ''
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

const mockRecipe: RecipeDetailDto = {
  id: 'recipe-1',
  name: 'Test Recipe',
  description: 'Test Description',
  preparation_time_minutes: 30,
  complexity_level: 'medium',
  author_id: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  steps: [
    { step: 1, description: 'Step 1' },
    { step: 2, description: 'Step 2' }
  ],
  ingredients: [
    { 
      ingredient_id: 'ing-1', 
      amount: 100, 
      is_optional: false,
      substitute_recommendation: null,
      name: 'Ingredient 1',
      unit_type: 'grams'
    }
  ],
  image_data: 'base64-image-data',
  average_rating: 4.5,
  total_votes: 10
};

describe('useRecipeManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockRecipe)
    });
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
    renderHook(() => useRecipeManagement('recipe-1', mockUser));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/recipes/recipe-1');
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
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValue({ message: 'Not found' })
    });

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
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({ message: 'Unauthorized' })
    });

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    await waitFor(() => {
      expect(result.current.error).toBe('Brak uprawnień do wyświetlenia tego przepisu');
    });
  });

  it('should handle generic fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ message: 'Server error' })
    });

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    await waitFor(() => {
      expect(result.current.error).toBe('Błąd podczas pobierania przepisu');
    });
  });

  it('should handle network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
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
      author_id: 'other-user-id'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(notOwnedRecipe)
    });

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

    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    act(() => {
      result.current.openEditModal();
    });

    expect(result.current.isEditModalOpen).toBe(true);

    act(() => {
      result.current.closeEditModal();
    });

    expect(result.current.isEditModalOpen).toBe(false);
  });

  it('should open and close delete confirmation', async () => {
    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    act(() => {
      result.current.openDeleteConfirm();
    });

    expect(result.current.deleteConfirmOpen).toBe(true);

    act(() => {
      result.current.closeDeleteConfirm();
    });

    expect(result.current.deleteConfirmOpen).toBe(false);
  });

  it('should update recipe successfully', async () => {
    const updatedRecipe = {
      ...mockRecipe,
      name: 'Updated Recipe Name'
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockRecipe)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(updatedRecipe)
      });

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    await act(async () => {
      await result.current.updateRecipe(updatedRecipe);
    });

    expect(mockFetch).toHaveBeenLastCalledWith('/api/recipes/recipe-1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token'
      },
      body: JSON.stringify(updatedRecipe)
    });

    expect(result.current.recipe).toEqual(updatedRecipe);
    expect(result.current.isEditModalOpen).toBe(false);
  });

  it('should handle update recipe 401 error', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockRecipe)
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ message: 'Unauthorized' })
      });

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    await expect(async () => {
      await act(async () => {
        await result.current.updateRecipe(mockRecipe);
      });
    }).rejects.toThrow('Brak uprawnień do edycji tego przepisu');
  });

  it('should handle update recipe 403 error', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockRecipe)
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: vi.fn().mockResolvedValue({ message: 'Forbidden' })
      });

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    await expect(async () => {
      await act(async () => {
        await result.current.updateRecipe(mockRecipe);
      });
    }).rejects.toThrow('Nie masz uprawnień do edycji tego przepisu');
  });

  it('should handle update recipe 400 error with detail', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockRecipe)
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({ detail: 'Nazwa przepisu jest wymagana' })
      });

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    await expect(async () => {
      await act(async () => {
        await result.current.updateRecipe(mockRecipe);
      });
    }).rejects.toThrow('Nazwa przepisu jest wymagana');
  });

  it('should delete recipe successfully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockRecipe)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ message: 'Recipe deleted' })
      });

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    await act(async () => {
      await result.current.deleteRecipe();
    });

    expect(mockFetch).toHaveBeenLastCalledWith('/api/recipes/recipe-1', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer mock-token'
      }
    });

    expect(mockLocation.href).toBe('/recipes');
  });

  it('should handle delete loading state', async () => {
    let resolveDelete: (value: any) => void;
    const deletePromise = new Promise(resolve => {
      resolveDelete = resolve;
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockRecipe)
      })
      .mockReturnValueOnce(deletePromise);

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    // Start delete operation
    act(() => {
      result.current.deleteRecipe();
    });

    expect(result.current.isDeleting).toBe(true);

    // Resolve the delete
    resolveDelete!({
      ok: true,
      json: vi.fn().mockResolvedValue({ message: 'Deleted' })
    });

    await waitFor(() => {
      expect(mockLocation.href).toBe('/recipes');
    });
  });

  it('should handle delete recipe error', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockRecipe)
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: vi.fn().mockResolvedValue({ message: 'Forbidden' })
      });

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    await expect(async () => {
      await act(async () => {
        await result.current.deleteRecipe();
      });
    }).rejects.toThrow('Nie masz uprawnień do usunięcia tego przepisu');

    expect(result.current.isDeleting).toBe(false);
    expect(result.current.deleteConfirmOpen).toBe(false);
  });

  it('should refetch recipe data', async () => {
    const refetchedRecipe = {
      ...mockRecipe,
      average_rating: 4.8,
      total_votes: 15
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockRecipe)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(refetchedRecipe)
      });

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.recipe).toEqual(refetchedRecipe);
  });

  it('should handle refetch error', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockRecipe)
      })
      .mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => 
      useRecipeManagement('recipe-1', mockUser)
    );

    await waitFor(() => {
      expect(result.current.recipe).toEqual(mockRecipe);
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBe('Network error');
  });
}); 
}); 