import { query } from '../../db/connection';
import { normalizeIdentity } from '../identity';
import { getRoleScope } from '../scope/service';
import type { HubRole } from '../profile/types';

type EntityState = 'active' | 'archived' | 'deleted';

export interface EntityResult {
  entity: any;
  state: EntityState;
  deletedAt?: string;
  deletedBy?: string;
  archivedAt?: string;
  archivedBy?: string;
}

/**
 * Check if user has access to entity based on ecosystem scope
 * Admin always has access. Other roles only see entities in their ecosystem.
 */
export async function checkEntityAccess(
  userRole: HubRole | 'admin',
  userCksCode: string,
  entityType: string,
  entityId: string
): Promise<boolean> {
  // Admin has access to everything
  if (userRole === 'admin') {
    return true;
  }

  // Get user's ecosystem scope
  const scope = await getRoleScope(userRole, userCksCode);
  if (!scope) {
    return false;
  }

  const normalizedEntityId = normalizeIdentity(entityId);
  if (!normalizedEntityId) {
    return false;
  }

  // Check if entity is in user's ecosystem
  // Scope includes: contractors, customers, centers, crew for managers
  // For other roles, check their specific scope relationships
  const allScopeIds: string[] = [];

  // Add the user themselves
  allScopeIds.push(scope.cksCode.toUpperCase());

  // Add all relationship IDs from scope
  if ('relationships' in scope && scope.relationships) {
    const rels = scope.relationships as any;

    if (rels.contractors) {
      allScopeIds.push(...rels.contractors.map((c: any) => normalizeIdentity(c.id)).filter(Boolean));
    }
    if (rels.customers) {
      allScopeIds.push(...rels.customers.map((c: any) => normalizeIdentity(c.id)).filter(Boolean));
    }
    if (rels.centers) {
      allScopeIds.push(...rels.centers.map((c: any) => normalizeIdentity(c.id)).filter(Boolean));
    }
    if (rels.crew) {
      allScopeIds.push(...rels.crew.map((c: any) => normalizeIdentity(c.id)).filter(Boolean));
    }
    if (rels.warehouses) {
      allScopeIds.push(...rels.warehouses.map((w: any) => normalizeIdentity(w.id)).filter(Boolean));
    }
    if (rels.managers) {
      allScopeIds.push(...rels.managers.map((m: any) => normalizeIdentity(m.id)).filter(Boolean));
    }
    if (rels.services) {
      allScopeIds.push(...rels.services.map((s: any) => normalizeIdentity(s.id)).filter(Boolean));
    }
  }

  // Check if entity is in scope
  const isInScope = allScopeIds.some(id => id === normalizedEntityId.toUpperCase());

  // For orders/services/reports, we need to check if they belong to anyone in scope
  // This is a more permissive check - if the order is created by or belongs to anyone in the ecosystem
  if (!isInScope && ['order', 'service', 'report', 'feedback'].includes(entityType)) {
    // Query the entity to check its relationships
    const { tableName, idColumn } = getTableInfo(entityType);
    const entityCheck = await query(
      `SELECT * FROM ${tableName} WHERE ${idColumn} = $1`,
      [normalizedEntityId]
    );

    if (entityCheck.rowCount && entityCheck.rowCount > 0) {
      const entity = entityCheck.rows[0];

      // Check if any participant is in scope
      const participantFields = [
        'requested_by_code',
        'destination_code',
        'center_id',
        'customer_id',
        'manager_id',
        'contractor_id',
        'crew_id',
        'warehouse_id',
        'created_by',
        'assigned_to',
      ];

      for (const field of participantFields) {
        if (entity[field]) {
          const participantId = normalizeIdentity(entity[field]);
          if (participantId && allScopeIds.some(id => id === participantId.toUpperCase())) {
            return true;
          }
        }
      }
    }
  }

  return isInScope;
}

/**
 * Fetch entity with smart fallback logic:
 * 1. Try active (not archived)
 * 2. Try archived
 * 3. If includeDeleted, check deletion activity for snapshot
 */
