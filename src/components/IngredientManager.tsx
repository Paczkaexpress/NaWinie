import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';

interface Ingredient {
  id: string;
  name: string;
  isPantryStaple: boolean;
}

export default function IngredientManager() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [isPantryStaple, setIsPantryStaple] = useState(false);

  const addIngredient = () => {
    if (!newIngredient.trim()) return;

    const ingredient: Ingredient = {
      id: crypto.randomUUID(),
      name: newIngredient.trim(),
      isPantryStaple,
    };

    setIngredients([...ingredients, ingredient]);
    setNewIngredient('');
    setIsPantryStaple(false);
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  const togglePantryStaple = (id: string) => {
    setIngredients(
      ingredients.map((ing) =>
        ing.id === id ? { ...ing, isPantryStaple: !ing.isPantryStaple } : ing
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="ingredient">Add Ingredient</Label>
            <Input
              id="ingredient"
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              placeholder="Enter ingredient name"
              onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
            />
          </div>
          <div className="flex items-end">
            <div className="flex items-center space-x-2">
              <Switch
                id="pantry-staple"
                checked={isPantryStaple}
                onCheckedChange={setIsPantryStaple}
              />
              <Label htmlFor="pantry-staple">Pantry Staple</Label>
            </div>
          </div>
          <div className="flex items-end">
            <Button onClick={addIngredient}>Add</Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Your Ingredients
        </h3>
        
        {ingredients.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            No ingredients added yet. Start by adding some ingredients above!
          </p>
        ) : (
          <div className="grid gap-4">
            {ingredients.map((ingredient) => (
              <div
                key={ingredient.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-gray-900 dark:text-white">
                    {ingredient.name}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`pantry-${ingredient.id}`}
                      checked={ingredient.isPantryStaple}
                      onCheckedChange={() => togglePantryStaple(ingredient.id)}
                    />
                    <Label htmlFor={`pantry-${ingredient.id}`}>Pantry Staple</Label>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeIngredient(ingredient.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 