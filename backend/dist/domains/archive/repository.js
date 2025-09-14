"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listArchivedOrders = listArchivedOrders;
exports.restoreOrder = restoreOrder;
const connection_1 = __importDefault(require("../../db/connection"));
async function listArchivedOrders(limit = 25, page = 1) {
    const lim = Math.min(Math.max(limit, 1), 200);
    const off = Math.max((page - 1) * lim, 0);
    const res = await connection_1.default.query(`SELECT order_id, status, customer_id, contractor_id, total_amount, created_at, updated_at
     FROM orders WHERE status = 'archived'
     ORDER BY updated_at DESC NULLS LAST, order_id DESC
     LIMIT $1 OFFSET $2`, [lim, off]);
    return res.rows;
}
async function restoreOrder(orderId) {
    const res = await connection_1.default.query(`UPDATE orders SET status = 'pending', updated_at = NOW() WHERE order_id = $1 AND status = 'archived'`, [orderId]);
    return (res.rowCount || 0) > 0;
}
//# sourceMappingURL=repository.js.map