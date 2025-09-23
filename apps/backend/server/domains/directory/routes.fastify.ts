import type { FastifyInstance } from 'fastify';
import z from 'zod';
import { requireActiveAdmin } from '../adminUsers/guards';
import { listDirectoryResource } from './store';
import { directoryResourceSchemas } from './validators';
import type { DirectoryResourceKey } from './types';

const DIRECTORY_RESOURCES = [
  'managers',
  'contractors',
  'customers',
  'centers',
  'crew',
  'warehouses',
  'services',
  'orders',
  'products',
  'training',
  'procedures',
  'reports',
  'feedback',
  'activities',
] as const satisfies readonly DirectoryResourceKey[];

const paramsSchema = z.object({
  resource: z.enum(DIRECTORY_RESOURCES),
});

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(1000).optional(),
});

export async function registerDirectoryRoutes(server: FastifyInstance) {
  server.get('/api/admin/directory/:resource', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }

    const paramsResult = paramsSchema.safeParse(request.params);
    if (!paramsResult.success) {
      reply.code(400).send({ error: 'Invalid directory resource' });
      return;
    }

    const queryResult = querySchema.safeParse(request.query);
    if (!queryResult.success) {
      reply.code(400).send({ error: 'Invalid query parameters' });
      return;
    }

    const resource = paramsResult.data.resource as DirectoryResourceKey;
    const limit = queryResult.data.limit;

    try {
      const items = await listDirectoryResource(resource, limit);
      const schema = directoryResourceSchemas[resource];
      const payload = schema.array().parse(items);
      reply.send({ data: payload });
    } catch (error) {
      request.log.error({ err: error, resource }, "directory resource fetch failed");
      reply.code(500).send({ error: 'Failed to load directory data' });
    }
  });
}