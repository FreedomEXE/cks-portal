/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * admin routes
 * 
 * Description: Admin hub endpoints for system-wide entity management
 * Function: Provides admin directory endpoints with search and pagination
 * Importance: Critical - Supports admin hub functionality for unified directory
 * Connects to: Database pool, admin authentication, entity management
 * 
 * Notes: Admin endpoints for crew, contractors, customers, centers lists
 *        Includes search, pagination, and entity management functionality
 */

import express, { Request, Response } from 'express';
import pool from '../../../../Database/db/pool';
import { logActivity } from '../../resources/activity';
import { sendWelcomeMessage } from '../../utils/welcomeMessages';

// Fallback lightweight logger (original '../../core/logger' module not found)
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
};

const router = express.Router();

// ============================================
// HELPERS
// ============================================

// Generic next ID generator for tables using PREFIX-### patterns
async function getNextIdGeneric(table: string, idColumn: string, prefix: string): Promise<string> {
  const result = await pool.query(
    `SELECT ${idColumn} FROM ${table} WHERE ${idColumn} LIKE $1 ORDER BY ${idColumn} DESC LIMIT 1`,
    [`${prefix}%`]
  );
  if (result.rows.length === 0) return `${prefix}001`;
  const lastId: string = result.rows[0][idColumn];
  const number = parseInt(lastId.slice(prefix.length)) + 1;
  return `${prefix}${number.toString().padStart(3, '0')}`;
}

// Create or update app_users mapping by email (when Clerk user not yet known)
async function upsertAppUserByEmail(email: string | null | undefined, role: string, code: string, name?: string) {
  if (!email) return; // mapping by email is optional
  try {
    await pool.query(
      `INSERT INTO app_users (email, role, code, name, status)
       VALUES ($1,$2,$3,$4,'active')
       ON CONFLICT (email) DO UPDATE SET role=EXCLUDED.role, code=EXCLUDED.code, name=COALESCE(EXCLUDED.name, app_users.name), updated_at=NOW()`,
      [email, role, code, name || null]
    );
  } catch (e) {
    logger.warn({ e }, 'app_users upsert by email failed');
  }
}

// Check if a table has a specific column (public schema)
async function hasColumn(table: string, column: string): Promise<boolean> {
  try {
    const r = await pool.query(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema='public' AND table_name=$1 AND column_name=$2
       ) AS exists`,
      [table, column]
    );
    return Boolean(r.rows[0]?.exists);
  } catch {
    return false;
  }
}

// GET /api/admin/crew
router.get('/crew', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    const search = String(req.query.q ?? '').trim();
    
    let whereClause = '';
    const values: any[] = [];
    
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
      pool.query(query, [...values, limit, offset]),
      pool.query(countQuery, values)
    ]);
    
    res.json({ 
      items: items.rows, 
      total: Number(total.rows[0].count),
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    });
  } catch (e: any) {
    logger.error({ error: e }, 'Admin crew list error');
    res.status(500).json({ error: 'Failed to fetch crew list' });
  }
});

// GET /api/admin/managers
router.get('/managers', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    const search = String(req.query.q ?? '').trim();

    let whereClause = 'WHERE archived_at IS NULL';
    const values: any[] = [];
    if (search) {
      values.push(`%${search}%`);
      whereClause = `WHERE archived_at IS NULL AND (manager_id || ' ' || COALESCE(manager_name,'') || ' ' || COALESCE(email,'') || ' ' || COALESCE(phone,'')) ILIKE $1`;
    }

    const query = `
      SELECT manager_id, manager_name, status, email, phone, territory
      FROM managers ${whereClause}
      ORDER BY manager_id
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    const countQuery = `SELECT COUNT(*) FROM managers ${whereClause}`;

    const [items, total] = await Promise.all([
      pool.query(query, [...values, limit, offset]),
      pool.query(countQuery, values)
    ]);

    // Return managers list as-is; no warehouse template filtering in this endpoint
    res.json({
      items: items.rows,
      total: Number(total.rows[0].count),
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    });
  } catch (e: any) {
    logger.error({ error: e }, 'Admin managers list error');
    res.status(500).json({ error: 'Failed to fetch managers list' });
  }
});

// GET /api/admin/contractors/unassigned - Get contractors without manager assignment
router.get('/contractors/unassigned', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    const search = String(req.query.q ?? '').trim();
    
    let whereClause = 'WHERE cks_manager IS NULL';
    const values: any[] = [];
    
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
      pool.query(query, [...values, limit, offset]),
      pool.query(countQuery, values)
    ]);
    
    res.json({ 
      items: items.rows, 
      total: Number(total.rows[0].count),
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    });
  } catch (e: any) {
    logger.error({ error: e }, 'Admin unassigned contractors list error');
    res.status(500).json({ error: 'Failed to fetch unassigned contractors' });
  }
});

// GET /api/admin/contractors
router.get('/contractors', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    const search = String(req.query.q ?? '').trim();
    
    let whereClause = '';
    const values: any[] = [];
    
    if (search) {
      values.push(`%${search}%`);
      whereClause = `WHERE (contractor_id || ' ' || COALESCE(company_name,'') || ' ' || COALESCE(email,'')) ILIKE $1`;
    }
    // Exclude archived if present
    if (await hasColumn('contractors','archived_at')) {
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
      pool.query(query, [...values, limit, offset]),
      pool.query(countQuery, values)
    ]);
    
    res.json({ 
      items: items.rows, 
      total: Number(total.rows[0].count),
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    });
  } catch (e: any) {
    logger.error({ error: e }, 'Admin contractors list error');
    res.status(500).json({ error: 'Failed to fetch contractors list' });
  }
});


// GET /api/admin/customers/unassigned - Customers without contractor assignment
router.get('/customers/unassigned', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    const search = String(req.query.q ?? '').trim();

    let whereClause = 'WHERE contractor_id IS NULL';
    const values = [] as any[];
    if (search) {
      values.push(`%${search}%`);
      whereClause += ` AND (customer_id || ' ' || COALESCE(company_name,'') || ' ' || COALESCE(email,'')) ILIKE $${values.length}`;
    }
    if (await hasColumn('customers', 'archived_at')) whereClause += ' AND archived_at IS NULL';

    const query = `
      SELECT customer_id, contractor_id, company_name, COALESCE(contact_person, main_contact) AS main_contact, email, phone
      FROM customers ${whereClause}
      ORDER BY customer_id
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    const countQuery = `SELECT COUNT(*) FROM customers ${whereClause}`;
    const [items, total] = await Promise.all([
      pool.query(query, [...values, limit, offset]),
      pool.query(countQuery, values)
    ]);
    res.json({ items: items.rows, total: Number(total.rows[0].count), page: Math.floor(offset/limit)+1, pageSize: limit });
  } catch (e:any) {
    logger.error({ error: e }, 'Admin unassigned customers list error');
    res.status(500).json({ error: 'Failed to fetch unassigned customers' });
  }
});
// GET /api/admin/customers
router.get('/customers', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    const search = String(req.query.q ?? '').trim();
    
    let whereClause = '';
    const values: any[] = [];
    
    if (search) {
      values.push(`%${search}%`);
      whereClause = `WHERE (customer_id || ' ' || COALESCE(company_name,'') || ' ' || COALESCE(email,'')) ILIKE $1`;
    }
    if (await hasColumn('customers','archived_at')) {
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
      pool.query(query, [...values, limit, offset]),
      pool.query(countQuery, values)
    ]);
    
    res.json({ 
      items: items.rows, 
      total: Number(total.rows[0].count),
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    });
  } catch (e: any) {
    logger.error({ error: e }, 'Admin customers list error');
    res.status(500).json({ error: 'Failed to fetch customers list' });
  }
});


// GET /api/admin/centers/unassigned - Centers without customer or contractor assignment
router.get('/centers/unassigned', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    const search = String(req.query.q ?? '').trim();

    let whereClause = 'WHERE (customer_id IS NULL OR contractor_id IS NULL)';
    const values: any[] = [];
    if (search) {
      values.push(`%${search}%`);
      whereClause += ` AND (center_id || ' ' || COALESCE(center_name,'')) ILIKE $${values.length}`;
    }
    if (await hasColumn('centers', 'archived_at')) whereClause += ' AND archived_at IS NULL';

    const query = `
      SELECT center_id, center_name AS name, customer_id, contractor_id, address
      FROM centers ${whereClause}
      ORDER BY center_id
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    const countQuery = `SELECT COUNT(*) FROM centers ${whereClause}`;
    const [items, total] = await Promise.all([
      pool.query(query, [...values, limit, offset]),
      pool.query(countQuery, values)
    ]);
    res.json({ items: items.rows, total: Number(total.rows[0].count), page: Math.floor(offset/limit)+1, pageSize: limit });
  } catch (e:any) {
    logger.error({ error: e }, 'Admin unassigned centers list error');
    res.status(500).json({ error: 'Failed to fetch unassigned centers' });
  }
});
// GET /api/admin/centers
router.get('/centers', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    const search = String(req.query.q ?? '').trim();
    
    let whereClause = '';
    const values: any[] = [];
    
    if (search) {
      values.push(`%${search}%`);
      whereClause = `WHERE (center_id || ' ' || COALESCE(name,'') || ' ' || COALESCE(email,'')) ILIKE $1`;
    }
    if (await hasColumn('centers','archived_at')) {
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
      pool.query(query, [...values, limit, offset]),
      pool.query(countQuery, values)
    ]);
    
    res.json({ 
      items: items.rows, 
      total: Number(total.rows[0].count),
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    });
  } catch (e: any) {
    logger.error({ error: e }, 'Admin centers list error');
    res.status(500).json({ error: 'Failed to fetch centers list' });
  }
});

