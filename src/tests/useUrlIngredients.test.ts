import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useUrlIngredients from "../hooks/useUrlIngredients";

// Helper to set window.location.search
function setSearch(search: string) {
  window.history.replaceState({}, "", `${window.location.pathname}${search}`);
}

describe("useUrlIngredients", () => {
  beforeEach(() => {
    setSearch("");
  });

  it("parses initial ingredient ids from URL", () => {
    setSearch("?ingredients=abc,def");
    const { result } = renderHook(() => useUrlIngredients());

    expect(result.current.ingredients.map((i) => i.id)).toEqual(["abc", "def"]);
  });

  it("adds ingredient and syncs to URL", () => {
    const { result } = renderHook(() => useUrlIngredients());

    act(() => {
      result.current.addIngredient({ id: "xyz", name: "XYZ", unit_type: "unit", created_at: "", updated_at: "" } as any);
    });

    expect(window.location.search).toBe("?ingredients=xyz");
  });

  it("removes ingredient and clears from URL when empty", () => {
    setSearch("?ingredients=foo");
    const { result } = renderHook(() => useUrlIngredients());

    act(() => {
      result.current.removeIngredient("foo");
    });

    expect(window.location.search).toBe("");
  });
}); 