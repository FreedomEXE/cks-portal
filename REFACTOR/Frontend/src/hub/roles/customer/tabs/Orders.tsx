/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Orders.tsx
 * 
 * Description: Customer order management and tracking system
 * Function: View and manage service orders across customer centers
 * Importance: Critical - Service order lifecycle management for customers
 * Connects to: Order API, service management, contractor coordination
 */

import React, { useState, useEffect } from 'react';

interface CustomerOrdersProps {
  userId: string;
  config: any;
  features: any;
  api: any;
}

interface Order {
  id: string;
  center: string;
  services: string[];
  products: string[];
  contractor: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'archived';
  priority: 'high' | 'medium' | 'low';
  requested_date: string;
  scheduled_date?: string;
  total_amount: number;
}

export default function CustomerOrders({ userId, config, features, api }: CustomerOrdersProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'archive'>('pending');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      // Mock orders data - customers place orders
      const mockOrders: Order[] = [
        {
          id: 'ORD-001',
          center: 'Downtown Center',
          services: ['Deep Cleaning', 'Window Cleaning'],
          products: ['Cleaning Supplies'],
          contractor: 'Premium Cleaning Solutions',
          status: activeTab === 'pending' ? 'pending' : activeTab === 'approved' ? 'approved' : 'completed',
          priority: 'high',
          requested_date: '2025-09-10',
          scheduled_date: '2025-09-12',
          total_amount: 1250.00
        },
        {
          id: 'ORD-002',
          center: 'North Campus',
          services: ['HVAC Maintenance'],
          products: ['Filter Replacement'],
          contractor: 'TechCorp Services',
          status: activeTab === 'pending' ? 'pending' : activeTab === 'approved' ? 'approved' : 'completed',
          priority: 'medium',
          requested_date: '2025-09-09',
          total_amount: 850.00
        }
      ];
      setOrders(mockOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#3b82f6'; 
      case 'completed': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#111827' }}>
        Orders
      </h2>

      {/* Order Status Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['pending', 'approved', 'archive'] as const).map(bucket => (
          <button
            key={bucket}
            onClick={() => setActiveTab(bucket)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              background: activeTab === bucket ? '#111827' : 'white',
              color: activeTab === bucket ? 'white' : '#111827',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {bucket === 'pending' ? 'Pending Requests' : bucket === 'approved' ? 'Approved Requests' : 'Archive'}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
            Loading orders...
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Order ID</th>
                <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Center</th>
                <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Items</th>
                <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Services</th>
                <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Products</th>
                <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Status</th>
                <th style={{ padding: 10, textAlign: 'left', fontSize: 12 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 10, fontSize: 13, fontWeight: 600, color: '#111827' }}>
                    {order.id}
                  </td>
                  <td style={{ padding: 10, fontSize: 13, color: '#111827' }}>
                    {order.center}
                  </td>
                  <td style={{ padding: 10, fontSize: 13, color: '#111827' }}>
                    {order.services.length + order.products.length}
                  </td>
                  <td style={{ padding: 10, fontSize: 13, color: '#111827' }}>
                    {order.services.join(', ')}
                  </td>
                  <td style={{ padding: 10, fontSize: 13, color: '#111827' }}>
                    {order.products.join(', ')}
                  </td>
                  <td style={{ padding: 10 }}>
                    <div style={{
                      padding: '2px 6px',
                      borderRadius: 3,
                      fontSize: 11,
                      fontWeight: 600,
                      background: getStatusColor(order.status),
                      color: 'white',
                      display: 'inline-block'
                    }}>
                      {order.status}
                    </div>
                  </td>
                  <td style={{ padding: 10 }}>
                    <button style={{
                      padding: '4px 8px',
                      background: '#eab308',
                      color: 'white',
                      border: 'none',
                      borderRadius: 3,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {orders.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
            No {activeTab} orders found
          </div>
        )}
      </div>
    </div>
  );
}