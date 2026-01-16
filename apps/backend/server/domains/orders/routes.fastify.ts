import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { requireActiveAdmin } from '../adminUsers/guards';
import { authenticate } from '../../core/auth/authenticate';
import { getAdminUserByClerkId } from '../adminUsers/store';
import { applyOrderAction, createOrder, getHubOrders, getOrderById, requestCrewAssignment, respondToCrewRequest, type CreateOrderInput, type OrderActionInput } from './service';
import { fetchOrderForViewer } from './store';
import { getEntityWithFallback } from '../entities/service';
import type { HubRole } from '../profile/types';
import type { HubOrderItem } from './types';
import { hasActionAccess } from '../access/service';

const hubRoles = ['manager', 'contractor', 'customer', 'center', 'crew', 'warehouse'] as const;

type HubRoleLiteral = (typeof hubRoles)[number];

const paramsSchema = z.object({
  cksCode: z.string().min(1),
});

const querySchema = z.object({
  status: z.string().optional(),
  type: z.enum(['service', 'product']).optional(),
});

const createOrderSchema = z.object({
  orderType: z.enum(['service', 'product']),
  title: z.string().trim().max(120).optional(),
  destination: z
    .object({
      code: z.string().trim().min(1),
      role: z.enum(hubRoles),
    })
    .optional(),
  expectedDate: z.string().trim().min(1).optional(),
  notes: z.string().trim().max(1000).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  participants: z
    .object({
      manager: z.union([z.string(), z.array(z.string())]).optional(),
      contractor: z.union([z.string(), z.array(z.string())]).optional(),
      customer: z.union([z.string(), z.array(z.string())]).optional(),
      center: z.union([z.string(), z.array(z.string())]).optional(),
      crew: z.union([z.string(), z.array(z.string())]).optional(),
      warehouse: z.union([z.string(), z.array(z.string())]).optional(),
    })
    .optional(),
  items: z
    .array(
      z.object({
        catalogCode: z.string().trim().min(1),
        quantity: z.coerce.number().positive(),
        metadata: z.record(z.string(), z.any()).optional(),
      }),
    )
    .min(1),
});

const actionParamsSchema = z.object({
  orderId: z.string().trim().min(1),
});

const actionBodySchema = z.object({
  action: z.enum(['accept', 'reject', 'start-delivery', 'deliver', 'cancel', 'create-service', 'complete']),
  notes: z.string().trim().max(1000).optional(),
  transformedId: z.string().trim().min(1).optional(),
  metadata: z.record(z.string(), z.any()).optional(), // For create-service action
});

function resolveHubRole(value: string | null | undefined): HubRole | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return hubRoles.includes(normalized as HubRoleLiteral) ? (normalized as HubRole) : null;
}

function filterByStatus(items: HubOrderItem[], status?: string | null): HubOrderItem[] {
  if (!status) {
    return items;
  }
  const target = status.trim().toLowerCase();
  if (!target) {
    return items;
  }
  return items.filter((item) => (item.status ?? '').trim().toLowerCase() === target);
}