// GET /api/admin/products
router.get('/products', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    const search = String(req.query.q ?? '').trim();

    let whereClause = '';
    const values: any[] = [];
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
      pool.query(query, [...values, limit, offset]),
      pool.query(countQuery, values)
    ]);

    res.json({ items: items.rows, total: Number(total.rows[0].count), page: Math.floor(offset / limit) + 1, pageSize: limit });
  } catch (e: any) {
    logger.error({ error: e }, 'Admin products list error');
    res.status(500).json({ error: 'Failed to fetch products list' });
  }
});

// GET /api/admin/supplies
router.get('/supplies', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    const search = String(req.query.q ?? '').trim();

    let whereClause = '';
    const values: any[] = [];
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
      pool.query(query, [...values, limit, offset]),
      pool.query(countQuery, values)
    ]);

    res.json({ items: items.rows, total: Number(total.rows[0].count), page: Math.floor(offset / limit) + 1, pageSize: limit });
  } catch (e: any) {
    logger.error({ error: e }, 'Admin supplies list error');
    res.status(500).json({ error: 'Failed to fetch supplies list' });
  }
});

// GET /api/admin/procedures
router.get('/procedures', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    const search = String(req.query.q ?? '').trim();

    let whereClause = '';
    const values: any[] = [];
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
      pool.query(query, [...values, limit, offset]),
      pool.query(countQuery, values)
    ]);

    res.json({ items: items.rows, total: Number(total.rows[0].count), page: Math.floor(offset / limit) + 1, pageSize: limit });
  } catch (e: any) {
    logger.error({ error: e }, 'Admin procedures list error');
    res.status(500).json({ error: 'Failed to fetch procedures list' });
  }
});

// GET /api/admin/training
router.get('/training', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    const search = String(req.query.q ?? '').trim();

    let whereClause = '';
    const values: any[] = [];
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
      pool.query(query, [...values, limit, offset]),
      pool.query(countQuery, values)
    ]);

    res.json({ items: items.rows, total: Number(total.rows[0].count), page: Math.floor(offset / limit) + 1, pageSize: limit });
  } catch (e: any) {
    logger.error({ error: e }, 'Admin training list error');
    res.status(500).json({ error: 'Failed to fetch training list' });
  }
});

// ============================================
// CREATE PROCEDURE/TRAINING (Admin)
// ============================================

// POST /api/admin/procedures - create procedure
router.post('/procedures', async (req, res) => {
  try {
    const { procedure_name, center_id, description, steps, required_skills, estimated_duration, status } = req.body;
    if (!procedure_name) return res.status(400).json({ error: 'procedure_name is required' });
    if (!center_id) return res.status(400).json({ error: 'center_id is required' });
    const r = await pool.query(
      `INSERT INTO procedures(procedure_id, center_id, procedure_name, description, steps, required_skills, estimated_duration, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING procedure_id, procedure_name, center_id, status`,
      [
        await getNextIdGeneric('procedures', 'procedure_id', 'PRC-'),
        center_id,
        procedure_name,
        description || null,
        Array.isArray(steps) ? steps : (steps ? String(steps).split(',').map((s:string)=>s.trim()) : null),
        Array.isArray(required_skills) ? required_skills : (required_skills ? String(required_skills).split(',').map((s:string)=>s.trim()) : null),
        estimated_duration || null,
        status || 'active'
      ]
    );
    return res.status(201).json({ success: true, data: r.rows[0] });
  } catch (e:any) {
    logger.error({ error: e }, 'Admin create procedure error');
    res.status(500).json({ error: 'Failed to create procedure' });
  }
});

// ============================================
// CREATE USERS AND WAREHOUSES (Admin)
// ============================================

