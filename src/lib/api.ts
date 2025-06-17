import type {
  PaginatedIngredientsDto,
  PaginatedRecipesDto,
  RecipeDetailDto,
} from "../types";

interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  retry?: number;
}

// Runtime configuration that will be injected by Docker container
declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      PUBLIC_SUPABASE_URL?: string;
      PUBLIC_SUPABASE_ANON_KEY?: string;
      PUBLIC_USE_LOCAL_BACKEND?: string;
    };
  }
}

// Get runtime configuration with fallbacks
function getRuntimeConfig() {
  try {
    // Browser environment - use runtime config if available
    if (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) {
      const config = window.__RUNTIME_CONFIG__;
      // Check if we have actual values or just placeholders
      if (config.PUBLIC_SUPABASE_URL && 
          !config.PUBLIC_SUPABASE_URL.includes('placeholder')) {
        return config;
      }
      console.warn('API: Runtime config contains placeholder values, checking other sources...');
    }
    
    // Server-side rendering - use runtime environment variables first
    if (typeof process !== 'undefined' && process.env) {
      return {
        PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL || import.meta.env?.PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_ANON_KEY: process.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env?.PUBLIC_SUPABASE_ANON_KEY,
        PUBLIC_USE_LOCAL_BACKEND: process.env.PUBLIC_USE_LOCAL_BACKEND || import.meta.env?.PUBLIC_USE_LOCAL_BACKEND,
      };
    }
    
    // Build-time fallback
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return {
        PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_ANON_KEY: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
        PUBLIC_USE_LOCAL_BACKEND: import.meta.env.PUBLIC_USE_LOCAL_BACKEND,
      };
    }
    
    // Fallback for edge cases
    return {
      PUBLIC_SUPABASE_URL: undefined,
      PUBLIC_SUPABASE_ANON_KEY: undefined,
      PUBLIC_USE_LOCAL_BACKEND: 'false',
    };
  } catch (error) {
    console.warn('Error getting runtime config in API:', error);
    return {
      PUBLIC_SUPABASE_URL: undefined,
      PUBLIC_SUPABASE_ANON_KEY: undefined,
      PUBLIC_USE_LOCAL_BACKEND: 'false',
    };
  }
}

// Fast timeout and no retries for quicker fallback to Supabase
const DEFAULT_TIMEOUT = 500; // 500ms timeout instead of 5000ms
const DEFAULT_RETRIES = 0; // No retries instead of 3 retries

// Use a mock URL in test environment
const isTest = (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ||
  (typeof import.meta.env.MODE !== 'undefined' && import.meta.env.MODE === 'test');

// Use internal localhost URL for backend API
const API_BASE_URL = isTest ? "http://mock-api.test/api" : "http://localhost:8000/api";

// Ensure we never have an empty API_BASE_URL  
const SAFE_API_BASE_URL = API_BASE_URL || "http://mock-api.test/api";

// In test environment, always use local backend so MSW can intercept HTTP calls
// In production, only use if explicitly enabled
const USE_LOCAL_BACKEND = isTest || getRuntimeConfig().PUBLIC_USE_LOCAL_BACKEND === 'true';

// Log configuration for debugging
if (typeof window !== 'undefined') {
  console.log('API Configuration:', {
    useLocalBackend: USE_LOCAL_BACKEND,
    apiBaseUrl: SAFE_API_BASE_URL,
    runtimeConfigAvailable: !!window.__RUNTIME_CONFIG__,
    supabaseUrlSet: !!getRuntimeConfig().PUBLIC_SUPABASE_URL
  });
}

async function fetchWithRetry<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT, retry = DEFAULT_RETRIES, ...fetchOpts } = options;

  for (let attempt = 0; attempt <= retry; attempt += 1) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...fetchOpts, signal: controller.signal });
      clearTimeout(id);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (err) {
      if (attempt === retry || (err as Error).name === "AbortError") {
        throw err;
      }
      // otherwise retry
    }
  }
  // Should never reach here
  throw new Error("Unexpected fetch failure");
}

import { supabase } from './supabaseClient';
import { getMockRecipes, getMockIngredients, getMockRecipeById } from './mockData';

// ------------------- Public API helpers -------------------

