// Phase 2: Standard Supabase browser client
// Uses environment variables from .env.local
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Browser-side client using NEXT_PUBLIC env variables
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
