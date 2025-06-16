import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import { ToastProvider } from "../components/ToastProvider";
import useDefaultRecipes from "../hooks/useDefaultRecipes";

// MSW setup already mocks endpoint returning one page; we will override for this test
import { server } from "./setup";
import { http, HttpResponse } from "msw";

describe("useDefaultRecipes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset any runtime handlers to use the default handlers
    server.resetHandlers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches default recipes on mount and loadMore continues pagination", async () => {
    const mockResponsePage1 = {
      data: [
        { 
          id: "r1", 
          name: "Recipe 1", 
          average_rating: 4.5, 
          preparation_time_minutes: 10, 
          complexity_level: "EASY", 
          created_at: "", 
          updated_at: "",
          author_id: "u1",
          total_votes: 10
        }
      ],
      pagination: { page: 1, limit: 12, total_items: 2, total_pages: 2 },
    };

    const mockResponsePage2 = {
      data: [
        { 
          id: "r2", 
          name: "Recipe 2", 
          average_rating: 5, 
          preparation_time_minutes: 20, 
          complexity_level: "MEDIUM", 
          created_at: "", 
          updated_at: "",
          author_id: "u2",
          total_votes: 15
        }
      ],
      pagination: { page: 2, limit: 12, total_items: 2, total_pages: 2 },
    };

    // Set up test-specific handlers after resetHandlers() is called
    server.use(
      http.get("http://mock-api.test/api/recipes", ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page"));
        return HttpResponse.json(page === 1 ? mockResponsePage1 : mockResponsePage2);
      })
    );

    const wrapper = ({ children }: { children: any }) => React.createElement(ToastProvider, null, children);

    const { result } = renderHook(() => useDefaultRecipes(), { wrapper });

    // Initially should have no recipes and be loading
    expect(result.current.recipes.length).toBe(0);
    expect(result.current.isLoading).toBe(true);

    // Wait for initial load to complete
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.recipes.length).toBe(1);
    expect(result.current.recipes[0].name).toBe("Recipe 1");
    expect(result.current.hasMore).toBe(true);
    expect(result.current.isLoading).toBe(false);

    // Load more recipes
    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.recipes.length).toBe(2);
    expect(result.current.recipes[1].name).toBe("Recipe 2");
    expect(result.current.hasMore).toBe(false);
  });
}); 