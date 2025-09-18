/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: CrewHub.tsx
 *
 * Description:
 * Crew Hub orchestrator component
 *
 * Responsibilities:
 * - Orchestrate crew role hub interface
 * - Manage tab navigation and content rendering
 *
 * Role in system:
 * - Primary interface for crew users
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

interface CrewHubProps {
  initialTab?: string;
}

export default function CrewHub({ initialTab = 'dashboard' }: CrewHubProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
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

  // Mock ecosystem data for crew (shows center and team members)
  const ecosystemData: TreeNode = {
    user: { id: 'CTR-001', role: 'Center', name: 'Acme Downtown Office' },
    children: [
      { user: { id: 'CRW-001', role: 'Crew', name: 'John Smith (Lead)' } },
      { user: { id: 'CRW-002', role: 'Crew', name: 'Jane Doe (Specialist)' } },
      { user: { id: 'CRW-003', role: 'Crew', name: 'Mike Johnson' } },
      { user: { id: 'CRW-004', role: 'Crew', name: 'Sarah Wilson' } },
      { user: { id: 'CRW-005', role: 'Crew', name: 'Bob Brown' } }
    ]
  };

  // Mock activities for crew
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 'act-1',
      message: 'Assigned to new task: Service at CTR-002',
      timestamp: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
      type: 'action',
      metadata: { role: 'crew', userId: 'CRW-001', title: 'Task Assignment' }
    },
    {
      id: 'act-2',
      message: 'Completed task: Equipment setup',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      type: 'success',
      metadata: { role: 'crew', userId: 'CRW-001', title: 'Task Completed' }
    },
    {
      id: 'act-3',
      message: 'Clocked in at 8:00 AM',
      timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000), // 7 hours ago
      type: 'info',
      metadata: { role: 'crew', userId: 'CRW-001', title: 'Time Entry' }
    },
    {
      id: 'act-4',
      message: 'Training module completed: Safety Procedures',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      type: 'success',
      metadata: { role: 'crew', userId: 'CRW-001', title: 'Training Update' }
    },
    {
      id: 'act-5',
      message: 'Schedule updated for next week',
      timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000), // 3 days ago
      type: 'info',
      metadata: { role: 'crew', userId: 'CRW-001', title: 'Schedule Change' }
    }
  ]);

    const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/crew/dashboard' },
    { id: 'profile', label: 'My Profile', path: '/crew/profile' },
    { id: 'ecosystem', label: 'My Ecosystem', path: '/crew/ecosystem' },
    { id: 'services', label: 'My Services', path: '/crew/services' },
    { id: 'orders', label: 'Orders', path: '/crew/orders' },
    { id: 'reports', label: 'Reports', path: '/crew/reports' },
    { id: 'support', label: 'Support', path: '/crew/support' }
  ];

  const handleLogout = () => {
    console.log('Crew Hub logout');
    // Implement logout logic
  };

  // Crew-specific overview cards (5 cards)
  const overviewCards = [
    { id: 'services', title: 'Active Services', dataKey: 'serviceCount', color: 'blue' },
    { id: 'tasks', title: 'My Tasks', dataKey: 'taskCount', color: 'red' },
    { id: 'hours', title: 'My Hours', dataKey: 'hoursWorked', color: 'purple' },
    { id: 'orders', title: 'Pending Orders', dataKey: 'pendingOrders', color: 'orange' },
    { id: 'status', title: 'Account Status', dataKey: 'accountStatus', color: 'green' }
  ];

  // Mock data - replace with actual API data
  const overviewData = {
    serviceCount: 4,
    taskCount: 12,
    hoursWorked: 32,
    pendingOrders: 6,
    accountStatus: 'Active'
  };

  // Mock services data for crew
  const myServicesData = [
    { serviceId: 'SRV-031', serviceName: 'Floor Care & Maintenance', type: 'Recurring', certified: 'Yes', certificationDate: '2023-03-15', expires: '2026-03-15' },
    { serviceId: 'SRV-032', serviceName: 'Window Cleaning', type: 'One-time', certified: 'Yes', certificationDate: '2023-08-20', expires: '2025-08-20' },
    { serviceId: 'SRV-033', serviceName: 'Equipment Operation', type: 'Recurring', certified: 'No', certificationDate: '—', expires: '—' },
    { serviceId: 'SRV-034', serviceName: 'Safety Protocols', type: 'One-time', certified: 'Yes', certificationDate: '2022-12-05', expires: '—' },
  ];

  const activeServicesData = [
    { serviceId: 'CTR001-SRV031', serviceName: 'Floor Care & Maintenance', centerId: 'CTR001', type: 'Recurring', startDate: '2025-09-15' },
    { serviceId: 'CTR002-SRV032', serviceName: 'Window Cleaning', centerId: 'CTR002', type: 'One-time', startDate: '2025-09-18' },
    { serviceId: 'CTR003-SRV034', serviceName: 'Safety Protocols', centerId: 'CTR003', type: 'Recurring', startDate: '2025-09-20' },
  ];

  const serviceHistoryData = [
    { serviceId: 'CTR001-SRV035', serviceName: 'Floor Care & Maintenance', centerId: 'CTR001', type: 'Recurring', status: 'Completed', startDate: '2025-09-10', endDate: '2025-09-16' },
    { serviceId: 'CTR002-SRV036', serviceName: 'Safety Protocols', centerId: 'CTR002', type: 'One-time', status: 'Completed', startDate: '2025-09-12', endDate: '2025-09-14' },
    { serviceId: 'CTR003-SRV037', serviceName: 'Window Cleaning', centerId: 'CTR003', type: 'Recurring', status: 'Completed', startDate: '2025-09-08', endDate: '2025-09-12' },
    { serviceId: 'CTR001-SRV038', serviceName: 'Equipment Operation', centerId: 'CTR001', type: 'One-time', status: 'Cancelled', startDate: '2025-09-05', endDate: '2025-09-08' },
  ];

  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <MyHubSection
        hubName="Crew Hub"
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={setActiveTab}
        onLogout={handleLogout}
        userId="CRW-001"
        role="crew"
      />

      {/* Content Area */}
      <Scrollbar style={{
        flex: 1,
        padding: '24px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {activeTab === 'dashboard' ? (
            <>
              <OverviewSection
                cards={overviewCards}
                data={overviewData}
                title="Overview"
              />
              <RecentActivity
                activities={activities}
                onClear={() => setActivities([])}
                title="Recent Activity"
                emptyMessage="No recent activity"
              />

              {/* Communication Hub */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <NewsPreview color="#ef4444" onViewAll={() => console.log('View all news')} />
                <MemosPreview color="#ef4444" onViewAll={() => console.log('View memos')} />
              </div>
            </>
          ) : activeTab === 'profile' ? (
            <ProfileInfoCard
              role="crew"
              profileData={{
                name: 'David Martinez',
                crewId: 'CRW-001',
                address: '567 Worker Lane, Houston, TX 77001',
                phone: '(555) 890-1234',
                email: 'david.martinez@cks-crew.com',
                territory: 'Southwest District',
                emergencyContact: 'Maria Martinez (555) 890-5678',
                startDate: '2022-02-28'
              }}
              accountManager={{
                name: 'Tom Bradley',
                id: 'MGR-005',
                email: 'tom.bradley@cks.com',
                phone: '(555) 901-2345'
              }}
              primaryColor="#ef4444"
              onUpdatePhoto={() => console.log('Update photo')}
              onContactManager={() => console.log('Contact manager')}
              onScheduleMeeting={() => console.log('Schedule meeting')}
            />
          ) : activeTab === 'ecosystem' ? (
            <EcosystemTree
              rootUser={{ id: 'CTR-001', role: 'Center', name: 'Acme Downtown Office' }}
              treeData={ecosystemData}
              onNodeClick={(userId) => console.log('View details for:', userId)}
              expandedNodes={['CTR-001']}
              currentUserId="CRW-001"
              title="Ecosystem"
              subtitle="Your Work Network Overview"
              description="Click any row with an arrow to expand and explore your network connections"
              roleColorMap={{
                center: '#ffedd5',
                crew: '#fee2e2'
              }}
            />
          ) : activeTab === 'services' ? (
            <>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 0 }}>
                  My Services
                </h1>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <TabContainer variant="pills" spacing="compact">
                  <NavigationTab
                    label="My Services"
                    count={4}
                    isActive={servicesTab === 'my'}
                    onClick={() => setServicesTab('my')}
                    activeColor="#ef4444"
                  />
                  <NavigationTab
                    label="Active Services"
                    count={3}
                    isActive={servicesTab === 'active'}
                    onClick={() => setServicesTab('active')}
                    activeColor="#ef4444"
                  />
                  <NavigationTab
                    label="Service History"
                    count={4}
                    isActive={servicesTab === 'history'}
                    onClick={() => setServicesTab('history')}
                    activeColor="#ef4444"
                  />
                </TabContainer>

                <Button
                  variant="primary"
                  roleColor="#ef4444"
                  onClick={() => console.log('View training')}
                >
                  View Training
                </Button>
              </div>

              <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: 16 }}>
                {servicesTab === 'my' ? 'Services you are trained and certified in' :
                 servicesTab === 'active' ? 'Services you are currently assigned to' :
                 'Services you no longer are assigned to'}
              </div>

              {servicesTab === 'my' && (
                <DataTable
                  columns={[
                    { key: 'serviceId', label: 'SERVICE ID', clickable: true },
                    { key: 'serviceName', label: 'SERVICE NAME' },
                    { key: 'type', label: 'TYPE' },
                    { key: 'certified', label: 'CERTIFIED' },
                    { key: 'certificationDate', label: 'CERTIFICATION DATE' },
                    { key: 'expires', label: 'EXPIRES' }
                  ]}
                  data={myServicesData}
                  searchPlaceholder="Search by Service ID or name"
                  maxItems={10}
                  onRowClick={(row) => console.log('View service:', row)}
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
                  searchPlaceholder="Search active services"
                  maxItems={10}
                  onRowClick={(row) => console.log('View task:', row)}
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
                  searchPlaceholder="Search service history"
                  maxItems={10}
                  onRowClick={(row) => console.log('View history:', row)}
                />
              )}
            </>
          ) : (
            <>
              <h2>Crew Hub - {activeTab}</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </>
          )}
        </div>
      </Scrollbar>
    </div>
  );
}
