import React from 'react';
import { PrepTimeDisplay, DifficultyBadge, RatingDisplay } from './RecipeInfoComponents';

interface RecipeInfoProps {
  prepTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  averageRating: number;
  totalVotes: number;
  className?: string;
}

export default function RecipeInfo({ 
  prepTime, 
  difficulty, 
  averageRating, 
  totalVotes, 
  className = '' 
}: RecipeInfoProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Informacje o przepisie</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="flex flex-col items-center sm:items-start">
          <span className="text-sm font-medium text-gray-500 mb-2">Czas przygotowania</span>
          <PrepTimeDisplay prepTime={prepTime} />
        </div>
        
        <div className="flex flex-col items-center sm:items-start">
          <span className="text-sm font-medium text-gray-500 mb-2">Poziom trudności</span>
          <DifficultyBadge difficulty={difficulty} />
        </div>
        
        <div className="flex flex-col items-center sm:items-start">
          <span className="text-sm font-medium text-gray-500 mb-2">Ocena użytkowników</span>
          <RatingDisplay averageRating={averageRating} totalVotes={totalVotes} />
        </div>
      </div>
    </div>
  );
} 