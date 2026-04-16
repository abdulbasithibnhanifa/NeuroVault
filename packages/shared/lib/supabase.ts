import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Returns a Supabase client.
 * 
 * DESIGN RATIONALE:
 * During Next.js static builds, environment variables are often missing.
 * This proxy-based approach allows the client to be imported and 'touched' 
 * during build-time without crashing, but throws a clear error if any 
 * actual database operation is attempted at runtime without valid keys.
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (supabaseInstance) return supabaseInstance;

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    // Return a proxy that throws only when methods are called
    // This allows static analysis/builds to complete safely
    return new Proxy({} as SupabaseClient, {
      get: (target, prop) => {
        throw new Error(
          `Supabase error: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing. ` +
          `Check your environment variables for production.`
        );
      }
    });
  }

  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseInstance;
};
