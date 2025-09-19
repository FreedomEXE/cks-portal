/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: CenterHub.tsx
 *
 * Description:
 * Center Hub orchestrator component
 *
 * Responsibilities:
 * - Orchestrate center role hub interface
 * - Manage tab navigation and content rendering
 *
 * Role in system:
 * - Primary interface for center users
 *
 * Notes:
 * Uses MyHubSection for navigation
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import React, { useState, useEffect } from 'react';
import { Scrollbar } from '../../../packages/ui/src/Scrollbar';
import MyHubSection from '../../../packages/ui/src/navigation/MyHubSection';
import OverviewSection from '../../../packages/domain-widgets/src/overview';
import { RecentActivity, type Activity } from '../../../packages/domain-widgets/src/activity';
import { NewsPreview } from '../../../packages/domain-widgets/src/news';
import { MemosPreview } from '../../../packages/domain-widgets/src/memos';
import { ProfileInfoCard } from '../../../packages/domain-widgets/src/profile';
import EcosystemTree, { type TreeNode } from '../../../packages/domain-widgets/EcosystemTree';
import DataTable from '../../../packages/ui/src/tables/DataTable';
import NavigationTab from '../../../packages/ui/src/navigation/NavigationTab';
import TabContainer from '../../../packages/ui/src/navigation/TabContainer';
import Button from '../../../packages/ui/src/buttons/Button';
import { OrdersSection } from '../../../packages/domain-widgets/src/OrdersSection';
import PageWrapper from '../../../packages/ui/src/layout/PageWrapper';
import PageHeader from '../../../packages/ui/src/layout/PageHeader';
import TabSection from '../../../packages/ui/src/layout/TabSection';

interface CenterHubProps {
  initialTab?: string;
}

