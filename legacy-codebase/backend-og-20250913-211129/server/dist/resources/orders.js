"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pool_1 = __importDefault(require("../../../Database/db/pool"));
const router = express_1.default.Router();
router.get('/:id', async (req, res) => {
    try {
        const id = String(req.params.id);
        const order = (await pool_1.default.query(`SELECT * FROM orders WHERE order_id=$1`, [id])).rows[0];
        if (!order)
            return res.status(404).json({ success: false, error: 'Order not found', error_code: 'not_found' });
        const items = (await pool_1.default.query(`SELECT order_item_id, item_type, item_id, quantity, notes FROM order_items WHERE order_id=$1 ORDER BY order_item_id`, [id])).rows;
        const approvals = (await pool_1.default.query(`SELECT approval_id, approver_type, status, note, decided_at FROM approvals WHERE order_id=$1 ORDER BY approval_id`, [id])).rows;
        return res.json({ success: true, data: { order, items, approvals } });
    }
    catch (error) {
        console.error('[orders] get detail error', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch order', error_code: 'server_error' });
    }
});
exports.default = router;
//# sourceMappingURL=orders.js.map