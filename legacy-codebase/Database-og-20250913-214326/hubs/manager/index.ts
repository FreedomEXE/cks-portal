/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Manager Hub Database Operations
 * 
 * Description: Centralized database operations for Manager hub functionality
 * Function: Handle manager-specific data queries and business logic
 * Importance: Critical - Provides data layer for Manager hub features
 */

import pool from '../../db/pool';

// ============================================
// MANAGER PROFILE OPERATIONS
// ============================================

export async function getManagerProfile(manager_id: string) {
  try {
    const result = await pool.query(
      `SELECT manager_id, manager_name, email, phone, territory, status, created_at, updated_at
       FROM managers 
       WHERE manager_id = $1 AND archived_at IS NULL`,
      [manager_id]
    );

    if (result.rowCount === 0) {
      throw new Error('Manager not found or archived');
    }

    return result.rows[0];
  } catch (error) {
    console.error(`Error fetching manager profile for ${manager_id}:`, error);
    throw error;
  }
}

export async function updateManagerProfile(manager_id: string, updates: {
  manager_name?: string;
  email?: string;
  phone?: string;
  territory?: string;
}) {
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
    const result = await pool.query(
      `UPDATE managers 
       SET ${setClause.join(', ')}
       WHERE manager_id = $${paramIndex} AND archived_at IS NULL
       RETURNING manager_id, manager_name, email, phone, territory, status, updated_at`,
      values
    );

    if (result.rowCount === 0) {
      throw new Error('Manager not found or archived');
    }

    return result.rows[0];
  } catch (error) {
    console.error(`Error updating manager profile for ${manager_id}:`, error);
    throw error;
  }
}

// ============================================
// MANAGER'S CONTRACTORS
// ============================================

export async function getManagerContractors(manager_id: string, options: {
  limit?: number;
  offset?: number;
  status?: string;
  search?: string;
} = {}) {
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
      pool.query(baseQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2))
    ]);

    return {
      contractors: dataResult.rows,
      total: parseInt(countResult.rows[0].total),
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    };
  } catch (error) {
    console.error(`Error fetching contractors for manager ${manager_id}:`, error);
    throw error;
  }
}

// ============================================
// MANAGER'S CUSTOMERS  
// ============================================

export async function getManagerCustomers(manager_id: string, options: {
  limit?: number;
  offset?: number;
  status?: string;
  search?: string;
} = {}) {
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
      pool.query(baseQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2))
    ]);

    return {
      customers: dataResult.rows,
      total: parseInt(countResult.rows[0].total),
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    };
  } catch (error) {
    console.error(`Error fetching customers for manager ${manager_id}:`, error);
    throw error;
  }
}

// ============================================
// MANAGER'S CENTERS
// ============================================

export async function getManagerCenters(manager_id: string) {
  try {
    const result = await pool.query(
      `SELECT center_id, center_name, address, phone, email, 
              capacity, status, created_at, updated_at
       FROM centers
       WHERE cks_manager = $1 AND archived_at IS NULL
       ORDER BY center_name`,
      [manager_id]
    );

    return {
      centers: result.rows,
      total: result.rowCount
    };
  } catch (error) {
    console.error(`Error fetching centers for manager ${manager_id}:`, error);
    throw error;
  }
}

// ============================================
// MANAGER DASHBOARD STATISTICS
// ============================================

export async function getManagerDashboardStats(manager_id: string) {
  try {
    const queries = [
      // Active contractors count
      `SELECT COUNT(*) as count FROM contractors 
       WHERE cks_manager = $1 AND status = 'active' AND archived_at IS NULL`,

      // Active customers count  
      `SELECT COUNT(*) as count FROM customers
       WHERE cks_manager = $1 AND status = 'active' AND archived_at IS NULL`,

      // Centers count
      `SELECT COUNT(*) as count FROM centers
       WHERE cks_manager = $1 AND archived_at IS NULL`,

      // Recent activity count (last 30 days)
      `SELECT COUNT(*) as count FROM system_activity
       WHERE target_type IN ('contractor', 'customer', 'center') 
         AND metadata->>'manager_id' = $1
         AND created_at >= NOW() - INTERVAL '30 days'`
    ];

    const results = await Promise.all(
      queries.map(query => pool.query(query, [manager_id]))
    );

    return {
      active_contractors: parseInt(results[0].rows[0].count),
      active_customers: parseInt(results[1].rows[0].count),
      centers: parseInt(results[2].rows[0].count),
      recent_activity: parseInt(results[3].rows[0].count),
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching dashboard stats for manager ${manager_id}:`, error);
    throw error;
  }
}

// ============================================
// ASSIGNMENT OPERATIONS
// ============================================

export async function assignContractorToCustomer(
  manager_id: string,
  contractor_id: string,
  customer_id: string
) {
  try {
    // Verify manager owns both contractor and customer
    const verificationQuery = `
      SELECT 
        (SELECT COUNT(*) FROM contractors WHERE contractor_id = $2 AND cks_manager = $1) as contractor_check,
        (SELECT COUNT(*) FROM customers WHERE customer_id = $3 AND cks_manager = $1) as customer_check
    `;
    
    const verification = await pool.query(verificationQuery, [manager_id, contractor_id, customer_id]);
    const { contractor_check, customer_check } = verification.rows[0];

    if (contractor_check === 0) {
      throw new Error('Contractor not found or not assigned to this manager');
    }
    if (customer_check === 0) {
      throw new Error('Customer not found or not assigned to this manager');
    }

    // Update contractor assignment
    const result = await pool.query(
      `UPDATE contractors 
       SET assigned_customer = $1, updated_at = NOW()
       WHERE contractor_id = $2
       RETURNING contractor_id, contractor_name, assigned_customer`,
      [customer_id, contractor_id]
    );

    return result.rows[0];
  } catch (error) {
    console.error(`Error assigning contractor ${contractor_id} to customer ${customer_id}:`, error);
    throw error;
  }
}