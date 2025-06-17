import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    // Check environment variables
    const config = {
      PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL || 'Not set',
      PUBLIC_SUPABASE_ANON_KEY: import.meta.env.PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
      PUBLIC_USE_LOCAL_BACKEND: import.meta.env.PUBLIC_USE_LOCAL_BACKEND || 'false',
      NODE_ENV: import.meta.env.NODE_ENV || 'Not set',
      MODE: import.meta.env.MODE || 'Not set',
    };

    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config,
      message: 'Frontend health check passed'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Frontend health check failed'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}; 