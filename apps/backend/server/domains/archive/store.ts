import { query } from '../../db/connection';
import { normalizeIdentity } from '../identity';
import type { AuditContext } from '../provisioning';

export interface ArchivedEntity {
  id: string;
  entityType: 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse' | 'service' | 'product' | 'order' | 'report' | 'feedback';
  name: string;
  archivedAt: Date;
  archivedBy: string;
  archiveReason?: string;
  deletionScheduled?: Date;
  parentInfo?: {
    type: string;
    id: string;
    name: string;
  };
}

interface ArchiveOperation {
  entityType: 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse' | 'service' | 'product' | 'order' | 'report' | 'feedback';
  entityId: string;
  reason?: string;
  actor: AuditContext;
}

interface RestoreOperation {
  entityType: 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse' | 'service' | 'product' | 'order' | 'report' | 'feedback';
  entityId: string;
  actor: AuditContext;
}

async function recordActivity(
  activityType: string,
  description: string,
  targetId: string,
  targetType: string,
  actor: AuditContext,
  metadata?: Record<string, unknown>
): Promise<void> {
  const actorId = normalizeIdentity(actor.actorId) ?? 'ADMIN';
  const actorRole = actor.actorRole || 'admin';

  try {
    await query(
      `INSERT INTO system_activity (
        activity_type, description, actor_id, actor_role,
        target_id, target_type, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW())`,
      [activityType, description, actorId, actorRole, targetId, targetType,
       metadata ? JSON.stringify(metadata) : null]
    );
  } catch (error) {
    console.warn('[archive] Failed to record activity', { activityType, targetId, error });
  }
}

