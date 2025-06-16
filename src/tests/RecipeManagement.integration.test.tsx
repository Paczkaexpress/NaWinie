import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OptimizedRecipeManagementView from '../components/OptimizedRecipeManagementView';
import type { RecipeDetailDto, UserDto } from '../types';
import { server } from './setup';
import { http, HttpResponse } from 'msw';
import { db } from '../mocks/db';
import { User, Recipe, Rating, StoredFile } from '../types';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8000/api';

const mockUser: UserDto = {
  id: 'user-1',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

// Mock dependencies
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

// Mock window methods
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

Object.defineProperty(window, 'history', {
  value: { back: vi.fn() },
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
    { step: 1, description: 'First step' },
    { step: 2, description: 'Second step' }
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

const mockNonOwnedRecipe: RecipeDetailDto = {
  ...mockRecipe,
  id: 'recipe-2',
  author_id: 'other-user',
  name: 'Other User Recipe'
};

describe('Recipe Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
    server.resetHandlers(); // Reset handlers to default
  });

  describe('Recipe Loading and Display', () => {
    it('should load and display recipe for author', async () => {
      server.use(
        http.get(`${API_BASE_URL}/recipes/recipe-1`, () => {
          return HttpResponse.json(mockRecipe);
        })
      );
      
      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Recipe')).toBeInTheDocument();
      });

      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('First step')).toBeInTheDocument();
      expect(screen.getByText('Second step')).toBeInTheDocument();
      expect(screen.getByText('Ingredient 1')).toBeInTheDocument();
      
      // Author should see edit and delete buttons
      expect(screen.getByText('Edytuj')).toBeInTheDocument();
      expect(screen.getByText('Usuń')).toBeInTheDocument();
    });

    it('should load and display recipe for non-author with rating section', async () => {
      server.use(
        http.get(`${API_BASE_URL}/recipes/recipe-2`, () => {
          return HttpResponse.json(mockNonOwnedRecipe);
        })
      );

      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-2"
          currentUser={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Other User Recipe')).toBeInTheDocument();
      });

      // Non-author should not see edit/delete buttons
      expect(screen.queryByText('Edytuj')).not.toBeInTheDocument();
      expect(screen.queryByText('Usuń')).not.toBeInTheDocument();
      
      // Should see rating section
      expect(screen.getByText('Oceń przepis')).toBeInTheDocument();
    });

    it('should show loading skeletons initially', () => {
      server.use(
        http.get(`${API_BASE_URL}/recipes/recipe-1`, async () => {
          await new Promise(resolve => setTimeout(resolve, 10000)); // Simulate delay
          return HttpResponse.json(mockRecipe);
        })
      );

      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      // Should show skeleton loading elements
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should handle recipe not found error', async () => {
      server.use(
        http.get(`${API_BASE_URL}/recipes/nonexistent`, () => {
          return new HttpResponse(JSON.stringify({ message: 'Recipe not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(
        <OptimizedRecipeManagementView
          recipeId="nonexistent"
          currentUser={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Ups! Coś poszło nie tak')).toBeInTheDocument();
      });
    });
  });

  describe('Recipe Editing Flow', () => {
    it('should complete full edit flow successfully', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.get(`${API_BASE_URL}/recipes/recipe-1`, () => {
          return HttpResponse.json(mockRecipe);
        })
      );

      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      // Wait for recipe to load
      await waitFor(() => {
        expect(screen.getByText('Test Recipe')).toBeInTheDocument();
      });

      // Click edit button
      await user.click(screen.getByText('Edytuj'));

      // Edit modal should open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Recipe')).toBeInTheDocument();

      // Edit recipe name
      const nameInput = screen.getByDisplayValue('Test Recipe');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Recipe Name');

      // Mock successful update
      const updatedRecipe = { ...mockRecipe, name: 'Updated Recipe Name' };
      server.use(
        http.put(`${API_BASE_URL}/recipes/recipe-1`, () => {
          return HttpResponse.json(updatedRecipe);
        })
      );

      // Save changes
      await user.click(screen.getByText('Zapisz zmiany'));

      // Should show success toast and close modal
      await waitFor(() => {
        expect(screen.getByText('Przepis zapisany!')).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Recipe should be updated
      expect(screen.getByText('Updated Recipe Name')).toBeInTheDocument();
    });

    it('should handle edit validation errors', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.get(`${API_BASE_URL}/recipes/recipe-1`, () => {
          return HttpResponse.json(mockRecipe);
        })
      );

      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Recipe')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Edytuj'));

      // Edit and clear recipe name to trigger validation
      const nameInput = screen.getByDisplayValue('Test Recipe');
      await user.clear(nameInput);

      // Mock validation error
      server.use(
        http.put(`${API_BASE_URL}/recipes/recipe-1`, () => {
          return new HttpResponse(JSON.stringify({ detail: 'Name cannot be empty' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      // Save changes
      await user.click(screen.getByText('Zapisz zmiany'));

      // Should show validation error
      expect(screen.getByText('Nazwa przepisu jest wymagana')).toBeInTheDocument();
    });

    it('should handle edit server errors', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.get(`${API_BASE_URL}/recipes/recipe-1`, () => {
          return HttpResponse.json(mockRecipe);
        })
      );

      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Recipe')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Edytuj'));

      // Mock server error
      server.use(
        http.put(`${API_BASE_URL}/recipes/recipe-1`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      await user.click(screen.getByText('Zapisz zmiany'));

      // Should show error toast
      await waitFor(() => {
        expect(screen.getByText('Błąd zapisywania przepisu')).toBeInTheDocument();
      });
    });

    it('should allow canceling edit', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.get(`${API_BASE_URL}/recipes/recipe-1`, () => {
          return HttpResponse.json(mockRecipe);
        })
      );

      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Recipe')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Edytuj'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Make some changes
      const nameInput = screen.getByDisplayValue('Test Recipe');
      await user.clear(nameInput);
      await user.type(nameInput, 'Changed Name');

      // Cancel
      await user.click(screen.getByText('Anuluj'));

      // Modal should close and changes should be discarded
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    });
  });

  describe('Recipe Deletion Flow', () => {
    it('should complete full delete flow successfully', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.get(`${API_BASE_URL}/recipes/recipe-1`, () => {
          return HttpResponse.json(mockRecipe);
        })
      );

      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Recipe')).toBeInTheDocument();
      });

      // Click delete button
      await user.click(screen.getByText('Usuń'));

      // Confirmation dialog should appear
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Potwierdź usunięcie')).toBeInTheDocument();

      // Mock successful deletion
      server.use(
        http.delete(`${API_BASE_URL}/recipes/recipe-1`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      // Confirm deletion
      await user.click(screen.getByText('Usuń przepis'));

      // Should redirect to recipes list
      await waitFor(() => {
        expect(mockLocation.href).toBe('/recipes');
      });
    });

    it('should allow canceling deletion', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.get(`${API_BASE_URL}/recipes/recipe-1`, () => {
          return HttpResponse.json(mockRecipe);
        })
      );

      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Recipe')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Usuń'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Cancel deletion
      await user.click(screen.getByText('Anuluj'));

      // Dialog should close
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should handle delete server errors', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.get(`${API_BASE_URL}/recipes/recipe-1`, () => {
          return HttpResponse.json(mockRecipe);
        })
      );

      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Recipe')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Usuń'));

      // Mock server error
      server.use(
        http.delete(`${API_BASE_URL}/recipes/recipe-1`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      await user.click(screen.getByText('Usuń przepis'));

      // Should show error toast
      await waitFor(() => {
        expect(screen.getByText('Brak uprawnień')).toBeInTheDocument();
      });

      // Dialog should remain open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Recipe Rating Flow', () => {
    it('should allow non-author to rate recipe', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.get(`${API_BASE_URL}/recipes/recipe-2`, () => {
          return HttpResponse.json(mockNonOwnedRecipe);
        }),
        http.post(`${API_BASE_URL}/recipes/recipe-2/rate`, async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({ rating: (body as any).rating });
        })
      );

      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-2"
          currentUser={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Other User Recipe')).toBeInTheDocument();
      });

      // Should see rating section
      const ratingSection = screen.getByText('Oceń przepis').closest('div');
      expect(ratingSection).toBeInTheDocument();

      // Click on 4-star rating
      const stars = within(ratingSection!).getAllByRole('button');
      await user.click(stars[3]); // 4th star (0-indexed)

      // Should show success toast
      await waitFor(() => {
        expect(screen.getByText('Ocena dodana!')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard shortcuts', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.get(`${API_BASE_URL}/recipes/recipe-1`, () => {
          return HttpResponse.json(mockRecipe);
        })
      );

      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Recipe')).toBeInTheDocument();
      });

      // Test Ctrl+E for edit (author only)
      await user.keyboard('{Control>}e{/Control}');
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Test Escape to close modal
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should handle keyboard navigation in modals', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.get(`${API_BASE_URL}/recipes/recipe-1`, () => {
          return HttpResponse.json(mockRecipe);
        })
      );

      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Recipe')).toBeInTheDocument();
      });

      // Open delete confirmation
      await user.click(screen.getByText('Usuń'));
      
      // Tab should move focus between buttons
      await user.tab();
      expect(screen.getByText('Anuluj')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Usuń przepis')).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      server.use(
        http.get(`${API_BASE_URL}/recipes/recipe-1`, () => {
          return HttpResponse.json(mockRecipe);
        })
      );

      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Recipe')).toBeInTheDocument();
      });

      // Main content should have proper role
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // Skip to content link
      expect(screen.getByText('Przejdź do głównej treści')).toBeInTheDocument();
      
      // Action buttons should have aria-labels
      const editButton = screen.getByText('Edytuj');
      const deleteButton = screen.getByText('Usuń');
      
      expect(editButton).toHaveAttribute('aria-label');
      expect(deleteButton).toHaveAttribute('aria-label');
    });

    it('should announce loading states to screen readers', async () => {
      server.use(
        http.get(`${API_BASE_URL}/recipes/recipe-1`, async () => {
          await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
          return HttpResponse.json(mockRecipe);
        })
      );

      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      // Should have aria-live regions for dynamic content
      const liveRegions = screen.getAllByRole('status', { hidden: true });
      expect(liveRegions.length).toBeGreaterThan(0);
    });

    it('should provide keyboard shortcuts information', async () => {
      server.use(
        http.get(`${API_BASE_URL}/recipes/recipe-1`, () => {
          return HttpResponse.json(mockRecipe);
        })
      );
      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Recipe')).toBeInTheDocument();
      });

      // Should have screen reader info about shortcuts
      expect(screen.getByText(/Skróty klawiszowe/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      server.use(
        http.get(`${API_BASE_URL}/recipes/recipe-1`, async () => {
          throw new Error('Network error');
        })
      );

      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Ups! Coś poszło nie tak')).toBeInTheDocument();
      });
    });

    it('should show error boundary for component errors', () => {
      // Force a render error by passing invalid props
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(
          <OptimizedRecipeManagementView
            recipeId="recipe-1"
            currentUser={null as any} // Invalid prop
          />
        );
      }).not.toThrow();

      spy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', async () => {
      const renderSpy = vi.fn();
      
      const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        renderSpy();
        return <>{children}</>;
      };

      server.use(
        http.get(`${API_BASE_URL}/recipes/recipe-1`, () => {
          return HttpResponse.json(mockRecipe);
        })
      );

      const { rerender } = render(
        <TestWrapper>
          <OptimizedRecipeManagementView
            recipeId="recipe-1"
            currentUser={mockUser}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Recipe')).toBeInTheDocument();
      });

      const initialRenderCount = renderSpy.mock.calls.length;

      // Re-render with same props
      rerender(
        <TestWrapper>
          <OptimizedRecipeManagementView
            recipeId="recipe-1"
            currentUser={mockUser}
          />
        </TestWrapper>
      );

      // Should not trigger additional renders due to memoization
      expect(renderSpy.mock.calls.length).toBe(initialRenderCount);
    });
  });
}); 