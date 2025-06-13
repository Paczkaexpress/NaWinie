import React, { useEffect, useState } from "react";
import type { IngredientDto } from "../types";
import useIngredientsSearch from "../hooks/useIngredientsSearch";
import Combobox from "./ui/Combobox";

export interface IngredientSearchProps {
  onSelect: (ingredient: IngredientDto) => void;
  disabled?: boolean;
}

const IngredientSearch: React.FC<IngredientSearchProps> = ({ onSelect, disabled }) => {
  const [input, setInput] = useState("");

  const { suggestions, isLoading } = useIngredientsSearch(input);

  // Map suggestions to Combobox options
  const options = suggestions.map((s) => ({ label: s.name, value: s.id }));

  // Reset local input when suggestions cleared
  useEffect(() => {
    if (!input) return;
  }, [input]);

  return (
    <Combobox
      options={options}
      placeholder="Szukaj składników..."
      disabled={disabled}
      isLoading={isLoading}
      onInputChange={setInput}
      onSelect={(opt) => {
        const ing = suggestions.find((i) => i.id === opt.value);
        if (ing) {
          onSelect(ing);
          setInput("");
        }
      }}
    />
  );
};

export default IngredientSearch; 