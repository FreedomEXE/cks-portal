"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArchivedEntities = getArchivedEntities;
exports.restoreEntity = restoreEntity;
exports.getArchiveStatistics = getArchiveStatistics;
exports.bulkRestoreEntities = bulkRestoreEntities;
const pool_1 = __importDefault(require("../../db/pool"));
async function getArchivedEntities(entityType, options = {}) {
    const { limit = 25, offset = 0, search } = options;
    const tableConfig = {
        managers: { table: 'managers', idColumn: 'manager_id', nameColumn: 'manager_name' },
        contractors: { table: 'contractors', idColumn: 'contractor_id', nameColumn: 'contractor_name' },
        customers: { table: 'customers', idColumn: 'customer_id', nameColumn: 'company_name' },
        centers: { table: 'centers', idColumn: 'center_id', nameColumn: 'center_name' },
        crew: { table: 'crew', idColumn: 'crew_id', nameColumn: 'crew_name' },
        warehouses: { table: 'warehouses', idColumn: 'warehouse_id', nameColumn: 'warehouse_name' }
    };
    const config = tableConfig[entityType];
    if (!config) {
        throw new Error(`Invalid entity type: ${entityType}`);
    }
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
    const queryParams = [];
    let paramIndex = 1;
    if (search && search.trim()) {
        const searchCondition = ` AND (${config.nameColumn} ILIKE $${paramIndex} OR ${config.idColumn} ILIKE $${paramIndex})`;
        baseQuery += searchCondition;
        countQuery += searchCondition;
        queryParams.push(`%${search.trim()}%`);
        paramIndex++;
    }
    baseQuery += ` ORDER BY archived_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    try {
        const [dataResult, countResult] = await Promise.all([
            pool_1.default.query(baseQuery, queryParams),
            pool_1.default.query(countQuery, queryParams.slice(0, -2))
        ]);
        return {
            items: dataResult.rows,
            total: parseInt(countResult.rows[0].total),
            page: Math.floor(offset / limit) + 1,
            pageSize: limit
        };
    }
    catch (error) {
        console.error(`Error fetching archived ${entityType}:`, error);
        throw error;
    }
}
async function restoreEntity(entityType, entityId, admin_user_id = 'admin') {
    const tableConfig = {
        managers: { table: 'managers', idColumn: 'manager_id', nameColumn: 'manager_name' },
        contractors: { table: 'contractors', idColumn: 'contractor_id', nameColumn: 'contractor_name' },
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
        const checkResult = await pool_1.default.query(`SELECT ${config.idColumn}, ${config.nameColumn}, archived_at 
       FROM ${config.table} 
       WHERE ${config.idColumn} = $1`, [entityId]);
        if (checkResult.rowCount === 0) {
            throw new Error(`${entityType.slice(0, -1)} not found`);
        }
        if (!checkResult.rows[0].archived_at) {
            throw new Error(`${entityType.slice(0, -1)} is not archived`);
        }
        const restoreResult = await pool_1.default.query(`UPDATE ${config.table} 
       SET archived_at = NULL, updated_at = NOW() 
       WHERE ${config.idColumn} = $1 
       RETURNING ${config.idColumn}`, [entityId]);
        if (restoreResult.rowCount === 0) {
            throw new Error(`Failed to restore ${entityType.slice(0, -1)}`);
        }
        const entityName = checkResult.rows[0][config.nameColumn.replace('_', '')];
        try {
            const { logActivity } = await Promise.resolve().then(() => __importStar(require('../../../backend/server/resources/activity')));
            await logActivity('user_restored', `${entityType.slice(0, -1)} ${entityId} (${entityName}) restored`, admin_user_id, 'admin', entityId, entityType.slice(0, -1), {
                name: entityName
            });
        }
        catch (e) {
            console.error('Activity logging failed:', e);
        }
        return {
            success: true,
            message: `${entityType.slice(0, -1)} ${entityId} restored successfully`
        };
    }
    catch (error) {
        console.error(`Error restoring ${entityType.slice(0, -1)} ${entityId}:`, error);
        throw error;
    }
}
async function getArchiveStatistics() {
    try {
        const queries = [
            'SELECT COUNT(*) as count FROM managers WHERE archived_at IS NOT NULL',
            'SELECT COUNT(*) as count FROM contractors WHERE archived_at IS NOT NULL',
            'SELECT COUNT(*) as count FROM customers WHERE archived_at IS NOT NULL',
            'SELECT COUNT(*) as count FROM centers WHERE archived_at IS NOT NULL',
            'SELECT COUNT(*) as count FROM crew WHERE archived_at IS NOT NULL',
            'SELECT COUNT(*) as count FROM warehouses WHERE archived_at IS NOT NULL'
        ];
        const results = await Promise.all(queries.map(query => pool_1.default.query(query)));
        return {
            managers: parseInt(results[0].rows[0].count),
            contractors: parseInt(results[1].rows[0].count),
            customers: parseInt(results[2].rows[0].count),
            centers: parseInt(results[3].rows[0].count),
            crew: parseInt(results[4].rows[0].count),
            warehouses: parseInt(results[5].rows[0].count),
            total: results.reduce((sum, result) => sum + parseInt(result.rows[0].count), 0)
        };
    }
    catch (error) {
        console.error('Error getting archive statistics:', error);
        throw error;
    }
}
async function bulkRestoreEntities(entityType, entityIds, admin_user_id = 'admin') {
    const restored = [];
    const failed = [];
    for (const entityId of entityIds) {
        try {
            await restoreEntity(entityType, entityId, admin_user_id);
            restored.push(entityId);
        }
        catch (error) {
            console.error(`Failed to restore ${entityType.slice(0, -1)} ${entityId}:`, error);
            failed.push(entityId);
        }
    }
    return { restored, failed };
}
//# sourceMappingURL=archive-operations.js.map