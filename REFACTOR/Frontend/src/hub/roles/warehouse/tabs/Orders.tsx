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
  order_id: string;
  approved_by?: string;
  created_by_role?: string;
  created_by_id?: string;
  order_date: string;
  total_qty?: number;
  item_count?: number;
  center_id?: string;
  customer_id?: string;
}

export default function Orders({ userId, config, features, api }: OrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersArchive, setOrdersArchive] = useState<Order[]>([]);
  const [ordersPendingQuery, setOrdersPendingQuery] = useState('');
  const [ordersArchiveQuery, setOrdersArchiveQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        
        // Mock pending orders data
        const mockOrders: Order[] = [
          {
            order_id: 'WH-2025-001',
            approved_by: 'Manager Smith',
            created_by_role: 'Customer',
            created_by_id: 'CUST-001',
            order_date: '2025-09-11',
            total_qty: 15,
            item_count: 15,
            center_id: 'CTR-001',
            customer_id: 'CUST-001'
          },
          {
            order_id: 'WH-2025-002',
            approved_by: '',
            created_by_role: 'Center',
            created_by_id: 'CTR-002',
            order_date: '2025-09-10',
            total_qty: 8,
            item_count: 8,
            center_id: 'CTR-002'
          },
          {
            order_id: 'WH-2025-003',
            approved_by: 'Supervisor Johnson',
            created_by_role: 'Contractor',
            created_by_id: 'CONTR-005',
            order_date: '2025-09-11',
            total_qty: 22,
            item_count: 22,
            customer_id: 'CUST-003'
          }
        ];

        // Mock archive orders data
        const mockOrdersArchive: Order[] = [
          {
            order_id: 'WH-2025-004',
            approved_by: 'Manager Davis',
            created_by_role: 'Customer',
            created_by_id: 'CUST-002',
            order_date: '2025-09-08',
            total_qty: 12,
            item_count: 12,
            center_id: 'CTR-003',
            customer_id: 'CUST-002'
          },
          {
            order_id: 'WH-2025-005',
            approved_by: 'Supervisor Williams',
            created_by_role: 'Center',
            created_by_id: 'CTR-004',
            order_date: '2025-09-07',
            total_qty: 30,
            item_count: 30,
            center_id: 'CTR-004'
          }
        ];
        
        setOrders(mockOrders);
        setOrdersArchive(mockOrdersArchive);
        
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [userId]);

  const handleAssignOrder = async (orderId: string) => {
    try {
      // Mock assign order functionality
      console.log('Assigning order:', orderId);
      // In real implementation, would call API to assign order
    } catch (error) {
      console.error('Error assigning order:', error);
    }
  };

  const handleCreateShipment = async (order: Order) => {
    try {
      // Mock create shipment functionality
      const dest = order.center_id ? `Center ${order.center_id}` : (order.customer_id ? `Customer ${order.customer_id}` : 'Destination');
      console.log('Creating shipment for order:', order.order_id, 'to:', dest);
      // In real implementation, would call API to create shipment
    } catch (error) {
      console.error('Error creating shipment:', error);
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
      {/* Two stacked panels: Current and Archive */}
      {/* Current Orders (Pending) */}
      <div style={{ border: '1px solid #edf2f7', borderRadius: 10, background: '#fafafa', padding: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: '#111827' }}>Orders</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <input
            value={ordersPendingQuery}
            onChange={(e) => setOrdersPendingQuery(e.target.value)}
            placeholder="Search by order/customer/center"
            style={{ flex: 1, minWidth: 220, padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: 'white' }}
          />
          <span style={{ fontSize: 12, color: '#6b7280' }}>max 10</span>
        </div>
        <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Order ID', 'Approved By', 'Created By', 'Order Date', 'Quantity', 'Destination', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: 10, fontSize: 12, color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders
                .filter((o: any) => {
                  const q = ordersPendingQuery.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    String(o.order_id || '').toLowerCase().includes(q) ||
                    String(o.customer_id || '').toLowerCase().includes(q) ||
                    String(o.center_id || '').toLowerCase().includes(q)
                  );
                })
                .slice(0, 10)
                .map((o: any) => (
                  <tr key={o.order_id}>
                    <td style={{ padding: 10, fontWeight: 600 }}>{o.order_id}</td>
                    <td style={{ padding: 10 }}>{o.approved_by || '—'}</td>
                    <td style={{ padding: 10 }}>{(o.created_by_role || o.created_by_id) ? `${o.created_by_role || ''} ${o.created_by_id || ''}`.trim() : '—'}</td>
                    <td style={{ padding: 10 }}>{o.order_date ? String(o.order_date).slice(0, 10) : '—'}</td>
                    <td style={{ padding: 10 }}>{o.total_qty ?? o.item_count}</td>
                    <td style={{ padding: 10 }}>{o.center_id || '—'}</td>
                    <td style={{ padding: 10, display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleAssignOrder(o.order_id)}
                        style={{ padding: '6px 10px', background: '#e5e7eb', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => handleCreateShipment(o)}
                        style={{ padding: '6px 10px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}
                      >
                        Create Shipment
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orders Archive (Shipped) */}
      <div style={{ border: '1px solid #edf2f7', borderRadius: 10, background: '#fafafa', padding: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: '#111827' }}>Archive</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <input
            value={ordersArchiveQuery}
            onChange={(e) => setOrdersArchiveQuery(e.target.value)}
            placeholder="Search shipped orders"
            style={{ flex: 1, minWidth: 220, padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: 'white' }}
          />
          <span style={{ fontSize: 12, color: '#6b7280' }}>max 10</span>
        </div>
        <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Order ID', 'Approved By', 'Created By', 'Order Date', 'Quantity', 'Destination'].map(h => (
                  <th key={h} style={{ textAlign: 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: 10, fontSize: 12, color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordersArchive
                .filter((o: any) => {
                  const q = ordersArchiveQuery.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    String(o.order_id || '').toLowerCase().includes(q) ||
                    String(o.customer_id || '').toLowerCase().includes(q) ||
                    String(o.center_id || '').toLowerCase().includes(q)
                  );
                })
                .slice(0, 10)
                .map((o: any) => (
                  <tr key={o.order_id}>
                    <td style={{ padding: 10, fontWeight: 600 }}>{o.order_id}</td>
                    <td style={{ padding: 10 }}>{o.approved_by || '—'}</td>
                    <td style={{ padding: 10 }}>{(o.created_by_role || o.created_by_id) ? `${o.created_by_role || ''} ${o.created_by_id || ''}`.trim() : '—'}</td>
                    <td style={{ padding: 10 }}>{o.order_date ? String(o.order_date).slice(0, 10) : '—'}</td>
                    <td style={{ padding: 10 }}>{o.total_qty ?? o.item_count}</td>
                    <td style={{ padding: 10 }}>{o.center_id || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}