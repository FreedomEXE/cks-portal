/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * entities.ts
 * 
 * Description: Read-only entity profile endpoints for all user types
 * Function: Provides standardized access to entity data
 * Importance: High - Powers frontend detail views and lookups
 * Connects to: Database pool, HTTP utilities
 * 
 * Notes: Consistent field projection across all entity types.
 *        Case-insensitive ID matching for flexibility.
 */


import express, { Request, Response } from 'express';
import pool from '../db/pool';
import { ok, bad, safe } from '../utils/http';

const router = express.Router();

// Crew endpoint
router.get('/crew/:id', safe(async (req: Request, res: Response) => {
  const { rows } = await pool.query(
    `SELECT crew_id, name, status, role, address, phone, email, assigned_center,
            created_at, updated_at
     FROM crew 
     WHERE LOWER(crew_id) = LOWER($1)`,
    [req.params.id]
  );
  
  if (!rows.length) {
    return bad(res, 'Crew member not found', 404);
  }
  
  ok(res, rows[0]);
}));

// Contractors endpoint
router.get('/contractors/:id', safe(async (req: Request, res: Response) => {
  const { rows } = await pool.query(
    `SELECT contractor_id, cks_manager, company_name, num_customers, 
            main_contact, address, phone, email, created_at, updated_at
     FROM contractors 
     WHERE LOWER(contractor_id) = LOWER($1)`,
    [req.params.id]
  );
  
  if (!rows.length) {
    return bad(res, 'Contractor not found', 404);
  }
  
  ok(res, rows[0]);
}));

// Customers endpoint
router.get('/customers/:id', safe(async (req: Request, res: Response) => {
  const { rows } = await pool.query(
    `SELECT customer_id, cks_manager, company_name, num_centers, 
            main_contact, address, phone, email, created_at, updated_at
     FROM customers 
     WHERE LOWER(customer_id) = LOWER($1)`,
    [req.params.id]
  );
  
  if (!rows.length) {
    return bad(res, 'Customer not found', 404);
  }
  
  ok(res, rows[0]);
}));

// Centers endpoint
router.get('/centers/:id', safe(async (req: Request, res: Response) => {
  const { rows } = await pool.query(
    `SELECT center_id, cks_manager, name, main_contact, address, 
            phone, email, contractor_id, customer_id, created_at, updated_at
     FROM centers 
     WHERE LOWER(center_id) = LOWER($1)`,
    [req.params.id]
  );
  
  if (!rows.length) {
    return bad(res, 'Center not found', 404);
  }
  
  ok(res, rows[0]);
}));

// Batch fetch endpoint for multiple entities
router.post('/entities/batch', safe(async (req: Request, res: Response) => {
  const { ids, type } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return bad(res, 'ids array is required', 400);
  }
  
  if (ids.length > 100) {
    return bad(res, 'Maximum 100 IDs per request', 400);
  }
  
  let table: string;
  let idColumn: string;
  
  switch (type) {
    case 'crew':
      table = 'crew';
      idColumn = 'crew_id';
      break;
    case 'contractor':
      table = 'contractors';
      idColumn = 'contractor_id';
      break;
    case 'customer':
      table = 'customers';
      idColumn = 'customer_id';
      break;
    case 'center':
      table = 'centers';
      idColumn = 'center_id';
      break;
    default:
      return bad(res, 'Invalid entity type', 400);
  }
  
  const { rows } = await pool.query(
    `SELECT * FROM ${table} 
     WHERE LOWER(${idColumn}) = ANY($1::text[])`,
    [ids.map(id => String(id).toLowerCase())]
  );
  
  ok(res, { items: rows, found: rows.length, requested: ids.length });
}));

// Search across all entities
router.get('/entities/search', safe(async (req: Request, res: Response) => {
  const search = String(req.query.q ?? '').trim();
  const limit = Math.min(parseInt(String(req.query.limit ?? '10'), 10), 50);
  
  if (!search || search.length < 2) {
    return bad(res, 'Search query must be at least 2 characters', 400);
  }
  
  const searchPattern = `%${search}%`;
  const results: any = {};
  
  // Search each entity type
  const [crews, contractors, customers, centers] = await Promise.all([
    pool.query(
      `SELECT crew_id as id, name, 'crew' as type 
       FROM crew 
       WHERE crew_id ILIKE $1 OR name ILIKE $1 
       LIMIT $2`,
      [searchPattern, limit]
    ),
    pool.query(
      `SELECT contractor_id as id, company_name as name, 'contractor' as type 
       FROM contractors 
       WHERE contractor_id ILIKE $1 OR company_name ILIKE $1 
       LIMIT $2`,
      [searchPattern, limit]
    ),
    pool.query(
      `SELECT customer_id as id, company_name as name, 'customer' as type 
       FROM customers 
       WHERE customer_id ILIKE $1 OR company_name ILIKE $1 
       LIMIT $2`,
      [searchPattern, limit]
    ),
    pool.query(
      `SELECT center_id as id, name, 'center' as type 
       FROM centers 
       WHERE center_id ILIKE $1 OR name ILIKE $1 
       LIMIT $2`,
      [searchPattern, limit]
    )
  ]);
  
  results.crew = crews.rows;
  results.contractors = contractors.rows;
  results.customers = customers.rows;
  results.centers = centers.rows;
  
  ok(res, {
    results,
    total: crews.rows.length + contractors.rows.length + 
            customers.rows.length + centers.rows.length
  });
}));

export default router;