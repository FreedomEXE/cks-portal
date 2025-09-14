"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const pool_1 = __importDefault(require("../../../Database/db/pool"));
const rbac_1 = require("../src/auth/rbac");
const router = express_1.default.Router();
const ListQuery = zod_1.z.object({
    center_id: zod_1.z.string().min(1).optional(),
    customer_id: zod_1.z.string().min(1).optional(),
    kind: zod_1.z.enum(['praise', 'request', 'issue']).optional(),
    from: zod_1.z.string().optional(),
    to: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(25),
    offset: zod_1.z.coerce.number().int().nonnegative().default(0),
});
router.get('/', async (req, res) => {
    try {
        const q = ListQuery.safeParse(req.query);
        if (!q.success)
            return res.status(400).json({ success: false, error: 'validation_error' });
        const { center_id, customer_id, kind, from, to, limit, offset } = q.data;
        const where = [];
        const params = [];
        if (center_id) {
            params.push(center_id);
            where.push(`center_id = $${params.length}`);
        }
        if (customer_id) {
            params.push(customer_id);
            where.push(`customer_id = $${params.length}`);
        }
        if (kind) {
            params.push(kind);
            where.push(`kind = $${params.length}`);
        }
        if (from) {
            params.push(new Date(from));
            where.push(`created_at >= $${params.length}`);
        }
        if (to) {
            params.push(new Date(to));
            where.push(`created_at <= $${params.length}`);
        }
        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const rows = (await pool_1.default.query(`SELECT feedback_id, kind, title, center_id, customer_id, created_by_role, created_by_id, created_at
         FROM feedback ${whereSql}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset])).rows;
        const totalsRow = (await pool_1.default.query(`SELECT 
           SUM(CASE WHEN kind='praise' THEN 1 ELSE 0 END)::int AS praise,
           SUM(CASE WHEN kind='request' THEN 1 ELSE 0 END)::int AS request,
           SUM(CASE WHEN kind='issue' THEN 1 ELSE 0 END)::int AS issue
         FROM feedback ${whereSql}`, params)).rows[0] || { praise: 0, request: 0, issue: 0 };
        return res.json({ success: true, data: rows, totals: totalsRow });
    }
    catch (error) {
        console.error('[feedback] list error', error);
        return res.status(500).json({ success: false, error: 'server_error' });
    }
});
const CreateFeedback = zod_1.z.object({
    center_id: zod_1.z.string().min(1).optional(),
    customer_id: zod_1.z.string().min(1).optional(),
    kind: zod_1.z.enum(['praise', 'request', 'issue']),
    title: zod_1.z.string().min(1).max(200),
    message: zod_1.z.string().max(5000).optional(),
});
router.post('/', (0, rbac_1.requirePermission)('FEEDBACK_CREATE'), async (req, res) => {
    try {
        const body = CreateFeedback.safeParse(req.body);
        if (!body.success)
            return res.status(400).json({ success: false, error: 'validation_error' });
        const { center_id, customer_id, kind, title, message } = body.data;
        const feedbackId = `FDB-${Date.now().toString().slice(-8)}`;
        const role = (0, rbac_1.getRoleFromHeaders)(req);
        const uid = String(req.headers['x-user-id'] || '').toString() || `${role.toUpperCase()}-000`;
        await pool_1.default.query(`INSERT INTO feedback(feedback_id, kind, title, message, center_id, customer_id, created_by_role, created_by_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [feedbackId, kind, title, message || null, center_id || null, customer_id || null, role, uid]);
        return res.status(201).json({ success: true, data: { feedback_id: feedbackId } });
    }
    catch (error) {
        console.error('[feedback] create error', error);
        return res.status(500).json({ success: false, error: 'server_error' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const id = String(req.params.id);
        const row = (await pool_1.default.query(`SELECT * FROM feedback WHERE feedback_id=$1`, [id])).rows[0];
        if (!row)
            return res.status(404).json({ success: false, error: 'not_found' });
        return res.json({ success: true, data: row });
    }
    catch (error) {
        console.error('[feedback] detail error', error);
        return res.status(500).json({ success: false, error: 'server_error' });
    }
});
exports.default = router;
router.delete('/:id', (0, rbac_1.requirePermission)('FEEDBACK_CREATE'), async (req, res) => {
    try {
        const id = String(req.params.id);
        const has = await pool_1.default.query(`SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='feedback' AND column_name='archived_at'
    ) as e`);
        const exists = Boolean(has.rows[0]?.e);
        if (exists) {
            const r = await pool_1.default.query(`UPDATE feedback SET archived_at=NOW() WHERE feedback_id=$1 RETURNING feedback_id`, [id]);
            if (r.rowCount === 0)
                return res.status(404).json({ success: false, error: 'not_found' });
            return res.json({ success: true, data: { feedback_id: id }, message: 'Feedback archived' });
        }
        else {
            const r = await pool_1.default.query(`DELETE FROM feedback WHERE feedback_id=$1 RETURNING feedback_id`, [id]);
            if (r.rowCount === 0)
                return res.status(404).json({ success: false, error: 'not_found' });
            return res.json({ success: true, data: { feedback_id: id }, message: 'Feedback deleted' });
        }
    }
    catch (error) {
        console.error('[feedback] delete error', error);
        return res.status(500).json({ success: false, error: 'server_error' });
    }
});
//# sourceMappingURL=feedback.js.map