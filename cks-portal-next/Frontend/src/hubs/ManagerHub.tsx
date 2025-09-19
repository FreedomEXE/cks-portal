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

  // Mock orders data
  const serviceOrders = [
    {
      orderId: 'CEN001-ORD-SRV001',
      orderType: 'service' as const,
      title: 'Window Cleaning',
      requestedBy: 'Center Created',
      requestedDate: '2025-09-10',
      expectedDate: '2025-09-15',
      status: 'pending' as const,
      approvalStages: [
        { role: 'Center Created', status: 'approved' as const, user: 'Acme Downtown' },
        { role: 'Customer', status: 'approved' as const, user: 'Acme Corp' },
        { role: 'Contractor', status: 'approved' as const, user: 'Premium LLC' },
        { role: 'Manager', status: 'pending' as const }
      ]
    },
    {
      orderId: 'CUS001-ORD-SRV002',
      orderType: 'service' as const,
      title: 'Lawn Maintenance',
      requestedBy: 'Customer Created',
      requestedDate: '2025-09-12',
      expectedDate: '2025-09-20',
      status: 'pending' as const,
      approvalStages: [
        { role: 'Customer Created', status: 'approved' as const, user: 'TechStart Inc' },
        { role: 'Contractor', status: 'approved' as const, user: 'Premium LLC' },
        { role: 'Manager', status: 'pending' as const }
      ]
    },
    {
      orderId: 'CEN003-ORD-SRV003',
      orderType: 'service' as const,
      title: 'HVAC Maintenance',
      requestedBy: 'Center Created',
      requestedDate: '2025-09-08',
      expectedDate: '2025-09-12',
      status: 'in-progress' as const,
      approvalStages: [
        { role: 'Center Created', status: 'approved' as const, user: 'Tech Campus' },
        { role: 'Customer', status: 'approved' as const, user: 'TechStart Inc' },
        { role: 'Contractor', status: 'approved' as const, user: 'Elite Services' },
        { role: 'Manager', status: 'approved' as const, user: 'John Smith' }
      ]
    },
    // Archive orders - completed/cancelled
    {
      orderId: 'CEN002-ORD-SRV001',
      orderType: 'service' as const,
      title: 'Deep Cleaning Service',
      requestedBy: 'Center Created',
      requestedDate: '2025-08-15',
      expectedDate: '2025-08-20',
      status: 'approved' as const,
      transformedId: 'CEN002-SRV001',
      approvalStages: [
        { role: 'Center Created', status: 'approved' as const, user: 'Tech Campus' },
        { role: 'Customer', status: 'approved' as const, user: 'TechStart Inc' },
        { role: 'Contractor', status: 'approved' as const, user: 'Elite Services' },
        { role: 'Manager', status: 'approved' as const, user: 'John Smith' }
      ]
    },
    {
      orderId: 'CUS002-ORD-SRV005',
      orderType: 'service' as const,
      title: 'Emergency Plumbing',
      requestedBy: 'Customer Created',
      requestedDate: '2025-08-10',
      expectedDate: '2025-08-11',
      status: 'cancelled' as const,
      approvalStages: [
        { role: 'Customer', status: 'approved' as const, user: 'GlobalTech Inc' },
        { role: 'Contractor', status: 'rejected' as const, user: 'Premium LLC' }
      ]
    }
  ];

  const productOrders = [
    {
      orderId: 'CEN001-ORD-PRD001',
      orderType: 'product' as const,
      title: 'Cleaning Equipment Refill',
      requestedBy: 'Center Created',
      requestedDate: '2025-09-10',
      expectedDate: '2025-09-15',
      status: 'approved' as const,
      approvalStages: [
        { role: 'Center Created', status: 'approved' as const, user: 'Acme Downtown' },
        { role: 'Contractor', status: 'approved' as const, user: 'Premium LLC' },
        { role: 'Warehouse', status: 'pending' as const }
      ]
    },
    {
      orderId: 'CRW001-ORD-PRD001',
      orderType: 'product' as const,
      title: 'Safety Equipment Request',
      requestedBy: 'Crew Created',
      requestedDate: '2025-09-11',
      expectedDate: '2025-09-13',
      status: 'pending' as const,
      approvalStages: [
        { role: 'Crew Created', status: 'approved' as const, user: 'John Smith' },
        { role: 'Contractor', status: 'pending' as const },
        { role: 'Warehouse', status: 'waiting' as const }
      ]
    },
    {
      orderId: 'MGR001-ORD-PRD001',
      orderType: 'product' as const,
      title: 'Office Supplies',
      requestedBy: 'Manager Created',
      requestedDate: '2025-09-09',
      expectedDate: '2025-09-20',
      status: 'approved' as const,
      transformedId: 'MGR001-SUP001',
      approvalStages: [
        { role: 'Manager Created', status: 'approved' as const, user: 'John Smith' },
        { role: 'Contractor', status: 'approved' as const, user: 'Premium LLC' },
        { role: 'Warehouse', status: 'approved' as const, user: 'Main Warehouse' }
      ]
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
                  console.log(`Order ${orderId}: ${action}`);
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
