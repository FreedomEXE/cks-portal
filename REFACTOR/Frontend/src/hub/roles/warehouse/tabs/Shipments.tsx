/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Shipments.tsx
 * 
 * Description: Warehouse shipment management and tracking
 * Function: View and manage shipments for warehouse operations
 * Importance: Critical - Shipment tracking and logistics coordination
 * Connects to: Shipment API, delivery systems, order fulfillment
 */

import React, { useState, useEffect } from 'react';

interface ShipmentsProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

interface Shipment {
  shipment_id: string;
  order_id: string;
  shipment_date?: string;
  order_date?: string;
  total_qty?: number;
  item_count?: number;
  center_id?: string;
  status: 'pending' | 'delivered' | 'cancelled';
  order_kind?: 'recurring' | 'one-time';
  recurrence_interval?: string;
  actual_delivery_date?: string;
}

export default function Shipments({ userId, config, features, api }: ShipmentsProps) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [shipPendingOneQuery, setShipPendingOneQuery] = useState('');
  const [shipPendingRecQuery, setShipPendingRecQuery] = useState('');
  const [shipArchiveQuery, setShipArchiveQuery] = useState('');
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
    const loadShipments = async () => {
      try {
        setLoading(true);
        
        // Mock shipments data
        const mockShipments: Shipment[] = [
          // One-time pending shipments
          {
            shipment_id: 'SHIP-001',
            order_id: 'WH-2025-001',
            shipment_date: '2025-09-11',
            total_qty: 15,
            item_count: 15,
            center_id: 'CTR-001',
            status: 'pending',
            order_kind: 'one-time'
          },
          {
            shipment_id: 'SHIP-002',
            order_id: 'WH-2025-002',
            shipment_date: '2025-09-10',
            total_qty: 8,
            item_count: 8,
            center_id: 'CTR-002',
            status: 'pending',
            order_kind: 'one-time'
          },
          // Recurring pending shipments
          {
            shipment_id: 'SHIP-003',
            order_id: 'WH-REC-001',
            order_date: '2025-09-01',
            shipment_date: '2025-09-11',
            total_qty: 25,
            item_count: 25,
            center_id: 'CTR-003',
            status: 'pending',
            order_kind: 'recurring',
            recurrence_interval: 'Weekly'
          },
          {
            shipment_id: 'SHIP-004',
            order_id: 'WH-REC-002',
            order_date: '2025-08-15',
            shipment_date: '2025-09-15',
            total_qty: 12,
            item_count: 12,
            center_id: 'CTR-004',
            status: 'pending',
            order_kind: 'recurring',
            recurrence_interval: 'Monthly'
          },
          // Delivered shipments (archive)
          {
            shipment_id: 'SHIP-005',
            order_id: 'WH-2025-005',
            shipment_date: '2025-09-08',
            total_qty: 20,
            item_count: 20,
            center_id: 'CTR-005',
            status: 'delivered',
            order_kind: 'one-time',
            actual_delivery_date: '2025-09-09'
          },
          {
            shipment_id: 'SHIP-006',
            order_id: 'WH-2025-006',
            shipment_date: '2025-09-07',
            total_qty: 30,
            item_count: 30,
            center_id: 'CTR-006',
            status: 'delivered',
            order_kind: 'one-time',
            actual_delivery_date: '2025-09-08'
          }
        ];
        
        setShipments(mockShipments);
        
      } catch (error) {
        console.error('Error loading shipments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadShipments();
  }, [userId]);

  const handleDeliverShipment = async (shipmentId: string) => {
    try {
      // Mock deliver shipment functionality
      console.log('Delivering shipment:', shipmentId);
      // In real implementation, would call API to mark shipment as delivered
      setShipments(prev => prev.map(s => 
        s.shipment_id === shipmentId 
          ? { ...s, status: 'delivered' as const, actual_delivery_date: new Date().toISOString().slice(0, 10) }
          : s
      ));
    } catch (error) {
      console.error('Error delivering shipment:', error);
    }
  };

  const handleCancelShipment = async (shipmentId: string) => {
    try {
      // Mock cancel shipment functionality
      console.log('Cancelling shipment:', shipmentId);
      // In real implementation, would call API to cancel shipment
      setShipments(prev => prev.map(s => 
        s.shipment_id === shipmentId 
          ? { ...s, status: 'cancelled' as const }
          : s
      ));
    } catch (error) {
      console.error('Error cancelling shipment:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
        <div>Loading shipments...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Top: Shipments split into One-time and Recurring (like Inventory split) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, alignItems: 'stretch' }}>
        {/* One-time */}
        <div style={{ border: '1px solid #edf2f7', borderRadius: 10, background: '#fafafa', padding: 12, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: '#111827' }}>One-time</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input
              value={shipPendingOneQuery}
              onChange={(e) => setShipPendingOneQuery(e.target.value)}
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
                {shipments
                  .filter((s: any) => String(s.status || 'pending') === 'pending')
                  .filter((s: any) => (s.order_kind !== 'recurring'))
                  .filter((s: any) => {
                    const q = shipPendingOneQuery.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      String(s.order_id || '').toLowerCase().includes(q) ||
                      String(s.center_id || '').toLowerCase().includes(q)
                    );
                  })
                  .slice(0, 10)
                  .map((s: any) => (
                    <tr key={s.shipment_id}>
                      <td style={{ padding: 10, fontWeight: 600 }}>{s.order_id}</td>
                      <td style={{ padding: 10 }}>{fmtDate(s.shipment_date)}</td>
                      <td style={{ padding: 10 }}>{s.total_qty ?? s.item_count ?? 0}</td>
                      <td style={{ padding: 10 }}>{s.center_id || '—'}</td>
                      <td style={{ padding: 10 }}>pending</td>
                      <td style={{ padding: 10 }}>{'—'}</td>
                      <td style={{ padding: 10, display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleDeliverShipment(s.shipment_id)}
                          style={{ padding: '6px 10px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}
                        >
                          Delivered
                        </button>
                        <button
                          onClick={() => handleCancelShipment(s.shipment_id)}
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
              value={shipPendingRecQuery}
              onChange={(e) => setShipPendingRecQuery(e.target.value)}
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
                {shipments
                  .filter((s: any) => String(s.status || 'pending') === 'pending')
                  .filter((s: any) => (s.order_kind === 'recurring'))
                  .filter((s: any) => {
                    const q = shipPendingRecQuery.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      String(s.order_id || '').toLowerCase().includes(q) ||
                      String(s.center_id || '').toLowerCase().includes(q)
                    );
                  })
                  .slice(0, 10)
                  .map((s: any) => (
                    <tr key={s.shipment_id}>
                      <td style={{ padding: 10, fontWeight: 600 }}>{s.order_id}</td>
                      <td style={{ padding: 10 }}>{fmtDate(s.order_date)}</td>
                      <td style={{ padding: 10 }}>{s.total_qty ?? s.item_count ?? 0}</td>
                      <td style={{ padding: 10 }}>{s.center_id || '—'}</td>
                      <td style={{ padding: 10 }}>{s.recurrence_interval || '—'}</td>
                      <td style={{ padding: 10 }}>{nextScheduled(s.shipment_date || s.order_date, s.recurrence_interval)}</td>
                      <td style={{ padding: 10 }}>pending</td>
                      <td style={{ padding: 10, display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleDeliverShipment(s.shipment_id)}
                          style={{ padding: '6px 10px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}
                        >
                          Delivered
                        </button>
                        <button
                          onClick={() => handleCancelShipment(s.shipment_id)}
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
            value={shipArchiveQuery}
            onChange={(e) => setShipArchiveQuery(e.target.value)}
            placeholder="Search delivered shipments"
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
              {shipments
                .filter((s: any) => String(s.status || '') === 'delivered')
                .filter((s: any) => {
                  const q = shipArchiveQuery.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    String(s.order_id || '').toLowerCase().includes(q) ||
                    String(s.center_id || '').toLowerCase().includes(q)
                  );
                })
                .slice(0, 10)
                .map((s: any) => (
                  <tr key={s.shipment_id}>
                    <td style={{ padding: 10, fontWeight: 600 }}>{s.order_id}</td>
                    <td style={{ padding: 10 }}>{fmtDate(s.shipment_date)}</td>
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