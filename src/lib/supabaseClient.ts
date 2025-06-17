import { createClient } from '@supabase/supabase-js'

// Runtime configuration that will be injected by Docker container
declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      PUBLIC_SUPABASE_URL?: string;
      PUBLIC_SUPABASE_ANON_KEY?: string;
      PUBLIC_USE_LOCAL_BACKEND?: string;
    };
  }
}

// Get runtime configuration with fallbacks
function getRuntimeConfig() {
  // Browser environment - use runtime config if available
  if (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) {
    return window.__RUNTIME_CONFIG__;
  }
  
  // Build-time environment variables (fallback)
  return {
    PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  };
}

// Get configuration from runtime or build-time
const config = getRuntimeConfig();
const supabaseUrl = config.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = config.PUBLIC_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = `Missing Supabase configuration:
    - PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓ Set' : '❌ Missing'}
    - PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✓ Set' : '❌ Missing'}
    
    If running in Google Cloud, ensure these environment variables are set in:
    Cloud Run > Service > Variables & Secrets`;
  
  console.error(errorMsg);
  
  // Don't throw in production, allow app to continue with mock data
  if (typeof window !== 'undefined') {
    console.warn('Supabase client will not be available. App will use mock data.');
  }
}

// Create Supabase client with fallback URLs for development
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder-key';

export const supabase = createClient(
  supabaseUrl || fallbackUrl, 
  supabaseAnonKey || fallbackKey
);

// Log configuration status for debugging
if (typeof window !== 'undefined') {
  console.log('Supabase Configuration:', {
    urlSet: !!supabaseUrl,
    keySet: !!supabaseAnonKey,
    runtimeConfigAvailable: !!window.__RUNTIME_CONFIG__,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'Not set'
  });
} 