async function storeRelationships(entityType: string, entityId: string, actor: AuditContext): Promise<void> {
  const actorId = normalizeIdentity(actor.actorId) ?? 'ADMIN';

  // Store both parent and child relationships for comprehensive tracking
  switch (entityType) {
    case 'manager': {
      // Store child contractors
      const contractors = await query(
        `SELECT contractor_id, name FROM contractors WHERE cks_manager = $1 AND archived_at IS NULL`,
        [entityId]
      );
      for (const contractor of contractors.rows) {
        await query(
          `INSERT INTO archive_relationships
           (entity_type, entity_id, parent_type, parent_id, relationship_data, archived_by)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
          ['contractor', contractor.contractor_id, 'manager', entityId,
           JSON.stringify({ relationship: 'child', name: contractor.name }), actorId]
        );
      }
      break;
    }

    case 'contractor': {
      // Store parent manager
      const result = await query(
        `SELECT cks_manager,
         (SELECT name FROM managers WHERE manager_id = contractors.cks_manager) as name
         FROM contractors WHERE contractor_id = $1`,
        [entityId]
      );
      if (result.rows[0]?.cks_manager) {
        await query(
          `INSERT INTO archive_relationships
           (entity_type, entity_id, parent_type, parent_id, relationship_data, archived_by)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
          [entityType, entityId, 'manager', result.rows[0].cks_manager,
           JSON.stringify({ relationship: 'parent', name: result.rows[0].name }), actorId]
        );
      }

      // Store child customers
      const customers = await query(
        `SELECT customer_id, name FROM customers WHERE contractor_id = $1 AND archived_at IS NULL`,
        [entityId]
      );
      for (const customer of customers.rows) {
        await query(
          `INSERT INTO archive_relationships
           (entity_type, entity_id, parent_type, parent_id, relationship_data, archived_by)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
          ['customer', customer.customer_id, 'contractor', entityId,
           JSON.stringify({ relationship: 'child', name: customer.name }), actorId]
        );
      }
      break;
    }

    case 'customer': {
      // Store parent contractor
      const result = await query(
        `SELECT contractor_id,
         (SELECT name FROM contractors WHERE contractor_id = customers.contractor_id) as contractor_name
         FROM customers WHERE customer_id = $1`,
        [entityId]
      );
      if (result.rows[0]?.contractor_id) {
        await query(
          `INSERT INTO archive_relationships
           (entity_type, entity_id, parent_type, parent_id, relationship_data, archived_by)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
          [entityType, entityId, 'contractor', result.rows[0].contractor_id,
           JSON.stringify({ relationship: 'parent', name: result.rows[0].contractor_name }), actorId]
        );
      }

      // Store child centers
      const centers = await query(
        `SELECT center_id, name FROM centers WHERE customer_id = $1 AND archived_at IS NULL`,
        [entityId]
      );
      for (const center of centers.rows) {
        await query(
          `INSERT INTO archive_relationships
           (entity_type, entity_id, parent_type, parent_id, relationship_data, archived_by)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
          ['center', center.center_id, 'customer', entityId,
           JSON.stringify({ relationship: 'child', name: center.name }), actorId]
        );
      }
      break;
    }

    case 'center': {
      // Store parent customer (and contractor reference)
      const result = await query(
        `SELECT customer_id, contractor_id,
         (SELECT name FROM customers WHERE customer_id = centers.customer_id) as customer_name,
         (SELECT name FROM contractors WHERE contractor_id = centers.contractor_id) as contractor_name
         FROM centers WHERE center_id = $1`,
        [entityId]
      );
      if (result.rows[0]?.customer_id) {
        await query(
          `INSERT INTO archive_relationships
           (entity_type, entity_id, parent_type, parent_id, relationship_data, archived_by)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
          [entityType, entityId, 'customer', result.rows[0].customer_id,
           JSON.stringify({
             relationship: 'parent',
             name: result.rows[0].customer_name,
             contractor_id: result.rows[0].contractor_id,
             contractor_name: result.rows[0].contractor_name
           }), actorId]
        );
      }

      // Store child crew members
      const crew = await query(
        `SELECT crew_id, name FROM crew WHERE assigned_center = $1 AND archived_at IS NULL`,
        [entityId]
      );
      for (const member of crew.rows) {
        await query(
          `INSERT INTO archive_relationships
           (entity_type, entity_id, parent_type, parent_id, relationship_data, archived_by)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
          ['crew', member.crew_id, 'center', entityId,
           JSON.stringify({ relationship: 'child', name: member.name }), actorId]
        );
      }
      break;
    }

    case 'crew': {
      // Store parent center
      const result = await query(
        `SELECT assigned_center,
         (SELECT name FROM centers WHERE center_id = crew.assigned_center) as center_name
         FROM crew WHERE crew_id = $1`,
        [entityId]
      );
      if (result.rows[0]?.assigned_center) {
        await query(
          `INSERT INTO archive_relationships
           (entity_type, entity_id, parent_type, parent_id, relationship_data, archived_by)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
          [entityType, entityId, 'center', result.rows[0].assigned_center,
           JSON.stringify({ relationship: 'parent', name: result.rows[0].center_name }), actorId]
        );
      }
      break;
    }

    case 'warehouse': {
      // Store manager relationship if exists
      const result = await query(
        `SELECT manager_id,
         (SELECT name FROM managers WHERE manager_id = warehouses.manager_id) as name
         FROM warehouses WHERE warehouse_id = $1`,
        [entityId]
      );
      if (result.rows[0]?.manager_id) {
        await query(
          `INSERT INTO archive_relationships
           (entity_type, entity_id, parent_type, parent_id, relationship_data, archived_by)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
          [entityType, entityId, 'manager', result.rows[0].manager_id,
           JSON.stringify({ relationship: 'managed_by', name: result.rows[0].name }), actorId]
        );
      }
      break;
    }

    case 'service': {
      // Services don't have parent relationships but we can track usage
      // Store count of orders using this service
      const orderCount = await query(
        `SELECT COUNT(*) as count FROM orders WHERE service_id = $1`,
        [entityId]
      );
      if (orderCount.rows[0]?.count > 0) {
        await query(
          `INSERT INTO archive_relationships
           (entity_type, entity_id, parent_type, parent_id, relationship_data, archived_by)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
          [entityType, entityId, 'metadata', 'order_count',
           JSON.stringify({ order_count: orderCount.rows[0].count }), actorId]
        );
      }
      break;
    }

    case 'product': {
      // Inventory items: optional metadata from catalog (best-effort)
      const result = await query(
        `SELECT cp.category FROM inventory_items ii LEFT JOIN catalog_products cp ON cp.product_id = ii.item_id WHERE ii.item_id = $1`,
        [entityId]
      );
      if (result.rows[0]?.category) {
        await query(
          `INSERT INTO archive_relationships
           (entity_type, entity_id, parent_type, parent_id, relationship_data, archived_by)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
          [entityType, entityId, 'metadata', 'category',
           JSON.stringify({ category: result.rows[0].category }), actorId]
        );
      }
      break;
    }

    case 'order': {
      // Orders have no children but we can track order metadata
      const result = await query(
        `SELECT creator_id, creator_role, order_type, status FROM orders WHERE order_id = $1`,
        [entityId]
      );
      if (result.rows[0]) {
        await query(
          `INSERT INTO archive_relationships
           (entity_type, entity_id, parent_type, parent_id, relationship_data, archived_by)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
          [entityType, entityId, 'metadata', 'order_info',
           JSON.stringify({
             creator: result.rows[0].creator_id,
             creator_role: result.rows[0].creator_role,
             type: result.rows[0].order_type,
             status: result.rows[0].status
           }), actorId]
        );
      }
      break;
    }
  }
}

