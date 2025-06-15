import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks';

interface RecipeTestWithAuthProps {
  recipeId: string;
}

export default function RecipeTestWithAuth({ recipeId }: RecipeTestWithAuthProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    console.log('🔥 RecipeTestWithAuth: useEffect running - CLIENT SIDE!');
    setIsClient(true);
  }, []);

  console.log('🔥 RecipeTestWithAuth: About to call useAuth');
  
  try {
    const { isAuthenticated } = useAuth();
    console.log('🔥 RecipeTestWithAuth: useAuth succeeded', { isAuthenticated });

    return (
      <div style={{ 
        padding: '20px', 
        border: '2px solid orange', 
        margin: '10px',
        backgroundColor: isClient ? 'lightyellow' : 'lightcoral'
      }}>
        <h3>Recipe Test With Auth</h3>
        <p>Recipe ID: {recipeId}</p>
        <p>Is Client: {isClient ? '✅ YES' : '❌ NO'}</p>
        <p>Auth State: authenticated={isAuthenticated.toString()}</p>
        <p><small>If this is yellow, useAuth works on client</small></p>
      </div>
    );
  } catch (err) {
    console.log('🔥 RecipeTestWithAuth: useAuth threw error:', err);
    return (
      <div style={{ 
        padding: '20px', 
        border: '2px solid red', 
        margin: '10px',
        backgroundColor: 'salmon'
      }}>
        <h3>Recipe Test With Auth - ERROR</h3>
        <p>Error: {err instanceof Error ? err.message : 'Unknown error'}</p>
      </div>
    );
  }
} 