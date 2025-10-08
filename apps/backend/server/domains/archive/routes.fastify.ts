import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  archiveEntity,
  restoreEntity,
  listArchivedEntities,
  getArchivedRelationships,
  hardDeleteEntity
} from './store';

const EntityTypeSchema = z.enum(['manager', 'contractor', 'customer', 'center', 'crew', 'warehouse', 'service', 'product', 'order', 'report', 'feedback']);

const ArchiveRequestSchema = z.object({
  entityType: EntityTypeSchema,
  entityId: z.string().min(1),
  reason: z.string().optional()
});

const RestoreRequestSchema = z.object({
  entityType: EntityTypeSchema,
  entityId: z.string().min(1)
});

const HardDeleteRequestSchema = z.object({
  entityType: EntityTypeSchema,
  entityId: z.string().min(1),
  reason: z.string().optional(),
  confirm: z.boolean()
});

export function registerArchiveRoutes(fastify: FastifyInstance) {
  // List archived entities
  fastify.get('/api/archive/list', async (request, reply) => {
    try {
      const { entityType, limit } = request.query as {
        entityType?: string;
        limit?: string;
      };

      console.log('[archive] Received entityType from frontend:', entityType);

      // Map plural tab names to singular entity types
      let normalizedEntityType = entityType;
      if (entityType === 'reports') normalizedEntityType = 'report';
      if (entityType === 'services') normalizedEntityType = 'service';
      if (entityType === 'orders') normalizedEntityType = 'order';

      console.log('[archive] Normalized entityType:', normalizedEntityType);

      const validatedType = normalizedEntityType ? EntityTypeSchema.parse(normalizedEntityType) : undefined;
      const entities = await listArchivedEntities(
        validatedType,
        limit ? parseInt(limit) : 100
      );

      return reply.send({ success: true, data: entities });
    } catch (error) {
      console.error('[archive] Failed to list archived entities:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list archived entities'
      });
    }
  });

  // Archive an entity (soft delete)
  fastify.post('/api/archive/delete', async (request, reply) => {
    try {
      const body = ArchiveRequestSchema.parse(request.body);
      const actor = {
        actorId: (request as any).user?.id || 'ADMIN',
        actorRole: (request as any).user?.role || 'admin'
      };

      const result = await archiveEntity({
        entityType: body.entityType,
        entityId: body.entityId,
        reason: body.reason,
        actor
      });

      return reply.send({
        success: true,
        message: `${body.entityType} archived successfully`,
        unassignedChildren: result.unassignedChildren
      });
    } catch (error) {
      console.error('[archive] Failed to archive entity:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to archive entity'
      });
    }
  });

  // Restore an entity from archive
  fastify.post('/api/archive/restore', async (request, reply) => {
    try {
      console.log('[archive] Restore request body:', JSON.stringify(request.body));
      const body = RestoreRequestSchema.parse(request.body);
      const actor = {
        actorId: (request as any).user?.id || 'ADMIN',
        actorRole: (request as any).user?.role || 'admin'
      };

      const result = await restoreEntity({
        entityType: body.entityType,
        entityId: body.entityId,
        actor
      });

      return reply.send({
        success: true,
        message: `${body.entityType} restored successfully. Entity is now in the unassigned bucket.`
      });
    } catch (error) {
      console.error('[archive] Failed to restore entity:', error);
      console.error('[archive] Request body was:', JSON.stringify(request.body));
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to restore entity'
      });
    }
  });

  // Get archived relationships for an entity
  fastify.get('/api/archive/relationships/:entityType/:entityId', async (request, reply) => {
    try {
      const { entityType, entityId } = request.params as {
        entityType: string;
        entityId: string;
      };

      const validatedType = EntityTypeSchema.parse(entityType);
      const relationships = await getArchivedRelationships(validatedType, entityId);

      return reply.send({ success: true, data: relationships });
    } catch (error) {
      console.error('[archive] Failed to get relationships:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get relationships'
      });
    }
  });

  // Hard delete an entity (permanent deletion)
  fastify.delete('/api/archive/hard-delete', async (request, reply) => {
    try {
      const body = HardDeleteRequestSchema.parse(request.body);

      if (!body.confirm) {
        return reply.status(400).send({
          success: false,
          error: 'Hard deletion requires explicit confirmation'
        });
      }

      const actor = {
        actorId: (request as any).user?.id || 'ADMIN',
        actorRole: (request as any).user?.role || 'admin'
      };

      const result = await hardDeleteEntity({
        entityType: body.entityType,
        entityId: body.entityId,
        reason: body.reason,
        confirm: body.confirm,
        actor
      });

      return reply.send({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('[archive] Failed to hard delete entity:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to hard delete entity'
      });
    }
  });

  // Batch archive operation
  fastify.post('/api/archive/batch-delete', async (request, reply) => {
    try {
      const { entities, reason } = request.body as {
        entities: Array<{ entityType: string; entityId: string }>;
        reason?: string;
      };

      const actor = {
        actorId: (request as any).user?.id || 'ADMIN',
        actorRole: (request as any).user?.role || 'admin'
      };

      const results = await Promise.allSettled(
        entities.map(entity =>
          archiveEntity({
            entityType: EntityTypeSchema.parse(entity.entityType),
            entityId: entity.entityId,
            reason,
            actor
          })
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return reply.send({
        success: true,
        message: `Archived ${successful} entities, ${failed} failed`,
        results: results.map((r, i) => ({
          entity: entities[i],
          status: r.status,
          error: r.status === 'rejected' ? r.reason?.message : undefined
        }))
      });
    } catch (error) {
      console.error('[archive] Failed to batch archive:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to batch archive'
      });
    }
  });
}