async function unassignChildren(entityType: string, entityId: string): Promise<number> {
  let affectedCount = 0;

  switch (entityType) {
    case 'manager': {
      // Unassign all contractors
      const result = await query(
        `UPDATE contractors
         SET cks_manager = NULL, updated_at = NOW()
         WHERE cks_manager = $1 AND archived_at IS NULL`,
        [entityId]
      );
      affectedCount = result.rowCount || 0;
      break;
    }
    case 'contractor': {
      // Unassign all customers
      const result = await query(
        `UPDATE customers
         SET contractor_id = NULL, updated_at = NOW()
         WHERE contractor_id = $1 AND archived_at IS NULL`,
        [entityId]
      );
      affectedCount = result.rowCount || 0;
      break;
    }
    case 'customer': {
      // Unassign all centers
      const result = await query(
        `UPDATE centers
         SET customer_id = NULL, contractor_id = NULL, updated_at = NOW()
         WHERE customer_id = $1 AND archived_at IS NULL`,
        [entityId]
      );
      affectedCount = result.rowCount || 0;
      break;
    }
    case 'center': {
      // Unassign all crew
      const result = await query(
        `UPDATE crew
         SET assigned_center = NULL, updated_at = NOW()
         WHERE assigned_center = $1 AND archived_at IS NULL`,
        [entityId]
      );
      affectedCount = result.rowCount || 0;
      break;
    }
  }

  return affectedCount;
}

export async function archiveEntity(operation: ArchiveOperation): Promise<{ success: boolean; unassignedChildren: number }> {
  const normalizedId = normalizeIdentity(operation.entityId);
  if (!normalizedId) {
    throw new Error('Invalid entity ID');
  }

  const actorId = normalizeIdentity(operation.actor.actorId) ?? 'ADMIN';

  // Handle table naming - most are plural except 'crew'
  let tableName: string;
  let idColumn: string;

  switch (operation.entityType) {
    case 'crew':
      tableName = 'crew';
      idColumn = 'crew_id';
      break;
    case 'warehouse':
      tableName = 'warehouses';
      idColumn = 'warehouse_id';
      break;
    case 'service':
      tableName = 'services';
      idColumn = 'service_id';
      break;
    case 'product':
      tableName = 'inventory_items';
      idColumn = 'item_id';
      break;
    case 'order':
      tableName = 'orders';
      idColumn = 'order_id';
      break;
    case 'report':
      tableName = 'reports';
      idColumn = 'report_id';
      break;
    case 'feedback':
      tableName = 'feedback';
      idColumn = 'feedback_id';
      break;
    default:
      tableName = `${operation.entityType}s`;
      idColumn = `${operation.entityType}_id`;
      break;
  }

  // Store relationships before archiving
  await storeRelationships(operation.entityType, normalizedId, operation.actor);

  // Unassign children
  const unassignedChildren = await unassignChildren(operation.entityType, normalizedId);

  // For products, accept either the given ID or a left-padded numeric variant (e.g., PRD-5 -> PRD-00000005)
  let idParamList: string[] | null = null;
  if (operation.entityType === 'product' && normalizedId) {
    const m = normalizedId.match(/^(PRD)-(\d+)$/i);
    if (m) {
      const prefix = m[1].toUpperCase();
      const digits = m[2];
      const padded = `${prefix}-${digits.padStart(8, '0')}`;
      idParamList = [normalizedId, padded];
    }
  }

  // Archive the entity
  const deletionScheduled = new Date();
  deletionScheduled.setDate(deletionScheduled.getDate() + 30); // Schedule for deletion in 30 days

  const updateResult = idParamList
    ? await query(
        `UPDATE ${tableName}
         SET archived_at = NOW(),
             archived_by = $1,
             archive_reason = $2,
             deletion_scheduled = $3,
             updated_at = NOW()
         WHERE ${idColumn} = $4 OR ${idColumn} = $5`,
        [actorId, operation.reason || 'Manual archive', deletionScheduled, idParamList[0], idParamList[1]]
      )
    : await query(
        `UPDATE ${tableName}
         SET archived_at = NOW(),
             archived_by = $1,
             archive_reason = $2,
             deletion_scheduled = $3,
             updated_at = NOW()
         WHERE ${idColumn} = $4`,
        [actorId, operation.reason || 'Manual archive', deletionScheduled, normalizedId]
      );

  // Fallback: if archiving a product and no inventory_items updated, try products table
  if ((!updateResult || (updateResult.rowCount ?? 0) === 0) && operation.entityType === 'product') {
    const fallbackResult = idParamList
      ? await query(
          `UPDATE products
           SET archived_at = NOW(),
               archived_by = $1,
               archive_reason = $2,
               deletion_scheduled = $3,
               updated_at = NOW()
           WHERE product_id = $4 OR product_id = $5`,
          [actorId, operation.reason || 'Manual archive', deletionScheduled, idParamList[0], idParamList[1]]
        )
      : await query(
          `UPDATE products
           SET archived_at = NOW(),
               archived_by = $1,
               archive_reason = $2,
               deletion_scheduled = $3,
               updated_at = NOW()
           WHERE product_id = $4`,
          [actorId, operation.reason || 'Manual archive', deletionScheduled, normalizedId]
        );

    if (!fallbackResult || (fallbackResult.rowCount ?? 0) === 0) {
      throw new Error(`Archive failed: ${operation.entityType} ${normalizedId} not found or already archived`);
    }
  } else if ((!updateResult || (updateResult.rowCount ?? 0) === 0) && operation.entityType === 'service') {
    // Fallback for services: deactivate in catalog_services
    await query(
      `UPDATE catalog_services
       SET is_active = FALSE,
           updated_at = NOW()
       WHERE service_id = $1`,
      [normalizedId]
    );
  } else if (!updateResult || (updateResult.rowCount ?? 0) === 0) {
    throw new Error(`Archive failed: ${operation.entityType} ${normalizedId} not found or already archived`);
  }

  await recordActivity(
    `${operation.entityType}_archived`,
    `Archived ${operation.entityType} ${normalizedId}`,
    normalizedId,
    operation.entityType,
    operation.actor,
    { reason: operation.reason, unassignedChildren }
  );

  return { success: true, unassignedChildren };
}

