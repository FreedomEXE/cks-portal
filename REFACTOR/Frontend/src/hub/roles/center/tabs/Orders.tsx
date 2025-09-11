/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Orders.tsx
 * 
 * Description: Center order management and tracking system
 * Function: View and manage service orders for the center facility
 * Importance: Critical - Service order lifecycle management for centers
 * Connects to: Order API, service management, contractor coordination
 */

import React, { useState, useEffect } from 'react';

interface CenterOrdersProps {
  userId: string;
  config: any;
  features: any;
  api: any;
}

interface Order {
  id: string;
  service_type: string;
  contractor: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'archived';
  priority: 'high' | 'medium' | 'low';
  requested_date: string;
  scheduled_date?: string;
  location: string;
}

export default function CenterOrders({ userId, config, features, api }: CenterOrdersProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'archive'>('pending');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      // Mock orders data
      const mockOrders: Order[] = [
        {
          id: 'ORD-001',
          service_type: 'Deep Cleaning',
          contractor: 'CleanPro Services',
          status: 'pending',
          priority: 'high',
          requested_date: '2025-09-11',
          location: 'Building A - Floor 2'
        },
        {
          id: 'ORD-002',
          service_type: 'Maintenance',
          contractor: 'FixIt Solutions',
          status: 'approved',
          priority: 'medium',
          requested_date: '2025-09-10',
          scheduled_date: '2025-09-12',
          location: 'HVAC System - Roof'
        }
      ];
      
      setOrders(mockOrders.filter(order => 
        activeTab === 'archive' ? order.status === 'archived' : 
        activeTab === 'approved' ? ['approved', 'in_progress', 'completed'].includes(order.status) :
        order.status === 'pending'
      ));
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#6b7280';
      case 'approved': return '#3b82f6';
      case 'in_progress': return '#f59e0b';
      case 'completed': return '#10b981';
      case 'archived': return '#9ca3af';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
        <div>Loading orders...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Orders</h2>
        <button style={{
          padding: '8px 16px',
          background: '#059669',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          Request Service
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['pending', 'approved', 'archive'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              background: activeTab === tab ? '#059669' : 'white',
              color: activeTab === tab ? 'white' : '#111827',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab} ({orders.length})
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="ui-card" style={{ padding: orders.length === 0 ? 0 : 16 }}>
        {orders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
              No {activeTab} orders
            </div>
            <div style={{ fontSize: 12 }}>
              Orders will appear here when available
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {orders.map(order => (
              <div key={order.id} style={{
                padding: 16,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                background: '#f9fafb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#111827' }}>
                      {order.service_type}
                    </h3>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      {order.contractor} • {order.location} • {order.requested_date}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600,
                      background: getPriorityColor(order.priority),
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
                {order.scheduled_date && (
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    Scheduled: {order.scheduled_date}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}