/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: ManagerHub.tsx
 *
 * Description:
 * Manager Hub orchestrator component
 *
 * Responsibilities:
 * - Orchestrate manager role hub interface
 * - Manage tab navigation and content rendering
 *
 * Role in system:
 * - Primary interface for manager users
 *
 * Notes:
 * Uses MyHubSection for navigation
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import { useState, useEffect } from 'react';
import { Scrollbar } from '../../../packages/ui/src/Scrollbar';
import MyHubSection from '../../../packages/ui/src/navigation/MyHubSection';
import OverviewSection from '../../../packages/domain-widgets/src/overview';
import { RecentActivity, type Activity } from '../../../packages/domain-widgets/src/activity';
import { NewsPreview } from '../../../packages/domain-widgets/src/news';
import { MemosPreview } from '../../../packages/domain-widgets/src/memos';
import { ProfileInfoCard } from '../../../packages/domain-widgets/src/profile';
import EcosystemTree, { type TreeNode } from '../../../packages/domain-widgets/EcosystemTree';
import DataTable from '../../../packages/ui/src/tables/DataTable';
import Button from '../../../packages/ui/src/buttons/Button';
import { OrdersSection } from '../../../packages/domain-widgets/src/OrdersSection';
import PageHeader from '../../../packages/ui/src/layout/PageHeader';
import PageWrapper from '../../../packages/ui/src/layout/PageWrapper';
import TabSection from '../../../packages/ui/src/layout/TabSection';

interface ManagerHubProps {
  initialTab?: string;
}

