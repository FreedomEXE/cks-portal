/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: AdminHub.tsx
 *
 * Description:
 * AdminHub.tsx implementation
 *
 * Responsibilities:
 * - Provide AdminHub.tsx functionality
 *
 * Role in system:
 * - Used by CKS Portal system
 *
 * Notes:
 * To be implemented
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
import DataTable from '../../../packages/ui/src/tables/DataTable';
import NavigationTab from '../../../packages/ui/src/navigation/NavigationTab';
import TabContainer from '../../../packages/ui/src/navigation/TabContainer';
import Button from '../../../packages/ui/src/buttons/Button';
import { AdminSupportSection } from '../../../packages/domain-widgets/src/support';
import PageHeader from '../../../packages/ui/src/layout/PageHeader';
import PageWrapper from '../../../packages/ui/src/layout/PageWrapper';
import TabSection from '../../../packages/ui/src/layout/TabSection';

interface AdminHubProps {
  initialTab?: string;
}

export default function AdminHub({ initialTab = 'dashboard' }: AdminHubProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [directoryTab, setDirectoryTab] = useState('contractors');

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

  // Mock activities for admin
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 'act-1',
      message: 'New user registered: USR-2024-156',
      timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      type: 'info',
      metadata: { role: 'admin', userId: 'ADM-001', title: 'User Registration' }
    },
    {
      id: 'act-2',
      message: 'System backup completed successfully',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      type: 'success',
      metadata: { role: 'admin', userId: 'ADM-001', title: 'System Maintenance' }
    },
    {
      id: 'act-3',
      message: 'High priority ticket escalated: TKT-2024-089',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      type: 'warning',
      metadata: { role: 'admin', userId: 'ADM-001', title: 'Support Alert' }
    },
    {
      id: 'act-4',
      message: 'Security update applied to all servers',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      type: 'action',
      metadata: { role: 'admin', userId: 'ADM-001', title: 'Security Update' }
    },
    {
      id: 'act-5',
      message: 'Monthly report generated and sent',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      type: 'info',
      metadata: { role: 'admin', userId: 'ADM-001', title: 'Report Generated' }
    }
  ]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
    { id: 'directory', label: 'Directory', path: '/admin/directory' },
    { id: 'create', label: 'Create', path: '/admin/create' },
    { id: 'assign', label: 'Assign', path: '/admin/assign' },
    { id: 'archive', label: 'Archive', path: '/admin/archive' },
    { id: 'support', label: 'Support', path: '/admin/support' },
  ];

  const handleLogout = () => {
    console.log('Admin logout');
    // Implement logout logic
  };

  // Admin-specific overview cards (4 cards)
  const overviewCards = [
    { id: 'users', title: 'Total Users', dataKey: 'userCount', color: 'black' },
    { id: 'tickets', title: 'Open Support Tickets', dataKey: 'ticketCount', color: 'blue' },
    { id: 'priority', title: 'High Priority', dataKey: 'highPriorityCount', color: 'red' },
    { id: 'uptime', title: 'Days Online', dataKey: 'daysOnline', color: 'green' }
  ];

  // Mock data - replace with actual API data
  const overviewData = {
    userCount: 156,
    ticketCount: 23,
    highPriorityCount: 4,
    daysOnline: 247
  };

  // Directory mock data
  const contractorsData = [
    { id: 'CON-001', companyName: 'Network Cleaning Solutions', cksManager: 'MGR-001', status: 'active' },
    { id: 'CON-002', companyName: 'Clean Pro Services', cksManager: 'MGR-002', status: 'active' },
    { id: 'CON-003', companyName: 'Sparkle Systems Inc', cksManager: 'MGR-001', status: 'inactive' },
  ];

  const managersData = [
    { id: 'MGR-001', managerName: 'John Smith', territory: 'North Region', status: 'active' },
    { id: 'MGR-002', managerName: 'Sarah Johnson', territory: 'South Region', status: 'active' },
  ];

  const customersData = [
    { id: 'CUS-001', customerName: 'Downtown Mall', cksManager: 'MGR-001', status: 'active' },
    { id: 'CUS-002', customerName: 'Tech Park Plaza', cksManager: 'MGR-002', status: 'active' },
    { id: 'CUS-003', customerName: 'City Hospital', cksManager: 'MGR-001', status: 'active' },
    { id: 'CUS-004', customerName: 'Business Center', cksManager: 'MGR-001', status: 'inactive' },
  ];

  const centersData = [
    { id: 'CTR-001', centerName: 'Main Street Center', cksManager: 'MGR-001', status: 'active' },
    { id: 'CTR-002', centerName: 'Tech Hub', cksManager: 'MGR-002', status: 'active' },
  ];

  const crewData = [
    { id: 'CRW-001', crewName: 'Mike Johnson', cksManager: 'MGR-001', status: 'active' },
    { id: 'CRW-002', crewName: 'Lisa Wang', cksManager: 'MGR-001', status: 'active' },
    { id: 'CRW-003', crewName: 'David Brown', cksManager: 'MGR-002', status: 'active' },
  ];

  const warehousesData = [
    { id: 'WH-001', warehouseName: 'Central Warehouse', cksManager: 'MGR-001', status: 'operational' },
    { id: 'WH-002', warehouseName: 'North Storage', cksManager: 'MGR-002', status: 'operational' },
  ];

  const servicesData = [
    { id: 'SRV-001', serviceName: 'Commercial Deep Cleaning', createdBy: 'MGR-001', status: 'available' },
    { id: 'SRV-002', serviceName: 'Floor Care & Maintenance', createdBy: 'MGR-002', status: 'available' },
    { id: 'SRV-003', serviceName: 'Window Cleaning', createdBy: 'MGR-001', status: 'available' },
  ];

  const ordersData = [
    { id: 'ORD-001', orderType: 'Commercial Cleaning', createdBy: 'MGR-001', status: 'completed' },
    { id: 'ORD-002', orderType: 'Maintenance Service', createdBy: 'MGR-002', status: 'in_progress' },
    { id: 'ORD-003', orderType: 'Window Cleaning', createdBy: 'MGR-001', status: 'pending' },
  ];

  const productsData = [
    { id: 'PRD-001', warehouseId: 'WH-001', createdBy: 'MGR-001', status: 'available' },
    { id: 'PRD-002', warehouseId: 'WH-002', createdBy: 'MGR-002', status: 'available' },
    { id: 'PRD-003', warehouseId: 'WH-001', createdBy: 'MGR-001', status: 'available' },
  ];

  const trainingData = [
    { id: 'TRN-001', serviceId: 'SRV-001', createdBy: 'MGR-001', status: 'active' },
    { id: 'TRN-002', serviceId: 'SRV-002', createdBy: 'MGR-002', status: 'active' },
  ];

  const proceduresData = [
    { id: 'PRC-001', serviceId: 'SRV-001', createdBy: 'MGR-001', status: 'active' },
    { id: 'PRC-002', serviceId: 'SRV-003', createdBy: 'MGR-002', status: 'active' },
  ];

  const reportsData = [
    { id: 'RPT-001', type: 'Analytics', createdBy: 'System', status: 'reviewed' },
    { id: 'RPT-002', type: 'Performance', createdBy: 'MGR-001', status: 'pending' },
  ];

  const feedbackData = [
    { id: 'FBK-001', type: 'Customer', createdBy: 'MGR-001', status: 'reviewed' },
    { id: 'FBK-002', type: 'Service', createdBy: 'MGR-002', status: 'pending' },
  ];

  const directoryConfig = {
    contractors: {
      columns: [
        { key: 'id', label: 'CONTRACTOR ID', clickable: true },
        { key: 'companyName', label: 'COMPANY NAME' },
        { key: 'cksManager', label: 'CKS MANAGER' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: value === 'active' ? '#dcfce7' : '#fee2e2',
              color: value === 'active' ? '#16a34a' : '#dc2626'
            }}>
              {value}
            </span>
          )
        },
        {
          key: 'actions',
          label: 'ACTIONS',
          render: (_: any, row: any) => (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="small" onClick={() => console.log('Details', row.id)}>Details</Button>
              <Button variant="danger" size="small" onClick={() => console.log('Delete', row.id)}>Delete</Button>
            </div>
          )
        }
      ],
      data: contractorsData
    },
    managers: {
      columns: [
        { key: 'id', label: 'MANAGER ID', clickable: true },
        { key: 'managerName', label: 'MANAGER NAME' },
        { key: 'territory', label: 'TERRITORY' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: value === 'active' ? '#dcfce7' : '#fee2e2',
              color: value === 'active' ? '#16a34a' : '#dc2626'
            }}>
              {value}
            </span>
          )
        },
        {
          key: 'actions',
          label: 'ACTIONS',
          render: (_: any, row: any) => (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="small" onClick={() => console.log('Details', row.id)}>Details</Button>
              <Button variant="danger" size="small" onClick={() => console.log('Delete', row.id)}>Delete</Button>
            </div>
          )
        }
      ],
      data: managersData
    },
    customers: {
      columns: [
        { key: 'id', label: 'CUSTOMER ID', clickable: true },
        { key: 'customerName', label: 'CUSTOMER NAME' },
        { key: 'cksManager', label: 'CKS MANAGER' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: value === 'active' ? '#dcfce7' : '#fee2e2',
              color: value === 'active' ? '#16a34a' : '#dc2626'
            }}>
              {value}
            </span>
          )
        },
        {
          key: 'actions',
          label: 'ACTIONS',
          render: (_: any, row: any) => (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="small" onClick={() => console.log('Details', row.id)}>Details</Button>
              <Button variant="danger" size="small" onClick={() => console.log('Delete', row.id)}>Delete</Button>
            </div>
          )
        }
      ],
      data: customersData
    },
    centers: {
      columns: [
        { key: 'id', label: 'CENTER ID', clickable: true },
        { key: 'centerName', label: 'CENTER NAME' },
        { key: 'cksManager', label: 'CKS MANAGER' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: value === 'active' ? '#dcfce7' : '#fee2e2',
              color: value === 'active' ? '#16a34a' : '#dc2626'
            }}>
              {value}
            </span>
          )
        },
        {
          key: 'actions',
          label: 'ACTIONS',
          render: (_: any, row: any) => (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="small" onClick={() => console.log('Details', row.id)}>Details</Button>
              <Button variant="danger" size="small" onClick={() => console.log('Delete', row.id)}>Delete</Button>
            </div>
          )
        }
      ],
      data: centersData
    },
    crew: {
      columns: [
        { key: 'id', label: 'CREW ID', clickable: true },
        { key: 'crewName', label: 'CREW NAME' },
        { key: 'cksManager', label: 'CKS MANAGER' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: value === 'active' ? '#dcfce7' : '#fee2e2',
              color: value === 'active' ? '#16a34a' : '#dc2626'
            }}>
              {value}
            </span>
          )
        },
        {
          key: 'actions',
          label: 'ACTIONS',
          render: (_: any, row: any) => (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="small" onClick={() => console.log('Details', row.id)}>Details</Button>
              <Button variant="danger" size="small" onClick={() => console.log('Delete', row.id)}>Delete</Button>
            </div>
          )
        }
      ],
      data: crewData
    },
    warehouses: {
      columns: [
        { key: 'id', label: 'WAREHOUSE ID', clickable: true },
        { key: 'warehouseName', label: 'WAREHOUSE NAME' },
        { key: 'cksManager', label: 'CKS MANAGER' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: value === 'operational' ? '#dcfce7' : '#fee2e2',
              color: value === 'operational' ? '#16a34a' : '#dc2626'
            }}>
              {value}
            </span>
          )
        },
        {
          key: 'actions',
          label: 'ACTIONS',
          render: (_: any, row: any) => (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="small" onClick={() => console.log('Details', row.id)}>Details</Button>
              <Button variant="danger" size="small" onClick={() => console.log('Delete', row.id)}>Delete</Button>
            </div>
          )
        }
      ],
      data: warehousesData
    },
    services: {
      columns: [
        { key: 'id', label: 'SERVICE ID', clickable: true },
        { key: 'serviceName', label: 'SERVICE NAME' },
        { key: 'createdBy', label: 'CREATED BY' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: value === 'available' ? '#dcfce7' : '#fee2e2',
              color: value === 'available' ? '#16a34a' : '#dc2626'
            }}>
              {value}
            </span>
          )
        },
        {
          key: 'actions',
          label: 'ACTIONS',
          render: (_: any, row: any) => (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="small" onClick={() => console.log('Details', row.id)}>Details</Button>
              <Button variant="danger" size="small" onClick={() => console.log('Delete', row.id)}>Delete</Button>
            </div>
          )
        }
      ],
      data: servicesData
    },
    orders: {
      columns: [
        { key: 'id', label: 'ORDER ID', clickable: true },
        { key: 'orderType', label: 'ORDER TYPE' },
        { key: 'createdBy', label: 'CREATED BY' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => {
            const colors = {
              completed: { bg: '#dcfce7', text: '#16a34a' },
              in_progress: { bg: '#fef3c7', text: '#d97706' },
              pending: { bg: '#e0e7ff', text: '#4338ca' }
            };
            const color = colors[value as keyof typeof colors] || colors.pending;
            return (
              <span style={{
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: color.bg,
                color: color.text
              }}>
                {value.replace('_', ' ')}
              </span>
            );
          }
        },
        {
          key: 'actions',
          label: 'ACTIONS',
          render: (_: any, row: any) => (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="small" onClick={() => console.log('Details', row.id)}>Details</Button>
              <Button variant="danger" size="small" onClick={() => console.log('Delete', row.id)}>Delete</Button>
            </div>
          )
        }
      ],
      data: ordersData
    },
    products: {
      columns: [
        { key: 'id', label: 'PRODUCT ID', clickable: true },
        { key: 'warehouseId', label: 'WAREHOUSE ID' },
        { key: 'createdBy', label: 'CREATED BY' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: value === 'available' ? '#dcfce7' : '#fee2e2',
              color: value === 'available' ? '#16a34a' : '#dc2626'
            }}>
              {value}
            </span>
          )
        },
        {
          key: 'actions',
          label: 'ACTIONS',
          render: (_: any, row: any) => (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="small" onClick={() => console.log('Details', row.id)}>Details</Button>
              <Button variant="danger" size="small" onClick={() => console.log('Delete', row.id)}>Delete</Button>
            </div>
          )
        }
      ],
      data: productsData
    },
    training: {
      columns: [
        { key: 'id', label: 'TRAINING ID', clickable: true },
        { key: 'serviceId', label: 'SERVICE ID' },
        { key: 'createdBy', label: 'CREATED BY' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: value === 'active' ? '#dcfce7' : '#fee2e2',
              color: value === 'active' ? '#16a34a' : '#dc2626'
            }}>
              {value}
            </span>
          )
        },
        {
          key: 'actions',
          label: 'ACTIONS',
          render: (_: any, row: any) => (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="small" onClick={() => console.log('Details', row.id)}>Details</Button>
              <Button variant="danger" size="small" onClick={() => console.log('Delete', row.id)}>Delete</Button>
            </div>
          )
        }
      ],
      data: trainingData
    },
    procedures: {
      columns: [
        { key: 'id', label: 'PROCEDURE ID', clickable: true },
        { key: 'serviceId', label: 'SERVICE ID' },
        { key: 'createdBy', label: 'CREATED BY' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: value === 'active' ? '#dcfce7' : '#fee2e2',
              color: value === 'active' ? '#16a34a' : '#dc2626'
            }}>
              {value}
            </span>
          )
        },
        {
          key: 'actions',
          label: 'ACTIONS',
          render: (_: any, row: any) => (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="small" onClick={() => console.log('Details', row.id)}>Details</Button>
              <Button variant="danger" size="small" onClick={() => console.log('Delete', row.id)}>Delete</Button>
            </div>
          )
        }
      ],
      data: proceduresData
    },
    reports: {
      columns: [
        { key: 'id', label: 'REPORT ID', clickable: true },
        { key: 'type', label: 'TYPE' },
        { key: 'createdBy', label: 'CREATED BY' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: value === 'reviewed' ? '#dcfce7' : '#fef3c7',
              color: value === 'reviewed' ? '#16a34a' : '#d97706'
            }}>
              {value}
            </span>
          )
        },
        {
          key: 'actions',
          label: 'ACTIONS',
          render: (_: any, row: any) => (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="small" onClick={() => console.log('Details', row.id)}>Details</Button>
              <Button variant="danger" size="small" onClick={() => console.log('Delete', row.id)}>Delete</Button>
            </div>
          )
        }
      ],
      data: reportsData
    },
    feedback: {
      columns: [
        { key: 'id', label: 'FEEDBACK ID', clickable: true },
        { key: 'type', label: 'TYPE' },
        { key: 'createdBy', label: 'CREATED BY' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: value === 'reviewed' ? '#dcfce7' : '#fef3c7',
              color: value === 'reviewed' ? '#16a34a' : '#d97706'
            }}>
              {value}
            </span>
          )
        },
        {
          key: 'actions',
          label: 'ACTIONS',
          render: (_: any, row: any) => (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="small" onClick={() => console.log('Details', row.id)}>Details</Button>
              <Button variant="danger" size="small" onClick={() => console.log('Delete', row.id)}>Delete</Button>
            </div>
          )
        }
      ],
      data: feedbackData
    }
  };

  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <MyHubSection
        hubName="Administrator Hub"
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={setActiveTab}
        onLogout={handleLogout}
        userId="ADM-001"
        role="admin"
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
                emptyMessage="No recent system activity"
              />

              {/* Communication Hub */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <NewsPreview color="#111827" onViewAll={() => console.log('View all news')} />
                <MemosPreview color="#111827" onViewAll={() => console.log('View memos')} />
              </div>
            </PageWrapper>
          ) : activeTab === 'directory' ? (
            <PageWrapper title="Directory" showHeader={true} headerSrOnly>
              <TabContainer variant="pills" spacing="compact">
                <NavigationTab
                  label="Contractors"
                  isActive={directoryTab === 'contractors'}
                  onClick={() => setDirectoryTab('contractors')}
                  activeColor="#10b981"
                />
                <NavigationTab
                  label="Managers"
                  isActive={directoryTab === 'managers'}
                  onClick={() => setDirectoryTab('managers')}
                  activeColor="#3b82f6"
                />
                <NavigationTab
                  label="Customers"
                  isActive={directoryTab === 'customers'}
                  onClick={() => setDirectoryTab('customers')}
                  activeColor="#8b5cf6"
                />
                <NavigationTab
                  label="Centers"
                  isActive={directoryTab === 'centers'}
                  onClick={() => setDirectoryTab('centers')}
                  activeColor="#f59e0b"
                />
                <NavigationTab
                  label="Crew"
                  isActive={directoryTab === 'crew'}
                  onClick={() => setDirectoryTab('crew')}
                  activeColor="#ef4444"
                />
                <NavigationTab
                  label="Warehouses"
                  isActive={directoryTab === 'warehouses'}
                  onClick={() => setDirectoryTab('warehouses')}
                  activeColor="#eab308"
                />
                <NavigationTab
                  label="Services"
                  isActive={directoryTab === 'services'}
                  onClick={() => setDirectoryTab('services')}
                  activeColor="#06b6d4"
                />
                <NavigationTab
                  label="Orders"
                  isActive={directoryTab === 'orders'}
                  onClick={() => setDirectoryTab('orders')}
                  activeColor="#6366f1"
                />
                <NavigationTab
                  label="Products"
                  isActive={directoryTab === 'products'}
                  onClick={() => setDirectoryTab('products')}
                  activeColor="#ec4899"
                />
                <NavigationTab
                  label="Training & Procedures"
                  isActive={directoryTab === 'training'}
                  onClick={() => setDirectoryTab('training')}
                  activeColor="#14b8a6"
                />
                <NavigationTab
                  label="Reports & Feedback"
                  isActive={directoryTab === 'reports'}
                  onClick={() => setDirectoryTab('reports')}
                  activeColor="#64748b"
                />
              </TabContainer>

              <div style={{ marginTop: 24 }}>
                {directoryTab === 'training' ? (
                  // Split side-by-side tables for Training & Procedures
                  <div style={{ display: 'flex', gap: '4%' }}>
                    <div style={{ width: '48%' }}>
                      <DataTable
                        columns={directoryConfig.training.columns}
                        data={directoryConfig.training.data}
                        searchPlaceholder="Search training..."
                        maxItems={25}
                        showSearch={true}
                        onRowClick={(row) => console.log('Clicked row:', row)}
                        title="Training"
                      />
                    </div>
                    <div style={{ width: '48%' }}>
                      <DataTable
                        columns={directoryConfig.procedures.columns}
                        data={directoryConfig.procedures.data}
                        searchPlaceholder="Search procedures..."
                        maxItems={25}
                        showSearch={true}
                        onRowClick={(row) => console.log('Clicked row:', row)}
                        title="Procedures"
                      />
                    </div>
                  </div>
                ) : directoryTab === 'reports' ? (
                  // Split side-by-side tables for Reports & Feedback
                  <div style={{ display: 'flex', gap: '4%' }}>
                    <div style={{ width: '48%' }}>
                      <DataTable
                        columns={directoryConfig.reports.columns}
                        data={directoryConfig.reports.data}
                        searchPlaceholder="Search reports..."
                        maxItems={25}
                        showSearch={true}
                        onRowClick={(row) => console.log('Clicked row:', row)}
                        title="Reports"
                      />
                    </div>
                    <div style={{ width: '48%' }}>
                      <DataTable
                        columns={directoryConfig.feedback.columns}
                        data={directoryConfig.feedback.data}
                        searchPlaceholder="Search feedback..."
                        maxItems={25}
                        showSearch={true}
                        onRowClick={(row) => console.log('Clicked row:', row)}
                        title="Feedback"
                      />
                    </div>
                  </div>
                ) : (
                  // Regular single table for other tabs
                  <DataTable
                    columns={directoryConfig[directoryTab as keyof typeof directoryConfig].columns}
                    data={directoryConfig[directoryTab as keyof typeof directoryConfig].data}
                    searchPlaceholder={`Search ${directoryTab}...`}
                    maxItems={25}
                    showSearch={true}
                    onRowClick={(row) => console.log('Clicked row:', row)}
                  />
                )}
              </div>
            </PageWrapper>
          ) : activeTab === 'support' ? (
            <PageWrapper headerSrOnly>
              <AdminSupportSection
                primaryColor="#6366f1"
              />
            </PageWrapper>
          ) : (
            <PageWrapper title={activeTab} showHeader={true} headerSrOnly>
              <h2>Admin {activeTab} content</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </PageWrapper>
          )}
        </div>
      </Scrollbar>
    </div>
  );
}
