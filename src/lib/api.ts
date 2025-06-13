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
  const url = `${API_BASE_URL}/ingredients?search=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
  return fetchWithRetry<PaginatedIngredientsDto>(url, options);
}

export async function findRecipesByIngredients(
  ingredientIds: string[],
  page = 1,
  limit = 10,
  options?: FetchOptions
): Promise<PaginatedRecipesDto> {
  const url = `${API_BASE_URL}/recipes/find-by-ingredients?ingredientIds=${ingredientIds.join(",")}&page=${page}&limit=${limit}`;
  return fetchWithRetry<PaginatedRecipesDto>(url, options);
}

import { supabase } from '@/lib/supabaseClient'

export async function getRecipes(page = 1, limit = 10) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('average_rating', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) throw error
  return data
}