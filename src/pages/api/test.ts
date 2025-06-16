import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  console.log('🧪 Test API: GET request received');
  
  return new Response(
    JSON.stringify({ 
      message: 'Test API is working',
      timestamp: new Date().toISOString()
    }),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
};

export const POST: APIRoute = async ({ request }) => {
  console.log('🧪 Test API: POST request received');
  
  try {
    const body = await request.json();
    console.log('🧪 Test API: Body received:', body);
    
    return new Response(
      JSON.stringify({ 
        message: 'Test POST API is working',
        receivedData: body,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.log('🧪 Test API: Error:', error);
    
    return new Response(
      JSON.stringify({ 
        message: 'Test API error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}; 