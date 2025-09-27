import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { applyOrderAction, createOrder, getHubOrders, type CreateOrderInput, type OrderActionInput } from './service';
import type { HubRole } from '../profile/types';
import type { HubOrderItem } from './types';

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
  action: z.enum(['accept', 'reject', 'deliver', 'cancel', 'create-service']),
  notes: z.string().trim().max(1000).optional(),
  transformedId: z.string().trim().min(1).optional(),
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

    const body = bodyResult.data;
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
}

