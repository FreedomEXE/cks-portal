"use strict";
/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLog = void 0;
exports.logActivity = logActivity;
exports.logBatchActivity = logBatchActivity;
exports.getActivityLogs = getActivityLogs;
/**
 * File: audit.ts
 *
 * Description: Centralized audit logging for all CKS operations
 * Function: Track user actions, system events, and security operations
 * Importance: Compliance, debugging, and security monitoring
 * Connects to: Database log_activity function, all domain operations
 */
const connection_1 = __importDefault(require("../../db/connection"));
/**
 * Log user activity to the audit trail
 */
async function logActivity(userId, userRole, actionType, actionCategory, description, entityType, entityId, metadata = null, sessionId, ipAddress, userAgent) {
    try {
        await connection_1.default.query(`SELECT log_activity($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [
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
        ]);
    }
    catch (error) {
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
exports.ActivityLog = {
    /**
     * User authentication events
     */
    auth: {
        login: (userId, roleCode, metadata, sessionId, ip, userAgent) => logActivity(userId, roleCode, 'auth_login', 'authentication', 'User logged in', 'user', userId, metadata, sessionId, ip, userAgent),
        logout: (userId, roleCode, metadata, sessionId, ip) => logActivity(userId, roleCode, 'auth_logout', 'authentication', 'User logged out', 'user', userId, metadata, sessionId, ip),
        denied: (userId, roleCode, endpoint, metadata, sessionId, ip) => logActivity(userId, roleCode, 'auth_denied', 'authorization', `Access denied to ${endpoint}`, 'endpoint', endpoint, metadata, sessionId, ip),
        granted: (userId, roleCode, endpoint, metadata, sessionId, ip) => logActivity(userId, roleCode, 'auth_granted', 'authorization', `Access granted to ${endpoint}`, 'endpoint', endpoint, metadata, sessionId, ip)
    },
    /**
     * CRUD operations
     */
    crud: {
        create: (userId, roleCode, entityType, entityId, description, metadata, sessionId) => logActivity(userId, roleCode, 'create', 'data', description, entityType, entityId, metadata, sessionId),
        read: (userId, roleCode, entityType, entityId, description, metadata, sessionId) => logActivity(userId, roleCode, 'read', 'data', description, entityType, entityId, metadata, sessionId),
        update: (userId, roleCode, entityType, entityId, description, metadata, sessionId) => logActivity(userId, roleCode, 'update', 'data', description, entityType, entityId, metadata, sessionId),
        delete: (userId, roleCode, entityType, entityId, description, metadata, sessionId) => logActivity(userId, roleCode, 'delete', 'data', description, entityType, entityId, metadata, sessionId),
        archive: (userId, roleCode, entityType, entityId, description, metadata, sessionId) => logActivity(userId, roleCode, 'archive', 'data', description, entityType, entityId, metadata, sessionId)
    },
    /**
     * Business operations
     */
    business: {
        orderCreate: (userId, roleCode, orderId, metadata, sessionId) => logActivity(userId, roleCode, 'order_create', 'business', 'New order created', 'order', orderId, metadata, sessionId),
        orderStatusChange: (userId, roleCode, orderId, fromStatus, toStatus, metadata, sessionId) => logActivity(userId, roleCode, 'order_status_change', 'business', `Order status changed from ${fromStatus} to ${toStatus}`, 'order', orderId, { fromStatus, toStatus, ...metadata }, sessionId),
        assignmentCreate: (userId, roleCode, assignmentId, metadata, sessionId) => logActivity(userId, roleCode, 'assignment_create', 'business', 'New assignment created', 'assignment', assignmentId, metadata, sessionId),
        userInvite: (userId, roleCode, invitedUserId, metadata, sessionId) => logActivity(userId, roleCode, 'user_invite', 'business', 'User invitation sent', 'user', invitedUserId, metadata, sessionId)
    },
    /**
     * System operations
     */
    system: {
        error: (userId, roleCode, errorCode, description, metadata, sessionId) => logActivity(userId, roleCode, 'system_error', 'system', description, 'error', errorCode, metadata, sessionId),
        maintenance: (userId, roleCode, operation, description, metadata, sessionId) => logActivity(userId, roleCode, 'maintenance', 'system', description, 'operation', operation, metadata, sessionId),
        backup: (userId, roleCode, backupId, metadata, sessionId) => logActivity(userId, roleCode, 'backup', 'system', 'System backup performed', 'backup', backupId, metadata, sessionId),
        dataExport: (userId, roleCode, exportType, metadata, sessionId) => logActivity(userId, roleCode, 'data_export', 'system', `Data export: ${exportType}`, 'export', exportType, metadata, sessionId)
    },
    /**
     * Security events
     */
    security: {
        suspiciousActivity: (userId, roleCode, description, metadata, sessionId, ip) => logActivity(userId, roleCode, 'suspicious_activity', 'security', description, 'security_event', 'suspicious', metadata, sessionId, ip),
        permissionChange: (userId, roleCode, targetUserId, description, metadata, sessionId) => logActivity(userId, roleCode, 'permission_change', 'security', description, 'user', targetUserId, metadata, sessionId),
        roleChange: (userId, roleCode, targetUserId, fromRole, toRole, metadata, sessionId) => logActivity(userId, roleCode, 'role_change', 'security', `Role changed from ${fromRole} to ${toRole}`, 'user', targetUserId, { fromRole, toRole, ...metadata }, sessionId),
        dataAccess: (userId, roleCode, accessedEntity, entityId, metadata, sessionId, ip) => logActivity(userId, roleCode, 'data_access', 'security', `Accessed ${accessedEntity}`, accessedEntity, entityId, metadata, sessionId, ip)
    }
};
/**
 * Bulk logging for batch operations
 */
async function logBatchActivity(activities) {
    try {
        // Process in chunks to avoid overwhelming the database
        const chunkSize = 50;
        for (let i = 0; i < activities.length; i += chunkSize) {
            const chunk = activities.slice(i, i + chunkSize);
            await Promise.all(chunk.map(activity => logActivity(activity.userId, activity.userRole, activity.actionType, activity.actionCategory, activity.description, activity.entityType, activity.entityId, activity.metadata, activity.sessionId, activity.ipAddress, activity.userAgent)));
        }
    }
    catch (error) {
        console.error('Failed to log batch activities:', error);
    }
}
/**
 * Query activity logs with filters
 */
async function getActivityLogs(filters) {
    try {
        const conditions = [];
        const values = [];
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
        const result = await connection_1.default.query(query, values);
        return result.rows;
    }
    catch (error) {
        console.error('Failed to query activity logs:', error);
        throw error;
    }
}
//# sourceMappingURL=audit.js.map