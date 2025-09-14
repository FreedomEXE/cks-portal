"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pool_1 = __importDefault(require("../../../Database/db/pool"));
const router = express_1.default.Router();
const CLERK_ID_MAPPING = {
    'user_31RUgYZKtWjKZFX9xo9xhdvd5E': 'CUS-000',
};
function getUserRole(userId) {
    if (userId.startsWith('user_')) {
        const mappedId = CLERK_ID_MAPPING[userId];
        if (mappedId) {
            userId = mappedId;
            console.log(`[Clerk mapping] ${userId} -> ${mappedId}`);
        }
        else {
            console.warn(`[Clerk] No mapping for ${userId}`);
            return 'customer';
        }
    }
    const upperUserId = userId.toUpperCase();
    if (upperUserId === 'FREEDOM_EXE' ||
        upperUserId === 'FREEDOMEXE' ||
        upperUserId.includes('ADMIN')) {
        return 'admin';
    }
    if (upperUserId.startsWith('MGR-'))
        return 'manager';
    if (upperUserId.startsWith('CUS-'))
        return 'customer';
    if (upperUserId.startsWith('CON-'))
        return 'contractor';
    if (upperUserId.startsWith('CEN-'))
        return 'center';
    if (upperUserId.startsWith('CRW-'))
        return 'crew';
    return null;
}
function formatDisplayName(userId) {
    return userId
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace('EXE', '')
        .trim();
}
router.get('/me/profile', async (req, res) => {
    try {
        const userId = String(req.headers['x-user-id'] || 'FREEDOM_EXE');
        const overrideRole = req.query.role || 'customer';
        return res.json({
            id: userId,
            code: userId,
            role: overrideRole,
            name: formatDisplayName(userId),
            email: `${userId.toLowerCase().replace(/_/g, '.')}@cks-portal.com`,
            is_active: true,
            created_at: new Date().toISOString(),
            _source: 'OVERRIDE',
        });
    }
    catch (error) {
        console.error('[/me/profile] Error:', error);
        return res.status(500).json({
            error: 'Failed to fetch profile',
            message: error.message
        });
    }
});
router.get('/me', async (req, res) => {
    try {
        const userId = String(req.headers['x-user-id'] || 'FREEDOM_EXE');
        const role = getUserRole(userId);
        if (!role) {
            console.warn(`[/me] Unknown user type: ${userId}`);
            return res.status(400).json({
                error: `Unknown user type: ${userId}`
            });
        }
        console.log(`[/me] User: ${userId} | Role: ${role}`);
        return res.json({
            id: userId,
            code: userId,
            role: role,
            name: formatDisplayName(userId),
        });
    }
    catch (error) {
        console.error('[/me] Error:', error);
        return res.status(500).json({
            error: 'Failed to fetch user info',
            message: error.message
        });
    }
});
router.get('/me/manager', async (req, res) => {
    try {
        const userId = String(req.headers['x-user-id'] || '');
        const role = getUserRole(userId);
        if (role !== 'manager' && role !== 'admin') {
            return res.status(404).json({
                error: 'Not a manager',
                current_role: role
            });
        }
        return res.json({
            manager_id: userId,
            name: formatDisplayName(userId),
            role: 'manager',
        });
    }
    catch (error) {
        console.error('[/me/manager] Error:', error);
        return res.status(500).json({
            error: 'Manager check failed',
            message: error.message
        });
    }
});
router.get('/me/bootstrap', async (req, res) => {
    try {
        const rawId = String(req.headers['x-user-id'] || '').trim();
        const emailHeader = String(req.headers['x-user-email'] || '').trim();
        const emailQuery = String((req.query.email || '')).trim();
        const userId = rawId || '';
        const upper = userId.toUpperCase();
        const roleByPrefix = upper.startsWith('ADM-') ? 'admin'
            : upper.startsWith('MGR-') ? 'manager'
                : upper.startsWith('CON-') ? 'contractor'
                    : upper.startsWith('CUS-') ? 'customer'
                        : upper.startsWith('CEN-') ? 'center'
                            : upper.startsWith('CRW-') ? 'crew'
                                : upper.startsWith('WH-') ? 'warehouse'
                                    : '';
        if (roleByPrefix) {
            return res.json({ linked: true, user_id: userId, role: roleByPrefix, code: upper });
        }
        if (!userId) {
            return res.json({ linked: false, message: 'No user ID provided' });
        }
        const emailToMatch = emailHeader || emailQuery || null;
        const { rows } = await pool_1.default.query(`SELECT role, code, email, name, clerk_user_id FROM app_users WHERE clerk_user_id=$1 OR (email IS NOT NULL AND email=$2)`, [userId, emailToMatch]);
        if (rows.length === 0) {
            return res.json({ linked: false, user_id: userId, message: 'No app_users mapping found' });
        }
        const m = rows[0];
        if (!m.clerk_user_id && emailToMatch) {
            try {
                await pool_1.default.query(`UPDATE app_users SET clerk_user_id=$1, updated_at=NOW() WHERE email=$2`, [userId, emailToMatch]);
            }
            catch { }
        }
        return res.json({ linked: true, user_id: userId, role: m.role, code: m.code, email: m.email, name: m.name });
    }
    catch (error) {
        console.error('[/me/bootstrap] Error:', error);
        return res.status(500).json({ linked: false, error: error.message });
    }
});
router.get('/services', async (_req, res) => {
    return res.json({ items: [], total: 0 });
});
router.get('/jobs', async (_req, res) => {
    return res.json({ items: [], total: 0 });
});
router.get('/reports', async (_req, res) => {
    return res.json({ items: [], total: 0 });
});
router.get('/profile', async (req, res) => {
    const userId = String(req.headers['x-user-id'] || '');
    if (!userId) {
        return res.json({ profile: null });
    }
    return res.json({
        profile: {
            id: userId,
            name: formatDisplayName(userId),
            role: getUserRole(userId)
        }
    });
});
exports.default = router;
//# sourceMappingURL=me.js.map