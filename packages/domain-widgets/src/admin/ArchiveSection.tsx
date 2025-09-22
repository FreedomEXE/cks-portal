/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: ArchiveSection.tsx
 *
 * Description:
 * Admin archive section with tabs for all data types
 *
 * Responsibilities:
 * - Provide archive management for all data types
 * - Use TabContainer/NavigationTab pattern from directory
 *
 * Role in system:
 * - Used by AdminHub for archive tab
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import React, { useState } from 'react';
import { Button, DataTable, NavigationTab, PageWrapper, TabContainer } from '@cks/ui';

export default function ArchiveSection() {
  const [activeTab, setActiveTab] = useState('managers');

  // Mock archived data - same structure as Directory but with archived dates and status
  const archiveData = {
    managers: [
      { id: 'MGR-001', managerName: 'John Smith', territory: 'North Region', archivedDate: '2025-01-15', status: 'archived' },
      { id: 'MGR-002', managerName: 'Sarah Johnson', territory: 'South Region', archivedDate: '2025-02-01', status: 'archived' },
    ],
    contractors: [
      { id: 'CON-001', companyName: 'ABC Cleaning Co.', cksManager: 'MGR-001', archivedDate: '2025-01-20', status: 'archived' },
      { id: 'CON-002', companyName: 'XYZ Services', cksManager: 'MGR-002', archivedDate: '2025-02-10', status: 'archived' },
    ],
    customers: [
      { id: 'CUS-001', customerName: 'Tech Corp Inc.', cksManager: 'MGR-001', archivedDate: '2025-01-25', status: 'archived' },
      { id: 'CUS-002', customerName: 'Retail Plaza', cksManager: 'MGR-002', archivedDate: '2025-02-05', status: 'archived' },
    ],
    centers: [
      { id: 'CTR-001', centerName: 'Downtown Center', cksManager: 'MGR-001', archivedDate: '2025-01-30', status: 'archived' },
      { id: 'CTR-002', centerName: 'Uptown Center', cksManager: 'MGR-002', archivedDate: '2025-02-15', status: 'archived' },
    ],
    crew: [
      { id: 'CRW-001', crewName: 'Mike Wilson', cksManager: 'MGR-001', archivedDate: '2025-01-18', status: 'archived' },
      { id: 'CRW-002', crewName: 'Lisa Brown', cksManager: 'MGR-002', archivedDate: '2025-02-08', status: 'archived' },
    ],
    warehouses: [
      { id: 'WH-001', warehouseName: 'Central Warehouse', cksManager: 'MGR-001', archivedDate: '2025-01-12', status: 'archived' },
      { id: 'WH-002', warehouseName: 'East Warehouse', cksManager: 'MGR-002', archivedDate: '2025-02-20', status: 'archived' },
    ],
    services: [
      { id: 'SRV-001', serviceName: 'Office Cleaning', createdBy: 'MGR-001', archivedDate: '2025-01-22', status: 'archived' },
      { id: 'SRV-002', serviceName: 'Carpet Cleaning', createdBy: 'MGR-002', archivedDate: '2025-02-12', status: 'archived' },
    ],
    orders: [
      { id: 'ORD-001', orderType: 'Commercial Cleaning', createdBy: 'MGR-001', archivedDate: '2025-01-28', status: 'archived' },
      { id: 'ORD-002', orderType: 'Maintenance Service', createdBy: 'MGR-002', archivedDate: '2025-02-03', status: 'archived' },
    ],
    products: [
      { id: 'PRD-001', warehouseId: 'WH-001', createdBy: 'MGR-001', archivedDate: '2025-01-14', status: 'archived' },
      { id: 'PRD-002', warehouseId: 'WH-002', createdBy: 'MGR-002', archivedDate: '2025-02-18', status: 'archived' },
    ],
    training: [
      { id: 'TRN-001', serviceId: 'SRV-001', createdBy: 'MGR-001', archivedDate: '2025-01-26', status: 'archived' },
      { id: 'TRN-002', serviceId: 'SRV-002', createdBy: 'MGR-002', archivedDate: '2025-02-07', status: 'archived' },
    ],
    procedures: [
      { id: 'PRC-001', serviceId: 'SRV-001', createdBy: 'MGR-001', archivedDate: '2025-01-20', status: 'archived' },
      { id: 'PRC-002', serviceId: 'SRV-002', createdBy: 'MGR-002', archivedDate: '2025-02-12', status: 'archived' },
    ],
    reports: [
      { id: 'RPT-001', type: 'Performance', createdBy: 'MGR-001', archivedDate: '2025-01-17', status: 'archived' },
      { id: 'RPT-002', type: 'Analytics', createdBy: 'MGR-002', archivedDate: '2025-02-14', status: 'archived' },
    ],
    feedback: [
      { id: 'FBK-001', type: 'Customer', createdBy: 'CUS-001', archivedDate: '2025-01-19', status: 'archived' },
      { id: 'FBK-002', type: 'Service', createdBy: 'CRW-001', archivedDate: '2025-02-16', status: 'archived' },
    ]
  };

  const archiveConfig = {
    managers: {
      columns: [
        { key: 'id', label: 'MANAGER ID', clickable: true },
        { key: 'managerName', label: 'MANAGER NAME' },
        { key: 'territory', label: 'TERRITORY' },
        { key: 'archivedDate', label: 'ARCHIVED DATE' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#f3f4f6',
              color: '#6b7280'
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
              <Button variant="primary" size="small" onClick={() => console.log('Restore', row.id)}>Restore</Button>
            </div>
          )
        }
      ],
      data: archiveData.managers
    },
    contractors: {
      columns: [
        { key: 'id', label: 'CONTRACTOR ID', clickable: true },
        { key: 'companyName', label: 'COMPANY NAME' },
        { key: 'cksManager', label: 'CKS MANAGER' },
        { key: 'archivedDate', label: 'ARCHIVED DATE' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#f3f4f6',
              color: '#6b7280'
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
              <Button variant="primary" size="small" onClick={() => console.log('Restore', row.id)}>Restore</Button>
            </div>
          )
        }
      ],
      data: archiveData.contractors
    },
    customers: {
      columns: [
        { key: 'id', label: 'CUSTOMER ID', clickable: true },
        { key: 'customerName', label: 'CUSTOMER NAME' },
        { key: 'cksManager', label: 'CKS MANAGER' },
        { key: 'archivedDate', label: 'ARCHIVED DATE' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#f3f4f6',
              color: '#6b7280'
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
              <Button variant="primary" size="small" onClick={() => console.log('Restore', row.id)}>Restore</Button>
            </div>
          )
        }
      ],
      data: archiveData.customers
    },
    centers: {
      columns: [
        { key: 'id', label: 'CENTER ID', clickable: true },
        { key: 'centerName', label: 'CENTER NAME' },
        { key: 'cksManager', label: 'CKS MANAGER' },
        { key: 'archivedDate', label: 'ARCHIVED DATE' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#f3f4f6',
              color: '#6b7280'
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
              <Button variant="primary" size="small" onClick={() => console.log('Restore', row.id)}>Restore</Button>
            </div>
          )
        }
      ],
      data: archiveData.centers
    },
    crew: {
      columns: [
        { key: 'id', label: 'CREW ID', clickable: true },
        { key: 'crewName', label: 'CREW NAME' },
        { key: 'cksManager', label: 'CKS MANAGER' },
        { key: 'archivedDate', label: 'ARCHIVED DATE' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#f3f4f6',
              color: '#6b7280'
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
              <Button variant="primary" size="small" onClick={() => console.log('Restore', row.id)}>Restore</Button>
            </div>
          )
        }
      ],
      data: archiveData.crew
    },
    warehouses: {
      columns: [
        { key: 'id', label: 'WAREHOUSE ID', clickable: true },
        { key: 'warehouseName', label: 'WAREHOUSE NAME' },
        { key: 'cksManager', label: 'CKS MANAGER' },
        { key: 'archivedDate', label: 'ARCHIVED DATE' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#f3f4f6',
              color: '#6b7280'
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
              <Button variant="primary" size="small" onClick={() => console.log('Restore', row.id)}>Restore</Button>
            </div>
          )
        }
      ],
      data: archiveData.warehouses
    },
    services: {
      columns: [
        { key: 'id', label: 'SERVICE ID', clickable: true },
        { key: 'serviceName', label: 'SERVICE NAME' },
        { key: 'createdBy', label: 'CREATED BY' },
        { key: 'archivedDate', label: 'ARCHIVED DATE' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#f3f4f6',
              color: '#6b7280'
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
              <Button variant="primary" size="small" onClick={() => console.log('Restore', row.id)}>Restore</Button>
            </div>
          )
        }
      ],
      data: archiveData.services
    },
    orders: {
      columns: [
        { key: 'id', label: 'ORDER ID', clickable: true },
        { key: 'orderType', label: 'ORDER TYPE' },
        { key: 'createdBy', label: 'CREATED BY' },
        { key: 'archivedDate', label: 'ARCHIVED DATE' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#f3f4f6',
              color: '#6b7280'
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
              <Button variant="primary" size="small" onClick={() => console.log('Restore', row.id)}>Restore</Button>
            </div>
          )
        }
      ],
      data: archiveData.orders
    },
    products: {
      columns: [
        { key: 'id', label: 'PRODUCT ID', clickable: true },
        { key: 'warehouseId', label: 'WAREHOUSE ID' },
        { key: 'createdBy', label: 'CREATED BY' },
        { key: 'archivedDate', label: 'ARCHIVED DATE' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#f3f4f6',
              color: '#6b7280'
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
              <Button variant="primary" size="small" onClick={() => console.log('Restore', row.id)}>Restore</Button>
            </div>
          )
        }
      ],
      data: archiveData.products
    },
    training: {
      columns: [
        { key: 'id', label: 'TRAINING ID', clickable: true },
        { key: 'createdBy', label: 'CREATED BY' },
        { key: 'archivedDate', label: 'ARCHIVED DATE' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#f3f4f6',
              color: '#6b7280'
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
              <Button variant="primary" size="small" onClick={() => console.log('Restore', row.id)}>Restore</Button>
            </div>
          )
        }
      ],
      data: archiveData.training
    },
    procedures: {
      columns: [
        { key: 'id', label: 'PROCEDURE ID', clickable: true },
        { key: 'createdBy', label: 'CREATED BY' },
        { key: 'archivedDate', label: 'ARCHIVED DATE' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#f3f4f6',
              color: '#6b7280'
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
              <Button variant="primary" size="small" onClick={() => console.log('Restore', row.id)}>Restore</Button>
            </div>
          )
        }
      ],
      data: archiveData.procedures
    },
    reports: {
      columns: [
        { key: 'id', label: 'REPORT ID', clickable: true },
        { key: 'createdBy', label: 'CREATED BY' },
        { key: 'archivedDate', label: 'ARCHIVED DATE' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#f3f4f6',
              color: '#6b7280'
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
              <Button variant="primary" size="small" onClick={() => console.log('Restore', row.id)}>Restore</Button>
            </div>
          )
        }
      ],
      data: archiveData.reports
    },
    feedback: {
      columns: [
        { key: 'id', label: 'FEEDBACK ID', clickable: true },
        { key: 'createdBy', label: 'CREATED BY' },
        { key: 'archivedDate', label: 'ARCHIVED DATE' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#f3f4f6',
              color: '#6b7280'
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
              <Button variant="primary" size="small" onClick={() => console.log('Restore', row.id)}>Restore</Button>
            </div>
          )
        }
      ],
      data: archiveData.feedback
    }
  };

  const currentConfig = archiveConfig[activeTab as keyof typeof archiveConfig];

  return (
    <PageWrapper headerSrOnly>
      <TabContainer variant="pills" spacing="compact">
        <NavigationTab
          label="Managers"
          isActive={activeTab === 'managers'}
          onClick={() => setActiveTab('managers')}
          activeColor="#3b82f6"
        />
        <NavigationTab
          label="Contractors"
          isActive={activeTab === 'contractors'}
          onClick={() => setActiveTab('contractors')}
          activeColor="#10b981"
        />
        <NavigationTab
          label="Customers"
          isActive={activeTab === 'customers'}
          onClick={() => setActiveTab('customers')}
          activeColor="#eab308"
        />
        <NavigationTab
          label="Centers"
          isActive={activeTab === 'centers'}
          onClick={() => setActiveTab('centers')}
          activeColor="#f59e0b"
        />
        <NavigationTab
          label="Crew"
          isActive={activeTab === 'crew'}
          onClick={() => setActiveTab('crew')}
          activeColor="#ef4444"
        />
        <NavigationTab
          label="Warehouses"
          isActive={activeTab === 'warehouses'}
          onClick={() => setActiveTab('warehouses')}
          activeColor="#8b5cf6"
        />
        <NavigationTab
          label="Services"
          isActive={activeTab === 'services'}
          onClick={() => setActiveTab('services')}
          activeColor="#06b6d4"
        />
        <NavigationTab
          label="Orders"
          isActive={activeTab === 'orders'}
          onClick={() => setActiveTab('orders')}
          activeColor="#92400e"
        />
        <NavigationTab
          label="Products"
          isActive={activeTab === 'products'}
          onClick={() => setActiveTab('products')}
          activeColor="#374151"
        />
        <NavigationTab
          label="Training & Procedures"
          isActive={activeTab === 'training'}
          onClick={() => setActiveTab('training')}
          activeColor="#ec4899"
        />
        <NavigationTab
          label="Reports & Feedback"
          isActive={activeTab === 'reports'}
          onClick={() => setActiveTab('reports')}
          activeColor="#6b7280"
        />
      </TabContainer>

      <div style={{ marginTop: 24 }}>
        <div style={{
          padding: 24,
          background: 'white',
          borderRadius: 8,
          border: '1px solid #e5e7eb'
        }}>
          {activeTab === 'training' ? (
            // Split side-by-side tables for Training & Procedures
            <div style={{ display: 'flex', gap: '4%' }}>
              <div style={{ width: '48%' }}>
                <DataTable
                  columns={archiveConfig.training.columns}
                  data={archiveConfig.training.data}
                  searchPlaceholder="Search archived training..."
                  showSearch={true}
                  title="Training"
                />
              </div>
              <div style={{ width: '48%' }}>
                <DataTable
                  columns={archiveConfig.procedures.columns}
                  data={archiveConfig.procedures.data}
                  searchPlaceholder="Search archived procedures..."
                  showSearch={true}
                  title="Procedures"
                />
              </div>
            </div>
          ) : activeTab === 'reports' ? (
            // Split side-by-side tables for Reports & Feedback
            <div style={{ display: 'flex', gap: '4%' }}>
              <div style={{ width: '48%' }}>
                <DataTable
                  columns={archiveConfig.reports.columns}
                  data={archiveConfig.reports.data}
                  searchPlaceholder="Search archived reports..."
                  showSearch={true}
                  title="Reports"
                />
              </div>
              <div style={{ width: '48%' }}>
                <DataTable
                  columns={archiveConfig.feedback.columns}
                  data={archiveConfig.feedback.data}
                  searchPlaceholder="Search archived feedback..."
                  showSearch={true}
                  title="Feedback"
                />
              </div>
            </div>
          ) : currentConfig ? (
            // Regular single table for other tabs
            <DataTable
              columns={currentConfig.columns}
              data={currentConfig.data}
              searchPlaceholder={`Search archived ${activeTab}...`}
              showSearch={true}
            />
          ) : (
            <p>Archive {activeTab} data will be implemented here</p>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

