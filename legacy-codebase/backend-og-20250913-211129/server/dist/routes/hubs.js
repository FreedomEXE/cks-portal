"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pool_1 = __importDefault(require("../../../Database/db/pool"));
const router = express_1.default.Router();
function getUserRole(userId) {
    const upperUserId = userId.toUpperCase();
    if (upperUserId === 'FREEDOM_EXE' ||
        upperUserId === 'FREEDOMEXE' ||
        upperUserId.includes('ADMIN')) {
        return 'admin';
    }
    if (upperUserId.startsWith('MGR-'))
        return 'manager';
    if (upperUserId.startsWith('CUS-'))
        return 'customer';
    if (upperUserId.startsWith('CON-'))
        return 'contractor';
    if (upperUserId.startsWith('CEN-'))
        return 'center';
    if (upperUserId.startsWith('CRW-'))
        return 'crew';
    return null;
}
function buildAccessFilter(userId, role, entityType) {
    const params = [];
    let where = '';
    if (role === 'admin') {
        return { where: 'WHERE 1=1', params: [] };
    }
    switch (entityType) {
        case 'contractors':
            if (role === 'contractor') {
                where = 'WHERE UPPER(contractor_id) = UPPER($1)';
                params.push(userId);
            }
            else if (role === 'manager') {
                where = 'WHERE UPPER(cks_manager) = UPPER($1)';
                params.push(userId);
            }
            break;
        case 'customers':
            if (role === 'customer') {
                where = 'WHERE UPPER(customer_id) = UPPER($1)';
                params.push(userId);
            }
            else if (role === 'manager') {
                where = 'WHERE UPPER(cks_manager) = UPPER($1)';
                params.push(userId);
            }
            break;
        case 'centers':
            if (role === 'center') {
                where = 'WHERE UPPER(center_id) = UPPER($1)';
                params.push(userId);
            }
            else if (role === 'customer') {
                where = 'WHERE UPPER(customer_id) = UPPER($1)';
                params.push(userId);
            }
            else if (role === 'contractor') {
                where = 'WHERE UPPER(contractor_id) = UPPER($1)';
                params.push(userId);
            }
            else if (role === 'manager') {
                where = 'WHERE UPPER(cks_manager) = UPPER($1)';
                params.push(userId);
            }
            break;
        case 'crew':
            if (role === 'crew') {
                where = 'WHERE UPPER(crew_id) = UPPER($1)';
                params.push(userId);
            }
            else if (role === 'center') {
                where = 'WHERE UPPER(assigned_center) = UPPER($1)';
                params.push(userId);
            }
            else if (role === 'manager') {
                where = 'WHERE UPPER(cks_manager) = UPPER($1)';
                params.push(userId);
            }
            break;
        default:
            if (role === 'manager') {
                where = 'WHERE UPPER(cks_manager) = UPPER($1) OR UPPER(manager_id) = UPPER($1)';
                params.push(userId);
            }
    }
    if (!where) {
        where = 'WHERE 1=0';
    }
    return { where, params };
}
router.get('/contractors', async (req, res) => {
    try {
        const userId = String(req.headers['x-user-id'] || '');
        const role = getUserRole(userId);
        if (!role) {
            return res.status(403).json({ error: 'Invalid user role' });
        }
        const { where, params } = buildAccessFilter(userId, role, 'contractors');
        const query = `
      SELECT 
        contractor_id,
        cks_manager,
        company_name,
        contact_person,
        email,
        phone,
        business_type,
        status,
        created_at,
        updated_at
      FROM contractors 
      ${where}
      ORDER BY company_name ASC
    `;
        const result = await pool_1.default.query(query, params);
        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length,
            user_role: role,
            user_id: userId
        });
    }
    catch (error) {
        console.error('Contractors endpoint error:', error);
        res.status(500).json({ error: 'Failed to fetch contractors' });
    }
});
router.get('/managers', async (req, res) => {
    try {
        const userId = String(req.headers['x-user-id'] || '');
        const role = getUserRole(userId);
        if (!role) {
            return res.status(403).json({ error: 'Invalid user role' });
        }
        const { where, params } = buildAccessFilter(userId, role, 'managers');
        const query = `
      SELECT 
        manager_id,
        manager_name,
        assigned_center,
        email,
        phone,
        territory,
        status,
        created_at,
        updated_at
      FROM managers 
      ${where}
      ORDER BY manager_name ASC
    `;
        const result = await pool_1.default.query(query, params);
        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length,
            user_role: role,
            user_id: userId
        });
    }
    catch (error) {
        console.error('Managers endpoint error:', error);
        res.status(500).json({ error: 'Failed to fetch managers' });
    }
});
router.get('/customers', async (req, res) => {
    try {
        const userId = String(req.headers['x-user-id'] || '');
        const role = getUserRole(userId);
        if (!role) {
            return res.status(403).json({ error: 'Invalid user role' });
        }
        const { where, params } = buildAccessFilter(userId, role, 'customers');
        const query = `
      SELECT 
        customer_id,
        cks_manager,
        company_name,
        contact_person,
        email,
        phone,
        service_tier,
        status,
        created_at,
        updated_at
      FROM customers 
      ${where}
      ORDER BY company_name ASC
    `;
        const result = await pool_1.default.query(query, params);
        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length,
            user_role: role,
            user_id: userId
        });
    }
    catch (error) {
        console.error('Customers endpoint error:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});
router.get('/centers', async (req, res) => {
    try {
        const userId = String(req.headers['x-user-id'] || '');
        const role = getUserRole(userId);
        if (!role) {
            return res.status(403).json({ error: 'Invalid user role' });
        }
        const { where, params } = buildAccessFilter(userId, role, 'centers');
        const query = `
      SELECT 
        center_id,
        cks_manager,
        center_name,
        customer_id,
        contractor_id,
        address,
        operational_hours,
        status,
        created_at,
        updated_at
      FROM centers 
      ${where}
      ORDER BY center_name ASC
    `;
        const result = await pool_1.default.query(query, params);
        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length,
            user_role: role,
            user_id: userId
        });
    }
    catch (error) {
        console.error('Centers endpoint error:', error);
        res.status(500).json({ error: 'Failed to fetch centers' });
    }
});
router.get('/crew', async (req, res) => {
    try {
        const userId = String(req.headers['x-user-id'] || '');
        const role = getUserRole(userId);
        if (!role) {
            return res.status(403).json({ error: 'Invalid user role' });
        }
        const { where, params } = buildAccessFilter(userId, role, 'crew');
        const query = `
      SELECT 
        crew_id,
        cks_manager,
        assigned_center,
        crew_name,
        skills,
        certification_level,
        status,
        profile,
        created_at,
        updated_at
      FROM crew 
      ${where}
      ORDER BY crew_name NULLS LAST ASC
    `;
        const result = await pool_1.default.query(query, params);
        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length,
            user_role: role,
            user_id: userId
        });
    }
    catch (error) {
        console.error('Crew endpoint error:', error);
        res.status(500).json({ error: 'Failed to fetch crew' });
    }
});
router.get('/services', async (req, res) => {
    try {
        const userId = String(req.headers['x-user-id'] || '');
        const role = getUserRole(userId);
        if (!role) {
            return res.status(403).json({ error: 'Invalid user role' });
        }
        const query = `
      SELECT service_id, service_name, category, status,
             description, pricing_model, requirements,
             created_at, updated_at
      FROM services 
      WHERE status = 'active'
      ORDER BY service_name ASC
    `;
        const result = await pool_1.default.query(query);
        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length,
            user_role: role,
            user_id: userId
        });
    }
    catch (error) {
        console.error('Services endpoint error:', error);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});
exports.default = router;
//# sourceMappingURL=hubs.js.map