// POST /api/admin/users
// Body: { role: manager|contractor|customer|center|crew, ...fields }
router.post('/users', async (req: Request, res: Response) => {
  try {
    const { role } = req.body || {};
    if (!role || !['manager','contractor','customer','center','crew'].includes(String(role))) {
      return res.status(400).json({ error: 'Invalid or missing role' });
    }

    if (role === 'manager') {
      const name = String(req.body.manager_name || req.body.name || '').trim();
      if (!name) return res.status(400).json({ error: 'manager_name is required' });
      const manager_id = await getNextIdGeneric('managers', 'manager_id', 'MGR-');
      const r = await pool.query(
        `INSERT INTO managers(manager_id, manager_name, email, phone, territory, status)
         VALUES ($1,$2,$3,$4,$5,'active') RETURNING manager_id, manager_name, email, phone, territory, status`,
        [manager_id, name, req.body.email || null, req.body.phone || null, req.body.territory || null]
      );
      await upsertAppUserByEmail(req.body.email, 'manager', manager_id, name);
      try {
        const actor = String(req.headers['x-admin-user-id']||'admin');
        await logActivity('user_created', `New Manager Created: ${manager_id} (${name}) — Welcome Message Sent`, actor, 'admin', manager_id, 'manager', { email: req.body.email||null });
        // Explicit manager-targeted welcome entry for manager hub visibility
        await logActivity('welcome_message', `Welcome to your CKS Portal account, ${name}! Your user ID is ${manager_id}.`, actor, 'admin', manager_id, 'manager', { is_welcome: true, show_tutorial: true, user_name: name });
      } catch {}
      try { await sendWelcomeMessage({ userId: manager_id, userName: name, userRole: 'manager', email: req.body.email || undefined }, String(req.headers['x-admin-user-id']||'admin')); } catch {}
      return res.status(201).json({ success: true, data: { ...r.rows[0] } });
    }

    if (role === 'contractor') {
      const company = String(req.body.company_name || '').trim();
      if (!company) return res.status(400).json({ error: 'company_name is required' });
      const contractor_id = await getNextIdGeneric('contractors', 'contractor_id', 'CON-');
      // Dynamically include optional columns if they exist in the target DB
      const cols: string[] = ['contractor_id', 'cks_manager', 'company_name'];
      const vals: any[] = [contractor_id, req.body.cks_manager || null, company];
      const optional: Array<[key: string, value: any]> = [
        // Accept UI field name 'main_contact' while storing in contact_person column
        ['contact_person', (req.body.main_contact ?? req.body.contact_person) || null],
        ['email', req.body.email || null],
        ['phone', req.body.phone || null],
        ['address', req.body.address || null],
        ['website', req.body.website || null],
        ['business_type', req.body.business_type || null],
      ];
      for (const [key, value] of optional) {
        // email/phone are very likely present; contact_person/address/website/business_type may be missing on older DBs
        // Include only columns that actually exist
        // eslint-disable-next-line no-await-in-loop
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
      const r = await pool.query(insertSql, vals);
      // If status column doesn't exist, synthesize active status for response consistency
      const data = hasStatusCol ? r.rows[0] : { ...r.rows[0], status: 'active' };
      await upsertAppUserByEmail(req.body.email, 'contractor', contractor_id, company);
      try {
        const actor = String(req.headers['x-admin-user-id']||'admin');
        await logActivity('user_created', `New Contractor Created: ${contractor_id} (${company}) — Welcome Message Sent`, actor, 'admin', contractor_id, 'contractor', { email: req.body.email||null });
        // Explicit contractor-targeted welcome entry for contractor hub visibility
        await logActivity('welcome_message', `Welcome to your CKS Portal account, ${company}! Your user ID is ${contractor_id}.`, actor, 'admin', contractor_id, 'contractor', { is_welcome: true, show_tutorial: true, user_name: company });
      } catch {}
      try { await sendWelcomeMessage({ userId: contractor_id, userName: company, userRole: 'contractor', email: req.body.email || undefined }, String(req.headers['x-admin-user-id']||'admin')); } catch {}
      return res.status(201).json({ success: true, data });
    }

    if (role === 'customer') {
      const company = String(req.body.company_name || '').trim();
      const cks_manager = String(req.body.cks_manager || '').trim();
      if (!company) return res.status(400).json({ error: 'company_name is required' });
      if (!cks_manager) return res.status(400).json({ error: 'cks_manager is required' });
      const customer_id = await getNextIdGeneric('customers', 'customer_id', 'CUS-');
      const r = await pool.query(
        `INSERT INTO customers(customer_id, cks_manager, company_name, contact_person, email, phone, service_tier, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'active')
         RETURNING customer_id, cks_manager, company_name, contact_person, email, phone, service_tier, status`,
        [
          customer_id,
          cks_manager,
          company,
          (req.body.main_contact ?? req.body.contact_person) || null,
          req.body.email || null,
          req.body.phone || null,
          req.body.service_tier || null
        ]
      );
      await upsertAppUserByEmail(req.body.email, 'customer', customer_id, company);
      try {
        const actor = String(req.headers['x-admin-user-id']||'admin');
        await logActivity('user_created', `New Customer Created: ${customer_id} (${company}) — Welcome Message Sent`, actor, 'admin', customer_id, 'customer', { email: req.body.email||null });
        // Explicit customer-targeted welcome entry for customer hub visibility
        await logActivity('welcome_message', `Welcome to your CKS Portal account, ${company}! Your user ID is ${customer_id}.`, actor, 'admin', customer_id, 'customer', { is_welcome: true, show_tutorial: true, user_name: company });
      } catch {}
      try { await sendWelcomeMessage({ userId: customer_id, userName: company, userRole: 'customer', email: req.body.email || undefined }, String(req.headers['x-admin-user-id']||'admin')); } catch {}
      return res.status(201).json({ success: true, data: { ...r.rows[0] } });
    }

    if (role === 'center') {
      const center_name = String(req.body.center_name || '').trim();
      const customer_id = String(req.body.customer_id || '').trim();
      const contractor_id = String(req.body.contractor_id || '').trim();
      const cks_manager = String(req.body.cks_manager || '').trim();
      if (!center_name) return res.status(400).json({ error: 'center_name is required' });
      if (!customer_id) return res.status(400).json({ error: 'customer_id is required' });
      if (!contractor_id) return res.status(400).json({ error: 'contractor_id is required' });
      if (!cks_manager) return res.status(400).json({ error: 'cks_manager is required' });
      const center_id = await getNextIdGeneric('centers', 'center_id', 'CEN-');
      const r = await pool.query(
        `INSERT INTO centers(center_id, cks_manager, center_name, customer_id, contractor_id, address, operational_hours, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'active')
         RETURNING center_id, cks_manager, center_name, customer_id, contractor_id, address, operational_hours, status`,
        [
          center_id,
          cks_manager,
          center_name,
          customer_id,
          contractor_id,
          req.body.address || null,
          req.body.operational_hours || null
        ]
      );
      await upsertAppUserByEmail(req.body.email, 'center', center_id, center_name);
      try {
        const actor = String(req.headers['x-admin-user-id']||'admin');
        await logActivity('user_created', `New Center Created: ${center_id} (${center_name}) — Welcome Message Sent`, actor, 'admin', center_id, 'center', {});
        // Explicit center-targeted welcome entry for center hub visibility
        await logActivity('welcome_message', `Welcome to your CKS Portal account, ${center_name}! Your user ID is ${center_id}.`, actor, 'admin', center_id, 'center', { is_welcome: true, show_tutorial: true, user_name: center_name });
      } catch {}
      try { await sendWelcomeMessage({ userId: center_id, userName: center_name, userRole: 'center', email: req.body.email || undefined }, String(req.headers['x-admin-user-id']||'admin')); } catch {}
      return res.status(201).json({ success: true, data: { ...r.rows[0] } });
    }

    if (role === 'crew') {
      const crew_name = String(req.body.crew_name || req.body.name || '').trim();
      const crew_id = await getNextIdGeneric('crew', 'crew_id', 'CRW-');
      const r = await pool.query(
        `INSERT INTO crew(crew_id, cks_manager, assigned_center, crew_name, skills, certification_level, status, profile)
         VALUES ($1,$2,$3,$4,$5,$6,'active',$7)
         RETURNING crew_id, cks_manager, assigned_center, crew_name, skills, certification_level, status`,
        [
          crew_id,
          req.body.cks_manager || null,
          req.body.assigned_center || null,
          crew_name || null,
          Array.isArray(req.body.skills) ? req.body.skills : (req.body.skills ? String(req.body.skills).split(',').map((s:string)=>s.trim()) : null),
          req.body.certification_level || null,
          req.body.profile || null
        ]
      );
      await upsertAppUserByEmail(req.body.email, 'crew', crew_id, crew_name);
      try {
        const actor = String(req.headers['x-admin-user-id']||'admin');
        await logActivity('user_created', `New Crew Created: ${crew_id} (${crew_name}) — Welcome Message Sent`, actor, 'admin', crew_id, 'crew', {});
        // Explicit crew-targeted welcome entry for crew hub visibility
        await logActivity('welcome_message', `Welcome to your CKS Portal account, ${crew_name}! Your user ID is ${crew_id}.`, actor, 'admin', crew_id, 'crew', { is_welcome: true, show_tutorial: true, user_name: crew_name });
      } catch {}
      try { await sendWelcomeMessage({ userId: crew_id, userName: crew_name, userRole: 'crew', email: req.body.email || undefined }, String(req.headers['x-admin-user-id']||'admin')); } catch {}
      return res.status(201).json({ success: true, data: { ...r.rows[0] } });
    }

    return res.status(400).json({ error: 'Unsupported role' });
  } catch (e: any) {
    const msg = e?.message || String(e);
    logger.error({ error: e }, 'Admin create user error');
    res.status(500).json({ error: 'Failed to create user', details: msg });
  }
});

// (Removed duplicate simple POST /warehouses; using the more complete one below)

// POST /api/admin/auth/invite - stubbed in dev if Clerk is not configured
router.post('/auth/invite', async (_req: Request, res: Response) => {
  try {
    // For MVP dev/testing, we do not integrate Clerk server-side invites here
    return res.status(501).json({ error: 'clerk_not_configured' });
  } catch (e:any) {
    return res.status(500).json({ error: 'invite_failed' });
  }
});

// POST /api/admin/training - create training
router.post('/training', async (req, res) => {
  try {
    const { training_name, service_id, description, duration_hours, certification_level, requirements, status } = req.body;
    if (!training_name) return res.status(400).json({ error: 'training_name is required' });
    if (!service_id) return res.status(400).json({ error: 'service_id is required' });
    const r = await pool.query(
      `INSERT INTO training(training_id, service_id, training_name, description, duration_hours, certification_level, requirements, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING training_id, training_name, service_id, status`,
      [
        await getNextIdGeneric('training', 'training_id', 'TRN-'),
        service_id,
        training_name,
        description || null,
        duration_hours || null,
        certification_level || null,
        Array.isArray(requirements) ? requirements : (requirements ? String(requirements).split(',').map((s:string)=>s.trim()) : null),
        status || 'active'
      ]
    );
    return res.status(201).json({ success: true, data: r.rows[0] });
  } catch (e:any) {
    logger.error({ error: e }, 'Admin create training error');
    res.status(500).json({ error: 'Failed to create training' });
  }

// DELETE /api/admin/training/:id - archive or delete training
router.delete('/training/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'training_id required' });
    if (await hasColumn('training','archived_at')) {
      const r = await pool.query(`UPDATE training SET archived_at=NOW() WHERE training_id=$1 RETURNING training_id`, [id]);
      if (r.rowCount === 0) return res.status(404).json({ error: 'not_found' });
      return res.json({ success: true, message: 'Training archived' });
    } else {
      const r = await pool.query(`DELETE FROM training WHERE training_id=$1 RETURNING training_id`, [id]);
      if (r.rowCount === 0) return res.status(404).json({ error: 'not_found' });
      return res.json({ success: true, message: 'Training deleted' });
    }
  } catch (e:any) {
    logger.error({ error: e }, 'Admin delete training error');
    res.status(500).json({ error: 'Failed to delete training' });
  }
});
});

// GET /api/admin/warehouses
router.get('/warehouses', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    const search = String(req.query.q ?? '').trim();

    let whereClause = '';
    const values: any[] = [];
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
      pool.query(query, [...values, limit, offset]),
      pool.query(countQuery, values)
    ]);

    res.json({
      items: items.rows,
      total: Number(total.rows[0].count),
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    });
  } catch (e: any) {
    logger.error({ error: e }, 'Admin warehouses list error');
    res.status(500).json({ error: 'Failed to fetch warehouses list' });
  }
});

