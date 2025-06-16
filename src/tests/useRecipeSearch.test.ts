import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import useRecipeSearch from "../hooks/useRecipeSearch";
import * as React from "react";
import { ToastProvider } from "../components/ToastProvider";

// MSW setup already mocks endpoint returning one page; we will override for this test
import { server } from "./setup";
import { http, HttpResponse } from "msw";

const API_BASE_URL = "http://localhost:8000/api";

describe("useRecipeSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("fetches first page and loadMore continues pagination", async () => {
    const mockResponsePage1 = {
      data: [{ id: "r1", name: "Recipe 1", average_rating: 4, preparation_time_minutes: 10, complexity_level: "easy", created_at: "", updated_at: "" }],
      pagination: { page: 1, limit: 10, total_items: 2, total_pages: 2 },
    };

    const mockResponsePage2 = {
      data: [{ id: "r2", name: "Recipe 2", average_rating: 5, preparation_time_minutes: 20, complexity_level: "easy", created_at: "", updated_at: "" }],
      pagination: { page: 2, limit: 10, total_items: 2, total_pages: 2 },
    };

    server.use(
      http.get(`${API_BASE_URL}/recipes/find-by-ingredients`, ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page")) || 1;
        return HttpResponse.json(page === 1 ? mockResponsePage1 : mockResponsePage2);
      })
    );

    const wrapper = ({ children }: { children: any }) => React.createElement(ToastProvider, null, children);

    const { result } = renderHook(() => useRecipeSearch(["ing1"]), { wrapper });

    // Wait for initial load with explicit timeout
    await waitFor(() => {
      expect(result.current.recipes.length).toBe(1);
    }, { timeout: 3000 });

    expect(result.current.recipes[0].id).toBe("r1");
    expect(result.current.hasMore).toBe(true);

    // Test loadMore
    await act(async () => {
      result.current.loadMore();
    });

    // Wait for second page with timeout
    await waitFor(() => {
      expect(result.current.recipes.length).toBe(2);
    }, { timeout: 3000 });

    expect(result.current.hasMore).toBe(false);
  }, 10000);
}); 