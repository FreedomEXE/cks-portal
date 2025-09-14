"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pool_1 = __importDefault(require("../../../../Database/db/pool"));
const zod_1 = require("zod");
const rbac_1 = require("../../src/auth/rbac");
const router = express_1.default.Router();
function getUserId(req) {
    const v = (req.headers['x-user-id'] || req.headers['x-manager-user-id'] || '').toString();
    return String(v || '');
}
router.get('/centers', async (req, res) => {
    try {
        const code = String(req.query.code || getUserId(req) || '').toUpperCase();
        if (!code)
            return res.status(400).json({ success: false, error: 'code required' });
        const rows = (await pool_1.default.query(`SELECT center_id AS id, center_name AS name FROM centers WHERE UPPER(cks_manager)=UPPER($1) ORDER BY center_name`, [code])).rows;
        return res.json({ success: true, data: rows });
    }
    catch (error) {
        console.error('[manager] centers list error', error);
        return res.status(500).json({ success: false, error: 'server_error' });
    }
});
router.get('/customers', async (req, res) => {
    try {
        const code = String(req.query.code || getUserId(req) || '').toUpperCase();
        if (!code)
            return res.status(400).json({ success: false, error: 'code required' });
        const rows = (await pool_1.default.query(`SELECT customer_id AS id, company_name AS name FROM customers WHERE UPPER(cks_manager)=UPPER($1) ORDER BY company_name`, [code])).rows;
        return res.json({ success: true, data: rows });
    }
    catch (error) {
        console.error('[manager] customers list error', error);
        return res.status(500).json({ success: false, error: 'server_error' });
    }
});
router.get('/profile', async (req, res) => {
    try {
        const headerId = getUserId(req);
        let code = '';
        let email = String(req.headers['x-user-email'] || '').trim();
        if (headerId && /^MGR-\d{3,}$/i.test(headerId)) {
            code = headerId.toUpperCase();
        }
        else if (headerId) {
            const r = await pool_1.default.query(`SELECT code, email FROM app_users WHERE clerk_user_id=$1`, [headerId]);
            if (r.rows.length) {
                code = r.rows[0].code;
                email = r.rows[0].email || email;
            }
        }
        if (!code && email) {
            const r = await pool_1.default.query(`SELECT code FROM app_users WHERE email=$1`, [email]);
            if (r.rows.length)
                code = r.rows[0].code;
        }
        if (code) {
            const m = await pool_1.default.query(`SELECT manager_id, manager_name, email, phone, territory, status, created_at
         FROM managers WHERE UPPER(manager_id)=UPPER($1) LIMIT 1`, [code]);
            if (m.rows.length) {
                const row = m.rows[0];
                return res.json({ success: true, data: {
                        manager_id: row.manager_id,
                        name: row.manager_name,
                        role: 'Territory Manager',
                        email: row.email || email || null,
                        phone: row.phone || null,
                        territory: row.territory || null,
                        status: row.status || 'active',
                        start_date: row.created_at
                    } });
            }
        }
        const sample = {
            manager_id: code || 'MGR-000',
            name: 'Manager Demo',
            role: 'Territory Manager',
            email: email || 'manager@demo.com',
            phone: '(555) 123-4567',
            territory: 'Demo Territory',
            status: 'Active',
            start_date: '2024-01-01'
        };
        return res.json({ success: true, data: sample });
    }
    catch (error) {
        console.error('Manager profile endpoint error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch manager profile', error_code: 'server_error' });
    }
});
router.get('/news', async (req, res) => {
    try {
        const limit = Number(req.query.limit || 3);
        const data = [
            { id: 'mgr-news-001', title: 'Territory performance review scheduled for Q4', date: '2025-08-15' },
            { id: 'mgr-news-002', title: 'New contractor onboarding process updated', date: '2025-08-12' },
            { id: 'mgr-news-003', title: 'Center capacity reports now available', date: '2025-08-10' }
        ].slice(0, Math.max(1, Math.min(10, limit)));
        return res.json({ success: true, data });
    }
    catch (error) {
        console.error('Manager news endpoint error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch manager news', error_code: 'server_error' });
    }
});
router.get('/requests', async (req, res) => {
    try {
        const bucket = String(req.query.bucket || 'needs_scheduling').toLowerCase();
        let statuses = [];
        if (bucket === 'needs_scheduling')
            statuses = ['contractor_approved', 'scheduling_pending'];
        else if (bucket === 'in_progress')
            statuses = ['scheduled', 'in_progress'];
        else
            statuses = ['completed', 'closed', 'cancelled'];
        const q = `
      SELECT o.order_id, o.customer_id, o.center_id, o.status, o.order_date,
             COUNT(oi.order_item_id) AS item_count,
             SUM(CASE WHEN oi.item_type='service' THEN 1 ELSE 0 END) AS service_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      WHERE o.status = ANY($1)
      GROUP BY o.order_id
      ORDER BY o.order_date DESC
      LIMIT 100
    `;
        const rows = (await pool_1.default.query(q, [statuses])).rows;
        const needsStatuses = ['contractor_approved', 'scheduling_pending'];
        const progressStatuses = ['scheduled', 'in_progress'];
        const archiveStatuses = ['completed', 'closed', 'cancelled'];
        let totals = { needs_scheduling: 0, in_progress: 0, archive: 0 };
        try {
            const [n, p, a] = await Promise.all([
                pool_1.default.query(`SELECT COUNT(*)::int AS c FROM orders o WHERE o.status = ANY($1)`, [needsStatuses]),
                pool_1.default.query(`SELECT COUNT(*)::int AS c FROM orders o WHERE o.status = ANY($1)`, [progressStatuses]),
                pool_1.default.query(`SELECT COUNT(*)::int AS c FROM orders o WHERE o.status = ANY($1)`, [archiveStatuses]),
            ]);
            totals = {
                needs_scheduling: Number(n.rows?.[0]?.c ?? 0),
                in_progress: Number(p.rows?.[0]?.c ?? 0),
                archive: Number(a.rows?.[0]?.c ?? 0),
            };
        }
        catch (e) {
            const approx = rows.length;
            if (bucket === 'needs_scheduling')
                totals.needs_scheduling = approx;
            else if (bucket === 'in_progress')
                totals.in_progress = approx;
            else
                totals.archive = approx;
        }
        return res.json({ success: true, data: rows, totals });
    }
    catch (error) {
        console.error('Manager requests endpoint error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch manager requests', error_code: 'server_error' });
    }
});
const ScheduleSchema = zod_1.z.object({
    center_id: zod_1.z.string().min(1),
    start: zod_1.z.string().min(1),
    end: zod_1.z.string().min(1)
});
router.post('/requests/:id/schedule', (0, rbac_1.requirePermission)('MANAGER_SCHEDULE'), async (req, res) => {
    const id = String(req.params.id);
    const parsed = ScheduleSchema.safeParse(req.body || {});
    try {
        if (!parsed.success)
            return res.status(400).json({ success: false, error: 'Invalid request body', error_code: 'validation_error' });
        const { center_id, start, end } = parsed.data;
        const jobId = `JOB-${Date.now().toString().slice(-6)}`;
        await pool_1.default.query('BEGIN');
        await pool_1.default.query(`INSERT INTO service_jobs(job_id, order_id, center_id, scheduled_start, scheduled_end, status) VALUES ($1,$2,$3,$4,$5,'scheduled')`, [jobId, id, center_id, new Date(start), new Date(end)]);
        await pool_1.default.query(`UPDATE orders SET status='scheduled', updated_at=NOW() WHERE order_id=$1`, [id]);
        await pool_1.default.query('COMMIT');
        return res.json({ success: true, data: { job_id: jobId, order_id: id, status: 'scheduled' } });
    }
    catch (error) {
        await pool_1.default.query('ROLLBACK').catch(() => { });
        console.error('Manager schedule error:', error);
        return res.status(500).json({ success: false, error: 'Failed to schedule request', error_code: 'server_error' });
    }
});
router.post('/jobs/:id/assign', async (req, res) => {
    const id = String(req.params.id);
    const { crew_id, role, hours_estimated } = req.body || {};
    try {
        if (!crew_id) {
            return res.status(400).json({ success: false, error: 'crew_id is required', error_code: 'invalid_request' });
        }
        await pool_1.default.query(`INSERT INTO job_assignments(job_id, crew_id, role, hours_estimated) VALUES ($1,$2,$3,$4)`, [id, crew_id, role || null, hours_estimated || null]);
        return res.status(201).json({ success: true, data: { job_id: id, crew_id } });
    }
    catch (error) {
        console.error('Manager assign error:', error);
        return res.status(500).json({ success: false, error: 'Failed to assign crew', error_code: 'server_error' });
    }
});
router.get('/dashboard', async (req, res) => {
    try {
        const code = String(req.query.code || '').trim() || getUserId(req);
        if (!code)
            return res.status(400).json({ success: false, error: 'code required' });
        const [contractors, customers, centers] = await Promise.all([
            pool_1.default.query('SELECT COUNT(*)::int as count FROM contractors WHERE UPPER(cks_manager) = UPPER($1)', [code]),
            pool_1.default.query('SELECT COUNT(*)::int as count FROM customers WHERE UPPER(cks_manager) = UPPER($1)', [code]),
            pool_1.default.query('SELECT COUNT(*)::int as count FROM centers WHERE UPPER(cks_manager) = UPPER($1)', [code])
        ]);
        const metrics = {
            contractors: contractors.rows[0]?.count || 0,
            customers: customers.rows[0]?.count || 0,
            centers: centers.rows[0]?.count || 0,
            crew: 0
        };
        return res.json({ success: true, data: metrics });
    }
    catch (error) {
        console.error('Manager dashboard endpoint error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch dashboard metrics', error_code: 'server_error' });
    }
});
router.get('/contractors', async (req, res) => {
    try {
        const code = String(req.query.code || '').trim() || getUserId(req);
        if (!code)
            return res.status(400).json({ success: false, error: 'code required' });
        const contractors = await pool_1.default.query(`SELECT 
        contractor_id,
        company_name,
        main_contact,
        email,
        phone,
        address,
        website,
        created_at
      FROM contractors 
      WHERE UPPER(cks_manager) = UPPER($1) 
      ORDER BY company_name`, [code]);
        const contractorsData = contractors.rows.map((contractor) => ({
            ...contractor,
            customer_count: 0,
            status: 'active'
        }));
        return res.json({ success: true, data: contractorsData });
    }
    catch (error) {
        console.error('Manager contractors endpoint error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch contractors', error_code: 'server_error' });
    }
});
exports.default = router;
//# sourceMappingURL=routes.js.map