// POST /api/admin/warehouses - create new warehouse and bootstrap inventory
router.post('/warehouses', async (req, res) => {
  try {
    const { warehouse_name, address, manager_id, warehouse_type, phone, email, date_acquired, capacity, status } = req.body || {};
    if (!warehouse_name) return res.status(400).json({ error: 'warehouse_name is required' });

    const id = await getNextIdGeneric('warehouses', 'warehouse_id', 'WH-');

    await pool.query('BEGIN');
    const inserted = await pool.query(
      `INSERT INTO warehouses(warehouse_id, warehouse_name, address, manager_id, warehouse_type, phone, email, date_acquired, capacity, current_utilization, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING warehouse_id, warehouse_name, address, manager_id, warehouse_type, phone, email, date_acquired, capacity, current_utilization, status`,
      [id, warehouse_name, address || null, manager_id || null, warehouse_type || null, phone || null, email || null, date_acquired ? new Date(date_acquired) : null, capacity || null, 0, status || 'active']
    );

    // Bootstrap inventory from existing products and supplies (zeroed). Optional in case tables are empty.
    // Products
    try {
      await pool.query(
        `INSERT INTO inventory_items (warehouse_id, item_id, item_type, sku, item_name, category, quantity_on_hand, min_stock_level, unit_cost, location_code)
         SELECT $1, p.product_id, 'product', p.product_id, p.product_name, p.category, 0, 0, p.price, NULL
         FROM products p
         WHERE p.status = 'active'
         ON CONFLICT (warehouse_id, item_id) DO NOTHING`,
        [id]
      );
    } catch {}

    // Supplies
    try {
      await pool.query(
        `INSERT INTO inventory_items (warehouse_id, item_id, item_type, sku, item_name, category, quantity_on_hand, min_stock_level, unit_cost, location_code)
         SELECT $1, s.supply_id, 'supply', s.supply_id, s.supply_name, s.category, 0, 0, s.unit_cost, NULL
         FROM supplies s
         WHERE s.status = 'active'
         ON CONFLICT (warehouse_id, item_id) DO NOTHING`,
        [id]
      );
    } catch {}

    // Activity log
    await pool.query(
      `INSERT INTO warehouse_activity_log(warehouse_id, activity_type, description)
       VALUES ($1,'stock_adjustment','Warehouse created and inventory bootstrapped')`,
      [id]
    );

    // Map warehouse login if an email was provided
    try { await upsertAppUserByEmail(email, 'warehouse', id, warehouse_name); } catch {}
    
    // Add personalized welcome message for warehouse
    try {
      const actor = String(req.headers['x-admin-user-id']||'admin');
      await logActivity('welcome_message', `Welcome to your CKS Portal account, ${warehouse_name}! Your user ID is ${id}.`, actor, 'admin', id, 'warehouse', { is_welcome: true, show_tutorial: true, user_name: warehouse_name });
    } catch {}
    
    await pool.query('COMMIT');
    return res.status(201).json({ success: true, data: inserted.rows[0] });
  } catch (e:any) {
    await pool.query('ROLLBACK').catch(()=>{});
    logger.error({ error: e }, 'Admin create warehouse error');
    return res.status(500).json({ error: 'Failed to create warehouse' });
  }
});

// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    const search = String(req.query.q ?? '').trim();

    let whereClause = '';
    const values: any[] = [];
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
      pool.query(query, [...values, limit, offset]),
      pool.query(countQuery, values)
    ]);

    res.json({
      items: items.rows,
      total: Number(total.rows[0].count),
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    });
  } catch (e: any) {
    logger.error({ error: e }, 'Admin orders list error');
    res.status(500).json({ error: 'Failed to fetch orders list' });
  }
});

// ============================================
// CATALOG MANAGEMENT ENDPOINTS
// ============================================

// (deprecated local helper replaced by getNextIdGeneric)

// GET /api/admin/catalog/debug - Debug catalog tables
router.get('/catalog/debug', async (req, res) => {
  try {
    // Check what tables exist
    const tables = await pool.query(`
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
      servicesInfo = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'services' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
    }
    
    if (hasProducts) {
      productsInfo = await pool.query(`
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
  } catch (e: any) {
    logger.error({ error: e }, 'Admin catalog debug error');
    res.status(500).json({ error: 'Failed to debug catalog tables', details: e.message });
  }
});

// GET /api/admin/catalog/items - Admin catalog view (services only, aligned with schema)
router.get('/catalog/items', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '50'), 10), 200);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    const search = String(req.query.q ?? '').trim();
    
    let whereClause = '';
    const values: any[] = [];
    
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
      pool.query(query, values),
      pool.query(countQuery, values.slice(0, -2))
    ]);
    // Filter out template/demo services (placeholder names or IDs ending in -000)
    const filtered = (items.rows || []).filter((r: any) => {
      const id = String(r.id || '');
      const name = String(r.name || '');
      if (/template/i.test(name)) return false;
      if (/(^|-)000$/i.test(id)) return false;
      return true;
    });

    res.json({
      items: filtered,
      total: filtered.length,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    });
  } catch (e: any) {
    logger.error({ error: e }, 'Admin catalog items error');
    res.status(500).json({ error: 'Failed to fetch catalog items' });
  }
});

// POST /api/admin/catalog/items - Create new service (aligned with schema)
router.post('/catalog/items', async (req, res) => {
  try {
    const { name, category, description, pricing_model, requirements, status } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Service name is required' });
    }
    
    const serviceId = await getNextIdGeneric('services', 'service_id', 'SRV-');
    
    const result = await pool.query(`
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
  } catch (e: any) {
    logger.error({ error: e }, 'Admin catalog create error');
    res.status(500).json({ error: 'Failed to create catalog item' });
  }
});

// PUT /api/admin/catalog/items/:id - Update service (aligned with schema)
router.put('/catalog/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description, pricing_model, requirements, status } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Service name is required' });
    }
    
    const result = await pool.query(`
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
  } catch (e: any) {
    logger.error({ error: e }, 'Admin catalog update error');
    res.status(500).json({ error: 'Failed to update catalog item' });
  }
});

// DELETE /api/admin/catalog/items/:id - Delete service (hard delete since no status field)
router.delete('/catalog/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Soft-delete if archived_at exists, else hard delete
    const has = await hasColumn('services','archived_at');
    if (has) {
      const r = await pool.query(`UPDATE services SET archived_at=NOW() WHERE service_id=$1 RETURNING service_id as id`, [id]);
      if (r.rowCount === 0) return res.status(404).json({ error: 'Service not found' });
      return res.json({ success: true, message: 'Service archived' });
    } else {
      const result = await pool.query(`DELETE FROM services WHERE service_id=$1 RETURNING service_id as id`, [id]);
      if (result.rowCount === 0) return res.status(404).json({ error: 'Service not found' });
      return res.json({ success: true, message: 'Service deleted' });
    }
  } catch (e: any) {
    logger.error({ error: e }, 'Admin catalog delete error');
    res.status(500).json({ error: 'Failed to delete catalog item' });
  }
});

// ============================================
// USER CREATION (ALL ROLES)
// ============================================

/*
  POST /api/admin/users
  Body: { role: 'manager'|'contractor'|'customer'|'center'|'crew', ...fields }
*/
// REMOVED: Duplicate /users route that was causing triple activity entries
// The original /users route above (line ~583) handles all user creation with proper activity logging

