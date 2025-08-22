/**
 * File: fastify.ts
 *
 * Descriptio:
 *   Alternate Fastify-based HTTP server showcasing migration path from Express.
 * Functionality:
 *   Boots Fastify with CORS + rate limiting, sample health, Prisma, and Redis routes.
 * Importance:
 *   Provides a performance-oriented option and experimentation surface without disrupting existing Express API.
 * Conections:
 *   Uses core/env, core/logger, core/prisma, core/redis; parallel to src/index.ts.
 * Notes:
 *   Runs on PORT+1 to avoid collision; can be promoted later after load testing.
 */
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import 'dotenv/config';
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from './core/env';
import { logger } from './core/logger';
import { getPrisma } from './core/prisma';
import { connectRedis } from './core/redis';

// Fastify instance with pino already integrated
const app = Fastify({ logger });

async function main() {
  // Plugins
  await app.register(cors, { origin: true, credentials: true });
  await app.register(rateLimit, { max: 1000, timeWindow: '15 minutes' });

  // Simple health route
  app.get('/health', async () => ({ ok: true, runtime: 'fastify' }));

  // Example Prisma usage route
  app.get('/prisma/app-users/:id', async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
    const id = req.params.id;
    const prisma = getPrisma();
    const user = await prisma.appUser.findUnique({ where: { clerk_user_id: id } });
    if (!user) return res.code(404).send({ error: 'Not found' });
    return user;
  });

  // Example Redis cache route
  app.get('/cache/ping', async () => {
    await connectRedis();
    return { pong: true };
  });

  const port = Number(env.PORT || 5000) + 1; // run alongside express variant
  await app.listen({ port, host: '0.0.0.0' });
  logger.info({ port }, 'Fastify API listening');
}

main().catch(err => {
  logger.error({ err }, 'Fastify bootstrap failed');
  process.exit(1);
});
