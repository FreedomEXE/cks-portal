"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOrders = listOrders;
exports.getOrder = getOrder;
exports.updateOrderStatus = updateOrderStatus;
const connection_1 = __importDefault(require("../../db/connection"));
async function listOrders(query) {
    const where = [];
    const vals = [];
    if (query.status) {
        vals.push(query.status);
        where.push(`status = $${vals.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limit = Math.min(Math.max(query.limit || 25, 1), 200);
    const offset = Math.max(((query.page || 1) - 1) * limit, 0);
    const sql = `
    SELECT order_id, status, customer_id, contractor_id, total_amount, created_at, updated_at
    FROM orders
    ${whereSql}
    ORDER BY created_at DESC NULLS LAST, order_id DESC
    LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}
  `;
    const res = await connection_1.default.query(sql, [...vals, limit, offset]);
    return res.rows;
}
async function getOrder(orderId) {
    const res = await connection_1.default.query(`SELECT order_id, status, customer_id, contractor_id, total_amount, created_at, updated_at
     FROM orders WHERE order_id = $1`, [orderId]);
    return res.rows?.[0] || null;
}
async function updateOrderStatus(orderId, status) {
    const res = await connection_1.default.query(`UPDATE orders SET status = $1, updated_at = NOW() WHERE order_id = $2
     RETURNING order_id, status, customer_id, contractor_id, total_amount, created_at, updated_at`, [status, orderId]);
    return res.rows?.[0] || null;
}
//# sourceMappingURL=repository.js.map