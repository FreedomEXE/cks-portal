/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * profiles.routes.ts
 * 
 * Description: Aggregated profile data and relationships for entities
 * Function: Provides comprehensive profile views with related data
 * Importance: High - Powers profile dashboards with contextual information
 * Connects to: Database for complex queries and aggregations
 * 
 * Notes: Uses modern ID prefixes for entity type detection.
 *        Supports pagination and search across related entities.
 */

import express, { Request, Response } from 'express';
import pool from '../db/pool';

const router = express.Router();

// Entity type detection using modern ID prefixes
type EntityKind = 'admin' | 'contractor' | 'customer' | 'center' | 'crew' | 'manager';

function getKindFromCode(code: string): EntityKind {
  const lowerCode = code.toLowerCase();
  
  if (lowerCode === 'admin-000') return 'admin';
  if (lowerCode.startsWith('con-')) return 'contractor';
  if (lowerCode.startsWith('cust-')) return 'customer';
  if (lowerCode.startsWith('ctr-')) return 'center';
  if (lowerCode.startsWith('crew-')) return 'crew';
  if (lowerCode.startsWith('mgr-')) return 'manager';
  
  // Fallback to admin for unknown codes
  return 'admin';
}

// Build search WHERE clause for multiple fields
function buildSearchClause(fields: string[], paramIndex: number): string {
  if (!fields.length) return '';
  const searchExpr = fields
    .map(f => `COALESCE(${f}::text, '')`)
    .join(" || ' ' || ");
  return `(${searchExpr}) ILIKE $${paramIndex}`;
}

// Get entity summary with statistics
router.get('/:code/summary', async (req: Request, res: Response) => {
  const code = String(req.params.code || '');
  const kind = getKindFromCode(code);
  
  try {
    switch (kind) {
      case 'contractor': {
        const [base, centers, customers] = await Promise.all([
          pool.query(
            'SELECT * FROM contractors WHERE LOWER(contractor_id) = LOWER($1) LIMIT 1',
            [code]
          ),
          pool.query(
            'SELECT COUNT(*) FROM centers WHERE LOWER(contractor_id) = LOWER($1)',
            [code]
          ),
          pool.query(
            'SELECT COUNT(DISTINCT customer_id) FROM centers WHERE LOWER(contractor_id) = LOWER($1)',
            [code]
          )
        ]);
        
        if (!base.rowCount) {
          return res.status(404).json({ error: 'Contractor not found' });
        }
        
        return res.json({
          kind,
          identity: base.rows[0],
          stats: {
            centers: Number(centers.rows[0].count),
            customers: Number(customers.rows[0].count),
            active: true
          }
        });
      }
      
      case 'customer': {
        const [base, centers, contractors] = await Promise.all([
          pool.query(
            'SELECT * FROM customers WHERE LOWER(customer_id) = LOWER($1) LIMIT 1',
            [code]
          ),
          pool.query(
            'SELECT COUNT(*) FROM centers WHERE LOWER(customer_id) = LOWER($1)',
            [code]
          ),
          pool.query(
            'SELECT COUNT(DISTINCT contractor_id) FROM centers WHERE LOWER(customer_id) = LOWER($1)',
            [code]
          )
        ]);
        
        if (!base.rowCount) {
          return res.status(404).json({ error: 'Customer not found' });
        }
        
        return res.json({
          kind,
          identity: base.rows[0],
          stats: {
            centers: Number(centers.rows[0].count),
            contractors: Number(contractors.rows[0].count),
            active: true
          }
        });
      }
      
      case 'center': {
        const base = await pool.query(
          'SELECT * FROM centers WHERE LOWER(center_id) = LOWER($1) LIMIT 1',
          [code]
        );
        
        if (!base.rowCount) {
          return res.status(404).json({ error: 'Center not found' });
        }
        
        const row = base.rows[0];
        row.center_name = row.name; // Normalize field name
        
        return res.json({
          kind,
          identity: row,
          stats: {
            active: true
          }
        });
      }
      
      case 'crew': {
        const base = await pool.query(
          'SELECT * FROM crew WHERE LOWER(crew_id) = LOWER($1) LIMIT 1',
          [code]
        );
        
        if (!base.rowCount) {
          return res.status(404).json({ error: 'Crew member not found' });
        }
        
        return res.json({
          kind,
          identity: base.rows[0],
          stats: {
            active: base.rows[0].status === 'active'
          }
        });
      }
      
      case 'manager': {
        return res.json({
          kind,
          identity: {
            manager_id: code,
            name: 'Manager',
            role: 'manager'
          },
          stats: {
            active: true
          }
        });
      }
      
      default: {
        return res.json({
          kind: 'admin',
          identity: {
            code: 'admin-000',
            role: 'admin'
          },
          stats: {
            active: true
          }
        });
      }
    }
  } catch (e: any) {
    console.error(`Profile summary error for ${code}:`, e);
    res.status(500).json({
      error: 'Database error',
      message: 'Failed to fetch profile summary'
    });
  }
});

