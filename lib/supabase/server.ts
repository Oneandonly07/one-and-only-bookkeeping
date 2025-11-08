// lib/supabase/server.ts
import { createClient as createSbClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// A single server-side client (good enough for our server actions use)
const _client = createSbClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** Named export expected by the app code */
export function createClient() {
  return _client;
}

/** Optional: default export if anything imports default later */
export default _client;