export async function restoreEntity(operation: RestoreOperation): Promise<{ success: boolean }> {
  const normalizedId = normalizeIdentity(operation.entityId);
  if (!normalizedId) {
    throw new Error('Invalid entity ID');
  }

  const actorId = normalizeIdentity(operation.actor.actorId) ?? 'ADMIN';

  // Handle table naming - same as in archiveEntity
  let tableName: string;
  let idColumn: string;

  switch (operation.entityType) {
    case 'crew':
      tableName = 'crew';
      idColumn = 'crew_id';
      break;
    case 'warehouse':
      tableName = 'warehouses';
      idColumn = 'warehouse_id';
      break;
    case 'service':
      tableName = 'services';
      idColumn = 'service_id';
      break;
    case 'product':
      tableName = 'inventory_items';
      idColumn = 'item_id';
      break;
    case 'order':
      tableName = 'orders';
      idColumn = 'order_id';
      break;
    default:
      tableName = `${operation.entityType}s`;
      idColumn = `${operation.entityType}_id`;
      break;
  }

  // Restore the entity (it goes to unassigned bucket)
  const restoreResult = await query(
    `UPDATE ${tableName}
     SET archived_at = NULL,
         archived_by = NULL,
         archive_reason = NULL,
         deletion_scheduled = NULL,
         restored_at = NOW(),
         restored_by = $1,
         updated_at = NOW()
     WHERE ${idColumn} = $2`,
    [actorId, normalizedId]
  );

  // Fallback for services: reactivate in catalog_services if legacy services row not found
  if ((!restoreResult || (restoreResult.rowCount ?? 0) === 0) && operation.entityType === 'service') {
    await query(
      `UPDATE catalog_services
       SET is_active = TRUE,
           updated_at = NOW()
       WHERE service_id = $1`,
      [normalizedId]
    );
  }

  // Mark relationships as potentially restorable
  await query(
    `UPDATE archive_relationships
     SET restored = TRUE
     WHERE entity_type = $1 AND entity_id = $2`,
    [operation.entityType, normalizedId]
  );

  await recordActivity(
    `${operation.entityType}_restored`,
    `Restored ${operation.entityType} ${normalizedId} from archive`,
    normalizedId,
    operation.entityType,
    operation.actor
  );

  return { success: true };
}

