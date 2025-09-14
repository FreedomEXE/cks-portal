/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import React, { useState } from 'react';

interface OrdersProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

const mockSupplyOrders = {
  in_progress: [
    {
      orderId: 'CRW001-ORD-SUP001',
      orderType: 'supply',
      itemName: 'Safety Equipment Request',
      centerName: 'Site A - Building 2',
      centerId: 'CEN001',
      requestedBy: 'Crew Lead',
      createdBy: 'crew',
      contractorStatus: 'approved',
      warehouseStatus: 'pending',
      priority: 'high'
    },
    {
      orderId: 'CEN001-ORD-SUP002',
      orderType: 'supply',
      itemName: 'Office Supplies',
      centerName: 'Center Office',
      centerId: 'CEN001',
      requestedBy: 'Office Manager',
      createdBy: 'center',
      contractorStatus: 'approved',
      warehouseStatus: 'pending',
      priority: 'medium'
    },
    {
      orderId: 'CUST001-ORD-SUP001',
      orderType: 'supply',
      itemName: 'Cleaning Supplies',
      centerName: 'Customer Facility',
      centerId: 'CEN002',
      requestedBy: 'Facility Manager',
      createdBy: 'customer',
      contractorStatus: 'approved',
      warehouseStatus: 'pending',
      priority: 'low'
    }
  ],
  archive: [
    {
      orderId: 'CRW002-SUP001',
      orderType: 'supply',
      itemName: 'Tool Replacement',
      centerName: 'Site B - Workshop',
      centerId: 'CEN003',
      requestedBy: 'Crew Lead',
      createdBy: 'crew',
      contractorStatus: 'approved',
      warehouseStatus: 'delivered',
      priority: 'medium'
    },
    {
      orderId: 'CON001-SUP001',
      orderType: 'supply',
      itemName: 'Vehicle Maintenance',
      centerName: 'Vehicle Bay',
      centerId: 'CEN001',
      requestedBy: 'Fleet Manager',
      createdBy: 'contractor',
      contractorStatus: 'approved',
      warehouseStatus: 'delivered',
      priority: 'high'
    }
  ]
};

