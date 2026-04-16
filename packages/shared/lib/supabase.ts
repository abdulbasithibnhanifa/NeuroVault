import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '@neurovault/shared/config/env';

let supabaseClient: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase client instance.
 * Configured with service role key for vector store operations.
 * Returns null gracefully if env vars are missing (e.g. during local build).
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = env.SUPABASE_URL as string;
  const key = env.SUPABASE_SERVICE_KEY as string;

  if (!url || !key) {
    // Don't crash — this happens during Next.js static build locally
    console.warn('Supabase: URL or Service Key missing. Client not initialized.');
    return null;
  }

  supabaseClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: globalThis.fetch,
    },
  });

  return supabaseClient;
}
