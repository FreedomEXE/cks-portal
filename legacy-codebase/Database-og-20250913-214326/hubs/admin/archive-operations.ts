/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Admin Archive Operations
 * 
 * Description: Centralized admin database operations for archive management
 * Function: Handle archived entities across all hubs with consistent interface
 * Importance: Critical - Provides unified archive functionality
 */

import pool from '../../db/pool';

// ============================================
// GENERIC ARCHIVE OPERATIONS
// ============================================

interface ArchiveOptions {
  limit?: number;
  offset?: number;
  search?: string;
}

export async function getArchivedEntities(
  entityType: 'managers' | 'contractors' | 'customers' | 'centers' | 'crew' | 'warehouses',
  options: ArchiveOptions = {}
): Promise<{items: any[], total: number, page: number, pageSize: number}> {
  
  const { limit = 25, offset = 0, search } = options;
  
  // Define table and column mappings
  const tableConfig = {
    managers: { table: 'managers', idColumn: 'manager_id', nameColumn: 'manager_name' },
    contractors: { table: 'contractors', idColumn: 'contractor_id', nameColumn: 'company_name' },
    customers: { table: 'customers', idColumn: 'customer_id', nameColumn: 'company_name' },
    centers: { table: 'centers', idColumn: 'center_id', nameColumn: 'center_name' },
    crew: { table: 'crew', idColumn: 'crew_id', nameColumn: 'crew_name' },
    warehouses: { table: 'warehouses', idColumn: 'warehouse_id', nameColumn: 'warehouse_name' }
  };

  const config = tableConfig[entityType];
  if (!config) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }

  // Build query with optional search
  let baseQuery = `
    SELECT ${config.idColumn} as id, ${config.nameColumn} as name, 
           status, archived_at, created_at, updated_at
    FROM ${config.table} 
    WHERE archived_at IS NOT NULL
  `;
  
  let countQuery = `
    SELECT COUNT(*) as total 
    FROM ${config.table} 
    WHERE archived_at IS NOT NULL
  `;

  const queryParams: any[] = [];
  let paramIndex = 1;

  // Add search filter if provided
  if (search && search.trim()) {
    const searchCondition = ` AND (${config.nameColumn} ILIKE $${paramIndex} OR ${config.idColumn} ILIKE $${paramIndex})`;
    baseQuery += searchCondition;
    countQuery += searchCondition;
    queryParams.push(`%${search.trim()}%`);
    paramIndex++;
  }

  // Add ordering and pagination
  baseQuery += ` ORDER BY archived_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  queryParams.push(limit, offset);

  try {
    const [dataResult, countResult] = await Promise.all([
      pool.query(baseQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit/offset for count
    ]);

    return {
      items: dataResult.rows,
      total: parseInt(countResult.rows[0].total),
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    };
  } catch (error) {
    console.error(`Error fetching archived ${entityType}:`, error);
    throw error;
  }
}

// ============================================
// RESTORE OPERATIONS
// ============================================

export async function restoreEntity(
  entityType: 'managers' | 'contractors' | 'customers' | 'centers' | 'crew' | 'warehouses',
  entityId: string,
  admin_user_id = 'admin'
): Promise<{success: boolean, message: string}> {
  
  const tableConfig = {
    managers: { table: 'managers', idColumn: 'manager_id', nameColumn: 'manager_name' },
    contractors: { table: 'contractors', idColumn: 'contractor_id', nameColumn: 'company_name' },
    customers: { table: 'customers', idColumn: 'customer_id', nameColumn: 'company_name' },
    centers: { table: 'centers', idColumn: 'center_id', nameColumn: 'center_name' },
    crew: { table: 'crew', idColumn: 'crew_id', nameColumn: 'crew_name' },
    warehouses: { table: 'warehouses', idColumn: 'warehouse_id', nameColumn: 'warehouse_name' }
  };

  const config = tableConfig[entityType];
  if (!config) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }

  try {
    // Check if entity exists and is archived
    const checkResult = await pool.query(
      `SELECT ${config.idColumn}, ${config.nameColumn}, archived_at 
       FROM ${config.table} 
       WHERE ${config.idColumn} = $1`,
      [entityId]
    );

    if (checkResult.rowCount === 0) {
      throw new Error(`${entityType.slice(0, -1)} not found`);
    }

    if (!checkResult.rows[0].archived_at) {
      throw new Error(`${entityType.slice(0, -1)} is not archived`);
    }

    // Restore the entity by clearing archived_at
    const restoreResult = await pool.query(
      `UPDATE ${config.table} 
       SET archived_at = NULL, updated_at = NOW() 
       WHERE ${config.idColumn} = $1 
       RETURNING ${config.idColumn}`,
      [entityId]
    );

    if (restoreResult.rowCount === 0) {
      throw new Error(`Failed to restore ${entityType.slice(0, -1)}`);
    }

    const entityName = checkResult.rows[0][config.nameColumn];
    
    // Log the restore activity
    try {
      const { logActivity } = await import('../../../backend/server/resources/activity');
      await logActivity('user_updated', `${entityType.slice(0, -1)} ${entityId} (${entityName}) restored`, admin_user_id, 'admin', entityId, entityType.slice(0, -1), { 
        name: entityName,
        action: 'restored'
      });
    } catch (e) {
      console.error('Activity logging failed:', e);
    }

    return {
      success: true,
      message: `${entityType.slice(0, -1)} ${entityId} restored successfully`
    };
  } catch (error) {
    console.error(`Error restoring ${entityType.slice(0, -1)} ${entityId}:`, error);
    throw error;
  }
}

// ============================================
// ARCHIVE STATISTICS
// ============================================

export async function getArchiveStatistics() {
  try {
    const queries = [
      'SELECT COUNT(*) as count FROM managers WHERE archived_at IS NOT NULL',
      'SELECT COUNT(*) as count FROM contractors WHERE archived_at IS NOT NULL', 
      'SELECT COUNT(*) as count FROM customers WHERE archived_at IS NOT NULL',
      'SELECT COUNT(*) as count FROM centers WHERE archived_at IS NOT NULL',
      'SELECT COUNT(*) as count FROM crew WHERE archived_at IS NOT NULL',
      'SELECT COUNT(*) as count FROM warehouses WHERE archived_at IS NOT NULL'
    ];

    const results = await Promise.all(queries.map(query => pool.query(query)));
    
    return {
      managers: parseInt(results[0].rows[0].count),
      contractors: parseInt(results[1].rows[0].count),
      customers: parseInt(results[2].rows[0].count),
      centers: parseInt(results[3].rows[0].count),
      crew: parseInt(results[4].rows[0].count),
      warehouses: parseInt(results[5].rows[0].count),
      total: results.reduce((sum, result) => sum + parseInt(result.rows[0].count), 0)
    };
  } catch (error) {
    console.error('Error getting archive statistics:', error);
    throw error;
  }
}

// ============================================
// BULK OPERATIONS
// ============================================

export async function bulkRestoreEntities(
  entityType: 'managers' | 'contractors' | 'customers' | 'centers' | 'crew' | 'warehouses',
  entityIds: string[],
  admin_user_id = 'admin'
): Promise<{restored: string[], failed: string[]}> {
  
  const restored: string[] = [];
  const failed: string[] = [];

  for (const entityId of entityIds) {
    try {
      await restoreEntity(entityType, entityId, admin_user_id);
      restored.push(entityId);
    } catch (error) {
      console.error(`Failed to restore ${entityType.slice(0, -1)} ${entityId}:`, error);
      failed.push(entityId);
    }
  }

  return { restored, failed };
}