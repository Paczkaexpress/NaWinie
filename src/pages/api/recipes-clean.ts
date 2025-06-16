import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabaseClient';
import type { CreateRecipeCommand } from '../../types';

export const POST: APIRoute = async ({ request }) => {
  console.log('🚀 CLEAN Recipe API: Starting POST request processing');
  
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

    // Ensure user exists in the users table
    console.log('👤 Checking if user exists in users table...');
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (userCheckError && userCheckError.code === 'PGRST116') {
      // User doesn't exist, create them
      console.log('👤 User not found in users table, creating...');
      const { error: userInsertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (userInsertError) {
        console.error('❌ Failed to create user:', userInsertError);
        return new Response(
          JSON.stringify({ message: 'Błąd podczas tworzenia użytkownika' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      console.log('✅ User created in users table');
    } else if (userCheckError) {
      console.error('❌ Error checking user:', userCheckError);
      return new Response(
        JSON.stringify({ message: 'Błąd podczas sprawdzania użytkownika' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('✅ User already exists in users table');
    }

    // Parse request body
    let recipeData: CreateRecipeCommand;
    let imageFile: File | null = null;

    const contentType = request.headers.get('content-type');
    console.log('📄 Content-Type:', contentType);
    
    if (contentType?.includes('multipart/form-data')) {
      console.log('📎 Processing FormData (with image)');
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

    console.log('📝 Received recipe data:', {
      name: recipeData.name,
      preparation_time_minutes: recipeData.preparation_time_minutes,
      complexity_level: recipeData.complexity_level,
      stepsCount: recipeData.steps?.length || 0,
      ingredientsCount: recipeData.ingredients?.length || 0,
      hasImage: !!imageFile
    });

    // Basic validation
    if (!recipeData.name?.trim()) {
      console.log('❌ Missing recipe name');
      return new Response(
        JSON.stringify({ message: 'Nazwa przepisu jest wymagana' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!recipeData.preparation_time_minutes || recipeData.preparation_time_minutes <= 0) {
      console.log('❌ Invalid preparation time');
      return new Response(
        JSON.stringify({ message: 'Czas przygotowania musi być liczbą większą od 0' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert complexity level to uppercase
    const complexityMap: { [key: string]: string } = {
      'EASY': 'EASY',
      'MEDIUM': 'MEDIUM', 
      'HARD': 'HARD'
    };
    const dbComplexityLevel = complexityMap[recipeData.complexity_level] || 'EASY';
    console.log('🔄 Converting complexity level:', recipeData.complexity_level, '→', dbComplexityLevel);

    // Validate steps
    if (!recipeData.steps || recipeData.steps.length === 0) {
      console.log('❌ Missing steps');
      return new Response(
        JSON.stringify({ message: 'Przepis musi zawierać co najmniej jeden krok' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate ingredients
    if (!recipeData.ingredients || recipeData.ingredients.length === 0) {
      console.log('❌ Missing ingredients');
      return new Response(
        JSON.stringify({ message: 'Przepis musi zawierać co najmniej jeden składnik' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate UUID for the recipe
    const recipeId = crypto.randomUUID();
    console.log('🆔 Generated recipe ID:', recipeId);

    // Prepare recipe data for insertion
    const recipeToInsert = {
      id: recipeId,
      name: recipeData.name.trim(),
      preparation_time_minutes: recipeData.preparation_time_minutes,
      complexity_level: dbComplexityLevel,
      steps: recipeData.steps,
      author_id: user.id
    };

    console.log('💾 Inserting recipe with data:', recipeToInsert);

    // Insert recipe into database
    const { data: recipe, error: insertError } = await supabase
      .from('recipes')
      .insert(recipeToInsert)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Recipe insert error:', insertError);
      return new Response(
        JSON.stringify({ 
          message: 'Błąd podczas zapisywania przepisu',
          error: insertError.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Recipe created successfully:', recipe.id);

         // Insert recipe ingredients
     if (recipeData.ingredients && recipeData.ingredients.length > 0) {
       const ingredientsToInsert = recipeData.ingredients.map(ingredient => ({
         id: crypto.randomUUID(), // Generate ID for recipe_ingredients table
         recipe_id: recipe.id,
         ingredient_id: ingredient.ingredient_id,
         amount: Number(ingredient.amount),
         is_optional: Boolean(ingredient.is_optional || false),
         substitute_recommendation: ingredient.substitute_recommendation?.trim() || null
       }));

      console.log('💾 Inserting recipe ingredients:', ingredientsToInsert.length, 'items');

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsToInsert);

      if (ingredientsError) {
        console.error('❌ Recipe ingredients insert error:', ingredientsError);
        
        // Delete the recipe to maintain consistency
        await supabase.from('recipes').delete().eq('id', recipe.id);
        
        return new Response(
          JSON.stringify({ 
            message: 'Błąd podczas zapisywania składników przepisu',
            error: ingredientsError.message
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Recipe ingredients saved successfully');
    }

    // Return success response
    console.log('🎉 Recipe creation completed successfully');
    return new Response(
      JSON.stringify({
        id: recipe.id,
        message: 'Przepis został pomyślnie utworzony',
        recipe: {
          id: recipe.id,
          name: recipe.name
        }
      }),
      { 
        status: 201, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Recipe creation error:', error);
    return new Response(
      JSON.stringify({ 
        message: 'Wystąpił błąd serwera',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 