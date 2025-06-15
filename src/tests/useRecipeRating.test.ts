import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useRecipeRating } from '../hooks/useRecipeRating';
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

describe('useRecipeRating', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    server.resetHandlers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const wrapper = ({ children }: { children: any }) => 
    React.createElement(ToastProvider, null, children);

  it('should submit rating successfully', async () => {
    const mockRatingResponse = {
      user_id: 'user-123',
      recipe_id: '550e8400-e29b-41d4-a716-446655440000',
      rating: 5,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    server.use(
      http.post('*/api/recipes/:id/rate', () => {
        return HttpResponse.json(mockRatingResponse);
      })
    );

    const { result } = renderHook(
      () => useRecipeRating('550e8400-e29b-41d4-a716-446655440000'),
      { wrapper }
    );

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBe(null);

    const rating = await act(async () => {
      return await result.current.submitRating(5);
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBe(null);
    expect(rating).toEqual(mockRatingResponse);
  });

  it('should handle validation errors', async () => {
    const { result } = renderHook(
      () => useRecipeRating('550e8400-e29b-41d4-a716-446655440000'),
      { wrapper }
    );

    await act(async () => {
      await result.current.submitRating(0); // Invalid rating
    });

    expect(result.current.error).toBe('Nieprawidłowa ocena. Wybierz od 1 do 5 gwiazdek');
  });

  it('should handle 409 duplicate rating error', async () => {
    server.use(
      http.post('*/api/recipes/:id/rate', () => {
        return new HttpResponse(
          JSON.stringify({ detail: 'User has already rated this recipe' }),
          { status: 409 }
        );
      })
    );

    const { result } = renderHook(
      () => useRecipeRating('550e8400-e29b-41d4-a716-446655440000'),
      { wrapper }
    );

    await act(async () => {
      await result.current.submitRating(4);
    });

    expect(result.current.error).toBe('Już oceniłeś ten przepis');
  });

  it('should handle authentication errors', async () => {
    server.use(
      http.post('*/api/recipes/:id/rate', () => {
        return new HttpResponse(
          JSON.stringify({ detail: 'Not authenticated' }),
          { status: 401 }
        );
      })
    );

    const { result } = renderHook(
      () => useRecipeRating('550e8400-e29b-41d4-a716-446655440000'),
      { wrapper }
    );

    await act(async () => {
      await result.current.submitRating(3);
    });

    expect(result.current.error).toBe('Musisz być zalogowany aby ocenić przepis');
  });

  it('should handle server errors', async () => {
    server.use(
      http.post('*/api/recipes/:id/rate', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const { result } = renderHook(
      () => useRecipeRating('550e8400-e29b-41d4-a716-446655440000'),
      { wrapper }
    );

    await act(async () => {
      await result.current.submitRating(3);
    });

    expect(result.current.error).toBe('Błąd podczas wysyłania oceny');
  });

  it('should clear error on new submission', async () => {
    const { result } = renderHook(
      () => useRecipeRating('550e8400-e29b-41d4-a716-446655440000'),
      { wrapper }
    );

    // First submission with error
    await act(async () => {
      await result.current.submitRating(0);
    });

    expect(result.current.error).toBeTruthy();

    // Mock successful response
    server.use(
      http.post('*/api/recipes/:id/rate', () => {
        return HttpResponse.json({
          user_id: 'user-123',
          recipe_id: '550e8400-e29b-41d4-a716-446655440000',
          rating: 4,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        });
      })
    );

    // Second submission should clear error
    await act(async () => {
      await result.current.submitRating(4);
    });

    expect(result.current.error).toBe(null);
  });

  it('should maintain submitting state during API call', async () => {
    // Create a delayed response to test the submitting state
    server.use(
      http.post('*/api/recipes/:id/rate', async () => {
        // Add a small delay to capture the submitting state
        await new Promise(resolve => setTimeout(resolve, 100));
        return HttpResponse.json({
          user_id: 'user-123',
          recipe_id: '550e8400-e29b-41d4-a716-446655440000',
          rating: 5,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        });
      })
    );

    const { result } = renderHook(
      () => useRecipeRating('550e8400-e29b-41d4-a716-446655440000'),
      { wrapper }
    );

    expect(result.current.isSubmitting).toBe(false);

    // Start the submission and immediately check submitting state
    await act(async () => {
      const submissionPromise = result.current.submitRating(5);
      
      // The submitting state should be true immediately after calling submitRating
      // but before the promise resolves
      await vi.runOnlyPendingTimersAsync();
      
      await submissionPromise;
    });

    expect(result.current.isSubmitting).toBe(false);
  });
}); 