// Lightweight schema introspection for troubleshooting (dev only)
router.get('/schema/contractors', async (_req, res) => {
  try {
    const rows = (await pool.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'contractors'
       ORDER BY ordinal_position`
    )).rows;
    res.json({ success: true, data: rows });
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'Schema introspection failed', details: process.env.NODE_ENV !== 'production' ? e?.message : undefined });
  }
});

// ============================================
// DELETE ENTITIES (MVP convenience)
// ============================================

// Removed duplicate - using the more complete version below

router.delete('/customers/:id', async (req, res) => {
  const id = String(req.params.id);
  try {
    const r = await pool.query('DELETE FROM customers WHERE customer_id = $1 RETURNING customer_id', [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ success: true, data: { customer_id: id } });
  } catch (e: any) {
    if (e?.code === '23503') return res.status(409).json({ error: 'in_use' });
    logger.error({ error: e }, 'Admin delete customer error');
    return res.status(500).json({ error: 'Delete failed' });
  }
});

router.delete('/centers/:id', async (req, res) => {
  const id = String(req.params.id);
  try {
    const r = await pool.query('DELETE FROM centers WHERE center_id = $1 RETURNING center_id', [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ success: true, data: { center_id: id } });
  } catch (e: any) {
    if (e?.code === '23503') return res.status(409).json({ error: 'in_use' });
    logger.error({ error: e }, 'Admin delete center error');
    return res.status(500).json({ error: 'Delete failed' });
  }
});

router.delete('/crew/:id', async (req, res) => {
  const id = String(req.params.id);
  try {
    const r = await pool.query('DELETE FROM crew WHERE crew_id = $1 RETURNING crew_id', [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ success: true, data: { crew_id: id } });
  } catch (e: any) {
    if (e?.code === '23503') return res.status(409).json({ error: 'in_use' });
    logger.error({ error: e }, 'Admin delete crew error');
    return res.status(500).json({ error: 'Delete failed' });
  }
});

router.delete('/warehouses/:id', async (req, res) => {
  const id = String(req.params.id);
  try {
    const r = await pool.query('DELETE FROM warehouses WHERE warehouse_id = $1 RETURNING warehouse_id', [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ success: true, data: { warehouse_id: id } });
  } catch (e: any) {
    if (e?.code === '23503') return res.status(409).json({ error: 'in_use' });
    logger.error({ error: e }, 'Admin delete warehouse error');
    return res.status(500).json({ error: 'Delete failed' });
  }
});

router.delete('/managers/:id', async (req, res) => {
  const id = String(req.params.id);
  try {
    // Get manager info before archiving
    const existing = await pool.query('SELECT manager_id, manager_name FROM managers WHERE manager_id = $1', [id]);
    if (existing.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    const managerName = existing.rows[0].manager_name;
    
    await pool.query('BEGIN');
    try {
      // Find affected contractors BEFORE deletion
      const affectedContractors = await pool.query(
        'SELECT contractor_id, company_name FROM contractors WHERE cks_manager = $1',
        [id]
      );
      
      // Unassign contractors
      await pool.query('UPDATE contractors SET cks_manager = NULL WHERE cks_manager = $1', [id]);
      
      // Soft delete (archive) the manager (use archived_at; no boolean column required)
      const r = await pool.query('UPDATE managers SET archived_at = NOW() WHERE manager_id = $1 RETURNING manager_id', [id]);
      if (r.rowCount === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({ error: 'Not found' });
      }
      
      await pool.query('COMMIT');
      
      // Log the deletion activity
      try { 
        await logActivity('manager_deleted', `Manager ${id} (${managerName}) archived`, 'freedom_exe', 'admin', id, 'manager', { name: managerName }); 
      } catch (error) {
        console.error('Failed to log manager deletion:', error);
      }
      
      // Log contractor unassignments
      for (const contractor of affectedContractors.rows) {
        try {
          await logActivity('contractor_unassigned', `Contractor ${contractor.contractor_id} unassigned due to Manager ${id} deletion`, 'freedom_exe', 'admin', contractor.contractor_id, 'contractor', { manager_id: id, manager_name: managerName });
        } catch (error) {
          console.error('Failed to log contractor unassignment:', error);
        }
      }
      
      // Delete all activity history for this manager (after logging above)
      try { 
        await pool.query('DELETE FROM system_activity WHERE target_id = $1 OR actor_id = $1', [id]); 
      } catch {}
      
      return res.json({ success: true, data: { manager_id: id }, message: `Manager ${id} archived` });
    } catch (transactionError) {
      await pool.query('ROLLBACK');
      throw transactionError;
    }
  } catch (e: any) {
    if (e?.code === '23503') return res.status(409).json({ error: 'in_use' });
    logger.error({ error: e }, 'Admin delete manager error');
    return res.status(500).json({ error: 'Delete failed' });
  }
});

// ============================================
// AUTH/INVITES (Clerk integration - optional)
// ============================================

/*
  POST /api/admin/auth/invite
  Body: { role: 'manager'|'contractor'|'customer'|'center'|'crew'|'warehouse', code: 'MGR-001'|'CON-001'|..., email: string }
  Behavior: Creates a Clerk user (if Clerk SDK available) and sends an invite email for first sign-in.
  Notes: This endpoint is a no-op if CLERK_SECRET_KEY is not configured or the SDK is not installed.
*/
router.post('/auth/invite', async (req: Request, res: Response) => {
  const { role: rawRole, code, email } = req.body || {};
  const role = String(rawRole || '').toLowerCase();
  if (!email || !code || !role) {
    return res.status(400).json({ error: 'role, code, and email are required' });
  }
  // Map role to metadata key for internal linkage
  const metaKey = role === 'manager' ? 'manager_id'
                : role === 'contractor' ? 'contractor_id'
                : role === 'customer' ? 'customer_id'
                : role === 'center' ? 'center_id'
                : role === 'crew' ? 'crew_id'
                : role === 'warehouse' ? 'warehouse_id'
                : undefined;
  if (!metaKey) return res.status(400).json({ error: 'unsupported_role' });

  const secret = process.env.CLERK_SECRET_KEY;
  let clerk: any = null;
  try { clerk = require('@clerk/clerk-sdk-node'); } catch {}
  if (!secret || !clerk) {
    return res.status(501).json({ error: 'clerk_not_configured', details: 'Set CLERK_SECRET_KEY and install @clerk/clerk-sdk-node' });
  }

  try {
    // Initialize Clerk client
    const { createClerkClient } = clerk;
    const client = createClerkClient({ secretKey: secret });

    const username = String(code).toLowerCase();
    const publicMetadata: any = { role, [metaKey]: code };

    // Create user and send invitation (production only)
    // In development, add a default password for testing
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    const userParams: any = {
      emailAddress: [email],
      username,
      publicMetadata
    };
    
    if (isDevelopment) {
      userParams.password = 'test123'; // Default password for development testing
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
  } catch (e: any) {
    logger.error({ error: e?.message }, 'Clerk invite failed');
    return res.status(500).json({ error: 'clerk_invite_failed', details: e?.message });
  }
});

// Assign contractor to manager
router.post('/contractors/:id/assign-manager', async (req: Request, res: Response) => {
  const contractorId = String(req.params.id || '').trim();
  const managerId = String(req.body?.manager_id || '').trim();
  if (!contractorId) return res.status(400).json({ error: 'contractor_id required' });
  if (!managerId) return res.status(400).json({ error: 'manager_id required' });
  try {
    // Ensure manager exists and load names for personalized messages
    const mgr = await pool.query('SELECT manager_id, manager_name FROM managers WHERE UPPER(manager_id) = UPPER($1) LIMIT 1', [managerId]);
    if (mgr.rowCount === 0) return res.status(404).json({ error: 'manager_not_found' });
    const managerName = String(mgr.rows[0].manager_name || managerId);

    const ctr = await pool.query('SELECT contractor_id, company_name FROM contractors WHERE UPPER(contractor_id) = UPPER($1) LIMIT 1', [contractorId]);
    if (ctr.rowCount === 0) return res.status(404).json({ error: 'contractor_not_found' });
    const contractorName = String(ctr.rows[0].company_name || contractorId);

    const r = await pool.query(
      `UPDATE contractors 
       SET cks_manager = $2
       WHERE UPPER(contractor_id) = UPPER($1)
       RETURNING contractor_id, cks_manager`,
      [contractorId, managerId]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'contractor_not_found' });

    // Log activities for all affected parties (admin, manager, contractor)
    const actorId = String(req.headers['x-admin-user-id'] || 'freedom_exe');
    try {
      // Admin-facing audit entry (concise)
      await logActivity(
        'assignment_made',
        `Assigned ${contractorId} to ${managerId}`,
        actorId,
        'admin',
        actorId,
        'admin',
        { contractor_id: contractorId, contractor_name: contractorName, manager_id: managerId, manager_name: managerName }
      );

      // Manager personalized message
      await logActivity(
        'contractor_assigned',
        `You have been assigned a new contractor: ${contractorName} (${contractorId}). Click here to view their profile.`,
        actorId,
        'admin',
        managerId,
        'manager',
        { contractor_id: contractorId, contractor_name: contractorName, action_link: `/${contractorId}/hub` }
      );

      // Contractor personalized message
      await logActivity(
        'manager_assigned',
        `You have been assigned to manager ${managerName} (${managerId}). They will be your primary point of contact.`,
        actorId,
        'admin',
        contractorId,
        'contractor',
        { manager_id: managerId, manager_name: managerName }
      );
    } catch (error) {
      console.error('Failed to log contractor assignment (personalized):', error);
    }
    return res.json({ success: true, data: r.rows[0] });
  } catch (e: any) {
    logger.error({ error: e, contractorId, managerId }, 'Assign contractor->manager failed');
    const payload: any = { error: 'assign_failed' };
    if (process.env.NODE_ENV !== 'production') {
      payload.details = e?.detail || e?.message || String(e);
      if (e?.code) payload.code = e.code;
    }
    if (e?.code === '23503') return res.status(409).json(payload);
    return res.status(500).json(payload);
  }
});

// GET /api/admin/crew/unassigned - Get crew members without center assignment
router.get('/crew/unassigned', async (req, res) => {
  try {
    // First check if crew_requirements table exists, otherwise use simplified query
    let query;
    try {
      // Test if crew_requirements exists
      await pool.query('SELECT 1 FROM crew_requirements LIMIT 1');
      
      // Full query with requirements if table exists
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
    } catch {
      // Fallback query without requirements table
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
    
    const result = await pool.query(query);
    const crews = result.rows.map(row => ({
      ...row,
      readiness_score: row.total_requirements > 0 ? Math.round((row.completed_requirements / row.total_requirements) * 100) : 100,
      is_ready: row.total_requirements === 0 || row.completed_requirements >= row.total_requirements
    }));
    
    res.json({ items: crews });
  } catch (e: any) {
    logger.error({ error: e }, 'Admin unassigned crew error');
    res.status(500).json({ error: 'Failed to fetch unassigned crew' });
  }
});

// GET /api/admin/crew/:crew_id/requirements - Get requirements for specific crew member
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
    
    const result = await pool.query(query, [crew_id]);
    res.json({ items: result.rows });
  } catch (e: any) {
    logger.error({ error: e }, 'Admin crew requirements error');
    res.status(500).json({ error: 'Failed to fetch crew requirements' });
  }
});

// POST /api/admin/crew/:crew_id/assign-center - Assign crew to center with readiness check
router.post('/crew/:crew_id/assign-center', async (req, res) => {
  try {
    const { crew_id } = req.params;
    const { center_id, force_assign } = req.body;
    
    if (!center_id) {
      return res.status(400).json({ error: 'center_id is required' });
    }
    
    // Check readiness unless force_assign is true
    if (!force_assign) {
      const reqCheck = await pool.query(`
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
    
    // Assign crew to center
    const result = await pool.query(`
      UPDATE crew 
      SET assigned_center = $1, updated_at = CURRENT_TIMESTAMP
      WHERE crew_id = $2
      RETURNING crew_id, crew_name, assigned_center
    `, [center_id, crew_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Crew member not found' });
    }
    // Personalized activity logs for admin, center, crew, and (optionally) manager
    try {
      const actorId = String(req.headers['x-admin-user-id'] || 'freedom_exe');
      // Load center context
      const c = await pool.query('SELECT center_id, center_name, cks_manager FROM centers WHERE UPPER(center_id)=UPPER($1) LIMIT 1', [center_id]);
      const centerName = c.rows?.[0]?.center_name || String(center_id);
      const managerId = c.rows?.[0]?.cks_manager || null;
      const crewName = result.rows[0]?.crew_name || String(crew_id);

      // Admin audit
      await logActivity(
        'crew_assignment_made',
        `Assigned ${crew_id} to ${center_id}`,
        actorId,
        'admin',
        actorId,
        'admin',
        { crew_id, crew_name: crewName, center_id, center_name: centerName, manager_id: managerId }
      );

      // Crew-facing
      await logActivity(
        'center_assigned',
        `You have been assigned to center ${centerName} (${center_id}).`,
        actorId,
        'admin',
        crew_id,
        'crew',
        { center_id, center_name: centerName }
      );

      // Center-facing
      await logActivity(
        'crew_assigned',
        `New crew member assigned: ${crewName} (${crew_id}).`,
        actorId,
        'admin',
        center_id,
        'center',
        { crew_id, crew_name: crewName }
      );

      // Manager-facing (if available)
      if (managerId) {
        await logActivity(
          'crew_assigned',
          `A new crew member ${crewName} (${crew_id}) has been assigned to center ${centerName} (${center_id}).`,
          actorId,
          'admin',
          managerId,
          'manager',
          { crew_id, crew_name: crewName, center_id, center_name: centerName }
        );
      }
    } catch (logErr) {
      console.error('Failed to log crew assignment activities:', logErr);
    }

    res.json({ 
      success: true, 
      data: result.rows[0],
      message: force_assign ? 'Crew assigned with admin override' : 'Crew assigned successfully'
    });
  } catch (e: any) {
    logger.error({ error: e }, 'Admin crew assignment error');
    res.status(500).json({ error: 'Failed to assign crew to center' });
  }
});

// DELETE /api/admin/contractors/:id - Delete a contractor
router.delete('/contractors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Contractor ID is required' });
    }
    
    // Get contractor info before archiving
    const existing = await pool.query('SELECT contractor_id, company_name FROM contractors WHERE contractor_id = $1', [id]);
    if (existing.rowCount === 0) return res.status(404).json({ error: 'Contractor not found' });
    const contractorName = existing.rows[0].company_name;
    
    await pool.query('BEGIN');
    try {
      // Proactively unlink references that may block deletion/archiving
      try { await pool.query('UPDATE customers SET contractor_id=NULL WHERE contractor_id=$1', [id]); } catch {}
      try { await pool.query('UPDATE centers SET contractor_id=NULL WHERE contractor_id=$1', [id]); } catch {}
      try { await pool.query('DELETE FROM contractor_services WHERE contractor_id=$1', [id]); } catch {}

      if (await hasColumn('contractors', 'archived_at')) {
        // Soft delete (archive) the contractor and clear manager link
        await pool.query('UPDATE contractors SET archived_at=NOW(), cks_manager=NULL WHERE contractor_id=$1', [id]);
      } else {
        // Hard delete as a fallback when archive column is absent
        await pool.query('DELETE FROM contractors WHERE contractor_id = $1', [id]);
      }
      
      // Remove from authentication system
      try { await pool.query('DELETE FROM app_users WHERE code = $1', [id]); } catch {}
      
      await pool.query('COMMIT');
      
      // Log the deletion activity first
      try { 
        await logActivity('user_deleted', `Contractor ${id} (${contractorName}) archived`, String(req.headers['x-admin-user-id']||'admin'), 'admin', id, 'contractor', { name: contractorName }); 
      } catch {}
      
      // Then delete all activity history for this contractor (including the deletion log above)
      try { 
        await pool.query('DELETE FROM system_activity WHERE target_id = $1 OR actor_id = $1', [id]); 
      } catch {}
      
      return res.json({ success: true, message: `Contractor ${id} archived and unassigned` });
    } catch (deleteError) {
      await pool.query('ROLLBACK');
      throw deleteError;
    }
  } catch (e: any) {
    const code = e?.code;
    if (code === '23503') {
      // Foreign key violation – report a clearer message
      return res.status(409).json({ error: 'in_use', message: 'Contractor is referenced by other records. Try again after unlinking related entities.' });
    }
    logger.error({ error: e, contractor_id: req.params.id }, 'Admin contractor delete error');
    res.status(500).json({ error: 'Failed to delete contractor' });
  }
});

