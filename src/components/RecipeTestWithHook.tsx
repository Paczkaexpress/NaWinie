import React, { useState, useEffect } from 'react';
import { useRecipeDetail } from '../hooks';

interface RecipeTestWithHookProps {
  recipeId: string;
}

export default function RecipeTestWithHook({ recipeId }: RecipeTestWithHookProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    console.log('🔥 RecipeTestWithHook: useEffect running - CLIENT SIDE!');
    setIsClient(true);
  }, []);

  console.log('🔥 RecipeTestWithHook: About to call useRecipeDetail');
  
  try {
    const { recipe, isLoading, error } = useRecipeDetail(recipeId);
    console.log('🔥 RecipeTestWithHook: useRecipeDetail succeeded', { recipe: recipe?.name, isLoading, error });

    return (
      <div style={{ 
        padding: '20px', 
        border: '2px solid purple', 
        margin: '10px',
        backgroundColor: isClient ? 'lightgreen' : 'lightpink'
      }}>
        <h3>Recipe Test With Hook</h3>
        <p>Recipe ID: {recipeId}</p>
        <p>Is Client: {isClient ? '✅ YES' : '❌ NO'}</p>
        <p>Hook State: loading={isLoading.toString()}, recipe={recipe?.name || 'null'}, error={error || 'null'}</p>
        <p><small>If this is green and shows hook data, useRecipeDetail works on client</small></p>
      </div>
    );
  } catch (err) {
    console.log('🔥 RecipeTestWithHook: useRecipeDetail threw error:', err);
    return (
      <div style={{ 
        padding: '20px', 
        border: '2px solid red', 
        margin: '10px',
        backgroundColor: 'salmon'
      }}>
        <h3>Recipe Test With Hook - ERROR</h3>
        <p>Error: {err instanceof Error ? err.message : 'Unknown error'}</p>
      </div>
    );
  }
} 