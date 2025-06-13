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
  const prevIngredientIdsRef = useRef<string[]>([]);

  /* Reset and load first page when ingredientIds change */
  useEffect(() => {
    const currentIds = ingredientIds.join(',');
    const prevIds = prevIngredientIdsRef.current.join(',');
    
    if (currentIds !== prevIds) {
      prevIngredientIdsRef.current = ingredientIds;
      
      // Reset state
      setRecipes([]);
      setPage(1);
      setError(null);
      setHasMore(false);
      
      // Load first page if we have ingredients
      if (ingredientIds.length > 0) {
        loadFirstPage();
      }
    }
  }, [ingredientIds]);

  const loadFirstPage = useCallback(async () => {
    if (ingredientIds.length === 0 || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data: PaginatedRecipesDto = await findRecipesByIngredients(
        ingredientIds,
        1,
        PAGE_SIZE
      );
      setRecipes(data.data);
      setHasMore(data.pagination.page < data.pagination.total_pages);
      setPage(2); // Next page to load
    } catch (err) {
      setError(err as Error);
      console.error("Error loading recipes:", err);
    } finally {
      setIsLoading(false);
    }
  }, [ingredientIds, isLoading]);

  const loadMore = useCallback(async () => {
    if (ingredientIds.length === 0 || isLoading || !hasMore) return;
    
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
      console.error("Error loading more recipes:", err);
    } finally {
      setIsLoading(false);
    }
  }, [ingredientIds, isLoading, page, hasMore]);

  return { recipes, isLoading, error, hasMore, loadMore };
};

export default useRecipeSearch; 