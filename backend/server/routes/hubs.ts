/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * hubs.ts
 * 
 * Description: Hub-specific API endpoints with smart ID filtering
 * Function: Provides data for each role hub based on user ID and relationships
 * Importance: Critical - Connects frontend hubs to backend data with proper filtering
 * Connects to: Database pool, role detection, entity relationship tables
 * 
 * Notes: Each hub endpoint filters data based on requesting user's ID and role.
 *        Implements the smart ID relationship system mapped in frontend.
 *        Admin hub has full access, other hubs see filtered views.
 */

import express, { Request, Response } from 'express';
import pool from '../../../Database/db/pool';

const router = express.Router();

// Hub data types matching frontend schemas
interface EntityBase {
  id: string;
  status: 'active' | 'inactive' | 'pending';
  created_at?: string;
  updated_at?: string;
}

interface ContractorEntity extends EntityBase {
  contractor_id: string;
  cks_manager: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  business_type?: string;
}

interface ManagerEntity extends EntityBase {
  manager_id: string;
  manager_name: string;
  assigned_center: string;
  email?: string;
  phone?: string;
  territory?: string;
}

interface CustomerEntity extends EntityBase {
  customer_id: string;
  cks_manager: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  service_tier?: string;
}

interface CenterEntity extends EntityBase {
  center_id: string;
  cks_manager: string;
  center_name: string;
  customer_id: string;
  contractor_id: string;
  address?: string;
  operational_hours?: string;
}

interface CrewEntity extends EntityBase {
  crew_id: string;
  cks_manager: string;
  assigned_center: string;
  crew_name?: string;
  skills?: string[];
  certification_level?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get user role from user ID prefix
 */
function getUserRole(userId: string): string | null {
  const upperUserId = userId.toUpperCase();
  
  if (
    upperUserId === 'FREEDOM_EXE' ||
    upperUserId === 'FREEDOMEXE' ||
    upperUserId.includes('ADMIN')
  ) {
    return 'admin';
  }
  
  if (upperUserId.startsWith('MGR-')) return 'manager';
  if (upperUserId.startsWith('CUS-')) return 'customer';
  if (upperUserId.startsWith('CON-')) return 'contractor';
  if (upperUserId.startsWith('CEN-')) return 'center';
  if (upperUserId.startsWith('CRW-')) return 'crew';
  
  return null;
}

/**
 * Build WHERE clause for data filtering based on user role and ID
 */
function buildAccessFilter(userId: string, role: string, entityType: string): { where: string; params: any[] } {
  const params: any[] = [];
  let where = '';
  
  // Admin sees everything
  if (role === 'admin') {
    return { where: 'WHERE 1=1', params: [] };
  }
  
  switch (entityType) {
    case 'contractors':
      if (role === 'contractor') {
        where = 'WHERE UPPER(contractor_id) = UPPER($1)';
        params.push(userId);
      } else if (role === 'manager') {
        where = 'WHERE UPPER(cks_manager) = UPPER($1)';
        params.push(userId);
      }
      break;
      
    case 'customers':
      if (role === 'customer') {
        where = 'WHERE UPPER(customer_id) = UPPER($1)';
        params.push(userId);
      } else if (role === 'manager') {
        where = 'WHERE UPPER(cks_manager) = UPPER($1)';
        params.push(userId);
      }
      break;
      
    case 'centers':
      if (role === 'center') {
        where = 'WHERE UPPER(center_id) = UPPER($1)';
        params.push(userId);
      } else if (role === 'customer') {
        where = 'WHERE UPPER(customer_id) = UPPER($1)';
        params.push(userId);
      } else if (role === 'contractor') {
        where = 'WHERE UPPER(contractor_id) = UPPER($1)';
        params.push(userId);
      } else if (role === 'manager') {
        where = 'WHERE UPPER(cks_manager) = UPPER($1)';
        params.push(userId);
      }
      break;
      
    case 'crew':
      if (role === 'crew') {
        where = 'WHERE UPPER(crew_id) = UPPER($1)';
        params.push(userId);
      } else if (role === 'center') {
        where = 'WHERE UPPER(assigned_center) = UPPER($1)';
        params.push(userId);
      } else if (role === 'manager') {
        where = 'WHERE UPPER(cks_manager) = UPPER($1)';
        params.push(userId);
      }
      break;
      
    default:
      // For other entities, default to manager access
      if (role === 'manager') {
        where = 'WHERE UPPER(cks_manager) = UPPER($1) OR UPPER(manager_id) = UPPER($1)';
        params.push(userId);
      }
  }
  
  // If no specific access rules, deny access
  if (!where) {
    where = 'WHERE 1=0'; // No results
  }
  
  return { where, params };
}

// ============================================
// HUB ENDPOINTS
// ============================================

/**
 * GET /contractors
 * Returns contractors visible to requesting user
 */
router.get('/contractors', async (req: Request, res: Response) => {
  try {
    const userId = String(req.headers['x-user-id'] || '');
    const role = getUserRole(userId);
    
    if (!role) {
      return res.status(403).json({ error: 'Invalid user role' });
    }
    
    const { where, params } = buildAccessFilter(userId, role, 'contractors');
    
    const query = `
      SELECT contractor_id, cks_manager, company_name, main_contact, address, phone, email
      FROM contractors 
      ${where}
      ORDER BY company_name ASC
    `;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      user_role: role,
      user_id: userId
    });
    
  } catch (error) {
    console.error('Contractors endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch contractors' });
  }
});

