function getReportsToOptions(role: string | undefined): Array<{ value: string; label: string }> {
  if (!role) return [];
  return MANAGER_REPORTS_TO_MAP[role] || [];
}

function stringOrUndefined(val: string | undefined): string | undefined {
  return val && val.trim() ? val.trim() : undefined;
}
import { Button, NavigationTab, PageWrapper, TabContainer } from '@cks/ui';
import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSWRConfig } from 'swr';
import {
  createCenter,
  createContractor,
  createCrew,
  createCustomer,
  createManager,
  createWarehouse,
  type CenterCreatePayload,
  type ContractorCreatePayload,
  type CrewCreatePayload,
  type CustomerCreatePayload,
  type ManagerCreatePayload,
  type WarehouseCreatePayload
} from '../../shared/api/provisioning';
import { createAccessCode } from '../../shared/api/access';
import {
  approveCatalogServiceRequest,
  createCatalogProduct,
  createCatalogService,
  getCatalogCategories,
  listCatalogServiceRequests,
  rejectCatalogServiceRequest,
  uploadCatalogImage,
  type CatalogServiceRequestItem,
  type CreateCatalogProductPayload,
  type CreateCatalogServicePayload,
} from '../../shared/api/admin';

type TabKey = 'managers' | 'contractors' | 'customers' | 'centers' | 'crew' | 'warehouses' | 'accessCodes' | 'products' | 'services';

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
  create: (input: Record<string, string>, getToken?: () => Promise<string | null>) => Promise<TRecord>;
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
    { value: 'Strategic Manager', label: 'Strategic Manager' },
  ],
  'Field Manager': [
    { value: 'CEO', label: 'CEO' },
    { value: 'Strategic Manager', label: 'Strategic Manager' },
    { value: 'Operations Manager', label: 'Operations Manager' },
  ],
  'Development Manager': [
    { value: 'CEO', label: 'CEO' },
    { value: 'Strategic Manager', label: 'Strategic Manager' },
  ],
};

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
          const isSelectLike = field.control === 'select' || resolvedOptions.length > 0;
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
                    disabled={fieldDisabled || (isSelectLike && resolvedOptions.length === 0)}
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
      control: 'select',
      getOptions: (values) => getReportsToOptions(values.role),
      placeholder: (values) => (values.role ? 'Select Reports To (optional)' : 'Select Role First'),
      disabled: (values) => !values.role,
    },
    { name: 'address', label: 'Address', required: true, placeholder: '123 Main St, Springfield' },
  ];

  const contractorFields: FieldConfig[] = [
    { name: 'name', label: 'Contractor Name', required: true, placeholder: 'Acme Facilities' },
    { name: 'mainContact', label: 'Main Contact', required: true, placeholder: 'Primary contact name' },
    { name: 'email', label: 'Email', required: true, inputType: 'email', placeholder: 'contact@acme.com' },
    { name: 'phone', label: 'Phone', required: true, inputType: 'tel', placeholder: '(555) 987-6543' },
    { name: 'address', label: 'Address', required: true, placeholder: 'Street, City, State' },
  ];

  const customerFields: FieldConfig[] = [
    { name: 'name', label: 'Customer Name', required: true, placeholder: 'Sunrise Clinics' },
    { name: 'mainContact', label: 'Main Contact', required: true, placeholder: 'Primary contact name' },
    { name: 'email', label: 'Email', required: true, inputType: 'email', placeholder: 'contact@sunrise.com' },
    { name: 'phone', label: 'Phone', required: true, inputType: 'tel', placeholder: '(555) 123-7890' },
    { name: 'address', label: 'Address', required: true, placeholder: 'Street, City, State' },
  ];

  const centerFields: FieldConfig[] = [
    { name: 'name', label: 'Center Name', required: true, placeholder: 'Downtown Campus' },
    { name: 'mainContact', label: 'Main Contact', required: true, placeholder: 'Primary contact name' },
    { name: 'email', label: 'Email', required: true, inputType: 'email', placeholder: 'center@example.com' },
    { name: 'phone', label: 'Phone', required: true, inputType: 'tel', placeholder: '(555) 654-3210' },
    { name: 'address', label: 'Address', required: true, placeholder: 'Street, City, State' },
  ];

  const crewFields: FieldConfig[] = [
    { name: 'name', label: 'Crew Name', required: true, placeholder: 'Alpha Team' },
    { name: 'emergencyContact', label: 'Emergency Contact', required: true, placeholder: 'Maria Martinez (555) 890-5678' },
    { name: 'email', label: 'Email', required: true, inputType: 'email', placeholder: 'crew@example.com' },
    { name: 'phone', label: 'Phone', required: true, inputType: 'tel', placeholder: '(555) 222-1111' },
    { name: 'address', label: 'Address', required: true, placeholder: 'Street, City, State' },
  ];

  const warehouseFields: FieldConfig[] = [
    { name: 'name', label: 'Warehouse Name', required: true, placeholder: 'North Logistics Hub' },
    { name: 'mainContact', label: 'Main Contact', required: true, placeholder: 'Primary contact name' },
    { name: 'email', label: 'Email', required: true, inputType: 'email', placeholder: 'warehouse@example.com' },
    { name: 'phone', label: 'Phone', required: true, inputType: 'tel', placeholder: '(555) 777-8888' },
    { name: 'address', label: 'Address', required: true, placeholder: 'Street, City, State' },
  ];

  const productFields: FieldConfig[] = [
    { name: 'name', label: 'Product Name', required: true, placeholder: 'e.g. HEPA Vacuum Bags (Box of 10)' },
    { name: 'category', label: 'Category', required: true, control: 'select', options: [], placeholder: 'Select category' },
    { name: 'description', label: 'Description', multiline: true, placeholder: 'Describe the product, including packaging/quantity details...' },
  ];

  const serviceFields: FieldConfig[] = [
    { name: 'name', label: 'Service Name', required: true, placeholder: 'e.g. Deep Carpet Extraction' },
    { name: 'category', label: 'Category', required: true, control: 'select', options: [], placeholder: 'Select category' },
    { name: 'description', label: 'Description', multiline: true, placeholder: 'Describe the service, scope, and any requirements...' },
  ];

  const accessCodeFields: FieldConfig[] = [
    {
      name: 'targetRole',
      label: 'Target Role',
      required: true,
      control: 'select',
      options: [
        { value: 'manager', label: 'Manager' },
        { value: 'contractor', label: 'Contractor' },
        { value: 'customer', label: 'Customer' },
        { value: 'center', label: 'Center' },
        { value: 'crew', label: 'Crew' },
        { value: 'warehouse', label: 'Warehouse' },
      ],
      placeholder: 'Select role',
    },
    {
      name: 'tier',
      label: 'Tier',
      required: true,
      control: 'select',
      options: [
        { value: 'free', label: 'Free' },
        { value: 'premium', label: 'Premium' },
      ],
      placeholder: 'Select tier',
    },
    {
      name: 'maxRedemptions',
      label: 'Max Redemptions',
      required: true,
      placeholder: '1',
    },
    {
      name: 'scopeCode',
      label: 'Scope Code',
      placeholder: 'Optional (e.g., MGR-001)',
    },
    {
      name: 'expiresAt',
      label: 'Expires At',
      placeholder: 'Optional (YYYY-MM-DD)',
    },
    {
      name: 'notes',
      label: 'Notes',
      multiline: true,
      placeholder: 'Optional usage notes',
    },
  ];

  const configs: TabConfig<unknown>[] = [
    {
      key: 'managers',
      label: 'Managers',
      color: '#3b82f6',
      fields: managerFields,
      submitLabel: 'Create Manager',
      create: async (values, getToken) => {
        const payload: ManagerCreatePayload = {
          fullName: values.fullName.trim(),
          territory: values.territory.trim(),
          phone: values.phone.trim(),
          email: values.email.trim(),
          role: values.role,
          reportsTo: stringOrUndefined(values.reportsTo),
          address: values.address.trim(),
        };
        return createManager(payload, getToken);
      },
      resetValues: buildFieldValues(managerFields),
      successMessage: () => 'Manager created successfully',
      mutateKeys: ['/admin/directory/managers'],
    },
    {
      key: 'contractors',
      label: 'Contractors',
      color: '#10b981',
      fields: contractorFields,
      submitLabel: 'Create Contractor',
      create: async (values, getToken) => {
        const payload: ContractorCreatePayload = {
          name: values.name.trim(),
          mainContact: values.mainContact.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          address: values.address.trim(),
        };
        return createContractor(payload, getToken);
      },
      resetValues: buildFieldValues(contractorFields),
      successMessage: () => 'Contractor created',
      mutateKeys: ['/admin/directory/contractors', '/admin/assignments/contractors/unassigned'],
    },
    {
      key: 'customers',
      label: 'Customers',
      color: '#eab308',
      fields: customerFields,
      submitLabel: 'Create Customer',
      create: async (values, getToken) => {
        const payload: CustomerCreatePayload = {
          name: values.name.trim(),
          mainContact: values.mainContact.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          address: values.address.trim(),
        };
        return createCustomer(payload, getToken);
      },
      resetValues: buildFieldValues(customerFields),
      successMessage: () => 'Customer created',
      mutateKeys: ['/admin/directory/customers', '/admin/assignments/customers/unassigned'],
    },
    {
      key: 'centers',
      label: 'Centers',
      color: '#f59e0b',
      fields: centerFields,
      submitLabel: 'Create Center',
      create: async (values, getToken) => {
        const payload: CenterCreatePayload = {
          name: values.name.trim(),
          mainContact: values.mainContact.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          address: values.address.trim(),
        };
        return createCenter(payload, getToken);
      },
      resetValues: buildFieldValues(centerFields),
      successMessage: () => 'Center created',
      mutateKeys: ['/admin/directory/centers', '/admin/assignments/centers/unassigned'],
    },
    {
      key: 'crew',
      label: 'Crew',
      color: '#ef4444',
      fields: crewFields,
      submitLabel: 'Create Crew',
      create: async (values, getToken) => {
        const payload: CrewCreatePayload = {
          name: values.name.trim(),
          emergencyContact: values.emergencyContact.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          address: values.address.trim(),
        };
        return createCrew(payload, getToken);
      },
      resetValues: buildFieldValues(crewFields),
      successMessage: () => 'Crew created',
      mutateKeys: ['/admin/directory/crew', '/admin/assignments/crew/unassigned'],
    },
    {
      key: 'warehouses',
      label: 'Warehouses',
      color: '#8b5cf6',
      fields: warehouseFields,
      submitLabel: 'Create Warehouse',
      create: async (values, getToken) => {
        const payload: WarehouseCreatePayload = {
          name: values.name.trim(),
          mainContact: values.mainContact.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          address: values.address.trim(),
        };
        return createWarehouse(payload, getToken);
      },
      resetValues: buildFieldValues(warehouseFields),
      successMessage: () => 'Warehouse created',
      mutateKeys: ['/admin/directory/warehouses'],
    },
    {
      key: 'products',
      label: 'Products',
      color: '#0891b2',
      fields: productFields,
      submitLabel: 'Create Product',
      create: async (values, getToken) => {
        if (values.category === '__new__' && !stringOrUndefined(values._newCategory)) {
          throw new Error('New category is required');
        }
        const payload: CreateCatalogProductPayload = {
          name: values.name.trim(),
          description: stringOrUndefined(values.description),
          category: values.category === '__new__' ? stringOrUndefined(values._newCategory) : stringOrUndefined(values.category),
        };
        return createCatalogProduct(payload, { getToken });
      },
      resetValues: buildFieldValues(productFields),
      successMessage: (record: any) => `Product created: ${record.productId ?? ''}`.trim(),
      mutateKeys: ['/catalog/items', '/catalog/categories', '/admin/directory/activities'],
    },
    {
      key: 'services',
      label: 'Services',
      color: '#d946ef',
      fields: serviceFields,
      submitLabel: 'Create Service',
      create: async (values, getToken) => {
        if (values.category === '__new__' && !stringOrUndefined(values._newCategory)) {
          throw new Error('New category is required');
        }
        const payload: CreateCatalogServicePayload = {
          name: values.name.trim(),
          description: stringOrUndefined(values.description),
          category: values.category === '__new__' ? stringOrUndefined(values._newCategory) : stringOrUndefined(values.category),
        };
        return createCatalogService(payload, { getToken });
      },
      resetValues: buildFieldValues(serviceFields),
      successMessage: (record: any) =>
        record?.status === 'pending_approval'
          ? `Service request submitted: ${record.requestId ?? ''}`.trim()
          : `Service created: ${record?.serviceId ?? ''}`.trim(),
      mutateKeys: ['/catalog/items', '/catalog/categories', '/admin/directory/activities'],
    },
    {
      key: 'accessCodes',
      label: 'Access Codes',
      color: '#2563eb',
      fields: accessCodeFields,
      submitLabel: 'Create Access Code',
      create: async (values, getToken) => {
        const maxRedemptions = Number(values.maxRedemptions);
        const payload = {
          targetRole: values.targetRole.trim(),
          tier: values.tier.trim() as 'free' | 'premium',
          maxRedemptions: Number.isNaN(maxRedemptions) ? 1 : maxRedemptions,
          scopeCode: stringOrUndefined(values.scopeCode),
          notes: stringOrUndefined(values.notes),
          expiresAt: stringOrUndefined(values.expiresAt),
        };
        return createAccessCode(payload, { getToken });
      },
      resetValues: buildFieldValues(accessCodeFields),
      successMessage: (record: any) => `Access code created: ${record.code ?? ''}`.trim(),
      mutateKeys: [],
    },
  ];

  return configs;
}

