import * as React from "react";
import type { IngredientDto } from "../types";
import IngredientSelector from "./IngredientSelector";
import RecipeGrid from "./RecipeGrid";
import ErrorBoundary from "./ErrorBoundary";
import useUrlIngredients from "../hooks/useUrlIngredients";
import useRecipeSearch from "../hooks/useRecipeSearch";
import useDefaultRecipes from "../hooks/useDefaultRecipes";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Search, Filter, SortAsc } from "lucide-react";

/**
 * HomeView – top-level component for the "/" route.
 *
 * Responsibilities:
 * 1. Synchronise selected ingredients with the URL (via useUrlIngredients).
 * 2. Trigger recipe search whenever ingredientIds change (via useRecipeSearch).
 * 3. Show default recipes when no ingredients selected (via useDefaultRecipes).
 * 4. Render the IngredientSelector (sidebar) and RecipeGrid (main area).
 */
const HomeView: React.FC = React.memo(() => {
  console.log('HomeView rendering...');

  // Show loading state during hydration
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    console.log('HomeView hydrating...');
    setIsHydrated(true);
  }, []);

  /* Synchronise ingredients with the URL */
  const {
    ingredients: selectedIngredients,
    addIngredient,
    removeIngredient,
    clearIngredients,
  } = useUrlIngredients();

  console.log('Selected ingredients:', selectedIngredients);

  // Memoize ingredient IDs to prevent unnecessary re-renders
  const ingredientIds = React.useMemo(
    () => selectedIngredients.map((i) => i.id),
    [selectedIngredients]
  );

  /* Search for recipes whenever the selected ingredient IDs change */
  const {
    recipes: searchedRecipes,
    isLoading: isRecipesLoading,
    error: recipesError,
    hasMore: hasMoreSearched,
    loadMore: loadMoreSearched,
  } = useRecipeSearch(ingredientIds);

  /* Load default recipes for when no ingredients are selected */
  const {
    recipes: defaultRecipes,
    isLoading: isDefaultLoading,
    error: defaultError,
    hasMore: hasMoreDefault,
    loadMore: loadMoreDefault,
  } = useDefaultRecipes();

  // Memoize computed values to prevent unnecessary re-renders
  const memoizedValues = React.useMemo(() => {
    const hasSelectedIngredients = selectedIngredients.length > 0;
    return {
      hasSelectedIngredients,
      recipes: hasSelectedIngredients ? searchedRecipes : defaultRecipes,
      isLoading: hasSelectedIngredients ? isRecipesLoading : isDefaultLoading,
      error: hasSelectedIngredients ? recipesError : defaultError,
      hasMore: hasSelectedIngredients ? hasMoreSearched : hasMoreDefault,
      loadMore: hasSelectedIngredients ? loadMoreSearched : loadMoreDefault,
    };
  }, [
    selectedIngredients.length,
    searchedRecipes,
    defaultRecipes,
    isRecipesLoading,
    isDefaultLoading,
    recipesError,
    defaultError,
    hasMoreSearched,
    hasMoreDefault,
    loadMoreSearched,
    loadMoreDefault,
  ]);

  const { hasSelectedIngredients, recipes, isLoading, error, hasMore, loadMore } = memoizedValues;

  console.log('Recipes:', recipes, 'Error:', error, 'Has ingredients:', hasSelectedIngredients);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="w-80 bg-background border-r p-6">
          <Card>
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded animate-pulse mb-4" />
              <div className="h-4 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
        <div className="flex-1 p-6">
          <Card>
            <CardContent className="p-6">
              <div className="h-8 bg-muted rounded animate-pulse mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 bg-muted rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {/* Enhanced Search Bar */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Na co masz ochotę?"
                className="w-full pl-12 pr-32 py-4 text-lg border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
              <Button size="lg" className="absolute right-2 top-1/2 transform -translate-y-1/2">
                Szukaj
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex min-h-screen bg-gray-50">
        {/* Left Sidebar - Ingredients */}
        <div className="w-80 bg-background border-r">
          <div className="p-6">
            <IngredientSelector
              selectedIngredients={selectedIngredients}
              onIngredientAdd={addIngredient}
              onIngredientRemove={removeIngredient}
              onClear={clearIngredients}
            />
          </div>
        </div>

        {/* Main Content - Recipes */}
        <div className="flex-1 p-6">
          <Card>
            <CardContent className="p-6">
              {/* Header Section */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {hasSelectedIngredients 
                      ? "Przepisy na bazie wybranych składników" 
                      : "Polecane przepisy"
                    }
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Liczba przepisów: <Badge variant="secondary">{recipes.length}</Badge></span>
                    {selectedIngredients.length > 0 && (
                      <span>
                        Składniki: <Badge variant="outline">{selectedIngredients.length}</Badge>
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4" />
                    Filtruj
                  </Button>
                  <select className="h-9 px-3 py-1 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>Sortuj: Trafność</option>
                    <option>Popularne</option>
                    <option>Najnowsze</option>
                    <option>Czas przygotowania</option>
                  </select>
                </div>
              </div>

              {/* Recipe Content */}
              {error ? (
                <div className="text-center py-12">
                  <div className="text-destructive font-medium mb-2">
                    Wystąpił błąd podczas ładowania przepisów
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {error.message}
                  </p>
                </div>
              ) : (
                <RecipeGrid
                  recipes={recipes}
                  isLoading={isLoading}
                  hasMore={hasMore}
                  loadMore={loadMore}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
});

export default HomeView; 