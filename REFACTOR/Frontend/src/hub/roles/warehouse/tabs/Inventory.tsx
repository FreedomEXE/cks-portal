/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Inventory.tsx
 * 
 * Description: Warehouse inventory management with stock tracking and adjustments
 * Function: View and manage inventory levels, locations, and stock movements
 * Importance: Critical - Core inventory management for warehouse operations
 * Connects to: Inventory API, stock management, supply chain
 */

import React, { useState, useEffect } from 'react';

interface InventoryProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

interface InventoryItem {
  item_id: string;
  item_name: string;
  item_type: 'product' | 'supply';
  quantity_on_hand: number;
  quantity_available: number;
  min_stock_level: number;
  location_code: string;
  is_low_stock: boolean;
}

interface HistoryItem {
  activity_type: string;
  item_name: string;
  description: string;
  quantity_change?: number;
  activity_timestamp: string;
}

export default function Inventory({ userId, config, features, api }: InventoryProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [productQuery, setProductQuery] = useState('');
  const [supplyQuery, setSupplyQuery] = useState('');
  const [historyQuery, setHistoryQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true);
        
        // Mock inventory data that matches legacy structure
        const mockInventory: InventoryItem[] = [
          // Products
          {
            item_id: 'PROD-001',
            item_name: 'Industrial Floor Cleaner',
            item_type: 'product',
            quantity_on_hand: 45,
            quantity_available: 40,
            min_stock_level: 25,
            location_code: 'A-12-B',
            is_low_stock: false
          },
          {
            item_id: 'PROD-002',
            item_name: 'Heavy Duty Degreaser',
            item_type: 'product',
            quantity_on_hand: 12,
            quantity_available: 12,
            min_stock_level: 20,
            location_code: 'A-15-C',
            is_low_stock: true
          },
          {
            item_id: 'PROD-003',
            item_name: 'Glass Cleaner Concentrate',
            item_type: 'product',
            quantity_on_hand: 0,
            quantity_available: 0,
            min_stock_level: 15,
            location_code: 'A-08-A',
            is_low_stock: true
          },
          // Supplies
          {
            item_id: 'SUP-001',
            item_name: 'Microfiber Cleaning Cloths',
            item_type: 'supply',
            quantity_on_hand: 200,
            quantity_available: 180,
            min_stock_level: 50,
            location_code: 'B-05-C',
            is_low_stock: false
          },
          {
            item_id: 'SUP-002',
            item_name: 'Disposable Gloves (Box)',
            item_type: 'supply',
            quantity_on_hand: 8,
            quantity_available: 5,
            min_stock_level: 25,
            location_code: 'B-02-A',
            is_low_stock: true
          },
          {
            item_id: 'SUP-003',
            item_name: 'Mop Heads',
            item_type: 'supply',
            quantity_on_hand: 75,
            quantity_available: 75,
            min_stock_level: 30,
            location_code: 'B-10-B',
            is_low_stock: false
          }
        ];

        // Mock history data
        const mockHistory: HistoryItem[] = [
          {
            activity_type: 'OUTBOUND',
            item_name: 'Industrial Floor Cleaner',
            description: 'Order fulfillment to Downtown Service Center',
            quantity_change: -5,
            activity_timestamp: '2025-09-11T10:30:00'
          },
          {
            activity_type: 'INBOUND',
            item_name: 'Disposable Gloves (Box)',
            description: 'Stock replenishment from supplier',
            quantity_change: 50,
            activity_timestamp: '2025-09-10T14:15:00'
          },
          {
            activity_type: 'ADJUSTMENT',
            item_name: 'Microfiber Cleaning Cloths',
            description: 'Inventory count adjustment',
            quantity_change: -20,
            activity_timestamp: '2025-09-09T16:45:00'
          },
          {
            activity_type: 'OUTBOUND',
            item_name: 'Heavy Duty Degreaser',
            description: 'Emergency order to North Campus',
            quantity_change: -8,
            activity_timestamp: '2025-09-09T09:20:00'
          }
        ];
        
        setInventory(mockInventory);
        setHistory(mockHistory);
        
      } catch (error) {
        console.error('Error loading inventory:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, [userId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
        <div>Loading inventory...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Two-column layout within a single outer card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Products Panel */}
        <div style={{ border: '1px solid #edf2f7', borderRadius: 10, background: '#fafafa', padding: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: '#111827' }}>Products</div>
          {/* Search */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Search by Product ID or name"
              style={{ flex: 1, padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: 'white' }}
            />
            <span style={{ fontSize: 12, color: '#6b7280' }}>max 10</span>
          </div>
          <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Product ID', 'Name', 'On Hand', 'Available', 'Min', 'Location', 'Low?'].map(h => (
                    <th key={h} style={{ textAlign: 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: 10, fontSize: 12, color: '#6b7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventory
                  .filter((it: any) => it.item_type === 'product')
                  .filter((it: any) => {
                    const q = productQuery.trim().toLowerCase();
                    if (!q) return true;
                    return String(it.item_id || '').toLowerCase().includes(q) || String(it.item_name || '').toLowerCase().includes(q);
                  })
                  .slice(0, 10)
                  .map((it: any) => (
                    <tr key={`${it.item_id}`}>
                      <td style={{ padding: 10, fontWeight: 600 }}>{it.item_id}</td>
                      <td style={{ padding: 10 }}>{it.item_name}</td>
                      <td style={{ padding: 10 }}>{it.quantity_on_hand}</td>
                      <td style={{ padding: 10 }}>{it.quantity_available}</td>
                      <td style={{ padding: 10 }}>{it.min_stock_level ?? 0}</td>
                      <td style={{ padding: 10 }}>{it.location_code || '—'}</td>
                      <td style={{ padding: 10 }}>{it.is_low_stock ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Supplies Panel */}
        <div style={{ border: '1px solid #edf2f7', borderRadius: 10, background: '#fafafa', padding: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: '#111827' }}>Supplies</div>
          {/* Search */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input
              value={supplyQuery}
              onChange={(e) => setSupplyQuery(e.target.value)}
              placeholder="Search by Supply ID or name"
              style={{ flex: 1, padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: 'white' }}
            />
            <span style={{ fontSize: 12, color: '#6b7280' }}>max 10</span>
          </div>
          <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Supply ID', 'Name', 'On Hand', 'Available', 'Min', 'Location', 'Low?'].map(h => (
                    <th key={h} style={{ textAlign: 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: 10, fontSize: 12, color: '#6b7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventory
                  .filter((it: any) => it.item_type === 'supply')
                  .filter((it: any) => {
                    const q = supplyQuery.trim().toLowerCase();
                    if (!q) return true;
                    return String(it.item_id || '').toLowerCase().includes(q) || String(it.item_name || '').toLowerCase().includes(q);
                  })
                  .slice(0, 10)
                  .map((it: any) => (
                    <tr key={`${it.item_id}`}>
                      <td style={{ padding: 10, fontWeight: 600 }}>{it.item_id}</td>
                      <td style={{ padding: 10 }}>{it.item_name}</td>
                      <td style={{ padding: 10 }}>{it.quantity_on_hand}</td>
                      <td style={{ padding: 10 }}>{it.quantity_available}</td>
                      <td style={{ padding: 10 }}>{it.min_stock_level ?? 0}</td>
                      <td style={{ padding: 10 }}>{it.location_code || '—'}</td>
                      <td style={{ padding: 10 }}>{it.is_low_stock ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Archive & History Section */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Archive & History</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={historyQuery}
              onChange={(e) => setHistoryQuery(e.target.value)}
              placeholder="Search history"
              style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}
            />
            <span style={{ fontSize: 12, color: '#6b7280' }}>max 10</span>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {(history || [])
            .filter((h: any) => {
              const q = historyQuery.trim().toLowerCase();
              if (!q) return true;
              return String(h.item_name || '').toLowerCase().includes(q) || String(h.description || '').toLowerCase().includes(q) || String(h.activity_type || '').toLowerCase().includes(q);
            })
            .slice(0, 10)
            .map((h: any, idx: number) => (
              <div key={idx} style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#ede9fe', color: '#6d28d9', fontWeight: 600 }}>{String(h.activity_type || '').toUpperCase()}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{h.item_name || h.description || 'Inventory event'}</span>
                {typeof h.quantity_change === 'number' && (
                  <span style={{ fontSize: 12, color: h.quantity_change > 0 ? '#166534' : '#991b1b' }}>
                    {h.quantity_change > 0 ? `+${h.quantity_change}` : h.quantity_change}
                  </span>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6b7280' }}>{h.activity_timestamp ? String(h.activity_timestamp).slice(0, 19).replace('T', ' ') : ''}</span>
              </div>
            ))}
          {(!history || history.length === 0) && (
            <div style={{ fontSize: 13, color: '#6b7280' }}>No archive entries yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}