// DELETE /api/admin/customers/:id - Delete a customer
router.delete('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }
    
    // Check if customer exists
    const existsCheck = await pool.query('SELECT customer_id FROM customers WHERE customer_id = $1', [id]);
    if (existsCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    await pool.query('BEGIN');
    try {
      if (await hasColumn('customers', 'archived_at')) {
        await pool.query('UPDATE customers SET archived_at=NOW() WHERE customer_id=$1', [id]);
        await pool.query('UPDATE centers SET customer_id=NULL WHERE customer_id=$1', [id]);
      } else {
        await pool.query('DELETE FROM customers WHERE customer_id = $1', [id]);
      }
      await pool.query('COMMIT');
      return res.json({ success: true, message: `Customer ${id} archived and unassigned` });
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  } catch (e: any) {
    logger.error({ error: e, customer_id: req.params.id }, 'Admin customer delete error');
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// DELETE /api/admin/centers/:id - Delete a center
router.delete('/centers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Center ID is required' });
    }
    
    // Check if center exists
    const existsCheck = await pool.query('SELECT center_id FROM centers WHERE center_id = $1', [id]);
    if (existsCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Center not found' });
    }
    
    await pool.query('BEGIN');
    try {
      if (await hasColumn('centers', 'archived_at')) {
        await pool.query('UPDATE centers SET archived_at=NOW() WHERE center_id=$1', [id]);
        await pool.query('UPDATE crew SET assigned_center=NULL WHERE assigned_center=$1', [id]);
      } else {
        await pool.query('DELETE FROM centers WHERE center_id = $1', [id]);
      }
      await pool.query('COMMIT');
      return res.json({ success: true, message: `Center ${id} archived and unassigned` });
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  } catch (e: any) {
    logger.error({ error: e, center_id: req.params.id }, 'Admin center delete error');
    res.status(500).json({ error: 'Failed to delete center' });
  }
});

