import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { requireActiveAdmin } from '../adminUsers/guards';
import { getHubProfile, getUserDetails } from './service';
import { updateUserAccountStatus, updateUserProfile } from './store';
import type { HubRole } from './types';
import { accessTierSchema } from '../access/validators';
import { getAccountAccessGrant, setAccountAccessGrant } from '../access/service';

const paramsSchema = z.object({
  cksCode: z.string().min(1),
});

const userDetailsParamsSchema = z.object({
  entityType: z.enum(['manager', 'contractor', 'customer', 'center', 'crew', 'warehouse']),
  entityId: z.string().min(1),
});

const userProfileUpdateSchema = z.object({
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  mainContact: z.string().nullable().optional(),
  emergencyContact: z.string().nullable().optional(),
  territory: z.string().nullable().optional(),
  reportsTo: z.string().nullable().optional(),
});

const accountStatusSchema = z.enum(['active', 'paused', 'ended']);

const accountManagementSchema = z.object({
  accountStatus: accountStatusSchema.optional(),
  accessTier: accessTierSchema.optional(),
});

export async function registerProfileRoutes(server: FastifyInstance) {
  server.get('/api/hub/profile/:cksCode', async (request, reply) => {
    const parsed = paramsSchema.safeParse(request.params);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid request parameters' });
      return;
    }

    const cksCode = parsed.data.cksCode;
    const account = await requireActiveRole(request, reply, { cksCode });
    if (!account) {
      return;
    }

    const role = (account.role ?? '').trim().toLowerCase() as HubRole;
    const profile = await getHubProfile(role, cksCode);
    if (!profile) {
      reply.code(404).send({ error: 'Profile not found' });
      return;
    }

    reply.send({ data: profile });
  });

  /**
   * GET /api/profile/:entityType/:entityId
   *
   * Universal user details endpoint for modals.
   * Fetches user entity data regardless of lifecycle state (active, archived, or deleted).
   *
   * Returns directory-normalized format with lifecycle state indicator.
   */
  server.get('/api/profile/:entityType/:entityId', async (request, reply) => {
    const parsed = userDetailsParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid entity type or ID' });
      return;
    }

    // AUTH: Require active user (any role)
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return; // requireActiveRole already sent error response
    }

    const { entityType, entityId } = parsed.data;

    try {
      const result = await getUserDetails(entityType, entityId);

      console.log(`[profile] Resolved ${entityType} ${entityId} from ${result.source}`);

      reply.send({
        data: result.data,
        state: result.state,
        deletedAt: result.deletedAt,
        deletedBy: result.deletedBy,
        archivedAt: result.archivedAt,
        archivedBy: result.archivedBy,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'User not found';
      reply.code(404).send({ error: message });
    }
  });

  /**
   * PATCH /api/admin/profile/:entityType/:entityId
   *
   * Admin-only profile update for user entities.
   */
  server.patch('/api/admin/profile/:entityType/:entityId', async (request, reply) => {
    const parsedParams = userDetailsParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      reply.code(400).send({ error: 'Invalid entity type or ID' });
      return;
    }

    const parsedBody = userProfileUpdateSchema.safeParse(request.body ?? {});
    if (!parsedBody.success) {
      reply.code(400).send({ error: 'Invalid update payload' });
      return;
    }

    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }

    const { entityType, entityId } = parsedParams.data;

    try {
      const result = await updateUserProfile(entityType, entityId, parsedBody.data, admin);
      if (!result.updated) {
        reply.code(404).send({ error: 'Profile not found' });
        return;
      }

      const refreshed = await getUserDetails(entityType, entityId);
      reply.send({
        data: refreshed.data,
        state: refreshed.state,
        deletedAt: refreshed.deletedAt,
        deletedBy: refreshed.deletedBy,
        archivedAt: refreshed.archivedAt,
        archivedBy: refreshed.archivedBy,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile update failed';
      reply.code(500).send({ error: message });
    }
  });

  /**
   * GET /api/admin/account-management/:entityType/:entityId
   *
   * Admin-only account status + access tier snapshot for management tab.
   */
  server.get('/api/admin/account-management/:entityType/:entityId', async (request, reply) => {
    const parsedParams = userDetailsParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      reply.code(400).send({ error: 'Invalid entity type or ID' });
      return;
    }

    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }

    const { entityType, entityId } = parsedParams.data;

    try {
      const details = await getUserDetails(entityType, entityId);
      const grant = await getAccountAccessGrant(entityType, entityId);

      reply.send({
        data: {
          accountStatus: details.data?.status ?? null,
          accessTier: grant?.tier ?? null,
          accessStatus: grant?.status ?? null,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Management data not found';
      reply.code(404).send({ error: message });
    }
  });

  /**
   * PATCH /api/admin/account-management/:entityType/:entityId
   *
   * Admin-only account status + access tier update for management tab.
   */
  server.patch('/api/admin/account-management/:entityType/:entityId', async (request, reply) => {
    const parsedParams = userDetailsParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      reply.code(400).send({ error: 'Invalid entity type or ID' });
      return;
    }

    const parsedBody = accountManagementSchema.safeParse(request.body ?? {});
    if (!parsedBody.success) {
      reply.code(400).send({ error: 'Invalid management payload' });
      return;
    }

    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }

    const { entityType, entityId } = parsedParams.data;
    const { accountStatus, accessTier } = parsedBody.data;

    try {
      if (accountStatus) {
        await updateUserAccountStatus(entityType, entityId, accountStatus, admin);
      }

      let updatedGrant = await getAccountAccessGrant(entityType, entityId);
      if (accessTier || accountStatus) {
        const desiredTier = accessTier ?? updatedGrant?.tier ?? 'standard';
        const desiredStatus = accountStatus
          ? (accountStatus === 'active' ? 'active' : 'revoked')
          : (updatedGrant?.status ?? 'active');
        updatedGrant = await setAccountAccessGrant({
          role: entityType,
          cksCode: entityId,
          tier: desiredTier,
          status: desiredStatus,
          grantedByRole: admin.role ?? 'admin',
          grantedByCode: admin.cksCode ?? null,
        });
      }

      const details = await getUserDetails(entityType, entityId);
      reply.send({
        data: {
          accountStatus: details.data?.status ?? null,
          accessTier: updatedGrant?.tier ?? null,
          accessStatus: updatedGrant?.status ?? null,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Account management update failed';
      reply.code(500).send({ error: message });
    }
  });
}
