import React, { useMemo, useState } from 'react';
import { DataTable, NavigationTab, PageWrapper, TabContainer } from '@cks/ui';

const ASSIGN_TABS = [
  { id: 'contractors', label: 'Contractors', color: '#10b981', search: 'contractors' },
  { id: 'customers', label: 'Customers', color: '#0ea5e9', search: 'customers' },
  { id: 'centers', label: 'Centers', color: '#f97316', search: 'centers' },
  { id: 'crew', label: 'Crew', color: '#ef4444', search: 'crew' },
];

function buildColumns(tabId: string) {
  switch (tabId) {
    case 'contractors':
      return [
        { key: 'id', label: 'CONTRACTOR ID', clickable: true },
        { key: 'companyName', label: 'COMPANY NAME' },
        { key: 'email', label: 'EMAIL' },
        { key: 'phone', label: 'PHONE' },
      ];
    case 'customers':
      return [
        { key: 'id', label: 'CUSTOMER ID', clickable: true },
        { key: 'customerName', label: 'CUSTOMER NAME' },
        { key: 'email', label: 'EMAIL' },
        { key: 'phone', label: 'PHONE' },
      ];
    case 'centers':
      return [
        { key: 'id', label: 'CENTER ID', clickable: true },
        { key: 'centerName', label: 'CENTER NAME' },
        { key: 'location', label: 'LOCATION' },
      ];
    case 'crew':
      return [
        { key: 'id', label: 'CREW ID', clickable: true },
        { key: 'crewName', label: 'CREW NAME' },
        { key: 'role', label: 'ROLE' },
      ];
    default:
      return [];
  }
}

export default function AssignSection() {
  const [activeTab, setActiveTab] = useState('contractors');

  const config = useMemo(() => {
    const columns = buildColumns(activeTab);
    const tab = ASSIGN_TABS.find((item) => item.id === activeTab) ?? ASSIGN_TABS[0];
    return {
      columns,
      searchPlaceholder: `Search unassigned ${tab.search}...`,
      emptyMessage: 'No unassigned records found.',
    };
  }, [activeTab]);

  return (
    <PageWrapper title="Assignments" showHeader={false}>
      <TabContainer variant="pills" spacing="compact">
        {ASSIGN_TABS.map((tab) => (
          <NavigationTab
            key={tab.id}
            label={tab.label}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            activeColor={tab.color}
          />
        ))}
      </TabContainer>

      <div style={{ marginTop: 24 }}>
        <DataTable
          columns={config.columns}
          data={[]}
          searchPlaceholder={config.searchPlaceholder}
          showSearch={true}
          emptyMessage={config.emptyMessage}
        />
      </div>
    </PageWrapper>
  );
}
