import React from "react";
import type { RecipeListItemDto } from "../types";

export interface RecipeCardProps {
  recipe: RecipeListItemDto;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  return (
    <article
      className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => (window.location.href = `/recipes/${recipe.id}`)}
    >
      {/* Placeholder image */}
      <div className="h-40 bg-gray-200" />

      {/* Content */}
      <div className="p-4 space-y-1">
        <h3 className="font-semibold text-lg truncate" title={recipe.name}>
          {recipe.name}
        </h3>
        <p className="text-sm text-gray-600">
          Czas przygotowania: {recipe.preparation_time_minutes} min
        </p>
        <p className="text-sm text-gray-600">
          Ocena: {recipe.average_rating ?? "-"} / 5
        </p>
      </div>
    </article>
  );
};

export default RecipeCard; 