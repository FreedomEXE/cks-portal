/*-----------------------------------------------
  Property of CKS  © 2025
-----------------------------------------------*/
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
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import { useEffect, useState } from 'react';
import { EcosystemTree, type TreeNode } from '@cks/domain-widgets';
import { MemosPreview, NewsPreview, OrdersSection, OverviewSection, ProfileInfoCard, RecentActivity, ReportsSection, SupportSection, type Activity } from '@cks/domain-widgets';
import { Button, DataTable, PageHeader, PageWrapper, Scrollbar, TabSection } from '@cks/ui';
import MyHubSection from '../components/MyHubSection';

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

  // Mock orders data for Center - showing full approval chain flow
  const serviceOrders: any[] = [
    // State 1: Pending customer approval (ACTION NEEDED from Customer)
    {
      orderId: 'CTR001-ORD-SRV001',
      orderType: 'service',
      title: 'HVAC System Maintenance Contract',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-19',
      expectedDate: '2025-10-01',
      status: 'in-progress',  // Center sees as in-progress
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-19 09:00' },
        { role: 'Customer', status: 'pending' },  // Only this should pulse
        { role: 'Contractor', status: 'waiting' },
        { role: 'Manager', status: 'waiting' }
      ],
      description: 'Quarterly HVAC maintenance and inspection service',
      serviceType: 'Maintenance',
      frequency: 'Quarterly',
      estimatedDuration: '4 hours',
      notes: 'Include filter replacement and system diagnostics'
    },
    // State 2: Customer approved, pending contractor (Contractor needs to act)
    {
      orderId: 'CTR001-ORD-SRV002',
      orderType: 'service',
      title: 'Office Deep Cleaning Service',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-18',
      expectedDate: '2025-09-25',
      status: 'in-progress',
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
    // State 3: Contractor approved, pending manager (Manager needs to act)
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
    // State 4: Manager created service, assigned to crew (SERVICE ACTIVE)
    {
      orderId: 'CTR001-ORD-SRV004',
      orderType: 'service',
      title: 'Landscaping Maintenance Service',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-15',
      expectedDate: '2025-09-20',
      serviceStartDate: '2025-09-20',
      status: 'service-created',  // Service has been created and assigned
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
    // Warehouse service orders (Center can monitor)
    {
      orderId: 'CTR001-ORD-SRV020',
      orderType: 'service',
      title: 'Inventory Management Service',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-19',
      expectedDate: '2025-09-22',
      status: 'in-progress',  // Center sees as in-progress
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

  const productOrders: any[] = [
    // State 1: Pending customer approval
    {
      orderId: 'CTR001-ORD-PRD001',
      orderType: 'product',
      title: 'Office Supplies - Monthly Restock',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-19',
      expectedDate: '2025-09-25',
      status: 'in-progress',  // Center sees as in-progress
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-19 10:00' },
        { role: 'Customer', status: 'pending' },  // Only this should pulse
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
    // State 2: Customer approved, pending contractor
    {
      orderId: 'CTR001-ORD-PRD002',
      orderType: 'product',
      title: 'Cleaning Equipment Replacement',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-17',
      expectedDate: '2025-09-24',
      status: 'in-progress',
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-17 14:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-17 16:30' },
        { role: 'Contractor', status: 'pending' },  // Only this should pulse
        { role: 'Warehouse', status: 'waiting' }
      ],
      items: [
        { name: 'Industrial Vacuum', quantity: 2, unit: 'units' },
        { name: 'Floor Buffer', quantity: 1, unit: 'unit' },
        { name: 'Mop Buckets', quantity: 5, unit: 'units' }
      ],
      notes: 'Replacing damaged equipment'
    },
    // State 3: Contractor approved, pending warehouse
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
        { role: 'Warehouse', status: 'pending' }  // Only this should pulse
      ],
      items: [
        { name: 'Spill Kit', quantity: 3, unit: 'kits' },
        { name: 'Safety Cones', quantity: 10, unit: 'units' },
        { name: 'Wet Floor Signs', quantity: 6, unit: 'signs' }
      ],
      notes: 'Urgent safety equipment needed'
    },
    // State 4: Warehouse accepted, pending delivery
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
        { role: 'Warehouse', status: 'accepted' }  // Should pulse (delivery pending)
      ],
      items: [
        { name: 'Holiday Decorations', quantity: 1, unit: 'set' },
        { name: 'String Lights', quantity: 20, unit: 'strands' }
      ],
      notes: 'For upcoming holiday season'
    },
    // State 5: Delivered (archived)
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
    // State 6: Rejected by Customer
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
    },
    // State 7: Rejected by Contractor
    {
      orderId: 'CTR001-ORD-PRD007',
      orderType: 'product',
      title: 'Non-Standard Cleaning Chemicals',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-05',
      expectedDate: '2025-09-10',
      status: 'rejected',
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-05 13:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-05 15:00' },
        { role: 'Contractor', status: 'rejected', user: 'CON-001', timestamp: '2025-09-06 09:00' }
      ],
      rejectionReason: 'Not on approved vendor list - safety compliance required',
      items: [
        { name: 'Industrial Solvent X', quantity: 10, unit: 'gallons' }
      ],
      notes: 'Special cleaning project request'
    },
    // State 8: Rejected by Warehouse
    {
      orderId: 'CTR001-ORD-PRD008',
      orderType: 'product',
      title: 'Specialty Tools Request',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-03',
      expectedDate: '2025-09-08',
      status: 'rejected',
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-03 10:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-03 14:00' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-04 09:00' },
        { role: 'Warehouse', status: 'rejected', user: 'WHS-001', timestamp: '2025-09-04 15:00' }
      ],
      rejectionReason: 'Items discontinued - suggest alternative products',
      items: [
        { name: 'Specialty Floor Stripper Tool', quantity: 2, unit: 'units' }
      ],
      notes: 'For tile renovation project'
    }
  ];

    const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/center/dashboard' },
    { id: 'profile', label: 'My Profile', path: '/center/profile' },
    { id: 'ecosystem', label: 'My Ecosystem', path: '/center/ecosystem' },
    { id: 'services', label: 'My Services', path: '/center/services' },
    { id: 'orders', label: 'Orders', path: '/center/orders' },
    { id: 'reports', label: 'Reports', path: '/center/reports' },
    { id: 'support', label: 'Support', path: '/center/support' }
  ];

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
          ) : activeTab === 'reports' ? (
            <PageWrapper headerSrOnly>
              <ReportsSection
                role="center"
                userId="CNT-001"
                primaryColor="#f97316"
              />
            </PageWrapper>
          ) : activeTab === 'support' ? (
            <PageWrapper headerSrOnly>
              <SupportSection
                role="center"
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

