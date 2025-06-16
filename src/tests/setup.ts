import { expect, afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);

// Mock Supabase environment variables for testing
import.meta.env.PUBLIC_SUPABASE_URL = "https://mock-supabase-url.supabase.co";
import.meta.env.PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key-for-testing";

// Set NODE_ENV to test mode
if (typeof process !== 'undefined') {
  process.env.NODE_ENV = 'test';
}

const API_BASE_URL = "http://localhost:8000/api";

// Mock API handlers  
const handlers = [
  http.get('*/api/ingredients', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? "";
    const page = Number(url.searchParams.get("page") ?? 1);
    return HttpResponse.json({
      data: [{ id: "id-1", name: `Mock ${search}`, unit_type: "unit" }],
      pagination: { page, limit: 10, total_items: 1, total_pages: 1 },
    });
  }),
  http.get('*/api/recipes/find-by-ingredients', () => {
    return HttpResponse.json({
      data: [
        {
          id: "recipe-1",
          name: "Mock recipe",
          average_rating: 4.2,
          preparation_time_minutes: 30,
          complexity_level: "easy",
          created_at: "",
          updated_at: "",
        },
      ],
      pagination: { page: 1, limit: 10, total_items: 1, total_pages: 1 },
    });
  }),
  http.get('*/api/recipes', () => {
    return HttpResponse.json({
      data: [
        {
          id: "default-recipe-1",
          name: "Default Mock Recipe",
          average_rating: 4.8,
          preparation_time_minutes: 25,
          complexity_level: "medium",
          created_at: "",
          updated_at: "",
          author_id: "author-1",
          total_votes: 20,
        },
      ],
      pagination: { page: 1, limit: 12, total_items: 1, total_pages: 1 },
    });
  }),
  http.get('*/api/recipes/:id', () => {
    return HttpResponse.json({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Spaghetti Carbonara',
      preparation_time_minutes: 20,
      complexity_level: 'medium',
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
    });
  }),
  http.post('*/api/recipes/:id/rate', () => {
    return HttpResponse.json({
      user_id: 'user-123',
      recipe_id: '550e8400-e29b-41d4-a716-446655440000',
      rating: 5,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    });
  }),
];

export const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close()); 