// Get centers related to an entity
router.get('/:code/centers', async (req: Request, res: Response) => {
  const code = String(req.params.code || '');
  const kind = getKindFromCode(code);
  
  const limit = Math.min(parseInt(String(req.query.limit ?? '10'), 10), 100);
  const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
  const search = String(req.query.q ?? '').trim();
  
  try {
    let whereClause = '';
    let countWhereClause = '';
    const values: any[] = [];
    let paramIndex = 1;
    
    // Build WHERE clause based on entity type
    switch (kind) {
      case 'contractor':
        whereClause = `WHERE LOWER(contractor_id) = LOWER($${paramIndex})`;
        countWhereClause = whereClause;
        values.push(code);
        paramIndex++;
        break;
        
      case 'customer':
        whereClause = `WHERE LOWER(customer_id) = LOWER($${paramIndex})`;
        countWhereClause = whereClause;
        values.push(code);
        paramIndex++;
        break;
        
      case 'center':
        whereClause = `WHERE LOWER(center_id) = LOWER($${paramIndex})`;
        countWhereClause = whereClause;
        values.push(code);
        paramIndex++;
        break;
        
      case 'crew':
        const crewResult = await pool.query(
          'SELECT assigned_center FROM crew WHERE LOWER(crew_id) = LOWER($1) LIMIT 1',
          [code]
        );
        const centerCode = crewResult.rowCount ? crewResult.rows[0].assigned_center : null;
        if (!centerCode) {
          return res.json({ items: [], total: 0 });
        }
        whereClause = `WHERE LOWER(center_id) = LOWER($${paramIndex})`;
        countWhereClause = whereClause;
        values.push(centerCode);
        paramIndex++;
        break;
        
      default:
        return res.json({ items: [], total: 0 });
    }
    
    // Add search condition if provided
    if (search) {
      const searchFields = ['center_id', 'name', 'main_contact', 'email', 'phone'];
      const searchClause = buildSearchClause(searchFields, paramIndex);
      whereClause += ` AND ${searchClause}`;
      countWhereClause += ` AND ${searchClause}`;
      values.push(`%${search}%`);
      paramIndex++;
    }
    
    // Add pagination
    values.push(limit, offset);
    
    const query = `
      SELECT center_id, cks_manager, name, main_contact, address, 
             phone, email, contractor_id, customer_id
      FROM centers ${whereClause}
      ORDER BY center_id
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const countQuery = `SELECT COUNT(*) FROM centers ${countWhereClause}`;
    
    const [items, total] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, values.slice(0, -2)) // Exclude limit/offset
    ]);
    
    res.json({
      items: items.rows,
      total: Number(total.rows[0].count),
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    });
  } catch (e: any) {
    console.error(`Centers fetch error for ${code}:`, e);
    res.status(500).json({
      error: 'Database error',
      message: 'Failed to fetch centers'
    });
  }
});

// Get customers related to a contractor
router.get('/:code/customers', async (req: Request, res: Response) => {
  const code = String(req.params.code || '');
  const limit = Math.min(parseInt(String(req.query.limit ?? '10'), 10), 100);
  const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
  const search = String(req.query.q ?? '').trim();
  
  try {
    // Get all customer IDs associated with this contractor
    const idsResult = await pool.query(
      `SELECT DISTINCT customer_id 
       FROM centers 
       WHERE LOWER(contractor_id) = LOWER($1)`,
      [code]
    );
    
    const customerIds = idsResult.rows.map(r => r.customer_id).filter(Boolean);
    
    if (!customerIds.length) {
      return res.json({ items: [], total: 0 });
    }
    
    // Build query for customer details
    let whereClause = 'WHERE customer_id = ANY($1)';
    const values: any[] = [customerIds];
    let paramIndex = 2;
    
    if (search) {
      const searchFields = ['customer_id', 'company_name', 'main_contact', 'email', 'phone'];
      const searchClause = buildSearchClause(searchFields, paramIndex);
      whereClause += ` AND ${searchClause}`;
      values.push(`%${search}%`);
      paramIndex++;
    }
    
    values.push(limit, offset);
    
    const query = `
      SELECT customer_id, cks_manager, company_name, num_centers,
             main_contact, address, phone, email
      FROM customers ${whereClause}
      ORDER BY customer_id
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const countQuery = `SELECT COUNT(*) FROM customers ${whereClause}`;
    
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
    console.error(`Customers fetch error for ${code}:`, e);
    res.status(500).json({
      error: 'Database error',
      message: 'Failed to fetch customers'
    });
  }
});

// Get contractor for a center
router.get('/:code/contractor', async (req: Request, res: Response) => {
  const code = String(req.params.code || '');
  
  try {
    const centerResult = await pool.query(
      'SELECT contractor_id FROM centers WHERE LOWER(center_id) = LOWER($1) LIMIT 1',
      [code]
    );
    
    if (!centerResult.rowCount || !centerResult.rows[0].contractor_id) {
      return res.json({ item: null });
    }
    
    const contractorResult = await pool.query(
      'SELECT * FROM contractors WHERE contractor_id = $1 LIMIT 1',
      [centerResult.rows[0].contractor_id]
    );
    
    res.json({
      item: contractorResult.rows[0] || null
    });
  } catch (e: any) {
    console.error(`Contractor fetch error for center ${code}:`, e);
    res.status(500).json({
      error: 'Database error',
      message: 'Failed to fetch contractor'
    });
  }
});

// Placeholder for jobs endpoint
router.get('/:code/jobs', async (_req: Request, res: Response) => {
  // TODO: Implement when jobs table is ready
  return res.json({
    items: [],
    total: 0,
    message: 'Jobs feature coming soon'
  });
});

// Get activity/timeline for an entity
router.get('/:code/activity', async (req: Request, res: Response) => {
  const code = String(req.params.code || '');
  const limit = Math.min(parseInt(String(req.query.limit ?? '20'), 10), 100);
  
  // TODO: Implement when activity tracking is ready
  return res.json({
    items: [],
    total: 0,
    message: 'Activity tracking coming soon'
  });
});

export default router;