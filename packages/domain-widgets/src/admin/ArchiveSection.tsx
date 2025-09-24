import React, { useMemo, useState } from 'react';
import { DataTable, NavigationTab, PageWrapper, TabContainer } from '@cks/ui';

const ARCHIVE_TABS = [
  { id: 'managers', label: 'Managers', color: '#3b82f6', search: 'archived managers' },
  { id: 'contractors', label: 'Contractors', color: '#10b981', search: 'archived contractors' },
  { id: 'customers', label: 'Customers', color: '#0ea5e9', search: 'archived customers' },
  { id: 'centers', label: 'Centers', color: '#f97316', search: 'archived centers' },
  { id: 'crew', label: 'Crew', color: '#ef4444', search: 'archived crew' },
];

function buildColumns(tabId: string) {
  switch (tabId) {
    case 'managers':
      return [
        { key: 'id', label: 'MANAGER ID', clickable: true },
        { key: 'name', label: 'MANAGER NAME' },
        { key: 'territory', label: 'TERRITORY' },
        { key: 'archivedDate', label: 'ARCHIVED ON' },
      ];
    case 'contractors':
      return [
        { key: 'id', label: 'CONTRACTOR ID', clickable: true },
        { key: 'name', label: 'NAME' },
        { key: 'manager', label: 'ASSIGNED MANAGER' },
        { key: 'archivedDate', label: 'ARCHIVED ON' },
      ];
    case 'customers':
      return [
        { key: 'id', label: 'CUSTOMER ID', clickable: true },
        { key: 'name', label: 'NAME' },
        { key: 'manager', label: 'ASSIGNED MANAGER' },
        { key: 'archivedDate', label: 'ARCHIVED ON' },
      ];
    case 'centers':
      return [
        { key: 'id', label: 'CENTER ID', clickable: true },
        { key: 'name', label: 'NAME' },
        { key: 'location', label: 'LOCATION' },
        { key: 'archivedDate', label: 'ARCHIVED ON' },
      ];
    case 'crew':
      return [
        { key: 'id', label: 'CREW ID', clickable: true },
        { key: 'crewName', label: 'CREW NAME' },
        { key: 'emergencyContact', label: 'EMERGENCY CONTACT' },
        { key: 'archivedDate', label: 'ARCHIVED ON' },
      ];
    default:
      return [];
  }
}

export default function ArchiveSection() {
  const [activeTab, setActiveTab] = useState('managers');

  const config = useMemo(() => {
    const columns = buildColumns(activeTab);
    const tab = ARCHIVE_TABS.find((item) => item.id === activeTab) ?? ARCHIVE_TABS[0];
    return {
      columns,
      searchPlaceholder: `Search ${tab.search}...`,
      emptyMessage: 'No archived records found.',
    };
  }, [activeTab]);

  return (
    <PageWrapper title="Archive" showHeader={false}>
      <TabContainer variant="pills" spacing="compact">
        {ARCHIVE_TABS.map((tab) => (
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
