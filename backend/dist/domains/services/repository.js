"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listServices = listServices;
exports.getService = getService;
exports.updateService = updateService;
const connection_1 = __importDefault(require("../../db/connection"));
async function listServices(query) {
    const where = ['archived = false'];
    const vals = [];
    if (query.q) {
        vals.push(`%${query.q}%`);
        where.push(`(service_name ILIKE $${vals.length} OR description ILIKE $${vals.length})`);
    }
    if (query.status) {
        vals.push(query.status);
        where.push(`status = $${vals.length}`);
    }
    const sql = `
    SELECT service_id, service_name, description, category_id, unit, price, status, archived, created_at, updated_at
    FROM services
    WHERE ${where.join(' AND ')}
    ORDER BY service_name
    LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}
  `;
    const limit = Math.min(query.limit || 50, 200);
    const offset = Math.max(query.offset || 0, 0);
    const res = await connection_1.default.query(sql, [...vals, limit, offset]);
    return res.rows;
}
async function getService(serviceId) {
    const res = await connection_1.default.query(`SELECT service_id, service_name, description, category_id, unit, price, status, archived, created_at, updated_at
     FROM services WHERE service_id = $1`, [serviceId]);
    return res.rows?.[0] || null;
}
async function updateService(serviceId, updates) {
    const sets = [];
    const vals = [];
    const map = [
        ['service_name', 'service_name'],
        ['description', 'description'],
        ['price', 'price'],
        ['status', 'status'],
        ['unit', 'unit'],
        ['category_id', 'category_id']
    ];
    for (const [k, col] of map) {
        if (updates[k] !== undefined) {
            vals.push(updates[k]);
            sets.push(`${col} = $${vals.length}`);
        }
    }
    if (!sets.length)
        return await getService(serviceId);
    vals.push(serviceId);
    const sql = `UPDATE services SET ${sets.join(', ')}, updated_at = NOW() WHERE service_id = $${vals.length} RETURNING service_id, service_name, description, category_id, unit, price, status, archived, created_at, updated_at`;
    const res = await connection_1.default.query(sql, vals);
    return res.rows?.[0] || null;
}
//# sourceMappingURL=repository.js.map