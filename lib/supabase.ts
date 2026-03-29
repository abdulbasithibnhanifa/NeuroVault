import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/config/env';

let supabaseClient: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase client instance.
 * Configured with service role key for vector store operations.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const url = env.SUPABASE_URL as string;
    const key = env.SUPABASE_SERVICE_KEY as string;
    
    if (!url || !key) {
      console.error('Supabase URL or Service Key missing!');
    }
    console.log(`Initializing Supabase client with URL: ${url}`);
    console.log(`Service Key present: ${!!key} (Starts with: ${key?.substring(0, 5)}...)`);
    
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: globalThis.fetch,
      },
    });
  }

  return supabaseClient;
}