export default function ManagerHub({ initialTab = 'dashboard' }: ManagerHubProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [servicesTab, setServicesTab] = useState('my');
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');

  // Add scrollbar styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .hub-content-scroll::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .hub-content-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .hub-content-scroll::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }
      .hub-content-scroll::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Mock ecosystem data for manager (shows full hierarchy)
  const ecosystemData: TreeNode = {
    user: { id: 'MGR-001', role: 'Manager', name: 'John Smith' },
    children: [
      {
        user: { id: 'CON-001', role: 'Contractor', name: 'Premium Contractor LLC' },
        count: 3,
        type: 'customers',
        children: [
          {
            user: { id: 'CUS-001', role: 'Customer', name: 'Acme Corporation' },
            count: 3,
            type: 'centers',
            children: [
              {
                user: { id: 'CTR-001', role: 'Center', name: 'Acme Downtown Office' },
                count: 2,
                type: 'crew',
                children: [
                  { user: { id: 'CRW-001', role: 'Crew', name: 'John Smith (Lead)' } },
                  { user: { id: 'CRW-002', role: 'Crew', name: 'Jane Doe (Specialist)' } }
                ]
              },
              {
                user: { id: 'CTR-002', role: 'Center', name: 'Acme Warehouse' },
                count: 3,
                type: 'crew',
                children: [
                  { user: { id: 'CRW-003', role: 'Crew', name: 'Mike Johnson (Lead)' } },
                  { user: { id: 'CRW-004', role: 'Crew', name: 'Sarah Wilson' } },
                  { user: { id: 'CRW-005', role: 'Crew', name: 'Bob Brown' } }
                ]
              }
            ]
          },
          {
            user: { id: 'CUS-002', role: 'Customer', name: 'Global Tech Solutions' },
            count: 2,
            type: 'centers',
            children: [
              {
                user: { id: 'CTR-003', role: 'Center', name: 'Global Tech HQ' },
                count: 2,
                type: 'crew'
              }
            ]
          }
        ]
      },
      {
        user: { id: 'CON-002', role: 'Contractor', name: 'Elite Services Inc' },
        count: 2,
        type: 'customers',
        children: [
          {
            user: { id: 'CUS-003', role: 'Customer', name: 'Local Business Center' },
            count: 1,
            type: 'centers'
          }
        ]
      }
    ]
  };

  // Mock activities for manager - showing activities from various roles
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 'act-1',
      message: 'System maintenance scheduled for this weekend',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      type: 'warning',
      metadata: { role: 'admin', userId: 'ADM-001', title: 'Admin Notice' }
    },
    {
      id: 'act-2',
      message: 'Assigned CON-001 to new project',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      type: 'action',
      metadata: { role: 'manager', userId: 'MGR-001', title: 'Manager Action' }
    },
    {
      id: 'act-3',
      message: 'New Contractor Created: CON-002 (Network Solutions)',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      type: 'success',
      metadata: { role: 'contractor', userId: 'CON-002', title: 'Contractor Update' }
    },
    {
      id: 'act-4',
      message: 'Service request SR-2024-055 submitted for review',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      type: 'info',
      metadata: { role: 'customer', userId: 'CUS-005', title: 'Customer Request' }
    },
    {
      id: 'act-5',
      message: 'Equipment check-in completed at Center CTR-003',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      type: 'success',
      metadata: { role: 'center', userId: 'CEN-003', title: 'Center Activity' }
    },
    {
      id: 'act-6',
      message: 'Crew member CRW-007 completed safety training',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      type: 'success',
      metadata: { role: 'crew', userId: 'CRW-007', title: 'Crew Update' }
    },
    {
      id: 'act-7',
      message: 'Low inventory alert: Parts needed for upcoming jobs',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      type: 'warning',
      metadata: { role: 'warehouse', userId: 'WHS-001', title: 'Warehouse Alert' }
    },
    {
      id: 'act-8',
      message: 'Weekly report generated and available for review',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      type: 'info',
      metadata: { role: 'system', userId: 'SYSTEM', title: 'System Report' }
    }
  ]);

  // Mock orders data - Manager can see all crew product orders
  const serviceOrders: any[] = [];
  const productOrders: any[] = [
    // Same orders as CrewHub - Manager can monitor crew orders
    // State 1: Pending warehouse acceptance
    {
      orderId: 'CRW001-ORD-PRD001',
      orderType: 'product',
      title: 'Cleaning Supplies - Standard Package',
      requestedBy: 'CRW-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-19',
      expectedDate: '2025-09-22',
      status: 'in-progress',
      approvalStages: [
        { role: 'Crew', status: 'requested', user: 'CRW-001', timestamp: '2025-09-19 09:00' },
        { role: 'Warehouse', status: 'pending' }
      ],
      approvalStage: {
        currentStage: 'warehouse',
        warehouseApproval: 'pending',
        warehouseNotes: null
      },
      items: [
        { name: 'All-Purpose Cleaner', quantity: 10, unit: 'bottles' },
        { name: 'Microfiber Cloths', quantity: 50, unit: 'pieces' },
        { name: 'Disinfectant Spray', quantity: 15, unit: 'cans' }
      ],
      notes: 'Urgent - running low on supplies for upcoming service'
    },
    // State 2: Accepted by warehouse (pending delivery)
    {
      orderId: 'CRW001-ORD-PRD002',
      orderType: 'product',
      title: 'Safety Equipment Restock',
      requestedBy: 'CRW-001',
      destination: 'CTR-002',
      requestedDate: '2025-09-17',
      expectedDate: '2025-09-20',
      status: 'in-progress',
      approvalStages: [
        { role: 'Crew', status: 'requested', user: 'CRW-001', timestamp: '2025-09-17 14:30' },
        { role: 'Warehouse', status: 'accepted' }
      ],
      approvalStage: {
        currentStage: 'delivery',
        warehouseApproval: 'approved',
        warehouseApprovedBy: 'WHS-001',
        warehouseApprovedDate: '2025-09-18',
        warehouseNotes: 'Stock available - preparing for shipment',
        deliveryStatus: 'pending'
      },
      items: [
        { name: 'Safety Gloves', quantity: 100, unit: 'pairs' },
        { name: 'Face Masks', quantity: 200, unit: 'pieces' },
        { name: 'Safety Goggles', quantity: 20, unit: 'pieces' }
      ],
      notes: 'Monthly safety equipment restock'
    },
    // State 3: Delivered (archived)
    {
      orderId: 'CRW001-ORD-PRD003',
      orderType: 'product',
      title: 'Floor Care Products',
      requestedBy: 'CRW-001',
      destination: 'CTR-003',
      requestedDate: '2025-09-14',
      expectedDate: '2025-09-16',
      deliveryDate: '2025-09-16',
      status: 'delivered',
      approvalStages: [
        { role: 'Crew', status: 'requested', user: 'CRW-001', timestamp: '2025-09-14 08:00' },
        { role: 'Warehouse', status: 'accepted', user: 'WHS-001', timestamp: '2025-09-14 11:30' },
        { role: 'Warehouse', status: 'delivered', user: 'WHS-001', timestamp: '2025-09-16 15:45' }
      ],
      approvalStage: {
        currentStage: 'completed',
        warehouseApproval: 'approved',
        warehouseApprovedBy: 'WHS-001',
        warehouseApprovedDate: '2025-09-14',
        deliveryStatus: 'delivered',
        deliveredBy: 'WHS-001',
        deliveredDate: '2025-09-16',
        deliveryNotes: 'Delivered to loading dock - signed by J. Smith'
      },
      items: [
        { name: 'Floor Wax', quantity: 5, unit: 'gallons' },
        { name: 'Floor Stripper', quantity: 3, unit: 'gallons' },
        { name: 'Mop Heads', quantity: 24, unit: 'pieces' }
      ],
      notes: 'For scheduled floor maintenance at CTR-003'
    },
    // State 4: Rejected (archived)
    {
      orderId: 'CRW001-ORD-PRD004',
      orderType: 'product',
      title: 'Specialized Equipment Request',
      requestedBy: 'CRW-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-12',
      expectedDate: '2025-09-15',
      status: 'rejected',
      approvalStages: [
        { role: 'Crew', status: 'requested', user: 'CRW-001', timestamp: '2025-09-12 10:00' },
        { role: 'Warehouse', status: 'rejected', user: 'WHS-001', timestamp: '2025-09-13 09:30' }
      ],
      approvalStage: {
        currentStage: 'rejected',
        warehouseApproval: 'rejected',
        warehouseRejectedBy: 'WHS-001',
        warehouseRejectedDate: '2025-09-13',
        warehouseNotes: 'Items not in current inventory - please contact procurement for special order',
        rejectionReason: 'Out of stock - requires special order'
      },
      items: [
        { name: 'Industrial Steam Cleaner', quantity: 2, unit: 'units' },
        { name: 'High-Pressure Washer', quantity: 1, unit: 'unit' }
      ],
      notes: 'Need for deep cleaning project'
    }
  ];

    const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/manager/dashboard' },
    { id: 'profile', label: 'My Profile', path: '/manager/profile' },
    { id: 'ecosystem', label: 'My Ecosystem', path: '/manager/ecosystem' },
    { id: 'services', label: 'My Services', path: '/manager/services' },
    { id: 'orders', label: 'Orders', path: '/manager/orders' },
    { id: 'reports', label: 'Reports', path: '/manager/reports' },
    { id: 'support', label: 'Support', path: '/manager/support' }
  ];

  const handleLogout = () => {
    console.log('Manager Hub logout');
    // Implement logout logic
  };

  // Manager-specific overview cards (6 cards)
  const overviewCards = [
    { id: 'contractors', title: 'My Contractors', dataKey: 'contractorCount', color: 'blue' },
    { id: 'customers', title: 'My Customers', dataKey: 'customerCount', color: 'green' },
    { id: 'centers', title: 'My Centers', dataKey: 'centerCount', color: 'purple' },
    { id: 'crew', title: 'My Crew', dataKey: 'crewCount', color: 'orange' },
    { id: 'orders', title: 'Pending Orders', dataKey: 'pendingOrders', color: 'red' },
    { id: 'status', title: 'Account Status', dataKey: 'accountStatus', color: 'green' }
  ];

  // Mock data - replace with actual API data
  const overviewData = {
    contractorCount: 3,
    customerCount: 12,
    centerCount: 4,
    crewCount: 8,
    pendingOrders: 7,
    accountStatus: 'Active'
  };

  // Mock services data
  const myServicesData = [
    { serviceId: 'SRV-001', serviceName: 'Commercial Deep Cleaning', certified: 'Yes', certificationDate: '2024-03-15', expires: '2026-03-15' },
    { serviceId: 'SRV-002', serviceName: 'Floor Care & Maintenance', certified: 'Yes', certificationDate: '2024-01-10', expires: '—' },
    { serviceId: 'SRV-003', serviceName: 'Window Cleaning Services', certified: 'No', certificationDate: '—', expires: '—' },
    { serviceId: 'SRV-004', serviceName: 'HVAC Maintenance', certified: 'Yes', certificationDate: '2024-02-20', expires: '2025-02-20' },
  ];

  const activeServicesData = [
    { serviceId: 'CTR001-SRV001', serviceName: 'Commercial Deep Cleaning', centerId: 'CTR001', type: 'Recurring', startDate: '2025-09-01' },
    { serviceId: 'CTR002-SRV002', serviceName: 'Floor Care & Maintenance', centerId: 'CTR002', type: 'One-time', startDate: '2025-09-10' },
    { serviceId: 'CTR001-SRV003', serviceName: 'Window Cleaning Services', centerId: 'CTR001', type: 'Recurring', startDate: '2025-08-15' },
  ];

  const serviceHistoryData = [
    { serviceId: 'CTR003-SRV001', serviceName: 'Commercial Deep Cleaning', centerId: 'CTR003', type: 'Recurring', status: 'Completed', startDate: '2025-06-01', endDate: '2025-08-20' },
    { serviceId: 'CTR002-SRV003', serviceName: 'Window Cleaning Services', centerId: 'CTR002', type: 'One-time', status: 'Cancelled', startDate: '2025-07-15', endDate: '2025-08-02' },
    { serviceId: 'CTR001-SRV002', serviceName: 'Floor Care & Maintenance', centerId: 'CTR001', type: 'Recurring', status: 'Completed', startDate: '2025-05-31', endDate: '2025-07-31' },
    { serviceId: 'CTR004-SRV004', serviceName: 'HVAC Maintenance', centerId: 'CTR004', type: 'One-time', status: 'Completed', startDate: '2025-07-01', endDate: '2025-07-15' },
  ];


  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <MyHubSection
        hubName="Manager Hub"
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={setActiveTab}
        onLogout={handleLogout}
        userId="MGR-001"
        role="manager"
      />

      {/* Content Area */}
      <Scrollbar style={{
        flex: 1,
        padding: '0 24px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {activeTab === 'dashboard' ? (
            <PageWrapper title="Dashboard" showHeader={false}>
              {/* Section headers remain for dashboard */}
              <PageHeader title="Overview" />
              <OverviewSection
                cards={overviewCards}
                data={overviewData}
              />
              <PageHeader title="Recent Activity" />
              <RecentActivity
                activities={activities}
                onClear={() => setActivities([])}
                emptyMessage="No recent manager activity"
              />

              {/* Communication Hub */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <NewsPreview color="#3b82f6" onViewAll={() => console.log('View all news')} />
                <MemosPreview color="#3b82f6" onViewAll={() => console.log('View memos')} />
              </div>
            </PageWrapper>
          ) : activeTab === 'profile' ? (
            <PageWrapper title="My Profile" showHeader={true} headerSrOnly>
              <ProfileInfoCard
              role="manager"
              profileData={{
                fullName: 'John Smith',
                managerId: 'MGR-001',
                address: '123 Business Ave, Suite 100, New York, NY 10001',
                phone: '(555) 123-4567',
                email: 'john.smith@cks.com',
                territory: 'Northeast Region',
                role: 'Senior Manager',
                reportsTo: 'Regional Director',
                startDate: '2021-01-15'
              }}
              accountManager={null}
              primaryColor="#3b82f6"
              onUpdatePhoto={() => console.log('Update photo')}
            />
            </PageWrapper>
          ) : activeTab === 'ecosystem' ? (
            <PageWrapper title="My Ecosystem" showHeader={true} headerSrOnly>
              <EcosystemTree
                rootUser={{ id: 'MGR-001', role: 'Manager', name: 'John Smith' }}
                treeData={ecosystemData}
                onNodeClick={(userId: string) => console.log('View details for:', userId)}
                expandedNodes={['MGR-001']}
                currentUserId="MGR-001"
                title="My Ecosystem"
                subtitle="Your Territory Overview"
                description="Click any row with an arrow to expand and explore your territory ecosystem"
                roleColorMap={{
                  manager: '#e0f2fe',
                  contractor: '#dcfce7',
                  customer: '#fef9c3',
                  center: '#ffedd5',
                  crew: '#fee2e2'
                }}
              />
            </PageWrapper>
          ) : activeTab === 'services' ? (
            <PageWrapper title="My Services" showHeader={true} headerSrOnly>
              <TabSection
                tabs={[
                  { id: 'my', label: 'My Services', count: 4 },
                  { id: 'active', label: 'Active Services', count: 3 },
                  { id: 'history', label: 'Service History', count: 4 }
                ]}
                activeTab={servicesTab}
                onTabChange={setServicesTab}
                description={
                  servicesTab === 'my' ? 'Services you are certified in and qualified to train' :
                  servicesTab === 'active' ? 'Services you currently manage' :
                  'Services you no longer manage'
                }
                searchPlaceholder={
                  servicesTab === 'my' ? 'Search by Service ID or name' :
                  servicesTab === 'active' ? 'Search active services' :
                  'Search service history'
                }
                onSearch={setServicesSearchQuery}
                actionButton={
                  <Button
                    variant="primary"
                    roleColor="#000000"
                    onClick={() => console.log('Browse catalog')}
                  >
                    Browse CKS Catalog
                  </Button>
                }
                primaryColor="#3b82f6"
              >
                {servicesTab === 'my' && (
                  <DataTable
                    columns={[
                      { key: 'serviceId', label: 'SERVICE ID', clickable: true },
                      { key: 'serviceName', label: 'SERVICE NAME' },
                      { key: 'certified', label: 'CERTIFIED' },
                      { key: 'certificationDate', label: 'CERTIFICATION DATE' },
                      { key: 'expires', label: 'EXPIRES' }
                    ]}
                    data={myServicesData}
                    showSearch={false}
                    externalSearchQuery={servicesSearchQuery}
                    maxItems={10}
                    onRowClick={(row: unknown) => console.log('View service:', row)}
                  />
                )}

                {servicesTab === 'active' && (
                  <DataTable
                    columns={[
                      { key: 'serviceId', label: 'SERVICE ID', clickable: true },
                      { key: 'serviceName', label: 'SERVICE NAME' },
                      { key: 'centerId', label: 'CENTER ID' },
                      { key: 'type', label: 'TYPE' },
                      { key: 'startDate', label: 'START DATE' }
                    ]}
                    data={activeServicesData}
                    showSearch={false}
                    externalSearchQuery={servicesSearchQuery}
                    maxItems={10}
                    onRowClick={(row: unknown) => console.log('View order:', row)}
                  />
                )}

                {servicesTab === 'history' && (
                  <DataTable
                    columns={[
                      { key: 'serviceId', label: 'SERVICE ID', clickable: true },
                      { key: 'serviceName', label: 'SERVICE NAME' },
                      { key: 'centerId', label: 'CENTER ID' },
                      { key: 'type', label: 'TYPE' },
                      {
                        key: 'status',
                        label: 'STATUS',
                        render: (value: string) => (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 500,
                            backgroundColor: value === 'Completed' ? '#dcfce7' : '#fee2e2',
                            color: value === 'Completed' ? '#16a34a' : '#dc2626'
                          }}>
                            {value}
                          </span>
                        )
                      },
                      { key: 'startDate', label: 'START DATE' },
                      { key: 'endDate', label: 'END DATE' }
                    ]}
                    data={serviceHistoryData}
                    showSearch={false}
                    externalSearchQuery={servicesSearchQuery}
                    maxItems={10}
                    onRowClick={(row: unknown) => console.log('View history:', row)}
                  />
                )}
              </TabSection>
            </PageWrapper>
          ) : activeTab === 'orders' ? (
            <PageWrapper title="Orders" showHeader={true} headerSrOnly>
              <OrdersSection
                userRole="manager"
                serviceOrders={serviceOrders}
                productOrders={productOrders}
                onCreateProductOrder={() => console.log('Request Products')}
                onOrderAction={(orderId: string, action: string) => {
                  if (action === 'View Details') {
                    // Find the order to determine its status
                    const allOrders = [...serviceOrders, ...productOrders];
                    const order = allOrders.find(o => o.orderId === orderId);

                    if (order) {
                      if (order.status === 'delivered') {
                        alert('Delivery and order details will show here later. We will be able to add a POD or waybill here.');
                      } else if (order.status === 'rejected') {
                        alert('Rejection details will show here later. It will also show a waybill and a rejection reason.');
                      } else if (order.status === 'pending' || order.status === 'in-progress') {
                        alert('List of products ordered will show here and some other info.');
                      }
                    }
                  } else {
                    console.log(`Order ${orderId}: ${action}`);
                  }
                }}
                showServiceOrders={true}
                showProductOrders={true}
                primaryColor="#3b82f6"
              />
            </PageWrapper>
          ) : (
            <PageWrapper title={activeTab} showHeader={true} headerSrOnly>
              <h2>Manager Hub - {activeTab}</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </PageWrapper>
          )}
        </div>
      </Scrollbar>
    </div>
  );
}
