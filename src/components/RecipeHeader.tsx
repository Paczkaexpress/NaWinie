import React from 'react';
import RecipeImage from './RecipeImage';
import RecipeTitleSection from './RecipeTitleSection';

interface RecipeHeaderProps {
  name: string;
  imageData?: string;
  className?: string;
}

export default function RecipeHeader({ name, imageData, className = '' }: RecipeHeaderProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`}>
      <div className="aspect-w-16 aspect-h-9 md:aspect-h-6">
        <RecipeImage
          recipeName={name}
          imageData={imageData}
          className="w-full h-64 md:h-80 lg:h-96"
        />
      </div>
      
      <div className="p-6">
        <RecipeTitleSection name={name} />
      </div>
    </div>
  );
} 