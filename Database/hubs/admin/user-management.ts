/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Admin User Management Database Operations
 * 
 * Description: Centralized admin database operations for user CRUD
 * Function: Create, read, update, delete and archive users across all hubs
 * Importance: Critical - Consolidates scattered admin user logic
 */

import pool from '../../db/pool';
import { logActivity } from '../../../backend/server/resources/activity';

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generic next ID generator for tables using PREFIX-### patterns
export async function getNextIdGeneric(table: string, idColumn: string, prefix: string): Promise<string> {
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
export async function upsertAppUserByEmail(email: string | null | undefined, role: string, code: string, name?: string) {
  if (!email) return; // mapping by email is optional
  try {
    await pool.query(
      `INSERT INTO app_users (email, role, code, name, status)
       VALUES ($1,$2,$3,$4,'active')
       ON CONFLICT (email) DO UPDATE SET role=EXCLUDED.role, code=EXCLUDED.code, name=COALESCE(EXCLUDED.name, app_users.name), updated_at=NOW()`,
      [email, role, code, name || null]
    );
  } catch (error: any) {
    console.error('app_users upsert by email failed', error);
    throw error;
  }
}

// ============================================
// MANAGER OPERATIONS
// ============================================

export async function createManager(data: {
  manager_name: string;
  email?: string;
  phone?: string;
  territory?: string;
}) {
  const manager_id = await getNextIdGeneric('managers', 'manager_id', 'MGR-');
  const result = await pool.query(
    `INSERT INTO managers (manager_id, manager_name, email, phone, territory, status)
     VALUES ($1,$2,$3,$4,$5,'active') RETURNING *`,
    [manager_id, data.manager_name, data.email || null, data.phone || null, data.territory || null]
  );
  
  // Create app_users mapping
  await upsertAppUserByEmail(data.email, 'manager', manager_id, data.manager_name);
  
  // Log activity
  try {
    await logActivity('user_created', `Manager ${manager_id} created`, 'admin', 'admin', manager_id, 'manager', { 
      email: data.email || null 
    });
  } catch (e) {
    console.error('Activity logging failed:', e);
  }
  
  return result.rows[0];
}

export async function getManagers(limit = 25, offset = 0) {
  const result = await pool.query(
    `SELECT manager_id, manager_name, email, phone, territory, status, created_at 
     FROM managers 
     WHERE archived_at IS NULL 
     ORDER BY created_at DESC 
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  
  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM managers WHERE archived_at IS NULL`
  );
  
  return {
    items: result.rows,
    total: parseInt(countResult.rows[0].total),
    page: Math.floor(offset / limit) + 1,
    pageSize: limit
  };
}

export async function archiveManager(manager_id: string, admin_user_id = 'admin') {
  // Get manager info before archiving
  const existing = await pool.query('SELECT manager_id, manager_name FROM managers WHERE manager_id = $1', [manager_id]);
  if (existing.rowCount === 0) throw new Error('Manager not found');
  const managerName = existing.rows[0].manager_name;
  
  // Soft delete (archive) instead of hard delete
  const result = await pool.query(
    'UPDATE managers SET archived_at = NOW() WHERE manager_id = $1 RETURNING manager_id', 
    [manager_id]
  );
  
  if (result.rowCount === 0) throw new Error('Manager not found');
  
  // Log the deletion activity
  try {
    await logActivity('user_deleted', `Manager ${manager_id} (${managerName}) archived`, admin_user_id, 'admin', manager_id, 'manager', { 
      name: managerName 
    });
  } catch (e) {
    console.error('Activity logging failed:', e);
  }
  
  return { manager_id, message: `Manager ${manager_id} archived` };
}

export async function getArchivedManagers(limit = 25, offset = 0) {
  const result = await pool.query(
    `SELECT manager_id, manager_name, email, phone, territory, status, archived_at 
     FROM managers 
     WHERE archived_at IS NOT NULL 
     ORDER BY archived_at DESC 
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  
  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM managers WHERE archived_at IS NOT NULL`
  );
  
  return {
    items: result.rows,
    total: parseInt(countResult.rows[0].total),
    page: Math.floor(offset / limit) + 1,
    pageSize: limit
  };
}

// ============================================
// CONTRACTOR OPERATIONS  
// ============================================

export async function createContractor(data: {
  contractor_name: string;
  email?: string;
  phone?: string;
  service_area?: string;
}) {
  const contractor_id = await getNextIdGeneric('contractors', 'contractor_id', 'CON-');
  const result = await pool.query(
    `INSERT INTO contractors (contractor_id, contractor_name, email, phone, service_area, status)
     VALUES ($1,$2,$3,$4,$5,'active') RETURNING *`,
    [contractor_id, data.contractor_name, data.email || null, data.phone || null, data.service_area || null]
  );
  
  // Create app_users mapping
  await upsertAppUserByEmail(data.email, 'contractor', contractor_id, data.contractor_name);
  
  // Log activity
  try {
    await logActivity('user_created', `Contractor ${contractor_id} created`, 'admin', 'admin', contractor_id, 'contractor', { 
      email: data.email || null 
    });
  } catch (e) {
    console.error('Activity logging failed:', e);
  }
  
  return result.rows[0];
}

// ============================================
// CUSTOMER OPERATIONS
// ============================================

export async function createCustomer(data: {
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
}) {
  const customer_id = await getNextIdGeneric('customers', 'customer_id', 'CUS-');
  const result = await pool.query(
    `INSERT INTO customers (customer_id, company_name, contact_person, email, phone, address, status)
     VALUES ($1,$2,$3,$4,$5,$6,'active') RETURNING *`,
    [customer_id, data.company_name, data.contact_person || null, data.email || null, data.phone || null, data.address || null]
  );
  
  // Create app_users mapping
  await upsertAppUserByEmail(data.email, 'customer', customer_id, data.company_name);
  
  // Log activity
  try {
    await logActivity('user_created', `Customer ${customer_id} created`, 'admin', 'admin', customer_id, 'customer', { 
      email: data.email || null 
    });
  } catch (e) {
    console.error('Activity logging failed:', e);
  }
  
  return result.rows[0];
}