import { useMemo, useState } from 'react';
import { Button, NavigationTab, PageWrapper, TabContainer } from '@cks/ui';
import { useSWRConfig } from 'swr';
import {
  createManager,
  createContractor,
  createCustomer,
  createCenter,
  createCrew,
  createWarehouse,
  type ManagerCreatePayload,
  type ManagerRecord,
  type ContractorCreatePayload,
  type ContractorRecord,
  type CustomerCreatePayload,
  type CustomerRecord,
  type CenterCreatePayload,
  type CenterRecord,
  type CrewCreatePayload,
  type CrewRecord,
  type WarehouseCreatePayload,
  type WarehouseRecord,
} from '../../shared/api/provisioning';

type TabKey = 'managers' | 'contractors' | 'customers' | 'centers' | 'crew' | 'warehouses';

type FieldConfig = {
  name: string;
  label: string;
  placeholder?: string | ((values: Record<string, string>) => string);
  required?: boolean;
  inputType?: 'text' | 'email' | 'tel';
  multiline?: boolean;
  control?: 'input' | 'select';
  options?: Array<{ value: string; label: string }>;
  getOptions?: (values: Record<string, string>) => Array<{ value: string; label: string }>;
  disabled?: (values: Record<string, string>) => boolean;
  defaultValue?: string;
};

type TabConfig<TRecord> = {
  key: TabKey;
  label: string;
  color: string;
  fields: FieldConfig[];
  submitLabel: string;
  create: (input: Record<string, string>) => Promise<TRecord>;
  resetValues: Record<string, string>;
  successMessage: (record: TRecord) => string;
  mutateKeys: string[];
};

type FormState = Record<TabKey, Record<string, string>>;

type SubmissionState = {
  loading: boolean;
  error: string | null;
  success: string | null;
};

type SubmissionMap = Record<TabKey, SubmissionState>;

const MANAGER_ROLE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'Strategic Manager', label: 'Strategic Manager' },
  { value: 'Operations Manager', label: 'Operations Manager' },
  { value: 'Field Manager', label: 'Field Manager' },
  { value: 'Development Manager', label: 'Development Manager' },
];

const MANAGER_REPORTS_TO_MAP: Record<string, Array<{ value: string; label: string }>> = {
  'Strategic Manager': [
    { value: 'CEO', label: 'CEO' },
  ],
  'Operations Manager': [
    { value: 'CEO', label: 'CEO' },
    { value: 'strategic-manager', label: 'Strategic Manager' },
  ],
  'Field Manager': [
    { value: 'CEO', label: 'CEO' },
    { value: 'strategic-manager', label: 'Strategic Manager' },
    { value: 'operations-manager', label: 'Operations Manager' },
  ],
  'Development Manager': [
    { value: 'CEO', label: 'CEO' },
    { value: 'strategic-manager', label: 'Strategic Manager' },
  ],
};

function getReportsToOptions(role: string): Array<{ value: string; label: string }> {
  return MANAGER_REPORTS_TO_MAP[role] ?? [];
}

function stringOrUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function buildFieldValues(fields: FieldConfig[]): Record<string, string> {
  return fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.name] = field.defaultValue ?? '';
    return acc;
  }, {});
}

function StatusMessage({ state }: { state: SubmissionState }) {
  if (state.loading) {
    return <div style={{ marginBottom: 16, color: '#2563eb' }}>Submitting...</div>;
  }
  if (state.error) {
    return <div style={{ marginBottom: 16, color: '#dc2626' }}>{state.error}</div>;
  }
  if (state.success) {
    return <div style={{ marginBottom: 16, color: '#047857' }}>{state.success}</div>;
  }
  return null;
}

