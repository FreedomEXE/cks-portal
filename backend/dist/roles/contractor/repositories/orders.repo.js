"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrdersForContractor = getOrdersForContractor;
exports.getOrderById = getOrderById;
exports.updateOrder = updateOrder;
exports.getOrderCountsByStatus = getOrderCountsByStatus;
exports.getAvailableJobs = getAvailableJobs;
/**
 * File: orders.repo.ts
 *
 * Description: DB access for contractor orders (contractor-specific scope)
 * Function: Handle contractor order data operations and queries
 * Importance: Core data layer for contractor order management
 * Connects to: orders.service.ts, dashboard KPIs.
 *
 * Notes: Contractor-scoped order queries and operations
 */
const connection_1 = require("../../../db/connection");
// Get orders for contractor
async function getOrdersForContractor(contractorId, filters = {}) {
    const { status, date_from, date_to, limit = 50, offset = 0 } = filters;
    let whereClause = 'WHERE ja.assigned_contractor = $1';
    const params = [contractorId];
    let paramIndex = 2;
    // Add status filter
    if (status) {
        whereClause += ` AND o.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
    }
    // Add date filters
    if (date_from) {
        whereClause += ` AND o.created_date >= $${paramIndex}`;
        params.push(date_from);
        paramIndex++;
    }
    if (date_to) {
        whereClause += ` AND o.created_date <= $${paramIndex}`;
        params.push(date_to);
        paramIndex++;
    }
    const sql = `
    SELECT 
      o.order_id,
      o.customer_id,
      o.center_id,
      o.status,
      o.total_amount,
      o.created_date,
      o.scheduled_date,
      o.completed_date,
      o.description,
      c.company_name as customer_name,
      ct.center_name,
      ja.assignment_status,
      ja.assigned_date
    FROM orders o
    JOIN job_assignments ja ON ja.order_id = o.order_id
    LEFT JOIN customers c ON o.customer_id = c.customer_id
    LEFT JOIN centers ct ON o.center_id = ct.center_id
    ${whereClause}
    ORDER BY o.created_date DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
    params.push(limit, offset);
    return await (0, connection_1.query)(sql, params);
}
// Get specific order by ID
async function getOrderById(contractorId, orderId) {
    const sql = `
    SELECT 
      o.*,
      c.company_name as customer_name,
      c.contact_name as customer_contact,
      c.email as customer_email,
      c.phone as customer_phone,
      ct.center_name,
      ct.address as center_address,
      ja.assignment_status,
      ja.assigned_date,
      ja.notes as assignment_notes
    FROM orders o
    JOIN job_assignments ja ON ja.order_id = o.order_id
    LEFT JOIN customers c ON o.customer_id = c.customer_id
    LEFT JOIN centers ct ON o.center_id = ct.center_id
    WHERE ja.assigned_contractor = $1 AND o.order_id = $2
  `;
    const result = await (0, connection_1.query)(sql, [contractorId, orderId]);
    return result[0] || null;
}
// Update order status
async function updateOrder(contractorId, orderId, updateData) {
    const allowedFields = ['status', 'notes', 'completed_date', 'progress_notes'];
    const setClause = [];
    const params = [];
    let paramIndex = 1;
    // Build SET clause dynamically
    for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
            setClause.push(`${key} = $${paramIndex}`);
            params.push(value);
            paramIndex++;
        }
    }
    if (setClause.length === 0) {
        throw new Error('No valid fields to update');
    }
    // Add updated_date
    setClause.push(`updated_date = NOW()`);
    const sql = `
    UPDATE orders 
    SET ${setClause.join(', ')}
    WHERE order_id = $${paramIndex}
    AND order_id IN (
      SELECT o.order_id 
      FROM orders o
      JOIN job_assignments ja ON ja.order_id = o.order_id
      WHERE ja.assigned_contractor = $${paramIndex + 1}
    )
    RETURNING *
  `;
    params.push(orderId, contractorId);
    const result = await (0, connection_1.query)(sql, params);
    return result[0] || null;
}
// Get order counts by status
async function getOrderCountsByStatus(contractorId) {
    const sql = `
    SELECT 
      o.status,
      COUNT(*) as count
    FROM orders o
    JOIN job_assignments ja ON ja.order_id = o.order_id
    WHERE ja.assigned_contractor = $1
    GROUP BY o.status
  `;
    const result = await (0, connection_1.query)(sql, [contractorId]);
    const counts = {};
    for (const row of result) {
        counts[row.status] = parseInt(row.count);
    }
    return counts;
}
// Get available jobs (not yet assigned)
async function getAvailableJobs(contractorId, filters = {}) {
    const { service_type, location, pay_range, limit = 20 } = filters;
    let whereClause = `WHERE o.status = 'open' 
    AND NOT EXISTS (
      SELECT 1 FROM job_assignments ja 
      WHERE ja.order_id = o.order_id AND ja.assigned_contractor = $1
    )`;
    const params = [contractorId];
    let paramIndex = 2;
    // Add filters as needed
    if (service_type) {
        whereClause += ` AND o.service_type = $${paramIndex}`;
        params.push(service_type);
        paramIndex++;
    }
    const sql = `
    SELECT 
      o.order_id,
      o.customer_id,
      o.center_id,
      o.description,
      o.total_amount,
      o.scheduled_date,
      o.service_type,
      c.company_name as customer_name,
      ct.center_name,
      ct.city,
      ct.state
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.customer_id
    LEFT JOIN centers ct ON o.center_id = ct.center_id
    ${whereClause}
    ORDER BY o.created_date DESC
    LIMIT $${paramIndex}
  `;
    params.push(limit);
    return await (0, connection_1.query)(sql, params);
}
//# sourceMappingURL=orders.repo.js.map