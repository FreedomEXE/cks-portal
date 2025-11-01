import { apiFetch } from './client';

export type EntityType = 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse' | 'service' | 'product' | 'order' | 'report' | 'feedback' | 'catalogService';

export interface ArchivedEntity {
  id: string;
  entityType: EntityType;
  name: string;
  archivedAt: string;
  archivedBy: string;
  archiveReason?: string;
  deletionScheduled?: string;
}

export interface ArchiveRelationship {
  id: number;
  entity_type: string;
  entity_id: string;
  parent_type: string;
  parent_id: string;
  relationship_data?: any;
  archived_at: string;
  archived_by: string;
  restored: boolean;
}

export interface ArchiveResult {
  success: boolean;
  message: string;
  unassignedChildren?: number;
}

export interface BatchArchiveResult {
  success: boolean;
  message: string;
  results: Array<{
    entity: { entityType: string; entityId: string };
    status: 'fulfilled' | 'rejected';
    error?: string;
  }>;
}

class ArchiveAPI {
  /**
   * List archived entities, optionally filtered by type
   */
  async listArchived(entityType?: EntityType, limit = 100): Promise<ArchivedEntity[]> {
    const params = new URLSearchParams();
    if (entityType) params.append('entityType', entityType);
    params.append('limit', limit.toString());

    console.log('[archiveAPI.listArchived] Called with:', { entityType, limit });
    console.log('[archiveAPI.listArchived] URL:', `/archive/list?${params}`);

    try {
      const result = await apiFetch<{ success: boolean; data: ArchivedEntity[] }>(
        `/archive/list?${params}`
      );
      console.log('[archiveAPI.listArchived] Result:', result);
      return result.data || [];
    } catch (error) {
      console.error('[archiveAPI.listArchived] Error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to list archived entities');
    }
  }

  /**
   * Archive (soft delete) an entity
   */
  async archiveEntity(
    entityType: EntityType,
    entityId: string,
    reason?: string
  ): Promise<ArchiveResult> {
    try {
      const result = await apiFetch<ArchiveResult>('/archive/delete', {
        method: 'POST',
        body: JSON.stringify({
          entityType,
          entityId,
          reason
        })
      });
      return result;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to archive entity');
    }
  }

  /**
   * Restore an entity from archive
   */
  async restoreEntity(entityType: EntityType, entityId: string): Promise<ArchiveResult> {
    try {
      const result = await apiFetch<ArchiveResult>('/archive/restore', {
        method: 'POST',
        body: JSON.stringify({
          entityType,
          entityId
        })
      });
      return result;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to restore entity');
    }
  }

  /**
   * Get archived relationships for an entity
   */
  async getRelationships(
    entityType: EntityType,
    entityId: string
  ): Promise<ArchiveRelationship[]> {
    try {
      const result = await apiFetch<{ success: boolean; data: ArchiveRelationship[] }>(
        `/archive/relationships/${entityType}/${entityId}`
      );
      return result.data || [];
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get relationships');
    }
  }

  /**
   * Permanently delete an entity (requires confirmation)
   */
  async hardDelete(
    entityType: EntityType,
    entityId: string,
    reason?: string
  ): Promise<ArchiveResult> {
    try {
      const result = await apiFetch<ArchiveResult>('/archive/hard-delete', {
        method: 'DELETE',
        body: JSON.stringify({
          entityType,
          entityId,
          reason,
          confirm: true
        })
      });
      return result;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to permanently delete entity');
    }
  }

  /**
   * Batch archive multiple entities
   */
  async batchArchive(
    entities: Array<{ entityType: EntityType; entityId: string }>,
    reason?: string
  ): Promise<BatchArchiveResult> {
    try {
      return await apiFetch<BatchArchiveResult>('/archive/batch-delete', {
        method: 'POST',
        body: JSON.stringify({
          entities,
          reason
        })
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to batch archive');
    }
  }
}

export const archiveAPI = new ArchiveAPI();
