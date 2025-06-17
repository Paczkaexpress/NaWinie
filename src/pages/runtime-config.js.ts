// Dynamic runtime configuration endpoint
export async function GET() {
  // Use process.env for runtime environment variables in SSR mode
  const config = {
    PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL || '',
    PUBLIC_SUPABASE_ANON_KEY: process.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '',
    PUBLIC_USE_LOCAL_BACKEND: process.env.PUBLIC_USE_LOCAL_BACKEND || import.meta.env.PUBLIC_USE_LOCAL_BACKEND || 'false'
  };
  
  // Log for debugging (server-side)
  console.log('Runtime config endpoint called. Environment variables available:', {
    supabaseUrlSet: !!process.env.PUBLIC_SUPABASE_URL,
    supabaseKeySet: !!process.env.PUBLIC_SUPABASE_ANON_KEY,
    localBackend: process.env.PUBLIC_USE_LOCAL_BACKEND || 'not set'
  });

  const jsContent = `
window.__RUNTIME_CONFIG__ = ${JSON.stringify(config)};
console.log("✅ Runtime config loaded:", window.__RUNTIME_CONFIG__);
`;

  return new Response(jsContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
} 