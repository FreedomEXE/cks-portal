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
import { logger } from '../../src/core/logger';

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

    let whereClause = '';
    const values: any[] = [];
    if (search) {
      values.push(`%${search}%`);
      whereClause = `WHERE (manager_id || ' ' || COALESCE(manager_name,'') || ' ' || COALESCE(email,'') || ' ' || COALESCE(phone,'')) ILIKE $1`;
    }

    const query = `
      SELECT manager_id, manager_name, status, assigned_center, email, phone
      FROM managers ${whereClause}
      ORDER BY manager_id
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    const countQuery = `SELECT COUNT(*) FROM managers ${whereClause}`;

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
    logger.error({ error: e }, 'Admin managers list error');
    res.status(500).json({ error: 'Failed to fetch managers list' });
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
    
    const query = `
      SELECT contractor_id, cks_manager, company_name, num_customers, main_contact, address, phone, email
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
    
    const query = `
      SELECT customer_id, cks_manager, company_name, num_centers, main_contact, address, phone, email
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
    
    const query = `
      SELECT center_id, cks_manager, name, main_contact, address, phone, email, contractor_id, customer_id
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
    
    res.json({
      items: items.rows,
      total: Number(total.rows[0].count),
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
    
    const result = await pool.query(`
      DELETE FROM services 
      WHERE service_id = $1
      RETURNING service_id as id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
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
router.post('/users', async (req: Request, res: Response) => {
  try {
    const role = String(req.body.role || '').toLowerCase();
    if (!['manager', 'contractor', 'customer', 'center', 'crew'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (role === 'manager') {
      const id = await getNextIdGeneric('managers', 'manager_id', 'MGR-');
      const name = req.body.manager_name || req.body.name;
      if (!name) return res.status(400).json({ error: 'manager_name is required' });
      const { email, phone, assigned_center, territory, status } = req.body;
      const r = await pool.query(
        `INSERT INTO managers(manager_id, manager_name, assigned_center, email, phone, territory, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING manager_id, manager_name, status, email, phone, assigned_center`,
        [id, name, assigned_center || null, email || null, phone || null, territory || null, status || 'active']
      );
      return res.status(201).json({ success: true, data: r.rows[0] });
    }

    if (role === 'contractor') {
      const id = await getNextIdGeneric('contractors', 'contractor_id', 'CON-');
      const company = req.body.company_name || req.body.name;
      const cks_manager = req.body.cks_manager;
      if (!company) return res.status(400).json({ error: 'company_name is required' });
      if (!cks_manager) return res.status(400).json({ error: 'cks_manager is required' });
      const { contact_person, email, phone, business_type, status } = req.body;
      const r = await pool.query(
        `INSERT INTO contractors(contractor_id, cks_manager, company_name, contact_person, email, phone, business_type, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING contractor_id, cks_manager, company_name, status`,
        [id, cks_manager, company, contact_person || null, email || null, phone || null, business_type || null, status || 'active']
      );
      return res.status(201).json({ success: true, data: r.rows[0] });
    }

    if (role === 'customer') {
      const id = await getNextIdGeneric('customers', 'customer_id', 'CUS-');
      const company = req.body.company_name || req.body.name;
      const cks_manager = req.body.cks_manager;
      if (!company) return res.status(400).json({ error: 'company_name is required' });
      if (!cks_manager) return res.status(400).json({ error: 'cks_manager is required' });
      const { contact_person, email, phone, service_tier, status } = req.body;
      const r = await pool.query(
        `INSERT INTO customers(customer_id, cks_manager, company_name, contact_person, email, phone, service_tier, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING customer_id, cks_manager, company_name, status`,
        [id, cks_manager, company, contact_person || null, email || null, phone || null, service_tier || null, status || 'active']
      );
      return res.status(201).json({ success: true, data: r.rows[0] });
    }

    if (role === 'center') {
      const id = await getNextIdGeneric('centers', 'center_id', 'CEN-');
      const name = req.body.center_name || req.body.name;
      const cks_manager = req.body.cks_manager;
      const customer_id = req.body.customer_id;
      const contractor_id = req.body.contractor_id;
      if (!name) return res.status(400).json({ error: 'center_name is required' });
      if (!cks_manager) return res.status(400).json({ error: 'cks_manager is required' });
      if (!customer_id) return res.status(400).json({ error: 'customer_id is required' });
      if (!contractor_id) return res.status(400).json({ error: 'contractor_id is required' });
      const { address, operational_hours, status } = req.body;
      const r = await pool.query(
        `INSERT INTO centers(center_id, cks_manager, center_name, customer_id, contractor_id, address, operational_hours, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING center_id, cks_manager, center_name, customer_id, contractor_id, status`,
        [id, cks_manager, name, customer_id, contractor_id, address || null, operational_hours || null, status || 'active']
      );
      return res.status(201).json({ success: true, data: r.rows[0] });
    }

    if (role === 'crew') {
      const id = await getNextIdGeneric('crew', 'crew_id', 'CRW-');
      const crew_name = req.body.crew_name || req.body.name;
      if (!crew_name) return res.status(400).json({ error: 'crew_name is required' });
      
      // Map to actual crew table columns
      const r = await pool.query(
        `INSERT INTO crew(crew_id, name, status, role, address, phone, email, assigned_center)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING crew_id, name, status, role, address, phone, email, assigned_center`,
        [
          id, 
          crew_name, 
          req.body.status || 'Active', 
          req.body.crew_role || 'Crew', 
          req.body.address || null, 
          req.body.phone || null, 
          req.body.email || null, 
          null // assigned_center starts as null (unassigned)
        ]
      );
      return res.status(201).json({ success: true, data: r.rows[0] });
    }

    return res.status(400).json({ error: 'Unsupported role' });
  } catch (e: any) {
    logger.error({ error: e }, 'Admin user create error');
    res.status(500).json({ error: 'Failed to create user' });
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

export default router;