export async function searchIngredients(
  query: string,
  page = 1,
  limit = 10,
  options?: FetchOptions
): Promise<PaginatedIngredientsDto> {
  // Only try local backend if explicitly enabled
  if (USE_LOCAL_BACKEND) {
    try {
      const url = new URL(`${SAFE_API_BASE_URL}/ingredients`);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', limit.toString());
      if (query) {
        url.searchParams.set('search', query);
      }
      
      return await fetchWithRetry<PaginatedIngredientsDto>(url.toString(), options);
    } catch (error) {
      console.error('Error fetching ingredients from HTTP API, trying Supabase:', error);
    }
  }
  
  try {
    // Fallback to Supabase
    let supabaseQuery = supabase
      .from('ingredients')
      .select('*', { count: 'exact' });

    // Add search filter if query is provided
    if (query && query.length >= 2) {
      supabaseQuery = supabaseQuery.ilike('name', `%${query}%`);
    }

    // Add pagination
    const { data, error: supabaseError, count } = await supabaseQuery
      .order('name', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (supabaseError) throw supabaseError;

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total_items: count || 0,
        total_pages: totalPages
      }
    };
  } catch (supabaseError) {
    console.error('Error fetching ingredients from Supabase, using mock data:', supabaseError);
    // Return mock data as final fallback
    return getMockIngredients(query, page, limit);
  }
}

export async function findRecipesByIngredients(
  ingredientIds: string[],
  page = 1,
  limit = 10,
  options?: FetchOptions
): Promise<PaginatedRecipesDto> {
  if (ingredientIds.length === 0) {
    return {
      data: [],
      pagination: {
        page,
        limit,
        total_items: 0,
        total_pages: 0
      }
    };
  }

  // Only try local backend if explicitly enabled
  if (USE_LOCAL_BACKEND) {
    try {
      const url = new URL(`${SAFE_API_BASE_URL}/recipes/find-by-ingredients`);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', limit.toString());
      ingredientIds.forEach(id => url.searchParams.append('ingredient_ids', id));
      
      return await fetchWithRetry<PaginatedRecipesDto>(url.toString(), options);
    } catch (error) {
      console.error('Error finding recipes by ingredients from HTTP API, trying Supabase:', error);
    }
  }
  
  try {
    // Fallback to Supabase with proper JOIN query
    const { data: recipeIds, error: joinError } = await supabase
      .from('recipe_ingredients')
      .select('recipe_id')
      .in('ingredient_id', ingredientIds);

    if (joinError) throw joinError;

    if (!recipeIds || recipeIds.length === 0) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total_items: 0,
          total_pages: 0
        }
      };
    }

    // Get unique recipe IDs
    const uniqueRecipeIds = [...new Set(recipeIds.map(r => r.recipe_id))];

    // Get count for pagination
    const totalItems = uniqueRecipeIds.length;
    const totalPages = Math.ceil(totalItems / limit);

    // Get paginated recipes
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecipeIds = uniqueRecipeIds.slice(startIndex, endIndex);

    if (paginatedRecipeIds.length === 0) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total_items: totalItems,
          total_pages: totalPages
        }
      };
    }

    // Fetch the actual recipe data (will have current ratings from database)
    const { data, error: supabaseError } = await supabase
      .from('recipes')
      .select('*')
      .in('id', paginatedRecipeIds)
      .order('average_rating', { ascending: false });

    if (supabaseError) throw supabaseError;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total_items: totalItems,
        total_pages: totalPages
      }
    };
  } catch (supabaseError) {
    console.error('Error finding recipes by ingredients from Supabase, using mock data:', supabaseError);
    return getMockRecipes(page, limit);
  }
}

export async function getRecipes(page = 1, limit = 10): Promise<PaginatedRecipesDto> {
  // Only try local backend if explicitly enabled
  if (USE_LOCAL_BACKEND) {
    try {
      const url = new URL(`${SAFE_API_BASE_URL}/recipes`);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', limit.toString());
      
      return await fetchWithRetry<PaginatedRecipesDto>(url.toString());
    } catch (error) {
      console.error('Error fetching recipes from HTTP API, trying Supabase:', error);
    }
  }
  
  try {
    // Fallback to Supabase
    const { count } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true });

    const { data, error: supabaseError } = await supabase
      .from('recipes')
      .select('*')
      .order('average_rating', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (supabaseError) throw supabaseError;

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total_items: count || 0,
        total_pages: totalPages
      }
    };
  } catch (supabaseError) {
    console.error('Error fetching recipes from Supabase, using mock data:', supabaseError);
    return getMockRecipes(page, limit);
  }
}

