export interface ActivityFilters {
    limit?: number;
    category?: string;
    date_from?: string;
    date_to?: string;
    action_type?: string;
}
/**
 * Get activity logs for dashboard based on user scope
 */
export declare function getActivityForDashboard(userId: string, scope: 'global' | 'ecosystem' | 'entity', roleCode: string, filters?: ActivityFilters): Promise<any[]>;
/**
 * Clear activity logs (admin/manager only)
 */
export declare function clearActivityLogs(userId: string, category?: string): Promise<number>;
/**
 * Get activity statistics
 */
export declare function getActivityStats(userId: string, scope: 'global' | 'ecosystem' | 'entity', roleCode: string, dateRange?: {
    from: string;
    to: string;
}): Promise<any>;
//# sourceMappingURL=repository.d.ts.map