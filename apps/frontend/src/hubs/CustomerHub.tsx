/*-----------------------------------------------
  Property of CKS  © 2025
-----------------------------------------------*/
/**
 * File: CustomerHub.tsx
 *
 * Description:
 * Customer Hub orchestrator component
 *
 * Responsibilities:
 * - Orchestrate customer role hub interface
 * - Manage tab navigation and content rendering
 *
 * Role in system:
 * - Primary interface for customer users
 *
 * Notes:
 * Uses MyHubSection for navigation
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EcosystemTree, type TreeNode } from '@cks/domain-widgets';
import { MemosPreview, NewsPreview, OrdersSection, OverviewSection, ProfileInfoCard, RecentActivity, ReportsSection, SupportSection, type Activity } from '@cks/domain-widgets';
import { Button, DataTable, PageHeader, PageWrapper, Scrollbar, TabSection } from '@cks/ui';
import MyHubSection from '../components/MyHubSection';

interface CustomerHubProps {
  initialTab?: string;
}

export default function CustomerHub({ initialTab = 'dashboard' }: CustomerHubProps) {
  const navigate = useNavigate();
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

  // Mock ecosystem data for customer (shows centers and crew)
  const ecosystemData: TreeNode = {
    user: { id: 'CUS-001', role: 'Customer', name: 'Acme Corporation' },
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
      },
      {
        user: { id: 'CTR-006', role: 'Center', name: 'Acme Research Lab' },
        count: 2,
        type: 'crew',
        children: [
          { user: { id: 'CRW-012', role: 'Crew', name: 'Alice Martinez' } },
          { user: { id: 'CRW-013', role: 'Crew', name: 'Robert Chen' } }
        ]
      }
    ]
  };

  // Mock activities for customer
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 'act-1',
      message: 'Service request SR-2024-003 submitted',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      type: 'info',
      metadata: { role: 'customer', userId: 'CUS-001', title: 'Request Submitted' }
    },
    {
      id: 'act-2',
      message: 'Service completed at Center CTR-002',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      type: 'success',
      metadata: { role: 'customer', userId: 'CUS-001', title: 'Service Complete' }
    },
    {
      id: 'act-3',
      message: 'Invoice payment received for INV-2024-077',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      type: 'success',
      metadata: { role: 'customer', userId: 'CUS-001', title: 'Payment Received' }
    },
    {
      id: 'act-4',
      message: 'New crew member assigned to your service',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      type: 'info',
      metadata: { role: 'customer', userId: 'CUS-001', title: 'Team Assignment' }
    }
  ]);

  // Mock orders data for Customer - Service requests from centers
  const serviceOrders: any[] = [
    // State 1: Pending customer approval (ACTION REQUIRED)
    {
      orderId: 'CTR001-ORD-SRV001',
      orderType: 'service',
      title: 'HVAC System Maintenance Contract',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-19',
      expectedDate: '2025-10-01',
      status: 'pending',  // Customer sees as pending (needs their approval)
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-19 09:00' },
        { role: 'Customer', status: 'pending' },  // Their action needed - only this should pulse
        { role: 'Contractor', status: 'waiting' },
        { role: 'Manager', status: 'waiting' }
      ],
      description: 'Quarterly HVAC maintenance and inspection service',
      serviceType: 'Maintenance',
      frequency: 'Quarterly',
      estimatedDuration: '4 hours',
      notes: 'Include filter replacement and system diagnostics'
    },
    // State 2: Customer approved, monitoring contractor approval
    {
      orderId: 'CTR001-ORD-SRV002',
      orderType: 'service',
      title: 'Office Deep Cleaning Service',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-18',
      expectedDate: '2025-09-25',
      status: 'in-progress',  // Customer sees as in-progress after approving
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-18 10:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-18 14:00' },
        { role: 'Contractor', status: 'pending' },  // Only this should pulse
        { role: 'Manager', status: 'waiting' }
      ],
      description: 'Comprehensive deep cleaning of all office areas',
      serviceType: 'Cleaning',
      frequency: 'One-time',
      estimatedDuration: '8 hours',
      notes: 'Include carpet cleaning and window washing'
    },
    // State 3: All approved, monitoring manager service creation
    {
      orderId: 'CTR001-ORD-SRV003',
      orderType: 'service',
      title: 'Security System Installation',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-17',
      expectedDate: '2025-09-30',
      status: 'in-progress',
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-17 08:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-17 11:00' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-17 15:00' },
        { role: 'Manager', status: 'pending' }  // Only this should pulse
      ],
      description: 'Installation of new security camera system',
      serviceType: 'Installation',
      frequency: 'One-time',
      estimatedDuration: '12 hours',
      notes: 'Requires specialized security clearance'
    },
    // State 4: Service created and active
    {
      orderId: 'CTR001-ORD-SRV004',
      orderType: 'service',
      title: 'Landscaping Maintenance Service',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-15',
      expectedDate: '2025-09-20',
      serviceStartDate: '2025-09-20',
      status: 'service-created',
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
      assignedCrew: 'CRW-003',
      notes: 'Includes lawn care and shrub trimming'
    },
    // State 5: Rejected by Customer
    {
      orderId: 'CTR001-ORD-SRV005',
      orderType: 'service',
      title: 'Premium Office Renovation',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-12',
      expectedDate: '2025-10-15',
      status: 'rejected',
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-12 10:00' },
        { role: 'Customer', status: 'rejected', user: 'CUS-001', timestamp: '2025-09-12 16:00' }
      ],
      description: 'Complete office renovation and modernization',
      serviceType: 'Renovation',
      frequency: 'One-time',
      estimatedDuration: '200 hours',
      rejectionReason: 'Budget exceeds approved limits for this quarter',
      notes: 'High-end finishes and custom furniture'
    },
    // Warehouse service orders (Customer can monitor)
    {
      orderId: 'CTR001-ORD-SRV020',
      orderType: 'service',
      title: 'Inventory Management Service',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-19',
      expectedDate: '2025-09-22',
      status: 'in-progress',  // Customer sees as in-progress after approving
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-19 08:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-19 10:00' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-19 13:00' },
        { role: 'Warehouse', status: 'pending' }  // Warehouse needs to act
      ],
      description: 'Complete inventory audit and organization service',
      serviceType: 'Inventory',
      frequency: 'Quarterly',
      estimatedDuration: '8 hours',
      notes: 'Full warehouse inventory count and reorganization'
    },
    {
      orderId: 'CTR001-ORD-SRV023',
      orderType: 'service',
      title: 'Warehouse Safety Inspection',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-12',
      expectedDate: '2025-09-15',
      serviceStartDate: '2025-09-15',
      status: 'service-created',  // Service completed by warehouse
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-12 10:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-12 12:00' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-12 15:00' },
        { role: 'Warehouse', status: 'service-created', user: 'WHS-001', timestamp: '2025-09-15 16:00' }
      ],
      description: 'Comprehensive safety audit and compliance check',
      serviceType: 'Inspection',
      frequency: 'Annual',
      estimatedDuration: '3 hours',
      notes: 'Annual safety compliance inspection completed',
      serviceCompleted: true,
      completedDate: '2025-09-15'
    }
  ];

  // Customer sees orders from their centers that need approval or monitoring
  const productOrders: any[] = [
    // State 1: Pending customer approval (ACTION REQUIRED)
    {
      orderId: 'CTR001-ORD-PRD001',
      orderType: 'product',
      title: 'Office Supplies - Monthly Restock',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-19',
      expectedDate: '2025-09-25',
      status: 'pending',  // Customer sees as pending (needs their approval)
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-19 10:00' },
        { role: 'Customer', status: 'pending' },  // Their action needed
        { role: 'Contractor', status: 'waiting' },
        { role: 'Warehouse', status: 'waiting' }
      ],
      items: [
        { name: 'Paper Towels', quantity: 100, unit: 'rolls' },
        { name: 'Hand Soap', quantity: 50, unit: 'bottles' },
        { name: 'Trash Bags', quantity: 200, unit: 'bags' }
      ],
      notes: 'Monthly restocking for all bathrooms and break rooms'
    },
    // State 2: Customer approved, monitoring contractor approval
    {
      orderId: 'CTR001-ORD-PRD002',
      orderType: 'product',
      title: 'Cleaning Equipment Replacement',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-17',
      expectedDate: '2025-09-24',
      status: 'in-progress',  // Customer sees as in-progress after approving
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-17 14:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-17 16:30' },
        { role: 'Contractor', status: 'pending' },
        { role: 'Warehouse', status: 'waiting' }
      ],
      items: [
        { name: 'Industrial Vacuum', quantity: 2, unit: 'units' },
        { name: 'Floor Buffer', quantity: 1, unit: 'unit' },
        { name: 'Mop Buckets', quantity: 5, unit: 'units' }
      ],
      notes: 'Replacing damaged equipment'
    },
    // Continuing with other states for Customer visibility
    {
      orderId: 'CTR001-ORD-PRD003',
      orderType: 'product',
      title: 'Emergency Supplies Request',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-16',
      expectedDate: '2025-09-20',
      status: 'in-progress',
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-16 08:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-16 09:15' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-16 11:00' },
        { role: 'Warehouse', status: 'pending' }
      ],
      items: [
        { name: 'Spill Kit', quantity: 3, unit: 'kits' },
        { name: 'Safety Cones', quantity: 10, unit: 'units' },
        { name: 'Wet Floor Signs', quantity: 6, unit: 'signs' }
      ],
      notes: 'Urgent safety equipment needed'
    },
    {
      orderId: 'CTR001-ORD-PRD004',
      orderType: 'product',
      title: 'Seasonal Decoration Supplies',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-14',
      expectedDate: '2025-09-18',
      status: 'in-progress',
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-14 10:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-14 14:00' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-15 09:00' },
        { role: 'Warehouse', status: 'accepted' }
      ],
      items: [
        { name: 'Holiday Decorations', quantity: 1, unit: 'set' },
        { name: 'String Lights', quantity: 20, unit: 'strands' }
      ],
      notes: 'For upcoming holiday season'
    },
    {
      orderId: 'CTR001-ORD-PRD005',
      orderType: 'product',
      title: 'HVAC Filters Bulk Order',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-10',
      expectedDate: '2025-09-15',
      deliveryDate: '2025-09-15',
      status: 'delivered',
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-10 09:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-10 11:00' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-11 10:00' },
        { role: 'Warehouse', status: 'delivered', user: 'WHS-001', timestamp: '2025-09-15 14:00' }
      ],
      items: [
        { name: 'HVAC Filters 20x25x1', quantity: 50, unit: 'filters' },
        { name: 'HVAC Filters 16x20x1', quantity: 30, unit: 'filters' }
      ],
      notes: 'Quarterly filter replacement stock'
    },
    {
      orderId: 'CTR001-ORD-PRD006',
      orderType: 'product',
      title: 'Premium Coffee Machine Request',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-08',
      expectedDate: '2025-09-12',
      status: 'rejected',
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-08 11:00' },
        { role: 'Customer', status: 'rejected', user: 'CUS-001', timestamp: '2025-09-08 15:00' }
      ],
      rejectionReason: 'Budget constraints - not approved for luxury items',
      items: [
        { name: 'Espresso Machine', quantity: 1, unit: 'unit' },
        { name: 'Coffee Grinder', quantity: 1, unit: 'unit' }
      ],
      notes: 'For employee break room upgrade'
    }
  ];

    const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/customer/dashboard' },
    { id: 'profile', label: 'My Profile', path: '/customer/profile' },
    { id: 'ecosystem', label: 'My Ecosystem', path: '/customer/ecosystem' },
    { id: 'services', label: 'My Services', path: '/customer/services' },
    { id: 'orders', label: 'Orders', path: '/customer/orders' },
    { id: 'reports', label: 'Reports', path: '/customer/reports' },
    { id: 'support', label: 'Support', path: '/customer/support' }
  ];

  // Customer-specific overview cards (5 cards)
  const overviewCards = [
    { id: 'services', title: 'Active Services', dataKey: 'serviceCount', color: 'blue' },
    { id: 'centers', title: 'Active Centers', dataKey: 'centerCount', color: 'yellow' },
    { id: 'crew', title: 'Active Crew', dataKey: 'crewCount', color: 'orange' },
    { id: 'requests', title: 'Pending Requests', dataKey: 'pendingRequests', color: 'red' },
    { id: 'status', title: 'Account Status', dataKey: 'accountStatus', color: 'green' }
  ];

  // Mock data - replace with actual API data
  const overviewData = {
    serviceCount: 12,
    centerCount: 5,
    crewCount: 8,
    pendingRequests: 3,
    accountStatus: 'Active'
  };

  // Mock services data for customer
  const myServicesData = [
    { serviceId: 'CTR001-SRV011', serviceName: 'Office Cleaning', type: 'Recurring', status: 'Active', startDate: '2024-01-15' },
    { serviceId: 'CTR002-SRV012', serviceName: 'IT Support & Maintenance', type: 'One-time', status: 'Active', startDate: '2024-03-10' },
    { serviceId: 'CTR001-SRV013', serviceName: 'Security Services', type: 'Recurring', status: 'Active', startDate: '2024-02-20' },
    { serviceId: 'CTR003-SRV014', serviceName: 'Landscaping Services', type: 'One-time', status: 'Scheduled', startDate: '2024-04-01' },
  ];

  const activeServicesData = [
    { orderId: 'ORD-201', serviceName: 'Office Cleaning', provider: 'Premium Contractors LLC', nextService: '2025-09-19', frequency: 'Daily', cost: '$2,500/month' },
    { orderId: 'ORD-202', serviceName: 'IT Support & Maintenance', provider: 'Tech Solutions Inc', nextService: '2025-09-25', frequency: 'Weekly', cost: '$1,800/month' },
    { orderId: 'ORD-203', serviceName: 'Security Services', provider: 'Elite Security Corp', nextService: '2025-09-18', frequency: '24/7', cost: '$4,200/month' },
  ];

  const serviceHistoryData = [
    { serviceId: 'CTR001-SRV015', serviceName: 'Office Cleaning', centerId: 'CTR001', type: 'Recurring', status: 'Completed', startDate: '2025-06-30', endDate: '2025-08-30' },
    { serviceId: 'CTR002-SRV016', serviceName: 'HVAC Maintenance', centerId: 'CTR002', type: 'One-time', status: 'Completed', startDate: '2025-08-15', endDate: '2025-08-20' },
    { serviceId: 'CTR003-SRV017', serviceName: 'Window Cleaning', centerId: 'CTR003', type: 'Recurring', status: 'Completed', startDate: '2025-08-05', endDate: '2025-08-10' },
    { serviceId: 'CTR001-SRV018', serviceName: 'Carpet Cleaning', centerId: 'CTR001', type: 'One-time', status: 'Cancelled', startDate: '2025-07-20', endDate: '2025-07-25' },
  ];

  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <MyHubSection
        hubName="Customer Hub"
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={setActiveTab}
        userId="CUS-001"
        role="customer"
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
                emptyMessage="No recent customer activity"
              />

              {/* Communication Hub */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <NewsPreview color="#eab308" onViewAll={() => console.log('View all news')} />
                <MemosPreview color="#eab308" onViewAll={() => console.log('View memos')} />
              </div>
            </PageWrapper>
          ) : activeTab === 'profile' ? (
            <PageWrapper headerSrOnly>
              <ProfileInfoCard
              role="customer"
              profileData={{
                name: 'TechCorp Industries',
                customerId: 'CUS-001',
                address: '789 Technology Way, San Francisco, CA 94105',
                phone: '(555) 456-7890',
                email: 'services@techcorp.com',
                website: 'www.techcorp.com',
                mainContact: 'Emily Davis',
                startDate: '2019-06-10'
              }}
              accountManager={{
                name: 'Robert Chen',
                id: 'MGR-003',
                email: 'robert.chen@cks.com',
                phone: '(555) 567-8901'
              }}
              primaryColor="#eab308"
              onUpdatePhoto={() => console.log('Update photo')}
              onContactManager={() => console.log('Contact manager')}
              onScheduleMeeting={() => console.log('Schedule meeting')}
            />
            </PageWrapper>
          ) : activeTab === 'ecosystem' ? (
            <PageWrapper headerSrOnly>
              <EcosystemTree
              rootUser={{ id: 'CUS-001', role: 'Customer', name: 'Acme Corporation' }}
              treeData={ecosystemData}
              onNodeClick={(userId) => console.log('View details for:', userId)}
              expandedNodes={['CUS-001']}
              currentUserId="CUS-001"
              title="Ecosystem"
              subtitle="Your Business Network Overview"
              description="Click any row with an arrow to expand and explore your network connections"
              roleColorMap={{
                customer: '#fef9c3',
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
                description={servicesTab === 'my' ? 'CKS services currently provided at your centers' : 'Services Archive'}
                searchPlaceholder={
                  servicesTab === 'my' ? 'Search by Service ID or name' :
                  'Search service history'
                }
                onSearch={setServicesSearchQuery}
                actionButton={
                  <Button
                    variant="primary"
                    roleColor="#000000"
                    onClick={() => navigate('/catalog')}
                  >
                    Browse CKS Catalog
                  </Button>
                }
                primaryColor="#eab308"
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
                          backgroundColor: value === 'Active' ? '#dcfce7' : value === 'Scheduled' ? '#dbeafe' : '#fef3c7',
                          color: value === 'Active' ? '#16a34a' : value === 'Scheduled' ? '#2563eb' : '#d97706'
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
              userRole="customer"
              serviceOrders={serviceOrders}
              productOrders={productOrders}
              onCreateServiceOrder={() => console.log('Request Service')}
              onCreateProductOrder={() => console.log('Request Products')}
              onOrderAction={(orderId, action) => {
                console.log(`Order ${orderId}: ${action}`);
              }}
              showServiceOrders={true}
              showProductOrders={true}
              primaryColor="#eab308"
            />
            </PageWrapper>
          ) : activeTab === 'reports' ? (
            <PageWrapper headerSrOnly>
              <ReportsSection
                role="customer"
                userId="CUS-001"
                primaryColor="#eab308"
              />
            </PageWrapper>
          ) : activeTab === 'support' ? (
            <PageWrapper headerSrOnly>
              <SupportSection
                role="customer"
                primaryColor="#eab308"
              />
            </PageWrapper>
          ) : (
            <PageWrapper title={activeTab} showHeader={true} headerSrOnly>
              <h2>Customer Hub - {activeTab}</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </PageWrapper>
          )}
        </div>
      </Scrollbar>
    </div>
  );
}

