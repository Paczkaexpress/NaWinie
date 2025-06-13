import { expect, afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);

const API_BASE_URL = "http://localhost:8000/api";

// Mock API handlers
const handlers = [
  http.get(`${API_BASE_URL}/ingredients`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? "";
    const page = Number(url.searchParams.get("page") ?? 1);
    return HttpResponse.json({
      data: [{ id: "id-1", name: `Mock ${search}`, unit_type: "unit" }],
      pagination: { page, limit: 10, total_items: 1, total_pages: 1 },
    });
  }),
  http.get(`${API_BASE_URL}/recipes/find-by-ingredients`, () => {
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
  http.get(`${API_BASE_URL}/recipes`, () => {
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
];

export const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close()); 