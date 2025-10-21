import type { FastifyInstance } from 'fastify';
import z from 'zod';
import { requireActiveAdmin } from '../adminUsers/guards';
import { listDirectoryResource, clearActivity, clearAllActivities } from './store';
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

  // Clear individual activity
  server.post('/api/admin/activities/:activityId/clear', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }

    const activityIdSchema = z.object({
      activityId: z.coerce.number().int().positive(),
    });

    const paramsResult = activityIdSchema.safeParse(request.params);
    if (!paramsResult.success) {
      reply.code(400).send({ error: 'Invalid activity ID' });
      return;
    }

    const { activityId } = paramsResult.data;

    try {
      const success = await clearActivity(activityId, admin.userId);
      if (success) {
        reply.send({ success: true, message: 'Activity cleared' });
      } else {
        reply.code(404).send({ error: 'Activity not found or already cleared' });
      }
    } catch (error) {
      request.log.error({ err: error, activityId }, "Failed to clear activity");
      reply.code(500).send({ error: 'Failed to clear activity' });
    }
  });

  // Clear all activities
  server.post('/api/admin/activities/clear-all', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }

    try {
      const count = await clearAllActivities(admin.userId);
      reply.send({ success: true, count, message: `Cleared ${count} activities` });
    } catch (error) {
      request.log.error({ err: error }, "Failed to clear all activities");
      reply.code(500).send({ error: 'Failed to clear all activities' });
    }
  });
}