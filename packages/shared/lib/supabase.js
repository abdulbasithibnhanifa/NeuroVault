"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseClient = getSupabaseClient;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("@neurovault/shared/config/env");
let supabaseClient = null;
/**
 * Returns a singleton Supabase client instance.
 * Configured with service role key for vector store operations.
 */
function getSupabaseClient() {
    if (!supabaseClient) {
        const url = env_1.env.SUPABASE_URL;
        const key = env_1.env.SUPABASE_SERVICE_KEY;
        if (!url || !key) {
            console.error('Supabase URL or Service Key missing!');
        }
        console.log(`Initializing Supabase client with URL: ${url}`);
        console.log(`Service Key present: ${!!key} (Starts with: ${key?.substring(0, 5)}...)`);
        supabaseClient = (0, supabase_js_1.createClient)(url, key, {
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
