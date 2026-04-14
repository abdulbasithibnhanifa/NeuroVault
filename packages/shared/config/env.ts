import { z } from 'zod';

const envSchema = z.object({
  // MongoDB
  MONGODB_URI: z.string().optional(),

  // Supabase (pgvector)
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),

  // AWS S3
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),

  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),

  // NextAuth
  NEXTAUTH_SECRET: z.string().default('neurovault_secret_change_me'),
  NEXTAUTH_URL: z.string().default('http://localhost:3000'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // OpenRouter (LLM)
  OPENROUTER_API_KEY: z.string().optional(),

  // HuggingFace (Embeddings)
  HUGGINGFACE_API_KEY: z.string().optional(),
  
  // Node Env
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Partial parsing to allow merging values even if validation fails
const result = envSchema.safeParse(process.env);

if (!result.success) {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Invalid environment variables:', JSON.stringify(result.error.format(), null, 2));
    throw new Error('Invalid environment variables');
  } else {
    // In dev, we log which ones are missing but DON'T crash
    console.warn('⚠️ Environment warning: Some variables are missing or invalid.');
  }
}

// Build the env object by merging defaults with what we have
// This ensures that even if one variable fails validation, others from .env.local are preserved
export const env = {
  ...envSchema.parse({ NODE_ENV: 'development' }), // Start with defaults
  ...(result.success ? result.data : (process.env as any)) // Merge with actual process.env values
} as z.infer<typeof envSchema>;
