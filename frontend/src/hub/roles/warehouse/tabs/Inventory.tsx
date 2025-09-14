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
  item_type: 'Equipment' | 'Products' | 'Materials';
  quantity_on_hand: number;
  quantity_available: number;
  min_stock_level: number;
  location_code: string;
  is_low_stock: boolean;
}

interface ArchiveItem {
  item_id: string;
  item_name: string;
  item_type: 'Equipment' | 'Products' | 'Materials';
  archived_date: string;
  reason: string;
}

export default function Inventory({ userId, config, features, api }: InventoryProps) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'archive'>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [archive, setArchive] = useState<ArchiveItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Equipment' | 'Products' | 'Materials'>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true);
        
        // Mock unified supply inventory with SUP-xxx IDs
        const mockInventory: InventoryItem[] = [
          // Equipment
          {
            item_id: 'SUP-001',
            item_name: 'Industrial Floor Scrubber',
            item_type: 'Equipment',
            quantity_on_hand: 3,
            quantity_available: 2,
            min_stock_level: 2,
            location_code: 'A-12-B',
            is_low_stock: false
          },
          {
            item_id: 'SUP-002',
            item_name: 'Commercial Vacuum Cleaner',
            item_type: 'Equipment',
            quantity_on_hand: 1,
            quantity_available: 1,
            min_stock_level: 2,
            location_code: 'A-15-C',
            is_low_stock: true
          },
          // Products
          {
            item_id: 'SUP-003',
            item_name: 'Industrial Floor Cleaner',
            item_type: 'Products',
            quantity_on_hand: 45,
            quantity_available: 40,
            min_stock_level: 25,
            location_code: 'B-01-A',
            is_low_stock: false
          },
          {
            item_id: 'SUP-004',
            item_name: 'Heavy Duty Degreaser',
            item_type: 'Products',
            quantity_on_hand: 12,
            quantity_available: 12,
            min_stock_level: 20,
            location_code: 'B-02-C',
            is_low_stock: true
          },
          {
            item_id: 'SUP-005',
            item_name: 'Glass Cleaner Concentrate',
            item_type: 'Products',
            quantity_on_hand: 0,
            quantity_available: 0,
            min_stock_level: 15,
            location_code: 'B-03-A',
            is_low_stock: true
          },
          // Materials
          {
            item_id: 'SUP-006',
            item_name: 'Microfiber Cleaning Cloths',
            item_type: 'Materials',
            quantity_on_hand: 200,
            quantity_available: 180,
            min_stock_level: 50,
            location_code: 'C-05-C',
            is_low_stock: false
          },
          {
            item_id: 'SUP-007',
            item_name: 'Disposable Gloves (Box)',
            item_type: 'Materials',
            quantity_on_hand: 8,
            quantity_available: 5,
            min_stock_level: 25,
            location_code: 'C-02-A',
            is_low_stock: true
          },
          {
            item_id: 'SUP-008',
            item_name: 'Mop Heads',
            item_type: 'Materials',
            quantity_on_hand: 75,
            quantity_available: 75,
            min_stock_level: 30,
            location_code: 'C-10-B',
            is_low_stock: false
          }
        ];

        // Mock archive data - simplified
        const mockArchive: ArchiveItem[] = [
          {
            item_id: 'SUP-099',
            item_name: 'Obsolete Floor Waxer',
            item_type: 'Equipment',
            archived_date: '2025-08-15',
            reason: 'Equipment replaced'
          },
          {
            item_id: 'SUP-098',
            item_name: 'Discontinued Cleaner Brand',
            item_type: 'Products',
            archived_date: '2025-07-20',
            reason: 'Product discontinued'
          },
          {
            item_id: 'SUP-097',
            item_name: 'Old Safety Gloves',
            item_type: 'Materials',
            archived_date: '2025-06-10',
            reason: 'Safety standards updated'
          },
          {
            item_id: 'SUP-096',
            item_name: 'Broken Cleaning Cart',
            item_type: 'Equipment',
            archived_date: '2025-05-25',
            reason: 'Damaged beyond repair'
          }
        ];
        
        setInventory(mockInventory);
        setArchive(mockArchive);
        
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

  const getCurrentData = () => {
    return activeTab === 'inventory' ? inventory : archive;
  };

  const getFilteredData = () => {
    const data = getCurrentData();
    return data.filter((item: any) => {
      // Search filter
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || 
        String(item.item_id || '').toLowerCase().includes(q) || 
        String(item.item_name || '').toLowerCase().includes(q);
      
      // Type filter
      const matchesType = typeFilter === 'All' || item.item_type === typeFilter;
      
      return matchesSearch && matchesType;
    }).slice(0, 10);
  };

  const getTableHeaders = () => {
    if (activeTab === 'inventory') {
      return ['Supply ID', 'Name', 'Type', 'On Hand', 'Available', 'Min', 'Location', 'Low?'];
    } else {
      return ['Supply ID', 'Name', 'Type', 'Archived Date', 'Reason'];
    }
  };

  const renderTableRow = (item: any) => {
    if (activeTab === 'inventory') {
      return (
        <tr key={item.item_id}>
          <td style={{ padding: 10, fontWeight: 600, color: '#8b5cf6' }}>{item.item_id}</td>
          <td style={{ padding: 10 }}>{item.item_name}</td>
          <td style={{ padding: 10 }}>{item.item_type}</td>
          <td style={{ padding: 10 }}>{item.quantity_on_hand}</td>
          <td style={{ padding: 10 }}>{item.quantity_available}</td>
          <td style={{ padding: 10 }}>{item.min_stock_level ?? 0}</td>
          <td style={{ padding: 10 }}>{item.location_code || '—'}</td>
          <td style={{ padding: 10 }}>
            <span style={{
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 600,
              background: item.is_low_stock ? '#fef2f2' : '#dcfce7',
              color: item.is_low_stock ? '#991b1b' : '#166534'
            }}>
              {item.is_low_stock ? 'Yes' : 'No'}
            </span>
          </td>
        </tr>
      );
    } else {
      return (
        <tr key={item.item_id}>
          <td style={{ padding: 10, fontWeight: 600, color: '#8b5cf6' }}>{item.item_id}</td>
          <td style={{ padding: 10 }}>{item.item_name}</td>
          <td style={{ padding: 10 }}>{item.item_type}</td>
          <td style={{ padding: 10 }}>{item.archived_date}</td>
          <td style={{ padding: 10 }}>{item.reason}</td>
        </tr>
      );
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'inventory': return `Supply Inventory (${inventory.length})`;
      case 'archive': return `Archive (${archive.length})`;
      default: return tab;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#111827' }}>
          Inventory
        </h2>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['inventory', 'archive'] as const).map(tab => (
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
              cursor: 'pointer'
            }}
          >
            {getTabLabel(tab)}
          </button>
        ))}
      </div>

      {/* Single Content Panel */}
      <div style={{ border: '1px solid #edf2f7', borderRadius: 10, background: '#fafafa', padding: 12 }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
          {activeTab === 'inventory' 
            ? 'Current supply inventory with stock levels'
            : 'Archived supplies no longer in active inventory'
          }
        </div>
        
        {/* Search and Type Filter */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Supply ID or name"
            style={{ flex: 1, padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: 'white' }}
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: 'white' }}
          >
            <option value="All">All Types</option>
            <option value="Equipment">Equipment</option>
            <option value="Products">Products</option>
            <option value="Materials">Materials</option>
          </select>
          <span style={{ fontSize: 12, color: '#6b7280' }}>max 10</span>
        </div>
        
        {/* Table */}
        <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {getTableHeaders().map(h => (
                  <th key={h} style={{ 
                    textAlign: 'left', 
                    background: '#f9fafb', 
                    borderBottom: '1px solid #e5e7eb', 
                    padding: 10, 
                    fontSize: 12, 
                    color: '#6b7280' 
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {getFilteredData().map((item: any) => renderTableRow(item))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}