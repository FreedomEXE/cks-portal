/**
 * Activity API Routes
 *
 * Endpoints for querying entity lifecycle history and deleted snapshots.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../../db/connection';
import { getEntityDefinition, supportsLifecycleAction, getActivityType } from '../../shared/entityCatalog';
import { requireActiveRole } from '../../core/auth/guards';
import { dismissActivity } from '../directory/store';

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

      // Use the concrete snake_case activity key to derive a LIKE prefix
      // Example: created key 'catalog_service_created' -> LIKE 'catalog_service_%'
      const likePrefixSnake = getActivityType(validatedType, 'created').replace(/_created$/i, '_%');
      const likePrefixCamel = `${validatedType}_%`;

      // Build related assignment event filter based on entity type
      // This allows parent entities to see assignment events logged against children
      let relatedAssignmentClause = '';

      switch (validatedType) {
        case 'manager':
          // Include contractor assignments where this manager is referenced
          relatedAssignmentClause = `
            OR (
              activity_type = 'contractor_assigned_to_manager'
              AND metadata ? 'managerId'
              AND UPPER(metadata->>'managerId') = UPPER($1)
            )
          `;
          break;
        case 'contractor':
          // Include customer assignments where this contractor is referenced
          relatedAssignmentClause = `
            OR (
              activity_type = 'customer_assigned_to_contractor'
              AND metadata ? 'contractorId'
              AND UPPER(metadata->>'contractorId') = UPPER($1)
            )
          `;
          break;
        case 'customer':
          // Include center assignments where this customer is referenced
          relatedAssignmentClause = `
            OR (
              activity_type = 'center_assigned_to_customer'
              AND metadata ? 'customerId'
              AND UPPER(metadata->>'customerId') = UPPER($1)
            )
          `;
          break;
        case 'center':
          // Include crew assignments where this center is referenced
          relatedAssignmentClause = `
            OR (
              activity_type = 'crew_assigned_to_center'
              AND metadata ? 'centerId'
              AND UPPER(metadata->>'centerId') = UPPER($1)
            )
          `;
          break;
        case 'warehouse':
          // Include order assignments where this warehouse is referenced
          relatedAssignmentClause = `
            OR (
              activity_type = 'order_assigned_to_warehouse'
              AND metadata ? 'warehouseId'
              AND UPPER(metadata->>'warehouseId') = UPPER($1)
            )
          `;
          break;
        case 'catalogService':
          // Include certification events for this service (match by target_id OR metadata.serviceId)
          relatedAssignmentClause = `
            OR (
              activity_type IN ('catalog_service_certified', 'catalog_service_decertified')
              AND (
                UPPER(target_id) = UPPER($1)
                OR (metadata ? 'serviceId' AND UPPER(metadata->>'serviceId') = UPPER($1))
              )
            )
          `;
          break;
        default:
          // No related assignments for other entity types
          relatedAssignmentClause = '';
      }

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
        WHERE (
          (
            UPPER(target_id) = UPPER($1)
            AND target_type = $2
            AND (
              activity_type = ANY($3)
              OR activity_type LIKE $4
              OR activity_type LIKE $5
            )
          )
          ${relatedAssignmentClause}
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
          likePrefixSnake, // snake_case (catalog_service_*)
          likePrefixCamel, // camel prefix (catalogService_*)
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

  /**
   * POST /api/activities/:activityId/dismiss
   *
   * Dismiss an activity from the current user's feed (per-user hiding).
   * CTO requirement: Use requireActiveRole (not admin-only), catch FK violations.
   */
  fastify.post('/api/activities/:activityId/dismiss', async (request, reply) => {
    // Extract authenticated user (works for all roles, not just admin)
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const activityIdSchema = z.object({
      activityId: z.coerce.number().int().positive(),
    });

    const paramsResult = activityIdSchema.safeParse(request.params);
    if (!paramsResult.success) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid activity ID'
      });
    }

    const { activityId } = paramsResult.data;

    try {
      // Pre-check: Verify activity exists to avoid FK violation 500
      const activityCheck = await query(
        'SELECT 1 FROM system_activity WHERE activity_id = $1',
        [activityId]
      );

      if (activityCheck.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Activity not found'
        });
      }

      // Idempotent insert with ON CONFLICT DO NOTHING
      const success = await dismissActivity(activityId, account.cksCode);

      if (success) {
        return reply.send({
          success: true,
          message: 'Activity dismissed'
        });
      } else {
        return reply.status(500).send({
          success: false,
          error: 'Failed to dismiss activity'
        });
      }

    } catch (error) {
      console.error('[activity] Failed to dismiss activity:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to dismiss activity'
      });
    }
  });

  /**
   * POST /api/activities/dismiss-all
   *
   * Dismiss ALL visible activities for the current user (bulk per-user hiding).
   */
  fastify.post('/api/activities/dismiss-all', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    try {
      // Get all non-dismissed activity IDs for this user
      const activitiesResult = await query(
        `SELECT activity_id FROM system_activity sa
         WHERE NOT EXISTS (
           SELECT 1 FROM activity_dismissals ad
           WHERE ad.activity_id = sa.activity_id AND ad.user_id = $1
         )`,
        [account.cksCode]
      );

      const activityIds = activitiesResult.rows.map(row => row.activity_id);

      if (activityIds.length === 0) {
        return reply.send({
          success: true,
          message: 'No activities to dismiss',
          count: 0
        });
      }

      // Bulk insert dismissals (idempotent with ON CONFLICT)
      const values = activityIds.map(id => `(${id}, '${account.cksCode}')`).join(',');
      const insertResult = await query(
        `INSERT INTO activity_dismissals (activity_id, user_id)
         VALUES ${values}
         ON CONFLICT (activity_id, user_id) DO NOTHING`
      );

      return reply.send({
        success: true,
        message: `${activityIds.length} activities dismissed`,
        count: activityIds.length
      });

    } catch (error) {
      console.error('[activity] Failed to dismiss all activities:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to dismiss all activities'
      });
    }
  });
}
