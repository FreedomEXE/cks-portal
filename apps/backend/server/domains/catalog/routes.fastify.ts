import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { requireActiveAdmin } from '../adminUsers/guards';
import { query } from '../../db/connection';
import { getCatalogItems } from './service';

const querySchema = z.object({
  type: z.enum(['product', 'service']).optional(),
  q: z.string().trim().min(1).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
});

function normalizeTags(input: unknown): string[] {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input
      .flatMap((value) => (typeof value === 'string' ? value.split(',') : []))
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }
  return [];
}

export async function registerCatalogRoutes(server: FastifyInstance) {
  server.get('/api/catalog/items', async (request, reply) => {
    const auth = await requireActiveRole(request, reply);
    if (!auth) {
      return;
    }

    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid query parameters' });
      return;
    }

    const { type, q, tags, page, pageSize } = parsed.data;
    const normalizedTags = normalizeTags(tags);
    const filters = {
      type: type ?? undefined,
      search: q ?? null,
      tags: normalizedTags.length ? normalizedTags : undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    };

    const result = await getCatalogItems(filters);
    reply.send({ data: result });
  });

  // Admin: update catalog service metadata/fields
  server.patch('/api/admin/catalog/services/:serviceId', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }

    const paramsSchema = z.object({ serviceId: z.string().min(1) });
    const bodySchema = z.object({
      name: z.string().trim().min(1).optional(),
      category: z.string().trim().min(1).optional(),
      description: z.string().trim().optional(),
      tags: z.array(z.string().trim()).optional(),
      isActive: z.boolean().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    });

    const p = paramsSchema.safeParse(request.params);
    const b = bodySchema.safeParse(request.body);
    if (!p.success || !b.success) {
      reply.code(400).send({ error: 'Invalid request' });
      return;
    }

    const { serviceId } = p.data;
    const { name, category, description, tags, isActive, metadata } = b.data;

    const sets: string[] = [];
    const params: any[] = [];

    if (name !== undefined) { params.push(name); sets.push(`name = $${params.length}`); }
    if (category !== undefined) { params.push(category); sets.push(`category = $${params.length}`); }
    if (description !== undefined) { params.push(description); sets.push(`description = $${params.length}`); }
    if (Array.isArray(tags)) { params.push(tags); sets.push(`tags = $${params.length}`); }
    if (isActive !== undefined) { params.push(isActive); sets.push(`is_active = $${params.length}`); }
    if (metadata !== undefined) {
      params.push(JSON.stringify(metadata));
      sets.push(`metadata = COALESCE(metadata, '{}'::jsonb) || $${params.length}::jsonb`);
    }

    if (sets.length === 0) {
      reply.send({ success: true });
      return;
    }

    params.push(serviceId);
    try {
      await query(
        `UPDATE catalog_services
         SET ${sets.join(', ')}, updated_at = NOW()
         WHERE service_id = $${params.length}`,
        params,
      );
      reply.send({ success: true });
    } catch (error) {
      request.log.error({ err: error, serviceId }, 'update catalog service failed');
      reply.code(500).send({ error: 'Failed to update catalog service' });
    }
  });

  // Admin: get current certifications for a service
  server.get('/api/admin/catalog/services/:serviceId/certifications', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) return;

    const paramsSchema = z.object({ serviceId: z.string().min(1) });
    const p = paramsSchema.safeParse(request.params);
    if (!p.success) {
      reply.code(400).send({ error: 'Invalid service id' });
      return;
    }
    const { serviceId } = p.data;
    const rows = await query<{ user_id: string; role: string }>(
      `SELECT user_id, role FROM service_certifications WHERE service_id = $1 AND archived_at IS NULL`,
      [serviceId],
    );
    const managers: string[] = [];
    const crew: string[] = [];
    const warehouses: string[] = [];
    for (const r of rows.rows) {
      if (r.role === 'manager') managers.push(r.user_id);
      else if (r.role === 'crew') crew.push(r.user_id);
      else if (r.role === 'warehouse') warehouses.push(r.user_id);
    }
    reply.send({ success: true, data: { managers, crew, warehouses } });
  });

  // Admin: assign/unassign certifications for a service
  server.patch('/api/admin/catalog/services/:serviceId/assign', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) return;

    const paramsSchema = z.object({ serviceId: z.string().min(1) });
    const bodySchema = z.object({
      role: z.enum(['manager','crew','warehouse']),
      add: z.array(z.string()).default([]),
      remove: z.array(z.string()).default([]),
    });

    const p = paramsSchema.safeParse(request.params);
    const b = bodySchema.safeParse(request.body);
    if (!p.success || !b.success) {
      reply.code(400).send({ error: 'Invalid request' });
      return;
    }
    const { serviceId } = p.data;
    const { role, add, remove } = b.data;

    // Insert new certifications
    for (const raw of add) {
      const uid = (raw || '').toString().trim().toUpperCase();
      if (!uid) continue;
      await query(
        `INSERT INTO service_certifications (service_id, user_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (service_id, user_id, role) DO UPDATE SET archived_at = NULL, created_at = NOW()`,
        [serviceId, uid, role],
      );
    }
    // Archive removed ones
    if (remove.length) {
      const removeIds = remove.map((r: string) => (r || '').toString().trim().toUpperCase()).filter(Boolean);
      if (removeIds.length) {
      await query(
        `UPDATE service_certifications
         SET archived_at = NOW()
         WHERE service_id = $1 AND role = $2 AND user_id = ANY($3::text[])`,
        [serviceId, role, removeIds],
      );
      }
    }
    reply.send({ success: true });
  });
}
