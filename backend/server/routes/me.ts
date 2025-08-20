/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * me.ts
 * 
 * Description: User authentication and profile management endpoints
 * Function: Links Clerk users with internal entities and provides profile data
 * Importance: Critical - Establishes user identity and role context
 * Connects to: Database for user mapping, role detection utilities
 * 
 * Notes: Uses modern ID prefixes for role detection.
 *        Provides unified profile endpoint for all user types.
 */

import express, { Request, Response, NextFunction } from 'express';
import { ok, bad, safe } from '../utils/http';
import pool from '../db/pool';
import { roleFromInternalCode } from '../utils/roles';

const router = express.Router();

// Extended request type with userId
interface AuthRequest extends Request {
  userId?: string;
}

// Authentication middleware
function requireUser(req: AuthRequest, res: Response, next: NextFunction) {
  const uid = req.header('x-user-id');
  if (!uid) {
    return bad(res, 'Authentication required', 401);
  }
  req.userId = uid;
  next();
}

// Check if user is linked to an internal entity
router.get('/me/bootstrap', requireUser, safe(async (req: AuthRequest, res: Response) => {
  const { rows } = await pool.query(
    `SELECT clerk_user_id, email, internal_code, role 
     FROM app_users 
     WHERE clerk_user_id = $1`,
    [req.userId]
  );
  
  if (!rows.length) {
    return ok(res, { linked: false });
  }
  
  const user = rows[0];
  ok(res, { 
    linked: true, 
    internal_code: user.internal_code, 
    role: user.role,
    email: user.email 
  });
}));

// Link user to internal entity
router.post('/me/link', requireUser, safe(async (req: AuthRequest, res: Response) => {
  const { internal_code, email } = req.body || {};
  
  if (!internal_code) {
    return bad(res, 'internal_code is required', 400);
  }

  // Special case for admin
  let exists = false;
  let entityType: string | null = null;
  
  if (internal_code === 'admin-000') {
    exists = true;
    entityType = 'admin';
  } else {
    // Check each entity table for the code
    const checks = [
      { table: 'crew', col: 'crew_id', prefix: 'crew-' },
      { table: 'contractors', col: 'contractor_id', prefix: 'con-' },
      { table: 'customers', col: 'customer_id', prefix: 'cust-' },
      { table: 'centers', col: 'center_id', prefix: 'ctr-' },
    ];
    
    for (const check of checks) {
      // Verify code starts with correct prefix
      if (!internal_code.toLowerCase().startsWith(check.prefix)) continue;
      
      const result = await pool.query(
        `SELECT 1 FROM ${check.table} WHERE LOWER(${check.col}) = LOWER($1) LIMIT 1`,
        [internal_code]
      );
      
      if (result.rowCount && result.rowCount > 0) {
        exists = true;
        entityType = check.table === 'contractors' ? 'contractor' :
                     check.table === 'customers' ? 'customer' :
                     check.table === 'centers' ? 'center' :
                     check.table === 'crew' ? 'crew' : null;
        break;
      }
    }
    
    // Check for manager codes
    if (!exists && internal_code.toLowerCase().startsWith('mgr-')) {
      exists = true;
      entityType = 'manager';
    }
  }
  
  if (!exists) {
    return bad(res, 'Invalid internal_code', 404);
  }

  const role = entityType || roleFromInternalCode(internal_code);
  if (!role) {
    return bad(res, 'Unable to determine role from internal_code', 400);
  }

  // Upsert user record
  await pool.query(
    `INSERT INTO app_users (clerk_user_id, email, role, internal_code, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     ON CONFLICT (clerk_user_id) DO UPDATE SET 
        role = EXCLUDED.role, 
        internal_code = EXCLUDED.internal_code,
        email = COALESCE(EXCLUDED.email, app_users.email),
        updated_at = NOW()`,
    [req.userId, email || null, role, internal_code]
  );

  ok(res, { 
    linked: true, 
    internal_code, 
    role,
    message: 'Successfully linked to account'
  });
}));

// Get user profile with entity data
router.get('/me/profile', requireUser, safe(async (req: AuthRequest, res: Response) => {
  const uid = req.userId;
  
  // Get user record
  const { rows } = await pool.query(
    `SELECT clerk_user_id, internal_code, role, email 
     FROM app_users 
     WHERE clerk_user_id = $1 
     LIMIT 1`,
    [uid]
  );
  
  if (!rows.length) {
    return res.status(404).json({ 
      error: 'User not linked',
      message: 'Please link your account to an internal code first'
    });
  }
  
  const user = rows[0];
  const internalCode: string = user.internal_code;
  const role = user.role || roleFromInternalCode(internalCode) || 'unknown';

  // Fetch entity data based on role
  let entityData: any = { 
    code: internalCode,
    email: user.email 
  };
  
  try {
    switch (role) {
      case 'crew':
        const crewResult = await pool.query(
          'SELECT * FROM crew WHERE LOWER(crew_id) = LOWER($1) LIMIT 1',
          [internalCode]
        );
        if (crewResult.rowCount) {
          entityData = { ...crewResult.rows[0], ...entityData };
        }
        break;
        
      case 'contractor':
        const contractorResult = await pool.query(
          'SELECT * FROM contractors WHERE LOWER(contractor_id) = LOWER($1) LIMIT 1',
          [internalCode]
        );
        if (contractorResult.rowCount) {
          entityData = { ...contractorResult.rows[0], ...entityData };
        }
        break;
        
      case 'customer':
        const customerResult = await pool.query(
          'SELECT * FROM customers WHERE LOWER(customer_id) = LOWER($1) LIMIT 1',
          [internalCode]
        );
        if (customerResult.rowCount) {
          entityData = { ...customerResult.rows[0], ...entityData };
        }
        break;
        
      case 'center':
        const centerResult = await pool.query(
          'SELECT * FROM centers WHERE LOWER(center_id) = LOWER($1) LIMIT 1',
          [internalCode]
        );
        if (centerResult.rowCount) {
          entityData = { ...centerResult.rows[0], ...entityData };
        }
        break;
        
      case 'manager':
        // Managers might not have a database record yet
        entityData = {
          manager_id: internalCode,
          name: user.email?.split('@')[0] || 'Manager',
          code: internalCode,
          email: user.email,
          role: 'manager'
        };
        break;
        
      case 'admin':
        entityData = {
          code: internalCode,
          admin: true,
          role: 'admin',
          email: user.email
        };
        break;
    }
  } catch (e: any) {
    // Log error but don't fail - return basic data
    console.error(`Failed to fetch entity data for ${role}:${internalCode}`, e);
  }

  return ok(res, { 
    kind: role, 
    data: entityData,
    internal_code: internalCode 
  });
}));

// Get user's accessible entities (for role switching)
router.get('/me/entities', requireUser, safe(async (req: AuthRequest, res: Response) => {
  const { rows } = await pool.query(
    `SELECT internal_code, role 
     FROM app_users 
     WHERE clerk_user_id = $1`,
    [req.userId]
  );
  
  if (!rows.length) {
    return ok(res, { entities: [] });
  }
  
  // In future, could support multiple linked entities
  ok(res, { 
    entities: rows.map(r => ({
      code: r.internal_code,
      role: r.role
    }))
  });
}));

export default router;