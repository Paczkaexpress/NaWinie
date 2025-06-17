// Dynamic runtime configuration endpoint
export async function GET() {
  const config = {
    PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL || '',
    PUBLIC_SUPABASE_ANON_KEY: import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '',
    PUBLIC_USE_LOCAL_BACKEND: import.meta.env.PUBLIC_USE_LOCAL_BACKEND || 'false'
  };

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