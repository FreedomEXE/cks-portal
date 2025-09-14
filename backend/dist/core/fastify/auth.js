"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateFastify = authenticateFastify;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connection_1 = __importDefault(require("../../db/connection"));
async function authenticateFastify(req, reply) {
    try {
        // If a previous mock/auth hook already populated req.user, trust it (dev/testing)
        if (req.user) {
            return;
        }
        const token = extractToken(req);
        if (!token) {
            return reply.code(401).send({ success: false, error: { code: 'AUTH_MISSING_TOKEN', message: 'Authentication required', timestamp: new Date().toISOString() } });
        }
        const payload = verifyToken(token);
        if (!payload) {
            return reply.code(401).send({ success: false, error: { code: 'AUTH_INVALID_TOKEN', message: 'Invalid token', timestamp: new Date().toISOString() } });
        }
        const userId = payload.user_id || payload.sub || payload.userId;
        if (!userId) {
            return reply.code(401).send({ success: false, error: { code: 'AUTH_MISSING_USER_ID', message: 'Invalid token payload', timestamp: new Date().toISOString() } });
        }
        const user = await loadUserFromDatabase(userId);
        if (!user) {
            return reply.code(401).send({ success: false, error: { code: 'AUTH_USER_NOT_FOUND', message: 'User not found', timestamp: new Date().toISOString() } });
        }
        const capabilities = await getUserCapabilities(userId, user.role_code);
        req.user = {
            userId: user.user_id,
            roleCode: user.role_code,
            capabilities,
            sessionId: payload.session_id,
            metadata: {
                templateVersion: user.template_version,
                userEmail: user.email,
                userName: user.user_name,
            },
        };
        req.roleContext = { role: (user.role_code || '').toLowerCase() };
    }
    catch (err) {
        req.log.error({ err }, 'authenticateFastify failed');
        return reply.code(500).send({ success: false, error: { code: 'AUTH_INTERNAL_ERROR', message: 'Authentication failed', timestamp: new Date().toISOString() } });
    }
}
function extractToken(req) {
    const auth = req.headers['authorization'];
    if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) {
        return auth.slice('Bearer '.length);
    }
    const x = req.headers['x-auth-token'];
    if (x && typeof x === 'string')
        return x;
    return null;
}
function verifyToken(token) {
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (jwtSecret) {
            return jsonwebtoken_1.default.verify(token, jwtSecret);
        }
        const clerkSecret = process.env.CLERK_SECRET_KEY;
        if (clerkSecret) {
            return jsonwebtoken_1.default.decode(token);
        }
        if (process.env.NODE_ENV === 'development') {
            reqConsoleWarnOnce();
            return jsonwebtoken_1.default.decode(token);
        }
        throw new Error('No JWT verification configured');
    }
    catch (e) {
        return null;
    }
}
let warned = false;
function reqConsoleWarnOnce() {
    if (!warned) {
        // eslint-disable-next-line no-console
        console.warn('JWT verification disabled for development');
        warned = true;
    }
}
async function loadUserFromDatabase(userId) {
    const result = await connection_1.default.query(`SELECT user_id, user_name, email, role_code, template_version, created_at, archived
     FROM users
     WHERE user_id = $1 AND archived = false`, [userId.toUpperCase()]);
    return result.rows?.[0] || null;
}
async function getUserCapabilities(userId, roleCode) {
    try {
        const basePermsResult = await connection_1.default.query(`SELECT DISTINCT perm_code FROM role_permissions WHERE role_code = $1`, [roleCode]);
        const baseCaps = new Set(basePermsResult.rows.map((r) => r.perm_code));
        const overridesResult = await connection_1.default.query(`SELECT perm_code, allow FROM user_permission_overrides WHERE user_id = $1`, [userId]);
        for (const ov of overridesResult.rows) {
            if (ov.allow)
                baseCaps.add(ov.perm_code);
            else
                baseCaps.delete(ov.perm_code);
        }
        return [...baseCaps].sort();
    }
    catch (e) {
        return [];
    }
}
//# sourceMappingURL=auth.js.map