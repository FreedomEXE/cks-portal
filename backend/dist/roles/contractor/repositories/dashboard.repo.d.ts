export declare function getEntityCounts(contractorId: string): Promise<{
    activeJobs: number;
    completedJobs: number;
    totalRevenue: number;
    avgRating: number;
}>;
export declare function getRecentActivity(contractorId: string, limit?: number): Promise<any[]>;
export declare function getJobStats(contractorId: string): Promise<{
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    revenue_this_month: number;
}>;
export declare function getPerformanceMetrics(contractorId: string): Promise<{
    avg_rating: number;
    completion_rate: number;
    on_time_delivery: number;
}>;
//# sourceMappingURL=dashboard.repo.d.ts.map