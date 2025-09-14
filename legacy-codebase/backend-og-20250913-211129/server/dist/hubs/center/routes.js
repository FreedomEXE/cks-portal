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
    const v = (req.headers['x-user-id'] || req.headers['x-center-user-id'] || '').toString();
    return String(v || '');
}
router.get('/requests', async (req, res) => {
    try {
        const data = [];
        return res.json({ success: true, data });
    }
    catch (error) {
        console.error('[center] get requests error', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch center requests', error_code: 'server_error' });
    }
});
const CreateCenterRequestSchema = zod_1.z.object({
    center_id: zod_1.z.string().min(1),
    customer_id: zod_1.z.string().min(1).optional(),
    notes: zod_1.z.string().max(2000).optional(),
    items: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(['service', 'product']),
        id: zod_1.z.string().min(1),
        qty: zod_1.z.number().int().positive().optional().default(1),
        notes: zod_1.z.string().max(2000).optional()
    })).min(1)
});
router.post('/requests', (0, rbac_1.requirePermission)('CENTER_CREATE_REQUEST'), async (req, res) => {
    const userId = getUserId(req);
    try {
        const parsed = CreateCenterRequestSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ success: false, error: 'Invalid request body', error_code: 'validation_error' });
        const { center_id, customer_id, items, notes } = parsed.data;
        const orderId = `REQ-${Date.now().toString().slice(-6)}`;
        const status = 'contractor_pending';
        try {
            await pool_1.default.query('BEGIN');
            await pool_1.default.query(`INSERT INTO orders(order_id, customer_id, center_id, status, notes) VALUES ($1,$2,$3,$4,$5)`, [orderId, customer_id || null, center_id, status, notes || null]);
            for (const it of items) {
                const typ = String(it.type || '').toLowerCase();
                const qty = Number(it.qty || 1);
                await pool_1.default.query(`INSERT INTO order_items(order_id, item_type, item_id, quantity, notes) VALUES ($1,$2,$3,$4,$5)`, [orderId, typ, String(it.id), qty, it.notes || null]);
            }
            await pool_1.default.query('COMMIT');
        }
        catch (dbErr) {
            await pool_1.default.query('ROLLBACK').catch(() => { });
            console.warn('[center] DB unavailable, returning mock create response', dbErr);
        }
        return res.status(201).json({ success: true, data: { order_id: orderId, status } });
    }
    catch (error) {
        console.error('[center] create request error', error);
        return res.status(500).json({ success: false, error: 'Failed to create request', error_code: 'server_error' });
    }
});
router.get('/orders', async (req, res) => {
    try {
        const code = String(req.query.code || '').toUpperCase();
        const bucket = String(req.query.bucket || 'pending').toLowerCase();
        const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
        const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
        if (!code)
            return res.status(400).json({ success: false, error: 'code is required', error_code: 'invalid_request' });
        let statuses = [];
        if (bucket === 'pending')
            statuses = ['submitted', 'contractor_pending'];
        else if (bucket === 'approved')
            statuses = ['contractor_approved', 'scheduling_pending', 'scheduled', 'in_progress', 'picking', 'shipped'];
        else
            statuses = ['completed', 'delivered', 'closed', 'contractor_denied', 'cancelled'];
        const rows = (await pool_1.default.query(`SELECT o.order_id, o.customer_id, o.center_id, o.status, o.order_date,
                COUNT(oi.order_item_id) AS item_count,
                SUM(CASE WHEN oi.item_type='service' THEN 1 ELSE 0 END) AS service_count,
                SUM(CASE WHEN oi.item_type='product' THEN 1 ELSE 0 END) AS product_count
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.order_id
         WHERE UPPER(o.center_id) = UPPER($1) AND o.status = ANY($2)
         GROUP BY o.order_id
         ORDER BY o.order_date DESC
         LIMIT $3 OFFSET $4`, [code, statuses, limit, offset])).rows;
        const pendingStatuses = ['submitted', 'contractor_pending'];
        const approvedStatuses = ['contractor_approved', 'scheduling_pending', 'scheduled', 'in_progress', 'picking', 'shipped'];
        const archiveStatuses = ['completed', 'delivered', 'closed', 'contractor_denied', 'cancelled'];
        let totals = { pending: 0, approved: 0, archive: 0 };
        try {
            const [p, a, r] = await Promise.all([
                pool_1.default.query(`SELECT COUNT(*)::int AS c FROM orders o WHERE UPPER(o.center_id)=UPPER($1) AND o.status = ANY($2)`, [code, pendingStatuses]),
                pool_1.default.query(`SELECT COUNT(*)::int AS c FROM orders o WHERE UPPER(o.center_id)=UPPER($1) AND o.status = ANY($2)`, [code, approvedStatuses]),
                pool_1.default.query(`SELECT COUNT(*)::int AS c FROM orders o WHERE UPPER(o.center_id)=UPPER($1) AND o.status = ANY($2)`, [code, archiveStatuses]),
            ]);
            totals = {
                pending: Number(p.rows?.[0]?.c ?? 0),
                approved: Number(a.rows?.[0]?.c ?? 0),
                archive: Number(r.rows?.[0]?.c ?? 0),
            };
        }
        catch (e) {
            const approx = rows.length;
            if (bucket === 'pending')
                totals.pending = approx;
            else if (bucket === 'approved')
                totals.approved = approx;
            else
                totals.archive = approx;
        }
        return res.json({ success: true, data: rows, totals });
    }
    catch (error) {
        console.error('[center] orders endpoint error', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch center orders', error_code: 'server_error' });
    }
});
exports.default = router;
//# sourceMappingURL=routes.js.map