// DELETE /api/admin/crew/:id - Delete a crew member
router.delete('/crew/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Crew ID is required' });
    }
    
    // Check if crew member exists
    const existsCheck = await pool.query('SELECT crew_id FROM crew WHERE crew_id = $1', [id]);
    if (existsCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Crew member not found' });
    }
    
    // Delete the crew member
    await pool.query('DELETE FROM crew WHERE crew_id = $1', [id]);
    
    res.json({ 
      success: true, 
      message: `Crew member ${id} deleted successfully`
    });
  } catch (e: any) {
    logger.error({ error: e, crew_id: req.params.id }, 'Admin crew delete error');
    res.status(500).json({ error: 'Failed to delete crew member' });
  }
});

// DELETE /api/admin/warehouses/:id - Delete a warehouse
router.delete('/warehouses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Warehouse ID is required' });
    }
    
    // Check if warehouse exists
    const existsCheck = await pool.query('SELECT warehouse_id FROM warehouses WHERE warehouse_id = $1', [id]);
    if (existsCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    
    await pool.query('BEGIN');
    try {
      if (await hasColumn('warehouses', 'archived_at')) {
        await pool.query('UPDATE warehouses SET archived_at=NOW() WHERE warehouse_id=$1', [id]);
      } else {
        await pool.query('DELETE FROM warehouses WHERE warehouse_id = $1', [id]);
      }
      await pool.query('COMMIT');
      return res.json({ success: true, message: `Warehouse ${id} archived` });
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  } catch (e: any) {
    logger.error({ error: e, warehouse_id: req.params.id }, 'Admin warehouse delete error');
    res.status(500).json({ error: 'Failed to delete warehouse' });
  }
});

// PATCH /api/admin/contractors/:id/assign-manager - Assign contractor to manager
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
    
    // Check if contractor exists
    const contractorCheck = await pool.query('SELECT contractor_id FROM contractors WHERE contractor_id = $1', [id]);
    if (contractorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Contractor not found' });
    }
    
    // Check if manager exists
    const managerCheck = await pool.query('SELECT manager_id, manager_name FROM managers WHERE manager_id = $1', [manager_id]);
    if (managerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Manager not found' });
    }
    
  // Update contractor with manager assignment
  const result = await pool.query(`
      UPDATE contractors 
      SET cks_manager = $1 
      WHERE contractor_id = $2 
      RETURNING contractor_id, cks_manager, company_name
    `, [manager_id, id]);
    
    // Log activity (admin-style, contractor target)
    try {
      await logActivity(
        'contractor_assigned',
        `Contractor ${id} assigned to Manager ${manager_id}`,
        'freedom_exe',
        'admin',
        id,
        'contractor',
        { manager_id }
      );
    } catch (error) {
      console.error('Failed to log contractor assignment:', error);
    }

    res.json({ 
      success: true, 
      data: result.rows[0],
      message: `Contractor ${id} assigned to manager ${manager_id}`
    });
  } catch (e: any) {
    logger.error({ error: e, contractor_id: req.params.id }, 'Admin contractor assign manager error');
    res.status(500).json({ error: 'Failed to assign contractor to manager' });
  }
});

// POST /api/admin/cleanup-demo-data - Clean all demo/seed data (DESTRUCTIVE!)
router.post('/cleanup-demo-data', async (req, res) => {
  try {
    logger.info('Starting demo data cleanup...');
    
    // Clean in correct order to avoid foreign key violations
    const cleanupQueries = [
      // Clean child tables first
      "DELETE FROM job_assignments",
      "DELETE FROM service_jobs",
      "DELETE FROM approvals",
      "DELETE FROM order_items", 
      "DELETE FROM orders WHERE order_id LIKE 'REQ-%' OR order_id LIKE 'ORD-%'",
      
      // Clean warehouse data (if tables exist)
      "DELETE FROM warehouse_activity_log",
      "DELETE FROM shipment_items",
      "DELETE FROM warehouse_shipments", 
      "DELETE FROM warehouse_staff",
      "DELETE FROM inventory_items",
      "DELETE FROM warehouses WHERE warehouse_id LIKE 'WH-%'",
      
      // Clean requirements and training data (if tables exist)
      "DELETE FROM crew_requirements",
      "DELETE FROM procedures WHERE procedure_id LIKE 'PRC-%'",
      "DELETE FROM training WHERE training_id LIKE 'TRN-%'",
      
      // Clean reports and feedback (if tables exist)
      "DELETE FROM report_comments",
      "DELETE FROM reports", 
      "DELETE FROM feedback",
      
      // Clean crew before centers (crew references centers)
      "DELETE FROM crew WHERE crew_id LIKE 'crew-%' OR crew_id LIKE 'CRW-%'",
      
      // Clean centers before customers/contractors (centers reference them)
      "DELETE FROM centers WHERE center_id LIKE 'ctr-%' OR center_id LIKE 'CEN-%'", 
      
      // Clean customers and contractors before managers (they reference managers)
      "DELETE FROM customers WHERE customer_id LIKE 'cus-%' OR customer_id LIKE 'CUS-%' OR customer_id LIKE 'cust-%'",
      "DELETE FROM contractors WHERE contractor_id LIKE 'con-%' OR contractor_id LIKE 'CON-%' OR contractor_id LIKE 'cont-%'",
      
      // Clean managers last
      "DELETE FROM managers WHERE manager_id LIKE 'mgr-%' OR manager_id LIKE 'MGR-%'",
      
      // Clean catalog data (keep services)
      "DELETE FROM products WHERE product_id LIKE 'PRD-%'",
      "DELETE FROM supplies WHERE supply_id LIKE 'SUP-%'"
    ];
    
    let cleanedCount = 0;
    for (const query of cleanupQueries) {
      try {
        const result = await pool.query(query);
        if (result.rowCount && result.rowCount > 0) {
          cleanedCount += result.rowCount;
          logger.info(`Cleaned ${result.rowCount} records: ${query.substring(0, 50)}...`);
        }
      } catch (e: any) {
        // Skip errors for tables that might not exist yet
        if (e.code !== '42P01') { // relation does not exist
          logger.warn(`Cleanup query failed: ${query} - ${e.message}`);
        }
      }
    }
    
    logger.info(`Demo data cleanup completed. Removed ${cleanedCount} total records.`);
    res.json({ 
      success: true, 
      message: `Demo data cleanup completed. Removed ${cleanedCount} records.`,
      cleanedCount 
    });
    
  } catch (e: any) {
    logger.error({ error: e }, 'Demo data cleanup error');
    res.status(500).json({ error: 'Failed to cleanup demo data' });
  }
});

// Temporary endpoint to add archived_at column
router.post('/setup-archive', async (req, res) => {
  try {
    // Add archived_at columns to all entity tables
    const tables = ['managers', 'contractors', 'customers', 'centers', 'crew', 'warehouses'];
    
    for (const table of tables) {
      await pool.query(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = '${table}' AND column_name = 'archived_at') THEN
                ALTER TABLE ${table} ADD COLUMN archived_at TIMESTAMP NULL;
            END IF;
        END $$;
      `);
      
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_${table}_archived_at ON ${table}(archived_at)`);
    }
    
    return res.json({ success: true, message: 'Archive setup completed for all entity tables' });
  } catch (error) {
    console.error('Archive setup error:', error);
    return res.status(500).json({ error: 'Setup failed' });
  }
});

// GET /api/admin/archive/:type - Get archived entities
router.get('/archive/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 25, offset = 0, search } = req.query;
    
    if (!['managers', 'contractors', 'customers', 'centers', 'crew', 'warehouses'].includes(type)) {
      return res.status(400).json({ error: 'Invalid entity type' });
    }
    
    const { getArchivedEntities } = await import('../../../../Database/hubs/admin/archive-operations');
    const result = await getArchivedEntities(type as any, {
      limit: Number(limit),
      offset: Number(offset),
      search: String(search || '')
    });
    
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('Archive fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch archive' });
  }
});

// POST /api/admin/archive/:type/:id/restore - Restore archived entity
router.post('/archive/:type/:id/restore', async (req, res) => {
  try {
    const { type, id } = req.params;
    const adminUserId = String(req.headers['x-admin-user-id'] || 'admin');
    
    if (!['managers', 'contractors', 'customers', 'centers', 'crew', 'warehouses'].includes(type)) {
      return res.status(400).json({ error: 'Invalid entity type' });
    }
    
    const { restoreEntity } = await import('../../../../Database/hubs/admin/archive-operations');
    const result = await restoreEntity(type as any, id, adminUserId);
    
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('Restore error:', error);
    return res.status(500).json({ error: error.message || 'Restore failed' });
  }
});

