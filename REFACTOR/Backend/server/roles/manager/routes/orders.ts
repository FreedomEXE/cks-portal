/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: orders.ts
 * 
 * Description: Complete orders management endpoints - list, create, update orders
 * Function: Provide full CRUD operations for order workflows
 * Importance: Core work queue functionality for Manager role
 * Connects to: orders table, activity logs, contractors, customers
 * 
 * Notes: Full implementation with validation and activity logging
 */

import { Router } from 'express';
import { requireCaps } from '../../../middleware/requireCaps';
import pool from '../../../../Database/db/pool';

const router = Router();

// GET /api/manager/orders - List orders for manager
router.get('/',
  requireCaps('orders:view'),
  async (req, res) => {
    try {
      const managerId = req.user?.userId;
      const { status, limit = 50, offset = 0 } = req.query;
      
      if (!managerId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      let whereClause = `WHERE (o.created_by = $1 OR c.cks_manager = $1 OR cu.cks_manager = $1)`;
      const params = [managerId];
      let paramIndex = 2;

      if (status) {
        whereClause += ` AND o.status = $${paramIndex++}`;
        params.push(status as string);
      }

      const query = `
        SELECT 
          o.order_id,
          o.order_number,
          o.title,
          o.description,
          o.priority,
          o.status,
          o.scheduled_date,
          o.total_amount,
          o.created_at,
          c.company_name as contractor_name,
          cu.company_name as customer_name,
          ce.center_name
        FROM orders o
        LEFT JOIN contractors c ON o.contractor_id = c.contractor_id
        LEFT JOIN customers cu ON o.customer_id = cu.customer_id
        LEFT JOIN centers ce ON o.center_id = ce.center_id
        ${whereClause}
        ORDER BY o.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `;

      params.push(parseInt(limit as string), parseInt(offset as string));

      const result = await pool.query(query, params);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Orders fetch error:', error);
      res.status(500).json({ success: false, error: 'Failed to load orders' });
    }
  }
);

// GET /api/manager/orders/:id - Get specific order
router.get('/:id',
  requireCaps('orders:view'),
  async (req, res) => {
    try {
      const managerId = req.user?.userId;
      const orderId = req.params.id;

      const result = await pool.query(`
        SELECT 
          o.*,
          c.company_name as contractor_name,
          cu.company_name as customer_name,
          ce.center_name,
          s.service_name
        FROM orders o
        LEFT JOIN contractors c ON o.contractor_id = c.contractor_id
        LEFT JOIN customers cu ON o.customer_id = cu.customer_id
        LEFT JOIN centers ce ON o.center_id = ce.center_id
        LEFT JOIN services s ON o.service_id = s.service_id
        WHERE o.order_id = $1 AND (o.created_by = $2 OR c.cks_manager = $2 OR cu.cks_manager = $2)
      `, [orderId, managerId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Order fetch error:', error);
      res.status(500).json({ success: false, error: 'Failed to load order' });
    }
  }
);

// POST /api/manager/orders - Create new order
router.post('/',
  requireCaps('orders:create'),
  async (req, res) => {
    try {
      const managerId = req.user?.userId;
      const { 
        customer_id, 
        center_id, 
        contractor_id, 
        service_id, 
        title, 
        description, 
        priority = 'medium', 
        scheduled_date,
        estimated_hours,
        total_amount
      } = req.body;

      // Basic validation
      if (!customer_id || !title) {
        return res.status(400).json({ 
          success: false, 
          error: 'customer_id and title are required' 
        });
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;

      const result = await pool.query(`
        INSERT INTO orders (
          order_number, customer_id, center_id, contractor_id, service_id,
          title, description, priority, scheduled_date, estimated_hours,
          total_amount, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        orderNumber, customer_id, center_id, contractor_id, service_id,
        title, description, priority, scheduled_date, estimated_hours,
        total_amount, managerId
      ]);

      const newOrder = result.rows[0];

      // Log order creation
      await pool.query(
        `SELECT log_activity($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          managerId,
          'manager',
          'order_create',
          'orders',
          `Created order: ${title}`,
          'order',
          newOrder.order_id.toString(),
          JSON.stringify({ order_number: orderNumber, customer_id }),
          null,
          req.ip,
          req.get('User-Agent')
        ]
      );

      res.status(201).json({ 
        success: true, 
        data: newOrder, 
        message: 'Order created successfully' 
      });
    } catch (error) {
      console.error('Order creation error:', error);
      res.status(500).json({ success: false, error: 'Failed to create order' });
    }
  }
);

// PATCH /api/manager/orders/:id - Update order
router.patch('/:id',
  requireCaps('orders:edit'),
  async (req, res) => {
    try {
      const managerId = req.user?.userId;
      const orderId = req.params.id;
      const updates = req.body;

      // Check if order exists and user has access
      const existingOrder = await pool.query(`
        SELECT o.*, c.cks_manager 
        FROM orders o
        LEFT JOIN contractors c ON o.contractor_id = c.contractor_id
        WHERE o.order_id = $1 AND (o.created_by = $2 OR c.cks_manager = $2)
      `, [orderId, managerId]);

      if (existingOrder.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Order not found or access denied' });
      }

      // Build dynamic update query
      const allowedFields = ['status', 'priority', 'scheduled_date', 'contractor_id', 'estimated_hours', 'actual_hours', 'total_amount', 'notes'];
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updateFields.push(`${key} = $${paramIndex++}`);
          values.push(value);
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ success: false, error: 'No valid fields to update' });
      }

      values.push(orderId);
      const updateQuery = `
        UPDATE orders 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE order_id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(updateQuery, values);
      const updatedOrder = result.rows[0];

      // Log order update
      await pool.query(
        `SELECT log_activity($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          managerId,
          'manager',
          'order_update',
          'orders',
          `Updated order: ${updatedOrder.title}`,
          'order',
          orderId,
          JSON.stringify({ updated_fields: Object.keys(updates) }),
          null,
          req.ip,
          req.get('User-Agent')
        ]
      );

      res.json({ success: true, data: updatedOrder, message: 'Order updated successfully' });
    } catch (error) {
      console.error('Order update error:', error);
      res.status(500).json({ success: false, error: 'Failed to update order' });
    }
  }
);

// DELETE /api/manager/orders/:id - Cancel/delete order
router.delete('/:id',
  requireCaps('orders:delete'),
  async (req, res) => {
    try {
      const managerId = req.user?.userId;
      const orderId = req.params.id;

      // Check if order exists and user has access
      const existingOrder = await pool.query(`
        SELECT title FROM orders 
        WHERE order_id = $1 AND created_by = $2
      `, [orderId, managerId]);

      if (existingOrder.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Order not found or access denied' });
      }

      // Soft delete by setting status to cancelled
      await pool.query(`
        UPDATE orders 
        SET status = 'cancelled', updated_at = NOW()
        WHERE order_id = $1
      `, [orderId]);

      // Log order cancellation
      await pool.query(
        `SELECT log_activity($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          managerId,
          'manager',
          'order_cancel',
          'orders',
          `Cancelled order: ${existingOrder.rows[0].title}`,
          'order',
          orderId,
          null,
          null,
          req.ip,
          req.get('User-Agent')
        ]
      );

      res.json({ success: true, message: 'Order cancelled successfully' });
    } catch (error) {
      console.error('Order cancellation error:', error);
      res.status(500).json({ success: false, error: 'Failed to cancel order' });
    }
  }
);

export default router;