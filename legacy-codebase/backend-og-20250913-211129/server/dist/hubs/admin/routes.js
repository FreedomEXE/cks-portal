"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pool_1 = __importDefault(require("../../../../Database/db/pool"));
const logger_1 = require("../../src/core/logger");
const activity_1 = require("../../resources/activity");
const router = express_1.default.Router();
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
    catch (e) {
        logger_1.logger.warn({ e }, 'app_users upsert by email failed');
    }
}
async function hasColumn(table, column) {
    try {
        const r = await pool_1.default.query(`SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema='public' AND table_name=$1 AND column_name=$2
       ) AS exists`, [table, column]);
        return Boolean(r.rows[0]?.exists);
    }
    catch {
        return false;
    }
}
router.get('/crew', async (req, res) => {
    try {
        const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
        const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
        const search = String(req.query.q ?? '').trim();
        let whereClause = '';
        const values = [];
        if (search) {
            values.push(`%${search}%`);
            whereClause = `WHERE (crew_id || ' ' || COALESCE(name,'') || ' ' || COALESCE(email,'') || ' ' || COALESCE(phone,'')) ILIKE $1`;
        }
        const query = `
      SELECT crew_id, name, status, role, address, phone, email, assigned_center
      FROM crew ${whereClause}
      ORDER BY crew_id
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
        const countQuery = `SELECT COUNT(*) FROM crew ${whereClause}`;
        const [items, total] = await Promise.all([
            pool_1.default.query(query, [...values, limit, offset]),
            pool_1.default.query(countQuery, values)
        ]);
        res.json({
            items: items.rows,
            total: Number(total.rows[0].count),
            page: Math.floor(offset / limit) + 1,
            pageSize: limit
        });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin crew list error');
        res.status(500).json({ error: 'Failed to fetch crew list' });
    }
});
router.get('/managers', async (req, res) => {
    try {
        const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
        const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
        const search = String(req.query.q ?? '').trim();
        let whereClause = '';
        const values = [];
        if (search) {
            values.push(`%${search}%`);
            whereClause = `WHERE (manager_id || ' ' || COALESCE(manager_name,'') || ' ' || COALESCE(email,'') || ' ' || COALESCE(phone,'')) ILIKE $1`;
        }
        const query = `
      SELECT manager_id, manager_name, status, email, phone, territory
      FROM managers ${whereClause}
      ORDER BY manager_id
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
        const countQuery = `SELECT COUNT(*) FROM managers ${whereClause}`;
        const [items, total] = await Promise.all([
            pool_1.default.query(query, [...values, limit, offset]),
            pool_1.default.query(countQuery, values)
        ]);
        res.json({
            items: items.rows,
            total: Number(total.rows[0].count),
            page: Math.floor(offset / limit) + 1,
            pageSize: limit
        });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin managers list error');
        res.status(500).json({ error: 'Failed to fetch managers list' });
    }
});
router.get('/contractors/unassigned', async (req, res) => {
    try {
        const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
        const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
        const search = String(req.query.q ?? '').trim();
        let whereClause = 'WHERE cks_manager IS NULL';
        const values = [];
        if (search) {
            values.push(`%${search}%`);
            whereClause += ` AND (contractor_id || ' ' || COALESCE(company_name,'') || ' ' || COALESCE(email,'')) ILIKE $1`;
        }
        const query = `
      SELECT 
        contractor_id, 
        company_name, 
        main_contact, 
        address, 
        phone, 
        email,
        'unassigned'::text as status
      FROM contractors ${whereClause}
      ORDER BY contractor_id
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
        const countQuery = `SELECT COUNT(*) FROM contractors ${whereClause}`;
        const [items, total] = await Promise.all([
            pool_1.default.query(query, [...values, limit, offset]),
            pool_1.default.query(countQuery, values)
        ]);
        res.json({
            items: items.rows,
            total: Number(total.rows[0].count),
            page: Math.floor(offset / limit) + 1,
            pageSize: limit
        });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin unassigned contractors list error');
        res.status(500).json({ error: 'Failed to fetch unassigned contractors' });
    }
});
router.get('/contractors', async (req, res) => {
    try {
        const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
        const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
        const search = String(req.query.q ?? '').trim();
        let whereClause = '';
        const values = [];
        if (search) {
            values.push(`%${search}%`);
            whereClause = `WHERE (contractor_id || ' ' || COALESCE(company_name,'') || ' ' || COALESCE(email,'')) ILIKE $1`;
        }
        if (await hasColumn('contractors', 'archived_at')) {
            whereClause = whereClause ? `${whereClause} AND archived_at IS NULL` : 'WHERE archived_at IS NULL';
        }
        const query = `
      SELECT 
        contractor_id, 
        cks_manager, 
        company_name, 
        0::int AS num_customers, 
        COALESCE(contact_person, main_contact) AS main_contact, 
        address, 
        phone, 
        email,
        'active'::text as status
      FROM contractors ${whereClause}
      ORDER BY contractor_id
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
        const countQuery = `SELECT COUNT(*) FROM contractors ${whereClause}`;
        const [items, total] = await Promise.all([
            pool_1.default.query(query, [...values, limit, offset]),
            pool_1.default.query(countQuery, values)
        ]);
        res.json({
            items: items.rows,
            total: Number(total.rows[0].count),
            page: Math.floor(offset / limit) + 1,
            pageSize: limit
        });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin contractors list error');
        res.status(500).json({ error: 'Failed to fetch contractors list' });
    }
});
router.get('/customers/unassigned', async (req, res) => {
    try {
        const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
        const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
        const search = String(req.query.q ?? '').trim();
        let whereClause = 'WHERE contractor_id IS NULL';
        const values = [];
        if (search) {
            values.push(`%${search}%`);
            whereClause += ` AND (customer_id || ' ' || COALESCE(company_name,'') || ' ' || COALESCE(email,'')) ILIKE $${values.length}`;
        }
        if (await hasColumn('customers', 'archived_at'))
            whereClause += ' AND archived_at IS NULL';
        const query = `
      SELECT customer_id, contractor_id, company_name, COALESCE(contact_person, main_contact) AS main_contact, email, phone
      FROM customers ${whereClause}
      ORDER BY customer_id
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
        const countQuery = `SELECT COUNT(*) FROM customers ${whereClause}`;
        const [items, total] = await Promise.all([
            pool_1.default.query(query, [...values, limit, offset]),
            pool_1.default.query(countQuery, values)
        ]);
        res.json({ items: items.rows, total: Number(total.rows[0].count), page: Math.floor(offset / limit) + 1, pageSize: limit });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin unassigned customers list error');
        res.status(500).json({ error: 'Failed to fetch unassigned customers' });
    }
});
router.get('/customers', async (req, res) => {
    try {
        const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
        const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
        const search = String(req.query.q ?? '').trim();
        let whereClause = '';
        const values = [];
        if (search) {
            values.push(`%${search}%`);
            whereClause = `WHERE (customer_id || ' ' || COALESCE(company_name,'') || ' ' || COALESCE(email,'')) ILIKE $1`;
        }
        if (await hasColumn('customers', 'archived_at')) {
            whereClause = whereClause ? `${whereClause} AND archived_at IS NULL` : 'WHERE archived_at IS NULL';
        }
        const query = `
      SELECT customer_id, contractor_id, company_name, COALESCE(contact_person, main_contact) AS main_contact, phone, email
      FROM customers ${whereClause}
      ORDER BY customer_id
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
        const countQuery = `SELECT COUNT(*) FROM customers ${whereClause}`;
        const [items, total] = await Promise.all([
            pool_1.default.query(query, [...values, limit, offset]),
            pool_1.default.query(countQuery, values)
        ]);
        res.json({
            items: items.rows,
            total: Number(total.rows[0].count),
            page: Math.floor(offset / limit) + 1,
            pageSize: limit
        });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin customers list error');
        res.status(500).json({ error: 'Failed to fetch customers list' });
    }
});
router.get('/centers/unassigned', async (req, res) => {
    try {
        const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
        const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
        const search = String(req.query.q ?? '').trim();
        let whereClause = 'WHERE (customer_id IS NULL OR contractor_id IS NULL)';
        const values = [];
        if (search) {
            values.push(`%${search}%`);
            whereClause += ` AND (center_id || ' ' || COALESCE(center_name,'')) ILIKE $${values.length}`;
        }
        if (await hasColumn('centers', 'archived_at'))
            whereClause += ' AND archived_at IS NULL';
        const query = `
      SELECT center_id, center_name AS name, customer_id, contractor_id, address
      FROM centers ${whereClause}
      ORDER BY center_id
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
        const countQuery = `SELECT COUNT(*) FROM centers ${whereClause}`;
        const [items, total] = await Promise.all([
            pool_1.default.query(query, [...values, limit, offset]),
            pool_1.default.query(countQuery, values)
        ]);
        res.json({ items: items.rows, total: Number(total.rows[0].count), page: Math.floor(offset / limit) + 1, pageSize: limit });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin unassigned centers list error');
        res.status(500).json({ error: 'Failed to fetch unassigned centers' });
    }
});
router.get('/centers', async (req, res) => {
    try {
        const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
        const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
        const search = String(req.query.q ?? '').trim();
        let whereClause = '';
        const values = [];
        if (search) {
            values.push(`%${search}%`);
            whereClause = `WHERE (center_id || ' ' || COALESCE(name,'') || ' ' || COALESCE(email,'')) ILIKE $1`;
        }
        if (await hasColumn('centers', 'archived_at')) {
            whereClause = whereClause ? `${whereClause} AND archived_at IS NULL` : 'WHERE archived_at IS NULL';
        }
        const query = `
      SELECT center_id, center_name AS name, address, contractor_id, customer_id
      FROM centers ${whereClause}
      ORDER BY center_id
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
        const countQuery = `SELECT COUNT(*) FROM centers ${whereClause}`;
        const [items, total] = await Promise.all([
            pool_1.default.query(query, [...values, limit, offset]),
            pool_1.default.query(countQuery, values)
        ]);
        res.json({
            items: items.rows,
            total: Number(total.rows[0].count),
            page: Math.floor(offset / limit) + 1,
            pageSize: limit
        });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin centers list error');
        res.status(500).json({ error: 'Failed to fetch centers list' });
    }
});
router.get('/products', async (req, res) => {
    try {
        const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
        const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
        const search = String(req.query.q ?? '').trim();
        let whereClause = '';
        const values = [];
        if (search) {
            values.push(`%${search}%`);
            whereClause = `WHERE (product_id || ' ' || COALESCE(product_name,'') || ' ' || COALESCE(category,'')) ILIKE $1`;
        }
        const query = `
      SELECT product_id, product_name, category, unit, price, status
      FROM products ${whereClause}
      ORDER BY product_id
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
        const countQuery = `SELECT COUNT(*) FROM products ${whereClause}`;
        const [items, total] = await Promise.all([
            pool_1.default.query(query, [...values, limit, offset]),
            pool_1.default.query(countQuery, values)
        ]);
        res.json({ items: items.rows, total: Number(total.rows[0].count), page: Math.floor(offset / limit) + 1, pageSize: limit });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin products list error');
        res.status(500).json({ error: 'Failed to fetch products list' });
    }
});
router.get('/supplies', async (req, res) => {
    try {
        const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
        const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
        const search = String(req.query.q ?? '').trim();
        let whereClause = '';
        const values = [];
        if (search) {
            values.push(`%${search}%`);
            whereClause = `WHERE (supply_id || ' ' || COALESCE(supply_name,'') || ' ' || COALESCE(category,'')) ILIKE $1`;
        }
        const query = `
      SELECT supply_id, supply_name, category, unit_cost, unit, status
      FROM supplies ${whereClause}
      ORDER BY supply_id
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
        const countQuery = `SELECT COUNT(*) FROM supplies ${whereClause}`;
        const [items, total] = await Promise.all([
            pool_1.default.query(query, [...values, limit, offset]),
            pool_1.default.query(countQuery, values)
        ]);
        res.json({ items: items.rows, total: Number(total.rows[0].count), page: Math.floor(offset / limit) + 1, pageSize: limit });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin supplies list error');
        res.status(500).json({ error: 'Failed to fetch supplies list' });
    }
});
router.get('/procedures', async (req, res) => {
    try {
        const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
        const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
        const search = String(req.query.q ?? '').trim();
        let whereClause = '';
        const values = [];
        if (search) {
            values.push(`%${search}%`);
            whereClause = `WHERE (procedure_id || ' ' || COALESCE(procedure_name,'') || ' ' || COALESCE(center_id,'')) ILIKE $1`;
        }
        const query = `
      SELECT procedure_id, procedure_name, center_id, status
      FROM procedures ${whereClause}
      ORDER BY procedure_id
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
        const countQuery = `SELECT COUNT(*) FROM procedures ${whereClause}`;
        const [items, total] = await Promise.all([
            pool_1.default.query(query, [...values, limit, offset]),
            pool_1.default.query(countQuery, values)
        ]);
        res.json({ items: items.rows, total: Number(total.rows[0].count), page: Math.floor(offset / limit) + 1, pageSize: limit });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin procedures list error');
        res.status(500).json({ error: 'Failed to fetch procedures list' });
    }
});
router.get('/training', async (req, res) => {
    try {
        const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
        const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
        const search = String(req.query.q ?? '').trim();
        let whereClause = '';
        const values = [];
        if (search) {
            values.push(`%${search}%`);
            whereClause = `WHERE (training_id || ' ' || COALESCE(training_name,'') || ' ' || COALESCE(service_id,'')) ILIKE $1`;
        }
        const query = `
      SELECT training_id, training_name, service_id, status
      FROM training ${whereClause}
      ORDER BY training_id
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
        const countQuery = `SELECT COUNT(*) FROM training ${whereClause}`;
        const [items, total] = await Promise.all([
            pool_1.default.query(query, [...values, limit, offset]),
            pool_1.default.query(countQuery, values)
        ]);
        res.json({ items: items.rows, total: Number(total.rows[0].count), page: Math.floor(offset / limit) + 1, pageSize: limit });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin training list error');
        res.status(500).json({ error: 'Failed to fetch training list' });
    }
});
router.post('/procedures', async (req, res) => {
    try {
        const { procedure_name, center_id, description, steps, required_skills, estimated_duration, status } = req.body;
        if (!procedure_name)
            return res.status(400).json({ error: 'procedure_name is required' });
        if (!center_id)
            return res.status(400).json({ error: 'center_id is required' });
        const r = await pool_1.default.query(`INSERT INTO procedures(procedure_id, center_id, procedure_name, description, steps, required_skills, estimated_duration, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING procedure_id, procedure_name, center_id, status`, [
            await getNextIdGeneric('procedures', 'procedure_id', 'PRC-'),
            center_id,
            procedure_name,
            description || null,
            Array.isArray(steps) ? steps : (steps ? String(steps).split(',').map((s) => s.trim()) : null),
            Array.isArray(required_skills) ? required_skills : (required_skills ? String(required_skills).split(',').map((s) => s.trim()) : null),
            estimated_duration || null,
            status || 'active'
        ]);
        return res.status(201).json({ success: true, data: r.rows[0] });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin create procedure error');
        res.status(500).json({ error: 'Failed to create procedure' });
    }
});
router.post('/users', async (req, res) => {
    try {
        const { role } = req.body || {};
        if (!role || !['manager', 'contractor', 'customer', 'center', 'crew'].includes(String(role))) {
            return res.status(400).json({ error: 'Invalid or missing role' });
        }
        if (role === 'manager') {
            const name = String(req.body.manager_name || req.body.name || '').trim();
            if (!name)
                return res.status(400).json({ error: 'manager_name is required' });
            const manager_id = await getNextIdGeneric('managers', 'manager_id', 'MGR-');
            const r = await pool_1.default.query(`INSERT INTO managers(manager_id, manager_name, email, phone, territory, status)
         VALUES ($1,$2,$3,$4,$5,'active') RETURNING manager_id, manager_name, email, phone, territory, status`, [manager_id, name, req.body.email || null, req.body.phone || null, req.body.territory || null]);
            await upsertAppUserByEmail(req.body.email, 'manager', manager_id, name);
            try {
                await (0, activity_1.logActivity)('user_created', `Manager ${manager_id} created`, String(req.headers['x-admin-user-id'] || 'admin'), 'admin', manager_id, 'manager', { email: req.body.email || null });
            }
            catch { }
            return res.status(201).json({ success: true, data: { ...r.rows[0] } });
        }
        if (role === 'contractor') {
            const company = String(req.body.company_name || '').trim();
            if (!company)
                return res.status(400).json({ error: 'company_name is required' });
            const contractor_id = await getNextIdGeneric('contractors', 'contractor_id', 'CON-');
            const cols = ['contractor_id', 'cks_manager', 'company_name'];
            const vals = [contractor_id, req.body.cks_manager || null, company];
            const optional = [
                ['contact_person', (req.body.main_contact ?? req.body.contact_person) || null],
                ['email', req.body.email || null],
                ['phone', req.body.phone || null],
                ['address', req.body.address || null],
                ['website', req.body.website || null],
                ['business_type', req.body.business_type || null],
            ];
            for (const [key, value] of optional) {
                if (await hasColumn('contractors', key)) {
                    cols.push(key);
                    vals.push(value);
                }
            }
            const hasStatusCol = await hasColumn('contractors', 'status');
            if (hasStatusCol) {
                cols.push('status');
                vals.push('active');
            }
            const placeholders = cols.map((_, i) => `$${i + 1}`).join(',');
            const returningCols = ['contractor_id', 'cks_manager', 'company_name', ...(hasStatusCol ? ['status'] : [])];
            const insertSql = `INSERT INTO contractors(${cols.join(',')}) VALUES (${placeholders}) RETURNING ${returningCols.join(', ')}`;
            const r = await pool_1.default.query(insertSql, vals);
            const data = hasStatusCol ? r.rows[0] : { ...r.rows[0], status: 'active' };
            await upsertAppUserByEmail(req.body.email, 'contractor', contractor_id, company);
            try {
                await (0, activity_1.logActivity)('user_created', `Contractor ${contractor_id} created`, String(req.headers['x-admin-user-id'] || 'admin'), 'admin', contractor_id, 'contractor', { email: req.body.email || null });
            }
            catch { }
            return res.status(201).json({ success: true, data });
        }
        if (role === 'customer') {
            const company = String(req.body.company_name || '').trim();
            const cks_manager = String(req.body.cks_manager || '').trim();
            if (!company)
                return res.status(400).json({ error: 'company_name is required' });
            if (!cks_manager)
                return res.status(400).json({ error: 'cks_manager is required' });
            const customer_id = await getNextIdGeneric('customers', 'customer_id', 'CUS-');
            const r = await pool_1.default.query(`INSERT INTO customers(customer_id, cks_manager, company_name, contact_person, email, phone, service_tier, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'active')
         RETURNING customer_id, cks_manager, company_name, contact_person, email, phone, service_tier, status`, [
                customer_id,
                cks_manager,
                company,
                (req.body.main_contact ?? req.body.contact_person) || null,
                req.body.email || null,
                req.body.phone || null,
                req.body.service_tier || null
            ]);
            await upsertAppUserByEmail(req.body.email, 'customer', customer_id, company);
            try {
                await (0, activity_1.logActivity)('user_created', `Customer ${customer_id} created`, String(req.headers['x-admin-user-id'] || 'admin'), 'admin', customer_id, 'customer', { email: req.body.email || null });
            }
            catch { }
            return res.status(201).json({ success: true, data: { ...r.rows[0] } });
        }
        if (role === 'center') {
            const center_name = String(req.body.center_name || '').trim();
            const customer_id = String(req.body.customer_id || '').trim();
            const contractor_id = String(req.body.contractor_id || '').trim();
            const cks_manager = String(req.body.cks_manager || '').trim();
            if (!center_name)
                return res.status(400).json({ error: 'center_name is required' });
            if (!customer_id)
                return res.status(400).json({ error: 'customer_id is required' });
            if (!contractor_id)
                return res.status(400).json({ error: 'contractor_id is required' });
            if (!cks_manager)
                return res.status(400).json({ error: 'cks_manager is required' });
            const center_id = await getNextIdGeneric('centers', 'center_id', 'CEN-');
            const r = await pool_1.default.query(`INSERT INTO centers(center_id, cks_manager, center_name, customer_id, contractor_id, address, operational_hours, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'active')
         RETURNING center_id, cks_manager, center_name, customer_id, contractor_id, address, operational_hours, status`, [
                center_id,
                cks_manager,
                center_name,
                customer_id,
                contractor_id,
                req.body.address || null,
                req.body.operational_hours || null
            ]);
            await upsertAppUserByEmail(req.body.email, 'center', center_id, center_name);
            try {
                await (0, activity_1.logActivity)('user_created', `Center ${center_id} created`, String(req.headers['x-admin-user-id'] || 'admin'), 'admin', center_id, 'center', {});
            }
            catch { }
            return res.status(201).json({ success: true, data: { ...r.rows[0] } });
        }
        if (role === 'crew') {
            const crew_name = String(req.body.crew_name || req.body.name || '').trim();
            const crew_id = await getNextIdGeneric('crew', 'crew_id', 'CRW-');
            const r = await pool_1.default.query(`INSERT INTO crew(crew_id, cks_manager, assigned_center, crew_name, skills, certification_level, status, profile)
         VALUES ($1,$2,$3,$4,$5,$6,'active',$7)
         RETURNING crew_id, cks_manager, assigned_center, crew_name, skills, certification_level, status`, [
                crew_id,
                req.body.cks_manager || null,
                req.body.assigned_center || null,
                crew_name || null,
                Array.isArray(req.body.skills) ? req.body.skills : (req.body.skills ? String(req.body.skills).split(',').map((s) => s.trim()) : null),
                req.body.certification_level || null,
                req.body.profile || null
            ]);
            await upsertAppUserByEmail(req.body.email, 'crew', crew_id, crew_name);
            try {
                await (0, activity_1.logActivity)('user_created', `Crew ${crew_id} created`, String(req.headers['x-admin-user-id'] || 'admin'), 'admin', crew_id, 'crew', {});
            }
            catch { }
            return res.status(201).json({ success: true, data: { ...r.rows[0] } });
        }
        return res.status(400).json({ error: 'Unsupported role' });
    }
    catch (e) {
        const msg = e?.message || String(e);
        logger_1.logger.error({ error: e }, 'Admin create user error');
        res.status(500).json({ error: 'Failed to create user', details: msg });
    }
});
router.post('/auth/invite', async (_req, res) => {
    try {
        return res.status(501).json({ error: 'clerk_not_configured' });
    }
    catch (e) {
        return res.status(500).json({ error: 'invite_failed' });
    }
});
router.post('/training', async (req, res) => {
    try {
        const { training_name, service_id, description, duration_hours, certification_level, requirements, status } = req.body;
        if (!training_name)
            return res.status(400).json({ error: 'training_name is required' });
        if (!service_id)
            return res.status(400).json({ error: 'service_id is required' });
        const r = await pool_1.default.query(`INSERT INTO training(training_id, service_id, training_name, description, duration_hours, certification_level, requirements, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING training_id, training_name, service_id, status`, [
            await getNextIdGeneric('training', 'training_id', 'TRN-'),
            service_id,
            training_name,
            description || null,
            duration_hours || null,
            certification_level || null,
            Array.isArray(requirements) ? requirements : (requirements ? String(requirements).split(',').map((s) => s.trim()) : null),
            status || 'active'
        ]);
        return res.status(201).json({ success: true, data: r.rows[0] });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin create training error');
        res.status(500).json({ error: 'Failed to create training' });
    }
    router.delete('/training/:id', async (req, res) => {
        try {
            const id = String(req.params.id || '').trim();
            if (!id)
                return res.status(400).json({ error: 'training_id required' });
            if (await hasColumn('training', 'archived_at')) {
                const r = await pool_1.default.query(`UPDATE training SET archived_at=NOW() WHERE training_id=$1 RETURNING training_id`, [id]);
                if (r.rowCount === 0)
                    return res.status(404).json({ error: 'not_found' });
                return res.json({ success: true, message: 'Training archived' });
            }
            else {
                const r = await pool_1.default.query(`DELETE FROM training WHERE training_id=$1 RETURNING training_id`, [id]);
                if (r.rowCount === 0)
                    return res.status(404).json({ error: 'not_found' });
                return res.json({ success: true, message: 'Training deleted' });
            }
        }
        catch (e) {
            logger_1.logger.error({ error: e }, 'Admin delete training error');
            res.status(500).json({ error: 'Failed to delete training' });
        }
    });
});
router.get('/warehouses', async (req, res) => {
    try {
        const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
        const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
        const search = String(req.query.q ?? '').trim();
        let whereClause = '';
        const values = [];
        if (search) {
            values.push(`%${search}%`);
            whereClause = `WHERE (warehouse_id || ' ' || COALESCE(warehouse_name,'') || ' ' || COALESCE(address,'')) ILIKE $1`;
        }
        const query = `
      SELECT warehouse_id, warehouse_name, address, manager_id, capacity, current_utilization, status
      FROM warehouses ${whereClause}
      ORDER BY warehouse_id
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
        const countQuery = `SELECT COUNT(*) FROM warehouses ${whereClause}`;
        const [items, total] = await Promise.all([
            pool_1.default.query(query, [...values, limit, offset]),
            pool_1.default.query(countQuery, values)
        ]);
        res.json({
            items: items.rows,
            total: Number(total.rows[0].count),
            page: Math.floor(offset / limit) + 1,
            pageSize: limit
        });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin warehouses list error');
        res.status(500).json({ error: 'Failed to fetch warehouses list' });
    }
});
router.post('/warehouses', async (req, res) => {
    try {
        const { warehouse_name, address, manager_id, warehouse_type, phone, email, date_acquired, capacity, status } = req.body || {};
        if (!warehouse_name)
            return res.status(400).json({ error: 'warehouse_name is required' });
        const id = await getNextIdGeneric('warehouses', 'warehouse_id', 'WH-');
        await pool_1.default.query('BEGIN');
        const inserted = await pool_1.default.query(`INSERT INTO warehouses(warehouse_id, warehouse_name, address, manager_id, warehouse_type, phone, email, date_acquired, capacity, current_utilization, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING warehouse_id, warehouse_name, address, manager_id, warehouse_type, phone, email, date_acquired, capacity, current_utilization, status`, [id, warehouse_name, address || null, manager_id || null, warehouse_type || null, phone || null, email || null, date_acquired ? new Date(date_acquired) : null, capacity || null, 0, status || 'active']);
        try {
            await pool_1.default.query(`INSERT INTO inventory_items (warehouse_id, item_id, item_type, sku, item_name, category, quantity_on_hand, min_stock_level, unit_cost, location_code)
         SELECT $1, p.product_id, 'product', p.product_id, p.product_name, p.category, 0, 0, p.price, NULL
         FROM products p
         WHERE p.status = 'active'
         ON CONFLICT (warehouse_id, item_id) DO NOTHING`, [id]);
        }
        catch { }
        try {
            await pool_1.default.query(`INSERT INTO inventory_items (warehouse_id, item_id, item_type, sku, item_name, category, quantity_on_hand, min_stock_level, unit_cost, location_code)
         SELECT $1, s.supply_id, 'supply', s.supply_id, s.supply_name, s.category, 0, 0, s.unit_cost, NULL
         FROM supplies s
         WHERE s.status = 'active'
         ON CONFLICT (warehouse_id, item_id) DO NOTHING`, [id]);
        }
        catch { }
        await pool_1.default.query(`INSERT INTO warehouse_activity_log(warehouse_id, activity_type, description)
       VALUES ($1,'stock_adjustment','Warehouse created and inventory bootstrapped')`, [id]);
        try {
            await upsertAppUserByEmail(email, 'warehouse', id, warehouse_name);
        }
        catch { }
        await pool_1.default.query('COMMIT');
        return res.status(201).json({ success: true, data: inserted.rows[0] });
    }
    catch (e) {
        await pool_1.default.query('ROLLBACK').catch(() => { });
        logger_1.logger.error({ error: e }, 'Admin create warehouse error');
        return res.status(500).json({ error: 'Failed to create warehouse' });
    }
});
router.get('/orders', async (req, res) => {
    try {
        const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
        const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
        const search = String(req.query.q ?? '').trim();
        let whereClause = '';
        const values = [];
        if (search) {
            values.push(`%${search}%`);
            whereClause = `WHERE (order_id || ' ' || COALESCE(customer_id,'') || ' ' || COALESCE(center_id,'') || ' ' || COALESCE(status,'')) ILIKE $1`;
        }
        const query = `
      SELECT 
        order_id as id, 
        CASE 
          WHEN service_id IS NOT NULL THEN 'Service'
          ELSE 'Product'
        END as type,
        customer_id as requester, 
        status, 
        order_date as date,
        center_id, service_id, completion_date, total_amount, notes
      FROM orders ${whereClause}
      ORDER BY order_date DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
        const countQuery = `SELECT COUNT(*) FROM orders ${whereClause}`;
        const [items, total] = await Promise.all([
            pool_1.default.query(query, [...values, limit, offset]),
            pool_1.default.query(countQuery, values)
        ]);
        res.json({
            items: items.rows,
            total: Number(total.rows[0].count),
            page: Math.floor(offset / limit) + 1,
            pageSize: limit
        });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin orders list error');
        res.status(500).json({ error: 'Failed to fetch orders list' });
    }
});
router.get('/catalog/debug', async (req, res) => {
    try {
        const tables = await pool_1.default.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
        const tableList = tables.rows.map(row => row.table_name);
        const hasServices = tableList.includes('services');
        const hasProducts = tableList.includes('products');
        let servicesInfo = null;
        let productsInfo = null;
        if (hasServices) {
            servicesInfo = await pool_1.default.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'services' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
        }
        if (hasProducts) {
            productsInfo = await pool_1.default.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'products' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
        }
        res.json({
            tables: tableList,
            services: hasServices ? {
                columns: servicesInfo?.rows,
                exists: true
            } : { exists: false },
            products: hasProducts ? {
                columns: productsInfo?.rows,
                exists: true
            } : { exists: false }
        });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin catalog debug error');
        res.status(500).json({ error: 'Failed to debug catalog tables', details: e.message });
    }
});
router.get('/catalog/items', async (req, res) => {
    try {
        const limit = Math.min(parseInt(String(req.query.limit ?? '50'), 10), 200);
        const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
        const search = String(req.query.q ?? '').trim();
        let whereClause = '';
        const values = [];
        if (search) {
            values.push(`%${search}%`);
            whereClause = `WHERE service_name ILIKE $1`;
        }
        const query = `
      SELECT 
        service_id as id,
        service_name as name,
        category,
        description,
        pricing_model,
        requirements,
        status,
        'service' as type
      FROM services ${whereClause}
      ORDER BY service_name
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
        const countQuery = `SELECT COUNT(*) FROM services ${whereClause}`;
        values.push(limit, offset);
        const [items, total] = await Promise.all([
            pool_1.default.query(query, values),
            pool_1.default.query(countQuery, values.slice(0, -2))
        ]);
        const filtered = (items.rows || []).filter((r) => {
            const id = String(r.id || '');
            const name = String(r.name || '');
            if (/template/i.test(name))
                return false;
            if (/(^|-)000$/i.test(id))
                return false;
            return true;
        });
        res.json({
            items: filtered,
            total: filtered.length,
            page: Math.floor(offset / limit) + 1,
            pageSize: limit
        });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin catalog items error');
        res.status(500).json({ error: 'Failed to fetch catalog items' });
    }
});
router.post('/catalog/items', async (req, res) => {
    try {
        const { name, category, description, pricing_model, requirements, status } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Service name is required' });
        }
        const serviceId = await getNextIdGeneric('services', 'service_id', 'SRV-');
        const result = await pool_1.default.query(`
      INSERT INTO services (
        service_id, service_name, category, description, pricing_model, requirements, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        service_id as id, service_name as name, category, description, pricing_model, requirements, status, 'service' as type
    `, [
            serviceId,
            name,
            category || null,
            description || null,
            pricing_model || null,
            requirements || null,
            status || 'active'
        ]);
        res.status(201).json({
            success: true,
            item: result.rows[0]
        });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin catalog create error');
        res.status(500).json({ error: 'Failed to create catalog item' });
    }
});
router.put('/catalog/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, description, pricing_model, requirements, status } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Service name is required' });
        }
        const result = await pool_1.default.query(`
      UPDATE services 
      SET 
        service_name = $2,
        category = $3,
        description = $4,
        pricing_model = $5,
        requirements = $6,
        status = $7
      WHERE service_id = $1
      RETURNING 
        service_id as id, service_name as name, category, description, pricing_model, requirements, status, 'service' as type
    `, [
            id,
            name,
            category || null,
            description || null,
            pricing_model || null,
            requirements || null,
            status || 'active'
        ]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json({
            success: true,
            item: result.rows[0]
        });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin catalog update error');
        res.status(500).json({ error: 'Failed to update catalog item' });
    }
});
router.delete('/catalog/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const has = await hasColumn('services', 'archived_at');
        if (has) {
            const r = await pool_1.default.query(`UPDATE services SET archived_at=NOW() WHERE service_id=$1 RETURNING service_id as id`, [id]);
            if (r.rowCount === 0)
                return res.status(404).json({ error: 'Service not found' });
            return res.json({ success: true, message: 'Service archived' });
        }
        else {
            const result = await pool_1.default.query(`DELETE FROM services WHERE service_id=$1 RETURNING service_id as id`, [id]);
            if (result.rowCount === 0)
                return res.status(404).json({ error: 'Service not found' });
            return res.json({ success: true, message: 'Service deleted' });
        }
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin catalog delete error');
        res.status(500).json({ error: 'Failed to delete catalog item' });
    }
});
router.get('/schema/contractors', async (_req, res) => {
    try {
        const rows = (await pool_1.default.query(`SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'contractors'
       ORDER BY ordinal_position`)).rows;
        res.json({ success: true, data: rows });
    }
    catch (e) {
        res.status(500).json({ success: false, error: 'Schema introspection failed', details: process.env.NODE_ENV !== 'production' ? e?.message : undefined });
    }
});
router.delete('/customers/:id', async (req, res) => {
    const id = String(req.params.id);
    try {
        const r = await pool_1.default.query('DELETE FROM customers WHERE customer_id = $1 RETURNING customer_id', [id]);
        if (r.rowCount === 0)
            return res.status(404).json({ error: 'Not found' });
        return res.json({ success: true, data: { customer_id: id } });
    }
    catch (e) {
        if (e?.code === '23503')
            return res.status(409).json({ error: 'in_use' });
        logger_1.logger.error({ error: e }, 'Admin delete customer error');
        return res.status(500).json({ error: 'Delete failed' });
    }
});
router.delete('/centers/:id', async (req, res) => {
    const id = String(req.params.id);
    try {
        const r = await pool_1.default.query('DELETE FROM centers WHERE center_id = $1 RETURNING center_id', [id]);
        if (r.rowCount === 0)
            return res.status(404).json({ error: 'Not found' });
        return res.json({ success: true, data: { center_id: id } });
    }
    catch (e) {
        if (e?.code === '23503')
            return res.status(409).json({ error: 'in_use' });
        logger_1.logger.error({ error: e }, 'Admin delete center error');
        return res.status(500).json({ error: 'Delete failed' });
    }
});
router.delete('/crew/:id', async (req, res) => {
    const id = String(req.params.id);
    try {
        const r = await pool_1.default.query('DELETE FROM crew WHERE crew_id = $1 RETURNING crew_id', [id]);
        if (r.rowCount === 0)
            return res.status(404).json({ error: 'Not found' });
        return res.json({ success: true, data: { crew_id: id } });
    }
    catch (e) {
        if (e?.code === '23503')
            return res.status(409).json({ error: 'in_use' });
        logger_1.logger.error({ error: e }, 'Admin delete crew error');
        return res.status(500).json({ error: 'Delete failed' });
    }
});
router.delete('/warehouses/:id', async (req, res) => {
    const id = String(req.params.id);
    try {
        const r = await pool_1.default.query('DELETE FROM warehouses WHERE warehouse_id = $1 RETURNING warehouse_id', [id]);
        if (r.rowCount === 0)
            return res.status(404).json({ error: 'Not found' });
        return res.json({ success: true, data: { warehouse_id: id } });
    }
    catch (e) {
        if (e?.code === '23503')
            return res.status(409).json({ error: 'in_use' });
        logger_1.logger.error({ error: e }, 'Admin delete warehouse error');
        return res.status(500).json({ error: 'Delete failed' });
    }
});
router.delete('/managers/:id', async (req, res) => {
    const id = String(req.params.id);
    try {
        const existing = await pool_1.default.query('SELECT manager_id, manager_name FROM managers WHERE manager_id = $1', [id]);
        if (existing.rowCount === 0)
            return res.status(404).json({ error: 'Not found' });
        const managerName = existing.rows[0].manager_name;
        const r = await pool_1.default.query('UPDATE managers SET archived_at = NOW() WHERE manager_id = $1 RETURNING manager_id', [id]);
        if (r.rowCount === 0)
            return res.status(404).json({ error: 'Not found' });
        try {
            await (0, activity_1.logActivity)('user_deleted', `Manager ${id} (${managerName}) archived`, String(req.headers['x-admin-user-id'] || 'admin'), 'admin', id, 'manager', { name: managerName });
        }
        catch { }
        return res.json({ success: true, data: { manager_id: id }, message: `Manager ${id} archived` });
    }
    catch (e) {
        if (e?.code === '23503')
            return res.status(409).json({ error: 'in_use' });
        logger_1.logger.error({ error: e }, 'Admin delete manager error');
        return res.status(500).json({ error: 'Delete failed' });
    }
});
router.post('/auth/invite', async (req, res) => {
    const { role: rawRole, code, email } = req.body || {};
    const role = String(rawRole || '').toLowerCase();
    if (!email || !code || !role) {
        return res.status(400).json({ error: 'role, code, and email are required' });
    }
    const metaKey = role === 'manager' ? 'manager_id'
        : role === 'contractor' ? 'contractor_id'
            : role === 'customer' ? 'customer_id'
                : role === 'center' ? 'center_id'
                    : role === 'crew' ? 'crew_id'
                        : role === 'warehouse' ? 'warehouse_id'
                            : undefined;
    if (!metaKey)
        return res.status(400).json({ error: 'unsupported_role' });
    const secret = process.env.CLERK_SECRET_KEY;
    let clerk = null;
    try {
        clerk = require('@clerk/clerk-sdk-node');
    }
    catch { }
    if (!secret || !clerk) {
        return res.status(501).json({ error: 'clerk_not_configured', details: 'Set CLERK_SECRET_KEY and install @clerk/clerk-sdk-node' });
    }
    try {
        const { createClerkClient } = clerk;
        const client = createClerkClient({ secretKey: secret });
        const username = String(code).toLowerCase();
        const publicMetadata = { role, [metaKey]: code };
        const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
        const userParams = {
            emailAddress: [email],
            username,
            publicMetadata
        };
        if (isDevelopment) {
            userParams.password = 'test123';
        }
        const user = await client.users.createUser(userParams);
        const invitation = await client.invitations.createInvitation({
            emailAddress: email,
            publicMetadata,
            redirectUrl: `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/login`
        });
        return res.json({
            success: true,
            data: {
                clerk_user_id: user?.id || null,
                invitation_id: invitation?.id,
                invitation_status: invitation?.status
            }
        });
    }
    catch (e) {
        logger_1.logger.error({ error: e?.message }, 'Clerk invite failed');
        return res.status(500).json({ error: 'clerk_invite_failed', details: e?.message });
    }
});
router.post('/contractors/:id/assign-manager', async (req, res) => {
    const contractorId = String(req.params.id || '').trim();
    const managerId = String(req.body?.manager_id || '').trim();
    if (!contractorId)
        return res.status(400).json({ error: 'contractor_id required' });
    if (!managerId)
        return res.status(400).json({ error: 'manager_id required' });
    try {
        const mgr = await pool_1.default.query('SELECT 1 FROM managers WHERE UPPER(manager_id) = UPPER($1)', [managerId]);
        if (mgr.rowCount === 0)
            return res.status(404).json({ error: 'manager_not_found' });
        const r = await pool_1.default.query(`UPDATE contractors 
       SET cks_manager = $2
       WHERE UPPER(contractor_id) = UPPER($1)
       RETURNING contractor_id, cks_manager`, [contractorId, managerId]);
        if (r.rowCount === 0)
            return res.status(404).json({ error: 'contractor_not_found' });
        try {
            await (0, activity_1.logActivity)('assignment', `Contractor ${contractorId} assigned to manager ${managerId}`, String(req.headers['x-admin-user-id'] || 'admin'), 'admin', contractorId, 'contractor', { manager_id: managerId });
        }
        catch { }
        return res.json({ success: true, data: r.rows[0] });
    }
    catch (e) {
        logger_1.logger.error({ error: e, contractorId, managerId }, 'Assign contractor->manager failed');
        const payload = { error: 'assign_failed' };
        if (process.env.NODE_ENV !== 'production') {
            payload.details = e?.detail || e?.message || String(e);
            if (e?.code)
                payload.code = e.code;
        }
        if (e?.code === '23503')
            return res.status(409).json(payload);
        return res.status(500).json(payload);
    }
});
router.get('/crew/unassigned', async (req, res) => {
    try {
        let query;
        try {
            await pool_1.default.query('SELECT 1 FROM crew_requirements LIMIT 1');
            query = `
        SELECT 
          c.crew_id, 
          c.crew_name,
          c.status,
          c.skills,
          c.certification_level,
          c.profile,
          c.created_at,
          COUNT(cr.requirement_id) as total_requirements,
          COUNT(CASE WHEN cr.status = 'completed' THEN 1 END) as completed_requirements
        FROM crew c
        LEFT JOIN crew_requirements cr ON c.crew_id = cr.crew_id AND cr.required = true
        WHERE c.assigned_center IS NULL
        GROUP BY c.crew_id, c.crew_name, c.status, c.skills, c.certification_level, c.profile, c.created_at
        ORDER BY c.created_at DESC
      `;
        }
        catch {
            query = `
        SELECT 
          crew_id, 
          name as crew_name,
          status,
          role,
          address,
          phone,
          email,
          assigned_center,
          0 as total_requirements,
          0 as completed_requirements
        FROM crew 
        WHERE assigned_center IS NULL
        ORDER BY crew_id
      `;
        }
        const result = await pool_1.default.query(query);
        const crews = result.rows.map(row => ({
            ...row,
            readiness_score: row.total_requirements > 0 ? Math.round((row.completed_requirements / row.total_requirements) * 100) : 100,
            is_ready: row.total_requirements === 0 || row.completed_requirements >= row.total_requirements
        }));
        res.json({ items: crews });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin unassigned crew error');
        res.status(500).json({ error: 'Failed to fetch unassigned crew' });
    }
});
router.get('/crew/:crew_id/requirements', async (req, res) => {
    try {
        const { crew_id } = req.params;
        const query = `
      SELECT 
        requirement_id,
        kind,
        item_id,
        title,
        required,
        due_date,
        status,
        source,
        created_at
      FROM crew_requirements
      WHERE crew_id = $1
      ORDER BY required DESC, created_at ASC
    `;
        const result = await pool_1.default.query(query, [crew_id]);
        res.json({ items: result.rows });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin crew requirements error');
        res.status(500).json({ error: 'Failed to fetch crew requirements' });
    }
});
router.post('/crew/:crew_id/assign-center', async (req, res) => {
    try {
        const { crew_id } = req.params;
        const { center_id, force_assign } = req.body;
        if (!center_id) {
            return res.status(400).json({ error: 'center_id is required' });
        }
        if (!force_assign) {
            const reqCheck = await pool_1.default.query(`
        SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
        FROM crew_requirements 
        WHERE crew_id = $1 AND required = true
      `, [crew_id]);
            const { total, completed } = reqCheck.rows[0];
            if (parseInt(total) > 0 && parseInt(completed) < parseInt(total)) {
                return res.status(400).json({
                    error: 'Crew member has incomplete requirements',
                    error_code: 'REQUIREMENTS_INCOMPLETE',
                    requirements_status: { total: parseInt(total), completed: parseInt(completed) }
                });
            }
        }
        const result = await pool_1.default.query(`
      UPDATE crew 
      SET assigned_center = $1, updated_at = CURRENT_TIMESTAMP
      WHERE crew_id = $2
      RETURNING crew_id, crew_name, assigned_center
    `, [center_id, crew_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Crew member not found' });
        }
        res.json({
            success: true,
            data: result.rows[0],
            message: force_assign ? 'Crew assigned with admin override' : 'Crew assigned successfully'
        });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin crew assignment error');
        res.status(500).json({ error: 'Failed to assign crew to center' });
    }
});
router.delete('/contractors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'Contractor ID is required' });
        }
        const existsCheck = await pool_1.default.query('SELECT contractor_id FROM contractors WHERE contractor_id = $1', [id]);
        if (existsCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Contractor not found' });
        }
        await pool_1.default.query('BEGIN');
        try {
            if (await hasColumn('contractors', 'archived_at')) {
                await pool_1.default.query('UPDATE contractors SET archived_at=NOW() WHERE contractor_id=$1', [id]);
                await pool_1.default.query('UPDATE customers SET contractor_id=NULL WHERE contractor_id=$1', [id]);
                await pool_1.default.query('UPDATE centers SET contractor_id=NULL WHERE contractor_id=$1', [id]);
            }
            else {
                await pool_1.default.query('DELETE FROM contractors WHERE contractor_id = $1', [id]);
            }
            try {
                await pool_1.default.query('DELETE FROM app_users WHERE code = $1', [id]);
            }
            catch { }
            await pool_1.default.query('COMMIT');
            return res.json({ success: true, message: `Contractor ${id} archived and unassigned` });
        }
        catch (deleteError) {
            await pool_1.default.query('ROLLBACK');
            throw deleteError;
        }
    }
    catch (e) {
        logger_1.logger.error({ error: e, contractor_id: req.params.id }, 'Admin contractor delete error');
        res.status(500).json({ error: 'Failed to delete contractor' });
    }
});
router.delete('/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'Customer ID is required' });
        }
        const existsCheck = await pool_1.default.query('SELECT customer_id FROM customers WHERE customer_id = $1', [id]);
        if (existsCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        await pool_1.default.query('BEGIN');
        try {
            if (await hasColumn('customers', 'archived_at')) {
                await pool_1.default.query('UPDATE customers SET archived_at=NOW() WHERE customer_id=$1', [id]);
                await pool_1.default.query('UPDATE centers SET customer_id=NULL WHERE customer_id=$1', [id]);
            }
            else {
                await pool_1.default.query('DELETE FROM customers WHERE customer_id = $1', [id]);
            }
            await pool_1.default.query('COMMIT');
            return res.json({ success: true, message: `Customer ${id} archived and unassigned` });
        }
        catch (err) {
            await pool_1.default.query('ROLLBACK');
            throw err;
        }
    }
    catch (e) {
        logger_1.logger.error({ error: e, customer_id: req.params.id }, 'Admin customer delete error');
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});
router.delete('/centers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'Center ID is required' });
        }
        const existsCheck = await pool_1.default.query('SELECT center_id FROM centers WHERE center_id = $1', [id]);
        if (existsCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Center not found' });
        }
        await pool_1.default.query('BEGIN');
        try {
            if (await hasColumn('centers', 'archived_at')) {
                await pool_1.default.query('UPDATE centers SET archived_at=NOW() WHERE center_id=$1', [id]);
                await pool_1.default.query('UPDATE crew SET assigned_center=NULL WHERE assigned_center=$1', [id]);
            }
            else {
                await pool_1.default.query('DELETE FROM centers WHERE center_id = $1', [id]);
            }
            await pool_1.default.query('COMMIT');
            return res.json({ success: true, message: `Center ${id} archived and unassigned` });
        }
        catch (err) {
            await pool_1.default.query('ROLLBACK');
            throw err;
        }
    }
    catch (e) {
        logger_1.logger.error({ error: e, center_id: req.params.id }, 'Admin center delete error');
        res.status(500).json({ error: 'Failed to delete center' });
    }
});
router.delete('/crew/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'Crew ID is required' });
        }
        const existsCheck = await pool_1.default.query('SELECT crew_id FROM crew WHERE crew_id = $1', [id]);
        if (existsCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Crew member not found' });
        }
        await pool_1.default.query('DELETE FROM crew WHERE crew_id = $1', [id]);
        res.json({
            success: true,
            message: `Crew member ${id} deleted successfully`
        });
    }
    catch (e) {
        logger_1.logger.error({ error: e, crew_id: req.params.id }, 'Admin crew delete error');
        res.status(500).json({ error: 'Failed to delete crew member' });
    }
});
router.delete('/warehouses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'Warehouse ID is required' });
        }
        const existsCheck = await pool_1.default.query('SELECT warehouse_id FROM warehouses WHERE warehouse_id = $1', [id]);
        if (existsCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Warehouse not found' });
        }
        await pool_1.default.query('BEGIN');
        try {
            if (await hasColumn('warehouses', 'archived_at')) {
                await pool_1.default.query('UPDATE warehouses SET archived_at=NOW() WHERE warehouse_id=$1', [id]);
            }
            else {
                await pool_1.default.query('DELETE FROM warehouses WHERE warehouse_id = $1', [id]);
            }
            await pool_1.default.query('COMMIT');
            return res.json({ success: true, message: `Warehouse ${id} archived` });
        }
        catch (err) {
            await pool_1.default.query('ROLLBACK');
            throw err;
        }
    }
    catch (e) {
        logger_1.logger.error({ error: e, warehouse_id: req.params.id }, 'Admin warehouse delete error');
        res.status(500).json({ error: 'Failed to delete warehouse' });
    }
});
router.patch('/contractors/:id/assign-manager', async (req, res) => {
    try {
        const { id } = req.params;
        const { manager_id } = req.body;
        if (!id) {
            return res.status(400).json({ error: 'Contractor ID is required' });
        }
        if (!manager_id) {
            return res.status(400).json({ error: 'Manager ID is required' });
        }
        const contractorCheck = await pool_1.default.query('SELECT contractor_id FROM contractors WHERE contractor_id = $1', [id]);
        if (contractorCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Contractor not found' });
        }
        const managerCheck = await pool_1.default.query('SELECT manager_id, manager_name FROM managers WHERE manager_id = $1', [manager_id]);
        if (managerCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Manager not found' });
        }
        const result = await pool_1.default.query(`
      UPDATE contractors 
      SET cks_manager = $1 
      WHERE contractor_id = $2 
      RETURNING contractor_id, cks_manager, company_name
    `, [manager_id, id]);
        try {
            await (0, activity_1.logActivity)('assignment', `Contractor ${id} assigned to manager ${manager_id}`, String(req.headers['x-admin-user-id'] || 'admin'), 'admin', id, 'contractor', { manager_id });
        }
        catch { }
        res.json({
            success: true,
            data: result.rows[0],
            message: `Contractor ${id} assigned to manager ${manager_id}`
        });
    }
    catch (e) {
        logger_1.logger.error({ error: e, contractor_id: req.params.id }, 'Admin contractor assign manager error');
        res.status(500).json({ error: 'Failed to assign contractor to manager' });
    }
});
router.post('/cleanup-demo-data', async (req, res) => {
    try {
        logger_1.logger.info('Starting demo data cleanup...');
        const cleanupQueries = [
            "DELETE FROM job_assignments",
            "DELETE FROM service_jobs",
            "DELETE FROM approvals",
            "DELETE FROM order_items",
            "DELETE FROM orders WHERE order_id LIKE 'REQ-%' OR order_id LIKE 'ORD-%'",
            "DELETE FROM warehouse_activity_log",
            "DELETE FROM shipment_items",
            "DELETE FROM warehouse_shipments",
            "DELETE FROM warehouse_staff",
            "DELETE FROM inventory_items",
            "DELETE FROM warehouses WHERE warehouse_id LIKE 'WH-%'",
            "DELETE FROM crew_requirements",
            "DELETE FROM procedures WHERE procedure_id LIKE 'PRC-%'",
            "DELETE FROM training WHERE training_id LIKE 'TRN-%'",
            "DELETE FROM report_comments",
            "DELETE FROM reports",
            "DELETE FROM feedback",
            "DELETE FROM crew WHERE crew_id LIKE 'crew-%' OR crew_id LIKE 'CRW-%'",
            "DELETE FROM centers WHERE center_id LIKE 'ctr-%' OR center_id LIKE 'CEN-%'",
            "DELETE FROM customers WHERE customer_id LIKE 'cus-%' OR customer_id LIKE 'CUS-%' OR customer_id LIKE 'cust-%'",
            "DELETE FROM contractors WHERE contractor_id LIKE 'con-%' OR contractor_id LIKE 'CON-%' OR contractor_id LIKE 'cont-%'",
            "DELETE FROM managers WHERE manager_id LIKE 'mgr-%' OR manager_id LIKE 'MGR-%'",
            "DELETE FROM products WHERE product_id LIKE 'PRD-%'",
            "DELETE FROM supplies WHERE supply_id LIKE 'SUP-%'"
        ];
        let cleanedCount = 0;
        for (const query of cleanupQueries) {
            try {
                const result = await pool_1.default.query(query);
                if (result.rowCount && result.rowCount > 0) {
                    cleanedCount += result.rowCount;
                    logger_1.logger.info(`Cleaned ${result.rowCount} records: ${query.substring(0, 50)}...`);
                }
            }
            catch (e) {
                if (e.code !== '42P01') {
                    logger_1.logger.warn(`Cleanup query failed: ${query} - ${e.message}`);
                }
            }
        }
        logger_1.logger.info(`Demo data cleanup completed. Removed ${cleanedCount} total records.`);
        res.json({
            success: true,
            message: `Demo data cleanup completed. Removed ${cleanedCount} records.`,
            cleanedCount
        });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Demo data cleanup error');
        res.status(500).json({ error: 'Failed to cleanup demo data' });
    }
});
exports.default = router;
router.get('/archive', async (req, res) => {
    try {
        const type = String(req.query.type || '').toLowerCase();
        const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
        const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
        let table = '';
        let cols = '';
        switch (type) {
            case 'contractors':
                table = 'contractors';
                cols = `contractor_id AS id, company_name AS name, archived_at AS date`;
                break;
            case 'customers':
                table = 'customers';
                cols = `customer_id AS id, company_name AS name, archived_at AS date`;
                break;
            case 'centers':
                table = 'centers';
                cols = `center_id AS id, center_name AS name, archived_at AS date`;
                break;
            case 'warehouses':
                table = 'warehouses';
                cols = `warehouse_id AS id, warehouse_name AS name, archived_at AS date`;
                break;
            case 'managers':
                table = 'managers';
                cols = `manager_id AS id, manager_name AS name, archived_at AS date`;
                break;
            case 'crew':
                table = 'crew';
                cols = `crew_id AS id, crew_name AS name, archived_at AS date`;
                break;
            case 'services':
                table = 'services';
                cols = `service_id AS id, service_name AS name, archived_at AS date`;
                break;
            case 'products':
                table = 'products';
                cols = `product_id AS id, product_name AS name, archived_at AS date`;
                break;
            case 'supplies':
                table = 'supplies';
                cols = `supply_id AS id, supply_name AS name, archived_at AS date`;
                break;
            case 'procedures':
                table = 'procedures';
                cols = `procedure_id AS id, procedure_name AS name, archived_at AS date`;
                break;
            case 'training':
                table = 'training';
                cols = `training_id AS id, training_name AS name, archived_at AS date`;
                break;
            case 'reports':
                table = 'reports';
                cols = `report_id AS id, title AS name, archived_at AS date`;
                break;
            case 'feedback':
                table = 'feedback';
                cols = `feedback_id AS id, title AS name, archived_at AS date`;
                break;
            case 'orders':
                table = 'orders';
                cols = `order_id AS id, COALESCE(notes,'') AS name, archived_at AS date`;
                break;
            default: return res.status(400).json({ error: 'invalid_type' });
        }
        if (!(await hasColumn(table, 'archived_at')))
            return res.json({ items: [], total: 0, page: 1, pageSize: limit });
        const q = `SELECT ${cols} FROM ${table} WHERE archived_at IS NOT NULL ORDER BY archived_at DESC LIMIT $1 OFFSET $2`;
        const c = `SELECT COUNT(*) FROM ${table} WHERE archived_at IS NOT NULL`;
        const [items, total] = await Promise.all([
            pool_1.default.query(q, [limit, offset]),
            pool_1.default.query(c)
        ]);
        return res.json({ items: items.rows, total: Number(total.rows[0].count), page: Math.floor(offset / limit) + 1, pageSize: limit });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin archive list error');
        return res.status(500).json({ error: 'Failed to list archive' });
    }
});
router.post('/:type/:id/restore', async (req, res) => {
    try {
        const type = String(req.params.type || '').toLowerCase();
        const id = String(req.params.id || '').trim();
        if (!id)
            return res.status(400).json({ error: 'id_required' });
        let table = '';
        let idCol = '';
        switch (type) {
            case 'contractors':
                table = 'contractors';
                idCol = 'contractor_id';
                break;
            case 'customers':
                table = 'customers';
                idCol = 'customer_id';
                break;
            case 'centers':
                table = 'centers';
                idCol = 'center_id';
                break;
            case 'warehouses':
                table = 'warehouses';
                idCol = 'warehouse_id';
                break;
            case 'managers':
                table = 'managers';
                idCol = 'manager_id';
                break;
            case 'crew':
                table = 'crew';
                idCol = 'crew_id';
                break;
            case 'services':
                table = 'services';
                idCol = 'service_id';
                break;
            case 'products':
                table = 'products';
                idCol = 'product_id';
                break;
            case 'supplies':
                table = 'supplies';
                idCol = 'supply_id';
                break;
            case 'procedures':
                table = 'procedures';
                idCol = 'procedure_id';
                break;
            case 'training':
                table = 'training';
                idCol = 'training_id';
                break;
            case 'reports':
                table = 'reports';
                idCol = 'report_id';
                break;
            case 'feedback':
                table = 'feedback';
                idCol = 'feedback_id';
                break;
            case 'orders':
                table = 'orders';
                idCol = 'order_id';
                break;
            default: return res.status(400).json({ error: 'invalid_type' });
        }
        if (!(await hasColumn(table, 'archived_at')))
            return res.status(400).json({ error: 'archive_not_supported' });
        const r = await pool_1.default.query(`UPDATE ${table} SET archived_at=NULL WHERE ${idCol}=$1 RETURNING ${idCol} AS id`, [id]);
        if (r.rowCount === 0)
            return res.status(404).json({ error: 'not_found' });
        return res.json({ success: true, data: r.rows[0] });
    }
    catch (e) {
        logger_1.logger.error({ error: e }, 'Admin restore error');
        return res.status(500).json({ error: 'Failed to restore record' });
    }
});
//# sourceMappingURL=routes.js.map