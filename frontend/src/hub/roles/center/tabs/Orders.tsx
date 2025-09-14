/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Orders.tsx
 * 
 * Description: Center order management with service and supply order tracking
 * Function: View and manage both service orders and supply orders for the center
 * Importance: Critical - Dual order lifecycle management for centers
 * Connects to: Order API, service management, supply management, contractor coordination
 */

import React, { useState } from 'react';

interface CenterOrdersProps {
  userId: string;
  config: any;
  features: any;
  api: any;
}

// Mock data for service orders (current flow: Center → Customer → Contractor → Manager)
const mockServiceOrders = {
  status: [
    {
      orderId: 'CEN001-ORD-SRV001',
      orderType: 'service',
      serviceName: 'Window Cleaning',
      centerName: 'Downtown Office Complex',
      centerId: 'CEN001',
      contractor: 'Premium Cleaning Solutions',
      createdBy: 'center',
      customerStatus: 'pending',
      contractorStatus: 'pending',
      managerStatus: 'pending',
      priority: 'high',
      requestDate: '2025-09-10',
      expectedStartDate: '2025-09-15',
      location: 'All Floors - Exterior Windows'
    }
  ],
  progress: [
    {
      orderId: 'CEN001-ORD-SRV005',
      orderType: 'service',
      serviceName: 'Elevator Maintenance',
      centerName: 'Downtown Office Complex',
      centerId: 'CEN001',
      contractor: 'Vertical Transport Inc',
      createdBy: 'center',
      customerStatus: 'approved',
      contractorStatus: 'approved',
      managerStatus: 'approved',
      priority: 'medium',
      requestDate: '2025-09-06',
      expectedStartDate: '2025-09-14',
      location: 'Elevators A & B'
    }
  ],
  archive: [
    {
      orderId: 'CEN001-ORD-SRV002',
      orderType: 'service',
      serviceName: 'HVAC Maintenance',
      centerName: 'Downtown Office Complex',
      centerId: 'CEN001',
      contractor: 'TechCorp Services',
      approvedDate: '2025-09-02',
      becameServiceId: 'CEN001-SRV002',
      priority: 'high',
      location: 'Rooftop HVAC Units'
    }
  ]
};

// Mock data for supply orders (simplified flow: Center → Contractor → Warehouse)
const mockSupplyOrders = {
  status: [
    {
      orderId: 'CEN001-ORD-SUP001',
      orderType: 'supply',
      itemName: 'Cleaning Supplies Refill',
      centerName: 'Downtown Office Complex',
      centerId: 'CEN001',
      contractor: 'Supply Chain Pro',
      createdBy: 'center',
      contractorStatus: 'pending',
      warehouseStatus: 'pending',
      priority: 'medium',
      requestDate: '2025-09-11',
      expectedDeliveryDate: '2025-09-13',
      quantity: '50 units',
      location: 'Storage Room B'
    }
  ],
  progress: [
    {
      orderId: 'CEN001-ORD-SUP003',
      orderType: 'supply',
      itemName: 'Office Paper & Supplies',
      centerName: 'Downtown Office Complex',
      centerId: 'CEN001',
      contractor: 'Supply Chain Pro',
      createdBy: 'center',
      contractorStatus: 'approved',
      warehouseStatus: 'preparing',
      priority: 'low',
      requestDate: '2025-09-09',
      expectedDeliveryDate: '2025-09-12',
      quantity: '25 boxes',
      location: 'Reception Desk'
    }
  ],
  archive: [
    {
      orderId: 'CEN001-ORD-SUP002',
      orderType: 'supply',
      itemName: 'Security Equipment',
      centerName: 'Downtown Office Complex',
      centerId: 'CEN001',
      contractor: 'Supply Chain Pro',
      approvedDate: '2025-09-05',
      deliveredDate: '2025-09-07',
      priority: 'high',
      quantity: '10 units',
      location: 'Security Office'
    }
  ]
};

