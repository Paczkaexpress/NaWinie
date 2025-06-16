import { useCallback, useEffect, useState } from "react";
import type { RecipeListItemDto, PaginatedRecipesDto } from "@/types";
import { findRecipesByIngredients } from "@/lib/api";

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

  useEffect(() => {
    if (ingredientIds.length === 0) {
      setRecipes([]);
      setPage(1);
      setHasMore(false);
      return;
    }

    let isCancelled = false;

    const fetchFirstPage = async () => {
      // Reset state for new search
      setRecipes([]);
      setPage(1);
      setHasMore(false);
      setIsLoading(true);
      setError(null);

      try {
        const data = await findRecipesByIngredients(ingredientIds, 1, PAGE_SIZE);
        if (!isCancelled) {
          setRecipes(data.data);
          setHasMore(data.pagination.page < data.pagination.total_pages);
          setPage(data.pagination.page + 1);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err as Error);
          console.error("Error loading recipes:", err);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchFirstPage();

    return () => {
      isCancelled = true;
    };
  }, [JSON.stringify(ingredientIds)]); // Using stringify for deep comparison

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

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