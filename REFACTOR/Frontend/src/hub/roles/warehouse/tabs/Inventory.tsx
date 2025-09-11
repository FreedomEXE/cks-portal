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
  id: string;
  name: string;
  category: string;
  sku: string;
  current_stock: number;
  min_threshold: number;
  max_capacity: number;
  location: string;
  unit: string;
  cost_per_unit: number;
  last_updated: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstocked';
}

export default function Inventory({ userId, config, features, api }: InventoryProps) {
  const [activeTab, setActiveTab] = useState<'current' | 'movements'>('current');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true);
        
        // Mock inventory data
        const mockInventory: InventoryItem[] = [
          {
            id: 'INV-001',
            name: 'Industrial Cleaning Solution',
            category: 'Cleaning Chemicals',
            sku: 'ICS-500',
            current_stock: 45,
            min_threshold: 25,
            max_capacity: 100,
            location: 'A-12-B',
            unit: 'Gallons',
            cost_per_unit: 24.99,
            last_updated: '2025-09-10',
            status: 'In Stock'
          },
          {
            id: 'INV-002',
            name: 'Microfiber Towels',
            category: 'Cleaning Supplies',
            sku: 'MFT-200',
            current_stock: 8,
            min_threshold: 50,
            max_capacity: 200,
            location: 'B-05-C',
            unit: 'Packs',
            cost_per_unit: 12.50,
            last_updated: '2025-09-09',
            status: 'Low Stock'
          },
          {
            id: 'INV-003',
            name: 'Safety Gloves',
            category: 'Safety Equipment',
            sku: 'SG-100',
            current_stock: 0,
            min_threshold: 30,
            max_capacity: 150,
            location: 'C-08-A',
            unit: 'Boxes',
            cost_per_unit: 8.75,
            last_updated: '2025-09-08',
            status: 'Out of Stock'
          },
          {
            id: 'INV-004',
            name: 'Floor Mop Heads',
            category: 'Cleaning Equipment',
            sku: 'FMH-75',
            current_stock: 125,
            min_threshold: 40,
            max_capacity: 80,
            location: 'D-03-B',
            unit: 'Pieces',
            cost_per_unit: 3.25,
            last_updated: '2025-09-11',
            status: 'Overstocked'
          }
        ];

        // Mock movement history
        const mockMovements = [
          {
            id: 'MOV-001',
            item_name: 'Industrial Cleaning Solution',
            type: 'Outbound',
            quantity: -12,
            destination: 'Downtown Service Center',
            date: '2025-09-10',
            operator: 'Warehouse Staff'
          },
          {
            id: 'MOV-002',
            item_name: 'Safety Gloves',
            type: 'Inbound',
            quantity: +50,
            destination: 'Supplier Delivery',
            date: '2025-09-09',
            operator: 'Receiving Team'
          }
        ];
        
        setInventoryItems(mockInventory);
        setMovements(mockMovements);
        
      } catch (error) {
        console.error('Error loading inventory:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, [userId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return '#10b981';
      case 'Low Stock': return '#f59e0b';
      case 'Out of Stock': return '#ef4444';
      case 'Overstocked': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
        <div>Loading inventory...</div>
      </div>
    );
  }

  const currentData = activeTab === 'current' ? inventoryItems : movements;

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Inventory Management</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{
            padding: '8px 16px',
            border: '1px solid #8b5cf6',
            borderRadius: 6,
            background: 'white',
            color: '#8b5cf6',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            Add Item
          </button>
          <button style={{
            padding: '8px 16px',
            border: '1px solid #8b5cf6',
            borderRadius: 6,
            background: '#8b5cf6',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            Adjust Stock
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['current', 'movements'] as const).map(tab => (
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
            {tab === 'current' ? `Current Stock (${inventoryItems.length})` : `Stock Movements (${movements.length})`}
          </button>
        ))}
      </div>

      {/* Inventory List */}
      <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
        {activeTab === 'current' ? (
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              {inventoryItems.map(item => (
                <div key={item.id} style={{
                  padding: 16,
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  background: '#f9fafb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#111827' }}>
                        {item.name}
                      </h3>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                        SKU: {item.sku} • Location: {item.location} • Category: {item.category}
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: getStatusColor(item.status),
                      color: 'white'
                    }}>
                      {item.status}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, fontSize: 12 }}>
                    <div>
                      <span style={{ color: '#6b7280' }}>Current Stock: </span>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{item.current_stock} {item.unit}</span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Min Threshold: </span>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{item.min_threshold} {item.unit}</span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Max Capacity: </span>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{item.max_capacity} {item.unit}</span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Cost Per Unit: </span>
                      <span style={{ fontWeight: 600, color: '#111827' }}>${item.cost_per_unit}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 12 }}>
                    <div style={{ color: '#6b7280' }}>
                      Last Updated: {item.last_updated}
                    </div>
                    <button style={{
                      padding: '6px 12px',
                      background: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}>
                      Adjust Stock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              {movements.map(movement => (
                <div key={movement.id} style={{
                  padding: 16,
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  background: movement.type === 'Inbound' ? '#f0f9ff' : '#fef2f2'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#111827' }}>
                        {movement.item_name}
                      </h4>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                        {movement.destination} • {movement.date} • By: {movement.operator}
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      color: movement.quantity > 0 ? '#059669' : '#dc2626'
                    }}>
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                    </div>
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