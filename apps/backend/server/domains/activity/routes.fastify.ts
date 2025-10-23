/**
 * Activity API Routes
 *
 * Endpoints for querying entity lifecycle history and deleted snapshots.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../../db/connection';
import { getEntityDefinition, supportsLifecycleAction, getActivityType } from '../../shared/entityCatalog';

const EntityTypeSchema = z.enum([
  'manager', 'contractor', 'customer', 'center', 'crew', 'warehouse',
  'service', 'catalogService', 'product', 'order', 'report', 'feedback'
]);

export function registerActivityRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/deleted/:entityType/:entityId/snapshot
   *
   * Retrieve last known state before hard deletion (tombstone view).
   * Returns snapshot data stored in activity log when entity was hard-deleted.
   */
  fastify.get('/api/deleted/:entityType/:entityId/snapshot', async (request, reply) => {
    try {
      const { entityType, entityId } = request.params as {
        entityType: string;
        entityId: string;
      };

      // Validate entity type
      const validatedType = EntityTypeSchema.parse(entityType);
      const entityDef = getEntityDefinition(validatedType);

      // Check if entity supports tombstone retrieval
      if (!supportsLifecycleAction(validatedType, 'tombstone')) {
        return reply.status(400).send({
          success: false,
          error: `${entityDef.displayName} does not support tombstone retrieval`
        });
      }

      // Get activity type for hard deletion
      const deletionActivityType = getActivityType(validatedType, 'deleted');

      console.log('[activity] Fetching deletion snapshot:', {
        entityType: validatedType,
        entityId,
        activityType: deletionActivityType
      });

      // Query activity log for hard deletion event
      const result = await query(
        `SELECT
          metadata,
          created_at,
          actor_id,
          actor_role
         FROM system_activity
         WHERE activity_type = $1
           AND UPPER(target_id) = UPPER($2)
         ORDER BY created_at DESC
         LIMIT 1`,
        [deletionActivityType, entityId]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: `No deletion record found for ${entityDef.displayName} ${entityId}`
        });
      }

      const activity = result.rows[0];
      const metadata = activity.metadata || {};

      // Extract snapshot and deletion metadata
      const snapshot = metadata.snapshot || null;
      const deletedAt = metadata.deletedAt || activity.created_at;
      const deletedBy = activity.actor_id;
      const deletionReason = metadata.reason || null;

      if (!snapshot) {
        return reply.status(404).send({
          success: false,
          error: `Snapshot not available for deleted ${entityDef.displayName} ${entityId}`
        });
      }

      console.log('[activity] Snapshot retrieved successfully:', {
        entityId,
        deletedAt,
        deletedBy
      });

      return reply.send({
        success: true,
        data: {
          snapshot,
          deletedAt,
          deletedBy,
          deletionReason
        }
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid entity type'
        });
      }

      console.error('[activity] Failed to retrieve snapshot:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve snapshot'
      });
    }
  });

  /**
   * GET /api/activity/entity/:entityType/:entityId
   *
   * Get chronological timeline of entity lifecycle events.
   * Returns all lifecycle-related activities for the specified entity.
   */
  fastify.get('/api/activity/entity/:entityType/:entityId', async (request, reply) => {
    try {
      const { entityType, entityId } = request.params as {
        entityType: string;
        entityId: string;
      };

      const { limit } = request.query as {
        limit?: string;
      };

      // Validate entity type
      const validatedType = EntityTypeSchema.parse(entityType);
      const entityDef = getEntityDefinition(validatedType);

      // Check if entity supports history
      if (!supportsLifecycleAction(validatedType, 'history')) {
        return reply.status(400).send({
          success: false,
          error: `${entityDef.displayName} does not support history retrieval`
        });
      }

      console.log('[activity] Fetching entity history:', {
        entityType: validatedType,
        entityId,
        limit: limit || 'unlimited'
      });

      // Build lifecycle event filter
      // Include: created, archived, restored, deleted, and entity-specific actions
      const activityTypes = [
        getActivityType(validatedType, 'created'),
        getActivityType(validatedType, 'archived'),
        getActivityType(validatedType, 'restored'),
        getActivityType(validatedType, 'deleted'),
      ];

      // Query activity log for all matching events
      const queryText = `
        SELECT
          activity_id,
          activity_type,
          description,
          actor_id,
          actor_role,
          target_id,
          target_type,
          metadata,
          created_at
        FROM system_activity
        WHERE UPPER(target_id) = UPPER($1)
          AND target_type = $2
          AND (
            activity_type = ANY($3)
            OR activity_type LIKE $4
          )
        ORDER BY created_at ASC
        ${limit ? `LIMIT ${parseInt(limit)}` : ''}
      `;

      const result = await query(
        queryText,
        [
          entityId,
          validatedType,
          activityTypes,
          `${validatedType}_%` // Catch any entity-specific events
        ]
      );

      // Transform to frontend-friendly format
      const events = result.rows.map(row => ({
        id: row.activity_id,
        type: row.activity_type,
        description: row.description,
        timestamp: row.created_at,
        actor: row.actor_id,
        actorRole: row.actor_role,
        reason: row.metadata?.reason || null,
        metadata: row.metadata || {}
      }));

      console.log('[activity] History retrieved:', {
        entityId,
        eventCount: events.length
      });

      return reply.send({
        success: true,
        data: events
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid entity type'
        });
      }

      console.error('[activity] Failed to retrieve history:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve entity history'
      });
    }
  });
}
