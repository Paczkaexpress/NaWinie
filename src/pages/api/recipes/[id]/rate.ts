import type { APIRoute } from 'astro';
import type { RateRecipeCommand, RecipeRatingDto } from '../../../../types';

// Mock user ratings storage - replace with actual database
const userRatings: Record<string, Record<string, number>> = {};
const recipeRatings: Record<string, { total_votes: number; sum_ratings: number }> = {
  '550e8400-e29b-41d4-a716-446655440000': {
    total_votes: 23,
    sum_ratings: 103.5 // 23 votes with 4.5 average
  }
};

function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function extractUserIdFromToken(authHeader: string): string | null {
  try {
    // Basic token extraction - in real app, validate JWT properly
    const token = authHeader.replace('Bearer ', '');
    if (!token) return null;
    
    // Mock user ID extraction - replace with proper JWT validation
    // For demo purposes, return a mock user ID
    return 'user-123e4567-e89b-12d3-a456-426614174000';
  } catch {
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

  const userId = extractUserIdFromToken(authHeader);
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
    if (!recipeRatings[id]) {
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

    // Check if user already rated this recipe
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

    // Add the rating
    userRatings[id][userId] = body.rating;
    
    // Update recipe rating statistics
    const currentStats = recipeRatings[id];
    const newTotalVotes = currentStats.total_votes + 1;
    const newSumRatings = currentStats.sum_ratings + body.rating;
    const newAverageRating = newSumRatings / newTotalVotes;

    recipeRatings[id] = {
      total_votes: newTotalVotes,
      sum_ratings: newSumRatings
    };

    const result: RecipeRatingDto = {
      average_rating: Math.round(newAverageRating * 10) / 10, // Round to 1 decimal place
      total_votes: newTotalVotes
    };

    return new Response(
      JSON.stringify(result),
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