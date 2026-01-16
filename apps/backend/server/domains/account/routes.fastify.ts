import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { clerkClient } from '../../core/clerk/client';
import { getIdentityContactByRoleAndCode } from '../identity';
import type { IdentityEntity } from '../identity/types';

const requestPasswordResetSchema = z.object({
  userId: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  cksId: z.string().min(1),
});

const ROLE_PREFIXES: Array<{ prefix: string; role: IdentityEntity }> = [
  { prefix: 'MGR-', role: 'manager' },
  { prefix: 'CON-', role: 'contractor' },
  { prefix: 'CUS-', role: 'customer' },
  { prefix: 'CEN-', role: 'center' },
  { prefix: 'CRW-', role: 'crew' },
  { prefix: 'WAR-', role: 'warehouse' },
  { prefix: 'WHS-', role: 'warehouse' },
];

function resolveRoleFromCksId(cksId: string): IdentityEntity | null {
  const normalized = cksId.trim().toUpperCase();
  for (const entry of ROLE_PREFIXES) {
    if (normalized.startsWith(entry.prefix)) {
      return entry.role;
    }
  }
  return null;
}

export async function registerAccountRoutes(server: FastifyInstance) {
  /**
   * POST /api/account/forgot-password
   *
   * Triggers a Clerk password reset email by CKS ID (unauthenticated).
   * Always returns success to avoid account enumeration.
   */
  server.post(
    '/api/account/forgot-password',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const parsed = forgotPasswordSchema.safeParse(request.body);
      if (!parsed.success) {
        reply.code(400).send({ error: 'Invalid request body', details: parsed.error.issues });
        return;
      }

      const cksId = parsed.data.cksId.trim().toUpperCase();
      const role = resolveRoleFromCksId(cksId);

      try {
        if (role) {
          const contact = await getIdentityContactByRoleAndCode(role, cksId);
          const clerkUserId = contact?.clerkUserId ?? null;

          if (clerkUserId) {
            await clerkClient.users.createPasswordReset({ userId: clerkUserId });
          } else if (contact?.email) {
            const matches = await clerkClient.users.getUserList({ emailAddress: [contact.email] });
            const user = matches?.[0];
            if (user?.id) {
              await clerkClient.users.createPasswordReset({ userId: user.id });
            }
          }
        }
      } catch (error) {
        server.log.error({ err: error, cksId }, '[account] Forgot password failed');
      }

      reply.send({
        data: {
          success: true,
          message: 'If the account exists, a reset email has been sent.',
        },
      });
    }
  );
  /**
   * POST /api/account/request-password-reset
   *
   * Triggers a Clerk password reset email for the authenticated user.
   * User must be logged in to request their own password reset (1-click from Settings).
   */
  server.post(
    '/api/account/request-password-reset',
    {
      config: {
        // Per-route rate limit: conservative to prevent abuse
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
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
    }
  );
}
