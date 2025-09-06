"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getManagerProfile = getManagerProfile;
exports.updateManagerProfile = updateManagerProfile;
exports.getManagerContractors = getManagerContractors;
exports.getManagerCustomers = getManagerCustomers;
exports.getManagerCenters = getManagerCenters;
exports.getManagerDashboardStats = getManagerDashboardStats;
exports.assignContractorToCustomer = assignContractorToCustomer;
const pool_1 = __importDefault(require("../../db/pool"));
async function getManagerProfile(manager_id) {
    try {
        const result = await pool_1.default.query(`SELECT manager_id, manager_name, email, phone, territory, status, created_at, updated_at
       FROM managers 
       WHERE manager_id = $1 AND archived_at IS NULL`, [manager_id]);
        if (result.rowCount === 0) {
            throw new Error('Manager not found or archived');
        }
        return result.rows[0];
    }
    catch (error) {
        console.error(`Error fetching manager profile for ${manager_id}:`, error);
        throw error;
    }
}
async function updateManagerProfile(manager_id, updates) {
    const setClause = [];
    const values = [];
    let paramIndex = 1;
    Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
            setClause.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
    });
    if (setClause.length === 0) {
        throw new Error('No valid updates provided');
    }
    setClause.push(`updated_at = NOW()`);
    values.push(manager_id);
    try {
        const result = await pool_1.default.query(`UPDATE managers 
       SET ${setClause.join(', ')}
       WHERE manager_id = $${paramIndex} AND archived_at IS NULL
       RETURNING manager_id, manager_name, email, phone, territory, status, updated_at`, values);
        if (result.rowCount === 0) {
            throw new Error('Manager not found or archived');
        }
        return result.rows[0];
    }
    catch (error) {
        console.error(`Error updating manager profile for ${manager_id}:`, error);
        throw error;
    }
}
async function getManagerContractors(manager_id, options = {}) {
    const { limit = 25, offset = 0, status, search } = options;
    let baseQuery = `
    SELECT contractor_id, contractor_name, email, phone, service_area, 
           status, created_at, updated_at
    FROM contractors 
    WHERE cks_manager = $1 AND archived_at IS NULL
  `;
    let countQuery = `
    SELECT COUNT(*) as total
    FROM contractors
    WHERE cks_manager = $1 AND archived_at IS NULL
  `;
    const queryParams = [manager_id];
    let paramIndex = 2;
    if (status) {
        const condition = ` AND status = $${paramIndex}`;
        baseQuery += condition;
        countQuery += condition;
        queryParams.push(status);
        paramIndex++;
    }
    if (search && search.trim()) {
        const condition = ` AND (contractor_name ILIKE $${paramIndex} OR contractor_id ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
        baseQuery += condition;
        countQuery += condition;
        queryParams.push(`%${search.trim()}%`);
        paramIndex++;
    }
    baseQuery += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    try {
        const [dataResult, countResult] = await Promise.all([
            pool_1.default.query(baseQuery, queryParams),
            pool_1.default.query(countQuery, queryParams.slice(0, -2))
        ]);
        return {
            contractors: dataResult.rows,
            total: parseInt(countResult.rows[0].total),
            page: Math.floor(offset / limit) + 1,
            pageSize: limit
        };
    }
    catch (error) {
        console.error(`Error fetching contractors for manager ${manager_id}:`, error);
        throw error;
    }
}
async function getManagerCustomers(manager_id, options = {}) {
    const { limit = 25, offset = 0, status, search } = options;
    let baseQuery = `
    SELECT customer_id, company_name, contact_person, email, phone, address,
           status, created_at, updated_at
    FROM customers
    WHERE cks_manager = $1 AND archived_at IS NULL
  `;
    let countQuery = `
    SELECT COUNT(*) as total
    FROM customers
    WHERE cks_manager = $1 AND archived_at IS NULL
  `;
    const queryParams = [manager_id];
    let paramIndex = 2;
    if (status) {
        const condition = ` AND status = $${paramIndex}`;
        baseQuery += condition;
        countQuery += condition;
        queryParams.push(status);
        paramIndex++;
    }
    if (search && search.trim()) {
        const condition = ` AND (company_name ILIKE $${paramIndex} OR customer_id ILIKE $${paramIndex} OR contact_person ILIKE $${paramIndex})`;
        baseQuery += condition;
        countQuery += condition;
        queryParams.push(`%${search.trim()}%`);
        paramIndex++;
    }
    baseQuery += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    try {
        const [dataResult, countResult] = await Promise.all([
            pool_1.default.query(baseQuery, queryParams),
            pool_1.default.query(countQuery, queryParams.slice(0, -2))
        ]);
        return {
            customers: dataResult.rows,
            total: parseInt(countResult.rows[0].total),
            page: Math.floor(offset / limit) + 1,
            pageSize: limit
        };
    }
    catch (error) {
        console.error(`Error fetching customers for manager ${manager_id}:`, error);
        throw error;
    }
}
async function getManagerCenters(manager_id) {
    try {
        const result = await pool_1.default.query(`SELECT center_id, center_name, address, phone, email, 
              capacity, status, created_at, updated_at
       FROM centers
       WHERE cks_manager = $1 AND archived_at IS NULL
       ORDER BY center_name`, [manager_id]);
        return {
            centers: result.rows,
            total: result.rowCount
        };
    }
    catch (error) {
        console.error(`Error fetching centers for manager ${manager_id}:`, error);
        throw error;
    }
}
async function getManagerDashboardStats(manager_id) {
    try {
        const queries = [
            `SELECT COUNT(*) as count FROM contractors 
       WHERE cks_manager = $1 AND status = 'active' AND archived_at IS NULL`,
            `SELECT COUNT(*) as count FROM customers
       WHERE cks_manager = $1 AND status = 'active' AND archived_at IS NULL`,
            `SELECT COUNT(*) as count FROM centers
       WHERE cks_manager = $1 AND archived_at IS NULL`,
            `SELECT COUNT(*) as count FROM system_activity
       WHERE target_type IN ('contractor', 'customer', 'center') 
         AND metadata->>'manager_id' = $1
         AND created_at >= NOW() - INTERVAL '30 days'`
        ];
        const results = await Promise.all(queries.map(query => pool_1.default.query(query, [manager_id])));
        return {
            active_contractors: parseInt(results[0].rows[0].count),
            active_customers: parseInt(results[1].rows[0].count),
            centers: parseInt(results[2].rows[0].count),
            recent_activity: parseInt(results[3].rows[0].count),
            generated_at: new Date().toISOString()
        };
    }
    catch (error) {
        console.error(`Error fetching dashboard stats for manager ${manager_id}:`, error);
        throw error;
    }
}
async function assignContractorToCustomer(manager_id, contractor_id, customer_id) {
    try {
        const verificationQuery = `
      SELECT 
        (SELECT COUNT(*) FROM contractors WHERE contractor_id = $2 AND cks_manager = $1) as contractor_check,
        (SELECT COUNT(*) FROM customers WHERE customer_id = $3 AND cks_manager = $1) as customer_check
    `;
        const verification = await pool_1.default.query(verificationQuery, [manager_id, contractor_id, customer_id]);
        const { contractor_check, customer_check } = verification.rows[0];
        if (contractor_check === 0) {
            throw new Error('Contractor not found or not assigned to this manager');
        }
        if (customer_check === 0) {
            throw new Error('Customer not found or not assigned to this manager');
        }
        const result = await pool_1.default.query(`UPDATE contractors 
       SET assigned_customer = $1, updated_at = NOW()
       WHERE contractor_id = $2
       RETURNING contractor_id, contractor_name, assigned_customer`, [customer_id, contractor_id]);
        return result.rows[0];
    }
    catch (error) {
        console.error(`Error assigning contractor ${contractor_id} to customer ${customer_id}:`, error);
        throw error;
    }
}
//# sourceMappingURL=index.js.map