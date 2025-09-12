/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Deliveries.tsx
 * 
 * Description: Warehouse delivery management and tracking
 * Function: View and manage deliveries for warehouse operations
 * Importance: Critical - Delivery tracking and logistics coordination
 * Connects to: Delivery API, delivery systems, order fulfillment
 */

import React, { useState, useEffect } from 'react';

interface DeliveriesProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

interface Delivery {
  delivery_id: string;
  order_id: string;
  delivery_date?: string;
  order_date?: string;
  total_qty?: number;
  item_count?: number;
  center_id?: string;
  status: 'pending' | 'delivered' | 'cancelled';
  order_kind?: 'recurring' | 'one-time';
  recurrence_interval?: string;
  actual_delivery_date?: string;
}

export default function Deliveries({ userId, config, features, api }: DeliveriesProps) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveryPendingOneQuery, setDeliveryPendingOneQuery] = useState('');
  const [deliveryPendingRecQuery, setDeliveryPendingRecQuery] = useState('');
  const [deliveryArchiveQuery, setDeliveryArchiveQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Helper function to format date
  const fmtDate = (d?: any): string => {
    if (!d) return '—';
    try { 
      return String(d).slice(0, 10); 
    } catch { 
      return '—'; 
    }
  };

  // Helper function to calculate next scheduled delivery
  const nextScheduled = (base: any, interval?: string): string => {
    if (!interval) return '—';
    const b = new Date(base || Date.now());
    const lower = interval.toLowerCase();
    if (lower.includes('week')) { 
      b.setDate(b.getDate() + 7); 
      return b.toISOString().slice(0, 10); 
    }
    if (lower.includes('month')) { 
      b.setMonth(b.getMonth() + 1); 
      return b.toISOString().slice(0, 10); 
    }
    return '—';
  };

  useEffect(() => {
    const loadDeliveries = async () => {
      try {
        setLoading(true);
        
        // Mock deliveries data
        const mockDeliveries: Delivery[] = [
          // One-time pending deliveries
          {
            delivery_id: 'DEL-001',
            order_id: 'CRW001-ORD-SUP001',
            delivery_date: '2025-09-11',
            total_qty: 15,
            item_count: 15,
            center_id: 'CTR-001',
            status: 'pending',
            order_kind: 'one-time'
          },
          {
            delivery_id: 'DEL-002',
            order_id: 'CTR002-ORD-SUP003',
            delivery_date: '2025-09-10',
            total_qty: 8,
            item_count: 8,
            center_id: 'CTR-002',
            status: 'pending',
            order_kind: 'one-time'
          },
          // Recurring pending deliveries
          {
            delivery_id: 'DEL-003',
            order_id: 'CRW003-ORD-SUP005',
            order_date: '2025-09-01',
            delivery_date: '2025-09-11',
            total_qty: 25,
            item_count: 25,
            center_id: 'CTR-003',
            status: 'pending',
            order_kind: 'recurring',
            recurrence_interval: 'Weekly'
          },
          {
            delivery_id: 'DEL-004',
            order_id: 'CTR001-ORD-SUP002',
            order_date: '2025-08-15',
            delivery_date: '2025-09-15',
            total_qty: 12,
            item_count: 12,
            center_id: 'CTR-004',
            status: 'pending',
            order_kind: 'recurring',
            recurrence_interval: 'Monthly'
          },
          // Delivered deliveries (archive)
          {
            delivery_id: 'DEL-005',
            order_id: 'CRW002-ORD-SUP006',
            delivery_date: '2025-09-08',
            total_qty: 20,
            item_count: 20,
            center_id: 'CTR-005',
            status: 'delivered',
            order_kind: 'one-time',
            actual_delivery_date: '2025-09-09'
          },
          {
            delivery_id: 'DEL-006',
            order_id: 'CTR003-ORD-SUP004',
            delivery_date: '2025-09-07',
            total_qty: 30,
            item_count: 30,
            center_id: 'CTR-006',
            status: 'delivered',
            order_kind: 'one-time',
            actual_delivery_date: '2025-09-08'
          }
        ];
        
        setDeliveries(mockDeliveries);
        
      } catch (error) {
        console.error('Error loading deliveries:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDeliveries();
  }, [userId]);

  const handleCompleteDelivery = async (deliveryId: string) => {
    try {
      // Mock complete delivery functionality
      console.log('Completing delivery:', deliveryId);
      // In real implementation, would call API to mark delivery as delivered
      setDeliveries(prev => prev.map(s => 
        s.delivery_id === deliveryId 
          ? { ...s, status: 'delivered' as const, actual_delivery_date: new Date().toISOString().slice(0, 10) }
          : s
      ));
    } catch (error) {
      console.error('Error delivering shipment:', error);
    }
  };

  const handleCancelDelivery = async (deliveryId: string) => {
    try {
      // Mock cancel delivery functionality
      console.log('Cancelling delivery:', deliveryId);
      // In real implementation, would call API to cancel delivery
      setDeliveries(prev => prev.map(s => 
        s.delivery_id === deliveryId 
          ? { ...s, status: 'cancelled' as const }
          : s
      ));
    } catch (error) {
      console.error('Error cancelling delivery:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
        <div>Loading deliveries...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Top: Deliveries split into One-time and Recurring (like Inventory split) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, alignItems: 'stretch' }}>
        {/* One-time */}
        <div style={{ border: '1px solid #edf2f7', borderRadius: 10, background: '#fafafa', padding: 12, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: '#111827' }}>One-time</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input
              value={deliveryPendingOneQuery}
              onChange={(e) => setDeliveryPendingOneQuery(e.target.value)}
              placeholder="Search by order/center"
              style={{ flex: 1, padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: 'white' }}
            />
            <span style={{ fontSize: 12, color: '#6b7280' }}>max 10</span>
          </div>
          <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Order ID', 'Order Date', 'Quantity', 'Destination', 'Status', 'Delivery Date', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: 10, fontSize: 12, color: '#6b7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deliveries
                  .filter((s: any) => String(s.status || 'pending') === 'pending')
                  .filter((s: any) => (s.order_kind !== 'recurring'))
                  .filter((s: any) => {
                    const q = deliveryPendingOneQuery.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      String(s.order_id || '').toLowerCase().includes(q) ||
                      String(s.center_id || '').toLowerCase().includes(q)
                    );
                  })
                  .slice(0, 10)
                  .map((s: any) => (
                    <tr key={s.delivery_id}>
                      <td style={{ padding: 10, fontWeight: 600 }}>{s.order_id}</td>
                      <td style={{ padding: 10 }}>{fmtDate(s.delivery_date)}</td>
                      <td style={{ padding: 10 }}>{s.total_qty ?? s.item_count ?? 0}</td>
                      <td style={{ padding: 10 }}>{s.center_id || '—'}</td>
                      <td style={{ padding: 10 }}>pending</td>
                      <td style={{ padding: 10 }}>{'—'}</td>
                      <td style={{ padding: 10, display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleCompleteDelivery(s.delivery_id)}
                          style={{ padding: '6px 10px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}
                        >
                          Delivered
                        </button>
                        <button
                          onClick={() => handleCancelDelivery(s.delivery_id)}
                          style={{ padding: '6px 10px', background: '#e5e7eb', color: '#111827', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recurring */}
        <div style={{ border: '1px solid #edf2f7', borderRadius: 10, background: '#fafafa', padding: 12, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: '#111827' }}>Recurring</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input
              value={deliveryPendingRecQuery}
              onChange={(e) => setDeliveryPendingRecQuery(e.target.value)}
              placeholder="Search by order/center"
              style={{ flex: 1, padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: 'white' }}
            />
            <span style={{ fontSize: 12, color: '#6b7280' }}>max 10</span>
          </div>
          <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Order ID', 'Creation Date', 'Quantity', 'Destination', 'Delivery Frequency', 'Next Delivery', 'Status', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: 10, fontSize: 12, color: '#6b7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deliveries
                  .filter((s: any) => String(s.status || 'pending') === 'pending')
                  .filter((s: any) => (s.order_kind === 'recurring'))
                  .filter((s: any) => {
                    const q = deliveryPendingRecQuery.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      String(s.order_id || '').toLowerCase().includes(q) ||
                      String(s.center_id || '').toLowerCase().includes(q)
                    );
                  })
                  .slice(0, 10)
                  .map((s: any) => (
                    <tr key={s.delivery_id}>
                      <td style={{ padding: 10, fontWeight: 600 }}>{s.order_id}</td>
                      <td style={{ padding: 10 }}>{fmtDate(s.order_date)}</td>
                      <td style={{ padding: 10 }}>{s.total_qty ?? s.item_count ?? 0}</td>
                      <td style={{ padding: 10 }}>{s.center_id || '—'}</td>
                      <td style={{ padding: 10 }}>{s.recurrence_interval || '—'}</td>
                      <td style={{ padding: 10 }}>{nextScheduled(s.delivery_date || s.order_date, s.recurrence_interval)}</td>
                      <td style={{ padding: 10 }}>pending</td>
                      <td style={{ padding: 10, display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleCompleteDelivery(s.delivery_id)}
                          style={{ padding: '6px 10px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}
                        >
                          Delivered
                        </button>
                        <button
                          onClick={() => handleCancelDelivery(s.delivery_id)}
                          style={{ padding: '6px 10px', background: '#e5e7eb', color: '#111827', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Archive Panel (Delivered) */}
      <div style={{ border: '1px solid #edf2f7', borderRadius: 10, background: '#fafafa', padding: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: '#111827' }}>Archive</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <input
            value={deliveryArchiveQuery}
            onChange={(e) => setDeliveryArchiveQuery(e.target.value)}
            placeholder="Search delivered deliveries"
            style={{ flex: 1, padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: 'white' }}
          />
          <span style={{ fontSize: 12, color: '#6b7280' }}>max 10</span>
        </div>
        <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Order ID', 'Order Date', 'Quantity', 'Destination', 'Status', 'Delivery Date'].map(h => (
                  <th key={h} style={{ textAlign: 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: 10, fontSize: 12, color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deliveries
                .filter((s: any) => String(s.status || '') === 'delivered')
                .filter((s: any) => {
                  const q = deliveryArchiveQuery.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    String(s.order_id || '').toLowerCase().includes(q) ||
                    String(s.center_id || '').toLowerCase().includes(q)
                  );
                })
                .slice(0, 10)
                .map((s: any) => (
                  <tr key={s.delivery_id}>
                    <td style={{ padding: 10, fontWeight: 600 }}>{s.order_id}</td>
                    <td style={{ padding: 10 }}>{fmtDate(s.delivery_date)}</td>
                    <td style={{ padding: 10 }}>{s.total_qty ?? s.item_count ?? 0}</td>
                    <td style={{ padding: 10 }}>{s.center_id || '—'}</td>
                    <td style={{ padding: 10 }}>{String(s.status || '').toLowerCase()}</td>
                    <td style={{ padding: 10 }}>{fmtDate(s.actual_delivery_date)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}