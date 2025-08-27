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

export default router;