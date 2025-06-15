import { useCallback, useEffect, useRef, useState } from "react";
import type { RecipeListItemDto, PaginatedRecipesDto } from "@/types";
import { searchRecipes } from "@/lib/api";

interface UseTextRecipeSearchResult {
  recipes: RecipeListItemDto[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
}

const PAGE_SIZE = 10;

const useTextRecipeSearch = (): UseTextRecipeSearchResult => {
  const [recipes, setRecipes] = useState<RecipeListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const prevSearchQueryRef = useRef<string>("");

  const search = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    
    if (trimmedQuery === prevSearchQueryRef.current) return;
    
    prevSearchQueryRef.current = trimmedQuery;
    setSearchQuery(trimmedQuery);
    
    // Reset state
    setRecipes([]);
    setPage(1);
    setError(null);
    setHasMore(false);
    
    if (trimmedQuery.length === 0) {
      return;
    }
    
    setIsLoading(true);
    try {
      const data: PaginatedRecipesDto = await searchRecipes(
        trimmedQuery,
        1,
        PAGE_SIZE
      );
      setRecipes(data.data);
      setHasMore(data.pagination.page < data.pagination.total_pages);
      setPage(2); // Next page to load
    } catch (err) {
      setError(err as Error);
      console.error("Error searching recipes:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!searchQuery || isLoading || !hasMore) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data: PaginatedRecipesDto = await searchRecipes(
        searchQuery,
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
  }, [searchQuery, isLoading, page, hasMore]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setRecipes([]);
    setPage(1);
    setError(null);
    setHasMore(false);
    prevSearchQueryRef.current = "";
  }, []);

  return { 
    recipes, 
    isLoading, 
    error, 
    hasMore, 
    loadMore, 
    search, 
    clearSearch 
  };
};

export default useTextRecipeSearch; 