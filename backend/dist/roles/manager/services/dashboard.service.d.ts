/**
 * File: dashboard.service.ts
 *
 * Description: Business logic to compute KPIs; may query orders/activity.
 * Function: Aggregate data to produce Manager dashboard KPIs.
 * Importance: Drives Dashboard tab insights and metrics.
 * Connects to: dashboard.repo.ts, orders.repo.ts.
 */
import type { DashboardKPI } from '../validators/dashboard.schema';
import * as ordersRepo from '../repositories/orders.repo';
export declare function getDashboardKPIs(managerId: string): Promise<DashboardKPI>;
export declare function getDashboardData(managerId: string): Promise<{
    kpis: {
        contractors: number;
        customers: number;
        centers: number;
        crew: number;
    };
    orderStats: {
        total: number;
        pending: number;
        in_progress: number;
        completed: number;
        revenue_this_month: number;
    };
    performanceMetrics: {
        avg_completion_time: number;
        customer_satisfaction: number;
        on_time_delivery: number;
    };
    recentActivity: any[];
    summary: {
        totalRevenue: number;
        activeOrders: number;
        completedThisMonth: number;
        avgCompletionTime: number;
    };
}>;
export declare function getOrdersOverview(managerId: string): Promise<{
    statusCounts: Record<string, number>;
    recentOrders: ordersRepo.Order[];
    totalOrders: number;
}>;
//# sourceMappingURL=dashboard.service.d.ts.map