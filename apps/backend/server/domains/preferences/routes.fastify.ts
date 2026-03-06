/*-----------------------------------------------
  Property of Freedom_EXE  (c) 2026
-----------------------------------------------*/
/**
 * File: routes.fastify.ts
 *
 * Description:
 * Backend routes for user preferences (watermark, hub title, theme, etc.).
 * Preferences are stored in the user_preferences table keyed by user_code.
 * Any authenticated user can read any user's preferences (needed for watermark
 * resolution where customers/centers read their contractor's watermark).
 * Writing is restricted to your own preferences or admin users.
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { query } from '../../db/connection';

const codeSchema = z.string().trim().min(1).max(64);

export function registerPreferencesRoutes(server: FastifyInstance) {
  // ── GET /api/preferences/:code ──────────────────────────────────────
  // Any authenticated user can read preferences (needed for watermark resolution)
  server.get('/api/preferences/:code', async (request, reply) => {
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;

    const { code } = request.params as { code: string };
    const parsed = codeSchema.safeParse(code);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid user code' });
      return;
    }

    const normalizedCode = parsed.data.toUpperCase();

    try {
      const result = await query<{ preferences: Record<string, unknown> }>(
        `SELECT preferences FROM user_preferences WHERE user_code = $1`,
        [normalizedCode],
      );

      if (result.rows.length === 0) {
        reply.send({ success: true, data: {} });
        return;
      }

      reply.send({ success: true, data: result.rows[0].preferences });
    } catch (error) {
      request.log.error({ err: error, code: normalizedCode }, 'Failed to read user preferences');
      reply.code(500).send({ error: 'Failed to read preferences' });
    }
  });

  // ── PUT /api/preferences/:code ──────────────────────────────────────
  // Merge-update preferences. Admin can update anyone; non-admin can only update own.
  server.put('/api/preferences/:code', async (request, reply) => {
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;

    const { code } = request.params as { code: string };
    const parsed = codeSchema.safeParse(code);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid user code' });
      return;
    }

    const normalizedCode = parsed.data.toUpperCase();
    const callerCode = (account.cksCode ?? '').toUpperCase();
    const callerRole = (account.role ?? '').trim().toLowerCase();

    // Non-admins can only update their own preferences
    if (callerRole !== 'admin' && callerCode !== normalizedCode) {
      reply.code(403).send({ error: 'You can only update your own preferences' });
      return;
    }

    const body = request.body;
    if (!body || typeof body !== 'object') {
      reply.code(400).send({ error: 'Request body must be a JSON object' });
      return;
    }

    try {
      // UPSERT: merge new preferences into existing
      await query(
        `INSERT INTO user_preferences (user_code, preferences, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (user_code)
         DO UPDATE SET
           preferences = user_preferences.preferences || $2::jsonb,
           updated_at = NOW()`,
        [normalizedCode, JSON.stringify(body)],
      );

      // Read back the merged result
      const result = await query<{ preferences: Record<string, unknown> }>(
        `SELECT preferences FROM user_preferences WHERE user_code = $1`,
        [normalizedCode],
      );

      reply.send({
        success: true,
        data: result.rows[0]?.preferences ?? {},
      });
    } catch (error) {
      request.log.error({ err: error, code: normalizedCode }, 'Failed to update user preferences');
      reply.code(500).send({ error: 'Failed to update preferences' });
    }
  });
}
