import * as React from "react";
import type { IngredientDto } from "../types";
import IngredientSelector from "./IngredientSelector";
import RecipeGrid from "./RecipeGrid";
import ErrorBoundary from "./ErrorBoundary";
import useUrlIngredients from "../hooks/useUrlIngredients";
import useRecipeSearch from "../hooks/useRecipeSearch";

/**
 * HomeView – top-level component for the "/" route.
 *
 * Responsibilities:
 * 1. Synchronise selected ingredients with the URL (via useUrlIngredients).
 * 2. Trigger recipe search whenever ingredientIds change (via useRecipeSearch).
 * 3. Render the IngredientSelector (sidebar) and RecipeGrid (main area).
 */
const HomeView: React.FC = () => {
  console.log('HomeView rendering...');

  /* Synchronise ingredients with the URL */
  const {
    ingredients: selectedIngredients,
    addIngredient,
    removeIngredient,
    clearIngredients,
  } = useUrlIngredients();

  console.log('Selected ingredients:', selectedIngredients);

  /* Search for recipes whenever the selected ingredient IDs change */
  const {
    recipes,
    isLoading: isRecipesLoading,
    error: recipesError,
    hasMore,
    loadMore,
  } = useRecipeSearch(selectedIngredients.map((i) => i.id));

  console.log('Recipes:', recipes, 'Error:', recipesError);

  // Show loading state during hydration
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    console.log('HomeView hydrating...');
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Składniki</h2>
          <div className="p-4 text-gray-500">Ładowanie...</div>
        </div>
        <div className="p-4 text-gray-500">Ładowanie przepisów...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
        {/* Sidebar – ingredient management */}
        <IngredientSelector
          selectedIngredients={selectedIngredients}
          onIngredientAdd={addIngredient}
          onIngredientRemove={removeIngredient}
          onClear={clearIngredients}
        />

        {/* Main – recipe list */}
        <div>
          {recipesError ? (
            <p className="text-red-600 font-medium">{recipesError.message}</p>
          ) : (
            <RecipeGrid
              recipes={recipes}
              isLoading={isRecipesLoading}
              hasMore={hasMore}
              loadMore={loadMore}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default HomeView; 