export default function CenterHub({ initialTab = 'dashboard' }: CenterHubProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [servicesTab, setServicesTab] = useState('my');

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

  // Mock ecosystem data for center (shows crew members)
  const ecosystemData: TreeNode = {
    user: { id: 'CTR-001', role: 'Center', name: 'Acme Downtown Office' },
    children: [
      { user: { id: 'CRW-001', role: 'Crew', name: 'John Smith (Lead)' } },
      { user: { id: 'CRW-002', role: 'Crew', name: 'Jane Doe (Specialist)' } },
      { user: { id: 'CRW-014', role: 'Crew', name: 'Michael Brown' } },
      { user: { id: 'CRW-015', role: 'Crew', name: 'Susan Davis' } },
      { user: { id: 'CRW-016', role: 'Crew', name: 'James Wilson' } }
    ]
  };

  // Mock activities for center
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 'act-1',
      message: 'New service scheduled for tomorrow at 9 AM',
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      type: 'info',
      metadata: { role: 'center', userId: 'CEN-001', title: 'Service Scheduled' }
    },
    {
      id: 'act-2',
      message: 'Crew member CRW-003 checked in',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      type: 'success',
      metadata: { role: 'crew', userId: 'CRW-003', title: 'Crew Check-in' }
    },
    {
      id: 'act-3',
      message: 'Equipment maintenance completed',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      type: 'success',
      metadata: { role: 'center', userId: 'CEN-001', title: 'Maintenance Complete' }
    },
    {
      id: 'act-4',
      message: 'Low inventory alert: Cleaning supplies',
      timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000), // 1.5 days ago
      type: 'warning',
      metadata: { role: 'center', userId: 'CEN-001', title: 'Inventory Alert' }
    }
  ]);

  // Mock orders data for Center - CLEARED FOR FRESH START
  const serviceOrders: any[] = [];

  const productOrders: any[] = [];

    const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/center/dashboard' },
    { id: 'profile', label: 'My Profile', path: '/center/profile' },
    { id: 'ecosystem', label: 'My Ecosystem', path: '/center/ecosystem' },
    { id: 'services', label: 'My Services', path: '/center/services' },
    { id: 'orders', label: 'Orders', path: '/center/orders' },
    { id: 'reports', label: 'Reports', path: '/center/reports' },
    { id: 'support', label: 'Support', path: '/center/support' }
  ];

  const handleLogout = () => {
    console.log('Center Hub logout');
    // Implement logout logic
  };

  // Center-specific overview cards (4 cards)
  const overviewCards = [
    { id: 'services', title: 'Active Services', dataKey: 'serviceCount', color: 'blue' },
    { id: 'crew', title: 'Active Crew', dataKey: 'crewCount', color: 'orange' },
    { id: 'orders', title: 'Pending Orders', dataKey: 'pendingOrders', color: 'red' },
    { id: 'status', title: 'Account Status', dataKey: 'accountStatus', color: 'green' }
  ];

  // Mock data - replace with actual API data
  const overviewData = {
    serviceCount: 8,
    crewCount: 6,
    pendingOrders: 4,
    accountStatus: 'Active'
  };

  // Mock services data for center
  const myServicesData = [
    { serviceId: 'CTR001-SRV021', serviceName: 'Facility Management', type: 'Recurring', status: 'Active', startDate: '2024-01-15' },
    { serviceId: 'CTR001-SRV022', serviceName: 'Daily Cleaning Services', type: 'Recurring', status: 'Active', startDate: '2024-02-01' },
    { serviceId: 'CTR001-SRV023', serviceName: 'Security Monitoring', type: 'One-time', status: 'Active', startDate: '2024-03-10' },
    { serviceId: 'CTR001-SRV024', serviceName: 'Maintenance Services', type: 'One-time', status: 'Scheduled', startDate: '2024-04-01' },
  ];

  const activeServicesData = [
    { orderId: 'ORD-301', serviceName: 'Daily Cleaning Services', assignedCrew: 'Team Alpha', startTime: '06:00 AM', duration: '4 hours', status: 'In Progress' },
    { orderId: 'ORD-302', serviceName: 'Equipment Maintenance', assignedCrew: 'Team Beta', startTime: '02:00 PM', duration: '2 hours', status: 'Scheduled' },
    { orderId: 'ORD-303', serviceName: 'Security Patrol', assignedCrew: 'Security Team', startTime: '08:00 PM', duration: '8 hours', status: 'Scheduled' },
  ];

  const serviceHistoryData = [
    { serviceId: 'CTR001-SRV025', serviceName: 'Deep Cleaning', centerId: 'CTR001', type: 'One-time', status: 'Completed', startDate: '2025-09-10', endDate: '2025-09-15' },
    { serviceId: 'CTR001-SRV026', serviceName: 'HVAC Inspection', centerId: 'CTR001', type: 'Recurring', status: 'Completed', startDate: '2025-09-05', endDate: '2025-09-10' },
    { serviceId: 'CTR001-SRV027', serviceName: 'Window Cleaning', centerId: 'CTR001', type: 'One-time', status: 'Completed', startDate: '2025-09-01', endDate: '2025-09-05' },
    { serviceId: 'CTR001-SRV028', serviceName: 'Floor Waxing', centerId: 'CTR001', type: 'Recurring', status: 'Cancelled', startDate: '2025-08-20', endDate: '2025-08-28' },
  ];

  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <MyHubSection
        hubName="Center Hub"
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={setActiveTab}
        onLogout={handleLogout}
        userId="CEN-001"
        role="center"
      />

      {/* Content Area */}
      <Scrollbar style={{
        flex: 1,
        padding: '0 24px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {activeTab === 'dashboard' ? (
            <PageWrapper title="Dashboard" showHeader={false}>
              <PageHeader title="Overview" />
              <OverviewSection
                cards={overviewCards}
                data={overviewData}
              />
              <PageHeader title="Recent Activity" />
              <RecentActivity
                activities={activities}
                onClear={() => setActivities([])}
                emptyMessage="No recent center activity"
              />

              {/* Communication Hub */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <NewsPreview color="#f97316" onViewAll={() => console.log('View all news')} />
                <MemosPreview color="#f97316" onViewAll={() => console.log('View memos')} />
              </div>
            </PageWrapper>
          ) : activeTab === 'profile' ? (
            <PageWrapper headerSrOnly>
              <ProfileInfoCard
              role="center"
              profileData={{
                name: 'Downtown Service Center',
                centerId: 'CEN-001',
                address: '321 Main Street, Chicago, IL 60601',
                phone: '(555) 678-9012',
                email: 'downtown@cks-centers.com',
                website: 'www.cks-centers.com/downtown',
                mainContact: 'James Wilson',
                startDate: '2018-11-05'
              }}
              accountManager={{
                name: 'Lisa Anderson',
                id: 'MGR-004',
                email: 'lisa.anderson@cks.com',
                phone: '(555) 789-0123'
              }}
              primaryColor="#f97316"
              onUpdatePhoto={() => console.log('Update photo')}
              onContactManager={() => console.log('Contact manager')}
              onScheduleMeeting={() => console.log('Schedule meeting')}
            />
            </PageWrapper>
          ) : activeTab === 'ecosystem' ? (
            <PageWrapper headerSrOnly>
              <EcosystemTree
              rootUser={{ id: 'CTR-001', role: 'Center', name: 'Acme Downtown Office' }}
              treeData={ecosystemData}
              onNodeClick={(userId) => console.log('View details for:', userId)}
              expandedNodes={['CTR-001']}
              currentUserId="CTR-001"
              title="Ecosystem"
              subtitle="Your Facility Network Overview"
              description="Click any row with an arrow to expand and explore your network connections"
              roleColorMap={{
                center: '#ffedd5',
                crew: '#fee2e2'
              }}
            />
            </PageWrapper>
          ) : activeTab === 'services' ? (
            <PageWrapper headerSrOnly>
              <TabSection
                tabs={[
                  { id: 'my', label: 'My Services', count: 4 },
                  { id: 'history', label: 'Service History', count: 4 }
                ]}
                activeTab={servicesTab}
                onTabChange={setServicesTab}
                description={servicesTab === 'my' ? 'CKS services currently provided at your center' : 'Services Archive'}
                searchPlaceholder={
                  servicesTab === 'my' ? 'Search by Service ID or name' :
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
                primaryColor="#f97316"
              >

              {servicesTab === 'my' && (
                <DataTable
                  columns={[
                    { key: 'serviceId', label: 'SERVICE ID', clickable: true },
                    { key: 'serviceName', label: 'SERVICE NAME' },
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
                          backgroundColor: value === 'Active' ? '#dcfce7' : value === 'Scheduled' ? '#dbeafe' : '#fee2e2',
                          color: value === 'Active' ? '#16a34a' : value === 'Scheduled' ? '#2563eb' : '#dc2626'
                        }}>
                          {value}
                        </span>
                      )
                    },
                    { key: 'startDate', label: 'START DATE' }
                  ]}
                  data={myServicesData}
                  showSearch={false}
                  externalSearchQuery={servicesSearchQuery}
                  maxItems={10}
                  onRowClick={(row) => console.log('View service:', row)}
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
                  onRowClick={(row) => console.log('View history:', row)}
                />
              )}
              </TabSection>
            </PageWrapper>
          ) : activeTab === 'orders' ? (
            <PageWrapper headerSrOnly>
              <OrdersSection
              userRole="center"
              serviceOrders={serviceOrders}
              productOrders={productOrders}
              onCreateServiceOrder={() => console.log('Request Service')}
              onCreateProductOrder={() => console.log('Request Products')}
              onOrderAction={(orderId, action) => {
                console.log(`Order ${orderId}: ${action}`);
              }}
              showServiceOrders={true}
              showProductOrders={true}
              primaryColor="#f97316"
            />
            </PageWrapper>
          ) : (
            <PageWrapper title={activeTab} showHeader={true} headerSrOnly>
              <h2>Center Hub - {activeTab}</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </PageWrapper>
          )}
        </div>
      </Scrollbar>
    </div>
  );
}
