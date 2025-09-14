/**
 * File: dashboard.service.ts
 *
 * Description: Business logic to compute KPIs; may query orders/activity.
 * Function: Aggregate data to produce Contractor dashboard KPIs.
 * Importance: Drives Dashboard tab insights and metrics.
 * Connects to: dashboard.repo.ts, orders.repo.ts.
 */
import type { DashboardKPI } from '../validators/dashboard.schema';
export declare function getDashboardKPIs(contractorId: string): Promise<DashboardKPI>;
export declare function getDashboardData(contractorId: string): Promise<{
    kpis: {
        activeJobs: number;
        completedJobs: number;
        totalRevenue: number;
        avgRating: number;
    };
    jobStats: {
        total: number;
        pending: number;
        in_progress: number;
        completed: number;
        revenue_this_month: number;
    };
    performanceMetrics: {
        avg_rating: number;
        completion_rate: number;
        on_time_delivery: number;
    };
    recentActivity: any[];
    summary: {
        totalRevenue: number;
        activeJobs: number;
        completedThisMonth: number;
        avgRating: number;
    };
}>;
export declare function getOrdersOverview(contractorId: string): Promise<{
    statusCounts: Record<string, number>;
    recentOrders: any[];
    totalOrders: number;
}>;
//# sourceMappingURL=dashboard.service.d.ts.map