import type { RecipeListItemDto, PaginatedRecipesDto, IngredientDto, PaginatedIngredientsDto } from '../types';

const mockRecipes: RecipeListItemDto[] = [
  {
    id: '1',
    name: 'Spaghetti Carbonara',
    preparation_time_minutes: 20,
    complexity_level: 'medium',
    author_id: '1',
    average_rating: 4.5,
    total_votes: 23,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Omlet z ziołami',
    preparation_time_minutes: 10,
    complexity_level: 'easy',
    author_id: '1',
    average_rating: 4.2,
    total_votes: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Kurczak w sosie curry',
    preparation_time_minutes: 35,
    complexity_level: 'medium',
    author_id: '1',
    average_rating: 4.8,
    total_votes: 42,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Sałatka grecka',
    preparation_time_minutes: 15,
    complexity_level: 'easy',
    author_id: '1',
    average_rating: 4.3,
    total_votes: 18,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockIngredients: IngredientDto[] = [
  {
    id: '1',
    name: 'Jajka',
    unit_type: 'szt',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Mleko',
    unit_type: 'ml',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Mąka',
    unit_type: 'g',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Pomidory',
    unit_type: 'g',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Kurczak',
    unit_type: 'g',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Cebula',
    unit_type: 'szt',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Czosnek',
    unit_type: 'szt',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '8',
    name: 'Oliwa z oliwek',
    unit_type: 'ml',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '9',
    name: 'Sól',
    unit_type: 'g',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '10',
    name: 'Pieprz',
    unit_type: 'g',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '11',
    name: 'Makaron spaghetti',
    unit_type: 'g',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '12',
    name: 'Ser parmezan',
    unit_type: 'g',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '13',
    name: 'Boczek',
    unit_type: 'g',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '14',
    name: 'Mascarpone',
    unit_type: 'g',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '15',
    name: 'Ziemniaki',
    unit_type: 'g',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '16',
    name: 'Marchewka',
    unit_type: 'g',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '17',
    name: 'Papryka',
    unit_type: 'szt',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '18',
    name: 'Oliwki',
    unit_type: 'g',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '19',
    name: 'Ser feta',
    unit_type: 'g',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '20',
    name: 'Ogórek',
    unit_type: 'szt',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function getMockRecipes(page = 1, limit = 10): PaginatedRecipesDto {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = mockRecipes.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total_items: mockRecipes.length,
      total_pages: Math.ceil(mockRecipes.length / limit)
    }
  };
}

export function getMockIngredients(query: string, page = 1, limit = 10): PaginatedIngredientsDto {
  let filteredIngredients = mockIngredients;
  
  // Filter by search query if provided
  if (query && query.length >= 2) {
    const searchQuery = query.toLowerCase();
    filteredIngredients = mockIngredients.filter(ingredient =>
      ingredient.name.toLowerCase().includes(searchQuery)
    );
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredIngredients.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total_items: filteredIngredients.length,
      total_pages: Math.ceil(filteredIngredients.length / limit)
    }
  };
} 