"use strict";
/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlobalKPIs = getGlobalKPIs;
exports.getEcosystemKPIs = getEcosystemKPIs;
exports.getEntityKPIs = getEntityKPIs;
exports.getOrderCounts = getOrderCounts;
exports.getRecentOrders = getRecentOrders;
exports.getPerformanceMetrics = getPerformanceMetrics;
exports.getAnalytics = getAnalytics;
/**
 * File: repository.ts
 *
 * Description: Dashboard data access layer - role-scoped database queries
 * Function: Fetch dashboard metrics, KPIs, and analytics with proper data scoping
 * Importance: Single data access point with role-based filtering and security
 * Connects to: Database tables, RLS policies, role-specific data filtering
 */
const connection_1 = __importDefault(require("../../db/connection"));
/**
 * Get global KPIs (Admin/Manager scope)
 */
async function getGlobalKPIs(userId, roleCode, options = {}) {
    try {
        const result = await connection_1.default.query(`SELECT
        COUNT(DISTINCT CASE WHEN role_code = 'contractor' THEN user_id END) as contractors,
        COUNT(DISTINCT CASE WHEN role_code = 'customer' THEN user_id END) as customers,
        COUNT(DISTINCT CASE WHEN role_code = 'center' THEN user_id END) as centers,
        COUNT(DISTINCT CASE WHEN role_code = 'crew' THEN user_id END) as crew,
        COUNT(DISTINCT CASE WHEN role_code = 'warehouse' THEN user_id END) as warehouses
       FROM users
       WHERE archived = false`, []);
        return result.rows[0] || {
            contractors: 0,
            customers: 0,
            centers: 0,
            crew: 0,
            warehouses: 0
        };
    }
    catch (error) {
        console.error('Error getting global KPIs:', error);
        throw error;
    }
}
/**
 * Get ecosystem KPIs (Contractor scope)
 */
async function getEcosystemKPIs(userId, roleCode, options = {}) {
    try {
        // For contractor, get their ecosystem counts
        const result = await connection_1.default.query(`SELECT
        COUNT(DISTINCT c.customer_id) as customers,
        COUNT(DISTINCT cen.center_id) as centers,
        COUNT(DISTINCT cr.crew_id) as crew,
        COUNT(DISTINCT o.order_id) as orders
       FROM contractors con
       LEFT JOIN customers c ON c.contractor_id = con.contractor_id
       LEFT JOIN centers cen ON cen.customer_id = c.customer_id
       LEFT JOIN crew cr ON cr.contractor_id = con.contractor_id
       LEFT JOIN orders o ON o.contractor_id = con.contractor_id AND o.status != 'archived'
       WHERE con.contractor_id = $1 AND con.status != 'archived'`, [userId]);
        return result.rows[0] || {
            customers: 0,
            centers: 0,
            crew: 0,
            orders: 0
        };
    }
    catch (error) {
        console.error('Error getting ecosystem KPIs:', error);
        throw error;
    }
}
/**
 * Get entity KPIs (Customer/Center/Crew/Warehouse scope)
 */
async function getEntityKPIs(userId, roleCode, options = {}) {
    try {
        switch (roleCode.toLowerCase()) {
            case 'customer':
                return await getCustomerKPIs(userId);
            case 'center':
                return await getCenterKPIs(userId);
            case 'crew':
                return await getCrewKPIs(userId);
            case 'warehouse':
                return await getWarehouseKPIs(userId);
            default:
                return { orders: 0, tasks: 0, active: 0 };
        }
    }
    catch (error) {
        console.error('Error getting entity KPIs:', error);
        throw error;
    }
}
/**
 * Get order counts by status
 */
async function getOrderCounts(userId, scope, roleCode) {
    try {
        let query = '';
        let params = [];
        switch (scope) {
            case 'global':
                query = `
          SELECT status, COUNT(*) as count
          FROM orders
          WHERE archived = false
          GROUP BY status
        `;
                break;
            case 'ecosystem':
                query = `
          SELECT status, COUNT(*) as count
          FROM orders
          WHERE contractor_id = $1 AND archived = false
          GROUP BY status
        `;
                params = [userId];
                break;
            case 'entity':
                if (roleCode === 'customer') {
                    query = `
            SELECT status, COUNT(*) as count
            FROM orders
            WHERE customer_id = $1 AND archived = false
            GROUP BY status
          `;
                }
                else if (roleCode === 'center') {
                    query = `
            SELECT status, COUNT(*) as count
            FROM orders
            WHERE center_id = $1 AND archived = false
            GROUP BY status
          `;
                }
                else {
                    // Crew, warehouse, etc.
                    query = `
            SELECT status, COUNT(*) as count
            FROM orders o
            JOIN order_assignments oa ON o.order_id = oa.order_id
            WHERE oa.assigned_to = $1 AND o.archived = false
            GROUP BY status
          `;
                }
                params = [userId];
                break;
        }
        const result = await connection_1.default.query(query, params);
        const counts = {};
        result.rows.forEach(row => {
            counts[row.status] = parseInt(row.count);
        });
        return counts;
    }
    catch (error) {
        console.error('Error getting order counts:', error);
        throw error;
    }
}
/**
 * Get recent orders for dashboard
 */
