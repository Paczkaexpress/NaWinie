import { useState } from 'react';

interface Ingredient {
  id: number;
  name: string;
  isCommon: boolean;
}

export default function RecipeGenerator() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newIngredient, setNewIngredient] = useState('');

  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([
        ...ingredients,
        {
          id: Date.now(),
          name: newIngredient.trim(),
          isCommon: false,
        },
      ]);
      setNewIngredient('');
    }
  };

  const handleRemoveIngredient = (id: number) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Ingredients</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddIngredient()}
            placeholder="Add an ingredient..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleAddIngredient}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Add
          </button>
        </div>
        
        <div className="space-y-2">
          {ingredients.map((ingredient) => (
            <div
              key={ingredient.id}
              className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg"
            >
              <span>{ingredient.name}</span>
              <button
                onClick={() => handleRemoveIngredient(ingredient.id)}
                className="text-destructive hover:text-destructive/80 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {ingredients.length > 0 && (
        <button
          className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Find Recipes
        </button>
      )}
    </div>
  );
} 