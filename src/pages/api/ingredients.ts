import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    // Extract query parameters
    const searchParams = url.searchParams;
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '100';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build backend URL
    const backendUrl = new URL('/ingredients/', import.meta.env.BACKEND_URL || 'http://localhost:8000');
    backendUrl.searchParams.set('page', page);
    backendUrl.searchParams.set('limit', limit);
    if (search) backendUrl.searchParams.set('search', search);
    backendUrl.searchParams.set('sortBy', sortBy);
    backendUrl.searchParams.set('sortOrder', sortOrder);

    console.log('Fetching ingredients from:', backendUrl.toString());

    // Forward request to backend
    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        })
      }
    });

    if (!response.ok) {
      console.error('Backend ingredients API error:', response.status, response.statusText);
      
      // Return appropriate error response
      if (response.status === 404) {
        return new Response(JSON.stringify({ error: 'Ingredients API not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ error: 'Failed to fetch ingredients' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    console.log('Ingredients fetched successfully:', data.items?.length || 0, 'items');

    // Transform backend response to match frontend types
    const transformedData = {
      data: data.items || data.data || [],
      pagination: {
        page: data.page || 1,
        limit: data.limit || 100,
        total_items: data.total || 0,
        total_pages: data.totalPages || data.total_pages || 1
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