async function getRecentOrders(userId, scope, roleCode, limit = 10) {
    try {
        let query = '';
        let params = [];
        switch (scope) {
            case 'global':
                query = `
          SELECT order_id, customer_id, contractor_id, status, total_amount, created_at
          FROM orders
          WHERE archived = false
          ORDER BY created_at DESC
          LIMIT $1
        `;
                params = [limit];
                break;
            case 'ecosystem':
                query = `
          SELECT order_id, customer_id, contractor_id, status, total_amount, created_at
          FROM orders
          WHERE contractor_id = $1 AND archived = false
          ORDER BY created_at DESC
          LIMIT $2
        `;
                params = [userId, limit];
                break;
            case 'entity':
                if (roleCode === 'customer') {
                    query = `
            SELECT order_id, customer_id, contractor_id, status, total_amount, created_at
            FROM orders
            WHERE customer_id = $1 AND archived = false
            ORDER BY created_at DESC
            LIMIT $2
          `;
                }
                else if (roleCode === 'center') {
                    query = `
            SELECT order_id, customer_id, contractor_id, status, total_amount, created_at
            FROM orders
            WHERE center_id = $1 AND archived = false
            ORDER BY created_at DESC
            LIMIT $2
          `;
                }
                else {
                    query = `
            SELECT o.order_id, o.customer_id, o.contractor_id, o.status, o.total_amount, o.created_at
            FROM orders o
            JOIN order_assignments oa ON o.order_id = oa.order_id
            WHERE oa.assigned_to = $1 AND o.archived = false
            ORDER BY o.created_at DESC
            LIMIT $2
          `;
                }
                params = [userId, limit];
                break;
        }
        const result = await connection_1.default.query(query, params);
        return result.rows;
    }
    catch (error) {
        console.error('Error getting recent orders:', error);
        throw error;
    }
}
/**
 * Get performance metrics
 */
async function getPerformanceMetrics(userId, scope, roleCode) {
    try {
        // This would be customized based on role and scope
        // For now, return basic metrics
        return {
            avg_completion_time: 5.2, // days
            customer_satisfaction: 4.8, // out of 5
            on_time_delivery: 92 // percentage
        };
    }
    catch (error) {
        console.error('Error getting performance metrics:', error);
        throw error;
    }
}
/**
 * Get analytics data
 */
async function getAnalytics(userId, scope, roleCode, options = {}) {
    try {
        // This would be a complex query based on timeframe and metrics
        // For now, return placeholder structure
        return {
            trends: {
                orders: { current: 150, previous: 120, change: 25 },
                revenue: { current: 75000, previous: 68000, change: 10.3 }
            },
            comparisons: {
                thisMonth: 150,
                lastMonth: 120,
                yearOverYear: 15.5
            },
            forecasts: {
                nextMonth: 165,
                nextQuarter: 480
            }
        };
    }
    catch (error) {
        console.error('Error getting analytics:', error);
        throw error;
    }
}
/**
 * Helper functions for entity-specific KPIs
 */
async function getCustomerKPIs(customerId) {
    const result = await connection_1.default.query(`SELECT
      COUNT(DISTINCT center_id) as centers,
      COUNT(DISTINCT o.order_id) as orders,
      COALESCE(SUM(o.total_amount), 0) as total_spent
     FROM customers c
     LEFT JOIN centers cen ON cen.customer_id = c.customer_id
     LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status != 'archived'
     WHERE c.customer_id = $1`, [customerId]);
    return result.rows[0] || { centers: 0, orders: 0, total_spent: 0 };
}
async function getCenterKPIs(centerId) {
    const result = await connection_1.default.query(`SELECT
      COUNT(DISTINCT o.order_id) as orders,
      COUNT(DISTINCT CASE WHEN o.status = 'in_progress' THEN o.order_id END) as active_orders,
      COUNT(DISTINCT t.task_id) as tasks
     FROM centers c
     LEFT JOIN orders o ON o.center_id = c.center_id AND o.archived = false
     LEFT JOIN tasks t ON t.center_id = c.center_id AND t.archived = false
     WHERE c.center_id = $1`, [centerId]);
    return result.rows[0] || { orders: 0, active_orders: 0, tasks: 0 };
}
async function getCrewKPIs(crewId) {
    const result = await connection_1.default.query(`SELECT
      COUNT(DISTINCT oa.order_id) as assigned_orders,
      COUNT(DISTINCT CASE WHEN o.status = 'in_progress' THEN oa.order_id END) as active_orders,
      COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN oa.order_id END) as completed_orders
     FROM crew cr
     LEFT JOIN order_assignments oa ON oa.assigned_to = cr.crew_id
     LEFT JOIN orders o ON o.order_id = oa.order_id AND o.archived = false
     WHERE cr.crew_id = $1`, [crewId]);
    return result.rows[0] || { assigned_orders: 0, active_orders: 0, completed_orders: 0 };
}
async function getWarehouseKPIs(warehouseId) {
    const result = await connection_1.default.query(`SELECT
      COUNT(DISTINCT d.delivery_id) as deliveries,
      COUNT(DISTINCT CASE WHEN d.status = 'in_transit' THEN d.delivery_id END) as active_deliveries,
      COUNT(DISTINCT i.item_id) as inventory_items
     FROM warehouses w
     LEFT JOIN deliveries d ON d.warehouse_id = w.warehouse_id AND d.archived = false
     LEFT JOIN inventory i ON i.warehouse_id = w.warehouse_id AND i.archived = false
     WHERE w.warehouse_id = $1`, [warehouseId]);
    return result.rows[0] || { deliveries: 0, active_deliveries: 0, inventory_items: 0 };
}
//# sourceMappingURL=repository.js.map