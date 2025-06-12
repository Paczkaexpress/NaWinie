import { useEffect, useState } from "react";
import type { IngredientDto } from "../types";
import { searchIngredients } from "../lib/api";
import { useToast } from "../components/ToastProvider";

interface UseIngredientsSearchResult {
  suggestions: IngredientDto[];
  isLoading: boolean;
  error: Error | null;
}

const DEBOUNCE_MS = 300;

const useIngredientsSearch = (query: string): UseIngredientsSearchResult => {
  const [suggestions, setSuggestions] = useState<IngredientDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { addToast } = useToast();

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await searchIngredients(query, 1, 10, { signal: controller.signal });
        setSuggestions(data.data);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(err as Error);
          addToast("Błąd podczas wyszukiwania składników", "error");
        }
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query]);

  return { suggestions, isLoading, error };
};

export default useIngredientsSearch; 