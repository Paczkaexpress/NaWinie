import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useRecipeDetail } from '../hooks/useRecipeDetail';
import { ToastProvider } from '../components/ToastProvider';
import { server } from './setup';
import { http, HttpResponse } from 'msw';

describe('useRecipeDetail', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    server.resetHandlers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const wrapper = ({ children }: { children: any }) => 
    React.createElement(ToastProvider, null, children);

  it('should fetch recipe details successfully', async () => {
    const mockRecipe = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Recipe',
      preparation_time_minutes: 30,
      complexity_level: 'EASY' as const,
      author_id: 'author-123',
      average_rating: 4.5,
      total_votes: 10,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      steps: [
        { step: 1, description: 'Step 1' },
        { step: 2, description: 'Step 2' }
      ],
      ingredients: [
        {
          recipe_id: '550e8400-e29b-41d4-a716-446655440000',
          ingredient_id: 'ingredient-1',
          amount: 100,
          is_optional: false,
          substitute_recommendation: null,
          name: 'Flour',
          unit_type: 'g'
        }
      ]
    };

    server.use(
      http.get('*/api/recipes/:id', () => {
        return HttpResponse.json(mockRecipe);
      })
    );

    const { result } = renderHook(
      () => useRecipeDetail('550e8400-e29b-41d4-a716-446655440000'),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.recipe).toBe(null);
    expect(result.current.error).toBe(null);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.recipe).toEqual(mockRecipe);
    expect(result.current.error).toBe(null);
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

    const { result } = renderHook(
      () => useRecipeDetail('non-existent-id'),
      { wrapper }
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.recipe).toBe(null);
    expect(result.current.error).toBe('Przepis nie został znaleziony');
  });

  it('should handle 422 validation error', async () => {
    server.use(
      http.get('*/api/recipes/:id', () => {
        return new HttpResponse(
          JSON.stringify({ 
            detail: [{ 
              loc: ['path', 'id'], 
              msg: 'value is not a valid uuid', 
              type: 'type_error.uuid' 
            }] 
          }),
          { status: 422 }
        );
      })
    );

    const { result } = renderHook(
      () => useRecipeDetail('invalid-uuid'),
      { wrapper }
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.recipe).toBe(null);
    expect(result.current.error).toBe('Nieprawidłowy identyfikator przepisu');
  });

  it('should retry fetching on retry call', async () => {
    let callCount = 0;
    server.use(
      http.get('*/api/recipes/:id', () => {
        callCount++;
        if (callCount === 1) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json({ 
          id: 'test', 
          name: 'Test Recipe',
          steps: [],
          ingredients: []
        });
      })
    );

    const { result } = renderHook(
      () => useRecipeDetail('test-id'),
      { wrapper }
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.error).toBeTruthy();

    await act(async () => {
      result.current.retry();
      await vi.runAllTimersAsync();
    });

    expect(result.current.error).toBe(null);
    expect(result.current.recipe).toBeTruthy();
    expect(callCount).toBe(2);
  });

  it('should not fetch when recipeId is undefined', () => {
    const { result } = renderHook(
      () => useRecipeDetail(undefined),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.recipe).toBe(null);
    expect(result.current.error).toBe(null);
  });
}); 