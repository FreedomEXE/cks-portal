"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextIdGeneric = getNextIdGeneric;
exports.upsertAppUserByEmail = upsertAppUserByEmail;
exports.createManager = createManager;
exports.getManagers = getManagers;
exports.archiveManager = archiveManager;
exports.getArchivedManagers = getArchivedManagers;
exports.createContractor = createContractor;
exports.createCustomer = createCustomer;
const pool_1 = __importDefault(require("../../db/pool"));
const activity_1 = require("../../../backend/server/resources/activity");
async function getNextIdGeneric(table, idColumn, prefix) {
    const result = await pool_1.default.query(`SELECT ${idColumn} FROM ${table} WHERE ${idColumn} LIKE $1 ORDER BY ${idColumn} DESC LIMIT 1`, [`${prefix}%`]);
    if (result.rows.length === 0)
        return `${prefix}001`;
    const lastId = result.rows[0][idColumn];
    const number = parseInt(lastId.slice(prefix.length)) + 1;
    return `${prefix}${number.toString().padStart(3, '0')}`;
}
async function upsertAppUserByEmail(email, role, code, name) {
    if (!email)
        return;
    try {
        await pool_1.default.query(`INSERT INTO app_users (email, role, code, name, status)
       VALUES ($1,$2,$3,$4,'active')
       ON CONFLICT (email) DO UPDATE SET role=EXCLUDED.role, code=EXCLUDED.code, name=COALESCE(EXCLUDED.name, app_users.name), updated_at=NOW()`, [email, role, code, name || null]);
    }
    catch (error) {
        console.error('app_users upsert by email failed', error);
        throw error;
    }
}
async function createManager(data) {
    const manager_id = await getNextIdGeneric('managers', 'manager_id', 'MGR-');
    const result = await pool_1.default.query(`INSERT INTO managers (manager_id, manager_name, email, phone, territory, status)
     VALUES ($1,$2,$3,$4,$5,'active') RETURNING *`, [manager_id, data.manager_name, data.email || null, data.phone || null, data.territory || null]);
    await upsertAppUserByEmail(data.email, 'manager', manager_id, data.manager_name);
    try {
        await (0, activity_1.logActivity)('user_created', `Manager ${manager_id} created`, 'admin', 'admin', manager_id, 'manager', {
            email: data.email || null
        });
    }
    catch (e) {
        console.error('Activity logging failed:', e);
    }
    return result.rows[0];
}
async function getManagers(limit = 25, offset = 0) {
    const result = await pool_1.default.query(`SELECT manager_id, manager_name, email, phone, territory, status, created_at 
     FROM managers 
     WHERE archived_at IS NULL 
     ORDER BY created_at DESC 
     LIMIT $1 OFFSET $2`, [limit, offset]);
    const countResult = await pool_1.default.query(`SELECT COUNT(*) as total FROM managers WHERE archived_at IS NULL`);
    return {
        items: result.rows,
        total: parseInt(countResult.rows[0].total),
        page: Math.floor(offset / limit) + 1,
        pageSize: limit
    };
}
async function archiveManager(manager_id, admin_user_id = 'admin') {
    const existing = await pool_1.default.query('SELECT manager_id, manager_name FROM managers WHERE manager_id = $1', [manager_id]);
    if (existing.rowCount === 0)
        throw new Error('Manager not found');
    const managerName = existing.rows[0].manager_name;
    const result = await pool_1.default.query('UPDATE managers SET archived_at = NOW() WHERE manager_id = $1 RETURNING manager_id', [manager_id]);
    if (result.rowCount === 0)
        throw new Error('Manager not found');
    try {
        await (0, activity_1.logActivity)('user_deleted', `Manager ${manager_id} (${managerName}) archived`, admin_user_id, 'admin', manager_id, 'manager', {
            name: managerName
        });
    }
    catch (e) {
        console.error('Activity logging failed:', e);
    }
    return { manager_id, message: `Manager ${manager_id} archived` };
}
async function getArchivedManagers(limit = 25, offset = 0) {
    const result = await pool_1.default.query(`SELECT manager_id, manager_name, email, phone, territory, status, archived_at 
     FROM managers 
     WHERE archived_at IS NOT NULL 
     ORDER BY archived_at DESC 
     LIMIT $1 OFFSET $2`, [limit, offset]);
    const countResult = await pool_1.default.query(`SELECT COUNT(*) as total FROM managers WHERE archived_at IS NOT NULL`);
    return {
        items: result.rows,
        total: parseInt(countResult.rows[0].total),
        page: Math.floor(offset / limit) + 1,
        pageSize: limit
    };
}
async function createContractor(data) {
    const contractor_id = await getNextIdGeneric('contractors', 'contractor_id', 'CON-');
    const result = await pool_1.default.query(`INSERT INTO contractors (contractor_id, contractor_name, email, phone, service_area, status)
     VALUES ($1,$2,$3,$4,$5,'active') RETURNING *`, [contractor_id, data.contractor_name, data.email || null, data.phone || null, data.service_area || null]);
    await upsertAppUserByEmail(data.email, 'contractor', contractor_id, data.contractor_name);
    try {
        await (0, activity_1.logActivity)('user_created', `Contractor ${contractor_id} created`, 'admin', 'admin', contractor_id, 'contractor', {
            email: data.email || null
        });
    }
    catch (e) {
        console.error('Activity logging failed:', e);
    }
    return result.rows[0];
}
async function createCustomer(data) {
    const customer_id = await getNextIdGeneric('customers', 'customer_id', 'CUS-');
    const result = await pool_1.default.query(`INSERT INTO customers (customer_id, company_name, contact_person, email, phone, address, status)
     VALUES ($1,$2,$3,$4,$5,$6,'active') RETURNING *`, [customer_id, data.company_name, data.contact_person || null, data.email || null, data.phone || null, data.address || null]);
    await upsertAppUserByEmail(data.email, 'customer', customer_id, data.company_name);
    try {
        await (0, activity_1.logActivity)('user_created', `Customer ${customer_id} created`, 'admin', 'admin', customer_id, 'customer', {
            email: data.email || null
        });
    }
    catch (e) {
        console.error('Activity logging failed:', e);
    }
    return result.rows[0];
}
//# sourceMappingURL=user-management.js.map