export async function registerOrdersRoutes(server: FastifyInstance) {
  // Unified details endpoint for all roles
  // GET /api/order/:orderId/details?includeDeleted=1
  server.get('/api/order/:orderId/details', async (request, reply) => {
    const params = z.object({ orderId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid order identifier' });
      return;
    }

    const query = z.object({ includeDeleted: z.string().optional() }).safeParse(request.query);
    const includeDeleted = query.success && query.data.includeDeleted === '1';

    // Authenticate first (non-enforcing w.r.t role)
    const auth = await authenticate(request);
    if (!auth.ok) {
      reply.code(401).send({ error: 'Unauthorized' });
      return;
    }

    // Soft admin check (do not block hub roles)
    let isAdmin = false;
    try {
      const adminRecord = await getAdminUserByClerkId(auth.userId);
      isAdmin = (adminRecord?.role || '').toLowerCase().trim() === 'admin';
    } catch (e) {
      // fall through; treat as non-admin
      isAdmin = false;
    }

    if (isAdmin) {
      // Admin path: Use getEntityWithFallback if includeDeleted, otherwise getOrderById
      if (includeDeleted) {
        try {
          const result = await getEntityWithFallback('order', params.data.orderId, true);
          reply.send({
            data: result.entity,
            state: result.state,
            deletedAt: result.deletedAt,
            deletedBy: result.deletedBy,
            archivedAt: result.archivedAt,
            archivedBy: result.archivedBy
          });
          return;
        } catch (error) {
          reply.code(404).send({ error: 'Order not found' });
          return;
        }
      } else {
        const order = await getOrderById(params.data.orderId);
        if (!order) {
          reply.code(404).send({ error: 'Order not found' });
          return;
        }
        reply.send({ data: order });
        return;
      }
    }

    // Hub role path (RBAC-scoped). Use existing guard to validate active role.
    const account = await requireActiveRole(request, reply, {});
    if (!account) {
      return; // guard already replied
    }
    const role = resolveHubRole(account.role ?? null);
    const code = account.cksCode ?? null;
    if (!role || !code) {
      reply.code(403).send({ error: 'Unsupported role for order details' });
      return;
    }

    // Non-admin users cannot access deleted entities
    if (includeDeleted) {
      reply.code(403).send({ error: 'Access to deleted orders is restricted to administrators' });
      return;
    }

    const order = await fetchOrderForViewer(role, code, params.data.orderId);
    if (!order) {
      reply.code(404).send({ error: 'Order not found' });
      return;
    }
    reply.send({ data: order });
  });
  // Admin-only: Get full order by ID (includes items and notes)
  server.get('/api/orders/:orderId', async (request, reply) => {
    const params = z.object({ orderId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid order identifier' });
      return;
    }

    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }

    const order = await getOrderById(params.data.orderId);
    if (!order) {
      reply.code(404).send({ error: 'Order not found' });
      return;
    }

    reply.send({ data: order });
  });
  server.get('/api/hub/orders/:cksCode', async (request, reply) => {
    const paramsResult = paramsSchema.safeParse(request.params);
    if (!paramsResult.success) {
      reply.code(400).send({ error: 'Invalid request parameters' });
      return;
    }

    const queryResult = querySchema.safeParse(request.query);
    if (!queryResult.success) {
      reply.code(400).send({ error: 'Invalid query parameters' });
      return;
    }

    const cksCode = paramsResult.data.cksCode;
    const account = await requireActiveRole(request, reply, { cksCode });
    if (!account) {
      return;
    }

    const role = resolveHubRole(account.role ?? null);
    if (!role) {
      reply.code(403).send({ error: 'Unsupported role for hub orders' });
      return;
    }

    const orders = await getHubOrders(role, cksCode);
    if (!orders) {
      reply.code(404).send({ error: 'Orders not found' });
      return;
    }

    const { status, type } = queryResult.data;
    const serviceOrders = type && type !== 'service' ? [] : filterByStatus(orders.serviceOrders, status ?? null);
    const productOrders = type && type !== 'product' ? [] : filterByStatus(orders.productOrders, status ?? null);

    reply.send({
      data: {
        ...orders,
        serviceOrders,
        productOrders,
        orders: [...serviceOrders, ...productOrders],
      },
    });
  });

  server.post('/api/orders', async (request, reply) => {
    const bodyResult = createOrderSchema.safeParse(request.body);
    if (!bodyResult.success) {
      reply.code(400).send({ error: 'Invalid order payload', details: bodyResult.error.flatten() });
      return;
    }

    const account = await requireActiveRole(request, reply, {});
    if (!account) {
      return;
    }

    const role = resolveHubRole(account.role ?? null);
    if (!role) {
      reply.code(403).send({ error: 'Unsupported role for order creation' });
      return;
    }

    const actorCode = account.cksCode ?? null;
    if (!actorCode) {
      reply.code(400).send({ error: 'No CKS code associated with the current user' });
      return;
    }

    if (!account.isAdmin) {
      const allowed = await hasActionAccess(role, actorCode);
      if (!allowed) {
        reply.code(403).send({ error: 'Account access is locked', reason: 'access_locked' });
        return;
      }
    }

    const body = bodyResult.data;

    // Enforce destination selection for non-center roles on product orders
    if (body.orderType === 'product' && role !== 'center') {
      const destCode = body.destination?.code?.trim();
      const destRole = body.destination?.role?.trim().toLowerCase();
      if (!destCode || !destRole) {
        reply.code(400).send({ error: 'Destination center is required for this role.' });
        return;
      }
      if (destRole !== 'center') {
        reply.code(400).send({ error: 'Destination must be a center for product orders.' });
        return;
      }
    }
    const payload = {
      orderType: body.orderType,
      creator: {
        code: actorCode,
        role,
      },
      title: body.title ?? null,
      destination: body.destination
        ? {
            code: body.destination.code,
            role: body.destination.role,
          }
        : null,
      expectedDate: body.expectedDate ?? null,
      notes: body.notes ?? null,
      metadata: body.metadata ?? undefined,
      participants: body.participants,
      items: body.items.map((item) => ({
        catalogCode: item.catalogCode,
        quantity: item.quantity,
        metadata: item.metadata ?? null,
      })),
    } as CreateOrderInput;

    try {
      const order = await createOrder(payload);
      reply.code(201).send({ data: order });
    } catch (error) {
      request.log.error({ err: error }, 'Failed to create order');
      reply.code(400).send({ error: error instanceof Error ? error.message : 'Failed to create order' });
    }
  });

  server.post('/api/orders/:orderId/actions', async (request, reply) => {
    const paramsResult = actionParamsSchema.safeParse(request.params);
    if (!paramsResult.success) {
      reply.code(400).send({ error: 'Invalid order identifier' });
      return;
    }

    const bodyResult = actionBodySchema.safeParse(request.body);
    if (!bodyResult.success) {
      reply.code(400).send({ error: 'Invalid order action payload', details: bodyResult.error.flatten() });
      return;
    }

    const account = await requireActiveRole(request, reply, {});
    if (!account) {
      return;
    }

    const role = resolveHubRole(account.role ?? null);
    if (!role) {
      reply.code(403).send({ error: 'Unsupported role for order actions' });
      return;
    }

    const actorCode = account.cksCode ?? null;
    if (!actorCode) {
      reply.code(400).send({ error: 'No CKS code associated with the current user' });
      return;
    }

    const body = bodyResult.data;

    const actionPayload: OrderActionInput = {
      orderId: paramsResult.data.orderId,
      actorRole: role,
      actorCode,
      action: body.action,
      notes: body.notes ?? null,
      transformedId: body.transformedId ?? null,
      metadata: body.metadata ?? null,
    };

    try {
      const order = await applyOrderAction(actionPayload);
      if (!order) {
        reply.code(404).send({ error: 'Order not found' });
        return;
      }
      reply.send({ data: order });
    } catch (error) {
      request.log.error({ err: error }, 'Failed to apply order action');
      reply.code(400).send({ error: error instanceof Error ? error.message : 'Failed to update order' });
    }
  });

  // PATCH /api/orders/:orderId - Update order fields (admin only)
  server.patch('/api/orders/:orderId', async (request, reply) => {
    const paramsResult = actionParamsSchema.safeParse(request.params);
    if (!paramsResult.success) {
      reply.code(400).send({ error: 'Invalid order identifier' });
      return;
    }

    const updateSchema = z.object({
      expectedDate: z.string().trim().min(1).optional(),
      notes: z.string().trim().max(1000).optional(),
    });

    const bodyResult = updateSchema.safeParse(request.body);
    if (!bodyResult.success) {
      reply.code(400).send({ error: 'Invalid update payload', details: bodyResult.error.flatten() });
      return;
    }

    const account = await requireActiveAdmin(request, reply);
    if (!account) {
      return;
    }

    const { orderId } = paramsResult.data;
    const body = bodyResult.data;

    // Validate order exists and is editable
    try {
      const order = await getOrderById(orderId);
      if (!order) {
        reply.code(404).send({ error: 'Order not found' });
        return;
      }

      const status = (order.status ?? '').toString().trim().toLowerCase();
      const finalStatuses = new Set([
        'delivered',
        'cancelled',
        'rejected',
        'completed',
        'service-created',
        'service_created',
        'service-completed',
        'service_completed',
      ]);
      if (finalStatuses.has(status)) {
        reply.code(400).send({ error: 'Order is not editable in its current status' });
        return;
      }

      // Validate expected date is at least 24 hours in the future (if provided)
      if (typeof body.expectedDate === 'string' && body.expectedDate.trim().length > 0) {
        const parsed = new Date(body.expectedDate);
        if (Number.isNaN(parsed.getTime())) {
          reply.code(400).send({ error: 'Invalid expected date' });
          return;
        }
        const min = new Date(Date.now() + 24 * 60 * 60 * 1000);
        if (parsed.getTime() < min.getTime()) {
          reply.code(400).send({ error: 'Expected delivery must be at least 24 hours from now' });
          return;
        }
      }

      const { updateOrderFields } = await import('./store');
      const updated = await updateOrderFields(orderId, body);
      if (!updated) {
        reply.code(404).send({ error: 'Order not found' });
        return;
      }
      reply.send({ data: updated });
    } catch (error) {
      request.log.error({ err: error }, 'Failed to update order');
      reply.code(400).send({ error: error instanceof Error ? error.message : 'Failed to update order' });
    }
  });

  // POST /api/orders/:orderId/crew-requests - Request crew assignment (manager only)
  server.post('/api/orders/:orderId/crew-requests', async (request, reply) => {
    const paramsResult = actionParamsSchema.safeParse(request.params);
    if (!paramsResult.success) {
      reply.code(400).send({ error: 'Invalid order identifier' });
      return;
    }

    const bodySchema = z.object({
      crewCodes: z.array(z.string().trim().min(1)).min(1),
      message: z.string().trim().max(1000).optional(),
    });

    const bodyResult = bodySchema.safeParse(request.body);
    if (!bodyResult.success) {
      reply.code(400).send({ error: 'Invalid crew request payload', details: bodyResult.error.flatten() });
      return;
    }

    const account = await requireActiveRole(request, reply, {});
    if (!account) {
      return;
    }

    const role = resolveHubRole(account.role ?? null);
    if (role !== 'manager') {
      reply.code(403).send({ error: 'Only managers can request crew assignment' });
      return;
    }

    const managerCode = account.cksCode ?? null;
    if (!managerCode) {
      reply.code(400).send({ error: 'No CKS code associated with the current user' });
      return;
    }

    try {
      const order = await requestCrewAssignment(
        paramsResult.data.orderId,
        managerCode,
        bodyResult.data.crewCodes,
        bodyResult.data.message
      );
      reply.send({ data: order });
    } catch (error) {
      request.log.error({ err: error }, 'Failed to request crew assignment');
      reply.code(400).send({ error: error instanceof Error ? error.message : 'Failed to request crew assignment' });
    }
  });

  // POST /api/orders/:orderId/crew-response - Crew respond to assignment request (crew only)
  server.post('/api/orders/:orderId/crew-response', async (request, reply) => {
    const paramsResult = actionParamsSchema.safeParse(request.params);
    if (!paramsResult.success) {
      reply.code(400).send({ error: 'Invalid order identifier' });
      return;
    }

    const bodySchema = z.object({
      accept: z.boolean(),
    });

    const bodyResult = bodySchema.safeParse(request.body);
    if (!bodyResult.success) {
      reply.code(400).send({ error: 'Invalid crew response payload', details: bodyResult.error.flatten() });
      return;
    }

    const account = await requireActiveRole(request, reply, {});
    if (!account) {
      return;
    }

    const role = resolveHubRole(account.role ?? null);
    if (role !== 'crew') {
      reply.code(403).send({ error: 'Only crew members can respond to crew requests' });
      return;
    }

    const crewCode = account.cksCode ?? null;
    if (!crewCode) {
      reply.code(400).send({ error: 'No CKS code associated with the current user' });
      return;
    }

    try {
      const order = await respondToCrewRequest(
        paramsResult.data.orderId,
        crewCode,
        bodyResult.data.accept
      );
      reply.send({ data: order });
    } catch (error) {
      request.log.error({ err: error }, 'Failed to respond to crew request');
      reply.code(400).send({ error: error instanceof Error ? error.message : 'Failed to respond to crew request' });
    }
  });
}