export async function searchRecipes(
  searchQuery: string,
  page = 1,
  limit = 10,
  options?: FetchOptions
): Promise<PaginatedRecipesDto> {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return getRecipes(page, limit);
  }

  const trimmedQuery = searchQuery.trim();

  // Only try local backend if explicitly enabled
  if (USE_LOCAL_BACKEND) {
    try {
      const url = new URL(`${SAFE_API_BASE_URL}/recipes`);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', limit.toString());
      url.searchParams.set('search', trimmedQuery);
      
      return await fetchWithRetry<PaginatedRecipesDto>(url.toString(), options);
    } catch (error) {
      console.error('Error searching recipes from HTTP API, trying Supabase:', error);
    }
  }
  
  try {
    // Fallback to Supabase with text search
    let supabaseQuery = supabase
      .from('recipes')
      .select('*', { count: 'exact' });

    // Add search filter
    if (trimmedQuery.length >= 2) {
      supabaseQuery = supabaseQuery.ilike('name', `%${trimmedQuery}%`);
    }

    // Get count first
    const { count } = await supabaseQuery;

    // Get the actual data with pagination
    const { data, error: supabaseError } = await supabaseQuery
      .order('average_rating', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (supabaseError) throw supabaseError;

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total_items: count || 0,
        total_pages: totalPages
      }
    };
  } catch (supabaseError) {
    console.error('Error searching recipes from Supabase, using mock data:', supabaseError);
    // Filter mock data by search query
    const mockData = getMockRecipes(1, 100); // Get all mock recipes
    const filteredData = mockData.data.filter(recipe =>
      recipe.name.toLowerCase().includes(trimmedQuery.toLowerCase())
    );
    
    const totalPages = Math.ceil(filteredData.length / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total_items: filteredData.length,
        total_pages: totalPages
      }
    };
  }
}

export async function getRecipeById(id: string, options?: FetchOptions): Promise<RecipeDetailDto> {
  // Only try local backend if explicitly enabled
  if (USE_LOCAL_BACKEND) {
    try {
      const url = new URL(`${SAFE_API_BASE_URL}/recipes/${id}`);
      return await fetchWithRetry<RecipeDetailDto>(url.toString(), options);
    } catch (error) {
      console.error('Error fetching recipe from HTTP API, trying Supabase:', error);
    }
  }
  
  try {
    // Fallback to Supabase - will get current rating data from database
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (recipeError) throw recipeError;

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    // Get ingredients for this recipe
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .select(`
        recipe_id,
        ingredient_id,
        amount,
        is_optional,
        substitute_recommendation,
        ingredients!inner (
          name,
          unit_type
        )
      `)
      .eq('recipe_id', id);

    if (ingredientsError) throw ingredientsError;

    // Steps are already in the recipe object (stored directly in the recipes table)
    // No need to query a separate recipe_steps table

    // Transform ingredients to match expected format
    const transformedIngredients = ingredients?.map((ri: any) => ({
      recipe_id: ri.recipe_id,
      ingredient_id: ri.ingredient_id,
      amount: ri.amount,
      is_optional: ri.is_optional,
      substitute_recommendation: ri.substitute_recommendation,
      name: ri.ingredients?.name || '',
      unit_type: ri.ingredients?.unit_type || 'g'
    })) || [];

    // Convert steps from string array to proper step objects if needed
    let processedSteps = recipe.steps || [];
    if (processedSteps.length > 0 && typeof processedSteps[0] === 'string') {
      // Convert string array to step objects
      processedSteps = processedSteps.map((stepDescription: string, index: number) => ({
        step: index + 1,
        description: stepDescription
      }));
    }

    // Return recipe with current rating data from database
    return {
      ...recipe,
      ingredients: transformedIngredients,
      steps: processedSteps
    };
  } catch (supabaseError) {
    console.error('Error fetching recipe from Supabase, using mock data:', supabaseError);
    return getMockRecipeById(id);
  }
}