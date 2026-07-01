import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

[
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
].forEach((envPath) => {
  dotenv.config({ path: envPath });
});

const environmentSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  PORT: z.coerce.number().int().positive().optional(),
  BACKEND_PORT: z.coerce.number().int().positive().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL').optional(),
  FRONTEND_PORT: z.coerce.number().int().positive().optional(),
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL'),
  ML_SERVICE_URL: z.string().url('ML_SERVICE_URL must be a valid URL'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required'),
  JWT_SECRET: z.string().min(1).optional(),
  STORAGE_PROVIDER: z.string().default('dummy'),
  STORAGE_BUCKET: z.string().default('dummy'),
  EMAIL_PROVIDER: z.string().default('dummy'),
  EMAIL_API_KEY: z.string().default('dummy'),
});

const parsedConfig = environmentSchema.safeParse(process.env);

if (!parsedConfig.success) {
  console.error('Invalid backend environment configuration:');
  console.error(JSON.stringify(parsedConfig.error.format(), null, 2));
  process.exit(1);
}

export const config = {
  db: {
    url: parsedConfig.data.DATABASE_URL,
  },
  server: {
    port: parsedConfig.data.PORT ?? parsedConfig.data.BACKEND_PORT ?? 5000,
    env: parsedConfig.data.NODE_ENV,
    isProd: parsedConfig.data.NODE_ENV === 'production',
    frontendUrl:
      parsedConfig.data.FRONTEND_URL ??
      `http://localhost:${parsedConfig.data.FRONTEND_PORT ?? 3000}`,
    apiUrl: parsedConfig.data.NEXT_PUBLIC_API_URL,
  },
  mlService: {
    url: parsedConfig.data.ML_SERVICE_URL,
  },
  auth: {
    clerkSecretKey: parsedConfig.data.CLERK_SECRET_KEY,
    clerkPublishableKey:
      parsedConfig.data.CLERK_PUBLISHABLE_KEY ??
      parsedConfig.data.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    jwtSecret: parsedConfig.data.JWT_SECRET,
  },
  storage: {
    provider: parsedConfig.data.STORAGE_PROVIDER,
    bucket: parsedConfig.data.STORAGE_BUCKET,
  },
  email: {
    provider: parsedConfig.data.EMAIL_PROVIDER,
    apiKey: parsedConfig.data.EMAIL_API_KEY,
  },
} as const;

export type Config = typeof config;
