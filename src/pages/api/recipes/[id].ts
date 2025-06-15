import type { APIRoute } from 'astro';
import { getRecipeById } from '../../../lib/api';

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
    // Use the new API function that handles HTTP API -> Supabase -> mock data fallback
    const recipe = await getRecipeById(id);

    // Debug: Log the recipe data to see what we're getting
    console.log('Recipe data received:', {
      name: recipe.name,
      stepsType: typeof recipe.steps,
      stepsValue: recipe.steps,
      ingredientsType: typeof recipe.ingredients,
      ingredientsLength: recipe.ingredients?.length,
      ingredientsValue: recipe.ingredients
    });

    // Validate recipe data completeness
    if (!recipe.name) {
      console.error(`Missing recipe name for ID: ${id}`);
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

    if (!recipe.steps || recipe.steps.length === 0) {
      console.error(`Missing or empty steps for recipe ID: ${id}`);
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

    if (!recipe.ingredients) {
      console.error(`Missing ingredients for recipe ID: ${id}`);
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
    
    // Check if it's a "Recipe not found" error
    if (error instanceof Error && error.message === 'Recipe not found') {
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