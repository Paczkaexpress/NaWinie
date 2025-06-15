import type { APIRoute } from 'astro';
import type { RateRecipeCommand, RecipeRatingDto } from '../../../../types';
import { getRecipeById } from '../../../../lib/api';
import { supabase } from '../../../../lib/supabaseClient';

// Simple in-memory tracking of user ratings to prevent duplicates
const userRatings: Record<string, Record<string, number>> = {};

function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

async function extractUserIdFromToken(authHeader: string): Promise<string | null> {
  try {
    // Extract the token
    const token = authHeader.replace('Bearer ', '');
    if (!token) return null;
    
    // In a real Supabase app, we'd validate the JWT and extract the user ID
    // For now, we'll decode it to get the user ID
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub ? `user-${payload.sub}` : null;
    } catch {
      // Fallback to mock user ID for demo purposes
      return 'user-123e4567-e89b-12d3-a456-426614174000';
    }
  } catch {
    return null;
  }
}

async function ensureRecipeExists(recipeId: string): Promise<boolean> {
  try {
    console.log('🔍 Checking if recipe exists:', recipeId);
    const recipe = await getRecipeById(recipeId);
    
    if (recipe) {
      console.log('✅ Recipe found:', {
        id: recipe.id,
        name: recipe.name,
        averageRating: recipe.average_rating,
        totalVotes: recipe.total_votes
      });
    } else {
      console.log('❌ Recipe not found');
    }
    
    return !!recipe;
  } catch (error) {
    console.error('❌ Error checking recipe existence:', error);
    return false;
  }
}

async function updateRecipeRating(recipeId: string, newRating: number): Promise<RecipeRatingDto | null> {
  try {
    // First, get the current recipe data
    const { data: currentRecipe, error: fetchError } = await supabase
      .from('recipes')
      .select('average_rating, total_votes')
      .eq('id', recipeId)
      .single();

    if (fetchError) {
      console.error('Error fetching current recipe for rating update:', fetchError);
      return null;
    }

    const currentAverage = currentRecipe.average_rating || 0;
    const currentVotes = currentRecipe.total_votes || 0;

    // Calculate new average
    const newTotalVotes = currentVotes + 1;
    const newSumRatings = (currentAverage * currentVotes) + newRating;
    const newAverageRating = newSumRatings / newTotalVotes;

    console.log('📊 Calculating new rating:', {
      currentAverage,
      currentVotes,
      newRating,
      newTotalVotes,
      newAverageRating: Math.round(newAverageRating * 10) / 10
    });

    // Update the recipe in the database
    const { data: updatedRecipe, error: updateError } = await supabase
      .from('recipes')
      .update({
        average_rating: Math.round(newAverageRating * 10) / 10,
        total_votes: newTotalVotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', recipeId)
      .select('average_rating, total_votes')
      .single();

    if (updateError) {
      console.error('Error updating recipe rating:', updateError);
      return null;
    }

    console.log('✅ Recipe rating updated in database:', updatedRecipe);

    return {
      average_rating: updatedRecipe.average_rating,
      total_votes: updatedRecipe.total_votes
    };
  } catch (error) {
    console.error('❌ Error in updateRecipeRating:', error);
    return null;
  }
}

export const POST: APIRoute = async ({ params, request }) => {
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

  // Check authentication
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({
        detail: 'Authentication required'
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  const userId = await extractUserIdFromToken(authHeader);
  if (!userId) {
    return new Response(
      JSON.stringify({
        detail: 'Invalid authentication token'
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    // Parse request body
    const body = await request.json() as RateRecipeCommand;
    
    // Validate rating value
    if (!body.rating || typeof body.rating !== 'number' || body.rating < 1 || body.rating > 5) {
      return new Response(
        JSON.stringify({
          detail: 'Rating must be a number between 1 and 5'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Check if recipe exists
    const recipeExists = await ensureRecipeExists(id);
    if (!recipeExists) {
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

    // Check if user already rated this recipe (simple in-memory check)
    if (!userRatings[id]) {
      userRatings[id] = {};
    }

    if (userRatings[id][userId]) {
      return new Response(
        JSON.stringify({
          detail: 'You have already rated this recipe'
        }),
        {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('⭐ Submitting rating:', {
      recipeId: id,
      userId: userId,
      rating: body.rating
    });

    // Update the recipe rating in the database
    const updatedRating = await updateRecipeRating(id, body.rating);
    
    if (!updatedRating) {
      throw new Error('Failed to update recipe rating in database');
    }

    // Mark that this user has rated this recipe
    userRatings[id][userId] = body.rating;

    console.log('✅ Rating submitted successfully:', updatedRating);

    return new Response(
      JSON.stringify(updatedRating),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error processing rating:', error);
    
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({
          detail: 'Invalid JSON in request body'
        }),
        {
          status: 400,
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