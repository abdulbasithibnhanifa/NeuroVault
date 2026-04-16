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

// Parse the environment variables
const result = envSchema.safeParse(process.env);

if (!result.success && process.env.NODE_ENV === 'production') {
  console.error('❌ Invalid environment variables:', JSON.stringify(result.error.format(), null, 2));
  throw new Error('Invalid environment variables');
}

// Build the env object - use process.env directly if validation failed but let it crash in prod
export const env = (result.success ? result.data : process.env as any) as z.infer<typeof envSchema>;

// Fail-fast in production for critical variables
if (env.NODE_ENV === 'production') {
  const criticalVars = [
    'MONGODB_URI', 
    'SUPABASE_URL', 
    'SUPABASE_SERVICE_KEY', 
    'NEXTAUTH_SECRET',
    'S3_BUCKET'
  ];
  
  const missing = criticalVars.filter(key => !(env as any)[key]);
  if (missing.length > 0) {
    console.error(`❌ Production failure: Missing critical environment variables: ${missing.join(', ')}`);
    throw new Error('Missing critical environment variables');
  }
}
