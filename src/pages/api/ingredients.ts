import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabaseClient';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    // Extract query parameters
    const searchParams = url.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    console.log('Fetching ingredients from Supabase with params:', { page, limit, search, sortBy, sortOrder });

    // Build Supabase query
    let supabaseQuery = supabase
      .from('ingredients')
      .select('*', { count: 'exact' });

    // Add search filter if query is provided
    if (search && search.length >= 2) {
      supabaseQuery = supabaseQuery.ilike('name', `%${search}%`);
    }

    // Add sorting
    const ascending = sortOrder === 'asc';
    supabaseQuery = supabaseQuery.order(sortBy, { ascending });

    // Add pagination
    const { data, error: supabaseError, count } = await supabaseQuery
      .range((page - 1) * limit, page * limit - 1);

    if (supabaseError) {
      console.error('Supabase ingredients API error:', supabaseError);
      throw supabaseError;
    }

    const totalPages = Math.ceil((count || 0) / limit);

    console.log('Ingredients fetched successfully from Supabase:', data?.length || 0, 'items');

    const transformedData = {
      data: data || [],
      pagination: {
        page,
        limit,
        total_items: count || 0,
        total_pages: totalPages
      }
    };

    return new Response(JSON.stringify(transformedData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ingredients API:', error);
    
    // Return mock data for development if backend is not available
    const mockIngredients = {
      data: [
        { id: '1', name: 'Mąka', unit_type: 'g', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '2', name: 'Cukier', unit_type: 'g', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '3', name: 'Jajka', unit_type: 'szt', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '4', name: 'Masło', unit_type: 'g', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '5', name: 'Mleko', unit_type: 'ml', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '6', name: 'Sól', unit_type: 'g', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '7', name: 'Pieprz', unit_type: 'g', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '8', name: 'Cebula', unit_type: 'szt', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '9', name: 'Czosnek', unit_type: 'ząbek', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '10', name: 'Pomidory', unit_type: 'szt', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ],
      pagination: {
        page: parseInt(url.searchParams.get('page') || '1'),
        limit: parseInt(url.searchParams.get('limit') || '100'),
        total_items: 10,
        total_pages: 1
      }
    };

    console.log('Returning mock ingredients data');
    return new Response(JSON.stringify(mockIngredients), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 