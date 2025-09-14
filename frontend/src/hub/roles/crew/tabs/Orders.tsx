/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Orders.tsx
 * 
 * Description: Crew supply order management and assignment tracking
 * Function: Order supplies directly and view assignment requests from managers
 * Importance: Critical - Supply order management and assignment acceptance for crew
 * Connects to: Order API, supply management, assignment system, crew coordination
 * 
 * Notes: Crew can order supplies but cannot request services.
 *        Shows assignment requests for service orders from managers.
 */

import React, { useState } from 'react';

interface CrewOrdersProps {
  userId: string;
  config: any;
  features: any;
  api: any;
}

// Mock data for service assignment requests (crew doesn't create these, just accepts/rejects)
const mockServiceAssignments = {
  status: [
    {
      orderId: 'CEN001-ORD-SRV004',
      orderType: 'service',
      serviceName: 'Security System Check',
      centerName: 'Downtown Office Complex',
      centerId: 'CEN001',
      contractor: 'SecureTech Services',
      createdBy: 'center',
      customerStatus: 'approved',
      contractorStatus: 'approved',
      managerStatus: 'approved',
      assignmentStatus: 'pending', // pending, accepted, rejected
      priority: 'high',
      requestedDate: '2025-09-11',
      scheduledDate: '2025-09-16',
      location: 'Main Lobby & All Entrances',
      assignedCrew: 'CREW-001'
    },
    {
      orderId: 'CEN003-ORD-SRV007',
      orderType: 'service',
      serviceName: 'Window Cleaning',
      centerName: 'Tech Innovation Hub',
      centerId: 'CEN003',
      contractor: 'Premium Cleaning Solutions',
      createdBy: 'center',
      customerStatus: 'approved',
      contractorStatus: 'approved',
      managerStatus: 'approved',
      assignmentStatus: 'pending',
      priority: 'medium',
      requestedDate: '2025-09-11',
      scheduledDate: '2025-09-18',
      location: 'Floors 1-5, Exterior Windows',
      assignedCrew: 'CREW-001'
    }
  ],
  progress: [
    {
      orderId: 'CEN002-ORD-SRV006',
      orderType: 'service',
      serviceName: 'HVAC Maintenance',
      centerName: 'Westside Business Park',
      centerId: 'CEN002',
      contractor: 'TechCorp Services',
      createdBy: 'customer',
      customerStatus: 'approved',
      contractorStatus: 'approved',
      managerStatus: 'approved',
      assignmentStatus: 'accepted',
      priority: 'high',
      requestedDate: '2025-09-09',
      scheduledDate: '2025-09-15',
      location: 'Rooftop HVAC System',
      assignedCrew: 'CREW-001'
    }
  ],
  archive: [
    {
      orderId: 'CEN004-ORD-SRV001',
      orderType: 'service',
      serviceName: 'Window Cleaning',
      centerName: 'Industrial Complex East',
      centerId: 'CEN004',
      contractor: 'Premium Cleaning Solutions',
      assignmentStatus: 'accepted',
      priority: 'medium',
      requestedDate: '2025-09-05',
      scheduledDate: '2025-09-12',
      completedDate: '2025-09-12',
      location: 'All Buildings, Exterior Windows',
      assignedCrew: 'CREW-001'
    }
  ]
};

// Mock data for supply orders (crew can create these)
const mockSupplyOrders = {
  status: [
    {
      orderId: 'CRW001-ORD-SUP001',
      orderType: 'supply',
      itemName: 'Safety Equipment Refill',
      centerName: 'Downtown Office Complex',
      centerId: 'CEN001',
      contractor: 'Supply Chain Pro',
      createdBy: 'crew',
      contractorStatus: 'pending',
      warehouseStatus: 'pending',
      priority: 'high',
      requestDate: '2025-09-11',
      expectedDeliveryDate: '2025-09-14',
      quantity: '20 units',
      location: 'Equipment Storage'
    }
  ],
  progress: [
    {
      orderId: 'CRW001-ORD-SUP002',
      orderType: 'supply',
      itemName: 'Cleaning Tools Replacement',
      centerName: 'Tech Innovation Hub',
      centerId: 'CEN003',
      contractor: 'Supply Chain Pro',
      createdBy: 'crew',
      contractorStatus: 'approved',
      warehouseStatus: 'preparing',
      priority: 'medium',
      requestDate: '2025-09-09',
      expectedDeliveryDate: '2025-09-12',
      quantity: '15 units',
      location: 'Maintenance Room'
    }
  ],
  archive: [
    {
      orderId: 'CRW001-ORD-SUP003',
      orderType: 'supply',
      itemName: 'Work Gloves & Masks',
      centerName: 'Westside Business Park',
      centerId: 'CEN002',
      contractor: 'Supply Chain Pro',
      approvedDate: '2025-09-05',
      deliveredDate: '2025-09-08',
      priority: 'low',
      quantity: '50 units',
      location: 'Break Room Storage'
    }
  ]
};

