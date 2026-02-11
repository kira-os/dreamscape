import { z } from 'zod';

const env_schema = z.object({
  DATABASE_URL: z.string().url(),
  SOLANA_RPC_URL: z.string().url().default('https://api.mainnet-beta.solana.com'),
  GALLERY_PATH: z.string().default('./gallery'),
  BASE_URL: z.string().url().default('http://localhost:3300'),
  PORT: z.coerce.number().int().positive().default(3300),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type EnvConfig = z.infer<typeof env_schema>;

function load_config(): EnvConfig {
  const result = env_schema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${formatted}`);
  }
  return result.data;
}

export const config = load_config();
