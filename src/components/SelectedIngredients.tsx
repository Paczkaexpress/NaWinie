import React from "react";
import type { IngredientDto } from "../types";

export interface SelectedIngredientsProps {
  ingredients: IngredientDto[];
  onRemove: (ingredientId: string) => void;
}

const SelectedIngredients: React.FC<SelectedIngredientsProps> = ({ ingredients, onRemove }) => {
  if (ingredients.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {ingredients.map((ing) => (
        <li
          key={ing.id}
          className="inline-flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-sm animate-in fade-in zoom-in-50"
        >
          {ing.name}
          <button
            onClick={() => onRemove(ing.id)}
            className="ml-2 text-primary-foreground hover:text-red-600"
            aria-label={`Usuń ${ing.name}`}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
};

export default SelectedIngredients; 