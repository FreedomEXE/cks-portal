import { useMemo, useState } from 'react';
import { Button, NavigationTab, PageWrapper, TabContainer } from '@cks/ui';
import { useSWRConfig } from 'swr';
import {
  useManagers,
  useContractors,
  useCustomers,
  useCenters,
} from '../../shared/api/directory';
import {
  useUnassigned,
  assignResource,
  type AssignmentResource,
} from '../../shared/api/assignments';
import type {
  UnassignedContractor,
  UnassignedCustomer,
  UnassignedCenter,
  UnassignedCrewMember,
  AssignmentResult,
} from '../../shared/api/assignments';

type AssignTabKey = 'contractors' | 'customers' | 'centers' | 'crew';

type Option = {
  id: string;
  label: string;
};

type AssignmentStatus = {
  loading: boolean;
  error: string | null;
  success: string | null;
};

type AssignmentStatusMap = Record<AssignTabKey, AssignmentStatus>;

type SelectionState = Record<AssignTabKey, Record<string, string>>;

type TabDefinition = {
  key: AssignTabKey;
  label: string;
  color: string;
  subjectLabel: string;
  targetLabel: string;
  resource: AssignmentResource;
  mutateKeys: string[];
};

const TAB_DEFINITIONS: TabDefinition[] = [
  {
    key: 'contractors',
    label: 'Contractors',
    color: '#10b981',
    subjectLabel: 'Contractor',
    targetLabel: 'Manager',
    resource: 'contractors',
    mutateKeys: ['/admin/directory/contractors', '/admin/directory/managers'],
  },
  {
    key: 'customers',
    label: 'Customers',
    color: '#0ea5e9',
    subjectLabel: 'Customer',
    targetLabel: 'Contractor',
    resource: 'customers',
    mutateKeys: ['/admin/directory/customers', '/admin/directory/contractors'],
  },
  {
    key: 'centers',
    label: 'Centers',
    color: '#f97316',
    subjectLabel: 'Center',
    targetLabel: 'Customer',
    resource: 'centers',
    mutateKeys: ['/admin/directory/centers', '/admin/directory/customers'],
  },
  {
    key: 'crew',
    label: 'Crew',
    color: '#ef4444',
    subjectLabel: 'Crew member',
    targetLabel: 'Center',
    resource: 'crew',
    mutateKeys: ['/admin/directory/crew', '/admin/directory/centers'],
  },
];

function StatusBanner({ state }: { state: AssignmentStatus }) {
  if (state.loading) {
    return <div style={{ marginBottom: 16, color: '#2563eb' }}>Assigning...</div>;
  }
  if (state.error) {
    return <div style={{ marginBottom: 16, color: '#dc2626' }}>{state.error}</div>;
  }
  if (state.success) {
    return <div style={{ marginBottom: 16, color: '#047857' }}>{state.success}</div>;
  }
  return null;
}

function formatOptionLabel(name: string | null | undefined, id: string): string {
  const trimmed = name?.trim();
  if (trimmed) {
    return `${trimmed} (${id})`;
  }
  return id;
}

