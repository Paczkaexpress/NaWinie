export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UnitType = "ml" | "g" | "szt";
export type ComplexityLevel = "easy" | "medium" | "hard";

export interface Users {
  id: string; // uuid, references auth.users
  email: string;
  created_at?: string; // timestamptz
  updated_at?: string; // timestamptz
}

export interface Ingredients {
  id: string; // uuid
  name: string;
  unit_type: UnitType;
  created_at?: string; // timestamptz
  updated_at?: string; // timestamptz
}

export interface DefaultIngredients {
  id: string; // uuid
  ingredient_id: string; // uuid, references ingredients(id)
  created_at?: string; // timestamptz
}

export interface UserDefaultIngredients {
  user_id: string; // uuid, references users(id)
  ingredient_id: string; // uuid, references ingredients(id)
  created_at?: string; // timestamptz
}

export interface Recipes {
  id: string; // uuid
  name: string;
  preparation_time_minutes: number; // integer
  complexity_level: ComplexityLevel;
  steps: Json; // jsonb - Using Json type, adjust if specific structure is known
  author_id: string; // uuid, references users(id)
  average_rating?: number; // numeric(2,1)
  total_votes?: number; // integer
  created_at?: string; // timestamptz
  updated_at?: string; // timestamptz
}

export interface RecipeIngredients {
  recipe_id: string; // uuid, references recipes(id)
  ingredient_id: string; // uuid, references ingredients(id)
  amount: number; // numeric
  is_optional?: boolean;
  substitute_recommendation?: string | null; // text
}

export interface RecipeViews {
  id: string; // uuid
  user_id?: string | null; // uuid, references users(id)
  recipe_id?: string | null; // uuid, references recipes(id)
  view_start?: string; // timestamptz
  view_end?: string | null; // timestamptz
  created_at?: string; // timestamptz
}

export interface IngredientPopularity {
  ingredient_id: string; // uuid, references ingredients(id)
  search_count?: number; // integer
  last_updated?: string; // timestamptz
}

// Note: Materialized view 'popular_ingredients' is not directly mapped
// as it combines data from 'ingredients' and 'ingredient_popularity'.
// You can create a specific interface for it if needed, combining fields from both.

// Example for a combined type if needed:
// export interface PopularIngredients extends Ingredients {
//   search_count?: number;
//   last_updated?: string;
// } 