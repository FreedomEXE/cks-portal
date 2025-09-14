export declare function getEntityCounts(managerId: string): Promise<{
    contractors: number;
    customers: number;
    centers: number;
    crew: number;
}>;
export declare function getRecentActivity(managerId: string, limit?: number): Promise<any[]>;
export declare function getOrderStats(managerId: string): Promise<{
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    revenue_this_month: number;
}>;
export declare function getPerformanceMetrics(managerId: string): Promise<{
    avg_completion_time: number;
    customer_satisfaction: number;
    on_time_delivery: number;
}>;
//# sourceMappingURL=dashboard.repo.d.ts.map