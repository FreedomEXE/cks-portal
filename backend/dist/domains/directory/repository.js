"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDirectory = listDirectory;
const connection_1 = __importDefault(require("../../db/connection"));
async function listDirectory(userId, scope, roleCode, q) {
    const values = [];
    const filters = [];
    if (q.q) {
        values.push(`%${q.q}%`);
        filters.push(`(name ILIKE $${values.length} OR email ILIKE $${values.length})`);
    }
    if (q.status) {
        values.push(q.status);
        filters.push(`status = $${values.length}`);
    }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const base = `
    (
      SELECT contractor_id::text AS id, 'contractor' AS type, name, email, phone, status, created_at
      FROM contractors WHERE archived = false
    )
    UNION ALL
    (
      SELECT customer_id::text AS id, 'customer' AS type, name, email, phone, status, created_at
      FROM customers WHERE archived = false
    )
    UNION ALL
    (
      SELECT center_id::text AS id, 'center' AS type, name, email, phone, status, created_at
      FROM centers WHERE archived = false
    )
    UNION ALL
    (
      SELECT crew_id::text AS id, 'crew' AS type, name, email, phone, status, created_at
      FROM crew WHERE archived = false
    )
    UNION ALL
    (
      SELECT warehouse_id::text AS id, 'warehouse' AS type, name, email, phone, status, created_at
      FROM warehouses WHERE archived = false
    )
  `;
    const limit = Math.min(q.limit || 50, 200);
    const offset = Math.max(((q.page || 1) - 1) * limit, 0);
    const sql = `SELECT * FROM (${base}) as d ${where} ORDER BY type, name LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    const res = await connection_1.default.query(sql, [...values, limit, offset]);
    let rows = res.rows;
    if (q.type)
        rows = rows.filter(r => r.type === q.type);
    return rows;
}
//# sourceMappingURL=repository.js.map