function FormTable({
  fields,
  values,
  disabled,
  onChange,
}: {
  fields: FieldConfig[];
  values: Record<string, string>;
  disabled: boolean;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <table style={{ width: '100%', borderSpacing: '0 16px' }}>
      <tbody>
        {fields.map((field) => {
          const value = values[field.name] ?? '';
          const resolvedOptions = field.getOptions
            ? field.getOptions(values) ?? []
            : field.options ?? [];
          const isSelect = field.control === 'select' || resolvedOptions.length > 0;
          const fieldDisabled = disabled || (field.disabled ? field.disabled(values) : false);
          const placeholder =
            typeof field.placeholder === 'function'
              ? field.placeholder(values)
              : field.placeholder;

          return (
            <tr key={field.name}>
              <td style={{ width: 150, verticalAlign: 'top', paddingRight: 16 }}>
                <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  {field.label}
                  {field.required ? ' *' : ''}
                </label>
              </td>
              <td>
                {field.multiline ? (
                  <textarea
                    value={value}
                    onChange={(event) => onChange(field.name, event.target.value)}
                    required={field.required}
                    disabled={fieldDisabled}
                    style={{
                      width: '360px',
                      minHeight: 96,
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                      resize: 'vertical',
                    }}
                    placeholder={placeholder ?? field.label}
                  />
                ) : isSelect ? (
                  <select
                    value={value}
                    onChange={(event) => onChange(field.name, event.target.value)}
                    required={field.required}
                    disabled={fieldDisabled || (field.control === 'select' && resolvedOptions.length === 0)}
                    style={{
                      width: '324px',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                      backgroundColor:
                        fieldDisabled || resolvedOptions.length === 0 ? '#f9fafb' : 'white',
                      color: fieldDisabled || resolvedOptions.length === 0 ? '#9ca3af' : '#111827',
                    }}
                  >
                    <option value="">{placeholder ?? `Select ${field.label}`}</option>
                    {resolvedOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.inputType ?? 'text'}
                    value={value}
                    onChange={(event) => onChange(field.name, event.target.value)}
                    required={field.required}
                    disabled={fieldDisabled}
                    style={{
                      width: '320px',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                    placeholder={placeholder}
                  />
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function buildTabConfigs(): TabConfig<unknown>[] {
  const managerFields: FieldConfig[] = [
    { name: 'fullName', label: 'Full Name', required: true, placeholder: 'Jane Doe' },
    { name: 'territory', label: 'Territory', required: true, placeholder: 'Central Region' },
    { name: 'phone', label: 'Phone Number', required: true, inputType: 'tel', placeholder: '(555) 123-4567' },
    { name: 'email', label: 'Email', required: true, inputType: 'email', placeholder: 'manager@example.com' },
    {
      name: 'role',
      label: 'Role',
      required: true,
      control: 'select',
      options: MANAGER_ROLE_OPTIONS,
      placeholder: 'Select Role',
    },
    {
      name: 'reportsTo',
      label: 'Reports To',
      required: true,
      control: 'select',
      getOptions: (values) => getReportsToOptions(values.role),
      placeholder: (values) => (values.role ? 'Select Reports To' : 'Select Role First'),
      disabled: (values) => !values.role,
    },
    { name: 'address', label: 'Address', required: true, placeholder: '123 Main St, Springfield' },
  ];
  const contractorFields: FieldConfig[] = [
    { name: 'companyName', label: 'Company Name', required: true, placeholder: 'Acme Facilities' },
    { name: 'contactPerson', label: 'Main Contact', placeholder: 'Primary contact name' },
    { name: 'email', label: 'Email', inputType: 'email', placeholder: 'contact@acme.com' },
    { name: 'phone', label: 'Phone', inputType: 'tel', placeholder: '(555) 987-6543' },
    { name: 'address', label: 'Address', placeholder: 'Street, City, State' },
  ];

  const customerFields: FieldConfig[] = [
    { name: 'name', label: 'Customer Name', required: true, placeholder: 'Sunrise Clinics' },
    { name: 'contactName', label: 'Main Contact', placeholder: 'Primary contact name' },
    { name: 'email', label: 'Email', inputType: 'email', placeholder: 'contact@sunrise.com' },
    { name: 'phone', label: 'Phone', inputType: 'tel', placeholder: '(555) 123-7890' },
    { name: 'address', label: 'Address', placeholder: 'Street, City, State' },
  ];

  const centerFields: FieldConfig[] = [
    { name: 'name', label: 'Center Name', required: true, placeholder: 'Downtown Campus' },
    { name: 'contactName', label: 'Main Contact', placeholder: 'Primary contact name' },
    { name: 'email', label: 'Email', inputType: 'email', placeholder: 'center@example.com' },
    { name: 'phone', label: 'Phone', inputType: 'tel', placeholder: '(555) 654-3210' },
    { name: 'address', label: 'Address', placeholder: 'Street, City, State' },
  ];

  const crewFields: FieldConfig[] = [
    { name: 'name', label: 'Crew Name', required: true, placeholder: 'Alpha Team' },
    { name: 'role', label: 'Role', placeholder: 'Lead Technician' },
    { name: 'email', label: 'Email', inputType: 'email', placeholder: 'crew@example.com' },
    { name: 'phone', label: 'Phone', inputType: 'tel', placeholder: '(555) 222-1111' },
    { name: 'address', label: 'Address', placeholder: 'Street, City, State' },
  ];

  const warehouseFields: FieldConfig[] = [
    { name: 'name', label: 'Warehouse Name', required: true, placeholder: 'North Logistics Hub' },
    { name: 'managerId', label: 'Manager ID', placeholder: 'MGR-001' },
    { name: 'email', label: 'Email', inputType: 'email', placeholder: 'warehouse@example.com' },
    { name: 'phone', label: 'Phone', inputType: 'tel', placeholder: '(555) 777-8888' },
    { name: 'warehouseType', label: 'Warehouse Type', placeholder: 'Regional' },
    { name: 'address', label: 'Address', placeholder: 'Street, City, State' },
  ];

  const configs: TabConfig<unknown>[] = [
    {
      key: 'managers',
      label: 'Managers',
      color: '#3b82f6',
      fields: managerFields,
      submitLabel: 'Create Manager',
      create: async (values) => {
        const payload: ManagerCreatePayload = {
          fullName: values.fullName.trim(),
          territory: values.territory.trim(),
          phone: values.phone.trim(),
          email: values.email.trim(),
          role: values.role,
          reportsTo: values.reportsTo,
          address: values.address.trim(),
        };
        return createManager(payload);
      },
      resetValues: buildFieldValues(managerFields),
      successMessage: (record) => `Manager ${(record as ManagerRecord).id} created successfully`,
      mutateKeys: ['/admin/directory/managers'],
    },
    {
      key: 'contractors',
      label: 'Contractors',
      color: '#10b981',
      fields: contractorFields,
      submitLabel: 'Create Contractor',
      create: async (values) => {
        const payload: ContractorCreatePayload = {
          companyName: values.companyName.trim(),
          contactPerson: stringOrUndefined(values.contactPerson),
          email: stringOrUndefined(values.email),
          phone: stringOrUndefined(values.phone),
          address: stringOrUndefined(values.address),
        };
        return createContractor(payload);
      },
      resetValues: buildFieldValues(contractorFields),
      successMessage: (record) => `Contractor ${(record as ContractorRecord).id} created`,
      mutateKeys: ['/admin/directory/contractors', '/admin/assignments/contractors/unassigned'],
    },
    {
      key: 'customers',
      label: 'Customers',
      color: '#eab308',
      fields: customerFields,
      submitLabel: 'Create Customer',
      create: async (values) => {
        const payload: CustomerCreatePayload = {
          name: values.name.trim(),
          contactName: stringOrUndefined(values.contactName),
          email: stringOrUndefined(values.email),
          phone: stringOrUndefined(values.phone),
          address: stringOrUndefined(values.address),
        };
        return createCustomer(payload);
      },
      resetValues: buildFieldValues(customerFields),
      successMessage: (record) => `Customer ${(record as CustomerRecord).id} created`,
      mutateKeys: ['/admin/directory/customers', '/admin/assignments/customers/unassigned'],
    },
    {
      key: 'centers',
      label: 'Centers',
      color: '#f59e0b',
      fields: centerFields,
      submitLabel: 'Create Center',
      create: async (values) => {
        const payload: CenterCreatePayload = {
          name: values.name.trim(),
          contactName: stringOrUndefined(values.contactName),
          email: stringOrUndefined(values.email),
          phone: stringOrUndefined(values.phone),
          address: stringOrUndefined(values.address),
        };
        return createCenter(payload);
      },
      resetValues: buildFieldValues(centerFields),
      successMessage: (record) => `Center ${(record as CenterRecord).id} created`,
      mutateKeys: ['/admin/directory/centers', '/admin/assignments/centers/unassigned'],
    },
    {
      key: 'crew',
      label: 'Crew',
      color: '#ef4444',
      fields: crewFields,
      submitLabel: 'Create Crew',
      create: async (values) => {
        const payload: CrewCreatePayload = {
          name: values.name.trim(),
          role: stringOrUndefined(values.role),
          email: stringOrUndefined(values.email),
          phone: stringOrUndefined(values.phone),
          address: stringOrUndefined(values.address),
        };
        return createCrew(payload);
      },
      resetValues: buildFieldValues(crewFields),
      successMessage: (record) => `Crew ${(record as CrewRecord).id} created`,
      mutateKeys: ['/admin/directory/crew', '/admin/assignments/crew/unassigned'],
    },
    {
      key: 'warehouses',
      label: 'Warehouses',
      color: '#8b5cf6',
      fields: warehouseFields,
      submitLabel: 'Create Warehouse',
      create: async (values) => {
        const payload: WarehouseCreatePayload = {
          name: values.name.trim(),
          managerId: stringOrUndefined(values.managerId),
          email: stringOrUndefined(values.email),
          phone: stringOrUndefined(values.phone),
          warehouseType: stringOrUndefined(values.warehouseType),
          address: stringOrUndefined(values.address),
        };
        return createWarehouse(payload);
      },
      resetValues: buildFieldValues(warehouseFields),
      successMessage: (record) => `Warehouse ${(record as WarehouseRecord).id} created`,
      mutateKeys: ['/admin/directory/warehouses'],
    },
  ];

  return configs;
}

export default function AdminCreateSection() {
  const tabConfigs = useMemo(() => buildTabConfigs(), []);
  const tabMap = useMemo(
    () =>
      tabConfigs.reduce<Record<TabKey, TabConfig<unknown>>>(
        (acc, config) => {
          acc[config.key] = config;
          return acc;
        },
        {} as Record<TabKey, TabConfig<unknown>>,
      ),
    [tabConfigs],
  );

  const initialForms = useMemo(() => {
    const entries = Object.entries(tabMap).map(([key, config]) => {
      return [key, { ...config.resetValues }];
    });
    return Object.fromEntries(entries) as FormState;
  }, [tabMap]);

  const initialStatus = useMemo(() => {
    const entries = Object.keys(tabMap).map((key) => [key, { loading: false, error: null, success: null }]);
    return Object.fromEntries(entries) as SubmissionMap;
  }, [tabMap]);

  const [activeTab, setActiveTab] = useState<TabKey>('managers');
  const [forms, setForms] = useState<FormState>(initialForms);
  const [statuses, setStatuses] = useState<SubmissionMap>(initialStatus);
  const { mutate } = useSWRConfig();

  function updateField(tab: TabKey, field: string, value: string) {
    setForms((prev) => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [field]: value,
      },
    }));
  }

  async function handleSubmit(event: React.FormEvent, tab: TabKey) {
    event.preventDefault();
    const config = tabMap[tab];
    if (!config) {
      return;
    }

    setStatuses((prev) => ({
      ...prev,
      [tab]: { loading: true, error: null, success: null },
    }));

    const values = forms[tab];

    try {
      const record = await config.create(values);
      setStatuses((prev) => ({
        ...prev,
        [tab]: {
          loading: false,
          error: null,
          success: config.successMessage(record),
        },
      }));
      setForms((prev) => ({
        ...prev,
        [tab]: { ...config.resetValues },
      }));
      await Promise.all(config.mutateKeys.map((key) => mutate(key, undefined, { revalidate: true })));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request failed';
      setStatuses((prev) => ({
        ...prev,
        [tab]: { loading: false, error: message, success: null },
      }));
    }
  }

  const activeConfig = tabMap[activeTab];
  const activeStatus = statuses[activeTab];
  const activeValues = forms[activeTab];

  return (
    <PageWrapper title="Create" headerSrOnly>
      <TabContainer variant="pills" spacing="compact">
        {tabConfigs.map((tab) => (
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
        <StatusMessage state={activeStatus} />
        {activeConfig ? (
          <form onSubmit={(event) => handleSubmit(event, activeConfig.key)}>
            <div
              style={{
                padding: 24,
                background: '#fff',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 1px rgba(15, 23, 42, 0.04)',
              }}
            >
              <FormTable
                fields={activeConfig.fields}
                values={activeValues}
                disabled={activeStatus.loading}
                onChange={(name, value) => updateField(activeConfig.key, name, value)}
              />
              <div style={{ marginTop: 24 }}>
                <Button type="submit" variant="primary" roleColor={activeConfig.color} disabled={activeStatus.loading}>
                  {activeConfig.submitLabel}
                </Button>
              </div>
            </div>
          </form>
        ) : null}
      </div>
    </PageWrapper>
  );
}


