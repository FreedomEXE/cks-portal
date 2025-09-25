import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { getCatalogItems } from './service';

const querySchema = z.object({
  type: z.enum(['product', 'service']).optional(),
  q: z.string().trim().min(1).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
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
}