export async function getEntityWithFallback(
  entityType: string,
  entityId: string,
  includeDeleted: boolean
): Promise<EntityResult> {
  const normalizedId = normalizeIdentity(entityId);
  if (!normalizedId) {
    throw new Error('Invalid entity ID');
  }

  // Determine table and ID column based on entity type
  const { tableName, idColumn } = getTableInfo(entityType);

  // 1. Try live data (not archived)
  const liveResult = await query(
    `SELECT * FROM ${tableName} WHERE ${idColumn} = $1 AND archived_at IS NULL`,
    [normalizedId]
  );

  if (liveResult.rowCount && liveResult.rowCount > 0) {
    return {
      entity: liveResult.rows[0],
      state: 'active'
    };
  }

  // 2. Try archived data
  const archivedResult = await query(
    `SELECT * FROM ${tableName} WHERE ${idColumn} = $1 AND archived_at IS NOT NULL`,
    [normalizedId]
  );

  if (archivedResult.rowCount && archivedResult.rowCount > 0) {
    const archivedRow = archivedResult.rows[0];
    return {
      entity: archivedRow,
      state: 'archived',
      archivedAt: archivedRow.archived_at,
      archivedBy: archivedRow.archived_by
    };
  }

  // 3. If includeDeleted, check deletion activity for snapshot
  if (includeDeleted) {
    const deletionActivity = await query(
      `SELECT metadata, actor_id, created_at
       FROM system_activity
       WHERE target_id = $1
         AND target_type = $2
         AND activity_type = $3
       ORDER BY created_at DESC
       LIMIT 1`,
      [normalizedId, entityType, `${entityType}_hard_deleted`]
    );

    if (deletionActivity.rowCount && deletionActivity.rowCount > 0) {
      const activity = deletionActivity.rows[0];
      const snapshot = activity.metadata?.snapshot;

      if (snapshot) {
        return {
          entity: snapshot,
          state: 'deleted',
          deletedAt: activity.metadata?.deletedAt || activity.created_at,
          deletedBy: activity.actor_id
        };
      } else {
        // Deletion activity exists but no snapshot (pre-enrichment deletion)
        // Return minimal tombstone info for frontend to show "Entity was deleted" banner
        return {
          entity: {
            [`${getTableInfo(entityType).idColumn}`]: normalizedId,
            _tombstone: true,
            _note: 'Deletion occurred before snapshot enrichment was implemented'
          },
          state: 'deleted',
          deletedAt: activity.metadata?.deletedAt || activity.created_at,
          deletedBy: activity.actor_id
        };
      }
    }
  }

  throw new Error('Entity not found');
}

/**
 * Map entity type to table name and ID column
 * SECURITY: Strict whitelist only - no dynamic table names
 */
function getTableInfo(entityType: string): { tableName: string; idColumn: string } {
  const ALLOWED_ENTITIES: Record<string, { tableName: string; idColumn: string }> = {
    'crew': { tableName: 'crew', idColumn: 'crew_id' },
    'product': { tableName: 'inventory_items', idColumn: 'item_id' },
    'warehouse': { tableName: 'warehouses', idColumn: 'warehouse_id' },
    'service': { tableName: 'services', idColumn: 'service_id' },
    'order': { tableName: 'orders', idColumn: 'order_id' },
    'report': { tableName: 'reports', idColumn: 'report_id' },
    'feedback': { tableName: 'feedback', idColumn: 'feedback_id' },
    'manager': { tableName: 'managers', idColumn: 'manager_id' },
    'contractor': { tableName: 'contractors', idColumn: 'contractor_id' },
    'customer': { tableName: 'customers', idColumn: 'customer_id' },
    'center': { tableName: 'centers', idColumn: 'center_id' },
  };

  if (!ALLOWED_ENTITIES[entityType]) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }

  return ALLOWED_ENTITIES[entityType];
}
