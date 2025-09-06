export declare function logAdminActivity(activity_type: string, description: string, actor_id: string, actor_role: string, target_id?: string, target_type?: string, metadata?: Record<string, any>): Promise<any>;
interface ActivityFilters {
    activity_type?: string;
    actor_role?: string;
    target_type?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    limit?: number;
    offset?: number;
}
export declare function getActivityLog(filters?: ActivityFilters): Promise<{
    items: any[];
    total: number;
    page: number;
    pageSize: number;
    filters: {
        activity_type: string | undefined;
        actor_role: string | undefined;
        target_type: string | undefined;
        date_from: string | undefined;
        date_to: string | undefined;
        search: string | undefined;
    };
}>;
export declare function getActivityStatistics(days?: number): Promise<{
    period_days: number;
    by_type: any[];
    by_role: any[];
    daily_counts: any[];
    most_active_actors: any[];
    generated_at: string;
}>;
export declare function cleanupOldActivity(days?: number): Promise<{
    deleted_count: number | null;
    days_threshold: number;
}>;
export declare function detectSuspiciousActivity(): Promise<{
    multiple_failed_logins: any[];
    bulk_deletes: any[];
    off_hours_activity: any[];
    detected_at: string;
}>;
export {};
//# sourceMappingURL=activity-operations.d.ts.map