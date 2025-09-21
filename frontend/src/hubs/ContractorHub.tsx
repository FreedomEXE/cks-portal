/*â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  Property of CKS  Â© 2025
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€*/
/**
 * File: ContractorHub.tsx
 *
 * Description:
 * Contractor Hub orchestrator component
 *
 * Responsibilities:
 * - Orchestrate contractor role hub interface
 * - Manage tab navigation and content rendering
 *
 * Role in system:
 * - Primary interface for contractor users
 *
 * Notes:
 * Uses MyHubSection for navigation
 */
/*â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  Manifested by Freedom_EXE
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€*/

import React, { useState, useEffect } from 'react';
import { Scrollbar } from '../../../packages/ui/src/Scrollbar';
import MyHubSection from '../components/MyHubSection';
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
import { SupportSection } from '../../../packages/domain-widgets/src/support';
import { ReportsSection } from '../../../packages/domain-widgets/src/reports';
import PageWrapper from '../../../packages/ui/src/layout/PageWrapper';
import PageHeader from '../../../packages/ui/src/layout/PageHeader';
import TabSection from '../../../packages/ui/src/layout/TabSection';

interface ContractorHubProps {
  initialTab?: string;
}

export default function ContractorHub({ initialTab = 'dashboard' }: ContractorHubProps) {
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

  // Mock ecosystem data for contractor
  const ecosystemData: TreeNode = {
    user: { id: 'CON-001', role: 'Contractor', name: 'Premium Contractor LLC' },
    children: [
      {
        user: { id: 'CUS-001', role: 'Customer', name: 'Acme Corporation' },
        count: 3,
        type: 'center',
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
      },
      {
        user: { id: 'CUS-002', role: 'Customer', name: 'Global Tech Solutions' },
        count: 2,
        type: 'center',
        children: [
          {
            user: { id: 'CTR-003', role: 'Center', name: 'Global Tech HQ' },
            count: 2,
            type: 'crew',
            children: [
              { user: { id: 'CRW-006', role: 'Crew', name: 'Alice Green (Lead)' } },
              { user: { id: 'CRW-007', role: 'Crew', name: 'Tom Clark' } }
            ]
          },
          {
            user: { id: 'CTR-004', role: 'Center', name: 'Global Tech Branch' },
            count: 2,
            type: 'crew',
            children: [
              { user: { id: 'CRW-008', role: 'Crew', name: 'Lisa White (Lead)' } },
              { user: { id: 'CRW-009', role: 'Crew', name: 'David Lee' } }
            ]
          }
        ]
      },
      {
        user: { id: 'CUS-003', role: 'Customer', name: 'Local Business Center' },
        count: 1,
        type: 'center',
        children: [
          {
            user: { id: 'CTR-005', role: 'Center', name: 'Local Business Main' },
            count: 2,
            type: 'crew',
            children: [
              { user: { id: 'CRW-010', role: 'Crew', name: 'Chris Taylor (Lead)' } },
              { user: { id: 'CRW-011', role: 'Crew', name: 'Emma Davis' } }
            ]
          }
        ]
      }
    ]
  };

  // Mock activities for contractor
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 'act-1',
      message: 'New service request assigned: SR-2024-002',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      type: 'action',
      metadata: { role: 'contractor', userId: 'CON-001', title: 'New Assignment' }
    },
    {
      id: 'act-2',
      message: 'Completed service for Customer CUS-003',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      type: 'success',
      metadata: { role: 'contractor', userId: 'CON-001', title: 'Job Completed' }
    },
    {
      id: 'act-3',
      message: 'Crew member CRW-005 joined your team',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      type: 'info',
      metadata: { role: 'crew', userId: 'CRW-005', title: 'Team Update' }
    },
    {
      id: 'act-4',
      message: 'Invoice INV-2024-089 approved',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      type: 'success',
      metadata: { role: 'contractor', userId: 'CON-001', title: 'Payment Update' }
    },
    {
      id: 'act-5',
      message: 'Equipment maintenance scheduled for next week',
      timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000), // 3 days ago
      type: 'warning',
      metadata: { role: 'contractor', userId: 'CON-001', title: 'Maintenance Alert' }
    }
  ]);

  // Mock orders data for Contractor - Service requests that need contractor approval
  const serviceOrders: any[] = [
    // State 1: Customer approved, pending contractor (ACTION REQUIRED)
    {
      orderId: 'CTR001-ORD-SRV002',
      orderType: 'service',
      title: 'Office Deep Cleaning Service',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-18',
      expectedDate: '2025-09-25',
      status: 'pending',  // Contractor sees as pending (needs their approval)
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-18 10:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-18 14:00' },
        { role: 'Contractor', status: 'pending' },  // Their action needed - only this should pulse
        { role: 'Manager', status: 'waiting' }
      ],
      description: 'Comprehensive deep cleaning of all office areas',
      serviceType: 'Cleaning',
      frequency: 'One-time',
      estimatedDuration: '8 hours',
      notes: 'Include carpet cleaning and window washing'
    },
    // State 2: Contractor approved, monitoring manager
    {
      orderId: 'CTR001-ORD-SRV003',
      orderType: 'service',
      title: 'Security System Installation',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-17',
      expectedDate: '2025-09-30',
      status: 'in-progress',  // Contractor sees as in-progress after approving
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
    // State 3: Service created and active
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
    // State 4: Rejected by Contractor
    {
      orderId: 'CTR001-ORD-SRV006',
      orderType: 'service',
      title: 'Hazardous Material Cleanup',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-10',
      expectedDate: '2025-09-15',
      status: 'rejected',
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-10 09:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-10 12:00' },
        { role: 'Contractor', status: 'rejected', user: 'CON-001', timestamp: '2025-09-10 16:00' }
      ],
      description: 'Specialized hazardous material disposal service',
      serviceType: 'Cleanup',
      frequency: 'One-time',
      estimatedDuration: '16 hours',
      rejectionReason: 'Requires specialized certification not currently held',
      notes: 'Chemical spill cleanup and disposal'
    },
    // Warehouse service orders (Contractor can monitor)
    {
      orderId: 'CTR001-ORD-SRV020',
      orderType: 'service',
      title: 'Inventory Management Service',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-19',
      expectedDate: '2025-09-22',
      status: 'in-progress',  // Contractor sees as in-progress after approving
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

  // Contractor sees orders that need their approval after customer has approved
  const productOrders: any[] = [
    // State 1: Customer approved, pending contractor (ACTION REQUIRED)
    {
      orderId: 'CTR001-ORD-PRD002',
      orderType: 'product',
      title: 'Cleaning Equipment Replacement',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-17',
      expectedDate: '2025-09-24',
      status: 'pending',  // Contractor sees as pending (needs their approval)
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-17 14:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-17 16:30' },
        { role: 'Contractor', status: 'pending' },  // Their action needed - only this should pulse
        { role: 'Warehouse', status: 'waiting' }
      ],
      items: [
        { name: 'Industrial Vacuum', quantity: 2, unit: 'units' },
        { name: 'Floor Buffer', quantity: 1, unit: 'unit' },
        { name: 'Mop Buckets', quantity: 5, unit: 'units' }
      ],
      notes: 'Replacing damaged equipment'
    },
    // State 2: Contractor approved, monitoring warehouse
    {
      orderId: 'CTR001-ORD-PRD003',
      orderType: 'product',
      title: 'Emergency Supplies Request',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-16',
      expectedDate: '2025-09-20',
      status: 'in-progress',  // Contractor sees as in-progress after approving
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
    }
  ];

  // All orders removed - starting fresh with proper flows

    const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/contractor/dashboard' },
    { id: 'profile', label: 'My Profile', path: '/contractor/profile' },
    { id: 'ecosystem', label: 'My Ecosystem', path: '/contractor/ecosystem' },
    { id: 'services', label: 'My Services', path: '/contractor/services' },
    { id: 'orders', label: 'Orders', path: '/contractor/orders' },
    { id: 'reports', label: 'Reports', path: '/contractor/reports' },
    { id: 'support', label: 'Support', path: '/contractor/support' }
  ];

  // Contractor-specific overview cards (6 cards)
  const overviewCards = [
    { id: 'services', title: 'Active Services', dataKey: 'serviceCount', color: 'blue' },
    { id: 'customers', title: 'Active Customers', dataKey: 'customerCount', color: 'green' },
    { id: 'centers', title: 'Active Centers', dataKey: 'centerCount', color: 'purple' },
    { id: 'crew', title: 'Active Crew', dataKey: 'crewCount', color: 'orange' },
    { id: 'orders', title: 'Pending Orders', dataKey: 'pendingOrders', color: 'red' },
    { id: 'status', title: 'Account Status', dataKey: 'accountStatus', color: 'green' }
  ];

  // Mock data - replace with actual API data
  const overviewData = {
    serviceCount: 8,
    customerCount: 15,
    centerCount: 6,
    crewCount: 12,
    pendingOrders: 5,
    accountStatus: 'Active'
  };

  // Mock services data for contractor
  const myServicesData = [
    { serviceId: 'SRV-001', serviceName: 'Industrial Cleaning', type: 'Recurring', status: 'Active', startDate: '2023-01-15' },
    { serviceId: 'SRV-004', serviceName: 'HVAC Maintenance', type: 'One-time', status: 'Active', startDate: '2023-06-20' },
    { serviceId: 'SRV-007', serviceName: 'Equipment Installation', type: 'Recurring', status: 'Suspended', startDate: '2022-11-10' },
    { serviceId: 'SRV-009', serviceName: 'Safety Inspections', type: 'One-time', status: 'Active', startDate: '2024-03-05' },
  ];

  const activeServicesData = [
    { serviceId: 'CTR001-SRV001', serviceName: 'Industrial Cleaning', centerId: 'CTR001', type: 'Recurring', startDate: '2025-09-15' },
    { serviceId: 'CTR002-SRV004', serviceName: 'HVAC Maintenance', centerId: 'CTR002', type: 'One-time', startDate: '2025-09-20' },
    { serviceId: 'CTR003-SRV007', serviceName: 'Equipment Installation', centerId: 'CTR003', type: 'Recurring', startDate: '2025-09-22' },
  ];

  const serviceHistoryData = [
    { serviceId: 'CTR004-SRV001', serviceName: 'Industrial Cleaning', centerId: 'CTR004', type: 'Recurring', status: 'Completed', startDate: '2025-06-28', endDate: '2025-08-28' },
    { serviceId: 'CTR005-SRV009', serviceName: 'Safety Inspections', centerId: 'CTR005', type: 'One-time', status: 'Completed', startDate: '2025-08-10', endDate: '2025-08-15' },
    { serviceId: 'CTR002-SRV004', serviceName: 'HVAC Maintenance', centerId: 'CTR002', type: 'Recurring', status: 'Completed', startDate: '2025-06-02', endDate: '2025-08-02' },
    { serviceId: 'CTR001-SRV007', serviceName: 'Equipment Installation', centerId: 'CTR001', type: 'One-time', status: 'Cancelled', startDate: '2025-07-15', endDate: '2025-07-20' },
  ];

  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <MyHubSection
        hubName="Contractor Hub"
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={setActiveTab}
        userId="CON-001"
        role="contractor"
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
                emptyMessage="No recent contractor activity"
              />

              {/* Communication Hub */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <NewsPreview color="#10b981" onViewAll={() => console.log('View all news')} />
                <MemosPreview color="#10b981" onViewAll={() => console.log('View memos')} />
              </div>
            </PageWrapper>
          ) : activeTab === 'profile' ? (
            <PageWrapper headerSrOnly>
              <ProfileInfoCard
              role="contractor"
              profileData={{
                name: 'ABC Contracting Services',
                contractorId: 'CON-001',
                address: '456 Industrial Blvd, Denver, CO 80202',
                phone: '(555) 234-5678',
                email: 'contact@abccontracting.com',
                website: 'www.abccontracting.com',
                mainContact: 'Michael Johnson',
                startDate: '2020-03-20'
              }}
              accountManager={{
                name: 'Sarah Williams',
                id: 'MGR-002',
                email: 'sarah.williams@cks.com',
                phone: '(555) 345-6789'
              }}
              primaryColor="#10b981"
              onUpdatePhoto={() => console.log('Update photo')}
              onContactManager={() => console.log('Contact manager')}
              onScheduleMeeting={() => console.log('Schedule meeting')}
            />
            </PageWrapper>
          ) : activeTab === 'ecosystem' ? (
            <PageWrapper headerSrOnly>
              <EcosystemTree
              rootUser={{ id: 'CON-001', role: 'Contractor', name: 'Premium Contractor LLC' }}
              treeData={ecosystemData}
              onNodeClick={(userId) => console.log('View details for:', userId)}
              expandedNodes={['CON-001']}
              currentUserId="CON-001"
              title="Ecosystem"
              subtitle="Your Business Network Overview"
              description="Click any row with an arrow to expand and explore your network connections"
              roleColorMap={{
                contractor: '#dcfce7',
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
                  { id: 'active', label: 'Active Services', count: 3 },
                  { id: 'history', label: 'Service History', count: 4 }
                ]}
                activeTab={servicesTab}
                onTabChange={setServicesTab}
                description={
                  servicesTab === 'my' ? 'Services you currently offer through CKS' :
                  servicesTab === 'active' ? 'Active service agreements' :
                  'Services archive'
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
                primaryColor="#10b981"
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
                          backgroundColor: value === 'Active' ? '#dcfce7' : value === 'Suspended' ? '#fef3c7' : '#fee2e2',
                          color: value === 'Active' ? '#16a34a' : value === 'Suspended' ? '#d97706' : '#dc2626'
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
                  onRowClick={(row) => console.log('View order:', row)}
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
              userRole="contractor"
              serviceOrders={serviceOrders}
              productOrders={productOrders}
              onCreateServiceOrder={() => console.log('Request Service')}
              onCreateProductOrder={() => console.log('Request Products')}
              onOrderAction={(orderId, action) => {
                console.log(`Order ${orderId}: ${action}`);
              }}
              showServiceOrders={true}
              showProductOrders={true}
              primaryColor="#10b981"
            />
            </PageWrapper>
          ) : activeTab === 'reports' ? (
            <PageWrapper headerSrOnly>
              <ReportsSection
                role="contractor"
                userId="CTR-001"
                primaryColor="#10b981"
              />
            </PageWrapper>
          ) : activeTab === 'support' ? (
            <PageWrapper headerSrOnly>
              <SupportSection
                role="contractor"
                primaryColor="#10b981"
              />
            </PageWrapper>
          ) : (
            <PageWrapper title={activeTab} showHeader={true} headerSrOnly>
              <h2>Contractor Hub - {activeTab}</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </PageWrapper>
          )}
        </div>
      </Scrollbar>
    </div>
  );
}

