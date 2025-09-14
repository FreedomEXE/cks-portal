interface ActivityLogEntry {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    description: string;
    metadata?: any;
}
export declare function logActivity(entry: ActivityLogEntry): Promise<void>;
export declare function getActivities(contractorId: string, limit?: number): Promise<any[]>;
export declare function getActivitySummary(contractorId: string, days?: number): Promise<any>;
export {};
//# sourceMappingURL=activity.repo.d.ts.map