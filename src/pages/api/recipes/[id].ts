import type { APIRoute } from 'astro';
import type { RecipeDetailDto } from '../../../types';

// Mock data for development - replace with actual database calls
const mockRecipeData: Record<string, RecipeDetailDto> = {
  '550e8400-e29b-41d4-a716-446655440000': {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Klasyczne naleśniki',
    preparation_time_minutes: 30,
    complexity_level: 'easy',
    author_id: '123e4567-e89b-12d3-a456-426614174000',
    average_rating: 4.5,
    total_votes: 23,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T14:30:00Z',
    image_data: undefined,
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
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        ingredient_id: '123e4567-e89b-12d3-a456-426614174001',
        amount: 200,
        is_optional: false,
        substitute_recommendation: null,
        name: 'Mąka pszenna',
        unit_type: 'g'
      },
      {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        ingredient_id: '123e4567-e89b-12d3-a456-426614174002',
        amount: 300,
        is_optional: false,
        substitute_recommendation: 'mleko roślinne',
        name: 'Mleko',
        unit_type: 'ml'
      },
      {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        ingredient_id: '123e4567-e89b-12d3-a456-426614174003',
        amount: 2,
        is_optional: false,
        substitute_recommendation: null,
        name: 'Jajka',
        unit_type: 'szt'
      },
      {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        ingredient_id: '123e4567-e89b-12d3-a456-426614174004',
        amount: 2,
        is_optional: false,
        substitute_recommendation: null,
        name: 'Cukier',
        unit_type: 'łyżki'
      },
      {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        ingredient_id: '123e4567-e89b-12d3-a456-426614174005',
        amount: 1,
        is_optional: true,
        substitute_recommendation: 'cynamon',
        name: 'Wanilia',
        unit_type: 'łyżeczki'
      }
    ]
  }
};

function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export const GET: APIRoute = async ({ params, request }) => {
  const { id } = params;

  // Validate UUID format
  if (!id || !validateUUID(id)) {
    return new Response(
      JSON.stringify({
        detail: [
          {
            loc: ['path', 'id'],
            msg: 'value is not a valid uuid',
            type: 'type_error.uuid'
          }
        ]
      }),
      {
        status: 422,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    // In a real implementation, this would query the database
    // For now, using mock data
    const recipe = mockRecipeData[id];

    if (!recipe) {
      return new Response(
        JSON.stringify({
          detail: 'Recipe not found'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Validate recipe data completeness
    if (!recipe.name || !recipe.steps || !recipe.ingredients) {
      console.error(`Incomplete recipe data for ID: ${id}`);
      return new Response(
        JSON.stringify({
          detail: 'Internal server error'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Validate ingredients data
    for (const ingredient of recipe.ingredients) {
      if (!ingredient.name || ingredient.amount <= 0) {
        console.error(`Invalid ingredient data in recipe ${id}:`, ingredient);
        return new Response(
          JSON.stringify({
            detail: 'Internal server error'
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Validate steps data
    const sortedSteps = recipe.steps.sort((a, b) => a.step - b.step);
    for (let i = 0; i < sortedSteps.length; i++) {
      if (sortedSteps[i].step !== i + 1 || !sortedSteps[i].description) {
        console.error(`Invalid steps data in recipe ${id}:`, sortedSteps);
        return new Response(
          JSON.stringify({
            detail: 'Internal server error'
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Return successful response
    return new Response(
      JSON.stringify(recipe),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        },
      }
    );

  } catch (error) {
    console.error('Error fetching recipe:', error);
    return new Response(
      JSON.stringify({
        detail: 'Internal server error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}; 