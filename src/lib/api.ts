import type {
  PaginatedIngredientsDto,
  PaginatedRecipesDto,
} from "../types";

interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  retry?: number;
}

const DEFAULT_TIMEOUT = 5000;
const DEFAULT_RETRIES = 3;
const API_BASE_URL = "http://localhost:8000/api"; // Backend API base URL

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

// ------------------- Public API helpers -------------------

export async function searchIngredients(
  query: string,
  page = 1,
  limit = 10,
  options?: FetchOptions
): Promise<PaginatedIngredientsDto> {
  try {
    let supabaseQuery = supabase
      .from('ingredients')
      .select('*', { count: 'exact' });

    // Add search filter if query is provided
    if (query && query.length >= 2) {
      supabaseQuery = supabaseQuery.ilike('name', `%${query}%`);
    }

    // Add pagination
    const { data, error, count } = await supabaseQuery
      .order('name', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

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
  } catch (error) {
    console.error('Error fetching ingredients from Supabase, using mock data:', error);
    // Return mock data as fallback
    return getMockIngredients(query, page, limit);
  }
}

export async function findRecipesByIngredients(
  ingredientIds: string[],
  page = 1,
  limit = 10,
  options?: FetchOptions
): Promise<PaginatedRecipesDto> {
  try {
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

    // This is a complex query that would require joins in Supabase
    // For now, we'll return mock recipes filtered by ingredients
    console.log('Searching recipes by ingredients:', ingredientIds);
    
    // TODO: Implement proper Supabase query with joins when the database schema is set up
    // For now, return mock data
    return getMockRecipes(page, limit);
  } catch (error) {
    console.error('Error finding recipes by ingredients:', error);
    return getMockRecipes(page, limit);
  }
}

import { supabase } from './supabaseClient';
import { getMockRecipes, getMockIngredients } from './mockData';

export async function getRecipes(page = 1, limit = 10): Promise<PaginatedRecipesDto> {
  try {
    // Get total count for pagination
    const { count } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true });

    // Get recipes for the current page
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('average_rating', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

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
  } catch (error) {
    console.error('Error fetching recipes from Supabase, using mock data:', error);
    // Return mock data as fallback to prevent empty content and blinking
    return getMockRecipes(page, limit);
  }
}