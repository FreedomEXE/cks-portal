"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pool_1 = __importDefault(require("../../../../Database/db/pool"));
const rbac_1 = require("../../src/auth/rbac");
const router = express_1.default.Router();
function getUserId(req) {
    const v = (req.headers['x-user-id'] || req.headers['x-warehouse-user-id'] || '').toString();
    return String(v || '');
}
router.get('/profile', async (req, res) => {
    try {
        const userId = getUserId(req) || 'WH-000';
        const r = await pool_1.default.query(`SELECT warehouse_id, warehouse_name, address, manager_id, warehouse_type, phone, email, date_acquired, capacity, current_utilization, status
       FROM warehouses WHERE warehouse_id=$1`, [userId]);
        if (r.rows.length === 0) {
            const template = {
                warehouse_id: userId,
                warehouse_name: 'Not Set',
                manager_id: 'Not Assigned',
                address: 'Not Set',
                capacity: 0,
                current_utilization: 0,
                utilization_percentage: 0,
                status: 'Not Set'
            };
            return res.json({ success: true, data: template });
        }
        const row = r.rows[0];
        const utilization_percentage = row.capacity ? Math.round((Number(row.current_utilization || 0) / Number(row.capacity)) * 100) : 0;
        let manager = null;
        if (row.manager_id) {
            const mr = await pool_1.default.query(`SELECT manager_id, manager_name, email, phone FROM managers WHERE manager_id=$1`, [row.manager_id]);
            if (mr.rows.length)
                manager = mr.rows[0];
        }
        return res.json({ success: true, data: { ...row, utilization_percentage, manager } });
    }
    catch (error) {
        console.error('Warehouse profile endpoint error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch warehouse profile', error_code: 'server_error' });
    }
});
router.get('/dashboard', async (_req, res) => {
    try {
        const data = [
            { label: 'Total Inventory Items', value: 0, trend: 'No activity', color: '#8b5cf6' },
            { label: 'Low Stock Alerts', value: 0, trend: 'No activity', color: '#ef4444' },
            { label: 'Pending Shipments', value: 0, trend: 'No activity', color: '#f59e0b' },
            { label: 'Warehouse Utilization', value: '0%', color: '#10b981' },
            { label: 'Active Staff', value: 0, trend: 'No activity', color: '#3b7af7' },
            { label: 'Orders Processed Today', value: 0, trend: 'No activity', color: '#f97316' }
        ];
        return res.json({ success: true, data });
    }
    catch (error) {
        console.error('Warehouse dashboard endpoint error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch dashboard data', error_code: 'server_error' });
    }
});
router.get('/inventory', async (req, res) => {
    try {
        const warehouseId = getUserId(req) || 'WH-000';
        const { category, low_stock, limit = 25 } = req.query;
        let query = `
      SELECT 
        item_id,
        item_type,
        item_name,
        category,
        sku,
        quantity_on_hand,
        quantity_reserved,
        quantity_available,
        min_stock_level,
        max_stock_level,
        unit_cost,
        location_code,
        status,
        last_received_date,
        last_shipped_date,
        CASE WHEN quantity_available <= min_stock_level THEN true ELSE false END as is_low_stock
      FROM inventory_items 
      WHERE warehouse_id = $1
    `;
        const params = [warehouseId];
        let paramIndex = 2;
        if (category) {
            query += ` AND category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }
        if (low_stock === 'true') {
            query += ` AND quantity_available <= min_stock_level`;
        }
        query += ` ORDER BY item_name LIMIT $${paramIndex}`;
        params.push(Number(limit));
        const result = await pool_1.default.query(query, params);
        const totalsQuery = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN quantity_available <= min_stock_level THEN 1 END) as low_stock_count,
        SUM(quantity_on_hand * unit_cost) as total_value
      FROM inventory_items 
      WHERE warehouse_id = $1
    `;
        const totalsResult = await pool_1.default.query(totalsQuery, [warehouseId]);
        return res.json({
            success: true,
            data: result.rows,
            totals: totalsResult.rows[0]
        });
    }
    catch (error) {
        console.error('Warehouse inventory endpoint error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch inventory data', error_code: 'server_error' });
    }
});
router.get('/shipments', async (req, res) => {
    try {
        const warehouseId = getUserId(req) || 'WH-000';
        const { type, status, limit = 25 } = req.query;
        let query = `
      SELECT 
        ws.shipment_id,
        ws.order_id,
        o.center_id,
        o.order_date,
        o.order_kind,
        o.recurrence_interval,
        ws.shipment_type,
        ws.tracking_number,
        ws.carrier,
        ws.origin_address,
        ws.destination_address,
        ws.shipment_date,
        ws.expected_delivery_date,
        ws.actual_delivery_date,
        ws.status,
        ws.total_weight,
        ws.total_value,
        ws.notes,
        COUNT(si.shipment_item_id) as item_count,
        COALESCE(SUM(si.quantity),0) as total_qty
      FROM warehouse_shipments ws
      LEFT JOIN shipment_items si ON ws.shipment_id = si.shipment_id
      LEFT JOIN orders o ON o.order_id = ws.order_id
      WHERE ws.warehouse_id = $1
    `;
        const params = [warehouseId];
        let paramIndex = 2;
        if (type && ['inbound', 'outbound'].includes(type)) {
            query += ` AND ws.shipment_type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }
        if (status) {
            query += ` AND ws.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        query += ` GROUP BY ws.shipment_id, o.center_id, o.order_date ORDER BY ws.shipment_date DESC LIMIT $${paramIndex}`;
        params.push(Number(limit));
        const result = await pool_1.default.query(query, params);
        const statusQuery = `
      SELECT 
        status,
        COUNT(*) as count,
        shipment_type
      FROM warehouse_shipments 
      WHERE warehouse_id = $1 
      GROUP BY status, shipment_type
    `;
        const statusResult = await pool_1.default.query(statusQuery, [warehouseId]);
        const totals = statusResult.rows.reduce((acc, row) => {
            const key = `${row.shipment_type}_${row.status}`;
            acc[key] = Number(row.count);
            acc[row.status] = (acc[row.status] || 0) + Number(row.count);
            return acc;
        }, {});
        return res.json({
            success: true,
            data: result.rows,
            totals
        });
    }
    catch (error) {
        console.error('Warehouse shipments endpoint error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch shipments data', error_code: 'server_error' });
    }
});
router.get('/staff', async (req, res) => {
    try {
        const warehouseId = getUserId(req) || 'WH-000';
        const { status, limit = 25 } = req.query;
        let query = `
      SELECT 
        staff_id,
        staff_name,
        position,
        email,
        phone,
        shift_schedule,
        certifications,
        status,
        hire_date,
        created_at
      FROM warehouse_staff 
      WHERE warehouse_id = $1
    `;
        const params = [warehouseId];
        let paramIndex = 2;
        if (status) {
            query += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        query += ` ORDER BY staff_name LIMIT $${paramIndex}`;
        params.push(Number(limit));
        const result = await pool_1.default.query(query, params);
        return res.json({
            success: true,
            data: result.rows
        });
    }
    catch (error) {
        console.error('Warehouse staff endpoint error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch staff data', error_code: 'server_error' });
    }
});
router.get('/activity', async (req, res) => {
    try {
        const warehouseId = getUserId(req) || 'WH-000';
        const { type, limit = 50 } = req.query;
        let query = `
      SELECT 
        wal.log_id,
        wal.activity_type,
        wal.description,
        wal.quantity_change,
        wal.activity_timestamp,
        ii.item_name,
        ii.sku,
        ws.staff_name,
        wsh.tracking_number
      FROM warehouse_activity_log wal
      LEFT JOIN inventory_items ii ON wal.item_id = ii.item_id
      LEFT JOIN warehouse_staff ws ON wal.staff_id = ws.staff_id
      LEFT JOIN warehouse_shipments wsh ON wal.shipment_id = wsh.shipment_id
      WHERE wal.warehouse_id = $1
    `;
        const params = [warehouseId];
        let paramIndex = 2;
        if (type) {
            query += ` AND wal.activity_type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }
        query += ` ORDER BY wal.activity_timestamp DESC LIMIT $${paramIndex}`;
        params.push(Number(limit));
        const result = await pool_1.default.query(query, params);
        return res.json({
            success: true,
            data: result.rows
        });
    }
    catch (error) {
        console.error('Warehouse activity endpoint error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch activity data', error_code: 'server_error' });
    }
});
router.post('/inventory/adjust', (0, rbac_1.requirePermission)('WAREHOUSE_ADJUST'), async (req, res) => {
    try {
        const { item_id, quantity_change, reason } = req.body;
        const warehouseId = getUserId(req) || 'WH-000';
        const updateQuery = `
      UPDATE inventory_items 
      SET quantity_on_hand = quantity_on_hand + $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE item_id = $2 AND warehouse_id = $3
      RETURNING *
    `;
        const result = await pool_1.default.query(updateQuery, [quantity_change, item_id, warehouseId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Item not found' });
        }
        const logQuery = `
      INSERT INTO warehouse_activity_log (warehouse_id, activity_type, item_id, quantity_change, description)
      VALUES ($1, 'stock_adjustment', $2, $3, $4)
    `;
        await pool_1.default.query(logQuery, [warehouseId, item_id, quantity_change, reason || 'Manual inventory adjustment']);
        return res.json({
            success: true,
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('Warehouse inventory adjust endpoint error:', error);
        return res.status(500).json({ success: false, error: 'Failed to adjust inventory', error_code: 'server_error' });
    }
});
router.get('/orders', async (req, res) => {
    try {
        const warehouseId = getUserId(req) || 'WH-000';
        const { status = 'pending', limit = 25 } = req.query;
        const query = `
      SELECT 
        o.order_id,
        o.customer_id,
        o.center_id,
        o.order_date,
        o.total_amount,
        o.status,
        COUNT(oi.order_item_id) as item_count,
        COALESCE(SUM(oi.quantity),0) as total_qty,
        (
          SELECT a.approver_type FROM approvals a
          WHERE a.order_id = o.order_id AND a.status='approved'
          ORDER BY a.decided_at DESC NULLS LAST, a.approval_id DESC
          LIMIT 1
        ) as approved_by
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE ($2 = 'all' OR o.status = $2)
        AND (
          o.assigned_warehouse = $1 OR ($2 = 'pending' AND o.assigned_warehouse IS NULL)
        )
        AND oi.item_type IN ('product','supply')
      GROUP BY o.order_id
      ORDER BY o.order_date DESC 
      LIMIT $3
    `;
        const result = await pool_1.default.query(query, [warehouseId, status, Number(limit)]);
        return res.json({
            success: true,
            data: result.rows
        });
    }
    catch (error) {
        console.error('Warehouse orders endpoint error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch orders', error_code: 'server_error' });
    }
});
router.post('/orders/:id/assign', (0, rbac_1.requirePermission)('WAREHOUSE_ASSIGN'), async (req, res) => {
    try {
        const warehouseId = getUserId(req) || 'WH-000';
        const id = String(req.params.id);
        const r = await pool_1.default.query(`UPDATE orders SET assigned_warehouse=$1, updated_at=NOW() WHERE order_id=$2 RETURNING order_id, assigned_warehouse`, [warehouseId, id]);
        if (r.rowCount === 0)
            return res.status(404).json({ success: false, error: 'Order not found' });
        return res.json({ success: true, data: r.rows[0] });
    }
    catch (error) {
        console.error('Warehouse assign order error:', error);
        return res.status(500).json({ success: false, error: 'Failed to assign order', error_code: 'server_error' });
    }
});
router.post('/shipments', (0, rbac_1.requirePermission)('WAREHOUSE_SHIP'), async (req, res) => {
    const { order_id, carrier, tracking_number, destination_address } = req.body || {};
    const warehouseId = getUserId(req) || 'WH-000';
    if (!order_id)
        return res.status(400).json({ success: false, error: 'order_id is required' });
    const shipmentId = `SHP-${Date.now().toString().slice(-10)}`;
    try {
        await pool_1.default.query('BEGIN');
        await pool_1.default.query(`INSERT INTO warehouse_shipments(shipment_id, warehouse_id, shipment_type, carrier, tracking_number, destination_address, status)
       VALUES ($1,$2,'outbound',$3,$4,$5,'pending')`, [shipmentId, warehouseId, carrier || null, tracking_number || null, destination_address || null]);
        const items = (await pool_1.default.query(`SELECT order_item_id, item_id, item_type, quantity
       FROM order_items WHERE order_id=$1 AND item_type IN ('product','supply')`, [order_id])).rows;
        for (const it of items) {
            await pool_1.default.query(`INSERT INTO shipment_items(shipment_id, order_id, item_id, item_type, sku, item_name, quantity, unit_cost)
         SELECT $1, $2, ii.item_id, ii.item_type, ii.sku, ii.item_name, $3, ii.unit_cost
         FROM inventory_items ii WHERE ii.warehouse_id=$4 AND ii.item_id=$5`, [shipmentId, order_id, it.quantity, warehouseId, it.item_id]);
        }
        await pool_1.default.query(`UPDATE orders SET status='shipped', updated_at=NOW(), assigned_warehouse=COALESCE(assigned_warehouse,$1) WHERE order_id=$2`, [warehouseId, order_id]);
        await pool_1.default.query('COMMIT');
        return res.status(201).json({ success: true, data: { shipment_id: shipmentId, order_id, status: 'pending' } });
    }
    catch (error) {
        await pool_1.default.query('ROLLBACK').catch(() => { });
        console.error('Warehouse create shipment error:', error);
        return res.status(500).json({ success: false, error: 'Failed to create shipment', error_code: 'server_error' });
    }
});
exports.default = router;
router.patch('/shipments/:id/deliver', (0, rbac_1.requirePermission)('WAREHOUSE_SHIP'), async (req, res) => {
    try {
        const id = String(req.params.id);
        await pool_1.default.query('BEGIN');
        const sh = (await pool_1.default.query(`SELECT warehouse_id, order_id, destination_address FROM warehouse_shipments WHERE shipment_id=$1`, [id])).rows[0];
        if (!sh) {
            await pool_1.default.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Shipment not found' });
        }
        const warehouseId = sh.warehouse_id;
        const orderId = sh.order_id;
        const destAddress = sh.destination_address;
        const items = (await pool_1.default.query(`SELECT item_id, quantity FROM shipment_items WHERE shipment_id=$1`, [id])).rows;
        for (const it of items) {
            await pool_1.default.query(`UPDATE inventory_items
         SET quantity_on_hand = GREATEST(quantity_on_hand - $1, 0), last_shipped_date = NOW(), updated_at = NOW()
         WHERE warehouse_id=$2 AND item_id=$3`, [Number(it.quantity || 0), warehouseId, it.item_id]);
            await pool_1.default.query(`INSERT INTO warehouse_activity_log(warehouse_id, activity_type, item_id, quantity_change, description, shipment_id)
         VALUES ($1,'ship',$2,$3,$4,$5)`, [warehouseId, it.item_id, -Math.abs(Number(it.quantity || 0)), `Delivered order ${orderId}`, id]);
        }
        await pool_1.default.query(`UPDATE warehouse_shipments SET status='delivered', actual_delivery_date=NOW(), updated_at=NOW() WHERE shipment_id=$1`, [id]);
        const ord = (await pool_1.default.query(`SELECT order_kind, recurrence_interval FROM orders WHERE order_id=$1`, [orderId])).rows[0];
        if (ord && ord.order_kind === 'recurring') {
            await pool_1.default.query(`INSERT INTO warehouse_shipments(
           shipment_id, warehouse_id, order_id, shipment_type, destination_address, status, shipment_date, expected_delivery_date
         )
         VALUES ($1,$2,$3,'outbound',$4,'pending', NOW(),
           CASE WHEN lower(COALESCE($5,'')) LIKE '%week%'
                THEN NOW() + INTERVAL '7 days'
                WHEN lower(COALESCE($5,'')) LIKE '%month%'
                THEN NOW() + INTERVAL '1 month'
                ELSE NULL END
         )`, [`SHP-${Date.now().toString().slice(-10)}`, warehouseId, orderId, destAddress, ord.recurrence_interval || '']);
        }
        else {
            await pool_1.default.query(`UPDATE orders SET status='delivered', completion_date=NOW(), updated_at=NOW() WHERE order_id=$1`, [orderId]);
        }
        await pool_1.default.query('COMMIT');
        return res.json({ success: true, data: { shipment_id: id, status: 'delivered' } });
    }
    catch (error) {
        await pool_1.default.query('ROLLBACK').catch(() => { });
        console.error('Warehouse deliver shipment error:', error);
        return res.status(500).json({ success: false, error: 'Failed to update shipment status', error_code: 'server_error' });
    }
});
router.patch('/shipments/:id/cancel', (0, rbac_1.requirePermission)('WAREHOUSE_SHIP'), async (req, res) => {
    try {
        const id = String(req.params.id);
        await pool_1.default.query(`UPDATE warehouse_shipments SET status='cancelled', updated_at=NOW() WHERE shipment_id=$1`, [id]);
        await pool_1.default.query(`INSERT INTO warehouse_activity_log(warehouse_id, activity_type, description, shipment_id)
                      SELECT warehouse_id, 'cancel', 'Shipment cancelled', shipment_id FROM warehouse_shipments WHERE shipment_id=$1`, [id]);
        return res.json({ success: true, data: { shipment_id: id, status: 'cancelled' } });
    }
    catch (error) {
        console.error('Warehouse cancel shipment error:', error);
        return res.status(500).json({ success: false, error: 'Failed to cancel shipment', error_code: 'server_error' });
    }
});
//# sourceMappingURL=routes.js.map