/**
 * GET /managers
 * Returns managers visible to requesting user
 */
router.get('/managers', async (req: Request, res: Response) => {
  try {
    const userId = String(req.headers['x-user-id'] || '');
    const role = getUserRole(userId);
    
    if (!role) {
      return res.status(403).json({ error: 'Invalid user role' });
    }
    
    const { where, params } = buildAccessFilter(userId, role, 'managers');
    
    const query = `
      SELECT manager_id, name, status, role, address, phone, email
      FROM managers 
      ${where}
      ORDER BY name ASC
    `;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      user_role: role,
      user_id: userId
    });
    
  } catch (error) {
    console.error('Managers endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch managers' });
  }
});

/**
 * GET /customers
 * Returns customers visible to requesting user
 */
router.get('/customers', async (req: Request, res: Response) => {
  try {
    const userId = String(req.headers['x-user-id'] || '');
    const role = getUserRole(userId);
    
    if (!role) {
      return res.status(403).json({ error: 'Invalid user role' });
    }
    
    const { where, params } = buildAccessFilter(userId, role, 'customers');
    
    const query = `
      SELECT customer_id, cks_manager, company_name, main_contact, address, phone, email
      FROM customers 
      ${where}
      ORDER BY company_name ASC
    `;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      user_role: role,
      user_id: userId
    });
    
  } catch (error) {
    console.error('Customers endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

/**
 * GET /centers
 * Returns centers visible to requesting user
 */
router.get('/centers', async (req: Request, res: Response) => {
  try {
    const userId = String(req.headers['x-user-id'] || '');
    const role = getUserRole(userId);
    
    if (!role) {
      return res.status(403).json({ error: 'Invalid user role' });
    }
    
    const { where, params } = buildAccessFilter(userId, role, 'centers');
    
    const query = `
      SELECT center_id, cks_manager, name, main_contact, address, phone, email, contractor_id, customer_id
      FROM centers 
      ${where}
      ORDER BY name ASC
    `;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      user_role: role,
      user_id: userId
    });
    
  } catch (error) {
    console.error('Centers endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch centers' });
  }
});

/**
 * GET /crew
 * Returns crew visible to requesting user
 */
router.get('/crew', async (req: Request, res: Response) => {
  try {
    const userId = String(req.headers['x-user-id'] || '');
    const role = getUserRole(userId);
    
    if (!role) {
      return res.status(403).json({ error: 'Invalid user role' });
    }
    
    const { where, params } = buildAccessFilter(userId, role, 'crew');
    
    const query = `
      SELECT crew_id, name, status, role, address, phone, email, assigned_center
      FROM crew 
      ${where}
      ORDER BY name ASC
    `;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      user_role: role,
      user_id: userId
    });
    
  } catch (error) {
    console.error('Crew endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch crew' });
  }
});

/**
 * GET /services
 * Returns services visible to requesting user
 */
router.get('/services', async (req: Request, res: Response) => {
  try {
    const userId = String(req.headers['x-user-id'] || '');
    const role = getUserRole(userId);
    
    if (!role) {
      return res.status(403).json({ error: 'Invalid user role' });
    }
    
    // Services are generally visible to all authenticated users
    const query = `
      SELECT service_id, service_name, category, status,
             description, pricing_model, requirements,
             created_at, updated_at
      FROM services 
      WHERE status = 'active'
      ORDER BY service_name ASC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      user_role: role,
      user_id: userId
    });
    
  } catch (error) {
    console.error('Services endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

export default router;