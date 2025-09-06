export { getNextIdGeneric, upsertAppUserByEmail, createManager, getManagers, archiveManager, getArchivedManagers, createContractor, createCustomer } from './user-management';
export { getArchivedEntities, restoreEntity, getArchiveStatistics, bulkRestoreEntities } from './archive-operations';
export { logAdminActivity, getActivityLog, getActivityStatistics, cleanupOldActivity, detectSuspiciousActivity } from './activity-operations';
export interface AdminUser {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    status: 'active' | 'inactive' | 'pending';
    created_at: string;
    updated_at: string;
    archived_at?: string;
}
export interface ActivityLogEntry {
    activity_id: number;
    activity_type: string;
    description: string;
    actor_id: string;
    actor_role: string;
    target_id?: string;
    target_type?: string;
    metadata?: Record<string, any>;
    created_at: string;
}
export interface ArchiveStatistics {
    managers: number;
    contractors: number;
    customers: number;
    centers: number;
    crew: number;
    warehouses: number;
    total: number;
}
//# sourceMappingURL=index.d.ts.map