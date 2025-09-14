"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pool_1 = __importDefault(require("../../../Database/db/pool"));
const router = express_1.default.Router();
function qp(qs) {
    return {
        q: String(qs.q ?? '').trim(),
        category: String(qs.category ?? '').trim(),
        type: String(qs.type ?? '').trim().toLowerCase(),
        active: qs.active === undefined ? undefined : String(qs.active).toLowerCase(),
        limit: Math.min(parseInt(String(qs.limit ?? '50'), 10), 200),
        offset: Math.max(parseInt(String(qs.offset ?? '0'), 10), 0),
    };
}
router.get('/items', async (req, res) => {
    try {
        const { q, category, type, active, limit, offset } = qp(req.query);
        const clauses = [];
        const values = [];
        if (q) {
            values.push(`%${q}%`);
            clauses.push(`(name ILIKE $${values.length} OR description ILIKE $${values.length})`);
        }
        if (category) {
            values.push(category);
            clauses.push(`category = $${values.length}`);
        }
        if (active === 'true' || active === 'false') {
            values.push(active === 'true' ? 'active' : 'inactive');
            clauses.push(`status = $${values.length}`);
        }
        const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
        const base = `
      (
        SELECT 
          service_id AS id,
          'service' AS type,
          service_name AS name,
          COALESCE(description, '') AS description,
          COALESCE(category, '') AS category,
          NULL::text AS sku,
          NULL::text AS unit,
          NULL::int AS price_cents,
          (status = 'active') AS active,
          created_at,
          updated_at
        FROM services
      )
      UNION ALL
      (
        SELECT 
          product_id AS id,
          'product' AS type,
          product_name AS name,
          COALESCE(description, '') AS description,
          COALESCE(category, '') AS category,
          NULL::text AS sku,
          COALESCE(unit, '') AS unit,
          ROUND((COALESCE(price, 0) * 100))::int AS price_cents,
          (status = 'active') AS active,
          created_at,
          updated_at
        FROM products
      )
    `;
        let query = `SELECT * FROM (${base}) AS catalog ${where} ORDER BY type, name LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
        const rows = (await pool_1.default.query(query, [...values, limit, offset])).rows;
        const filtered = type === 'service' || type === 'product' ? rows.filter(r => r.type === type) : rows;
        return res.json({ success: true, data: filtered });
    }
    catch (error) {
        console.error('[catalog] items error', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch catalog items', error_code: 'server_error' });
    }
});
router.get('/categories', async (_req, res) => {
    try {
        const q = `
      SELECT DISTINCT category FROM (
        SELECT COALESCE(category, '') AS category FROM services
        UNION ALL
        SELECT COALESCE(category, '') AS category FROM products
      ) t WHERE category <> '' ORDER BY category
    `;
        const rows = (await pool_1.default.query(q)).rows.map(r => r.category);
        return res.json({ success: true, data: rows });
    }
    catch (error) {
        console.error('[catalog] categories error', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch categories', error_code: 'server_error' });
    }
});
exports.default = router;
//# sourceMappingURL=catalog.js.map