export interface DashboardOptions {
    period?: 'day' | 'week' | 'month' | 'year';
    metrics?: string;
    timeframe?: 'week' | 'month' | 'quarter' | 'year';
    limit?: number;
}
/**
 * Get global KPIs (Admin/Manager scope)
 */
export declare function getGlobalKPIs(userId: string, roleCode: string, options?: DashboardOptions): Promise<any>;
/**
 * Get ecosystem KPIs (Contractor scope)
 */
export declare function getEcosystemKPIs(userId: string, roleCode: string, options?: DashboardOptions): Promise<any>;
/**
 * Get entity KPIs (Customer/Center/Crew/Warehouse scope)
 */
export declare function getEntityKPIs(userId: string, roleCode: string, options?: DashboardOptions): Promise<any>;
/**
 * Get order counts by status
 */
export declare function getOrderCounts(userId: string, scope: 'global' | 'ecosystem' | 'entity', roleCode: string): Promise<Record<string, number>>;
/**
 * Get recent orders for dashboard
 */
export declare function getRecentOrders(userId: string, scope: 'global' | 'ecosystem' | 'entity', roleCode: string, limit?: number): Promise<any[]>;
/**
 * Get performance metrics
 */
export declare function getPerformanceMetrics(userId: string, scope: 'global' | 'ecosystem' | 'entity', roleCode: string): Promise<any>;
/**
 * Get analytics data
 */
export declare function getAnalytics(userId: string, scope: 'global' | 'ecosystem' | 'entity', roleCode: string, options?: DashboardOptions): Promise<any>;
//# sourceMappingURL=repository.d.ts.map