export default function CrewOrders({ userId, config, features, api }: CrewOrdersProps) {
  // Service assignment state
  const [serviceActiveTab, setServiceActiveTab] = useState<'in_progress' | 'archive'>('in_progress');
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  
  // Supply orders state  
  const [supplyActiveTab, setSupplyActiveTab] = useState<'in_progress' | 'archive'>('in_progress');
  const [supplySearchTerm, setSupplySearchTerm] = useState('');
  
  // Shared state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleAssignmentResponse = (orderId: string, action: string) => {
    setActionLoading(orderId);
    
    // Mock action
    setTimeout(() => {
      if (action === 'Accept') {
        setNotice(`Assignment ${orderId} accepted successfully`);
      } else {
        setNotice(`Assignment ${orderId} rejected - removed from your list`);
      }
      setTimeout(() => setNotice(null), 3000);
      setActionLoading(null);
    }, 1000);
  };

  const handleSupplyOrderAction = (orderId: string, action: string) => {
    setActionLoading(orderId);
    
    // Mock action
    setTimeout(() => {
      setNotice(`${action} action for ${orderId} completed successfully`);
      setTimeout(() => setNotice(null), 3000);
      setActionLoading(null);
    }, 1000);
  };

  // Service assignment filtering
  const serviceAssignments = serviceActiveTab === 'in_progress' ? [...mockServiceAssignments.status, ...mockServiceAssignments.progress] : mockServiceAssignments[serviceActiveTab];
  const filteredServiceAssignments = serviceAssignments.filter(order => 
    order.orderId.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
    order.serviceName.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
    order.centerName.toLowerCase().includes(serviceSearchTerm.toLowerCase())
  );

  // Supply orders filtering  
  const supplyOrders = supplyActiveTab === 'in_progress' ? [...mockSupplyOrders.status, ...mockSupplyOrders.progress] : mockSupplyOrders[supplyActiveTab];
  const filteredSupplyOrders = supplyOrders.filter(order => 
    order.orderId.toLowerCase().includes(supplySearchTerm.toLowerCase()) ||
    order.itemName.toLowerCase().includes(supplySearchTerm.toLowerCase())
  );

  // Render function for service assignments (accept/reject workflow)
  const renderServiceAssignments = (orders: any[], activeTab: string) => (
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
            {order.assignmentStatus && (
              <span style={{
                padding: '1px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                background: order.assignmentStatus === 'accepted' ? '#dcfce7' : order.assignmentStatus === 'pending' ? '#fef3c7' : '#fef2f2',
                color: order.assignmentStatus === 'accepted' ? '#16a34a' : order.assignmentStatus === 'pending' ? '#92400e' : '#dc2626'
              }}>
                Assignment: {order.assignmentStatus}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {order.assignmentStatus === 'pending' ? (
              <>
                <button disabled={actionLoading === order.orderId} onClick={() => handleAssignmentResponse(order.orderId, 'Accept')}
                  style={{ padding: '4px 8px', borderRadius: 4, border: 'none', background: '#10b981', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {actionLoading === order.orderId ? 'Accepting...' : 'Accept'}
                </button>
                <button disabled={actionLoading === order.orderId} onClick={() => handleAssignmentResponse(order.orderId, 'Reject')}
                  style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ef4444', background: 'white', color: '#ef4444', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {actionLoading === order.orderId ? 'Rejecting...' : 'Reject'}
                </button>
              </>
            ) : (
              <button onClick={() => alert(`Assignment details for ${order.orderId}`)}
                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', background: 'white', color: '#374151', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                View Details
              </button>
            )}
          </div>
        </div>
      ))}
      {orders.length === 0 && (
        <div style={{ textAlign: 'center', padding: 20, color: '#6b7280', background: '#f9fafb', borderRadius: 6, fontSize: 12 }}>
          No assignment requests in {activeTab === 'in_progress' ? 'progress' : 'archive'}
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
              <button disabled={actionLoading === order.orderId} onClick={() => handleSupplyOrderAction(order.orderId, 'Cancel')}
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
      
      {/* Header with only Order Supplies button (crew can't request services) */}
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
              placeholder="Search assignments..."
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

          {renderServiceAssignments(filteredServiceAssignments, serviceActiveTab)}
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
        Service Orders: {filteredServiceAssignments.length} | Supply Orders: {filteredSupplyOrders.length}
      </div>
    </div>
  );
}