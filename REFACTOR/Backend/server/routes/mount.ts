/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: mount.ts
 *
 * Description: Route mounting middleware - handles /api/:role/* routing
 * Function: Route requests to appropriate role routers with context
 * Importance: Central routing hub that enables hybrid architecture
 * Connects to: Role context, authentication, role routers
 */

import { Request, Response, NextFunction, Application } from 'express';
import { roleContext } from '../core/auth/roleContext';
import { authenticate } from '../core/auth/authenticate';
import { ErrorHelpers } from '../core/http/errors';
import { getRoleRouter, isValidRole } from './index';

/**
 * Mount role-based routing to Express app
 */
export function mountRoleRoutes(app: Application) {
  // Mount the role routing middleware
  app.use('/api/:role', roleRoutingMiddleware);

  // Global health endpoint (no role required)
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || 'v1',
      environment: process.env.NODE_ENV || 'development',
      availableRoles: getAvailableRoles()
    });
  });

  // API documentation endpoint
  app.get('/api/docs', (req, res) => {
    res.json({
      title: 'CKS Portal API',
      version: process.env.API_VERSION || 'v1',
      description: 'Role-based API for CKS Portal system',
      roles: getAvailableRoles().map(role => ({
        role,
        endpoints: `/api/${role}/*`,
        docs: `/api/${role}/health`
      }))
    });
  });
}

/**
 * Role routing middleware
 * Handles /api/:role/* requests by routing to appropriate role router
 */
async function roleRoutingMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const roleCode = req.params.role?.toLowerCase();

    // Validate role exists
    if (!roleCode || !isValidRole(roleCode)) {
      return ErrorHelpers.badRequest(req, res, 'Invalid or unsupported role', {
        provided: req.params.role,
        available: getAvailableRoles()
      });
    }

    // Set role context
    roleContext(req, res, (err) => {
      if (err) {
        return ErrorHelpers.badRequest(req, res, 'Failed to set role context');
      }

      // Get the appropriate router for this role
      const router = getRoleRouter(roleCode);
      if (!router) {
        return ErrorHelpers.notFound(req, res, `Router for role ${roleCode}`);
      }

      // Remove the role from the path for the role router
      // e.g., /api/admin/dashboard -> /dashboard
      const originalUrl = req.url;
      const roleUrlPattern = new RegExp(`^/${roleCode}`);
      req.url = req.url.replace(roleUrlPattern, '') || '/';

      // Handle the request with the role router
      router(req, res, (routerError) => {
        // Restore original URL
        req.url = originalUrl;

        if (routerError) {
          // Let error handling middleware deal with it
          next(routerError);
        }
        // If router handled the request, we're done
      });
    });
  } catch (error) {
    console.error('Role routing error:', error);
    return ErrorHelpers.internal(req, res, 'Role routing failed');
  }
}

/**
 * Get available roles (convenience function)
 */
function getAvailableRoles(): string[] {
  return ['admin', 'manager']; // Add more as they're implemented
}