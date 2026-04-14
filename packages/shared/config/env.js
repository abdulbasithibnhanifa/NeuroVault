"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    // MongoDB
    MONGODB_URI: zod_1.z.string().optional(),
    // Supabase (pgvector)
    SUPABASE_URL: zod_1.z.string().optional(),
    SUPABASE_SERVICE_KEY: zod_1.z.string().optional(),
    // AWS S3
    AWS_REGION: zod_1.z.string().optional(),
    AWS_ACCESS_KEY_ID: zod_1.z.string().optional(),
    AWS_SECRET_ACCESS_KEY: zod_1.z.string().optional(),
    S3_BUCKET: zod_1.z.string().optional(),
    // Redis
    REDIS_URL: zod_1.z.string().optional(),
    REDIS_HOST: zod_1.z.string().default('localhost'),
    REDIS_PORT: zod_1.z.coerce.number().default(6379),
    // NextAuth
    NEXTAUTH_SECRET: zod_1.z.string().default('neurovault_secret_change_me'),
    NEXTAUTH_URL: zod_1.z.string().default('http://localhost:3000'),
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().optional(),
    GITHUB_CLIENT_ID: zod_1.z.string().optional(),
    GITHUB_CLIENT_SECRET: zod_1.z.string().optional(),
    // OpenRouter (LLM)
    OPENROUTER_API_KEY: zod_1.z.string().optional(),
    // HuggingFace (Embeddings)
    HUGGINGFACE_API_KEY: zod_1.z.string().optional(),
    // Node Env
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
});
// Partial parsing to allow merging values even if validation fails
const result = envSchema.safeParse(process.env);
if (!result.success) {
    if (process.env.NODE_ENV === 'production') {
        console.error('❌ Invalid environment variables:', JSON.stringify(result.error.format(), null, 2));
        throw new Error('Invalid environment variables');
    }
    else {
        // In dev, we log which ones are missing but DON'T crash
        console.warn('⚠️ Environment warning: Some variables are missing or invalid.');
    }
}
// Build the env object by merging defaults with what we have
// This ensures that even if one variable fails validation, others from .env.local are preserved
exports.env = {
    ...envSchema.parse({ NODE_ENV: 'development' }), // Start with defaults
    ...(result.success ? result.data : process.env) // Merge with actual process.env values
};
