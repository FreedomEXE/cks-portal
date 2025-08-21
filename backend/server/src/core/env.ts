/**
 * File: core/env.ts
 *
 * Descriptio:
 *   Environment variable schema validation and safe export.
 * Functionality:
 *   Validates process.env against a zod schema, exits early on invalid configuration.
 * Importance:
 *   Prevents runtime misconfiguration by failing fast with explicit errors.
 * Conections:
 *   Consumed by server bootstrap (ports), database pool, Fastify instance, Redis/Prisma modules.
 * Notes:
 *   Extend schema as new infra dependencies emerge (e.g., S3, email providers).
 */
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().regex(/^\d+$/).default('5000'),
  DATABASE_URL: z.string().url().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.string().optional(),
  DB_NAME: z.string().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  // Common Postgres env var names (Docker/Heroku/Postgres clients)
  PGHOST: z.string().optional(),
  PGPORT: z.string().optional(),
  PGDATABASE: z.string().optional(),
  PGUSER: z.string().optional(),
  PGPASSWORD: z.string().optional(),
  PG_SSL: z.string().optional()
  ,
  DATABASE_URL_PRISMA: z.string().url().optional(),
  REDIS_URL: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