const CATALOG_TABS: TabKey[] = ['products', 'services'];

export default function AdminCreateSection() {
  const { getToken } = useAuth();
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
  const [serviceRequests, setServiceRequests] = useState<CatalogServiceRequestItem[]>([]);
  const [serviceRequestsLoading, setServiceRequestsLoading] = useState(false);
  const [serviceRequestsError, setServiceRequestsError] = useState<string | null>(null);
  const [serviceRequestActionId, setServiceRequestActionId] = useState<string | null>(null);

  // ── Category dropdown data ──────────────────────────────────────────
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!CATALOG_TABS.includes(activeTab)) return;
    let cancelled = false;
    getCatalogCategories({ getToken }).then((data) => {
      if (cancelled) return;
      setProductCategories(data.products);
      setServiceCategories(data.services);
    }).catch(() => {
      // Keep "Add New Category" available even if category fetch fails.
    });
    return () => {
      cancelled = true;
    };
  }, [activeTab, getToken]);

  useEffect(() => {
    if (activeTab !== 'services') return;
    let cancelled = false;
    const load = async () => {
      setServiceRequestsLoading(true);
      setServiceRequestsError(null);
      try {
        const rows = await listCatalogServiceRequests({ status: 'pending', limit: 200 }, { getToken });
        if (!cancelled) {
          setServiceRequests(rows);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Failed to load service requests';
          setServiceRequestsError(message);
        }
      } finally {
        if (!cancelled) {
          setServiceRequestsLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [activeTab, getToken]);

  // ── Photo upload state (products/services only) ─────────────────────
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }, [photoPreview]);

  const clearPhoto = useCallback(() => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [photoPreview]);

  // Clear photo when switching tabs
  useEffect(() => {
    clearPhoto();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  function updateField(tab: TabKey, field: string, value: string) {
    setForms((prev) => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [field]: value,
      },
    }));
  }

  // Resolve dynamic category options for product/service tabs
  function getFieldsWithCategories(config: TabConfig<unknown>): FieldConfig[] {
    if (config.key !== 'products' && config.key !== 'services') return config.fields;
    const cats = config.key === 'products' ? productCategories : serviceCategories;
    return config.fields.map((field) => {
      if (field.name !== 'category') return field;
      return {
        ...field,
        options: [
          ...cats.map((c) => ({ value: c, label: c })),
          { value: '__new__', label: '+ Add New Category' },
        ],
      };
    });
  }

  const isCatalogTab = CATALOG_TABS.includes(activeTab);

  async function refreshServiceRequests() {
    try {
      const rows = await listCatalogServiceRequests({ status: 'pending', limit: 200 }, { getToken });
      setServiceRequests(rows);
      setServiceRequestsError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load service requests';
      setServiceRequestsError(message);
    }
  }

  async function handleApproveServiceRequest(requestId: string) {
    setServiceRequestActionId(requestId);
    try {
      const result = await approveCatalogServiceRequest(requestId, {}, { getToken });
      await Promise.all([
        mutate('/catalog/items', undefined, { revalidate: true }),
        mutate('/catalog/categories', undefined, { revalidate: true }),
        mutate('/admin/directory/activities', undefined, { revalidate: true }),
      ]);
      setStatuses((prev) => ({
        ...prev,
        services: {
          loading: false,
          error: null,
          success: `Approved request ${result.data.requestId} -> ${result.data.serviceId}`,
        },
      }));
      await refreshServiceRequests();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve service request';
      setServiceRequestsError(message);
    } finally {
      setServiceRequestActionId(null);
    }
  }

  async function handleRejectServiceRequest(requestId: string) {
    const notes = window.prompt('Enter rejection reason (required):', '');
    if (!notes || !notes.trim()) {
      return;
    }
    setServiceRequestActionId(requestId);
    try {
      await rejectCatalogServiceRequest(requestId, { notes: notes.trim() }, { getToken });
      await mutate('/admin/directory/activities', undefined, { revalidate: true });
      setStatuses((prev) => ({
        ...prev,
        services: {
          loading: false,
          error: null,
          success: `Rejected request ${requestId}`,
        },
      }));
      await refreshServiceRequests();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject service request';
      setServiceRequestsError(message);
    } finally {
      setServiceRequestActionId(null);
    }
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
      const record = await config.create(values, getToken);

      // Upload photo if one was selected (products/services only)
      if (photoFile && CATALOG_TABS.includes(tab)) {
        const itemType = tab === 'products' ? 'product' : 'service';
        const itemId = (record as any).productId ?? (record as any).serviceId;
        if (itemId) {
          try {
            await uploadCatalogImage(photoFile, itemType as 'product' | 'service', itemId, { getToken });
          } catch (uploadError) {
            console.warn('Photo upload failed after creation:', uploadError);
          }
        }
      }

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
      clearPhoto();
      try {
        await Promise.all(config.mutateKeys.map((key) => mutate(key, undefined, { revalidate: true })));
      } catch (mutateError) {
        console.error('Failed to invalidate cache:', mutateError);
      }
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
  const resolvedFields = activeConfig ? getFieldsWithCategories(activeConfig) : [];
  const showNewCategoryInput = isCatalogTab && activeValues?.category === '__new__';

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
          <>
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
                  fields={resolvedFields}
                  values={activeValues}
                  disabled={activeStatus.loading}
                  onChange={(name, value) => updateField(activeConfig.key, name, value)}
                />

                {showNewCategoryInput && (
                  <table style={{ width: '100%', borderSpacing: '0 16px' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: 150, verticalAlign: 'top', paddingRight: 16 }}>
                          <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>New Category *</label>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={activeValues._newCategory ?? ''}
                            onChange={(e) => updateField(activeConfig.key, '_newCategory', e.target.value)}
                            placeholder="Enter new category name"
                            disabled={activeStatus.loading}
                            style={{ width: '320px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {isCatalogTab && (
                  <table style={{ width: '100%', borderSpacing: '0 16px' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: 150, verticalAlign: 'top', paddingRight: 16 }}>
                          <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>Photo</label>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoSelect}
                              disabled={activeStatus.loading}
                              style={{ fontSize: 13 }}
                            />
                            {photoPreview && (
                              <div style={{ position: 'relative' }}>
                                <img
                                  src={photoPreview}
                                  alt="Preview"
                                  style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }}
                                />
                                <button
                                  type="button"
                                  onClick={clearPhoto}
                                  style={{
                                    position: 'absolute', top: -6, right: -6,
                                    width: 20, height: 20, borderRadius: '50%',
                                    background: '#ef4444', color: '#fff', border: 'none',
                                    fontSize: 12, cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                  }}
                                >
                                  x
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}

                <div style={{ marginTop: 24 }}>
                  <Button type="submit" variant="primary" roleColor={activeConfig.color} disabled={activeStatus.loading}>
                    {activeConfig.submitLabel}
                  </Button>
                </div>
              </div>
            </form>

            {activeTab === 'services' && (
              <div
                style={{
                  marginTop: 16,
                  padding: 20,
                  background: '#fff',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 1px rgba(15, 23, 42, 0.04)',
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>
                  Pending Service Requests
                </div>
                {serviceRequestsLoading ? (
                  <div style={{ fontSize: 13, color: '#2563eb' }}>Loading pending requests...</div>
                ) : serviceRequestsError ? (
                  <div style={{ fontSize: 13, color: '#dc2626' }}>{serviceRequestsError}</div>
                ) : serviceRequests.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#64748b' }}>No pending requests.</div>
                ) : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {serviceRequests.map((item) => {
                      const isActioning = serviceRequestActionId === item.requestId;
                      return (
                        <div
                          key={item.requestId}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                            padding: 12,
                            display: 'grid',
                            gap: 8,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                              {item.serviceName}
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>
                              {item.requestId}
                            </div>
                          </div>
                          <div style={{ fontSize: 12, color: '#475569' }}>
                            {item.requesterRole === 'warehouse' ? 'Warehouse' : 'Manager'}: {item.requesterName || item.requesterId || item.managerName || item.managerId} | Category: {item.category} | Requested:{' '}
                            {new Date(item.requestedAt).toLocaleDateString()}
                          </div>
                          {item.description ? (
                            <div style={{ fontSize: 13, color: '#1f2937' }}>{item.description}</div>
                          ) : null}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Button
                              variant="primary"
                              size="small"
                              onClick={() => handleApproveServiceRequest(item.requestId)}
                              disabled={isActioning}
                            >
                              {isActioning ? 'Working...' : 'Approve'}
                            </Button>
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => handleRejectServiceRequest(item.requestId)}
                              disabled={isActioning}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </PageWrapper>
  );
}







