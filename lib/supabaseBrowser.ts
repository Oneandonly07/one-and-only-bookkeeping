// lib/supabaseBrowser.ts
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client (for Client Components).
 * Uses NEXT_PUBLIC_* env vars (safe for the browser).
 */
function _createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Check your .env.local."
    );
  }

  // No cookies object needed on the browser client.
  return createBrowserClient(supabaseUrl, supabaseKey) as unknown as SupabaseClient;
}

// Export BOTH default and named to satisfy any import style.
export default _createClient;
export const createClient = _createClient;
export const createBrowserSupabase = _createClient;

export type { SupabaseClient };
