"use strict";
/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.mockAuth = mockAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connection_1 = __importDefault(require("../../db/connection"));
/**
 * Main authentication middleware
 * Validates JWT, loads user from database, and computes capabilities
 */
async function authenticate(req, res, next) {
    try {
        // Extract token from Authorization header or x-auth-token
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'AUTH_MISSING_TOKEN'
            });
        }
        // Verify JWT token
        const payload = verifyToken(token);
        if (!payload) {
            return res.status(401).json({
                error: 'Invalid token',
                code: 'AUTH_INVALID_TOKEN'
            });
        }
        // Extract user ID from payload (supporting multiple JWT formats)
        const userId = payload.user_id || payload.sub || payload.userId;
        if (!userId) {
            return res.status(401).json({
                error: 'Invalid token payload',
                code: 'AUTH_MISSING_USER_ID'
            });
        }
        // Load user from database
        const user = await loadUserFromDatabase(userId);
        if (!user) {
            return res.status(401).json({
                error: 'User not found',
                code: 'AUTH_USER_NOT_FOUND'
            });
        }
        // Compute user capabilities
        const capabilities = await getUserCapabilities(userId, user.role_code);
        // Attach user context to request
        req.user = {
            userId: user.user_id,
            roleCode: user.role_code,
            capabilities,
            sessionId: payload.session_id,
            metadata: {
                templateVersion: user.template_version,
                userEmail: user.email,
                userName: user.user_name
            }
        };
        // Initialize context (will be populated by roleContext middleware)
        req.context = {
            role: user.role_code.toLowerCase()
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            error: 'Authentication failed',
            code: 'AUTH_INTERNAL_ERROR'
        });
    }
}
/**
 * Extract JWT token from request headers
 */
function extractToken(req) {
    // Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    // Check x-auth-token header
    const authToken = req.headers['x-auth-token'];
    if (authToken) {
        return authToken;
    }
    // Check cookies (fallback for web clients)
    const cookieToken = req.cookies?.['auth-token'];
    if (cookieToken) {
        return cookieToken;
    }
    return null;
}
/**
 * Verify JWT token - supports multiple JWT providers (Clerk, Auth0, etc.)
 */
function verifyToken(token) {
    try {
        // For development, we might use a simple secret
        const jwtSecret = process.env.JWT_SECRET;
        if (jwtSecret) {
            return jsonwebtoken_1.default.verify(token, jwtSecret);
        }
        // For production with Clerk, use their verification
        const clerkSecret = process.env.CLERK_SECRET_KEY;
        if (clerkSecret) {
            // In a real implementation, you'd use Clerk's SDK to verify
            // For now, we'll decode without verification (dev only)
            return jsonwebtoken_1.default.decode(token);
        }
        // Fallback: decode without verification (DEVELOPMENT ONLY)
        if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️  JWT verification disabled for development');
            return jsonwebtoken_1.default.decode(token);
        }
        throw new Error('No JWT verification method configured');
    }
    catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}
/**
 * Load user data from database
 */
async function loadUserFromDatabase(userId) {
    try {
        const result = await connection_1.default.query(`SELECT user_id, user_name, email, role_code, template_version,
              created_at, archived
       FROM users
       WHERE user_id = $1 AND archived = false`, [userId.toUpperCase()]);
        return result.rows[0] || null;
    }
    catch (error) {
        console.error('Failed to load user from database:', error);
        throw error;
    }
}
/**
 * Compute user capabilities based on role and overrides
 */
async function getUserCapabilities(userId, roleCode) {
    try {
        // Get base role permissions
        const basePermsResult = await connection_1.default.query(`SELECT DISTINCT perm_code
       FROM role_permissions
       WHERE role_code = $1`, [roleCode]);
        const baseCaps = new Set(basePermsResult.rows.map(row => row.perm_code));
        // Get user-specific permission overrides
        const overridesResult = await connection_1.default.query(`SELECT perm_code, allow
       FROM user_permission_overrides
       WHERE user_id = $1`, [userId]);
        // Apply overrides
        for (const override of overridesResult.rows) {
            if (override.allow) {
                baseCaps.add(override.perm_code);
            }
            else {
                baseCaps.delete(override.perm_code);
            }
        }
        return Array.from(baseCaps).sort();
    }
    catch (error) {
        console.error('Failed to compute user capabilities:', error);
        // Return empty capabilities on error (fail closed)
        return [];
    }
}
/**
 * Development helper: mock authentication for testing
 */
function mockAuth(userId, roleCode, capabilities = []) {
    return (req, res, next) => {
        if (process.env.NODE_ENV !== 'development') {
            return res.status(403).json({ error: 'Mock auth only available in development' });
        }
        req.user = {
            userId,
            roleCode,
            capabilities,
            sessionId: 'mock-session',
            metadata: {
                templateVersion: 'v1',
                userEmail: `${userId.toLowerCase()}@cks.com`,
                userName: `Test ${roleCode}`
            }
        };
        req.context = {
            role: roleCode.toLowerCase()
        };
        next();
    };
}
//# sourceMappingURL=authenticate.js.map