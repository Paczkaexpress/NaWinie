import { useCallback, useEffect, useState } from "react";
import type { RecipeListItemDto, PaginatedRecipesDto } from "../types";
import { getRecipes } from "../lib/api";

interface UseDefaultRecipesResult {
  recipes: RecipeListItemDto[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

const PAGE_SIZE = 12;

const useDefaultRecipes = (): UseDefaultRecipesResult => {
  const [recipes, setRecipes] = useState<RecipeListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Load first page on component mount
  useEffect(() => {
    loadFirstPage();
  }, []);

  const loadFirstPage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data: PaginatedRecipesDto = await getRecipes(1, PAGE_SIZE);
      setRecipes(data.data);
      setHasMore(data.pagination.page < data.pagination.total_pages);
      setPage(2); // Next page to load
    } catch (err) {
      setError(err as Error);
      console.error("Error loading default recipes:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data: PaginatedRecipesDto = await getRecipes(page, PAGE_SIZE);
      setRecipes((prev) => [...prev, ...data.data]);
      setHasMore(data.pagination.page < data.pagination.total_pages);
      setPage((p) => p + 1);
    } catch (err) {
      setError(err as Error);
      console.error("Error loading more default recipes:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, page, hasMore]);

  return { recipes, isLoading, error, hasMore, loadMore };
};

export default useDefaultRecipes; 