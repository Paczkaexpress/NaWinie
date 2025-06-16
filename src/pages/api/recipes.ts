import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabaseClient';
import type { CreateRecipeCommand } from '../../types';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ message: 'Brak tokenu uwierzytelniania' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ message: 'Nieprawidłowy token uwierzytelniania' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    let recipeData: CreateRecipeCommand;
    let imageFile: File | null = null;

    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData (with image)
      const formData = await request.formData();
      const recipeJson = formData.get('recipe') as string;
      imageFile = formData.get('image') as File | null;
      
      if (!recipeJson) {
        return new Response(
          JSON.stringify({ message: 'Brak danych przepisu' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      recipeData = JSON.parse(recipeJson);
    } else {
      // Handle JSON (without image)
      recipeData = await request.json();
    }

    // Log received data for debugging
    console.log('Received recipe data:', {
      name: recipeData.name,
      preparation_time_minutes: recipeData.preparation_time_minutes,
      complexity_level: recipeData.complexity_level,
      stepsCount: recipeData.steps?.length || 0,
      ingredientsCount: recipeData.ingredients?.length || 0,
      hasImage: !!imageFile
    });

    // Validate required fields
    if (!recipeData.name || !recipeData.preparation_time_minutes || !recipeData.complexity_level) {
      console.error('Validation failed - missing required fields:', {
        hasName: !!recipeData.name,
        hasTime: !!recipeData.preparation_time_minutes,
        hasComplexity: !!recipeData.complexity_level
      });
      return new Response(
        JSON.stringify({ message: 'Brak wymaganych pól: nazwa, czas przygotowania, poziom trudności' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle image upload if present
    let imageData: string | null = null;
    if (imageFile && imageFile.size > 0) {
      try {
        // Convert image to base64 for storage in database
        const arrayBuffer = await imageFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const base64 = btoa(String.fromCharCode(...uint8Array));
        imageData = `data:${imageFile.type};base64,${base64}`;
        
        console.log('Image processed successfully:', {
          type: imageFile.type,
          size: imageFile.size,
          base64Length: base64.length
        });
      } catch (error) {
        console.error('Image processing error:', error);
        // Continue without image
      }
    }

    // Insert recipe into database
    const { data: recipe, error: insertError } = await supabase
      .from('recipes')
      .insert({
        name: recipeData.name.trim(),
        preparation_time_minutes: recipeData.preparation_time_minutes,
        complexity_level: recipeData.complexity_level,
        steps: recipeData.steps || [],
        image_data: imageData,
        author_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Recipe insert error:', insertError);
      console.error('Recipe data that failed to insert:', {
        name: recipeData.name.trim(),
        preparation_time_minutes: recipeData.preparation_time_minutes,
        complexity_level: recipeData.complexity_level,
        steps: recipeData.steps || [],
        author_id: user.id,
        hasImageData: !!imageData
      });
      return new Response(
        JSON.stringify({ 
          message: 'Błąd podczas zapisywania przepisu',
          error: insertError.message,
          details: insertError
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Steps are already stored in the recipe record as JSON, no separate insertion needed

    // Insert recipe ingredients
    if (recipeData.ingredients && recipeData.ingredients.length > 0) {
      const ingredientsToInsert = recipeData.ingredients.map(ingredient => ({
        recipe_id: recipe.id,
        ingredient_id: ingredient.ingredient_id,
        amount: ingredient.amount,
        is_optional: ingredient.is_optional || false,
        substitute_recommendation: ingredient.substitute_recommendation || null
      }));

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsToInsert);

      if (ingredientsError) {
        console.error('Recipe ingredients insert error:', ingredientsError);
        console.error('Ingredients data that failed to insert:', ingredientsToInsert);
        // Don't fail the entire request, but log the error
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        id: recipe.id,
        message: 'Przepis został pomyślnie utworzony',
        recipe: {
          id: recipe.id,
          name: recipe.name,
          image_data: recipe.image_data
        }
      }),
      { 
        status: 201, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Recipe creation error:', error);
    return new Response(
      JSON.stringify({ message: 'Wystąpił błąd serwera' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 