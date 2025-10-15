/**
 * Centralized activity writer for recording system activities.
 *
 * Non-blocking: Activity writes are try/catch wrapped and will never
 * fail the main operation. Errors are logged but not thrown.
 *
 * Transactional: Accepts optional query function for use within transactions.
 */

import { query, type QueryResult, type QueryResultRow } from '../../db/connection';

export interface ActivityWriterPayload {
  activityType: string;
  description: string;
  actorId: string;
  actorRole: string;
  targetId: string;
  targetType: string;
  metadata?: Record<string, unknown>;
}

type QueryFunction = <R extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: readonly unknown[],
) => Promise<QueryResult<R>>;

/**
 * Record an activity to system_activity table.
 *
 * @param payload - Activity details including actor, target, and metadata
 * @param options - Optional configuration
 * @param options.txQuery - Optional transaction query function (for atomic operations)
 * @param options.throwOnError - If true, throws errors instead of logging them (default: false)
 * @returns Promise<void> - Never throws unless throwOnError=true
 *
 * @example
 * // Standalone usage (non-blocking)
 * await recordActivity({
 *   activityType: 'order_created',
 *   description: 'Product order PO-123 created',
 *   actorId: 'CEN-010',
 *   actorRole: 'center',
 *   targetId: 'PO-123',
 *   targetType: 'order',
 *   metadata: { orderId: 'PO-123', orderType: 'product' },
 * });
 *
 * @example
 * // Within transaction (blocking)
 * await withTransaction(async (txQuery) => {
 *   await recordActivity(payload, { txQuery, throwOnError: true });
 *   // ... other transaction operations
 * });
 */
export async function recordActivity(
  payload: ActivityWriterPayload,
  options?: { txQuery?: QueryFunction; throwOnError?: boolean }
): Promise<void> {
  const queryFn = options?.txQuery ?? query;
  const throwOnError = options?.throwOnError ?? false;

  try {
    await queryFn(
      `INSERT INTO system_activity (
        activity_type,
        description,
        actor_id,
        actor_role,
        target_id,
        target_type,
        metadata,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW())`,
      [
        payload.activityType,
        payload.description,
        payload.actorId,
        payload.actorRole,
        payload.targetId,
        payload.targetType,
        payload.metadata ? JSON.stringify(payload.metadata) : null,
      ],
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn('[activity-writer] Failed to record activity', {
      activityType: payload.activityType,
      targetId: payload.targetId,
      actorId: payload.actorId,
      error: errorMsg,
    });

    if (throwOnError) {
      throw error;
    }
  }
}