// GET /api/admin/archive/stats - Get archive statistics
router.get('/archive-stats', async (req, res) => {
  try {
    const { getArchiveStatistics } = await import('../../../../Database/hubs/admin/archive-operations');
    const stats = await getArchiveStatistics();
    
    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Archive stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch archive statistics' });
  }
});

// POST /api/admin/clear-all-users - Clear all users from all tables
router.post('/clear-all-users', async (req, res) => {
  try {
    const tables = ['managers', 'contractors', 'customers', 'centers', 'crew', 'warehouses'];
    
    for (const table of tables) {
      await pool.query(`DELETE FROM ${table}`);
    }
    
    // Also clear app_users table
    await pool.query(`DELETE FROM app_users`);
    
    return res.json({ 
      success: true, 
      message: 'All users cleared from all tables',
      cleared_tables: [...tables, 'app_users']
    });
  } catch (error) {
    console.error('Clear users error:', error);
    return res.status(500).json({ error: 'Failed to clear users' });
  }
});

// POST /api/admin/clear-activity - Clear all system activity
router.post('/clear-activity', async (req, res) => {
  try {
    await pool.query(`DELETE FROM system_activity`);
    
    return res.json({ 
      success: true, 
      message: 'All system activity cleared'
    });
  } catch (error) {
    console.error('Clear activity error:', error);
    return res.status(500).json({ error: 'Failed to clear activity' });
  }
});

// DELETE /api/admin/archive/:type/:id/hard-delete - Hard delete from archive
router.delete('/archive/:type/:id/hard-delete', async (req, res) => {
  try {
    const entityType = req.params.type as 'managers' | 'contractors' | 'customers' | 'centers' | 'crew' | 'warehouses';
    const entityId = req.params.id;
    
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
      return res.status(400).json({ error: 'Invalid entity type' });
    }

    // Check if entity exists and is archived
    const checkResult = await pool.query(
      `SELECT ${config.idColumn}, ${config.nameColumn}, archived_at 
       FROM ${config.table} 
       WHERE ${config.idColumn} = $1`,
      [entityId]
    );

    if (checkResult.rowCount === 0) {
      return res.status(404).json({ error: `${entityType.slice(0, -1)} not found` });
    }

    if (!checkResult.rows[0].archived_at) {
      return res.status(400).json({ error: `${entityType.slice(0, -1)} is not archived` });
    }

    // Hard delete the entity
    const deleteResult = await pool.query(
      `DELETE FROM ${config.table} WHERE ${config.idColumn} = $1 RETURNING ${config.idColumn}`,
      [entityId]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(500).json({ error: `Failed to delete ${entityType.slice(0, -1)}` });
    }

    const entityName = checkResult.rows[0][config.nameColumn];
    
    // Log the hard delete activity
    try {
      await logActivity('user_deleted', `${entityType.slice(0, -1)} ${entityId} (${entityName}) permanently deleted`, String(req.headers['x-admin-user-id']||'admin'), 'admin', entityId, entityType.slice(0, -1), { 
        name: entityName,
        action: 'hard_deleted'
      });
    } catch (e) {
      console.error('Activity logging failed:', e);
    }

    return res.json({
      success: true,
      message: `${entityType.slice(0, -1)} ${entityId} permanently deleted`
    });
  } catch (error) {
    console.error('Hard delete error:', error);
    return res.status(500).json({ error: 'Failed to hard delete entity' });
  }
});

// GET /api/admin/debug-info - Debug endpoint for testing activity logging
router.get('/debug-info', async (req: Request, res: Response) => {
  try {
    const [activities, contractors, managers] = await Promise.all([
      pool.query('SELECT * FROM system_activity ORDER BY created_at DESC LIMIT 10'),
      pool.query('SELECT contractor_id, cks_manager, archived FROM contractors LIMIT 10'),
      pool.query('SELECT manager_id, archived FROM managers LIMIT 10')
    ]);
    
    res.json({
      success: true,
      data: {
        recentActivities: activities.rows,
        contractors: contractors.rows,
        managers: managers.rows,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: 'Debug failed' });
  }
});

export default router;


// ============================================
// ARCHIVE: LIST + RESTORE
// ============================================

// GET /api/admin/archive?type=contractors|customers|centers|warehouses
router.get('/archive', async (req: Request, res: Response) => {
  try {
    const type = String(req.query.type || '').toLowerCase();
    const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    let table = '';
    let cols = '';
    switch (type) {
      case 'contractors': table = 'contractors'; cols = `contractor_id AS id, company_name AS name, archived_at AS date`; break;
      case 'customers': table = 'customers'; cols = `customer_id AS id, company_name AS name, archived_at AS date`; break;
      case 'centers': table = 'centers'; cols = `center_id AS id, center_name AS name, archived_at AS date`; break;
      case 'warehouses': table = 'warehouses'; cols = `warehouse_id AS id, warehouse_name AS name, archived_at AS date`; break;
      case 'managers': table = 'managers'; cols = `manager_id AS id, manager_name AS name, archived_at AS date`; break;
      case 'crew': table = 'crew'; cols = `crew_id AS id, crew_name AS name, archived_at AS date`; break;
      case 'services': table = 'services'; cols = `service_id AS id, service_name AS name, archived_at AS date`; break;
      case 'products': table = 'products'; cols = `product_id AS id, product_name AS name, archived_at AS date`; break;
      case 'supplies': table = 'supplies'; cols = `supply_id AS id, supply_name AS name, archived_at AS date`; break;
      case 'procedures': table = 'procedures'; cols = `procedure_id AS id, procedure_name AS name, archived_at AS date`; break;
      case 'training': table = 'training'; cols = `training_id AS id, training_name AS name, archived_at AS date`; break;
      case 'reports': table = 'reports'; cols = `report_id AS id, title AS name, archived_at AS date`; break;
      case 'feedback': table = 'feedback'; cols = `feedback_id AS id, title AS name, archived_at AS date`; break;
      case 'orders': table = 'orders'; cols = `order_id AS id, COALESCE(notes,'') AS name, archived_at AS date`; break;
      default: return res.status(400).json({ error: 'invalid_type' });
    }
    if (!(await hasColumn(table, 'archived_at'))) return res.json({ items: [], total: 0, page: 1, pageSize: limit });
    const q = `SELECT ${cols} FROM ${table} WHERE archived_at IS NOT NULL ORDER BY archived_at DESC LIMIT $1 OFFSET $2`;
    const c = `SELECT COUNT(*) FROM ${table} WHERE archived_at IS NOT NULL`;
    const [items, total] = await Promise.all([
      pool.query(q, [limit, offset]),
      pool.query(c)
    ]);
    return res.json({ items: items.rows, total: Number(total.rows[0].count), page: Math.floor(offset/limit)+1, pageSize: limit });
  } catch (e:any) {
    logger.error({ error: e }, 'Admin archive list error');
    return res.status(500).json({ error: 'Failed to list archive' });
  }
});

// POST /api/admin/:type/:id/restore
router.post('/:type/:id/restore', async (req: Request, res: Response) => {
  try {
    const type = String(req.params.type || '').toLowerCase();
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'id_required' });
    let table = '';
    let idCol = '';
    switch (type) {
      case 'contractors': table = 'contractors'; idCol = 'contractor_id'; break;
      case 'customers': table = 'customers'; idCol = 'customer_id'; break;
      case 'centers': table = 'centers'; idCol = 'center_id'; break;
      case 'warehouses': table = 'warehouses'; idCol = 'warehouse_id'; break;
      case 'managers': table = 'managers'; idCol = 'manager_id'; break;
      case 'crew': table = 'crew'; idCol = 'crew_id'; break;
      case 'services': table = 'services'; idCol = 'service_id'; break;
      case 'products': table = 'products'; idCol = 'product_id'; break;
      case 'supplies': table = 'supplies'; idCol = 'supply_id'; break;
      case 'procedures': table = 'procedures'; idCol = 'procedure_id'; break;
      case 'training': table = 'training'; idCol = 'training_id'; break;
      case 'reports': table = 'reports'; idCol = 'report_id'; break;
      case 'feedback': table = 'feedback'; idCol = 'feedback_id'; break;
      case 'orders': table = 'orders'; idCol = 'order_id'; break;
      default: return res.status(400).json({ error: 'invalid_type' });
    }
    if (!(await hasColumn(table, 'archived_at'))) return res.status(400).json({ error: 'archive_not_supported' });
    const r = await pool.query(`UPDATE ${table} SET archived_at=NULL WHERE ${idCol}=$1 RETURNING ${idCol} AS id`, [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'not_found' });
    return res.json({ success: true, data: r.rows[0] });
  } catch (e:any) {
    logger.error({ error: e }, 'Admin restore error');
    return res.status(500).json({ error: 'Failed to restore record' });
  }
});
