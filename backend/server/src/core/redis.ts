/**
 * File: core/redis.ts
 *
 * Descriptio:
 *   Redis client singleton and lifecycle helpers.
 * Functionality:
 *   Lazily constructs ioredis client, attaches event logging, exposes connect/disconnect helpers.
 * Importance:
 *   Centralizes Redis configuration and ensures shared connection for caching or pub/sub features.
 * Conections:
 *   Intended for use in Fastify/Express layers and future caching decorators.
 * Notes:
 *   Add key prefixing strategy before multi-tenant expansion.
 */
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    const url = env.REDIS_URL || process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    client = new Redis(url, { lazyConnect: true });
  client.on('error', (err: unknown) => logger.error({ err }, 'Redis error'));
    client.on('connect', () => logger.info({ redis: true }, 'Redis connected'));
    client.on('reconnecting', () => logger.warn('Redis reconnecting'));
  }
  return client;
}

export async function connectRedis(): Promise<void> {
  const r = getRedis();
  if (r.status === 'wait') await r.connect();
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
