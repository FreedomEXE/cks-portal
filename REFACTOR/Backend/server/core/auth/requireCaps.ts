/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: requireCaps.ts
 *
 * Description: Capability-based authorization middleware
 * Function: Guard endpoints by required capabilities
 * Importance: Ensures consistent permission enforcement across all domains
 * Connects to: authenticate.ts, user capabilities from database
 */

import { Request, Response, NextFunction } from 'express';
import { logActivity } from '../logging/audit';

/**
 * Require specific capabilities for endpoint access
 */
export function requireCaps(...requiredCaps: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userCaps = req.user.capabilities || [];
    const missingCaps = requiredCaps.filter(cap => !userCaps.includes(cap));

    if (missingCaps.length > 0) {
      // Log unauthorized access attempt
      await logActivity(
        req.user.userId,
        req.user.roleCode,
        'auth_denied',
        'authorization',
        `Access denied for ${req.method} ${req.path}`,
        'endpoint',
        req.path,
        {
          requiredCaps,
          userCaps,
          missingCaps,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        req.user.sessionId
      ).catch(err => console.error('Failed to log auth denial:', err));

      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'AUTH_FORBIDDEN',
        required: requiredCaps,
        missing: missingCaps,
        domain: req.context?.domain || 'unknown'
      });
    }

    // Log successful authorization
    await logActivity(
      req.user.userId,
      req.user.roleCode,
      'auth_success',
      'authorization',
      `Access granted for ${req.method} ${req.path}`,
      'endpoint',
      req.path,
      {
        requiredCaps,
        role: req.context?.role,
        domain: req.context?.domain,
        ip: req.ip
      },
      req.user.sessionId
    ).catch(err => console.error('Failed to log auth success:', err));

    next();
  };
}

/**
 * Require specific role (fallback for simple role-based checks)
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.roleCode.toLowerCase();
    const allowed = allowedRoles.some(role => role.toLowerCase() === userRole);

    if (!allowed) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'AUTH_FORBIDDEN',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
}

/**
 * Development bypass for testing (from existing middleware)
 */
export function bypassAuth() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'Auth bypass only available in development' });
    }

    // Mock user for development
    req.user = {
      userId: 'DEV-001',
      roleCode: 'admin',
      capabilities: ['*'], // All capabilities for development
      sessionId: 'dev-session',
      metadata: {
        templateVersion: 'v1',
        userEmail: 'dev@cks.com',
        userName: 'Development User'
      }
    };

    req.context = {
      role: 'admin'
    };

    next();
  };
}

/**
 * Check if user has ecosystem access (contractor owns entities)
 */
export function requireEcosystemAccess() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Admin and manager roles have broad access
    const globalRoles = ['admin', 'manager'];
    if (globalRoles.includes(req.user.roleCode.toLowerCase())) {
      return next();
    }

    // For contractor/customer/center/crew/warehouse, ensure ecosystem ownership
    // This will be implemented with specific domain logic
    // For now, pass through - specific domain repos will handle scoping
    next();
  };
}