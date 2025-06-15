import type { RecipeListItemDto, PaginatedRecipesDto, IngredientDto, PaginatedIngredientsDto, RecipeDetailDto } from '../types';

// Sample base64 encoded 1x1 pixel images for mock data
const sampleImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

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
    image_data: sampleImageData,
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
    image_data: sampleImageData,
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
    image_data: sampleImageData,
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
    image_data: sampleImageData,
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

// Mock detailed recipes for getRecipeById
const mockDetailedRecipes: Record<string, RecipeDetailDto> = {
  '0616235a-41a0-4f9d-b418-73e3b070c45a': {
    id: '0616235a-41a0-4f9d-b418-73e3b070c45a',
    name: 'Klasyczne naleśniki',
    preparation_time_minutes: 30,
    complexity_level: 'easy',
    author_id: '123e4567-e89b-12d3-a456-426614174000',
    average_rating: 4.5,
    total_votes: 23,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T14:30:00Z',
    image_data: sampleImageData,
    steps: [
      { step: 1, description: 'W misce wymieszaj mąkę, cukier, sól i proszek do pieczenia.' },
      { step: 2, description: 'W osobnej misce ubij jajka z mlekiem i roztopionymi masłem.' },
      { step: 3, description: 'Połącz składniki suche z mokrymi, mieszając do uzyskania gładkiego ciasta.' },
      { step: 4, description: 'Rozgrzej patelnię na średnim ogniu i posmaruj olejem.' },
      { step: 5, description: 'Wylej porcję ciasta na patelnię i smaż z obu stron na złoty kolor.' },
      { step: 6, description: 'Podawaj gorące z ulubionym dodatkiem.' }
    ],
    ingredients: [
      {
        recipe_id: '0616235a-41a0-4f9d-b418-73e3b070c45a',
        ingredient_id: '123e4567-e89b-12d3-a456-426614174001',
        amount: 200,
        is_optional: false,
        substitute_recommendation: null,
        name: 'Mąka pszenna',
        unit_type: 'g'
      },
      {
        recipe_id: '0616235a-41a0-4f9d-b418-73e3b070c45a',
        ingredient_id: '123e4567-e89b-12d3-a456-426614174002',
        amount: 300,
        is_optional: false,
        substitute_recommendation: 'mleko roślinne',
        name: 'Mleko',
        unit_type: 'ml'
      },
      {
        recipe_id: '0616235a-41a0-4f9d-b418-73e3b070c45a',
        ingredient_id: '123e4567-e89b-12d3-a456-426614174003',
        amount: 2,
        is_optional: false,
        substitute_recommendation: null,
        name: 'Jajka',
        unit_type: 'szt'
      },
      {
        recipe_id: '0616235a-41a0-4f9d-b418-73e3b070c45a',
        ingredient_id: '123e4567-e89b-12d3-a456-426614174004',
        amount: 2,
        is_optional: false,
        substitute_recommendation: null,
        name: 'Cukier',
        unit_type: 'łyżki'
      },
      {
        recipe_id: '0616235a-41a0-4f9d-b418-73e3b070c45a',
        ingredient_id: '123e4567-e89b-12d3-a456-426614174005',
        amount: 1,
        is_optional: true,
        substitute_recommendation: 'cynamon',
        name: 'Wanilia',
        unit_type: 'łyżeczki'
      }
    ]
  },
  '550e8400-e29b-41d4-a716-446655440000': {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Spaghetti Carbonara',
    preparation_time_minutes: 25,
    complexity_level: 'medium',
    author_id: '123e4567-e89b-12d3-a456-426614174000',
    average_rating: 4.7,
    total_votes: 18,
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-15T16:45:00Z',
    image_data: sampleImageData,
    steps: [
      { step: 1, description: 'Ugotuj makaron spaghetti według instrukcji na opakowaniu.' },
      { step: 2, description: 'Podsmaż boczek na patelni do momentu, aż stanie się chrupiący.' },
      { step: 3, description: 'W misce wymieszaj jajka z tartym parmezanem.' },
      { step: 4, description: 'Odcedź makaron, zachowując trochę wody z gotowania.' },
      { step: 5, description: 'Wymieszaj gorący makaron z mieszanką jajeczno-serową.' },
      { step: 6, description: 'Dodaj boczek i dopraw pieprzem. Podawaj natychmiast.' }
    ],
    ingredients: [
      {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        ingredient_id: '11',
        amount: 400,
        is_optional: false,
        substitute_recommendation: null,
        name: 'Makaron spaghetti',
        unit_type: 'g'
      },
      {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        ingredient_id: '13',
        amount: 150,
        is_optional: false,
        substitute_recommendation: 'pancetta',
        name: 'Boczek',
        unit_type: 'g'
      },
      {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        ingredient_id: '1',
        amount: 3,
        is_optional: false,
        substitute_recommendation: null,
        name: 'Jajka',
        unit_type: 'szt'
      },
      {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        ingredient_id: '12',
        amount: 100,
        is_optional: false,
        substitute_recommendation: 'pecorino',
        name: 'Ser parmezan',
        unit_type: 'g'
      }
    ]
  }
};

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

export function getMockRecipeById(id: string): RecipeDetailDto {
  const recipe = mockDetailedRecipes[id];
  if (!recipe) {
    throw new Error('Recipe not found');
  }
  return recipe;
} 