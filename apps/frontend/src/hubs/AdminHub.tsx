/*-----------------------------------------------
  Property of CKS  © 2025
-----------------------------------------------*/
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
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import { useEffect, useState } from 'react';
import { AdminSupportSection, ArchiveSection, AssignSection, CreateSection, MemosPreview, NewsPreview, OverviewSection, RecentActivity, type Activity } from '@cks/domain-widgets';
import { Button, DataTable, NavigationTab, PageHeader, PageWrapper, Scrollbar, TabContainer } from '@cks/ui';
import MyHubSection from '../components/MyHubSection';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';

import { fetchAdminUsers, useAdminUsers, type AdminUser } from '../shared/api/admin';

interface AdminHubProps {
  initialTab?: string;
}

type AdminDirectoryRow = {
  id: string;
  code: string;
  name: string;
  email: string;
  status: string;
};

export default function AdminHub({ initialTab = 'dashboard' }: AdminHubProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [directoryTab, setDirectoryTab] = useState('admins');
  const { getToken } = useClerkAuth();

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

  // Admin-specific overview cards (4 cards)
  const overviewCards = [
    { id: 'users', title: 'Total Users', dataKey: 'userCount', color: 'black' },
    { id: 'tickets', title: 'Open Support Tickets', dataKey: 'ticketCount', color: 'blue' },
    { id: 'priority', title: 'High Priority', dataKey: 'highPriorityCount', color: 'red' },
    { id: 'uptime', title: 'Days Online', dataKey: 'daysOnline', color: 'green' }
  ];

  // Dashboard metrics
  const defaultOverviewData = {
    userCount: 156,
    ticketCount: 23,
    highPriorityCount: 4,
    daysOnline: 247
  };
  const [overviewData, setOverviewData] = useState(defaultOverviewData);

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoadingAdminUsers, setIsLoadingAdminUsers] = useState(true);
  const [adminUsersError, setAdminUsersError] = useState<string | null>(null);

  const defaultManagerRows: AdminDirectoryRow[] = [
    { id: 'adm-placeholder-1', code: 'ADM-001', name: 'John Smith', email: 'john.smith@example.com', status: 'active' },
    { id: 'adm-placeholder-2', code: 'ADM-002', name: 'Sarah Johnson', email: 'sarah.johnson@example.com', status: 'active' },
  ];
  const [managerRows, setManagerRows] = useState<AdminDirectoryRow[]>(defaultManagerRows);

  // Directory mock data

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

  useEffect(() => {
    let cancelled = false;

    async function loadAdminUsers() {
      setIsLoadingAdminUsers(true);
      try {
        const data = await fetchAdminUsers(getToken ? { getToken } : undefined);
        if (cancelled) {
          return;
        }
        setAdminUsers(data);
        const rows = data.map((user) => {
          const code = (user.cksCode || user.id || '').toString().toUpperCase();
          const name = user.username || (user.email ? user.email.split('@')[0] : code) || code;
          return {
            id: user.id,
            code,
            name,
            email: user.email ?? 'N/A',
            status: user.status,
          };
        });

        setManagerRows(rows.length > 0 ? rows : defaultManagerRows);
        setOverviewData((prev) => ({
          ...prev,
          userCount: data.length,
        }));
        setAdminUsersError(null);
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Failed to load admin directory';
          setAdminUsersError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAdminUsers(false);
        }
      }
    }

    loadAdminUsers();

    return () => {
      cancelled = true;
    };
  }, [getToken]);


  // Mock contractor data - replace with real API when contractor endpoint is available
  const contractorRows = [
    { id: 'CTR001', companyName: 'ABC Construction', cksManager: 'MGR001', status: 'active' },
    { id: 'CTR002', companyName: 'XYZ Services', cksManager: 'MGR002', status: 'active' },
    { id: 'CTR003', companyName: 'Premier Maintenance', cksManager: 'MGR001', status: 'active' },
    { id: 'CTR004', companyName: 'Quality Builders', cksManager: 'MGR003', status: 'active' },
    { id: 'CTR005', companyName: 'Elite Solutions', cksManager: 'MGR002', status: 'suspended' }
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
      data: contractorRows
    },
    admins: {
      columns: [
        { key: 'id', label: 'ADMIN ID', clickable: true },
        { key: 'name', label: 'ADMIN NAME' },
        {
          key: 'email',
          label: 'EMAIL',
          render: (value: string) => value && value !== 'N/A' ? (
            <span>{value}</span>
          ) : (
            <span style={{ color: '#94a3b8' }}>No email</span>
          ),
        },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: value === 'active' ? '#dcfce7' : '#fee2e2',
                color: value === 'active' ? '#16a34a' : '#dc2626'
              }}
            >
              {value}
            </span>
          )
        },
        {
          key: 'actions',
          label: 'ACTIONS',
          render: (_: any, row: any) => (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="small" onClick={() => console.log('View admin', row.code)}>Details</Button>
              <Button variant="danger" size="small" onClick={() => console.log('Disable admin', row.code)}>Disable</Button>
            </div>
          )
        }
      ],
      data: adminUsers.map(user => ({
        id: user.cksCode || user.clerkUserId || 'N/A',
        name: user.fullName || user.email?.split('@')[0] || 'N/A',
        email: user.email || 'N/A',
        status: user.status || 'active'
      })),
      emptyMessage: isLoadingAdminUsers ? 'Loading admin users...' : (adminUsersError ?? 'No admin users found'),
      searchFields: ['id', 'name', 'email'],
    },
    managers: {
      columns: [
        { key: 'id', label: 'MANAGER ID', clickable: true },
        { key: 'name', label: 'MANAGER NAME' },
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
      data: [
        { id: 'MGR001', name: 'John Smith', territory: 'Northeast', status: 'active' },
        { id: 'MGR002', name: 'Sarah Johnson', territory: 'Southeast', status: 'active' },
        { id: 'MGR003', name: 'Mike Williams', territory: 'Midwest', status: 'active' },
        { id: 'MGR004', name: 'Emma Davis', territory: 'West Coast', status: 'active' },
        { id: 'MGR005', name: 'Robert Brown', territory: 'Southwest', status: 'active' }
      ]
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
                  label="Admins"
                  isActive={directoryTab === 'admins'}
                  onClick={() => setDirectoryTab('admins')}
                  activeColor="#111827"
                />
                <NavigationTab
                  label="Managers"
                  isActive={directoryTab === 'managers'}
                  onClick={() => setDirectoryTab('managers')}
                  activeColor="#3b82f6"
                />
                <NavigationTab
                  label="Contractors"
                  isActive={directoryTab === 'contractors'}
                  onClick={() => setDirectoryTab('contractors')}
                  activeColor="#10b981"
                />
                <NavigationTab
                  label="Customers"
                  isActive={directoryTab === 'customers'}
                  onClick={() => setDirectoryTab('customers')}
                  activeColor="#eab308"
                />
                <NavigationTab
                  label="Centers"
                  isActive={directoryTab === 'centers'}
                  onClick={() => setDirectoryTab('centers')}
                  activeColor="#f97316"
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
                  activeColor="#8b5cf6"
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
                  activeColor="#92400e"
                />
                <NavigationTab
                  label="Products"
                  isActive={directoryTab === 'products'}
                  onClick={() => setDirectoryTab('products')}
                  activeColor="#374151"
                />
                <NavigationTab
                  label="Training & Procedures"
                  isActive={directoryTab === 'training'}
                  onClick={() => setDirectoryTab('training')}
                  activeColor="#ec4899"
                />
                <NavigationTab
                  label="Reports & Feedback"
                  isActive={directoryTab === 'reports'}
                  onClick={() => setDirectoryTab('reports')}
                  activeColor="#6b7280"
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {directoryTab === 'admins' && (
                      <div
                        style={{
                          fontSize: '13px',
                          color: adminUsersError ? '#dc2626' : '#64748b',
                        }}
                      >
                        {adminUsersError
                          ? `Failed to load admin directory: ${adminUsersError}`
                          : isLoadingAdminUsers
                            ? 'Loading admin directory...'
                            : `Showing ${adminUsers.length} admin ${adminUsers.length === 1 ? 'user' : 'users'}.`}
                      </div>
                    )}
                    <DataTable
                      columns={directoryConfig[directoryTab as keyof typeof directoryConfig].columns}
                      data={directoryConfig[directoryTab as keyof typeof directoryConfig].data}
                      searchPlaceholder={directoryTab === 'admins' ? 'Search admin users...' : `Search ${directoryTab}...`}
                      maxItems={25}
                      showSearch={true}
                      onRowClick={(row) => console.log('Clicked row:', row)}
                    />
                  </div>
                )}
              </div>
            </PageWrapper>
          ) : activeTab === 'create' ? (
            <CreateSection />
          ) : activeTab === 'assign' ? (
            <AssignSection />
          ) : activeTab === 'archive' ? (
            <ArchiveSection />
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







