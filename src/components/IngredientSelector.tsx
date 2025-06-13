import React, { useCallback } from "react";
import type { IngredientDto } from "../types";
import IngredientSearch from "./IngredientSearch";
import SelectedIngredients from "./SelectedIngredients";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  Search, 
  ClipboardList, 
  CheckCircle, 
  Trash2, 
  AlertCircle,
  ChefHat
} from "lucide-react";

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
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <ChefHat className="h-4 w-4 text-primary" />
            </div>
            Składniki
          </CardTitle>
          <CardDescription>
            Znajdź i dodaj składniki do swojego przepisu
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Search Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-muted-foreground" />
            Wyszukaj składniki
          </CardTitle>
        </CardHeader>
        <CardContent>
          <IngredientSearch onSelect={handleSelect} disabled={selectedIngredients.length >= 10} />
          {selectedIngredients.length >= 10 && (
            <div className="mt-3 flex items-center gap-2 text-amber-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Maksimum 10 składników</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Ingredients Card */}
      {selectedIngredients.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Wybrane składniki
              </div>
              <Badge variant="secondary">
                {selectedIngredients.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SelectedIngredients ingredients={selectedIngredients} onRemove={onIngredientRemove} />
            
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              className="w-full mt-4 text-destructive border-destructive/20 hover:bg-destructive/5"
            >
              <Trash2 className="h-4 w-4" />
              Wyczyść wszystko
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {selectedIngredients.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground font-medium">
              Brak wybranych składników
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Użyj wyszukiwarki powyżej aby dodać składniki
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IngredientSelector; 