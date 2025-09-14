"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pool_1 = __importDefault(require("../../../../Database/db/pool"));
const router = express_1.default.Router();
function getUserRole(userId) {
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
router.get('/profile', async (req, res) => {
    try {
        const userId = String((req.headers['x-user-id'] || req.headers['x-crew-user-id'] || '').toString());
        const role = getUserRole(userId);
        if (!userId) {
            return res.status(401).json({ error: 'No user ID provided' });
        }
        if (role === 'admin') {
            const templateProfile = {
                crew_id: userId || 'CRW-000',
                name: 'Not Set',
                role: 'Not Set',
                status: 'Not Set',
                assigned_center: 'Not Assigned',
                phone: 'Not Set',
                email: 'Not Set',
                skills: [],
                certification_level: 'Not Set',
                hire_date: 'Not Set',
                manager: 'Not Assigned'
            };
            return res.json({
                success: true,
                data: templateProfile
            });
        }
        if (role === 'crew') {
            const query = `
        SELECT crew_id, name, status, role, address, phone, email, assigned_center
        FROM crew 
        WHERE UPPER(crew_id) = UPPER($1)
        ORDER BY name ASC
      `;
            const result = await pool_1.default.query(query, [userId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Crew member not found' });
            }
            return res.json({
                success: true,
                data: result.rows[0]
            });
        }
        return res.status(403).json({ error: 'Not authorized to view crew profiles' });
    }
    catch (error) {
        console.error('Crew profile endpoint error:', error);
        res.status(500).json({ error: 'Failed to fetch crew profile' });
    }
});
router.get('/tasks', async (req, res) => {
    try {
        const userId = String(req.headers['x-user-id'] || '');
        const role = getUserRole(userId);
        const code = String(req.query.code || '');
        const date = String(req.query.date || 'today');
        const templateTasks = [];
        res.json({
            success: true,
            data: templateTasks,
            date: date,
            crew_code: code || userId
        });
    }
    catch (error) {
        console.error('Crew tasks endpoint error:', error);
        res.status(500).json({ error: 'Failed to fetch crew tasks' });
    }
});
router.get('/training', async (req, res) => {
    try {
        const userId = String(req.headers['x-user-id'] || '');
        const role = getUserRole(userId);
        const code = String(req.query.code || '');
        const templateTraining = [];
        res.json({
            success: true,
            data: templateTraining,
            crew_code: code || userId
        });
    }
    catch (error) {
        console.error('Crew training endpoint error:', error);
        res.status(500).json({ error: 'Failed to fetch crew training' });
    }
});
router.get('/me', async (req, res) => {
    try {
        const userId = String(req.headers['x-user-id'] || '');
        const role = getUserRole(userId);
        if (!userId) {
            return res.status(401).json({ error: 'No user ID provided' });
        }
        const memberInfo = {
            crew_id: userId,
            role: role || 'crew',
            status: 'active',
            last_login: new Date().toISOString(),
            permissions: ['view_tasks', 'update_tasks', 'view_training']
        };
        res.json({
            success: true,
            data: memberInfo
        });
    }
    catch (error) {
        console.error('Crew me endpoint error:', error);
        res.status(500).json({ error: 'Failed to fetch crew info' });
    }
});
router.get('/member', async (req, res) => {
    try {
        const userId = String((req.headers['x-user-id'] || req.headers['x-crew-user-id'] || '').toString());
        const role = getUserRole(userId);
        const templateMemberDetails = {
            crew_id: userId || 'CRW-000',
            name: 'Not Set',
            position: 'Not Set',
            department: 'Not Set',
            assigned_center: 'Not Assigned',
            shift: 'Not Set',
            supervisor: 'Not Assigned',
            start_date: 'Not Set',
            certifications: [],
            contact: {
                phone: 'Not Set',
                email: 'Not Set'
            }
        };
        res.json({
            success: true,
            data: templateMemberDetails
        });
    }
    catch (error) {
        console.error('Crew member endpoint error:', error);
        res.status(500).json({ error: 'Failed to fetch crew member details' });
    }
});
router.get('/news', async (req, res) => {
    try {
        const userId = String((req.headers['x-user-id'] || req.headers['x-crew-user-id'] || '').toString());
        const limit = Number(req.query.limit || 3);
        const items = [];
        return res.json({ success: true, data: items });
    }
    catch (error) {
        console.error('Crew news endpoint error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch crew news', error_code: 'server_error' });
    }
});
router.get('/inbox', async (req, res) => {
    try {
        const userId = String((req.headers['x-user-id'] || req.headers['x-crew-user-id'] || '').toString());
        const limit = Number(req.query.limit || 5);
        const data = [];
        return res.json({ success: true, data });
    }
    catch (error) {
        console.error('Crew inbox endpoint error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch crew inbox', error_code: 'server_error' });
    }
});
exports.default = router;
//# sourceMappingURL=routes.js.map