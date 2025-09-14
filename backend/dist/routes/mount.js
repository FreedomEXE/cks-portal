"use strict";
/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.mountRoleRoutes = mountRoleRoutes;
const roleContext_1 = require("../core/auth/roleContext");
const authenticate_1 = require("../core/auth/authenticate");
const errors_1 = require("../core/http/errors");
const index_1 = require("./index");
const routes_factory_1 = require("../domains/catalog/routes.factory");
/**
 * Mount role-based routing to Express app
 */
function mountRoleRoutes(app) {
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
    // Global catalog endpoint (accessible to all authenticated users)
    const globalCatalogConfig = {
        capabilities: {
            view: 'catalog:view'
        },
        features: {
            browse: true,
            search: true,
            categories: true,
            myServices: false
        }
    };
    app.use('/api/catalog', authenticate_1.authenticate, (0, routes_factory_1.createCatalogRouter)(globalCatalogConfig));
}
/**
 * Role routing middleware
 * Handles /api/:role/* requests by routing to appropriate role router
 */
async function roleRoutingMiddleware(req, res, next) {
    try {
        const roleCode = req.params.role?.toLowerCase();
        // Validate role exists
        if (!roleCode || !(0, index_1.isValidRole)(roleCode)) {
            return errors_1.ErrorHelpers.badRequest(req, res, 'Invalid or unsupported role', {
                provided: req.params.role,
                available: getAvailableRoles()
            });
        }
        // Set role context
        (0, roleContext_1.roleContext)(req, res, (err) => {
            if (err) {
                return errors_1.ErrorHelpers.badRequest(req, res, 'Failed to set role context');
            }
            // Get the appropriate router for this role
            const router = (0, index_1.getRoleRouter)(roleCode);
            if (!router) {
                return errors_1.ErrorHelpers.notFound(req, res, `Router for role ${roleCode}`);
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
    }
    catch (error) {
        console.error('Role routing error:', error);
        return errors_1.ErrorHelpers.internal(req, res, 'Role routing failed');
    }
}
/**
 * Get available roles (convenience function)
 */
function getAvailableRoles() {
    return ['admin', 'manager']; // Add more as they're implemented
}
//# sourceMappingURL=mount.js.map