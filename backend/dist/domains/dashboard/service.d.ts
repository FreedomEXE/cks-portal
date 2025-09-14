export interface DashboardFeatures {
    kpis: boolean;
    orders: boolean;
    activity: boolean;
    analytics: boolean;
    clearActivity?: boolean;
}
export interface DashboardOptions {
    period?: 'day' | 'week' | 'month' | 'year';
    metrics?: string;
    timeframe?: 'week' | 'month' | 'quarter' | 'year';
    limit?: number;
    category?: string;
    date_from?: string;
    date_to?: string;
}
/**
 * Get dashboard KPIs based on user role and scope
 */
export declare function getDashboardKPIs(userId: string, scope: 'global' | 'ecosystem' | 'entity', roleCode: string, options?: DashboardOptions): Promise<any>;
/**
 * Get comprehensive dashboard data
 */
export declare function getDashboardData(userId: string, scope: 'global' | 'ecosystem' | 'entity', roleCode: string, features: DashboardFeatures): Promise<any>;
/**
 * Get orders overview for dashboard
 */
export declare function getOrdersOverview(userId: string, scope: 'global' | 'ecosystem' | 'entity', roleCode: string): Promise<any>;
/**
 * Get recent activity for dashboard
 */
export declare function getRecentActivity(userId: string, scope: 'global' | 'ecosystem' | 'entity', roleCode: string, options?: DashboardOptions): Promise<any[]>;
/**
 * Get analytics data
 */
export declare function getAnalytics(userId: string, scope: 'global' | 'ecosystem' | 'entity', roleCode: string, options?: DashboardOptions): Promise<any>;
/**
 * Clear activity logs (admin/manager only)
 */
export declare function clearActivity(userId: string, roleCode: string, confirmationCode: string, category?: string): Promise<{
    success: boolean;
    message: string;
    cleared: number;
}>;
//# sourceMappingURL=service.d.ts.map