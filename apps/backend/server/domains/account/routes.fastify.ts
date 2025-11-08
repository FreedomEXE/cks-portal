import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { clerkClient } from '../../core/clerk/client';

const requestPasswordResetSchema = z.object({
  userId: z.string().min(1),
});

export async function registerAccountRoutes(server: FastifyInstance) {
  /**
   * POST /api/account/request-password-reset
   *
   * Triggers a Clerk password reset email for the authenticated user.
   * User must be logged in to request their own password reset (1-click from Settings).
   */
  server.post('/api/account/request-password-reset', async (request, reply) => {
    // AUTH: Require active user (any role)
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return; // requireActiveRole already sent error response
    }

    const parsed = requestPasswordResetSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid request body', details: parsed.error.issues });
      return;
    }

    const { userId } = parsed.data;

    // Security: Ensure user can only reset their own password
    if ((account as any).clerkUserId !== userId) {
      reply.code(403).send({ error: 'Forbidden: Cannot reset password for another user' });
      return;
    }

    try {
      // Trigger Clerk password reset email
      await clerkClient.users.createPasswordReset({
        userId,
      });

      server.log.info(`[account] Password reset email sent for user ${userId}`);

      reply.send({
        data: {
          success: true,
          message: 'Password reset email sent successfully',
        }
      });
    } catch (error) {
      server.log.error({ err: error, userId }, '[account] Failed to send password reset email');

      const message = error instanceof Error ? error.message : 'Failed to send password reset email';
      reply.code(500).send({ error: message });
    }
  });
}
