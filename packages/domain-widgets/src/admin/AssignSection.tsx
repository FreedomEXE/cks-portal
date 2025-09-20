/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: AssignSection.tsx
 *
 * Description:
 * Admin assign section with tabs for all data types
 *
 * Responsibilities:
 * - Provide assignment interface for all data types
 * - Use TabContainer/NavigationTab pattern from directory
 *
 * Role in system:
 * - Used by AdminHub for assign tab
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import React, { useState } from 'react';
import NavigationTab from '../../../ui/src/navigation/NavigationTab';
import TabContainer from '../../../ui/src/navigation/TabContainer';
import PageWrapper from '../../../ui/src/layout/PageWrapper';
import DataTable from '../../../ui/src/tables/DataTable';
import Button from '../../../ui/src/buttons/Button';

export default function AssignSection() {
  const [activeTab, setActiveTab] = useState('contractors');

  // Mock unassigned data - users who need assignment
  const unassignedData = {
    contractors: [
      { id: 'CON-003', companyName: 'Elite Cleaning Services', email: 'elite@example.com', phone: '(555) 123-4567', status: 'unassigned' },
      { id: 'CON-004', companyName: 'Pro Clean Solutions', email: 'pro@example.com', phone: '(555) 234-5678', status: 'unassigned' },
    ],
    customers: [
      { id: 'CUS-005', customerName: 'Metro Shopping Center', email: 'metro@example.com', phone: '(555) 345-6789', status: 'unassigned' },
      { id: 'CUS-006', customerName: 'Tech Campus Plaza', email: 'tech@example.com', phone: '(555) 456-7890', status: 'unassigned' },
      { id: 'CUS-007', customerName: 'Downtown Office Complex', email: 'downtown@example.com', phone: '(555) 567-8901', status: 'unassigned' },
    ],
    centers: [
      { id: 'CTR-003', centerName: 'Westside Service Center', location: 'West District', email: 'west@example.com', status: 'unassigned' },
    ],
    crew: [
      { id: 'CRW-004', crewName: 'Alex Rodriguez', email: 'alex@example.com', phone: '(555) 678-9012', specializations: 'General Cleaning', status: 'unassigned' },
      { id: 'CRW-005', crewName: 'Maria Santos', email: 'maria@example.com', phone: '(555) 789-0123', specializations: 'Deep Cleaning', status: 'unassigned' },
      { id: 'CRW-006', crewName: 'James Chen', email: 'james@example.com', phone: '(555) 890-1234', specializations: 'Maintenance', status: 'unassigned' },
    ]
  };

  const assignConfigs = {
    contractors: {
      title: 'Unassigned - Contractors',
      count: unassignedData.contractors.length,
      columns: [
        { key: 'id', label: 'CONTRACTOR ID', clickable: true },
        { key: 'companyName', label: 'COMPANY NAME' },
        { key: 'email', label: 'EMAIL' },
        { key: 'phone', label: 'PHONE' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#fef3c7',
              color: '#d97706'
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
              <Button variant="primary" size="small" onClick={() => console.log('Assign', row.id)}>Assign to Manager</Button>
            </div>
          )
        }
      ],
      data: unassignedData.contractors
    },
    customers: {
      title: 'Unassigned - Customers',
      count: unassignedData.customers.length,
      columns: [
        { key: 'id', label: 'CUSTOMER ID', clickable: true },
        { key: 'customerName', label: 'CUSTOMER NAME' },
        { key: 'email', label: 'EMAIL' },
        { key: 'phone', label: 'PHONE' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#fef3c7',
              color: '#d97706'
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
              <Button variant="primary" size="small" onClick={() => console.log('Assign', row.id)}>Assign to Contractor</Button>
            </div>
          )
        }
      ],
      data: unassignedData.customers
    },
    centers: {
      title: 'Unassigned - Centers',
      count: unassignedData.centers.length,
      columns: [
        { key: 'id', label: 'CENTER ID', clickable: true },
        { key: 'centerName', label: 'CENTER NAME' },
        { key: 'location', label: 'LOCATION' },
        { key: 'email', label: 'EMAIL' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#fef3c7',
              color: '#d97706'
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
              <Button variant="primary" size="small" onClick={() => console.log('Assign', row.id)}>Assign to Customer</Button>
            </div>
          )
        }
      ],
      data: unassignedData.centers
    },
    crew: {
      title: 'Unassigned - Crew',
      count: unassignedData.crew.length,
      columns: [
        { key: 'id', label: 'CREW ID', clickable: true },
        { key: 'crewName', label: 'CREW NAME' },
        { key: 'email', label: 'EMAIL' },
        { key: 'specializations', label: 'SPECIALIZATIONS' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => (
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#fef3c7',
              color: '#d97706'
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
              <Button variant="primary" size="small" onClick={() => console.log('Assign', row.id)}>Assign to Center</Button>
            </div>
          )
        }
      ],
      data: unassignedData.crew
    },
  };

  const currentConfig = assignConfigs[activeTab as keyof typeof assignConfigs];

  return (
    <PageWrapper headerSrOnly>
      <TabContainer variant="pills" spacing="compact">
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
      </TabContainer>

      <div style={{ marginTop: 24 }}>
        <div style={{
          padding: 24,
          background: 'white',
          borderRadius: 8,
          border: '1px solid #e5e7eb'
        }}>
          {currentConfig && (
            <>
              <h3 style={{
                margin: '0 0 24px 0',
                color: '#111827',
                fontSize: '18px',
                fontWeight: 600
              }}>
                {currentConfig.title} ({currentConfig.count})
              </h3>
              <DataTable
                columns={currentConfig.columns}
                data={currentConfig.data}
                searchPlaceholder={`Search unassigned ${activeTab}...`}
                showSearch={true}
              />
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}