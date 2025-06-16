import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabaseClient';

export const DELETE: APIRoute = async ({ params, request }) => {
  console.log('🗑️ DELETE Recipe API: Starting DELETE request processing');
  
  try {
    const recipeId = params.id;
    console.log('🆔 Recipe ID to delete:', recipeId);

    if (!recipeId) {
      console.log('❌ Missing recipe ID');
      return new Response(
        JSON.stringify({ message: 'ID przepisu jest wymagane' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    console.log('🔐 Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ message: 'Brak tokenu uwierzytelniania' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);
    console.log('🔑 Token extracted, length:', token.length);

    // Verify the token with Supabase
    console.log('🔍 Verifying token with Supabase...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('❌ Auth verification failed:', authError?.message);
      return new Response(
        JSON.stringify({ message: 'Nieprawidłowy token uwierzytelniania' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ User authenticated:', user.id);

    // Check if recipe exists and get the author_id
    console.log('🔍 Checking if recipe exists and getting author...');
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('id, name, author_id')
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      console.log('❌ Recipe not found:', recipeError?.message);
      return new Response(
        JSON.stringify({ message: 'Przepis nie został znaleziony' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Recipe found:', recipe.name, 'by author:', recipe.author_id);

    // Check if the current user is the author of the recipe
    if (recipe.author_id !== user.id) {
      console.log('❌ User is not the author of the recipe');
      return new Response(
        JSON.stringify({ message: 'Nie masz uprawnień do usunięcia tego przepisu' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User authorized to delete recipe');

    // Delete related recipe ingredients first (due to foreign key constraints)
    console.log('🗑️ Deleting recipe ingredients...');
    const { error: ingredientsDeleteError } = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', recipeId);

    if (ingredientsDeleteError) {
      console.error('❌ Failed to delete recipe ingredients:', ingredientsDeleteError);
      return new Response(
        JSON.stringify({ message: 'Błąd podczas usuwania składników przepisu' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Recipe ingredients deleted successfully');

    // Delete recipe ratings (if any)
    console.log('🗑️ Deleting recipe ratings...');
    const { error: ratingsDeleteError } = await supabase
      .from('recipe_ratings')
      .delete()
      .eq('recipe_id', recipeId);

    if (ratingsDeleteError) {
      console.error('❌ Failed to delete recipe ratings:', ratingsDeleteError);
      // Don't fail the operation if ratings deletion fails - continue with recipe deletion
      console.log('⚠️ Continuing with recipe deletion despite ratings deletion error');
    } else {
      console.log('✅ Recipe ratings deleted successfully');
    }

    // Finally, delete the recipe itself
    console.log('🗑️ Deleting recipe...');
    const { error: recipeDeleteError } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId);

    if (recipeDeleteError) {
      console.error('❌ Failed to delete recipe:', recipeDeleteError);
      return new Response(
        JSON.stringify({ message: 'Błąd podczas usuwania przepisu' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Recipe deleted successfully:', recipe.name);

    return new Response(
      JSON.stringify({ 
        message: 'Przepis został pomyślnie usunięty',
        recipe_name: recipe.name 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Unexpected error during recipe deletion:', error);
    
    return new Response(
      JSON.stringify({ 
        message: 'Wystąpił nieoczekiwany błąd podczas usuwania przepisu',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}; 