"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrdersForManager = getOrdersForManager;
exports.getOrderById = getOrderById;
exports.getOrderCountsByStatus = getOrderCountsByStatus;
exports.createOrder = createOrder;
exports.updateOrder = updateOrder;
/**
 * File: orders.repo.ts
 *
 * Description: DB access for orders (org/center scoped). for Manager Users
 * Function: Implement queries for listing and updating orders.
 * Importance: Underpins Manager order workflows and KPIs.
 * Connects to: orders.service.ts, dashboard KPIs.
 *
 * Notes: Complete implementation with manager-scoped queries.
 */
const connection_1 = require("../../../db/connection");
// Get orders for a manager (scoped by centers/customers they manage)
async function getOrdersForManager(managerId, filters) {
    let whereConditions = [
        `(c.cks_manager = $1 OR cu.cks_manager = $1)`
    ];
    let params = [managerId];
    let paramCount = 1;
    if (filters?.status) {
        paramCount++;
        whereConditions.push(`o.status = $${paramCount}`);
        params.push(filters.status);
    }
    if (filters?.priority) {
        paramCount++;
        whereConditions.push(`o.priority = $${paramCount}`);
        params.push(filters.priority);
    }
    if (filters?.customer_id) {
        paramCount++;
        whereConditions.push(`o.customer_id = $${paramCount}`);
        params.push(filters.customer_id);
    }
    if (filters?.center_id) {
        paramCount++;
        whereConditions.push(`o.center_id = $${paramCount}`);
        params.push(filters.center_id);
    }
    if (filters?.contractor_id) {
        paramCount++;
        whereConditions.push(`o.contractor_id = $${paramCount}`);
        params.push(filters.contractor_id);
    }
    if (filters?.date_from) {
        paramCount++;
        whereConditions.push(`o.scheduled_date >= $${paramCount}`);
        params.push(filters.date_from);
    }
    if (filters?.date_to) {
        paramCount++;
        whereConditions.push(`o.scheduled_date <= $${paramCount}`);
        params.push(filters.date_to);
    }
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const sql = `
    SELECT 
      o.*,
      cu.company_name as customer_name,
      c.center_name,
      co.company_name as contractor_name,
      s.service_name
    FROM orders o
    LEFT JOIN customers cu ON o.customer_id = cu.customer_id
    LEFT JOIN centers c ON o.center_id = c.center_id  
    LEFT JOIN contractors co ON o.contractor_id = co.contractor_id
    LEFT JOIN services s ON o.service_id = s.service_id
    ${whereClause}
    ORDER BY o.created_at DESC
  `;
    return await (0, connection_1.query)(sql, params);
}
// Get order by ID (with manager scope check)
async function getOrderById(orderId, managerId) {
    const sql = `
    SELECT 
      o.*,
      cu.company_name as customer_name,
      c.center_name,
      co.company_name as contractor_name,
      s.service_name
    FROM orders o
    LEFT JOIN customers cu ON o.customer_id = cu.customer_id
    LEFT JOIN centers c ON o.center_id = c.center_id  
    LEFT JOIN contractors co ON o.contractor_id = co.contractor_id
    LEFT JOIN services s ON o.service_id = s.service_id
    WHERE o.order_id = $1 
    AND (c.cks_manager = $2 OR cu.cks_manager = $2)
  `;
    return await (0, connection_1.queryOne)(sql, [orderId, managerId]);
}
// Get order counts by status for manager dashboard
async function getOrderCountsByStatus(managerId) {
    const sql = `
    SELECT 
      o.status,
      COUNT(*) as count
    FROM orders o
    LEFT JOIN customers cu ON o.customer_id = cu.customer_id
    LEFT JOIN centers c ON o.center_id = c.center_id
    WHERE (c.cks_manager = $1 OR cu.cks_manager = $1)
    GROUP BY o.status
  `;
    const rows = await (0, connection_1.query)(sql, [managerId]);
    const counts = {};
    rows.forEach(row => {
        counts[row.status] = parseInt(row.count);
    });
    return counts;
}
// Create new order
async function createOrder(orderData, managerId) {
    const sql = `
    INSERT INTO orders (
      order_number, customer_id, center_id, contractor_id, service_id,
      title, description, priority, status, estimated_hours,
      scheduled_date, total_amount, notes, created_by
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    ) RETURNING *
  `;
    const params = [
        orderData.order_number,
        orderData.customer_id,
        orderData.center_id,
        orderData.contractor_id,
        orderData.service_id,
        orderData.title,
        orderData.description,
        orderData.priority || 'medium',
        orderData.status || 'pending',
        orderData.estimated_hours,
        orderData.scheduled_date,
        orderData.total_amount,
        orderData.notes,
        managerId
    ];
    return await (0, connection_1.queryOne)(sql, params);
}
// Update order
async function updateOrder(orderId, updates, managerId) {
    const updateFields = [];
    const params = [];
    let paramCount = 0;
    for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined && key !== 'order_id' && key !== 'created_at') {
            paramCount++;
            updateFields.push(`${key} = $${paramCount}`);
            params.push(value);
        }
    }
    if (updateFields.length === 0) {
        return null;
    }
    paramCount++;
    params.push(new Date().toISOString());
    updateFields.push(`updated_at = $${paramCount}`);
    paramCount++;
    params.push(orderId);
    paramCount++;
    params.push(managerId);
    const sql = `
    UPDATE orders 
    SET ${updateFields.join(', ')}
    FROM customers cu, centers c
    WHERE orders.order_id = $${paramCount - 1}
    AND (
      (orders.customer_id = cu.customer_id AND cu.cks_manager = $${paramCount})
      OR
      (orders.center_id = c.center_id AND c.cks_manager = $${paramCount})
    )
    RETURNING orders.*
  `;
    return await (0, connection_1.queryOne)(sql, params);
}
//# sourceMappingURL=orders.repo.js.map