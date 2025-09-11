/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Orders.tsx
 * 
 * Description: Warehouse order management and fulfillment tracking
 * Function: View and process orders for warehouse operations
 * Importance: Critical - Order fulfillment and logistics coordination
 * Connects to: Order API, shipping systems, inventory management
 */

import React, { useState, useEffect } from 'react';

interface OrdersProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

interface Order {
  id: string;
  order_number: string;
  destination: string;
  items: Array<{ name: string; quantity: number; sku: string }>;
  status: 'Pending' | 'Processing' | 'Packed' | 'Shipped' | 'Delivered';
  priority: 'High' | 'Medium' | 'Low';
  order_date: string;
  requested_delivery: string;
  assigned_to?: string;
}

export default function Orders({ userId, config, features, api }: OrdersProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        
        // Mock active orders
        const mockActiveOrders: Order[] = [
          {
            id: 'ORD-001',
            order_number: 'WO-2025-001',
            destination: 'Downtown Service Center',
            items: [
              { name: 'Industrial Cleaning Solution', quantity: 5, sku: 'ICS-500' },
              { name: 'Microfiber Towels', quantity: 10, sku: 'MFT-200' }
            ],
            status: 'Pending',
            priority: 'High',
            order_date: '2025-09-11',
            requested_delivery: '2025-09-12',
            assigned_to: 'Warehouse Team A'
          },
          {
            id: 'ORD-002',
            order_number: 'WO-2025-002',
            destination: 'North Campus Center',
            items: [
              { name: 'Safety Gloves', quantity: 8, sku: 'SG-100' },
              { name: 'Floor Mop Heads', quantity: 15, sku: 'FMH-75' }
            ],
            status: 'Processing',
            priority: 'Medium',
            order_date: '2025-09-10',
            requested_delivery: '2025-09-13'
          }
        ];

        // Mock completed orders
        const mockCompletedOrders: Order[] = [
          {
            id: 'ORD-003',
            order_number: 'WO-2025-003',
            destination: 'Industrial Park Center',
            items: [
              { name: 'Industrial Cleaning Solution', quantity: 3, sku: 'ICS-500' }
            ],
            status: 'Delivered',
            priority: 'Low',
            order_date: '2025-09-08',
            requested_delivery: '2025-09-10',
            assigned_to: 'Warehouse Team B'
          }
        ];
        
        setActiveOrders(mockActiveOrders);
        setCompletedOrders(mockCompletedOrders);
        
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [userId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#6b7280';
      case 'Processing': return '#3b82f6';
      case 'Packed': return '#f59e0b';
      case 'Shipped': return '#10b981';
      case 'Delivered': return '#10b981';
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
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

  const currentOrders = activeTab === 'active' ? activeOrders : completedOrders;

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Order Management</h2>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['active', 'completed'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              background: activeTab === tab ? '#8b5cf6' : 'white',
              color: activeTab === tab ? 'white' : '#111827',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab === 'active' ? `Active Orders (${activeOrders.length})` : `Completed Orders (${completedOrders.length})`}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
        {currentOrders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>
              {activeTab === 'active' ? '📦' : '✅'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
              {activeTab === 'active' ? 'No Active Orders' : 'No Completed Orders'}
            </div>
            <div style={{ fontSize: 12 }}>
              {activeTab === 'active' 
                ? 'New orders will appear here' 
                : 'Completed orders will appear here'}
            </div>
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              {currentOrders.map(order => (
                <div key={order.id} style={{
                  padding: 16,
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  background: activeTab === 'active' ? '#f9fafb' : '#f7f7f7'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#111827' }}>
                        {order.order_number}
                      </h3>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                        {order.destination} • Ordered: {order.order_date} • Delivery: {order.requested_delivery}
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

                  {/* Order Items */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                      Items ({order.items.length}):
                    </div>
                    <div style={{ display: 'grid', gap: 4 }}>
                      {order.items.map((item, index) => (
                        <div key={index} style={{ fontSize: 12, color: '#6b7280' }}>
                          • {item.name} (SKU: {item.sku}) - Qty: {item.quantity}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                    <div style={{ color: '#6b7280' }}>
                      {order.assigned_to && `Assigned to: ${order.assigned_to}`}
                    </div>
                    {activeTab === 'active' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{
                          padding: '6px 12px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}>
                          Process Order
                        </button>
                        <button style={{
                          padding: '6px 12px',
                          background: '#f3f4f6',
                          color: '#111827',
                          border: '1px solid #e5e7eb',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}>
                          View Details
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}