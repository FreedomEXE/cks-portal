/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: requireCaps.ts
 * 
 * Description: Capability-based authorization middleware for CKS Portal
 * Function: Enforce RBAC checks by validating user capabilities
 * Importance: Protects sensitive endpoints and aligns with UI permission gating
 * Connects to: auth.ts (req.user.capabilities), Manager route modules
 * 
 * Notes: Works with auth.ts to provide fine-grained permission control
 */

import type { Request, Response, NextFunction } from 'express';
import pool from '../../../Database/db/pool';

/**
 * Middleware factory that creates capability requirement middleware
 * @param requiredCaps - Array of capability codes that user must have
 * @param mode - 'all' (default) requires all capabilities, 'any' requires at least one
 */
export function requireCaps(...requiredCaps: string[]) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          required: requiredCaps
        });
      }

      // If no capabilities required, proceed
      if (requiredCaps.length === 0) {
        return next();
      }

      // Check if user has required capabilities
      const userCaps = req.user.capabilities || [];
      const hasAllRequired = requiredCaps.every(cap => userCaps.includes(cap));

      if (!hasAllRequired) {
        // Log authorization failure for audit
        await logAuthorizationFailure(
          req.user.userId,
          req.user.roleCode,
          requiredCaps,
          userCaps,
          req.path,
          req.method,
          req.ip,
          req.get('User-Agent')
        );

        return res.status(403).json({ 
          error: 'Insufficient permissions',
          code: 'AUTH_INSUFFICIENT_CAPS',
          required: requiredCaps,
          missing: requiredCaps.filter(cap => !userCaps.includes(cap)),
          user: req.user.userId
        });
      }

      // Log successful authorization for high-privilege operations
      if (isHighPrivilegeOperation(requiredCaps)) {
        await logAuthorizationSuccess(
          req.user.userId,
          req.user.roleCode,
          requiredCaps,
          req.path,
          req.method
        );
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({ 
        error: 'Authorization check failed',
        code: 'AUTH_INTERNAL_ERROR'
      });
    }
  };
}

/**
 * Alternative capability check - requires ANY of the capabilities (OR logic)
 */
export function requireAnyCap(...requiredCaps: string[]) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          required: requiredCaps
        });
      }

      if (requiredCaps.length === 0) {
        return next();
      }

      const userCaps = req.user.capabilities || [];
      const hasAnyRequired = requiredCaps.some(cap => userCaps.includes(cap));

      if (!hasAnyRequired) {
        await logAuthorizationFailure(
          req.user.userId,
          req.user.roleCode,
          requiredCaps,
          userCaps,
          req.path,
          req.method,
          req.ip,
          req.get('User-Agent')
        );

        return res.status(403).json({ 
          error: 'Insufficient permissions',
          code: 'AUTH_INSUFFICIENT_CAPS',
          required: `Any of: ${requiredCaps.join(', ')}`,
          user: req.user.userId
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({ 
        error: 'Authorization check failed',
        code: 'AUTH_INTERNAL_ERROR'
      });
    }
  };
}

/**
 * Check capabilities without middleware (for programmatic use)
 */
export function checkCaps(userCaps: string[], requiredCaps: string[]): boolean {
  return requiredCaps.every(cap => userCaps.includes(cap));
}

/**
 * Check if user has any of the specified capabilities
 */
export function checkAnyCap(userCaps: string[], requiredCaps: string[]): boolean {
  return requiredCaps.some(cap => userCaps.includes(cap));
}

/**
 * Get missing capabilities for a user
 */
export function getMissingCaps(userCaps: string[], requiredCaps: string[]): string[] {
  return requiredCaps.filter(cap => !userCaps.includes(cap));
}

/**
 * Log authorization failure for audit trail
 */
async function logAuthorizationFailure(
  userId: string,
  userRole: string,
  requiredCaps: string[],
  userCaps: string[],
  path: string,
  method: string,
  ip?: string,
  userAgent?: string
) {
  try {
    await pool.query(
      `SELECT log_activity($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        userId,
        userRole,
        'authorization_failure',
        'security',
        `Access denied to ${method} ${path}`,
        'endpoint',
        path,
        JSON.stringify({
          required_capabilities: requiredCaps,
          user_capabilities: userCaps,
          missing_capabilities: getMissingCaps(userCaps, requiredCaps),
          endpoint: path,
          method: method,
          ip,
          userAgent
        }),
        null, // session_id
        ip,
        userAgent
      ]
    );
  } catch (error) {
    console.error('Failed to log authorization failure:', error);
  }
}

/**
 * Log successful authorization for high-privilege operations
 */
async function logAuthorizationSuccess(
  userId: string,
  userRole: string,
  caps: string[],
  path: string,
  method: string
) {
  try {
    await pool.query(
      `SELECT log_activity($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        userId,
        userRole,
        'authorization_success',
        'security',
        `High-privilege access granted to ${method} ${path}`,
        'endpoint',
        path,
        JSON.stringify({
          capabilities_used: caps,
          endpoint: path,
          method: method
        }),
        null, // session_id
        null, // ip
        null  // userAgent
      ]
    );
  } catch (error) {
    console.error('Failed to log authorization success:', error);
  }
}

/**
 * Determine if operation requires high-privilege logging
 */
function isHighPrivilegeOperation(caps: string[]): boolean {
  const highPrivilegeCaps = [
    'admin:full',
    'users:create',
    'users:delete',
    'permissions:modify',
    'system:configure',
    'data:export',
    'audit:view'
  ];

  return caps.some(cap => highPrivilegeCaps.includes(cap));
}

/**
 * Middleware to require specific role (convenience wrapper)
 */
export function requireRole(role: string) {
  return requireCaps(`role:${role}`);
}

/**
 * Development helper to bypass capability checks
 */
export function bypassAuth() {
  return function (req: Request, res: Response, next: NextFunction) {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'Auth bypass only available in development' });
    }
    
    console.warn('⚠️  Authorization bypass enabled (development only)');
    next();
  };
}
