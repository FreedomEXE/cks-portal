interface ArchiveOptions {
    limit?: number;
    offset?: number;
    search?: string;
}
export declare function getArchivedEntities(entityType: 'managers' | 'contractors' | 'customers' | 'centers' | 'crew' | 'warehouses', options?: ArchiveOptions): Promise<{
    items: any[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function restoreEntity(entityType: 'managers' | 'contractors' | 'customers' | 'centers' | 'crew' | 'warehouses', entityId: string, admin_user_id?: string): Promise<{
    success: boolean;
    message: string;
}>;
export declare function getArchiveStatistics(): Promise<{
    managers: number;
    contractors: number;
    customers: number;
    centers: number;
    crew: number;
    warehouses: number;
    total: number;
}>;
export declare function bulkRestoreEntities(entityType: 'managers' | 'contractors' | 'customers' | 'centers' | 'crew' | 'warehouses', entityIds: string[], admin_user_id?: string): Promise<{
    restored: string[];
    failed: string[];
}>;
export {};
//# sourceMappingURL=archive-operations.d.ts.map