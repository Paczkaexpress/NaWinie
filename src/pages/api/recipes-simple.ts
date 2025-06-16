import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabaseClient';

export const POST: APIRoute = async ({ request }) => {
  console.log('🚀 SIMPLE Recipe API: Starting...');
  
  try {
    // Basic auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ No auth header');
      return new Response(JSON.stringify({ error: 'No auth' }), { status: 401 });
    }

    const token = authHeader.substring(7);
    console.log('🔑 Token length:', token.length);

    // Verify token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.log('❌ Auth failed:', authError?.message);
      return new Response(JSON.stringify({ error: 'Auth failed' }), { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Parse body
    const contentType = request.headers.get('content-type');
    console.log('📄 Content-Type:', contentType);

    let recipeData: any;
    if (contentType?.includes('multipart/form-data')) {
      console.log('📎 FormData detected');
      const formData = await request.formData();
      const recipeJson = formData.get('recipe') as string;
      if (!recipeJson) {
        console.log('❌ No recipe in FormData');
        return new Response(JSON.stringify({ error: 'No recipe data' }), { status: 400 });
      }
      recipeData = JSON.parse(recipeJson);
    } else {
      console.log('📋 JSON detected');
      recipeData = await request.json();
    }

    console.log('📝 Recipe data:', {
      name: recipeData.name,
      complexity_level: recipeData.complexity_level,
      hasSteps: !!recipeData.steps,
      hasIngredients: !!recipeData.ingredients
    });

    // First, let's check what complexity levels exist in the database
    console.log('🔍 Checking existing recipes for complexity levels...');
    const { data: existingRecipes } = await supabase
      .from('recipes')
      .select('complexity_level')
      .limit(5);
    
    console.log('📊 Existing complexity levels:', existingRecipes?.map(r => r.complexity_level));

    // Convert complexity level to uppercase to match database enum
    const complexityMap: { [key: string]: string } = {
      'EASY': 'EASY',
      'MEDIUM': 'MEDIUM', 
      'HARD': 'HARD'
    };
    
    let complexityToUse = complexityMap[recipeData.complexity_level] || 'EASY';
    console.log('🔄 Converting complexity level:', recipeData.complexity_level, '→', complexityToUse);
    
    // Insert with uppercase complexity level
    const { data: recipe, error: insertError } = await supabase
      .from('recipes')
      .insert({
        name: recipeData.name || 'Test Recipe',
        preparation_time_minutes: recipeData.preparation_time_minutes || 30,
        complexity_level: complexityToUse,
        steps: recipeData.steps || [{ step: 1, description: 'Test step' }],
        author_id: user.id
      })
      .select()
      .single();

    if (insertError) {
      console.log('❌ Insert error:', insertError);
      return new Response(JSON.stringify({ 
        error: 'Insert failed', 
        details: insertError.message 
      }), { status: 500 });
    }

    console.log('✅ Recipe created:', recipe.id);
    
    return new Response(JSON.stringify({ 
      success: true, 
      id: recipe.id,
      message: 'Recipe created successfully'
    }), { status: 201 });

  } catch (error) {
    console.log('💥 Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown'
    }), { status: 500 });
  }
}; 