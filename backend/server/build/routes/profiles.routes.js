"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pool_1 = __importDefault(require("../db/pool"));
const router = express_1.default.Router();
function searchClause(fields) {
    return '(' + fields.map(f => `COALESCE(${f}::text,'')`).join("||' '||") + ") ILIKE $3";
}
function getKindFromCode(code) {
    if (code === '000-A')
        return 'admin';
    if (/-B$|^B/.test(code))
        return 'contractor';
    if (/-C$|^C/.test(code))
        return 'customer';
    if (/-D$|^D/.test(code))
        return 'center';
    if (/-A$|^A/.test(code))
        return 'crew';
    return 'admin';
}
router.get('/:code/summary', async (req, res) => {
    const code = String(req.params.code || '').toUpperCase();
    const kind = getKindFromCode(code);
    try {
        if (kind === 'contractor') {
            const base = await pool_1.default.query('SELECT * FROM contractors WHERE UPPER(contractor_id)=UPPER($1) LIMIT 1', [code]);
            if (!base.rowCount)
                return res.status(404).json({ error: 'Not found' });
            const centers = await pool_1.default.query('SELECT COUNT(*) FROM centers WHERE UPPER(contractor_id)=UPPER($1)', [code]);
            const customers = await pool_1.default.query('SELECT COUNT(DISTINCT customer_id) FROM centers WHERE UPPER(contractor_id)=UPPER($1)', [code]);
            return res.json({ kind, identity: base.rows[0], stats: { centers: Number(centers.rows[0].count), customers: Number(customers.rows[0].count) } });
        }
        if (kind === 'customer') {
            const base = await pool_1.default.query('SELECT * FROM customers WHERE UPPER(customer_id)=UPPER($1) LIMIT 1', [code]);
            if (!base.rowCount)
                return res.status(404).json({ error: 'Not found' });
            const centers = await pool_1.default.query('SELECT COUNT(*) FROM centers WHERE UPPER(customer_id)=UPPER($1)', [code]);
            const contractors = await pool_1.default.query('SELECT COUNT(DISTINCT contractor_id) FROM centers WHERE UPPER(customer_id)=UPPER($1)', [code]);
            return res.json({ kind, identity: base.rows[0], stats: { centers: Number(centers.rows[0].count), contractors: Number(contractors.rows[0].count) } });
        }
        if (kind === 'center') {
            const base = await pool_1.default.query('SELECT * FROM centers WHERE UPPER(center_id)=UPPER($1) LIMIT 1', [code]);
            if (!base.rowCount)
                return res.status(404).json({ error: 'Not found' });
            const row = base.rows[0];
            row.center_name = row.name;
            return res.json({ kind, identity: row, stats: {} });
        }
        if (kind === 'crew') {
            const base = await pool_1.default.query('SELECT * FROM crew WHERE UPPER(crew_id)=UPPER($1) LIMIT 1', [code]);
            if (!base.rowCount)
                return res.status(404).json({ error: 'Not found' });
            return res.json({ kind, identity: base.rows[0], stats: {} });
        }
        if (kind === 'manager') {
            return res.json({ kind, identity: { manager_id: code }, stats: {} });
        }
        return res.json({ kind: 'admin', identity: { code: '000-A' }, stats: {} });
    }
    catch (e) {
        res.status(500).json({ error: 'DB error', details: String(e.message || e) });
    }
});
router.get('/:code/centers', async (req, res) => {
    const code = String(req.params.code || '').toUpperCase();
    const kind = getKindFromCode(code);
    const limit = Math.min(parseInt(String(req.query.limit ?? '10'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    const qstr = `%${String(req.query.q ?? '').trim()}%`;
    try {
        let where = '';
        let values = [];
        if (kind === 'contractor') {
            where = 'WHERE UPPER(contractor_id)=UPPER($1)';
            values = [code];
        }
        else if (kind === 'customer') {
            where = 'WHERE UPPER(customer_id)=UPPER($1)';
            values = [code];
        }
        else if (kind === 'center') {
            where = 'WHERE UPPER(center_id)=UPPER($1)';
            values = [code];
        }
        else if (kind === 'crew') {
            const r = await (await pool_1.default.query('SELECT assigned_center FROM crew WHERE UPPER(crew_id)=UPPER($1) LIMIT 1', [code]));
            const cen = r.rowCount ? r.rows[0].assigned_center : null;
            where = 'WHERE UPPER(center_id)=UPPER($1)';
            values = [cen || ''];
        }
        else {
            return res.json({ items: [], total: 0 });
        }
        const search = req.query.q ? ` AND ${searchClause(['center_id', 'name', 'main_contact', 'cks_manager', 'email', 'phone', 'address', 'contractor_id', 'customer_id'])}` : '';
        const rows = await pool_1.default.query(`SELECT center_id, cks_manager, name, main_contact, address, phone, email, contractor_id, customer_id
                          FROM centers ${where}${search}
                          ORDER BY center_id LIMIT $2 OFFSET $4`, [values[0], limit, qstr, offset]);
        const tot = await pool_1.default.query(`SELECT COUNT(*) FROM centers ${where}${search}`, [values[0], qstr]);
        res.json({ items: rows.rows, total: Number(tot.rows[0].count) });
    }
    catch (e) {
        res.status(500).json({ error: 'DB error', details: String(e.message || e) });
    }
});
router.get('/:code/customers', async (req, res) => {
    const code = String(req.params.code || '').toUpperCase();
    const limit = Math.min(parseInt(String(req.query.limit ?? '10'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    const qstr = `%${String(req.query.q ?? '').trim()}%`;
    try {
        const ids = await pool_1.default.query(`SELECT DISTINCT customer_id FROM centers WHERE UPPER(contractor_id)=UPPER($1)`, [code]);
        const list = ids.rows.map((r) => r.customer_id).filter(Boolean);
        if (!list.length)
            return res.json({ items: [], total: 0 });
        const rows = await pool_1.default.query(`SELECT * FROM customers WHERE customer_id = ANY($1)
        AND (${searchClause(['customer_id', 'company_name', 'main_contact', 'cks_manager', 'email', 'phone', 'address'])})
        ORDER BY customer_id LIMIT $2 OFFSET $3`, [list, limit, offset, qstr]).catch(async () => {
            const r2 = await pool_1.default.query(`SELECT * FROM customers WHERE customer_id = ANY($1) ORDER BY customer_id LIMIT $2 OFFSET $3`, [list, limit, offset]);
            return { rows: r2.rows };
        });
        const tot = await pool_1.default.query(`SELECT COUNT(*) FROM customers WHERE customer_id = ANY($1)`, [list]);
        res.json({ items: rows.rows, total: Number(tot.rows[0]?.count || list.length) });
    }
    catch (e) {
        res.status(500).json({ error: 'DB error', details: String(e.message || e) });
    }
});
router.get('/:code/contractor', async (req, res) => {
    const code = String(req.params.code || '').toUpperCase();
    try {
        const r = await pool_1.default.query('SELECT contractor_id FROM centers WHERE UPPER(center_id)=UPPER($1) LIMIT 1', [code]);
        if (!r.rowCount)
            return res.json({ item: null });
        const c = await pool_1.default.query('SELECT * FROM contractors WHERE contractor_id=$1 LIMIT 1', [r.rows[0].contractor_id]);
        res.json({ item: c.rows[0] || null });
    }
    catch (e) {
        res.status(500).json({ error: 'DB error', details: String(e.message || e) });
    }
});
router.get('/:code/jobs', async (_req, res) => {
    return res.json({ items: [], total: 0 });
});
exports.default = router;
