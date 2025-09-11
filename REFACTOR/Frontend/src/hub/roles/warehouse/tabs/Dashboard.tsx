/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Dashboard.tsx
 * 
 * Description: Warehouse dashboard with inventory overview and logistics management
 * Function: Main landing page for warehouse staff showing inventory status and orders
 * Importance: Critical - Primary interface for warehouse operations
 * Connects to: Warehouse API, inventory management, order fulfillment
 * 
 * Notes: Warehouse-focused dashboard emphasizing inventory tracking and order processing.
 *        Shows stock levels, pending orders, and logistics operations.
 *        Provides access to inventory tools and shipping management.
 */

import React, { useState, useEffect } from 'react';

interface InventoryAlert {
  id: string;
  item_name: string;
  current_stock: number;
  min_threshold: number;
  status: 'Low Stock' | 'Out of Stock' | 'Overstocked';
  location: string;
}

interface Order {
  id: string;
  order_number: string;
  destination: string;
  items_count: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered';
  priority: 'High' | 'Medium' | 'Low';
  order_date: string;
}

interface WarehouseDashboardProps {
  userId: string;
  config: any;
  features: any;
  api: any;
}

export default function WarehouseDashboard({ userId, config, features, api }: WarehouseDashboardProps) {
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Mock inventory alerts
      setInventoryAlerts([
        {
          id: 'ALERT-001',
          item_name: 'Industrial Cleaning Solution',
          current_stock: 8,
          min_threshold: 25,
          status: 'Low Stock',
          location: 'A-12-B'
        },
        {
          id: 'ALERT-002',
          item_name: 'Microfiber Towels',
          current_stock: 0,
          min_threshold: 50,
          status: 'Out of Stock',
          location: 'B-05-C'
        },
        {
          id: 'ALERT-003',
          item_name: 'Safety Gloves',
          current_stock: 15,
          min_threshold: 30,
          status: 'Low Stock',
          location: 'C-08-A'
        }
      ]);

      // Mock orders
      setOrders([
        {
          id: 'ORD-001',
          order_number: 'WO-2025-001',
          destination: 'Downtown Service Center',
          items_count: 12,
          status: 'Pending',
          priority: 'High',
          order_date: '2025-09-11'
        },
        {
          id: 'ORD-002',
          order_number: 'WO-2025-002',
          destination: 'North Campus Center',
          items_count: 8,
          status: 'Processing',
          priority: 'Medium',
          order_date: '2025-09-10'
        },
        {
          id: 'ORD-003',
          order_number: 'WO-2025-003',
          destination: 'Industrial Park Center',
          items_count: 15,
          status: 'Shipped',
          priority: 'Low',
          order_date: '2025-09-09'
        }
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Low Stock': return '#f59e0b';
      case 'Out of Stock': return '#ef4444';
      case 'Overstocked': return '#6b7280';
      case 'Pending': return '#6b7280';
      case 'Processing': return '#3b82f6';
      case 'Shipped': return '#10b981';
      case 'Delivered': return '#10b981';
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getInventoryStats = () => {
    const lowStock = inventoryAlerts.filter(a => a.status === 'Low Stock').length;
    const outOfStock = inventoryAlerts.filter(a => a.status === 'Out of Stock').length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const processingOrders = orders.filter(o => o.status === 'Processing').length;
    return { lowStock, outOfStock, pendingOrders, processingOrders };
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ color: '#6b7280' }}>Loading dashboard...</div>
      </div>
    );
  }

  const stats = getInventoryStats();

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#111827' }}>
        Warehouse Operations
      </h2>

      {/* Operations Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
            {stats.lowStock}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Low Stock Items</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>
            {stats.outOfStock}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Out of Stock</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>
            {stats.pendingOrders}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Pending Orders</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6', marginBottom: 4 }}>
            {stats.processingOrders}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Processing Orders</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <button style={{
          padding: '32px 24px',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8
        }}>
          <div style={{ fontSize: 24 }}>📦</div>
          <div>MANAGE INVENTORY</div>
          <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.9 }}>
            Stock Levels • Adjustments • Transfers
          </div>
        </button>

        <button style={{
          padding: '32px 24px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8
        }}>
          <div style={{ fontSize: 24 }}>📋</div>
          <div>PROCESS ORDERS</div>
          <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.9 }}>
            Pick • Pack • Ship • Track
          </div>
        </button>

        <button style={{
          padding: '32px 24px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8
        }}>
          <div style={{ fontSize: 24 }}>📊</div>
          <div>GENERATE REPORTS</div>
          <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.9 }}>
            Inventory • Orders • Analytics
          </div>
        </button>
      </div>

      {/* Inventory Alerts */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#111827' }}>
          Inventory Alerts
        </h3>
        <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
          {inventoryAlerts.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ marginBottom: 8 }}>No inventory alerts</div>
              <div style={{ fontSize: 14, color: '#9ca3af' }}>All stock levels are normal</div>
            </div>
          ) : (
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gap: 12 }}>
                {inventoryAlerts.map(alert => (
                  <div key={alert.id} style={{
                    padding: 16,
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: alert.status === 'Out of Stock' ? '#fef2f2' : '#fefbf2'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <h4 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#111827' }}>
                          {alert.item_name}
                        </h4>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                          Location: {alert.location} • Min: {alert.min_threshold} units
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        background: getStatusColor(alert.status),
                        color: 'white'
                      }}>
                        {alert.status}
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      Current Stock: <strong>{alert.current_stock} units</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#111827' }}>
          Recent Orders
        </h3>
        <div className="ui-card" style={{ padding: 16 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            {orders.map(order => (
              <div key={order.id} style={{
                padding: 16,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                background: '#f9fafb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#111827' }}>
                      {order.order_number}
                    </h4>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      {order.destination} • {order.items_count} items • {order.order_date}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600,
                      background: getStatusColor(order.priority),
                      color: 'white'
                    }}>
                      {order.priority}
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: getStatusColor(order.status),
                      color: 'white'
                    }}>
                      {order.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}