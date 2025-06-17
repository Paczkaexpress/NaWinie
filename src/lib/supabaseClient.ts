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
    const config = window.__RUNTIME_CONFIG__;
    // Check if we have actual values or just placeholders
    if (config.PUBLIC_SUPABASE_URL && 
        !config.PUBLIC_SUPABASE_URL.includes('placeholder') && 
        config.PUBLIC_SUPABASE_ANON_KEY && 
        !config.PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')) {
      return config;
    }
    console.warn('Runtime config contains placeholder values, checking other sources...');
  }
  
  // Server-side rendering - use runtime environment variables first, then build-time
  if (typeof process !== 'undefined' && process.env) {
    return {
      PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL || import.meta.env?.PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_ANON_KEY: process.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env?.PUBLIC_SUPABASE_ANON_KEY,
    };
  }
  
  // Build-time fallback
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return {
      PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_ANON_KEY: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    };
  }
  
  // Final fallback for edge cases
  return {
    PUBLIC_SUPABASE_URL: undefined,
    PUBLIC_SUPABASE_ANON_KEY: undefined,
  };
}

// Get configuration from runtime or build-time
let config: { PUBLIC_SUPABASE_URL?: string; PUBLIC_SUPABASE_ANON_KEY?: string };
let supabaseUrl: string | undefined;
let supabaseAnonKey: string | undefined;

try {
  config = getRuntimeConfig();
  supabaseUrl = config.PUBLIC_SUPABASE_URL;
  supabaseAnonKey = config.PUBLIC_SUPABASE_ANON_KEY;
} catch (error) {
  console.warn('Error getting runtime config, using fallbacks:', error);
  config = {
    PUBLIC_SUPABASE_URL: undefined,
    PUBLIC_SUPABASE_ANON_KEY: undefined,
  };
  supabaseUrl = undefined;
  supabaseAnonKey = undefined;
}

// Create Supabase client with fallback URLs for development
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDYwNDg0MDAsImV4cCI6MTk2MTYyNDQwMH0.placeholder';

let supabase: ReturnType<typeof createClient>;

try {
  supabase = createClient(
    supabaseUrl || fallbackUrl, 
    supabaseAnonKey || fallbackKey
  );
} catch (error) {
  console.error('Failed to create Supabase client:', error);
  // Create a minimal fallback client
  supabase = createClient(fallbackUrl, fallbackKey);
}

// Log configuration status for debugging (only in browser)
if (typeof window !== 'undefined') {
  console.log('Supabase Configuration:', {
    urlSet: !!supabaseUrl,
    keySet: !!supabaseAnonKey,
    runtimeConfigAvailable: !!window.__RUNTIME_CONFIG__,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'Not set'
  });
  
  // Validate configuration in browser
  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = `Missing Supabase configuration:
      - PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓ Set' : '❌ Missing'}
      - PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✓ Set' : '❌ Missing'}
      
      If running in Google Cloud, ensure these environment variables are set in:
      Cloud Run > Service > Variables & Secrets`;
    
    console.error(errorMsg);
    console.warn('Supabase client will not be available. App will use mock data.');
  }
}

export { supabase }; 