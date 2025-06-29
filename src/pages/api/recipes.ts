import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabaseClient';
import type { CreateRecipeCommand } from '../../types';

export const POST: APIRoute = async ({ request }) => {
  console.log('🚀 Recipe API: Starting POST request processing');
  
  try {
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

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
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

    // Parse request body
    let recipeData: CreateRecipeCommand;
    let imageFile: File | null = null;

    const contentType = request.headers.get('content-type');
    console.log('📄 Content-Type:', contentType);
    
    if (contentType?.includes('multipart/form-data')) {
      console.log('📎 Processing FormData (with image)');
      // Handle FormData (with image)
      const formData = await request.formData();
      const recipeJson = formData.get('recipe') as string;
      imageFile = formData.get('image') as File | null;
      
      console.log('📋 Recipe JSON present:', !!recipeJson);
      console.log('🖼️ Image file present:', !!imageFile);
      
      if (!recipeJson) {
        console.log('❌ Missing recipe data in FormData');
        return new Response(
          JSON.stringify({ message: 'Brak danych przepisu' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      try {
        recipeData = JSON.parse(recipeJson);
        console.log('✅ Recipe data parsed successfully');
      } catch (parseError) {
        console.log('❌ Failed to parse recipe JSON:', parseError);
        return new Response(
          JSON.stringify({ message: 'Nieprawidłowy format danych przepisu' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log('📋 Processing JSON (without image)');
      // Handle JSON (without image)
      try {
        recipeData = await request.json();
        console.log('✅ JSON data parsed successfully');
      } catch (parseError) {
        console.log('❌ Failed to parse JSON:', parseError);
        return new Response(
          JSON.stringify({ message: 'Nieprawidłowy format JSON' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
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
    if (!recipeData.name?.trim() || !recipeData.preparation_time_minutes || !recipeData.complexity_level) {
      console.error('Validation failed - missing required fields:', {
        hasName: !!recipeData.name?.trim(),
        hasTime: !!recipeData.preparation_time_minutes,
        hasComplexity: !!recipeData.complexity_level
      });
      return new Response(
        JSON.stringify({ message: 'Brak wymaganych pól: nazwa, czas przygotowania, poziom trudności' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate data types and ranges
    if (typeof recipeData.preparation_time_minutes !== 'number' || recipeData.preparation_time_minutes <= 0) {
      return new Response(
        JSON.stringify({ message: 'Czas przygotowania musi być liczbą większą od 0' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!['easy', 'medium', 'hard'].includes(recipeData.complexity_level)) {
      return new Response(
        JSON.stringify({ message: 'Nieprawidłowy poziom trudności. Dozwolone wartości: easy, medium, hard' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert complexity level to uppercase to match database enum
    const complexityMap: { [key: string]: string } = {
      'easy': 'EASY',
      'medium': 'MEDIUM', 
      'hard': 'HARD'
    };
    const dbComplexityLevel = complexityMap[recipeData.complexity_level] || 'EASY';

    // Validate steps array
    if (!recipeData.steps || !Array.isArray(recipeData.steps) || recipeData.steps.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Przepis musi zawierać co najmniej jeden krok' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate each step
    for (let i = 0; i < recipeData.steps.length; i++) {
      const step = recipeData.steps[i];
      if (!step.description?.trim()) {
        return new Response(
          JSON.stringify({ message: `Krok ${i + 1} nie może być pusty` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate ingredients array
    if (!recipeData.ingredients || !Array.isArray(recipeData.ingredients) || recipeData.ingredients.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Przepis musi zawierać co najmniej jeden składnik' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate each ingredient
    for (const ingredient of recipeData.ingredients) {
      if (!ingredient.ingredient_id) {
        return new Response(
          JSON.stringify({ message: 'Wszystkie składniki muszą mieć wybrane nazwy' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (!ingredient.amount || ingredient.amount <= 0) {
        return new Response(
          JSON.stringify({ message: 'Wszystkie składniki muszą mieć podaną ilość większą od 0' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
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

    // Prepare recipe data for insertion (excluding image_data for now)
    const recipeToInsert = {
      name: recipeData.name.trim(),
      preparation_time_minutes: recipeData.preparation_time_minutes,
      complexity_level: dbComplexityLevel, // Use uppercase value for database
      steps: recipeData.steps || [],
      author_id: user.id
      // TODO: Add image_data back once column is confirmed to exist in database
      // ...(imageData && { image_data: imageData })
    };

    console.log('Inserting recipe with data:', {
      ...recipeToInsert,
      image_data: imageData ? `[Base64 data: ${imageData.substring(0, 50)}...]` : null
    });

    // Insert recipe into database
    const { data: recipe, error: insertError } = await supabase
      .from('recipes')
      .insert(recipeToInsert)
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
      
      // Provide more specific error messages
      let errorMessage = 'Błąd podczas zapisywania przepisu';
      if (insertError.message?.includes('violates check constraint')) {
        errorMessage = 'Nieprawidłowe dane przepisu - sprawdź czy wszystkie pola są wypełnione poprawnie';
      } else if (insertError.message?.includes('not-null constraint')) {
        errorMessage = 'Brakuje wymaganych informacji o przepisie';
      } else if (insertError.message?.includes('foreign key')) {
        errorMessage = 'Problem z powiązanymi danymi - sprawdź czy użytkownik jest zalogowany';
      } else if (insertError.message?.includes('column') && insertError.message?.includes('does not exist')) {
        errorMessage = 'Problem ze strukturą bazy danych - brakuje kolumny';
      } else if (insertError.message?.includes('complexity_level')) {
        errorMessage = 'Nieprawidłowy poziom trudności';
      }
      
      return new Response(
        JSON.stringify({ 
          message: errorMessage,
          error: insertError.message
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
        amount: Number(ingredient.amount),
        is_optional: Boolean(ingredient.is_optional || false),
        substitute_recommendation: ingredient.substitute_recommendation?.trim() || null
      }));

      console.log('Inserting recipe ingredients:', ingredientsToInsert);

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsToInsert);

      if (ingredientsError) {
        console.error('Recipe ingredients insert error:', ingredientsError);
        console.error('Ingredients data that failed to insert:', ingredientsToInsert);
        
        // If ingredients fail to insert, delete the recipe to maintain consistency
        await supabase.from('recipes').delete().eq('id', recipe.id);
        
        return new Response(
          JSON.stringify({ 
            message: 'Błąd podczas zapisywania składników przepisu. Sprawdź czy wszystkie składniki są poprawnie wybrane i mają podane ilości.',
            error: ingredientsError.message
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
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
    console.error('💥 Recipe creation error:', error);
    console.error('💥 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return new Response(
      JSON.stringify({ 
        message: 'Wystąpił błąd serwera',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 