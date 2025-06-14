import { useState, useEffect, useCallback } from 'react';
import type { IngredientDto, PaginatedIngredientsDto } from '../types';

interface UseIngredientsReturn {
  ingredients: IngredientDto[];
  loading: boolean;
  error: string | null;
  searchIngredients: (query: string) => Promise<IngredientDto[]>;
  refetch: () => Promise<void>;
}

const INGREDIENTS_CACHE_KEY = 'recipes_ingredients_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedIngredients {
  data: IngredientDto[];
  timestamp: number;
}

export const useIngredients = (): UseIngredientsReturn => {
  const [ingredients, setIngredients] = useState<IngredientDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCachedIngredients = useCallback((): IngredientDto[] | null => {
    try {
      const cached = localStorage.getItem(INGREDIENTS_CACHE_KEY);
      if (!cached) return null;

      const parsedCache: CachedIngredients = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - parsedCache.timestamp < CACHE_DURATION) {
        return parsedCache.data;
      }
      
      // Cache expired, remove it
      localStorage.removeItem(INGREDIENTS_CACHE_KEY);
      return null;
    } catch (error) {
      console.error('Error reading ingredients cache:', error);
      localStorage.removeItem(INGREDIENTS_CACHE_KEY);
      return null;
    }
  }, []);

  const setCachedIngredients = useCallback((data: IngredientDto[]) => {
    try {
      const cacheData: CachedIngredients = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(INGREDIENTS_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching ingredients:', error);
    }
  }, []);

  const fetchIngredients = useCallback(async (searchQuery?: string): Promise<IngredientDto[]> => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      params.append('limit', '100'); // Get more ingredients for better search

      const response = await fetch(`/api/ingredients?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: PaginatedIngredientsDto = await response.json();
      return data.data || [];
      
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      throw new Error('Nie udało się pobrać składników');
    }
  }, []);

  const loadIngredients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get from cache first
      const cachedData = getCachedIngredients();
      if (cachedData) {
        setIngredients(cachedData);
        setLoading(false);
        return;
      }

      // Fetch from API
      const data = await fetchIngredients();
      setIngredients(data);
      setCachedIngredients(data);
      
    } catch (error) {
      console.error('Error loading ingredients:', error);
      setError(error instanceof Error ? error.message : 'Wystąpił błąd podczas ładowania składników');
      
      // Try to use mock data as fallback
      const mockIngredients: IngredientDto[] = [
        { id: '1', name: 'Mąka pszenna', unit_type: 'g', created_at: '', updated_at: '' },
        { id: '2', name: 'Jajka', unit_type: 'szt', created_at: '', updated_at: '' },
        { id: '3', name: 'Mleko', unit_type: 'ml', created_at: '', updated_at: '' },
        { id: '4', name: 'Masło', unit_type: 'g', created_at: '', updated_at: '' },
        { id: '5', name: 'Cukier', unit_type: 'g', created_at: '', updated_at: '' },
        { id: '6', name: 'Sól', unit_type: 'g', created_at: '', updated_at: '' },
        { id: '7', name: 'Cebula', unit_type: 'szt', created_at: '', updated_at: '' },
        { id: '8', name: 'Czosnek', unit_type: 'ząbki', created_at: '', updated_at: '' },
        { id: '9', name: 'Pomidory', unit_type: 'g', created_at: '', updated_at: '' },
        { id: '10', name: 'Oliwa z oliwek', unit_type: 'ml', created_at: '', updated_at: '' },
        { id: '11', name: 'Pietruszka', unit_type: 'g', created_at: '', updated_at: '' },
        { id: '12', name: 'Marchew', unit_type: 'g', created_at: '', updated_at: '' },
        { id: '13', name: 'Ziemniaki', unit_type: 'g', created_at: '', updated_at: '' },
        { id: '14', name: 'Makaron', unit_type: 'g', created_at: '', updated_at: '' },
        { id: '15', name: 'Ryż', unit_type: 'g', created_at: '', updated_at: '' },
      ];
      setIngredients(mockIngredients);
    } finally {
      setLoading(false);
    }
  }, [getCachedIngredients, setCachedIngredients, fetchIngredients]);

  const searchIngredients = useCallback(async (query: string): Promise<IngredientDto[]> => {
    if (!query.trim()) {
      return ingredients.slice(0, 10); // Return first 10 ingredients for empty query
    }

    try {
      // First try to search in cached ingredients
      const filteredLocal = ingredients.filter(ingredient =>
        ingredient.name.toLowerCase().includes(query.toLowerCase())
      );

      if (filteredLocal.length > 0) {
        return filteredLocal.slice(0, 10);
      }

      // If no local results, try API search
      const searchResults = await fetchIngredients(query);
      return searchResults.slice(0, 10);
      
    } catch (error) {
      console.error('Error searching ingredients:', error);
      // Fallback to local search even on API error
      return ingredients.filter(ingredient =>
        ingredient.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);
    }
  }, [ingredients, fetchIngredients]);

  const refetch = useCallback(async () => {
    // Clear cache and reload
    localStorage.removeItem(INGREDIENTS_CACHE_KEY);
    await loadIngredients();
  }, [loadIngredients]);

  // Load ingredients on mount
  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  return {
    ingredients,
    loading,
    error,
    searchIngredients,
    refetch,
  };
}; 