/*-----------------------------------------------
  Property of CKS  © 2025
-----------------------------------------------*/
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
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import { useEffect, useState } from 'react';
import EcosystemTree, { type TreeNode } from '../../../packages/domain-widgets/EcosystemTree';
import { MemosPreview, NewsPreview, OrdersSection, OverviewSection, ProfileInfoCard, RecentActivity, ReportsSection, SupportSection, type Activity } from '@cks/domain-widgets';
import { Button, DataTable, PageHeader, PageWrapper, Scrollbar, TabSection } from '@cks/ui';
import MyHubSection from '../components/MyHubSection';

interface CrewHubProps {
  initialTab?: string;
}

export default function CrewHub({ initialTab = 'dashboard' }: CrewHubProps) {
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

  // Mock orders data for Crew - Services assigned to this crew member
  const serviceOrders: any[] = [
    // State 1: NEW SERVICE ASSIGNMENT - Crew needs to accept/deny (ACTION REQUIRED)
    {
      orderId: 'CTR001-ORD-SRV010',
      orderType: 'service',
      title: 'Electrical System Inspection',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-19',
      expectedDate: '2025-09-25',
      serviceStartDate: '2025-09-25',
      status: 'pending',  // Crew sees as pending (needs to accept/deny assignment)
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-19 08:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-19 10:00' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-19 13:00' },
        { role: 'Manager', status: 'pending' }  // Manager waiting for crew response
      ],
      description: 'Annual electrical system safety inspection',
      serviceType: 'Inspection',
      frequency: 'Yearly',
      estimatedDuration: '4 hours',
      assignedCrew: 'CRW-001',  // This crew member
      notes: 'Requires electrical certification - check safety protocols',
      crewAssignmentStatus: 'pending'  // NEW: Shows crew hasn't responded yet
    },
    // State 2: ANOTHER NEW ASSIGNMENT - Different service type
    {
      orderId: 'CTR001-ORD-SRV011',
      orderType: 'service',
      title: 'Emergency Water Damage Cleanup',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-19',
      expectedDate: '2025-09-20',
      serviceStartDate: '2025-09-20',
      status: 'pending',  // Crew needs to respond
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-19 14:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-19 15:00' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-19 16:00' },
        { role: 'Manager', status: 'pending' }  // Manager waiting for crew response
      ],
      description: 'Urgent water damage restoration and cleanup',
      serviceType: 'Emergency',
      frequency: 'One-time',
      estimatedDuration: '12 hours',
      assignedCrew: 'CRW-001',  // This crew member
      notes: 'URGENT: Pipe burst in basement - immediate response needed',
      crewAssignmentStatus: 'pending',
      priority: 'high'
    },
    // State 3: ACCEPTED SERVICE - Currently active
    {
      orderId: 'CTR001-ORD-SRV004',
      orderType: 'service',
      title: 'Landscaping Maintenance Service',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-15',
      expectedDate: '2025-09-20',
      serviceStartDate: '2025-09-20',
      status: 'service-created',  // Service is active and assigned to them
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-15 09:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-15 12:00' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-15 16:00' },
        { role: 'Manager', status: 'service-created', user: 'MGR-001', timestamp: '2025-09-16 10:00' }
      ],
      description: 'Weekly landscaping and grounds maintenance',
      serviceType: 'Landscaping',
      frequency: 'Weekly',
      estimatedDuration: '6 hours',
      assignedCrew: 'CRW-001',  // This crew member
      notes: 'Includes lawn care and shrub trimming',
      crewAssignmentStatus: 'accepted'  // Crew accepted this assignment
    },
    // State 4: ANOTHER ACCEPTED SERVICE - Currently active
    {
      orderId: 'CTR001-ORD-SRV008',
      orderType: 'service',
      title: 'HVAC System Maintenance',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-12',
      expectedDate: '2025-09-15',
      serviceStartDate: '2025-09-15',
      status: 'service-created',
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-12 09:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-12 11:00' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-12 14:00' },
        { role: 'Manager', status: 'service-created', user: 'MGR-001', timestamp: '2025-09-13 09:00' }
      ],
      description: 'Routine HVAC system maintenance and filter replacement',
      serviceType: 'Maintenance',
      frequency: 'Quarterly',
      estimatedDuration: '3 hours',
      assignedCrew: 'CRW-001',  // This crew member
      notes: 'Standard quarterly maintenance',
      crewAssignmentStatus: 'accepted'
    },
    // State 5: DENIED SERVICE - Crew rejected this assignment (Manager can reassign)
    {
      orderId: 'CTR001-ORD-SRV012',
      orderType: 'service',
      title: 'Rooftop Equipment Installation',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-18',
      expectedDate: '2025-09-24',
      serviceStartDate: '2025-09-24',
      status: 'pending',  // Still shows as pending - Manager needs to reassign
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-18 09:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-18 12:00' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-18 15:00' },
        { role: 'Manager', status: 'pending' }  // Manager still pending (needs to reassign)
      ],
      description: 'Installation of new rooftop HVAC equipment',
      serviceType: 'Installation',
      frequency: 'One-time',
      estimatedDuration: '16 hours',
      assignedCrew: 'CRW-001',  // This crew member (but they denied)
      notes: 'Heavy equipment work - requires safety harness certification',
      crewAssignmentStatus: 'denied',  // Crew denied this assignment
      denialReason: 'Not certified for rooftop work - safety concern'
    },
    // State 3: Completed service (in archive)
    {
      orderId: 'CTR001-ORD-SRV009',
      orderType: 'service',
      title: 'Office Window Cleaning',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-05',
      expectedDate: '2025-09-08',
      serviceStartDate: '2025-09-08',
      status: 'service-created',  // Completed service
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-05 10:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-05 14:00' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-05 16:00' },
        { role: 'Manager', status: 'service-created', user: 'MGR-001', timestamp: '2025-09-06 09:00' }
      ],
      description: 'Professional window cleaning for all office floors',
      serviceType: 'Cleaning',
      frequency: 'Monthly',
      estimatedDuration: '4 hours',
      assignedCrew: 'CRW-001',  // This crew member
      notes: 'All exterior and interior windows',
      serviceCompleted: true,
      completedDate: '2025-09-08'
    }
  ];

  const productOrders: any[] = [
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
    { id: 'dashboard', label: 'Dashboard', path: '/crew/dashboard' },
    { id: 'profile', label: 'My Profile', path: '/crew/profile' },
    { id: 'ecosystem', label: 'My Ecosystem', path: '/crew/ecosystem' },
    { id: 'services', label: 'My Services', path: '/crew/services' },
    { id: 'orders', label: 'Orders', path: '/crew/orders' },
    { id: 'reports', label: 'Reports', path: '/crew/reports' },
    { id: 'support', label: 'Support', path: '/crew/support' }
  ];

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
    { serviceId: 'SRV-033', serviceName: 'Equipment Operation', type: 'Recurring', certified: 'No', certificationDate: 'â€”', expires: 'â€”' },
    { serviceId: 'SRV-034', serviceName: 'Safety Protocols', type: 'One-time', certified: 'Yes', certificationDate: '2022-12-05', expires: 'â€”' },
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
        userId="CRW-001"
        role="crew"
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
                emptyMessage="No recent activity"
              />

              {/* Communication Hub */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <NewsPreview color="#ef4444" onViewAll={() => console.log('View all news')} />
                <MemosPreview color="#ef4444" onViewAll={() => console.log('View memos')} />
              </div>
            </PageWrapper>
          ) : activeTab === 'profile' ? (
            <PageWrapper title="My Profile" showHeader={true} headerSrOnly>
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
            </PageWrapper>
          ) : activeTab === 'ecosystem' ? (
            <PageWrapper title="My Ecosystem" showHeader={true} headerSrOnly>
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
                  servicesTab === 'my' ? 'Services you are trained and certified in' :
                  servicesTab === 'active' ? 'Services you are currently assigned to' :
                  'Services you no longer are assigned to'
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
                primaryColor="#ef4444"
              >

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
                  showSearch={false}
                  externalSearchQuery={servicesSearchQuery}
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
                  showSearch={false}
                  externalSearchQuery={servicesSearchQuery}
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
                  showSearch={false}
                  externalSearchQuery={servicesSearchQuery}
                  maxItems={10}
                  onRowClick={(row) => console.log('View history:', row)}
                />
              )}
              </TabSection>
            </PageWrapper>
          ) : activeTab === 'orders' ? (
            <PageWrapper title="Orders" showHeader={true} headerSrOnly>
              <OrdersSection
              userRole="crew"
              serviceOrders={serviceOrders}
              productOrders={productOrders}
              onCreateProductOrder={() => console.log('Request Products')}
              onOrderAction={(orderId, action) => {
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
              primaryColor="#ef4444"
            />
            </PageWrapper>
          ) : activeTab === 'reports' ? (
            <PageWrapper headerSrOnly>
              <ReportsSection
                role="crew"
                userId="CRW-001"
                primaryColor="#ef4444"
              />
            </PageWrapper>
          ) : activeTab === 'support' ? (
            <PageWrapper headerSrOnly>
              <SupportSection
                role="crew"
                primaryColor="#ef4444"
              />
            </PageWrapper>
          ) : (
            <PageWrapper title={activeTab} showHeader={true} headerSrOnly>
              <h2>Crew Hub - {activeTab}</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </PageWrapper>
          )}
        </div>
      </Scrollbar>
    </div>
  );
}