export default function CenterOrders({ userId, config, features, api }: CenterOrdersProps) {
  // Service orders state
  const [serviceActiveTab, setServiceActiveTab] = useState<'in_progress' | 'archive'>('in_progress');
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  
  // Supply orders state  
  const [supplyActiveTab, setSupplyActiveTab] = useState<'in_progress' | 'archive'>('in_progress');
  const [supplySearchTerm, setSupplySearchTerm] = useState('');
  
  // Shared state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleOrderAction = (orderId: string, action: string) => {
    setActionLoading(orderId);
    
    // Mock action
    setTimeout(() => {
      setNotice(`${action} action for ${orderId} completed successfully`);
      setTimeout(() => setNotice(null), 3000);
      setActionLoading(null);
    }, 1000);
  };

  // Service orders filtering
  const serviceOrders = serviceActiveTab === 'in_progress' ? [...mockServiceOrders.status, ...mockServiceOrders.progress] : mockServiceOrders[serviceActiveTab];
  const filteredServiceOrders = serviceOrders.filter(order => 
    order.orderId.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
    order.serviceName.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
    (order.contractor && order.contractor.toLowerCase().includes(serviceSearchTerm.toLowerCase()))
  );

  // Supply orders filtering  
  const supplyOrders = supplyActiveTab === 'in_progress' ? [...mockSupplyOrders.status, ...mockSupplyOrders.progress] : mockSupplyOrders[supplyActiveTab];
  const filteredSupplyOrders = supplyOrders.filter(order => 
    order.orderId.toLowerCase().includes(supplySearchTerm.toLowerCase()) ||
    order.itemName.toLowerCase().includes(supplySearchTerm.toLowerCase()) ||
    (order.contractor && order.contractor.toLowerCase().includes(supplySearchTerm.toLowerCase()))
  );

  // Render function for service orders
  const renderServiceOrders = (orders: any[], activeTab: string) => (
    <div>
      {orders.map((order: any) => (
        <div key={order.orderId} className="ui-card" style={{ padding: 12, marginBottom: 8, border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: '#eab308', cursor: 'pointer', fontSize: 14 }}>
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
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{order.serviceName}</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
            {order.createdBy && (
              <span style={{ padding: '1px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: '#e0f2fe', color: '#0369a1' }}>
                {order.createdBy.charAt(0).toUpperCase() + order.createdBy.slice(1)} Created
              </span>
            )}
            {order.customerStatus && (
              <span style={{
                padding: '1px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                background: order.customerStatus === 'approved' ? '#dcfce7' : '#fef2f2',
                color: order.customerStatus === 'approved' ? '#16a34a' : '#dc2626'
              }}>
                Customer: {order.customerStatus}
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
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {order.customerStatus === 'pending' ? (
              <button disabled={actionLoading === order.orderId} onClick={() => handleOrderAction(order.orderId, 'Cancel')}
                style={{ padding: '4px 8px', borderRadius: 4, border: 'none', background: '#dc2626', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                {actionLoading === order.orderId ? 'Cancelling...' : 'Cancel'}
              </button>
            ) : (
              <button onClick={() => alert(`Order details for ${order.orderId}`)}
                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', background: 'white', color: '#374151', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                View Details
              </button>
            )}
          </div>
        </div>
      ))}
      {orders.length === 0 && (
        <div style={{ textAlign: 'center', padding: 20, color: '#6b7280', background: '#f9fafb', borderRadius: 6, fontSize: 12 }}>
          No service orders in {activeTab === 'in_progress' ? 'progress' : 'archive'}
        </div>
      )}
    </div>
  );

  // Render function for supply orders  
  const renderSupplyOrders = (orders: any[], activeTab: string) => (
    <div>
      {orders.map((order: any) => (
        <div key={order.orderId} className="ui-card" style={{ padding: 12, marginBottom: 8, border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: '#eab308', cursor: 'pointer', fontSize: 14 }}>
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
                background: order.warehouseStatus === 'delivered' ? '#dcfce7' : '#fef3c7',
                color: order.warehouseStatus === 'delivered' ? '#16a34a' : '#92400e'
              }}>
                Warehouse: {order.warehouseStatus}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {order.contractorStatus === 'pending' ? (
              <button disabled={actionLoading === order.orderId} onClick={() => handleOrderAction(order.orderId, 'Cancel')}
                style={{ padding: '4px 8px', borderRadius: 4, border: 'none', background: '#dc2626', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                {actionLoading === order.orderId ? 'Cancelling...' : 'Cancel'}
              </button>
            ) : (
              <button onClick={() => alert(`Order details for ${order.orderId}`)}
                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', background: 'white', color: '#374151', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
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
          marginBottom: 16,
          padding: '8px 12px',
          background: '#ecfdf5',
          color: '#065f46',
          border: '1px solid #a7f3d0',
          borderRadius: 6,
          fontSize: 13
        }}>
          {notice}
        </div>
      )}
      
      {/* Header with dual action buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Orders</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
          <button style={{
            padding: '8px 16px',
            background: '#eab308',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            Order Supplies
          </button>
        </div>
      </div>
      
      {/* Split layout: Service Orders | Supply Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        
        {/* Service Orders Section */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#059669' }}>Service Orders</h3>
            <input
              type="text"
              placeholder="Search services..."
              value={serviceSearchTerm}
              onChange={(e) => setServiceSearchTerm(e.target.value)}
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
                onClick={() => setServiceActiveTab(bucket as 'in_progress' | 'archive')}
                style={{
                  padding: '4px 12px',
                  borderRadius: 4,
                  border: '1px solid #e5e7eb',
                  background: serviceActiveTab === bucket ? '#059669' : 'white',
                  color: serviceActiveTab === bucket ? 'white' : '#111827',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {bucket === 'in_progress' ? 'In Progress' : 'Archive'}
              </button>
            ))}
          </div>

          {renderServiceOrders(filteredServiceOrders, serviceActiveTab)}
        </div>
        
        {/* Supply Orders Section */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#eab308' }}>Supply Orders</h3>
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
                  background: supplyActiveTab === bucket ? '#eab308' : 'white',
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
      </div>
      
      <div style={{ fontSize: 11, color: '#6b7280', textAlign: 'center' }}>
        Service Orders: {filteredServiceOrders.length} | Supply Orders: {filteredSupplyOrders.length}
      </div>
    </div>
  );
}