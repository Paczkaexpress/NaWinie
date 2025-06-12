import React, { useCallback } from "react";
import type { IngredientDto } from "../types";
import IngredientSearch from "./IngredientSearch";
import SelectedIngredients from "./SelectedIngredients";

export interface IngredientSelectorProps {
  selectedIngredients: IngredientDto[];
  onIngredientAdd: (ingredient: IngredientDto) => void;
  onIngredientRemove: (ingredientId: string) => void;
  onClear: () => void;
}

const IngredientSelector: React.FC<IngredientSelectorProps> = ({
  selectedIngredients,
  onIngredientAdd,
  onIngredientRemove,
  onClear,
}) => {
  /* Memoise callbacks to prevent unnecessary re-renders */
  const handleSelect = useCallback(
    (ingredient: IngredientDto) => {
      if (selectedIngredients.find((i) => i.id === ingredient.id)) return; // avoid duplicates
      onIngredientAdd(ingredient);
    },
    [onIngredientAdd, selectedIngredients]
  );

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Składniki</h2>

      {/* Search input */}
      <IngredientSearch onSelect={handleSelect} disabled={selectedIngredients.length >= 10} />

      {/* Selected ingredients list */}
      <SelectedIngredients ingredients={selectedIngredients} onRemove={onIngredientRemove} />

      {/* Clear button */}
      {selectedIngredients.length > 0 && (
        <button
          onClick={onClear}
          className="mt-2 inline-flex items-center gap-1 text-sm text-red-600 hover:underline"
        >
          Wyczyść wszystko
        </button>
      )}
    </section>
  );
};

export default IngredientSelector; 