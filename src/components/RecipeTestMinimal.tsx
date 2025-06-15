import React, { useState, useEffect } from 'react';
import { useRecipeDetail, useAuth } from '../hooks';

interface RecipeTestMinimalProps {
  recipeId: string;
}

export default function RecipeTestMinimal({ recipeId }: RecipeTestMinimalProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    console.log('🔥 RecipeTestMinimal: useEffect running - CLIENT SIDE!');
    setIsClient(true);
  }, []);

  console.log('🔥 RecipeTestMinimal: Component rendered with recipeId:', recipeId);
  
  const { recipe, isLoading, error, retry } = useRecipeDetail(recipeId);
  const { isAuthenticated } = useAuth();
  
  console.log('🔥 RecipeTestMinimal: Hook state - isLoading:', isLoading, 'error:', error, 'recipe:', recipe?.name || 'null');

  // Loading state
  if (isLoading) {
    return (
      <div style={{ 
        padding: '20px', 
        border: '2px solid purple', 
        margin: '10px',
        backgroundColor: isClient ? 'lightblue' : 'lightpink'
      }}>
        <h3>Recipe Test Minimal - Loading</h3>
        <p>Is Client: {isClient ? '✅ YES' : '❌ NO'}</p>
        <p>Loading recipe...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        border: '2px solid red', 
        margin: '10px',
        backgroundColor: 'salmon'
      }}>
        <h3>Recipe Test Minimal - Error</h3>
        <p>Error: {error}</p>
        <button onClick={retry}>Retry</button>
      </div>
    );
  }

  // No recipe found
  if (!recipe) {
    return (
      <div style={{ 
        padding: '20px', 
        border: '2px solid gray', 
        margin: '10px',
        backgroundColor: 'lightgray'
      }}>
        <h3>Recipe Test Minimal - No Recipe</h3>
        <p>No recipe found</p>
      </div>
    );
  }

  // Success state
  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid green', 
      margin: '10px',
      backgroundColor: isClient ? 'lightgreen' : 'lightpink'
    }}>
      <h3>Recipe Test Minimal - Success</h3>
      <p>Is Client: {isClient ? '✅ YES' : '❌ NO'}</p>
      <p><strong>Recipe:</strong> {recipe.name}</p>
      <p><strong>Prep Time:</strong> {recipe.preparation_time_minutes} minutes</p>
      <p><strong>Difficulty:</strong> {recipe.complexity_level}</p>
      <p><strong>Steps:</strong> {recipe.steps.length}</p>
      <p><strong>Ingredients:</strong> {recipe.ingredients.length}</p>
      <p><strong>Authenticated:</strong> {isAuthenticated.toString()}</p>
      <p><small>If this is green and shows recipe data, minimal version works!</small></p>
    </div>
  );
} 