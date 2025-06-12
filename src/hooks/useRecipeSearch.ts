import { useCallback, useEffect, useRef, useState } from "react";
import type { RecipeListItemDto, PaginatedRecipesDto } from "../types";
import { findRecipesByIngredients } from "../lib/api";

interface UseRecipeSearchResult {
  recipes: RecipeListItemDto[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

const PAGE_SIZE = 10;

const useRecipeSearch = (ingredientIds: string[]): UseRecipeSearchResult => {
  const [recipes, setRecipes] = useState<RecipeListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const prevIngredientIdsRef = useRef<string[]>(ingredientIds);

  /* Reset when ingredientIds change */
  useEffect(() => {
    if (prevIngredientIdsRef.current.join() !== ingredientIds.join()) {
      setRecipes([]);
      setPage(1);
      setError(null);
    }
    prevIngredientIdsRef.current = ingredientIds;
  }, [ingredientIds]);

  /* Load first page on page or ingredientIds change - but only if we have ingredients */
  useEffect(() => {
    if (ingredientIds.length > 0) {
      loadMore();
    } else {
      // Clear recipes when no ingredients selected
      setRecipes([]);
      setHasMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredientIds]);

  const loadMore = useCallback(async () => {
    // Don't make API calls if no ingredients selected
    if (ingredientIds.length === 0 || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data: PaginatedRecipesDto = await findRecipesByIngredients(
        ingredientIds,
        page,
        PAGE_SIZE
      );
      setRecipes((prev) => [...prev, ...data.data]);
      setHasMore(data.pagination.page < data.pagination.total_pages);
      setPage((p) => p + 1);
    } catch (err) {
      setError(err as Error);
      console.error("Error loading recipes:", err);
    } finally {
      setIsLoading(false);
    }
  }, [ingredientIds, isLoading, page]);

  return { recipes, isLoading, error, hasMore, loadMore };
};

export default useRecipeSearch; 