export default function Orders({ userId, config, features, api }: OrdersProps) {
  const [supplyActiveTab, setSupplyActiveTab] = useState<'in_progress' | 'archive'>('in_progress');
  const [supplySearchTerm, setSupplySearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleOrderAction = (orderId: string, action: string) => {
    setActionLoading(orderId);
    
    setTimeout(() => {
      if (action === 'Approve') {
        const newOrderId = orderId.replace('-ORD-', '-');
        setNotice(`Supply order ${orderId} approved and moved to shipments as ${newOrderId}`);
      } else {
        setNotice(`${action} action for ${orderId} completed successfully`);
      }
      setTimeout(() => setNotice(null), 3000);
      setActionLoading(null);
    }, 1000);
  };

  const supplyOrders = mockSupplyOrders[supplyActiveTab];
  const filteredSupplyOrders = supplyOrders.filter(order => 
    order.orderId.toLowerCase().includes(supplySearchTerm.toLowerCase()) ||
    order.itemName.toLowerCase().includes(supplySearchTerm.toLowerCase()) ||
    (order.centerName && order.centerName.toLowerCase().includes(supplySearchTerm.toLowerCase()))
  );

  const renderSupplyOrders = (orders: any[], activeTab: string) => (
    <div>
      {orders.map((order: any) => (
        <div key={order.orderId} className="ui-card" style={{ padding: 12, marginBottom: 8, border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: '#10b981', cursor: 'pointer', fontSize: 14 }}>
                  {order.orderId}
                </span>
                <span style={{
                  padding: '1px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                  background: order.priority === 'high' ? '#fef2f2' : order.priority === 'medium' ? '#e0f2fe' : '#f0fdf4',
                  color: order.priority === 'high' ? '#dc2626' : order.priority === 'medium' ? '#0369a1' : '#16a34a'
                }}>
                  {order.priority.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{order.itemName}</div>
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'right', minWidth: 120 }}>
              <div>Requested: 2025-09-10</div>
              <div>Expected Start: 2025-09-15</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
            {order.createdBy && (
              <span style={{ padding: '1px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: '#e0f2fe', color: '#0369a1' }}>
                {order.createdBy.charAt(0).toUpperCase() + order.createdBy.slice(1)} Created
              </span>
            )}
            {order.contractorStatus && (
              <span style={{
                padding: '1px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                background: order.contractorStatus === 'approved' ? '#dcfce7' : '#fef2f2',
                color: order.contractorStatus === 'approved' ? '#16a34a' : '#dc2626'
              }}>
                Contractor: {order.contractorStatus}
              </span>
            )}
            {order.warehouseStatus && (
              <span style={{
                padding: '1px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                background: order.warehouseStatus === 'delivered' ? '#dcfce7' : '#e0f2fe',
                color: order.warehouseStatus === 'delivered' ? '#16a34a' : '#0369a1'
              }}>
                Warehouse: {order.warehouseStatus}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {activeTab === 'in_progress' && order.warehouseStatus === 'pending' ? (
              <>
                <button 
                  disabled={actionLoading === order.orderId}
                  onClick={() => handleOrderAction(order.orderId, 'Approve')}
                  style={{ 
                    padding: '4px 8px', 
                    borderRadius: 4, 
                    border: 'none', 
                    background: '#10b981', 
                    color: 'white', 
                    fontSize: 11, 
                    fontWeight: 600, 
                    cursor: 'pointer'
                  }}
                >
                  {actionLoading === order.orderId ? 'Approving...' : 'Approve'}
                </button>
                <button 
                  disabled={actionLoading === order.orderId}
                  onClick={() => handleOrderAction(order.orderId, 'Deny')}
                  style={{ 
                    padding: '4px 8px', 
                    borderRadius: 4, 
                    border: '1px solid #ef4444', 
                    background: 'white', 
                    color: '#ef4444', 
                    fontSize: 11, 
                    fontWeight: 600, 
                    cursor: 'pointer'
                  }}
                >
                  {actionLoading === order.orderId ? 'Denying...' : 'Deny'}
                </button>
              </>
            ) : (
              <button 
                onClick={() => handleOrderAction(order.orderId, 'View Details')}
                style={{ 
                  padding: '4px 8px', 
                  borderRadius: 4, 
                  border: '1px solid #d1d5db', 
                  background: 'white', 
                  color: '#374151', 
                  fontSize: 11, 
                  fontWeight: 600, 
                  cursor: 'pointer'
                }}
              >
                View Details
              </button>
            )}
          </div>
        </div>
      ))}
      {orders.length === 0 && (
        <div style={{ textAlign: 'center', padding: 20, color: '#6b7280', background: '#f9fafb', borderRadius: 6, fontSize: 12 }}>
          No supply orders in {activeTab === 'in_progress' ? 'progress' : 'archive'}
        </div>
      )}
    </div>
  );

  return (
    <div>
      {notice && (
        <div style={{ 
          background: '#dcfce7', 
          color: '#166534', 
          padding: 12, 
          borderRadius: 8, 
          marginBottom: 16,
          border: '1px solid #bbf7d0'
        }}>
          {notice}
        </div>
      )}
      
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>Order Management</h2>
      </div>
      
      {/* Supply Orders Section - matching contractor hub layout exactly */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#10b981' }}>Supply Orders</h3>
          <input
            type="text"
            placeholder="Search supplies..."
            value={supplySearchTerm}
            onChange={(e) => setSupplySearchTerm(e.target.value)}
            style={{
              padding: '4px 8px',
              border: '1px solid #d1d5db',
              borderRadius: 4,
              fontSize: 12,
              width: 140
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {['in_progress', 'archive'].map(bucket => (
            <button
              key={bucket}
              onClick={() => setSupplyActiveTab(bucket as 'in_progress' | 'archive')}
              style={{
                padding: '4px 12px',
                borderRadius: 4,
                border: '1px solid #e5e7eb',
                background: supplyActiveTab === bucket ? '#10b981' : 'white',
                color: supplyActiveTab === bucket ? 'white' : '#111827',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {bucket === 'in_progress' ? 'In Progress' : 'Archive'}
            </button>
          ))}
        </div>

        {renderSupplyOrders(filteredSupplyOrders, supplyActiveTab)}
      </div>
      
      <div style={{ fontSize: 11, color: '#6b7280', textAlign: 'center', marginTop: 8 }}>
        Supply Orders: {filteredSupplyOrders.length}
      </div>
    </div>
  );
}