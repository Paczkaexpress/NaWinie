import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import RecipeDetailPage from '../components/RecipeDetailPage';
import { ToastProvider } from '../components/ToastProvider';
import { server } from './setup';
import { http, HttpResponse } from 'msw';

// Mock the useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 'user-123' },
    token: 'mock-jwt-token'
  })
}));

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000/recipes/550e8400-e29b-41d4-a716-446655440000'
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
});

describe('RecipeDetailPage', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  const mockRecipe = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Spaghetti Carbonara',
    preparation_time_minutes: 20,
    complexity_level: 'medium' as const,
    author_id: 'author-123',
    average_rating: 4.5,
    total_votes: 120,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    steps: [
      { step: 1, description: 'Ugotuj makaron al dente' },
      { step: 2, description: 'Przygotuj sos carbonara' },
      { step: 3, description: 'Wymieszaj makaron z sosem' }
    ],
    ingredients: [
      {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        ingredient_id: 'ingredient-1',
        amount: 400,
        is_optional: false,
        substitute_recommendation: null,
        name: 'Spaghetti',
        unit_type: 'g'
      },
      {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        ingredient_id: 'ingredient-2',
        amount: 4,
        is_optional: false,
        substitute_recommendation: null,
        name: 'Jajka',
        unit_type: 'szt'
      },
      {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        ingredient_id: 'ingredient-3',
        amount: 100,
        is_optional: true,
        substitute_recommendation: 'Boczek pancetta',
        name: 'Guanciale',
        unit_type: 'g'
      }
    ]
  };

  const renderComponent = (recipeId: string = '550e8400-e29b-41d4-a716-446655440000') => {
    return render(
      <ToastProvider>
        <RecipeDetailPage recipeId={recipeId} />
      </ToastProvider>
    );
  };

  it('should render loading state initially', () => {
    server.use(
      http.get('*/api/recipes/:id', () => {
        return new Promise(() => {}); // Never resolve to keep loading
      })
    );

    renderComponent();

    expect(screen.getByTestId('recipe-detail-skeleton')).toBeInTheDocument();
  });

  it('should render recipe details after loading', async () => {
    server.use(
      http.get('*/api/recipes/:id', () => {
        return HttpResponse.json(mockRecipe);
      })
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument();
    });

    expect(screen.getByText('20 min')).toBeInTheDocument();
    expect(screen.getByText('Średni')).toBeInTheDocument();
    expect(screen.getByText('4.5 (120 ocen)')).toBeInTheDocument();
  });

  it('should render ingredients list', async () => {
    server.use(
      http.get('*/api/recipes/:id', () => {
        return HttpResponse.json(mockRecipe);
      })
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Składniki (3)')).toBeInTheDocument();
    });

    expect(screen.getByText('400 g Spaghetti')).toBeInTheDocument();
    expect(screen.getByText('4 szt Jajka')).toBeInTheDocument();
    expect(screen.getByText(/100 g Guanciale/)).toBeInTheDocument();
    expect(screen.getByText(/Boczek pancetta/)).toBeInTheDocument();
  });

  it('should render preparation steps', async () => {
    server.use(
      http.get('*/api/recipes/:id', () => {
        return HttpResponse.json(mockRecipe);
      })
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Sposób przygotowania (3 kroków)')).toBeInTheDocument();
    });

    expect(screen.getByText('Ugotuj makaron al dente')).toBeInTheDocument();
    expect(screen.getByText('Przygotuj sos carbonara')).toBeInTheDocument();
    expect(screen.getByText('Wymieszaj makaron z sosem')).toBeInTheDocument();
  });

  it('should handle rating submission', async () => {
    server.use(
      http.get('*/api/recipes/:id', () => {
        return HttpResponse.json(mockRecipe);
      }),
      http.post('*/api/recipes/:id/rate', () => {
        return HttpResponse.json({
          user_id: 'user-123',
          recipe_id: '550e8400-e29b-41d4-a716-446655440000',
          rating: 5,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        });
      })
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Oceń przepis')).toBeInTheDocument();
    });

    const stars = screen.getAllByRole('button', { name: /oceń/i });
    expect(stars).toHaveLength(5);

    fireEvent.click(stars[4]); // Click 5th star

    await waitFor(() => {
      expect(screen.getByText('Dziękujemy za ocenę przepisu!')).toBeInTheDocument();
    });
  });

  it('should handle copy link functionality', async () => {
    server.use(
      http.get('*/api/recipes/:id', () => {
        return HttpResponse.json(mockRecipe);
      })
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Skopiuj link')).toBeInTheDocument();
    });

    const shareButton = screen.getByRole('button', { name: /skopiuj link/i });
    fireEvent.click(shareButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'http://localhost:3000/recipes/550e8400-e29b-41d4-a716-446655440000'
    );

    await waitFor(() => {
      expect(screen.getByText('Link do przepisu został skopiowany!')).toBeInTheDocument();
    });
  });

  it('should handle 404 error', async () => {
    server.use(
      http.get('*/api/recipes/:id', () => {
        return new HttpResponse(
          JSON.stringify({ detail: 'Recipe not found' }),
          { status: 404 }
        );
      })
    );

    renderComponent('non-existent-id');

    await waitFor(() => {
      expect(screen.getByText('Wystąpił problem')).toBeInTheDocument();
    });

    expect(screen.getByText('Przepis nie został znaleziony')).toBeInTheDocument();
    expect(screen.getByText('Spróbuj ponownie')).toBeInTheDocument();
    expect(screen.getByText('Strona główna')).toBeInTheDocument();
  });

  it('should handle retry functionality', async () => {
    let callCount = 0;
    server.use(
      http.get('*/api/recipes/:id', () => {
        callCount++;
        if (callCount === 1) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json(mockRecipe);
      })
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Wystąpił problem')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Spróbuj ponownie');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument();
    });

    expect(callCount).toBe(2);
  });

  it('should handle back button', async () => {
    const mockBack = vi.fn();
    const mockPushState = vi.fn();
    Object.defineProperty(window, 'history', {
      value: {
        back: mockBack,
        pushState: mockPushState,
        length: 2
      }
    });

    server.use(
      http.get('*/api/recipes/:id', () => {
        return HttpResponse.json(mockRecipe);
      })
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /wróć do poprzedniej strony/i })).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /wróć do poprzedniej strony/i });
    fireEvent.click(backButton);

    expect(mockBack).toHaveBeenCalled();
  });
}); 