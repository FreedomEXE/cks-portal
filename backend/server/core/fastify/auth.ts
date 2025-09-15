/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * core/fastify/auth.ts
 *
 * Description: Minimal auth stub for Fastify (compiles under strict TS)
 * Function: Placeholder that trusts upstream dev mock or does nothing
 * Importance: Allows routes to run without JWT/DB while keeping shape
 */

import { FastifyReply, FastifyRequest } from 'fastify';

export async function authenticateFastify(_req: FastifyRequest, _reply: FastifyReply) {
  // Intentionally no-op: real auth will be added later
  return;
}