export async function listArchivedEntities(
  entityType?: 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse' | 'service' | 'product' | 'order' | 'report' | 'feedback',
  limit = 100
): Promise<ArchivedEntity[]> {
  let queryText: string;
  let params: any[];

  if (entityType) {
    let tableName: string;
    let idColumn: string;
    let nameColumn: string;

    switch (entityType) {
      case 'crew':
        tableName = 'crew';
        idColumn = 'crew_id';
        nameColumn = 'name';
        break;
      case 'warehouse':
        tableName = 'warehouses';
        idColumn = 'warehouse_id';
        nameColumn = 'name';
        break;
      case 'service':
        tableName = 'services';
        idColumn = 'service_id';
        nameColumn = 'service_name';
        break;
    case 'product':
      tableName = 'inventory_items';
      idColumn = 'item_id';
      nameColumn = 'item_name';
      break;
      case 'order':
        tableName = 'orders';
        idColumn = 'order_id';
        nameColumn = 'order_id';  // Orders don't have a name, use ID
        break;
      case 'manager':
        tableName = 'managers';
        idColumn = 'manager_id';
        nameColumn = 'name';
        break;
      case 'center':
        tableName = 'centers';
        idColumn = 'center_id';
        nameColumn = 'name';
        break;
      case 'report':
        tableName = 'reports';
        idColumn = 'report_id';
        nameColumn = 'title';
        break;
      case 'feedback':
        tableName = 'feedback';
        idColumn = 'feedback_id';
        nameColumn = 'title';
        break;
      default:
        tableName = `${entityType}s`;
        idColumn = `${entityType}_id`;
        nameColumn = 'name';
        break;
    }

    // For orders, also include order_type to support filtering by product/service
    const orderTypeSelect = entityType === 'order' ? ', order_type' : '';

    queryText = `
      SELECT
        ${idColumn} as id,
        '${entityType}' as entity_type,
        ${nameColumn} as name,
        archived_at,
        archived_by,
        archive_reason,
        deletion_scheduled
        ${orderTypeSelect}
      FROM ${tableName}
      WHERE archived_at IS NOT NULL
      ORDER BY archived_at DESC
      LIMIT $1
    `;
    params = [limit];
  } else {
    queryText = `
      SELECT
        entity_id as id,
        entity_type,
        name,
        archived_at,
        archived_by,
        archive_reason,
        deletion_scheduled
      FROM archived_entities
      ORDER BY archived_at DESC
      LIMIT $1
    `;
    params = [limit];
  }

  try {
    const result = await query(queryText, params);

    return result.rows.map(row => ({
      id: row.id,
      entityType: row.entity_type,
      name: row.name || row.id,
      archivedAt: row.archived_at,
      archivedBy: row.archived_by,
      archiveReason: row.archive_reason,
      deletionScheduled: row.deletion_scheduled,
      // Include orderType for orders to support product/service filtering
      ...(row.order_type && { orderType: row.order_type })
    }));
  } catch (error: any) {
    // If the error is about missing columns (for new tables without archive columns)
    if (error.code === '42703' && error.message.includes('archived_by')) {
      console.warn(`[archive] Table missing archive columns for ${entityType}. Returning empty result.`);
      console.warn('[archive] Run the migration: database/migrations/20250924_add_archive_columns_new_tables.sql');
      return [];
    }
    throw error;
  }
}

export async function getArchivedRelationships(
  entityType: string,
  entityId: string
): Promise<any[]> {
  const result = await query(
    `SELECT * FROM archive_relationships
     WHERE entity_type = $1 AND entity_id = $2
     ORDER BY archived_at DESC`,
    [entityType, entityId]
  );

  return result.rows;
}

