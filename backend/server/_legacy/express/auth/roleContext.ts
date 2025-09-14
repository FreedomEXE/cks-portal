/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: roleContext.ts
 *
 * Description: Role context middleware - extracts role from URL path and sets request context
 * Function: Parse /api/:role/* paths and attach role context to request
 * Importance: Enables role-scoped routing while maintaining shared domain logic
 * Connects to: Role routers, domain factories, audit logging
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Extract role from URL path and set request context
 * Used for /api/:role/* routes to identify which role hub is being accessed
 */
export function roleContext(req: Request, res: Response, next: NextFunction) {
  // Extract role from path parameter
  const role = req.params.role?.toLowerCase();

  if (!role) {
    return res.status(400).json({
      error: 'Role parameter required',
      code: 'CONTEXT_MISSING_ROLE'
    });
  }

  // Validate role exists in our system
  const validRoles = ['admin', 'manager', 'contractor', 'customer', 'center', 'crew', 'warehouse'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      error: 'Invalid role',
      code: 'CONTEXT_INVALID_ROLE',
      validRoles
    });
  }

  // Initialize or update request context
  if (!req.context) {
    req.context = { role };
  } else {
    req.context.role = role;
  }

  // Extract domain from the next path segment if available
  const pathSegments = req.path.split('/').filter(Boolean);
  const roleIndex = pathSegments.findIndex(segment => segment === role);
  if (roleIndex >= 0 && pathSegments[roleIndex + 1]) {
    req.context.domain = pathSegments[roleIndex + 1];
  }

  // For contractor/customer/center/crew/warehouse roles, derive ecosystem context
  if (req.user && ['contractor', 'customer', 'center', 'crew', 'warehouse'].includes(role)) {
    req.context.ecosystem = deriveEcosystemContext(req.user.userId, role);
  }

  next();
}

/**
 * Derive ecosystem context from user ID and role
 * This determines which contractor ecosystem the user belongs to
 */
function deriveEcosystemContext(userId: string, role: string) {
  const ecosystem: any = {};

  // Extract entity ID and type from user ID format
  const [rolePrefix, entityId] = userId.split('-');

  switch (role) {
    case 'contractor':
      ecosystem.contractorId = userId;
      break;
    case 'customer':
      ecosystem.customerId = userId;
      // Customer's contractor will be resolved via database query
      break;
    case 'center':
      ecosystem.centerId = userId;
      // Center's customer and contractor will be resolved via database query
      break;
    case 'crew':
      ecosystem.crewId = userId;
      // Crew's contractor will be resolved via database query
      break;
    case 'warehouse':
      ecosystem.warehouseId = userId;
      // Warehouse's contractor (if any) will be resolved via database query
      break;
  }

  return ecosystem;
}

/**
 * Middleware to require specific role context
 */
export function requireRoleContext(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const currentRole = req.context?.role;

    if (!currentRole) {
      return res.status(400).json({
        error: 'Role context required',
        code: 'CONTEXT_MISSING'
      });
    }

    if (!allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        error: 'Role not allowed for this endpoint',
        code: 'CONTEXT_ROLE_FORBIDDEN',
        required: allowedRoles,
        current: currentRole
      });
    }

    next();
  };
}