import { createClient } from '@supabase/supabase-js'

// Read public values injected by Astro / Vite (must start with PUBLIC_ to reach the browser)
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars: PUBLIC_SUPABASE_URL and/or PUBLIC_SUPABASE_ANON_KEY are not set.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 