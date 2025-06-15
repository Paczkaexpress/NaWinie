import React, { useState, useEffect } from 'react';

interface RecipeTestSimpleProps {
  recipeId: string;
}

export default function RecipeTestSimple({ recipeId }: RecipeTestSimpleProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    console.log('🔥 RecipeTestSimple: useEffect running - CLIENT SIDE!');
    setIsClient(true);
  }, []);

  console.log('🔥 RecipeTestSimple: Component rendering, recipeId:', recipeId, 'isClient:', isClient);

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid red', 
      margin: '10px',
      backgroundColor: isClient ? 'lightblue' : 'lightyellow'
    }}>
      <h3>Recipe Test Simple</h3>
      <p>Recipe ID: {recipeId}</p>
      <p>Is Client: {isClient ? '✅ YES' : '❌ NO'}</p>
      <p><small>If this is blue, client-side hydration is working for recipe components</small></p>
    </div>
  );
} 