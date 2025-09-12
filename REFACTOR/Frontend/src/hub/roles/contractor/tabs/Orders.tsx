/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Orders.tsx
 * 
 * Description: Contractor order management with service and supply approval workflow
 * Function: Handle approvals for both service orders and supply orders, plus create orders on behalf of customers
 * Importance: Critical - Dual order approval workflow for contractors
 * Connects to: Order API, service management, supply management, approval system
 */

import React, { useState } from 'react';

interface OrdersProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

// Mock data for service orders that need contractor approval
const mockServiceOrders = {
  status: [
    {
      orderId: 'CEN001-ORD-SRV001',
      orderType: 'service',
      serviceName: 'Window Cleaning',
      centerName: 'Downtown Office Complex',
      centerId: 'CEN001',
      customerId: 'CUST-001',
      requestedBy: 'Center Manager',
      createdBy: 'center',
      requestDate: '2025-09-10',
      expectedStartDate: '2025-09-15',
      contractorStatus: 'pending',
      customerStatus: 'approved',
      managerStatus: 'pending',
      priority: 'high',
      description: 'Weekly window cleaning for all floors'
    },
    {
      orderId: 'CUS001-ORD-SRV002',
      orderType: 'service',
      serviceName: 'Lawn Maintenance',
      centerName: 'Westside Business Park',
      centerId: 'CEN002',
      customerId: 'CUST-002',
      requestedBy: 'Facility Coordinator',
      createdBy: 'customer',
      requestDate: '2025-09-09',
      expectedStartDate: '2025-09-20',
      contractorStatus: 'pending',
      customerStatus: 'approved',
      managerStatus: 'pending',
      priority: 'medium',
      description: 'Bi-weekly lawn care and landscaping'
    }
  ],
  progress: [
    {
      orderId: 'CEN003-ORD-SRV003',
      orderType: 'service',
      serviceName: 'HVAC Maintenance',
      centerName: 'Tech Innovation Hub',
      centerId: 'CEN003',
      customerId: 'CUST-001',
      requestedBy: 'Operations Manager',
      createdBy: 'center',
      requestDate: '2025-09-08',
      expectedStartDate: '2025-09-18',
      contractorStatus: 'approved',
      customerStatus: 'approved',
      managerStatus: 'pending',
      priority: 'high',
      description: 'Monthly HVAC system inspection'
    }
  ],
  archive: [
    {
      orderId: 'CEN004-ORD-SRV004',
      orderType: 'service',
      serviceName: 'Security System Check',
      centerName: 'Industrial Complex East',
      centerId: 'CEN004',
      approvedDate: '2025-09-05',
      becameServiceId: 'CEN004-SRV004',
      priority: 'high',
      description: 'Weekly security system testing'
    }
  ]
};

// Mock data for supply orders that need contractor approval
const mockSupplyOrders = {
  status: [
    {
      orderId: 'CEN001-ORD-SUP001',
      orderType: 'supply',
      itemName: 'Cleaning Equipment Refill',
      centerName: 'Downtown Office Complex',
      centerId: 'CEN001',
      requestedBy: 'Facility Manager',
      createdBy: 'center',
      requestDate: '2025-09-11',
      expectedDeliveryDate: '2025-09-14',
      contractorStatus: 'pending',
      warehouseStatus: 'pending',
      priority: 'medium',
      quantity: '40 units',
      location: 'Storage Room A'
    },
    {
      orderId: 'CRW001-ORD-SUP001',
      orderType: 'supply',
      itemName: 'Maintenance Tools',
      centerName: 'Tech Innovation Hub',
      centerId: 'CEN003',
      requestedBy: 'Crew Lead',
      createdBy: 'crew',
      requestDate: '2025-09-10',
      expectedDeliveryDate: '2025-09-13',
      contractorStatus: 'pending',
      warehouseStatus: 'pending',
      priority: 'high',
      quantity: '15 units',
      location: 'Maintenance Room'
    }
  ],
  progress: [
    {
      orderId: 'CUS001-ORD-SUP002',
      orderType: 'supply',
      itemName: 'Office Equipment',
      centerName: 'Westside Business Park',
      centerId: 'CEN002',
      requestedBy: 'Office Manager',
      createdBy: 'customer',
      requestDate: '2025-09-09',
      expectedDeliveryDate: '2025-09-12',
      contractorStatus: 'approved',
      warehouseStatus: 'preparing',
      priority: 'low',
      quantity: '25 boxes',
      location: 'Reception Area'
    }
  ],
  archive: [
    {
      orderId: 'CEN002-ORD-SUP003',
      orderType: 'supply',
      itemName: 'Safety Equipment',
      centerName: 'Downtown Office Complex',
      centerId: 'CEN001',
      approvedDate: '2025-09-05',
      deliveredDate: '2025-09-08',
      priority: 'high',
      quantity: '20 units',
      location: 'Safety Station'
    }
  ]
};

export default function Orders({ userId, config, features, api }: OrdersProps) {
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
    (order.centerName && order.centerName.toLowerCase().includes(serviceSearchTerm.toLowerCase()))
  );

  // Supply orders filtering  
  const supplyOrders = supplyActiveTab === 'in_progress' ? [...mockSupplyOrders.status, ...mockSupplyOrders.progress] : mockSupplyOrders[supplyActiveTab];
  const filteredSupplyOrders = supplyOrders.filter(order => 
    order.orderId.toLowerCase().includes(supplySearchTerm.toLowerCase()) ||
    order.itemName.toLowerCase().includes(supplySearchTerm.toLowerCase()) ||
    (order.centerName && order.centerName.toLowerCase().includes(supplySearchTerm.toLowerCase()))
  );

  // Render function for service orders (contractor approval workflow)
  const renderServiceOrders = (orders: any[], activeTab: string) => (
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
            {order.contractorStatus === 'pending' ? (
              <>
                <button disabled={actionLoading === order.orderId} onClick={() => handleOrderAction(order.orderId, 'Approve')}
                  style={{ padding: '4px 8px', borderRadius: 4, border: 'none', background: '#10b981', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {actionLoading === order.orderId ? 'Approving...' : 'Approve'}
                </button>
                <button disabled={actionLoading === order.orderId} onClick={() => handleOrderAction(order.orderId, 'Deny')}
                  style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ef4444', background: 'white', color: '#ef4444', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {actionLoading === order.orderId ? 'Denying...' : 'Deny'}
                </button>
              </>
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

  // Render function for supply orders (contractor approval workflow)
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
              <>
                <button disabled={actionLoading === order.orderId} onClick={() => handleOrderAction(order.orderId, 'Approve')}
                  style={{ padding: '4px 8px', borderRadius: 4, border: 'none', background: '#10b981', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {actionLoading === order.orderId ? 'Approving...' : 'Approve'}
                </button>
                <button disabled={actionLoading === order.orderId} onClick={() => handleOrderAction(order.orderId, 'Deny')}
                  style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ef4444', background: 'white', color: '#ef4444', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {actionLoading === order.orderId ? 'Denying...' : 'Deny'}
                </button>
              </>
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
            background: '#10b981',
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
            background: '#10b981',
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
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#10b981' }}>Service Orders</h3>
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
                  background: serviceActiveTab === bucket ? '#10b981' : 'white',
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
      </div>
      
      <div style={{ fontSize: 11, color: '#6b7280', textAlign: 'center' }}>
        Service Orders: {filteredServiceOrders.length} | Supply Orders: {filteredSupplyOrders.length}
      </div>
    </div>
  );
}