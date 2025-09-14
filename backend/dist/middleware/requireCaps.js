"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCaps = requireCaps;
exports.requireAnyCap = requireAnyCap;
exports.checkCaps = checkCaps;
exports.checkAnyCap = checkAnyCap;
exports.getMissingCaps = getMissingCaps;
exports.requireRole = requireRole;
exports.bypassAuth = bypassAuth;
const pool_1 = __importDefault(require("../../../Database/db/pool"));
/**
 * Middleware factory that creates capability requirement middleware
 * @param requiredCaps - Array of capability codes that user must have
 * @param mode - 'all' (default) requires all capabilities, 'any' requires at least one
 */
function requireCaps(...requiredCaps) {
    return async function (req, res, next) {
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
                await logAuthorizationFailure(req.user.userId, req.user.roleCode, requiredCaps, userCaps, req.path, req.method, req.ip, req.get('User-Agent'));
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
                await logAuthorizationSuccess(req.user.userId, req.user.roleCode, requiredCaps, req.path, req.method);
            }
            next();
        }
        catch (error) {
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
function requireAnyCap(...requiredCaps) {
    return async function (req, res, next) {
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
                await logAuthorizationFailure(req.user.userId, req.user.roleCode, requiredCaps, userCaps, req.path, req.method, req.ip, req.get('User-Agent'));
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    code: 'AUTH_INSUFFICIENT_CAPS',
                    required: `Any of: ${requiredCaps.join(', ')}`,
                    user: req.user.userId
                });
            }
            next();
        }
        catch (error) {
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
function checkCaps(userCaps, requiredCaps) {
    return requiredCaps.every(cap => userCaps.includes(cap));
}
/**
 * Check if user has any of the specified capabilities
 */
function checkAnyCap(userCaps, requiredCaps) {
    return requiredCaps.some(cap => userCaps.includes(cap));
}
/**
 * Get missing capabilities for a user
 */
function getMissingCaps(userCaps, requiredCaps) {
    return requiredCaps.filter(cap => !userCaps.includes(cap));
}
/**
 * Log authorization failure for audit trail
 */
async function logAuthorizationFailure(userId, userRole, requiredCaps, userCaps, path, method, ip, userAgent) {
    try {
        await pool_1.default.query(`SELECT log_activity($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [
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
        ]);
    }
    catch (error) {
        console.error('Failed to log authorization failure:', error);
    }
}
/**
 * Log successful authorization for high-privilege operations
 */
async function logAuthorizationSuccess(userId, userRole, caps, path, method) {
    try {
        await pool_1.default.query(`SELECT log_activity($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [
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
            null // userAgent
        ]);
    }
    catch (error) {
        console.error('Failed to log authorization success:', error);
    }
}
/**
 * Determine if operation requires high-privilege logging
 */
function isHighPrivilegeOperation(caps) {
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
function requireRole(role) {
    return requireCaps(`role:${role}`);
}
/**
 * Development helper to bypass capability checks
 */
function bypassAuth() {
    return function (req, res, next) {
        if (process.env.NODE_ENV !== 'development') {
            return res.status(403).json({ error: 'Auth bypass only available in development' });
        }
        console.warn('⚠️  Authorization bypass enabled (development only)');
        next();
    };
}
//# sourceMappingURL=requireCaps.js.map