export async function hardDeleteEntity(
  operation: ArchiveOperation & { confirm: boolean }
): Promise<{ success: boolean; message: string }> {
  if (!operation.confirm) {
    throw new Error('Hard delete requires explicit confirmation');
  }

  const normalizedId = normalizeIdentity(operation.entityId);
  if (!normalizedId) {
    throw new Error('Invalid entity ID');
  }

  let tableName: string;
  let idColumn: string;
  if (operation.entityType === 'crew') {
    tableName = 'crew';
    idColumn = 'crew_id';
  } else if (operation.entityType === 'product') {
    tableName = 'inventory_items';
    idColumn = 'item_id';
  } else {
    tableName = `${operation.entityType}s`;
    idColumn = `${operation.entityType}_id`;
  }

  // Check if entity is archived
  const checkResult = await query(
    `SELECT archived_at FROM ${tableName} WHERE ${idColumn} = $1`,
    [normalizedId]
  );

  if (!checkResult.rows[0]?.archived_at) {
    throw new Error('Entity must be archived before hard deletion');
  }

  // Check for any active children
  const childrenCount = await checkActiveChildren(operation.entityType, normalizedId);
  if (childrenCount > 0) {
    throw new Error(`Cannot hard delete: Entity has ${childrenCount} active children`);
  }

  // Perform hard delete
  await query(
    `DELETE FROM ${tableName} WHERE ${idColumn} = $1`,
    [normalizedId]
  );

  // Clean up relationships
  await query(
    `DELETE FROM archive_relationships
     WHERE entity_type = $1 AND entity_id = $2`,
    [operation.entityType, normalizedId]
  );

  await recordActivity(
    `${operation.entityType}_hard_deleted`,
    `Permanently deleted ${operation.entityType} ${normalizedId}`,
    normalizedId,
    operation.entityType,
    operation.actor,
    { reason: operation.reason }
  );

  return {
    success: true,
    message: `${operation.entityType} ${normalizedId} has been permanently deleted`
  };
}

async function checkActiveChildren(entityType: string, entityId: string): Promise<number> {
  let count = 0;

  switch (entityType) {
    case 'manager': {
      const result = await query(
        `SELECT COUNT(*) FROM contractors
         WHERE cks_manager = $1 AND archived_at IS NULL`,
        [entityId]
      );
      count = parseInt(result.rows[0].count || '0');
      break;
    }
    case 'contractor': {
      const result = await query(
        `SELECT COUNT(*) FROM customers
         WHERE contractor_id = $1 AND archived_at IS NULL`,
        [entityId]
      );
      count = parseInt(result.rows[0].count || '0');
      break;
    }
    case 'customer': {
      const result = await query(
        `SELECT COUNT(*) FROM centers
         WHERE customer_id = $1 AND archived_at IS NULL`,
        [entityId]
      );
      count = parseInt(result.rows[0].count || '0');
      break;
    }
    case 'center': {
      const result = await query(
        `SELECT COUNT(*) FROM crew
         WHERE assigned_center = $1 AND archived_at IS NULL`,
        [entityId]
      );
      count = parseInt(result.rows[0].count || '0');
      break;
    }
    case 'order': {
      // Orders have no children
      count = 0;
      break;
    }
  }

  return count;
}

export async function scheduledCleanup(): Promise<{ deleted: number }> {
  // This function would be called by a cron job to delete entities past their scheduled deletion date
  let totalDeleted = 0;

  // Delete from each table individually
  const tables = [
    { table: 'managers', idColumn: 'manager_id', type: 'manager' },
    { table: 'contractors', idColumn: 'contractor_id', type: 'contractor' },
    { table: 'customers', idColumn: 'customer_id', type: 'customer' },
    { table: 'centers', idColumn: 'center_id', type: 'center' },
    { table: 'crew', idColumn: 'crew_id', type: 'crew' },
    { table: 'warehouses', idColumn: 'warehouse_id', type: 'warehouse' },
    { table: 'services', idColumn: 'service_id', type: 'service' },
    { table: 'inventory_items', idColumn: 'item_id', type: 'product' },
    { table: 'orders', idColumn: 'order_id', type: 'order' }
  ];

  for (const { table, idColumn, type } of tables) {
    // First get the IDs to be deleted
    const toDelete = await query(
      `SELECT ${idColumn} FROM ${table}
       WHERE deletion_scheduled < NOW()
       AND archived_at IS NOT NULL`
    );

    if (toDelete.rows.length > 0) {
      // Delete the records
      const deleteResult = await query(
        `DELETE FROM ${table}
         WHERE deletion_scheduled < NOW()
         AND archived_at IS NOT NULL`
      );

      // Clean up relationships for deleted records
      for (const row of toDelete.rows) {
        await query(
          `DELETE FROM archive_relationships
           WHERE entity_type = $1 AND entity_id = $2`,
          [type, row[idColumn]]
        );
      }

      totalDeleted += (deleteResult.rowCount || 0);
    }
  }

  return { deleted: totalDeleted };
}
