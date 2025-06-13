import { useCallback, useEffect, useState } from "react";
import type { IngredientDto } from "../types";

const QUERY_KEY = "ingredients";

/**
 * Parses `?ingredients=id1,id2` into an array of strings.
 */
function parseIngredientIds(search: string): string[] {
  const params = new URLSearchParams(search);
  const raw = params.get(QUERY_KEY);
  if (!raw) return [];
  return raw.split(",").filter(Boolean);
}

function stringifyIngredientIds(ids: string[]): string {
  return ids.join(",");
}

/**
 * Dummy helper to turn an ID into a minimal IngredientDto when only an ID is known.
 */
function toPlaceholderIngredient(id: string): IngredientDto {
  return { id, name: id, unit_type: "unit", created_at: "", updated_at: "" } as unknown as IngredientDto;
}

interface UseUrlIngredientsReturn {
  ingredients: IngredientDto[];
  addIngredient: (ing: IngredientDto) => void;
  removeIngredient: (id: string) => void;
  clearIngredients: () => void;
}

/**
 * Hook that keeps selected ingredients in sync with the `ingredients` URL query param.
 * Note: We don't load ingredients from URL on startup to avoid placeholder ingredient issues.
 * Users need to search and select ingredients through the proper interface.
 */
const useUrlIngredients = (): UseUrlIngredientsReturn => {
  const [ingredients, setIngredients] = useState<IngredientDto[]>([]);

  /* Sync URL → state on startup */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initialIds = parseIngredientIds(window.location.search);
    setIngredients(initialIds.map(toPlaceholderIngredient));
  }, []);

  /* Sync state → URL */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const ids = ingredients.map((i) => i.id);
    const params = new URLSearchParams(window.location.search);
    if (ids.length > 0) {
      params.set(QUERY_KEY, stringifyIngredientIds(ids));
    } else {
      params.delete(QUERY_KEY);
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    // prevent empty "?" in URL
    if (newUrl.endsWith("?")) {
      window.history.replaceState(null, "", newUrl.slice(0, -1));
      return;
    }
    window.history.replaceState(null, "", newUrl);
  }, [ingredients]);

  const addIngredient = useCallback((ing: IngredientDto) => {
    setIngredients((prev) => (prev.length >= 10 ? prev : [...prev, ing]));
  }, []);

  const removeIngredient = useCallback((id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearIngredients = useCallback(() => setIngredients([]), []);

  return { ingredients, addIngredient, removeIngredient, clearIngredients };
};

export default useUrlIngredients; 