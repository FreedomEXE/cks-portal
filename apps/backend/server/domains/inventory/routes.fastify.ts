/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: routes.fastify.ts
 *
 * Description:
 * Inventory domain API routes
 *
 * Responsibilities:
 * - Handle inventory API requests
 * - Validate parameters and authentication
 *
 * Role in system:
 * - Registered by backend server for hub inventory endpoints
 *
 * Notes:
 * Currently supports warehouse role inventory
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { getHubInventory } from './service';
import { updateInventoryQuantity } from './store';
import type { HubRole } from '../profile/types';

const paramsSchema = z.object({
  cksCode: z.string().min(1),
});

export async function registerInventoryRoutes(server: FastifyInstance) {
  server.get('/api/hub/inventory/:cksCode', async (request, reply) => {
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
    const inventory = await getHubInventory(role, cksCode);
    if (!inventory) {
      reply.code(404).send({ error: 'Inventory data not found' });
      return;
    }

    reply.send({ data: inventory });
  });

  // POST /api/hub/inventory/update - Update inventory quantity (admin + warehouse)
  const updateBodySchema = z.object({
    warehouseId: z.string().min(1),
    itemId: z.string().min(1),
    quantityChange: z.number(),
    reason: z.string().optional(),
  });

  server.post('/api/hub/inventory/update', async (request, reply) => {
    const account = await requireActiveRole(request, reply, {});
    if (!account) {
      return;
    }

    // Admin and warehouse users can update inventory
    const role = (account.role ?? '').trim().toLowerCase() as HubRole;
    if (role !== 'admin' && role !== 'warehouse') {
      reply.code(403).send({ error: 'Only admins and warehouse users can update inventory' });
      return;
    }

    const parsed = updateBodySchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid request body', details: parsed.error });
      return;
    }

    const normalizedAccountCode = (account.cksCode ?? '').trim().toUpperCase();
    if (role === 'warehouse' && !normalizedAccountCode) {
      reply.code(403).send({ error: 'Warehouse account is missing a valid warehouse code' });
      return;
    }

    // Never trust client-provided warehouseId for warehouse users.
    const effectiveWarehouseId =
      role === 'warehouse' ? normalizedAccountCode : parsed.data.warehouseId;

    try {
      await updateInventoryQuantity({
        ...parsed.data,
        warehouseId: effectiveWarehouseId,
        actorId: account.cksCode || (role === 'warehouse' ? 'WAREHOUSE' : 'ADMIN'),
        actorRole: role,
      });
      reply.send({ success: true, message: 'Inventory updated successfully' });
    } catch (error) {
      const err = error as Error;
      reply.code(400).send({ error: err.message });
    }
  });
}
