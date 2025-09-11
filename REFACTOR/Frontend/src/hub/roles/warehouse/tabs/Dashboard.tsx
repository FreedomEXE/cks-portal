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
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#6b7280' }}>Loading dashboard...</div>
      </div>
    );
  }

  const stats = getInventoryStats();

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#111827' }}>
        Overview
      </h2>

      {/* Dashboard Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6', marginBottom: 4 }}>
            {inventoryAlerts.length + 150}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Total Inventory Items</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
            {stats.lowStock}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Low Stock Alerts</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>
            {stats.pendingOrders}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Pending Orders</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6', marginBottom: 4 }}>
            {Math.floor(Math.random() * 10) + 3}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Pending Shipments</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>
            Active
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Account Status</div>
        </div>
      </div>


      {/* Recent Activity */}
      <div className="ui-card" style={{ padding: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#8b5cf6' }}>Recent Activity</div>
        <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No recent activity</div>
          <div style={{ fontSize: 12 }}>Warehouse activities will appear here</div>
        </div>
      </div>

      {/* Communication Hub */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* News & Updates */}
        <div className="ui-card" style={{ padding: 16 }}>
          <div style={{ marginBottom: 16, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}>
            📰 News & Updates
          </div>
          <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📰</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No Recent News</div>
            <div style={{ fontSize: 12 }}>Company news and updates will appear here</div>
          </div>
          <button style={{
            width: '100%',
            padding: '8px 16px',
            fontSize: 12,
            backgroundColor: '#f3e8ff',
            color: '#8b5cf6',
            border: '1px solid #a855f7',
            borderRadius: 4,
            cursor: 'pointer',
            marginTop: 8,
            fontWeight: 500
          }}
          onClick={() => alert('Full News - Coming Soon!')}
          >
            View All News
          </button>
        </div>
        
        {/* Mail & Messages */}
        <div className="ui-card" style={{ padding: 16 }}>
          <div style={{ marginBottom: 16, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}>
            📬 Mail
          </div>
          <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📧</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No Messages</div>
            <div style={{ fontSize: 12 }}>Internal messages and notifications will appear here</div>
          </div>
          <button style={{
            width: '100%',
            padding: '8px 16px',
            fontSize: 12,
            backgroundColor: '#f3e8ff',
            color: '#8b5cf6',
            border: '1px solid #a855f7',
            borderRadius: 4,
            cursor: 'pointer',
            marginTop: 8,
            fontWeight: 500
          }}
          onClick={() => alert('Full Mailbox - Coming Soon!')}
          >
            View Mailbox
          </button>
        </div>
      </div>
    </div>
  );
}