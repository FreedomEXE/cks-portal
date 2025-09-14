/**
 * Log user activity to the audit trail
 */
export declare function logActivity(userId: string, userRole: string, actionType: string, actionCategory: string, description: string, entityType: string | null, entityId: string | null, metadata?: any, sessionId?: string, ipAddress?: string, userAgent?: string): Promise<void>;
/**
 * Activity logging helpers for common operations
 */
export declare const ActivityLog: {
    /**
     * User authentication events
     */
    auth: {
        login: (userId: string, roleCode: string, metadata?: any, sessionId?: string, ip?: string, userAgent?: string) => Promise<void>;
        logout: (userId: string, roleCode: string, metadata?: any, sessionId?: string, ip?: string) => Promise<void>;
        denied: (userId: string, roleCode: string, endpoint: string, metadata?: any, sessionId?: string, ip?: string) => Promise<void>;
        granted: (userId: string, roleCode: string, endpoint: string, metadata?: any, sessionId?: string, ip?: string) => Promise<void>;
    };
    /**
     * CRUD operations
     */
    crud: {
        create: (userId: string, roleCode: string, entityType: string, entityId: string, description: string, metadata?: any, sessionId?: string) => Promise<void>;
        read: (userId: string, roleCode: string, entityType: string, entityId: string, description: string, metadata?: any, sessionId?: string) => Promise<void>;
        update: (userId: string, roleCode: string, entityType: string, entityId: string, description: string, metadata?: any, sessionId?: string) => Promise<void>;
        delete: (userId: string, roleCode: string, entityType: string, entityId: string, description: string, metadata?: any, sessionId?: string) => Promise<void>;
        archive: (userId: string, roleCode: string, entityType: string, entityId: string, description: string, metadata?: any, sessionId?: string) => Promise<void>;
    };
    /**
     * Business operations
     */
    business: {
        orderCreate: (userId: string, roleCode: string, orderId: string, metadata?: any, sessionId?: string) => Promise<void>;
        orderStatusChange: (userId: string, roleCode: string, orderId: string, fromStatus: string, toStatus: string, metadata?: any, sessionId?: string) => Promise<void>;
        assignmentCreate: (userId: string, roleCode: string, assignmentId: string, metadata?: any, sessionId?: string) => Promise<void>;
        userInvite: (userId: string, roleCode: string, invitedUserId: string, metadata?: any, sessionId?: string) => Promise<void>;
    };
    /**
     * System operations
     */
    system: {
        error: (userId: string, roleCode: string, errorCode: string, description: string, metadata?: any, sessionId?: string) => Promise<void>;
        maintenance: (userId: string, roleCode: string, operation: string, description: string, metadata?: any, sessionId?: string) => Promise<void>;
        backup: (userId: string, roleCode: string, backupId: string, metadata?: any, sessionId?: string) => Promise<void>;
        dataExport: (userId: string, roleCode: string, exportType: string, metadata?: any, sessionId?: string) => Promise<void>;
    };
    /**
     * Security events
     */
    security: {
        suspiciousActivity: (userId: string, roleCode: string, description: string, metadata?: any, sessionId?: string, ip?: string) => Promise<void>;
        permissionChange: (userId: string, roleCode: string, targetUserId: string, description: string, metadata?: any, sessionId?: string) => Promise<void>;
        roleChange: (userId: string, roleCode: string, targetUserId: string, fromRole: string, toRole: string, metadata?: any, sessionId?: string) => Promise<void>;
        dataAccess: (userId: string, roleCode: string, accessedEntity: string, entityId: string, metadata?: any, sessionId?: string, ip?: string) => Promise<void>;
    };
};
/**
 * Bulk logging for batch operations
 */
export declare function logBatchActivity(activities: Array<{
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
}>): Promise<void>;
/**
 * Query activity logs with filters
 */
export declare function getActivityLogs(filters: {
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
}): Promise<any[]>;
//# sourceMappingURL=audit.d.ts.map