/**
 * File: core/logger.ts
 *
 * Descriptio:
 *   Centralized structured logging utilities wrapping pino and pino-http.
 * Functionality:
 *   Exposes a base pino logger and an HTTP serializer middleware for request/response logging.
 * Importance:
 *   Provides consistent, low-overhead, JSON logs for observability and debugging across the API surface.
 * Conections:
 *   Used by Express (httpLogger) and Fastify (as base logger); referenced in error handling, Prisma and Redis clients.
 * Notes:
 *   Add redaction (pino.redact) if sensitive fields appear in future request bodies.
 */
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import pino from 'pino';
import pinoHttp from 'pino-http';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined
});

export const httpLogger = pinoHttp({
  // Cast to any due to temporary type mismatch between pino v9 and pino-http
  logger: logger as any,
  serializers: {
    req: (req: any) => ({ method: req.method, url: req.url }),
    res: (res: any) => ({ statusCode: res.statusCode })
  }
});
