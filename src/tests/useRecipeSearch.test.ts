import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useRecipeSearch from "../hooks/useRecipeSearch";
import * as React from "react";
import { ToastProvider } from "../components/ToastProvider";

vi.useFakeTimers();

// MSW setup already mocks endpoint returning one page; we will override for this test
import { server } from "./setup";
import { http, HttpResponse } from "msw";

const API_BASE_URL = "http://localhost:8000/api";

describe("useRecipeSearch", () => {
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
        const page = Number(url.searchParams.get("page"));
        return HttpResponse.json(page === 1 ? mockResponsePage1 : mockResponsePage2);
      })
    );

    const wrapper = ({ children }: { children: any }) => React.createElement(ToastProvider, null, children);

    const { result } = renderHook(() => useRecipeSearch(["ing1"]), { wrapper });

    // run timers for initial fetch debounce none but we call immediate fetch inside hook loadMore after effect; await next tick
    await act(async () => {
      await vi.runAllTicks();
    });

    expect(result.current.recipes.length).toBe(1);
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.recipes.length).toBe(2);
    expect(result.current.hasMore).toBe(false);
  });
}); 