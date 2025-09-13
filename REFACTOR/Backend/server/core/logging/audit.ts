/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: audit.ts
 *
 * Description: Centralized audit logging for all CKS operations
 * Function: Track user actions, system events, and security operations
 * Importance: Compliance, debugging, and security monitoring
 * Connects to: Database log_activity function, all domain operations
 */

import pool from '../../db/connection';

/**
 * Log user activity to the audit trail
 */
export async function logActivity(
  userId: string,
  userRole: string,
  actionType: string,
  actionCategory: string,
  description: string,
  entityType: string | null,
  entityId: string | null,
  metadata: any = null,
  sessionId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await pool.query(
      `SELECT log_activity($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        userId?.toUpperCase(),
        userRole?.toLowerCase(),
        actionType,
        actionCategory,
        description,
        entityType,
        entityId?.toUpperCase(),
        metadata ? JSON.stringify(metadata) : null,
        sessionId,
        ipAddress,
        userAgent
      ]
    );
  } catch (error) {
    // Don't throw errors from logging - just log to console
    console.error('Failed to log activity:', {
      error,
      userId,
      actionType,
      description
    });
  }
}

/**
 * Activity logging helpers for common operations
 */
export const ActivityLog = {
  /**
   * User authentication events
   */
  auth: {
    login: (userId: string, roleCode: string, metadata?: any, sessionId?: string, ip?: string, userAgent?: string) =>
      logActivity(userId, roleCode, 'auth_login', 'authentication', 'User logged in', 'user', userId, metadata, sessionId, ip, userAgent),

    logout: (userId: string, roleCode: string, metadata?: any, sessionId?: string, ip?: string) =>
      logActivity(userId, roleCode, 'auth_logout', 'authentication', 'User logged out', 'user', userId, metadata, sessionId, ip),

    denied: (userId: string, roleCode: string, endpoint: string, metadata?: any, sessionId?: string, ip?: string) =>
      logActivity(userId, roleCode, 'auth_denied', 'authorization', `Access denied to ${endpoint}`, 'endpoint', endpoint, metadata, sessionId, ip),

    granted: (userId: string, roleCode: string, endpoint: string, metadata?: any, sessionId?: string, ip?: string) =>
      logActivity(userId, roleCode, 'auth_granted', 'authorization', `Access granted to ${endpoint}`, 'endpoint', endpoint, metadata, sessionId, ip)
  },

  /**
   * CRUD operations
   */
  crud: {
    create: (userId: string, roleCode: string, entityType: string, entityId: string, description: string, metadata?: any, sessionId?: string) =>
      logActivity(userId, roleCode, 'create', 'data', description, entityType, entityId, metadata, sessionId),

    read: (userId: string, roleCode: string, entityType: string, entityId: string, description: string, metadata?: any, sessionId?: string) =>
      logActivity(userId, roleCode, 'read', 'data', description, entityType, entityId, metadata, sessionId),

    update: (userId: string, roleCode: string, entityType: string, entityId: string, description: string, metadata?: any, sessionId?: string) =>
      logActivity(userId, roleCode, 'update', 'data', description, entityType, entityId, metadata, sessionId),

    delete: (userId: string, roleCode: string, entityType: string, entityId: string, description: string, metadata?: any, sessionId?: string) =>
      logActivity(userId, roleCode, 'delete', 'data', description, entityType, entityId, metadata, sessionId),

    archive: (userId: string, roleCode: string, entityType: string, entityId: string, description: string, metadata?: any, sessionId?: string) =>
      logActivity(userId, roleCode, 'archive', 'data', description, entityType, entityId, metadata, sessionId)
  },

  /**
   * Business operations
   */
  business: {
    orderCreate: (userId: string, roleCode: string, orderId: string, metadata?: any, sessionId?: string) =>
      logActivity(userId, roleCode, 'order_create', 'business', 'New order created', 'order', orderId, metadata, sessionId),

    orderStatusChange: (userId: string, roleCode: string, orderId: string, fromStatus: string, toStatus: string, metadata?: any, sessionId?: string) =>
      logActivity(userId, roleCode, 'order_status_change', 'business', `Order status changed from ${fromStatus} to ${toStatus}`, 'order', orderId, { fromStatus, toStatus, ...metadata }, sessionId),

    assignmentCreate: (userId: string, roleCode: string, assignmentId: string, metadata?: any, sessionId?: string) =>
      logActivity(userId, roleCode, 'assignment_create', 'business', 'New assignment created', 'assignment', assignmentId, metadata, sessionId),

    userInvite: (userId: string, roleCode: string, invitedUserId: string, metadata?: any, sessionId?: string) =>
      logActivity(userId, roleCode, 'user_invite', 'business', 'User invitation sent', 'user', invitedUserId, metadata, sessionId)
  },

  /**
   * System operations
   */
  system: {
    error: (userId: string, roleCode: string, errorCode: string, description: string, metadata?: any, sessionId?: string) =>
      logActivity(userId, roleCode, 'system_error', 'system', description, 'error', errorCode, metadata, sessionId),

    maintenance: (userId: string, roleCode: string, operation: string, description: string, metadata?: any, sessionId?: string) =>
      logActivity(userId, roleCode, 'maintenance', 'system', description, 'operation', operation, metadata, sessionId),

    backup: (userId: string, roleCode: string, backupId: string, metadata?: any, sessionId?: string) =>
      logActivity(userId, roleCode, 'backup', 'system', 'System backup performed', 'backup', backupId, metadata, sessionId),

    dataExport: (userId: string, roleCode: string, exportType: string, metadata?: any, sessionId?: string) =>
      logActivity(userId, roleCode, 'data_export', 'system', `Data export: ${exportType}`, 'export', exportType, metadata, sessionId)
  },

  /**
   * Security events
   */
  security: {
    suspiciousActivity: (userId: string, roleCode: string, description: string, metadata?: any, sessionId?: string, ip?: string) =>
      logActivity(userId, roleCode, 'suspicious_activity', 'security', description, 'security_event', 'suspicious', metadata, sessionId, ip),

    permissionChange: (userId: string, roleCode: string, targetUserId: string, description: string, metadata?: any, sessionId?: string) =>
      logActivity(userId, roleCode, 'permission_change', 'security', description, 'user', targetUserId, metadata, sessionId),

    roleChange: (userId: string, roleCode: string, targetUserId: string, fromRole: string, toRole: string, metadata?: any, sessionId?: string) =>
      logActivity(userId, roleCode, 'role_change', 'security', `Role changed from ${fromRole} to ${toRole}`, 'user', targetUserId, { fromRole, toRole, ...metadata }, sessionId),

    dataAccess: (userId: string, roleCode: string, accessedEntity: string, entityId: string, metadata?: any, sessionId?: string, ip?: string) =>
      logActivity(userId, roleCode, 'data_access', 'security', `Accessed ${accessedEntity}`, accessedEntity, entityId, metadata, sessionId, ip)
  }
};

/**
 * Bulk logging for batch operations
 */
export async function logBatchActivity(
  activities: Array<{
    userId: string;
    userRole: string;
    actionType: string;
    actionCategory: string;
    description: string;
    entityType: string | null;
    entityId: string | null;
    metadata?: any;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
  }>
): Promise<void> {
  try {
    // Process in chunks to avoid overwhelming the database
    const chunkSize = 50;
    for (let i = 0; i < activities.length; i += chunkSize) {
      const chunk = activities.slice(i, i + chunkSize);

      await Promise.all(
        chunk.map(activity =>
          logActivity(
            activity.userId,
            activity.userRole,
            activity.actionType,
            activity.actionCategory,
            activity.description,
            activity.entityType,
            activity.entityId,
            activity.metadata,
            activity.sessionId,
            activity.ipAddress,
            activity.userAgent
          )
        )
      );
    }
  } catch (error) {
    console.error('Failed to log batch activities:', error);
  }
}

/**
 * Query activity logs with filters
 */
export async function getActivityLogs(filters: {
  userId?: string;
  userRole?: string;
  actionType?: string;
  actionCategory?: string;
  entityType?: string;
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    // Build WHERE conditions
    if (filters.userId) {
      conditions.push(`user_id = $${++paramCount}`);
      values.push(filters.userId.toUpperCase());
    }

    if (filters.userRole) {
      conditions.push(`user_role = $${++paramCount}`);
      values.push(filters.userRole.toLowerCase());
    }

    if (filters.actionType) {
      conditions.push(`action_type = $${++paramCount}`);
      values.push(filters.actionType);
    }

    if (filters.actionCategory) {
      conditions.push(`action_category = $${++paramCount}`);
      values.push(filters.actionCategory);
    }

    if (filters.entityType) {
      conditions.push(`entity_type = $${++paramCount}`);
      values.push(filters.entityType);
    }

    if (filters.entityId) {
      conditions.push(`entity_id = $${++paramCount}`);
      values.push(filters.entityId.toUpperCase());
    }

    if (filters.dateFrom) {
      conditions.push(`created_at >= $${++paramCount}`);
      values.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      conditions.push(`created_at <= $${++paramCount}`);
      values.push(filters.dateTo);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    const query = `
      SELECT id, user_id, user_role, action_type, action_category, description,
             entity_type, entity_id, metadata, session_id, ip_address, user_agent,
             created_at
      FROM system_activity
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;

    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Failed to query activity logs:', error);
    throw error;
  }
}