export default function AdminAssignSection() {
  const [activeTab, setActiveTab] = useState<AssignTabKey>('contractors');
  const { mutate } = useSWRConfig();

  const initialStatus = useMemo(() => {
    const entries = TAB_DEFINITIONS.map((tab) => [tab.key, { loading: false, error: null, success: null }]);
    return Object.fromEntries(entries) as AssignmentStatusMap;
  }, []);

  const initialSelections = useMemo(() => {
    const entries = TAB_DEFINITIONS.map((tab) => [tab.key, {}]);
    return Object.fromEntries(entries) as SelectionState;
  }, []);

  const [statuses, setStatuses] = useState<AssignmentStatusMap>(initialStatus);
  const [selections, setSelections] = useState<SelectionState>(initialSelections);

  const { data: managers, isLoading: managersLoading } = useManagers();
  const { data: contractors, isLoading: contractorsLoading } = useContractors();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: centers, isLoading: centersLoading } = useCenters();

  const managerOptions: Option[] = useMemo(
    () => managers.map((item) => ({ id: item.id, label: formatOptionLabel(item.name, item.id) })),
    [managers],
  );

  const contractorOptions: Option[] = useMemo(
    () => contractors.map((item) => ({ id: item.id, label: formatOptionLabel(item.companyName ?? item.id, item.id) })),
    [contractors],
  );

  const customerOptions: Option[] = useMemo(
    () => customers.map((item) => ({ id: item.id, label: formatOptionLabel(item.name ?? item.id, item.id) })),
    [customers],
  );

  const centerOptions: Option[] = useMemo(
    () => centers.map((item) => ({ id: item.id, label: formatOptionLabel(item.name ?? item.id, item.id) })),
    [centers],
  );

  function resolveOptions(tab: AssignTabKey): { options: Option[]; loading: boolean; emptyMessage: string } {
    switch (tab) {
      case 'contractors':
        return {
          options: managerOptions,
          loading: managersLoading,
          emptyMessage: 'No managers available. Create a manager first.',
        };
      case 'customers':
        return {
          options: contractorOptions,
          loading: contractorsLoading,
          emptyMessage: 'No contractors available to assign. Create one first.',
        };
      case 'centers':
        return {
          options: customerOptions,
          loading: customersLoading,
          emptyMessage: 'No customers available to assign. Create one first.',
        };
      case 'crew':
      default:
        return {
          options: centerOptions,
          loading: centersLoading,
          emptyMessage: 'No centers available to assign. Create one first.',
        };
    }
  }

  const unassignedHook = useUnassigned(activeTab);
  const activeConfig = TAB_DEFINITIONS.find((tab) => tab.key === activeTab)!;
  const optionSet = resolveOptions(activeTab);
  const selectionMap = selections[activeTab];
  const activeStatus = statuses[activeTab];

  function updateSelection(subjectId: string, targetId: string) {
    setSelections((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [subjectId]: targetId,
      },
    }));
  }

  async function handleAssign(subjectId: string) {
    const targetId = selectionMap[subjectId]?.trim();
    if (!targetId) {
      setStatuses((prev) => ({
        ...prev,
        [activeTab]: { loading: false, error: `Select a ${activeConfig.targetLabel.toLowerCase()} to assign.`, success: null },
      }));
      return;
    }

    setStatuses((prev) => ({
      ...prev,
      [activeTab]: { loading: true, error: null, success: null },
    }));

    try {
      const payloadKey = activeConfig.resource === 'contractors'
        ? { managerId: targetId }
        : activeConfig.resource === 'customers'
          ? { contractorId: targetId }
          : activeConfig.resource === 'centers'
            ? { customerId: targetId }
            : { centerId: targetId };

      const result = await assignResource(activeConfig.resource, subjectId, payloadKey as any);
      const assignment = result as AssignmentResult;
      setStatuses((prev) => ({
        ...prev,
        [activeTab]: {
          loading: false,
          error: null,
          success: `${activeConfig.subjectLabel} ${assignment.id} assigned to ${activeConfig.targetLabel} ${assignment.assignedId}`,
        },
      }));

      setSelections((prev) => {
        const nextForTab = { ...prev[activeTab] };
        delete nextForTab[subjectId];
        return {
          ...prev,
          [activeTab]: nextForTab,
        };
      });

      await unassignedHook.mutate();
      await Promise.all(
        activeConfig.mutateKeys.map((key) => mutate(key, undefined, { revalidate: true })),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Assignment failed';
      setStatuses((prev) => ({
        ...prev,
        [activeTab]: { loading: false, error: message, success: null },
      }));
    }
  }

  function renderTable() {
    if (unassignedHook.isLoading) {
      return <div style={{ color: '#2563eb' }}>Loading unassigned {activeConfig.label.toLowerCase()}...</div>;
    }

    if (unassignedHook.error) {
      return <div style={{ color: '#dc2626' }}>Failed to load unassigned list: {unassignedHook.error.message}</div>;
    }

    const rows = unassignedHook.data as (
      | UnassignedContractor
      | UnassignedCustomer
      | UnassignedCenter
      | UnassignedCrewMember
    )[];

    if (!rows.length) {
      return <div style={{ color: '#64748b' }}>No unassigned {activeConfig.label.toLowerCase()} found.</div>;
    }

    const options = optionSet.options;
    const optionsAvailable = options.length > 0;
    const optionsLoading = optionSet.loading;

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', fontSize: 13, color: '#475569' }}>ID</th>
              <th style={{ padding: '8px 12px', fontSize: 13, color: '#475569' }}>Name</th>
              {activeTab === 'crew' ? (
                <th style={{ padding: '8px 12px', fontSize: 13, color: '#475569' }}>Role</th>
              ) : null}
              <th style={{ padding: '8px 12px', fontSize: 13, color: '#475569' }}>Email</th>
              <th style={{ padding: '8px 12px', fontSize: 13, color: '#475569' }}>Phone</th>
              <th style={{ padding: '8px 12px', fontSize: 13, color: '#475569' }}>{activeConfig.targetLabel}</th>
              <th style={{ padding: '8px 12px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selectionValue = selectionMap[row.id] ?? '';
              const disableAssign = !selectionValue || activeStatus.loading || optionsLoading;
              const displayName =
                'companyName' in row
                  ? row.companyName ?? row.id
                  : 'name' in row
                    ? row.name ?? row.id
                    : row.id;
              return (
                <tr key={row.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#1e293b' }}>{row.id}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#1e293b' }}>{displayName}</td>
                  {activeTab === 'crew' ? (
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#475569' }}>
                      {'role' in row ? row.role ?? '—' : '—'}
                    </td>
                  ) : null}
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#475569' }}>
                    {'email' in row ? row.email ?? '—' : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#475569' }}>
                    {'phone' in row ? row.phone ?? '—' : '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {optionsLoading ? (
                      <span style={{ fontSize: 13, color: '#2563eb' }}>Loading {activeConfig.targetLabel.toLowerCase()}s...</span>
                    ) : optionsAvailable ? (
                      <select
                        value={selectionValue}
                        onChange={(event) => updateSelection(row.id, event.target.value)}
                        disabled={activeStatus.loading}
                        style={{
                          minWidth: 220,
                          padding: '6px 8px',
                          borderRadius: 6,
                          border: '1px solid #cbd5f5',
                          fontSize: 13,
                        }}
                      >
                        <option value="">Select {activeConfig.targetLabel}</option>
                        {options.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ fontSize: 13, color: '#f97316' }}>{optionSet.emptyMessage}</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <Button
                      type="button"
                      variant="secondary"
                      roleColor={activeConfig.color}
                      disabled={disableAssign || !optionsAvailable}
                      onClick={() => handleAssign(row.id)}
                    >
                      Assign
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <PageWrapper title="Assignments" headerSrOnly>
      <TabContainer variant="pills" spacing="compact">
        {TAB_DEFINITIONS.map((tab) => (
          <NavigationTab
            key={tab.key}
            label={tab.label}
            isActive={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            activeColor={tab.color}
          />
        ))}
      </TabContainer>

      <div style={{ marginTop: 24 }}>
        <StatusBanner state={activeStatus} />
        {renderTable()}
      </div>
    </PageWrapper>
  );
}
