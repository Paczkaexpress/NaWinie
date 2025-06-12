import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as React from "react";
import useIngredientsSearch from "../hooks/useIngredientsSearch";
import { ToastProvider } from "../components/ToastProvider";

vi.useFakeTimers();

describe("useIngredientsSearch", () => {
  it("debounces API calls and updates suggestions", async () => {
    const wrapper = ({ children }: { children: any }) => {
      return React.createElement(ToastProvider, null, children);
    };

    const { result, rerender } = renderHook(({ q }) => useIngredientsSearch(q), {
      wrapper,
      initialProps: { q: "" },
    });

    // change query to 1 char (should NOT trigger fetch)
    rerender({ q: "a" });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current.isLoading).toBe(false);

    // change query to >=2 chars and wait for debounce
    rerender({ q: "ap" });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // loading should start
    expect(result.current.isLoading).toBe(true);

    // fast-forward pending promise resolution mocked by MSW
    await act(async () => {
      await vi.runAllTicks();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.suggestions.length).toBeGreaterThan(0);
  });
}); 