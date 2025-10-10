/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: AdminHub.tsx
 *
 * Description:
 * Administrator hub container that wires dashboard metrics,
 * directory views, create/assign flows, and support tools.
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import {
  AdminSupportSection,
  ArchiveSection,
  MemosPreview,
  NewsPreview,
  OverviewSection,
  RecentActivity,
  ReportDetailsModal,
  type Activity,
} from '@cks/domain-widgets';
import {
  ActionModal,
  Button,
  DataTable,
  EditOrderModal,
  NavigationTab,
  OrderDetailsModal,
  ProductOrderModal,
  ServiceOrderModal,
  ServiceViewModal,
  PageHeader,
  PageWrapper,
  Scrollbar,
  TabContainer,
  CatalogServiceModal,
} from '@cks/ui';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSWRConfig } from 'swr';

import MyHubSection from '../components/MyHubSection';
import { useLogout } from '../hooks/useLogout';
import { useAuth } from '@cks/auth';
import { archiveAPI, type EntityType } from '../shared/api/archive';
import '../shared/api/test-archive'; // Temporary test import
import AdminAssignSection from './components/AdminAssignSection';
import AdminCreateSection from './components/AdminCreateSection';
import { useHubLoading } from '../contexts/HubLoadingContext';

import { useAdminUsers, updateInventory, fetchAdminOrderById } from '../shared/api/admin';
import {
  useActivities,
  useCenters,
  useContractors,
  useCrew,
  useCustomers,
  useFeedback,
  useManagers,
  useOrders,
  useProcedures,
  useProducts,
  useReports,
  useServices,
  useTraining,
  useWarehouses,
} from '../shared/api/directory';
import {
  applyHubOrderAction,
  updateOrderFields,
  useHubProfile,
  type HubOrderItem,
  type OrderActionRequest,
  type UpdateOrderFieldsRequest,
} from '../shared/api/hub';

// Removed unused: const MILLIS_PER_DAY = 1000 * 60 * 60 * 24;

interface AdminHubProps {
  initialTab?: string;
}

const GO_LIVE_DATE_INPUT = (import.meta as any).env?.VITE_GO_LIVE_DATE as string | undefined;
const GO_LIVE_TIMESTAMP = (() => {
  if (!GO_LIVE_DATE_INPUT) {
    return null;
  }
  const parsed = new Date(GO_LIVE_DATE_INPUT);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
})();

type StatusPalette = {
  bg: string;
  fg: string;
};

const STATUS_PALETTES: Record<string, StatusPalette> = {
  active: { bg: '#dcfce7', fg: '#16a34a' },
  available: { bg: '#dcfce7', fg: '#16a34a' },
  operational: { bg: '#dcfce7', fg: '#16a34a' },
  open: { bg: '#dcfce7', fg: '#16a34a' },
  pending: { bg: '#fef3c7', fg: '#d97706' },
  in_progress: { bg: '#fef3c7', fg: '#d97706' },
  processing: { bg: '#fef3c7', fg: '#d97706' },
  scheduled: { bg: '#fef3c7', fg: '#d97706' },
  suspended: { bg: '#fee2e2', fg: '#dc2626' },
  archived: { bg: '#fee2e2', fg: '#dc2626' },
  inactive: { bg: '#fee2e2', fg: '#dc2626' },
  closed: { bg: '#fee2e2', fg: '#dc2626' },
  cancelled: { bg: '#fee2e2', fg: '#dc2626' },
  unassigned: { bg: '#e0f2fe', fg: '#0369a1' },
  unknown: { bg: '#e2e8f0', fg: '#475569' },
};

function renderStatusBadge(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.toLowerCase().trim().replace(/\s+/g, '_');
  const palette = STATUS_PALETTES[normalized] ?? STATUS_PALETTES.unknown;
  const label = value.replace(/_/g, ' ');
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 12px',
        borderRadius: '999px',
        fontSize: 12,
        fontWeight: 500,
        backgroundColor: palette.bg,
        color: palette.fg,
      }}
    >
      {label}
    </span>
  );
}

function formatDate(value?: string | null): string {
  if (!value) {
    return 'N/A';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'N/A';
  }
  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatText(value?: string | null): string {
  if (!value) {
    return 'N/A';
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : 'N/A';
}

const HUB_TABS = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { id: 'directory', label: 'Directory', path: '/directory' },
  { id: 'create', label: 'Create', path: '/create' },
  { id: 'assign', label: 'Assign', path: '/assign' },
  { id: 'archive', label: 'Archive', path: '/archive' },
  { id: 'support', label: 'Support', path: '/support' },
];

const DIRECTORY_TABS: Array<{ id: string; label: string; color: string; hasDropdown?: boolean; dropdownOptions?: Array<{ id: string; label: string }> }> = [
  { id: 'admins', label: 'Admins', color: '#0f172a' },
  { id: 'managers', label: 'Managers', color: '#2563eb' },
  { id: 'contractors', label: 'Contractors', color: '#10b981' },
  { id: 'customers', label: 'Customers', color: '#eab308' },
  { id: 'centers', label: 'Centers', color: '#f97316' },
  { id: 'crew', label: 'Crew', color: '#ef4444' },
  { id: 'warehouses', label: 'Warehouses', color: '#8b5cf6' },
  {
    id: 'services',
    label: 'Services',
    color: '#14b8a6',
    hasDropdown: true,
    dropdownOptions: [
      { id: 'catalog-services', label: 'Catalog Services' },
      { id: 'active-services', label: 'Active Services' },
    ]
  },
  { id: 'products', label: 'Products', color: '#d946ef' },
  {
    id: 'orders',
    label: 'Orders',
    color: '#6366f1',
    hasDropdown: true,
    dropdownOptions: [
      { id: 'product-orders', label: 'Product Orders' },
      { id: 'service-orders', label: 'Service Orders' },
    ]
  },
  { id: 'training', label: 'Training & Procedures', color: '#ec4899' },
  { id: 'reports', label: 'Reports & Feedback', color: '#92400e' },
];

interface DirectorySectionConfig {
  columns: Array<{ key: string; label: string; clickable?: boolean; render?: (value: any, row?: any) => ReactNode }>;
  data: Record<string, any>[];
  emptyMessage: string;
}

export default function AdminHub({ initialTab = 'dashboard' }: AdminHubProps) {
  const { code, firstName, fullName } = useAuth();
  const { setHubLoading } = useHubLoading();

  // Dynamic overview cards for admin metrics
  const overviewCards = [
    { id: 'users', title: 'Total Users', dataKey: 'userCount', color: 'blue' },
    { id: 'tickets', title: 'Open Support Tickets', dataKey: 'ticketCount', color: 'orange' },
    { id: 'priority', title: 'High Priority', dataKey: 'highPriorityCount', color: 'red' },
    { id: 'days', title: 'Days Online', dataKey: 'daysOnline', color: 'green' },
  ];
  const [activeTab, setActiveTab] = useState(initialTab);
  const [directoryTab, setDirectoryTab] = useState<string>('admins');
  const [servicesSubTab, setServicesSubTab] = useState<string>('catalog-services');
  const [ordersSubTab, setOrdersSubTab] = useState<string>('product-orders');
  const [reportsSubTab, setReportsSubTab] = useState<string>('reports');
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Record<string, any> | null>(null);
  const [showServiceCatalogModal, setShowServiceCatalogModal] = useState(false);
  const [selectedServiceCatalog, setSelectedServiceCatalog] = useState<{ serviceId: string; name: string | null; category: string | null; status?: string | null; description?: string | null; metadata?: any } | null>(null);
  const [serviceAssignSelected, setServiceAssignSelected] = useState<{ managers: string[]; crew: string[]; warehouses: string[] } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // merged assign flow into CatalogServiceModal
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<HubOrderItem | null>(null);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<HubOrderItem | null>(null);
  const [selectedReportForDetails, setSelectedReportForDetails] = useState<any | null>(null);
  const logout = useLogout();
  const { mutate } = useSWRConfig();

  // Helper function to normalize identity (same as in WarehouseHub)
  const normalizeIdentity = (code: string | null | undefined): string | null => {
    if (!code) return null;
    const trimmed = code.trim().toUpperCase();
    return trimmed.length > 0 ? trimmed : null;
  };

  // Fetch destination profile for order details (derive from directory order fields)
  const rawDestinationCode = selectedOrderForDetails
    ? (
        (selectedOrderForDetails as any).destination ||
        (selectedOrderForDetails as any).centerId ||
        // If creator is a center/customer, use creator as destination fallback
        ((['center', 'customer'].includes(((selectedOrderForDetails as any).createdByRole || '').toLowerCase()))
          ? (selectedOrderForDetails as any).createdBy
          : null) ||
        (selectedOrderForDetails as any).customerId ||
        (selectedOrderForDetails as any).assignedWarehouse ||
        null
      )
    : null;
  const { data: destinationProfile } = useHubProfile(rawDestinationCode ? normalizeIdentity(rawDestinationCode) : null);

  // Fetch requestor profile for order details (derive from directory order fields)
  const rawRequestorCode = selectedOrderForDetails
    ? (
        (selectedOrderForDetails as any).requestedBy ||
        (selectedOrderForDetails as any).createdBy ||
        (selectedOrderForDetails as any).centerId ||
        (selectedOrderForDetails as any).customerId ||
        null
      )
    : null;
  const { data: requestorProfile } = useHubProfile(rawRequestorCode ? normalizeIdentity(rawRequestorCode) : null);


  const { data: adminUsers, isLoading: adminUsersLoading, error: adminUsersError } = useAdminUsers();
  const { data: managers, isLoading: managersLoading, error: managersError } = useManagers();
  const { data: contractors, isLoading: contractorsLoading, error: contractorsError } = useContractors();
  const { data: customers, isLoading: customersLoading, error: customersError } = useCustomers();
  const { data: centers, isLoading: centersLoading, error: centersError } = useCenters();
  const { data: crew, isLoading: crewLoading, error: crewError } = useCrew();
  const { data: warehouses, isLoading: warehousesLoading, error: warehousesError } = useWarehouses();
  const { data: services, isLoading: servicesLoading, error: servicesError } = useServices();
  const { data: orders, isLoading: ordersLoading, error: ordersError } = useOrders();
  const { data: products, isLoading: productsLoading, error: productsError } = useProducts();
  const { data: trainingRecords, isLoading: trainingLoading, error: trainingError } = useTraining();
  const { data: procedures, isLoading: proceduresLoading, error: proceduresError } = useProcedures();
  const { data: reports, isLoading: reportsLoading, error: reportsError } = useReports();
  const { data: feedbackEntries, isLoading: feedbackLoading, error: feedbackError } = useFeedback();
  const { data: activityItems, isLoading: activitiesLoading, error: activitiesError } = useActivities();

  const [activityFeed, setActivityFeed] = useState<Activity[]>([]);

  // Signal when critical data is loaded
  useEffect(() => {
    const hasCriticalData = !!activityItems && !activitiesLoading;
    if (hasCriticalData) {
      console.log('[AdminHub] Critical data loaded, signaling ready');
      setHubLoading(false);
    }
  }, [activityItems, activitiesLoading, setHubLoading]);

  // Admin fallback profile resolver using directory data
  const getDirectoryProfile = useCallback(
    (code?: string | null): { name: string | null; address: string | null; phone: string | null; email: string | null } | null => {
      if (!code) return null;
      const id = normalizeIdentity(code);
      if (!id) return null;
      const prefix = id.split('-')[0];
      if (prefix === 'CEN') {
        const item = centers.find((x) => (x.id || '').toUpperCase() === id);
        return item ? { name: item.name ?? item.id, address: item.address ?? null, phone: item.phone ?? null, email: item.email ?? null } : null;
      }
      if (prefix === 'CUS') {
        const item = customers.find((x) => (x.id || '').toUpperCase() === id);
        return item ? { name: item.name ?? item.id, address: item.address ?? null, phone: item.phone ?? null, email: item.email ?? null } : null;
      }
      if (prefix === 'WHS') {
        const item = warehouses.find((x) => (x.id || '').toUpperCase() === id);
        return item ? { name: item.name ?? item.id, address: item.address ?? null, phone: item.phone ?? null, email: item.email ?? null } : null;
      }
      if (prefix === 'MGR') {
        const item = managers.find((x) => (x.id || '').toUpperCase() === id);
        return item ? { name: item.name ?? item.id, address: item.address ?? null, phone: item.phone ?? null, email: item.email ?? null } : null;
      }
      if (prefix === 'CON') {
        const item = contractors.find((x) => (x.id || '').toUpperCase() === id);
        return item ? { name: item.name ?? item.id, address: item.address ?? null, phone: item.phone ?? null, email: item.email ?? null } : null;
      }
      if (prefix === 'CRW') {
        const item = crew.find((x) => (x.id || '').toUpperCase() === id);
        return item ? { name: item.name ?? item.id, address: item.address ?? null, phone: item.phone ?? null, email: item.email ?? null } : null;
      }
      return null;
    },
    [centers, customers, warehouses, managers, contractors, crew],
  );

  const destinationProfileFromDirectory = useMemo(() => getDirectoryProfile(rawDestinationCode), [getDirectoryProfile, rawDestinationCode]);
  const requestorProfileFromDirectory = useMemo(() => getDirectoryProfile(rawRequestorCode), [getDirectoryProfile, rawRequestorCode]);

  useEffect(() => {
    setActivityFeed(activityItems);
  }, [activityItems]);

  // Ensure Admin order details include items by fetching full order if missing.
  // Prevent loops and ignore late responses if modal is closed.
  const fullOrderCacheRef = useRef(new Map<string, any>());
  const hydrationAttemptRef = useRef<{ orderId: string | null; attempted: boolean }>({ orderId: null, attempted: false });
  useEffect(() => {
    const current = selectedOrderForDetails as any;
    const orderId: string | null = current?.orderId || current?.id || null;
    if (!orderId || !current) {
      hydrationAttemptRef.current = { orderId: null, attempted: false };
      return;
    }

    let cancelled = false;

    // Always try cached values first to enrich missing fields
    const cached = fullOrderCacheRef.current.get(orderId);
    if (cached) {
      setSelectedOrderForDetails((prev) => {
        if (!prev) return prev;
        const prevId = (prev as any).orderId || (prev as any).id;
        if (prevId !== orderId) return prev;
        return {
          ...(prev as any),
          items: (cached as any).items ?? (prev as any).items ?? [],
          notes: (cached as any).notes ?? (prev as any).notes ?? null,
          expectedDate: (cached as any).expectedDate ?? (prev as any).expectedDate ?? null,
          requestedDate: (cached as any).requestedDate ?? (prev as any).requestedDate ?? null,
          metadata: (cached as any).metadata ?? (prev as any).metadata ?? null,
        } as any;
      });
    }

    // Avoid refetching multiple times per open
    const attempted = hydrationAttemptRef.current;
    if (attempted.orderId === orderId && attempted.attempted) {
      return;
    }
    hydrationAttemptRef.current = { orderId, attempted: true };

    (async () => {
      try {
        const full = await fetchAdminOrderById(orderId);
        if (cancelled || !full) return;
        fullOrderCacheRef.current.set(orderId, full as any);
        setSelectedOrderForDetails((prev) => {
          if (!prev) return prev;
          const prevId = (prev as any).orderId || (prev as any).id;
          if (prevId !== orderId) return prev;
          return {
            ...(prev as any),
            items: (full as any).items ?? (prev as any).items ?? [],
            notes: (full as any).notes ?? (prev as any).notes ?? null,
            expectedDate: (full as any).expectedDate ?? (prev as any).expectedDate ?? null,
            requestedDate: (full as any).requestedDate ?? (prev as any).requestedDate ?? null,
            metadata: (full as any).metadata ?? (prev as any).metadata ?? null,
          } as any;
        });
      } catch (e) {
        console.warn('Failed to fetch full order for admin view:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedOrderForDetails]);

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



  const handleModalClose = useCallback(() => {
    setShowActionModal(false);
    setSelectedEntity(null);
  }, []);

  const handleView = useCallback(
    (row: Record<string, any> | null) => {
      if (!row) {
        return;
      }
      setSelectedEntity(row);
      setShowActionModal(true);
    },
    [],
  );

  const handleDelete = useCallback(
    async (entity: Record<string, any>) => {
      // Determine entity type based on the active directory tab and sub-tabs
      let entityType: EntityType | null = null;
      let entityId: string | null = null;

      // Get effective tab (considering sub-tabs)
      const effectiveTab = (() => {
        if (directoryTab === 'services') return servicesSubTab;
        if (directoryTab === 'orders') return ordersSubTab;
        if (directoryTab === 'reports') return reportsSubTab;
        return directoryTab;
      })();

      // Check which tab we're in and extract the appropriate ID
      if ((effectiveTab === 'product-orders' || effectiveTab === 'service-orders') && entity.orderId) {
        entityType = 'order';
        entityId = entity.orderId;
      } else if (directoryTab === 'managers' && entity.manager_id) {
        entityType = 'manager';
        entityId = entity.manager_id;
      } else if (directoryTab === 'contractors' && entity.contractor_id) {
        entityType = 'contractor';
        entityId = entity.contractor_id;
      } else if (directoryTab === 'customers' && entity.customer_id) {
        entityType = 'customer';
        entityId = entity.customer_id;
      } else if (directoryTab === 'centers' && entity.center_id) {
        entityType = 'center';
        entityId = entity.center_id;
      } else if (directoryTab === 'crew' && entity.crew_id) {
        entityType = 'crew';
        entityId = entity.crew_id;
      } else if (directoryTab === 'warehouses' && entity.id) {
        entityType = 'warehouse';
        entityId = entity.id;
      } else if ((effectiveTab === 'catalog-services' || effectiveTab === 'active-services') && entity.id) {
        entityType = 'service';
        entityId = entity.id;
      } else if (directoryTab === 'products' && entity.id) {
        entityType = 'product';
        entityId = (entity as any).rawId || entity.id;
      } else if (effectiveTab === 'reports' && entity.id) {
        entityType = 'report';
        entityId = entity.id;
      } else if (effectiveTab === 'feedback' && entity.id) {
        entityType = 'feedback';
        entityId = entity.id;
      } else if (entity.id) {
        // Fallback to generic id field and guess based on tab
        entityId = entity.id;
        if (directoryTab === 'managers') entityType = 'manager';
        else if (directoryTab === 'contractors') entityType = 'contractor';
        else if (directoryTab === 'customers') entityType = 'customer';
        else if (directoryTab === 'centers') entityType = 'center';
        else if (directoryTab === 'crew') entityType = 'crew';
        else if (directoryTab === 'warehouses') entityType = 'warehouse';
        else if (effectiveTab === 'catalog-services' || effectiveTab === 'active-services') entityType = 'service';
        else if (directoryTab === 'products') entityType = 'product';
        else if (effectiveTab === 'reports') entityType = 'report';
        else if (effectiveTab === 'feedback') entityType = 'feedback';
      }

      if (!entityType || !entityId) {
        alert('Unable to determine entity type or ID for deletion');
        return;
      }

      const confirmDelete = confirm(
        `Are you sure you want to archive ${entityType} ${entityId}?` +
        `This will:` +
        `- Move the ${entityType} to the archive` +
        `- Unassign any children to the unassigned bucket` +
        `- Schedule for permanent deletion in 30 days` +
        `You can restore from the Archive section if needed.`
      );

      if (!confirmDelete) {
        return;
      }

      try {
        const result = await archiveAPI.archiveEntity(entityType, entityId);
        handleModalClose();

        // Refresh the specific data based on entity type
        // This will trigger a re-fetch of the data without page reload
        if (entityType === 'manager') {
          mutate('/admin/directory/managers');
        } else if (entityType === 'contractor') {
          mutate('/admin/directory/contractors');
        } else if (entityType === 'customer') {
          mutate('/admin/directory/customers');
        } else if (entityType === 'center') {
          mutate('/admin/directory/centers');
        } else if (entityType === 'crew') {
          mutate('/admin/directory/crew');
        } else if (entityType === 'warehouse') {
          mutate('/admin/directory/warehouses');
        } else if (entityType === 'service') {
          mutate('/admin/directory/services');
        } else if (entityType === 'product') {
          mutate('/admin/directory/products');
        } else if (entityType === 'order') {
          mutate('/admin/directory/orders');
        } else if (entityType === 'report') {
          mutate('/admin/directory/reports');
        } else if (entityType === 'feedback') {
          mutate('/admin/directory/feedback');
        }

        // Also refresh the archive list
        mutate('/admin/archive/list');

        // Show success message
        const message = `${entityType} ${entityId} has been archived.` +
          (result.unassignedChildren ? `${result.unassignedChildren} children were moved to unassigned.` : '');

        // Use a less intrusive notification (for now still using alert but no page refresh)
        setTimeout(() => {
          alert(message);
        }, 100);
      } catch (error) {
        console.error('Failed to archive entity:', error);
        alert(`Failed to archive ${entityType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    [handleModalClose, directoryTab, servicesSubTab, ordersSubTab, reportsSubTab, mutate],
  );


  // Example: Fix for missing variable declarations and misplaced code
  const overviewData = useMemo(() => {
    // Calculate days online from GO_LIVE_TIMESTAMP
    let daysOnline = 0;
    if (GO_LIVE_TIMESTAMP) {
      const now = Date.now();
      daysOnline = Math.max(0, Math.floor((now - GO_LIVE_TIMESTAMP) / (1000 * 60 * 60 * 24)));
    }

    // Total users: sum all user arrays
    const userCount =
      (adminUsers?.length || 0) +
      (managers?.length || 0) +
      (contractors?.length || 0) +
      (customers?.length || 0) +
      (centers?.length || 0) +
      (crew?.length || 0) +
      (warehouses?.length || 0);

    // Open support tickets: count open reports
    const ticketCount = Array.isArray(reports)
      ? reports.filter((r) => r.status === 'open').length
      : 0;

    // High priority tickets: count reports with severity 'high'
    const highPriorityCount = Array.isArray(reports)
      ? reports.filter((r) => r.severity === 'high').length
      : 0;

    return {
      userCount,
      ticketCount,
      highPriorityCount,
      daysOnline,
    };
  }, [adminUsers, managers, contractors, customers, centers, crew, warehouses, reports, GO_LIVE_TIMESTAMP]);

  const adminRows = useMemo(
    () =>
      adminUsers.map((admin) => ({
        id: admin.id,
        code: (admin.cksCode ?? admin.id).toUpperCase(),
        name: admin.fullName ?? admin.email ?? admin.cksCode ?? admin.id,
        email: formatText(admin.email),
        role: formatText(admin.role),
        status: (admin.status ?? 'unassigned').toLowerCase(),
        createdAt: formatDate(admin.createdAt),
      })),
    [adminUsers],
  );

  const managerRows = useMemo(
    () =>
      managers.map((manager) => ({
        id: manager.id,
        managerId: manager.id,
        name: formatText(manager.name),
        territory: formatText(manager.territory),
        email: formatText(manager.email),
        phone: formatText(manager.phone),
        status: (manager.status ?? 'unassigned').toLowerCase(),
        createdAt: formatDate(manager.createdAt),
      })),
    [managers],
  );

  const contractorRows = useMemo(
    () =>
      contractors.map((contractor) => ({
        id: contractor.id,
        name: formatText(contractor.name),
        mainContact: formatText(contractor.mainContact),
        managerId: formatText(contractor.managerId),
        email: formatText(contractor.email),
        phone: formatText(contractor.phone),
        status: (contractor.status ?? 'unassigned').toLowerCase(),
        createdAt: formatDate(contractor.createdAt),
      })),
    [contractors],
  );
  const customerRows = useMemo(
    () =>
      customers.map((customer) => ({
        id: customer.id,
        name: formatText(customer.name),
        email: formatText(customer.email),
        phone: formatText(customer.phone),
        status: customer.status?.toLowerCase() ?? null,
        createdAt: formatDate(customer.createdAt),
      })),
    [customers],
  );
  const centerRows = useMemo(
    () =>
      centers.map((center) => ({
        id: center.id,
        name: formatText(center.name),
        contractorId: formatText(center.contractorId),
        customerId: formatText(center.customerId),
        managerId: formatText(center.managerId),
        mainContact: formatText(center.mainContact),
        email: formatText(center.email),
        phone: formatText(center.phone),
        status: center.customerId ? 'active' : 'unassigned',
        createdAt: formatDate(center.createdAt),
      })),
    [centers],
  );
  const crewRows = useMemo(
    () =>
      crew.map((member) => ({
        id: member.id,
        name: formatText(member.name),
        emergencyContact: formatText(member.emergencyContact),
        email: formatText(member.email),
        phone: formatText(member.phone),
        assignedCenter: formatText(member.assignedCenter),
        status: member.assignedCenter ? 'active' : 'unassigned',
        createdAt: formatDate(member.createdAt),
      })),
    [crew],
  );
  const warehouseRows = useMemo(
    () =>
      warehouses.map((warehouse) => ({
        id: warehouse.id,
        name: formatText(warehouse.name),
        email: formatText(warehouse.email),
        phone: formatText(warehouse.phone),
        status: (warehouse.status ?? 'operational').toLowerCase(),
        createdAt: formatDate(warehouse.createdAt),
      })),
    [warehouses],
  );
  const serviceRows = useMemo(
    () =>
      services.map((service) => ({
        id: service.id,
        name: formatText(service.name),
        category: formatText(service.category),
        managedBy: formatText(service.managedBy),
        status: formatText(service.status),
        updatedAt: formatDate(service.updatedAt),
        metadata: (service as any).metadata ?? null,
        description: (service as any).description ?? null,
      })),
    [services],
  );

  const productOrderRows = useMemo(
    () =>
      orders
        .filter((order) => {
          const extra = order as any;
          return extra.orderType === 'product';
        })
        .map((order) => {
          const extra = order as any;
          // Type label: default to One-Time until recurrence is modeled
          const typeLabel = 'One-Time';
          // Requested By: prefer createdBy, else centerId, else customerId
          const requestedBy = (extra.createdBy && String(extra.createdBy).trim()) || order.centerId || order.customerId || null;
          // Destination: prefer explicit destination, else centerId, else assignedWarehouse
          const destination = extra.destination || order.centerId || ((extra.createdByRole === 'center' || extra.createdByRole === 'customer') ? extra.createdBy : null) || order.assignedWarehouse || null;

          return {
            id: order.id,
            orderId: order.id,
            orderType: typeLabel,
            requestedBy: formatText(requestedBy),
            destination: formatText(destination),
            status: formatText(order.status),
            orderDate: formatDate(order.orderDate),
            completionDate: formatDate(order.completionDate),
            // original fields for modal
            customerId: formatText(order.customerId),
            centerId: formatText(order.centerId),
            serviceId: formatText(order.serviceId),
            assignedWarehouse: formatText(order.assignedWarehouse),
            // Store full order data for details modal
            _fullOrder: order,
          };
        }),
    [orders],
  );

  const serviceOrderRows = useMemo(
    () =>
      orders
        .filter((order) => {
          const extra = order as any;
          return extra.orderType === 'service';
        })
        .map((order) => {
          const extra = order as any;
          // Type label: default to One-Time until recurrence is modeled
          const typeLabel = 'One-Time';
          // Requested By: prefer createdBy, else centerId, else customerId
          const requestedBy = (extra.createdBy && String(extra.createdBy).trim()) || order.centerId || order.customerId || null;
          // Destination: prefer explicit destination, else centerId, else assignedWarehouse
          const destination = extra.destination || order.centerId || ((extra.createdByRole === 'center' || extra.createdByRole === 'customer') ? extra.createdBy : null) || order.assignedWarehouse || null;

          return {
            id: order.id,
            orderId: order.id,
            orderType: typeLabel,
            requestedBy: formatText(requestedBy),
            destination: formatText(destination),
            status: formatText(order.status),
            orderDate: formatDate(order.orderDate),
            completionDate: formatDate(order.completionDate),
            // original fields for modal
            customerId: formatText(order.customerId),
            centerId: formatText(order.centerId),
            serviceId: formatText(order.serviceId),
            assignedWarehouse: formatText(order.assignedWarehouse),
            // Store full order data for details modal
            _fullOrder: order,
          };
        }),
    [orders],
  );

  const productRows = useMemo(
    () =>
      products.map((product) => ({
        id: product.id,
        rawId: (product as any).rawId ?? null,
        name: formatText(product.name),
        category: formatText(product.category),
        status: formatText(product.status),
        updatedAt: formatDate(product.updatedAt),
        source: (product as any).source ?? 'products',
      })),
    [products],
  );

  const trainingRows = useMemo(
    () =>
      trainingRecords.map((record) => ({
        id: record.id,
        crewName: formatText(record.crewName),
        serviceName: formatText(record.serviceName),
        status: formatText(record.status),
        startDate: formatDate(record.date),
      })),
    [trainingRecords],
  );

  const procedureRows = useMemo(
    () =>
      procedures.map((procedure) => ({
        id: procedure.id,
        serviceId: formatText(procedure.serviceId),
        type: formatText(procedure.type),
        contractorId: formatText(procedure.contractorId),
        customerId: formatText(procedure.customerId),
      })),
    [procedures],
  );

  const reportRows = useMemo(
    () =>
      reports.map((report) => ({
        id: report.id,
        title: report.title,
        severity: formatText(report.severity),
        customerId: formatText(report.customerId),
        centerId: formatText(report.centerId),
        status: formatText(report.status),
        createdAt: formatDate(report.createdAt),
        // Store full report data for modal
        _fullReport: report,
        _entityType: 'report',
      })),
    [reports],
  );

  const feedbackRows = useMemo(
    () =>
      feedbackEntries.map((entry) => ({
        id: entry.id,
        kind: formatText(entry.kind),
        title: entry.title,
        customerId: formatText(entry.customerId),
        centerId: formatText(entry.centerId),
        createdAt: formatDate(entry.createdAt),
        // Store full feedback data for modal
        _fullFeedback: entry,
        _entityType: 'feedback',
      })),
    [feedbackEntries],
  );

  const renderActions = useCallback(
    (_value: any, row: Record<string, any>) => (
      <Button
        variant="primary"
        size="small"
        onClick={() => handleView(row)}
      >
        View
      </Button>
    ),
    [handleView],
  );

  const directoryConfig = useMemo(() => ({
    admins: {
      columns: [
        { key: 'code', label: 'ADMIN ID' },
        { key: 'name', label: 'NAME' },
        { key: 'email', label: 'EMAIL' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'createdAt', label: 'CREATED' },
        { key: 'actions', label: 'ACTIONS', render: renderActions },
      ],
      data: adminRows,
      emptyMessage: 'No admin users found yet.',
    },
    managers: {
      columns: [
        { key: 'managerId', label: 'MANAGER ID' },
        { key: 'name', label: 'NAME' },
        { key: 'email', label: 'EMAIL' },
        { key: 'phone', label: 'PHONE' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'createdAt', label: 'CREATED' },
        { key: 'actions', label: 'ACTIONS', render: renderActions },
      ],
      data: managerRows,
      emptyMessage: 'No managers found.',
    },
    contractors: {
      columns: [
        { key: 'id', label: 'CONTRACTOR ID' },
        { key: 'name', label: 'NAME' },
        { key: 'email', label: 'EMAIL' },
        { key: 'phone', label: 'PHONE' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'createdAt', label: 'CREATED' },
        { key: 'actions', label: 'ACTIONS', render: renderActions },
      ],
      data: contractorRows,
      emptyMessage: 'No contractors found.',
    },
    customers: {
      columns: [
        { key: 'id', label: 'CUSTOMER ID' },
        { key: 'name', label: 'NAME' },
        { key: 'email', label: 'EMAIL' },
        { key: 'phone', label: 'PHONE' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'createdAt', label: 'CREATED' },
        { key: 'actions', label: 'ACTIONS', render: renderActions },
      ],
      data: customerRows,
      emptyMessage: 'No customers found.',
    },
    centers: {
      columns: [
        { key: 'id', label: 'CENTER ID' },
        { key: 'name', label: 'NAME' },
        { key: 'email', label: 'EMAIL' },
        { key: 'phone', label: 'PHONE' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'createdAt', label: 'CREATED' },
        { key: 'actions', label: 'ACTIONS', render: renderActions },
      ],
      data: centerRows,
      emptyMessage: 'No centers found.',
    },
    crew: {
      columns: [
        { key: 'id', label: 'CREW ID' },
        { key: 'name', label: 'NAME' },
        { key: 'email', label: 'EMAIL' },
        { key: 'phone', label: 'PHONE' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'createdAt', label: 'CREATED' },
        { key: 'actions', label: 'ACTIONS', render: renderActions },
      ],
      data: crewRows,
      emptyMessage: 'No crew members found.',
    },
    warehouses: {
      columns: [
        { key: 'id', label: 'WAREHOUSE ID' },
        { key: 'name', label: 'NAME' },
        { key: 'email', label: 'EMAIL' },
        { key: 'phone', label: 'PHONE' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'createdAt', label: 'CREATED' },
        { key: 'actions', label: 'ACTIONS', render: renderActions },
      ],
      data: warehouseRows,
      emptyMessage: 'No warehouses found.',
    },
    'catalog-services': {
      columns: [
        { key: 'id', label: 'SERVICE ID' },
        { key: 'name', label: 'NAME' },
        { key: 'category', label: 'CATEGORY' },
        { key: 'managedBy', label: 'MANAGED BY' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'updatedAt', label: 'UPDATED' },
        { key: 'actions', label: 'ACTIONS', render: renderActions },
      ],
      data: serviceRows,
      emptyMessage: 'No catalog services found.',
    },
    'active-services': {
      columns: [
        { key: 'id', label: 'SERVICE ID' },
        { key: 'name', label: 'SERVICE NAME' },
        { key: 'requestedBy', label: 'REQUESTED BY' },
        { key: 'destination', label: 'LOCATION' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'orderDate', label: 'CREATED' },
        { key: 'actions', label: 'ACTIONS', render: renderActions },
      ],
      data: serviceOrderRows.filter(order => {
        // Filter for transformed service orders (active services)
        return order.serviceId && order.serviceId.match(/^[a-z]{3}-\d+-srv-\d+$/i);
      }).map(order => ({
        ...order,
        id: order.serviceId || order.id,
        name: order.title || 'Service',
      })),
      emptyMessage: 'No active services found.',
    },
    'product-orders': {
      columns: [
        { key: 'id', label: 'ORDER ID' },
        { key: 'orderType', label: 'TYPE' },
        { key: 'requestedBy', label: 'REQUESTED BY' },
        { key: 'destination', label: 'DESTINATION' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'orderDate', label: 'CREATED' },
        { key: 'actions', label: 'ACTIONS', render: renderActions },
      ],
      data: productOrderRows,
      emptyMessage: 'No product orders recorded.',
    },
    'service-orders': {
      columns: [
        { key: 'id', label: 'ORDER ID' },
        { key: 'orderType', label: 'TYPE' },
        { key: 'requestedBy', label: 'REQUESTED BY' },
        { key: 'destination', label: 'DESTINATION' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'orderDate', label: 'CREATED' },
        { key: 'actions', label: 'ACTIONS', render: renderActions },
      ],
      data: serviceOrderRows,
      emptyMessage: 'No service orders recorded.',
    },
    products: {
      columns: [
        { key: 'id', label: 'PRODUCT ID' },
        { key: 'name', label: 'NAME' },
        { key: 'category', label: 'CATEGORY' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'updatedAt', label: 'UPDATED' },
        { key: 'actions', label: 'ACTIONS', render: renderActions },
      ],
      data: productRows,
      emptyMessage: 'No products available.',
    },
    training: {
      columns: [
        { key: 'id', label: 'TRAINING ID' },
        { key: 'crewName', label: 'CREW' },
        { key: 'serviceName', label: 'SERVICE' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'startDate', label: 'DATE' },
      ],
      data: trainingRows,
      emptyMessage: 'No training records.',
    },
    procedures: {
      columns: [
        { key: 'id', label: 'PROCEDURE ID' },
        { key: 'type', label: 'TYPE' },
        { key: 'serviceId', label: 'SERVICE' },
        { key: 'contractorId', label: 'CONTRACTOR' },
        { key: 'customerId', label: 'CUSTOMER' },
      ],
      data: procedureRows,
      emptyMessage: 'No procedures recorded.',
    },
    reports: {
      columns: [
        { key: 'id', label: 'REPORT ID' },
        { key: 'title', label: 'TITLE' },
        { key: 'severity', label: 'SEVERITY' },
        { key: 'customerId', label: 'CUSTOMER' },
        { key: 'centerId', label: 'CENTER' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'createdAt', label: 'CREATED' },
        { key: 'actions', label: 'ACTIONS', render: renderActions },
      ],
      data: reportRows,
      emptyMessage: 'No reports filed.',
    },
    feedback: {
      columns: [
        { key: 'id', label: 'FEEDBACK ID' },
        { key: 'kind', label: 'KIND' },
        { key: 'title', label: 'TITLE' },
        { key: 'customerId', label: 'CUSTOMER' },
        { key: 'centerId', label: 'CENTER' },
        { key: 'createdAt', label: 'CREATED' },
        { key: 'actions', label: 'ACTIONS', render: renderActions },
      ],
      data: feedbackRows,
      emptyMessage: 'No feedback submitted.',
    },
  }) satisfies Record<string, DirectorySectionConfig>, [
    adminRows,
    managerRows,
    contractorRows,
    customerRows,
    centerRows,
    crewRows,
    warehouseRows,
    serviceRows,
    productOrderRows,
    serviceOrderRows,
    productRows,
    trainingRows,
    procedureRows,
    reportRows,
    feedbackRows,
  ]);

  const directoryLoading =
    adminUsersLoading ||
    managersLoading ||
    contractorsLoading ||
    customersLoading ||
    centersLoading ||
    crewLoading ||
    warehousesLoading ||
    servicesLoading ||
    ordersLoading ||
    productsLoading ||
    trainingLoading ||
    proceduresLoading ||
    reportsLoading ||
    feedbackLoading;

  const directoryError =
    adminUsersError ||
    managersError ||
    contractorsError ||
    customersError ||
    centersError ||
    crewError ||
    warehousesError ||
    servicesError ||
    ordersError ||
    productsError ||
    trainingError ||
    proceduresError ||
    reportsError ||
    feedbackError;
  const renderDirectoryBody = () => {
    if (directoryLoading) {
      return <div style={{ color: '#2563eb', fontSize: 14 }}>Loading directory data.</div>;
    }
    if (directoryError) {
      return (
        <div style={{ color: '#dc2626', fontSize: 14 }}>
          Failed to load directory: {directoryError.message}
        </div>
      );
    }

    // Handle Services dropdown
    if (directoryTab === 'services') {
      const activeSubTab = servicesSubTab;
      const section = (directoryConfig as any)[activeSubTab];
      if (!section) {
        return <div style={{ color: '#64748b', fontSize: 14 }}>No data available.</div>;
      }
      return (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Button
              variant={servicesSubTab === 'catalog-services' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setServicesSubTab('catalog-services')}
            >
              Catalog Services
            </Button>
            <Button
              variant={servicesSubTab === 'active-services' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setServicesSubTab('active-services')}
            >
              Active Services
            </Button>
          </div>
          <DataTable
            columns={section.columns}
            data={section.data}
            emptyMessage={section.emptyMessage}
            searchPlaceholder={`Search ${servicesSubTab === 'catalog-services' ? 'catalog services' : 'active services'}...`}
            maxItems={25}
            showSearch
          />
        </>
      );
    }

    // Handle Orders dropdown
    if (directoryTab === 'orders') {
      const activeSubTab = ordersSubTab;
      const section = (directoryConfig as any)[activeSubTab];
      if (!section) {
        return <div style={{ color: '#64748b', fontSize: 14 }}>No data available.</div>;
      }
      return (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Button
              variant={ordersSubTab === 'product-orders' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setOrdersSubTab('product-orders')}
            >
              Product Orders
            </Button>
            <Button
              variant={ordersSubTab === 'service-orders' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setOrdersSubTab('service-orders')}
            >
              Service Orders
            </Button>
          </div>
          <DataTable
            columns={section.columns}
            data={section.data}
            emptyMessage={section.emptyMessage}
            searchPlaceholder={`Search ${ordersSubTab === 'product-orders' ? 'product orders' : 'service orders'}...`}
            maxItems={25}
            showSearch
          />
        </>
      );
    }

    // Handle Training & Procedures (side-by-side)
    if (directoryTab === 'training') {
      return (
        <div style={{ display: 'flex', gap: '4%' }}>
          <div style={{ width: '48%' }}>
            <DataTable
              columns={(directoryConfig as any).training.columns}
              data={(directoryConfig as any).training.data}
              emptyMessage={(directoryConfig as any).training.emptyMessage}
              searchPlaceholder="Search training..."
              maxItems={25}
              showSearch
            />
          </div>
          <div style={{ width: '48%' }}>
            <DataTable
              columns={(directoryConfig as any).procedures.columns}
              data={(directoryConfig as any).procedures.data}
              emptyMessage={(directoryConfig as any).procedures.emptyMessage}
              searchPlaceholder="Search procedures..."
              maxItems={25}
              showSearch
            />
          </div>
        </div>
      );
    }

    // Handle Reports & Feedback dropdown
    if (directoryTab === 'reports') {
      const activeSubTab = reportsSubTab;
      const section = (directoryConfig as any)[activeSubTab];
      if (!section) {
        return <div style={{ color: '#64748b', fontSize: 14 }}>No data available.</div>;
      }
      return (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Button
              variant={reportsSubTab === 'reports' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setReportsSubTab('reports')}
            >
              Reports
            </Button>
            <Button
              variant={reportsSubTab === 'feedback' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setReportsSubTab('feedback')}
            >
              Feedback
            </Button>
          </div>
          <DataTable
            columns={section.columns}
            data={section.data}
            emptyMessage={section.emptyMessage}
            searchPlaceholder={`Search ${reportsSubTab === 'reports' ? 'reports' : 'feedback'}...`}
            maxItems={25}
            showSearch
          />
        </>
      );
    }

    // Default handling for other tabs
    const section = (directoryConfig as any)[directoryTab];
    if (!section) {
      return <div style={{ color: '#64748b', fontSize: 14 }}>No data available.</div>;
    }
    return (
      <DataTable
        columns={section.columns}
        data={section.data}
        emptyMessage={section.emptyMessage}
        searchPlaceholder={`Search ${directoryTab}...`}
        maxItems={25}
        showSearch
      />
    );
  };

  const activityEmptyMessage = activitiesError
    ? 'Failed to load activity feed.'
    : activitiesLoading
      ? 'Loading recent activity...'
      : 'No recent activity yet.';

  const handleClearActivity = () => setActivityFeed([]);

  // Don't render anything until we have critical data
  if (!activityItems) {
    console.log('[AdminHub] Waiting for critical data...');
    return null;
  }

  return (
  <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <MyHubSection
        hubName="Administrator Hub"
        tabs={HUB_TABS}
        activeTab={activeTab}
        onTabClick={setActiveTab}
        onLogout={logout}
      />

      <Scrollbar style={{ flex: 1, padding: '0 24px' }} className="hub-content-scroll">
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {activeTab === 'dashboard' ? (
            <PageWrapper title="Dashboard" showHeader={false}>
              <PageHeader title="Overview" />
              <OverviewSection cards={overviewCards} data={overviewData} />

              <PageHeader title="Recent Activity" />
              <RecentActivity
                activities={activityFeed}
                onClear={handleClearActivity}
                emptyMessage={activityEmptyMessage}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <NewsPreview color="#111827" onViewAll={() => console.log('View news')} />
                <MemosPreview color="#111827" onViewAll={() => console.log('View memos')} />
              </div>
            </PageWrapper>
          ) : activeTab === 'directory' ? (
            <PageWrapper title="Directory" showHeader>
              <TabContainer variant="pills" spacing="compact">
                {DIRECTORY_TABS.map((tab) => (
                  <NavigationTab
                    key={tab.id}
                    label={tab.label}
                    isActive={directoryTab === tab.id}
                    onClick={() => setDirectoryTab(tab.id)}
                    activeColor={tab.color}
                  />
                ))}
              </TabContainer>

              <div style={{ marginTop: 24 }}>
                {renderDirectoryBody()}
              </div>
            </PageWrapper>
          ) : activeTab === 'create' ? (
            <AdminCreateSection />
          ) : activeTab === 'assign' ? (
            <AdminAssignSection />
          ) : activeTab === 'archive' ? (
            <ArchiveSection
              archiveAPI={archiveAPI}
              onViewOrderDetails={async (orderId: string, orderType: 'product' | 'service') => {
                try {
                  // Fetch the full archived order
                  const fullOrder = await fetchAdminOrderById(orderId);
                  if (fullOrder) {
                    setSelectedOrderForDetails(fullOrder as any);
                  }
                } catch (error) {
                  console.error('Failed to fetch archived order:', error);
                  alert('Failed to load order details');
                }
              }}
            />
          ) : activeTab === 'support' ? (
            <PageWrapper title="Support" headerSrOnly>
              <AdminSupportSection primaryColor="#6366f1" />
            </PageWrapper>
          ) : (
            <PageWrapper title={activeTab} showHeader>
              <h2>Admin {activeTab} content</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </PageWrapper>
          )}
        </div>
      </Scrollbar>

      <ActionModal
        isOpen={showActionModal}
        onClose={handleModalClose}
        entity={selectedEntity ?? undefined}
        title={(() => {
          // Determine title based on entity type (considering sub-tabs)
          if (directoryTab === 'orders') return 'Order Actions';
          if (directoryTab === 'products') return 'Product Actions';
          if (directoryTab === 'services') {
            return servicesSubTab === 'catalog-services' ? 'Catalog Service Actions' : 'Active Service Actions';
          }
          if (directoryTab === 'warehouses') return 'Warehouse Actions';
          if (directoryTab === 'reports') {
            return reportsSubTab === 'reports' ? 'Report Actions' : 'Feedback Actions';
          }
          return undefined; // Use default title for users
        })()}
        actions={(() => {
          // Different actions based on entity type
          if (directoryTab === 'orders') {
            const row = selectedEntity as any;
            const status = (row?.status || '').toString().trim().toLowerCase();
            const finalStatuses = new Set(['delivered', 'cancelled', 'rejected', 'completed', 'service-created', 'service_created']);
            const canEdit = !finalStatuses.has(status);
            const actions: any[] = [
              {
                label: 'View Details',
                variant: 'secondary' as const,
                onClick: async () => {
                  if (!selectedEntity) return;
                  const fullOrder = (selectedEntity as any)._fullOrder as HubOrderItem;
                  console.log('[AdminHub] View Details clicked:', { selectedEntity, fullOrder });
                  if (fullOrder) {
                    setSelectedOrderForDetails(fullOrder);
                    handleModalClose(); // Close the action modal so the order modal can show
                  } else {
                    console.error('[AdminHub] No _fullOrder found on selectedEntity');
                  }
                },
              },
            ];
            if (canEdit) {
              actions.push({
                label: 'Edit Order',
                variant: 'secondary' as const,
                onClick: () => {
                  if (!selectedEntity) return;
                  const fullOrder = (selectedEntity as any)._fullOrder as HubOrderItem;
                  if (fullOrder) {
                    setSelectedOrderForEdit(fullOrder);
                  }
                },
              });
            }
            actions.push(
              {
                label: 'Cancel Order',
                variant: 'secondary' as const,
                onClick: async () => {
                  if (!selectedEntity) return;
                  const orderId = selectedEntity.orderId || selectedEntity.id;

                  const confirmed = window.confirm(
                    `Are you sure you want to cancel order ${orderId}? This action cannot be undone.`
                  );

                  if (!confirmed) return;

                  const notes = window.prompt('Please provide a reason for cancellation (optional):');

                  const payload: OrderActionRequest = {
                    action: 'cancel',
                    notes: notes?.trim() || null,
                  };

                  try {
                    await applyHubOrderAction(orderId, payload);
                    alert('Order cancelled successfully.');
                    handleModalClose();
                    // Refresh orders list
                    mutate('/admin/directory/orders');
                  } catch (error) {
                    console.error('Failed to cancel order:', error);
                    alert(`Failed to cancel order: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                },
              },
              {
                label: 'Delete Order',
                variant: 'danger' as const,
                onClick: () => selectedEntity && handleDelete(selectedEntity),
              },
            );
            return actions;
          }
          if (directoryTab === 'products') {
            return [
              {
                label: 'View Product',
                variant: 'secondary' as const,
                onClick: () => console.log('View product:', selectedEntity),
              },
              {
                label: 'Edit Product',
                variant: 'secondary' as const,
                onClick: () => console.log('Edit product:', selectedEntity),
              },
              {
                label: 'Update Inventory',
                variant: 'secondary' as const,
                onClick: async () => {
                  const warehouseId = prompt('Enter Warehouse ID (e.g., WHS-004):');
                  if (!warehouseId) return;

                  const quantityStr = prompt(`Enter quantity to ADD (+) or REMOVE (-) for ${selectedEntity?.name}:`);
                  if (!quantityStr) return;

                  const quantityChange = parseInt(quantityStr, 10);
                  if (isNaN(quantityChange)) {
                    alert('Invalid quantity. Please enter a number.');
                    return;
                  }

                  const reason = prompt('Enter reason for adjustment (optional):') || undefined;

                  try {
                    await updateInventory({
                      warehouseId,
                      itemId: selectedEntity?.id || selectedEntity?.rawId || '',
                      quantityChange,
                      reason,
                    });

                    alert('Inventory updated successfully!');
                    setSelectedEntity(null); // Close modal
                    // Refresh data if needed
                  } catch (error) {
                    console.error('Failed to update inventory:', error);
                    alert(`Failed to update inventory: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                },
              },
              {
                label: 'Delete Product',
                variant: 'danger' as const,
                disabled: !!(selectedEntity && (selectedEntity as any).source === 'catalog'),
                onClick: () => selectedEntity && handleDelete(selectedEntity),
              },
            ];
          }
          if (directoryTab === 'services') {
            return [
              {
                label: 'View Service',
                variant: 'secondary' as const,
                onClick: () => {
                  if (!selectedEntity) return;
                  setSelectedServiceCatalog({
                    serviceId: selectedEntity.id,
                    name: selectedEntity.name ?? null,
                    category: selectedEntity.category ?? null,
                    status: selectedEntity.status ?? null,
                    description: selectedEntity.description ?? null,
                    metadata: (selectedEntity as any).metadata ?? null,
                  });
                  setShowServiceCatalogModal(true);
                },
              },
              {
                label: 'Edit Service',
                variant: 'secondary' as const,
                onClick: () => console.log('Edit service:', selectedEntity),
              },
              {
                label: 'Delete Service',
                variant: 'danger' as const,
                onClick: () => selectedEntity && handleDelete(selectedEntity),
              },
            ];
          }
          if (directoryTab === 'warehouses') {
            return [
              {
                label: 'View Warehouse',
                variant: 'secondary' as const,
                onClick: () => console.log('View warehouse:', selectedEntity),
              },
              {
                label: 'Edit Warehouse',
                variant: 'secondary' as const,
                onClick: () => console.log('Edit warehouse:', selectedEntity),
              },
              {
                label: 'Manage Inventory',
                variant: 'secondary' as const,
                onClick: () => console.log('Manage inventory:', selectedEntity),
              },
              {
                label: 'Delete Warehouse',
                variant: 'danger' as const,
                onClick: () => selectedEntity && handleDelete(selectedEntity),
              },
            ];
          }
          if (directoryTab === 'reports') {
            const fullReport = (selectedEntity as any)?._fullReport;
            const fullFeedback = (selectedEntity as any)?._fullFeedback;
            const item = fullReport || fullFeedback;
            const isReport = reportsSubTab === 'reports';

            return [
              {
                label: `View Details`,
                variant: 'secondary' as const,
                onClick: () => {
                  if (!item) return;
                  // Set the selected report to open the ReportDetailsModal
                  // We'll need to manage this state
                  setSelectedReportForDetails(item);
                  handleModalClose(); // Close action modal so details modal can show
                },
              },
              {
                label: `Delete ${isReport ? 'Report' : 'Feedback'}`,
                variant: 'danger' as const,
                onClick: () => selectedEntity && handleDelete(selectedEntity),
              },
            ];
          }

          // Default user actions for managers, contractors, customers, crew, admins
          return undefined; // This will use the legacy props below
        })()}
        // Legacy props for user entities
        onSendInvite={
          ['admins', 'managers', 'contractors', 'customers', 'crew'].includes(directoryTab)
            ? () => console.log('Send Invite clicked for:', selectedEntity)
            : undefined
        }
        onEditProfile={
          ['admins', 'managers', 'contractors', 'customers', 'crew'].includes(directoryTab)
            ? () => console.log('Edit User Profile clicked for:', selectedEntity)
            : undefined
        }
        onPauseAccount={
          ['admins', 'managers', 'contractors', 'customers', 'crew'].includes(directoryTab)
            ? () => console.log('Pause Account clicked for:', selectedEntity)
            : undefined
        }
        onDeleteAccount={
          ['admins', 'managers', 'contractors', 'customers', 'crew'].includes(directoryTab)
            ? () => selectedEntity && handleDelete(selectedEntity)
            : undefined
        }
      />

      <CatalogServiceModal
        isOpen={showServiceCatalogModal}
        onClose={() => { setShowServiceCatalogModal(false); setSelectedServiceCatalog(null); setServiceAssignSelected(null); }}
        service={selectedServiceCatalog}
        showCertifications={false}
        peopleManagers={(managers || []).map((m) => ({ code: m.id, name: m.name || m.id }))}
        peopleCrew={(crew || []).map((c) => ({ code: c.id, name: c.name || c.id }))}
        peopleWarehouses={(warehouses || []).map((w) => ({ code: w.id, name: w.name || w.id }))}
        selectedAssignments={serviceAssignSelected || undefined}
        onSave={async (updates) => {
          if (!selectedServiceCatalog) return;
          try {
            const { updateCatalogService } = await import('../shared/api/admin');
            const serviceId = selectedServiceCatalog.serviceId;
            await updateCatalogService(serviceId, { metadata: { certifications: updates.certifications, visibility: updates.visibility } });

            if (updates.assignments && serviceAssignSelected) {
              const { patchServiceAssignments } = await import('../shared/api/admin');
              const diff = (prev: string[], now: string[]) => {
                const p = new Set(prev);
                const n = new Set(now);
                const add = Array.from(n).filter((x) => !p.has(x));
                const remove = Array.from(p).filter((x) => !n.has(x));
                return { add, remove };
              };
              const dMgr = diff(serviceAssignSelected.managers, updates.assignments.managers);
              const dCrw = diff(serviceAssignSelected.crew, updates.assignments.crew);
              const dWhs = diff(serviceAssignSelected.warehouses, updates.assignments.warehouses);
              if (dMgr.add.length || dMgr.remove.length) await patchServiceAssignments(serviceId, { role: 'manager', add: dMgr.add, remove: dMgr.remove });
              if (dCrw.add.length || dCrw.remove.length) await patchServiceAssignments(serviceId, { role: 'crew', add: dCrw.add, remove: dCrw.remove });
              if (dWhs.add.length || dWhs.remove.length) await patchServiceAssignments(serviceId, { role: 'warehouse', add: dWhs.add, remove: dWhs.remove });

              // Revalidate certified-services caches for affected users so their My Services update immediately
              const revalidate = (role: 'manager' | 'crew' | 'warehouse', ids: string[]) => {
                ids.forEach((uid) => mutate(`/certified-services?userId=${encodeURIComponent(uid)}&role=${role}`));
              };
              revalidate('manager', [...dMgr.add, ...dMgr.remove]);
              revalidate('crew', [...dCrw.add, ...dCrw.remove]);
              revalidate('warehouse', [...dWhs.add, ...dWhs.remove]);
            }

            setShowServiceCatalogModal(false);
            setSelectedServiceCatalog(null);
            setServiceAssignSelected(null);
            mutate('/admin/directory/services');
            setToast('Assignments updated');
            setTimeout(() => setToast(null), 1800);
          } catch (error) {
            console.error('[admin] update catalog service failed', error);
            alert(error instanceof Error ? error.message : 'Failed to update catalog service');
          }
        }}
      />

      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, background: '#ecfeff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', zIndex: 1100, boxShadow: '0 8px 18px rgba(0,0,0,0.08)' }}>
          {toast}
        </div>
      )}

      {/* merged assign flow into CatalogServiceModal */}

      {/* Conditional Modal Rendering based on orderType and status */}
      {(() => {
        const orderType = ((selectedOrderForDetails as any)?.orderType === 'service' || (selectedOrderForDetails as any)?.serviceId) ? 'service' : 'product';
        const status = ((selectedOrderForDetails as any)?.status || '').toLowerCase();
        const isServiceCreated = status === 'service_created' || status === 'service-created';

        const commonOrder = selectedOrderForDetails
          ? {
              orderId: (selectedOrderForDetails as any).orderId || (selectedOrderForDetails as any).id,
              title: selectedOrderForDetails.title || null,
              requestedBy:
                (selectedOrderForDetails as any).requestedBy ||
                (selectedOrderForDetails as any).createdBy ||
                (selectedOrderForDetails as any).centerId ||
                (selectedOrderForDetails as any).customerId ||
                null,
              destination:
                (selectedOrderForDetails as any).destination ||
                (selectedOrderForDetails as any).centerId ||
                (selectedOrderForDetails as any).customerId ||
                null,
              requestedDate: (selectedOrderForDetails as any).requestedDate || (selectedOrderForDetails as any).orderDate || null,
              notes: selectedOrderForDetails.notes || null,
              status: (selectedOrderForDetails as any).status || null,
              serviceId: ((selectedOrderForDetails as any)?.metadata?.serviceId) || null,
            }
          : null;

        const commonAvailability = (() => {
          const meta = (selectedOrderForDetails as any)?.metadata as any;
          const av = meta?.availability;
          if (!av) return null;
          const days = Array.isArray(av.days) ? av.days : [];
          const window = av.window && av.window.start && av.window.end ? av.window : null;
          return { tz: av.tz ?? null, days, window };
        })();

        const commonCancellation = {
          cancellationReason: (() => {
            const meta = (selectedOrderForDetails as any)?.metadata as any;
            return meta?.cancellationReason || null;
          })(),
          cancelledBy: (() => {
            const meta = (selectedOrderForDetails as any)?.metadata as any;
            return meta?.cancelledBy || null;
          })(),
          cancelledAt: (() => {
            const meta = (selectedOrderForDetails as any)?.metadata as any;
            return meta?.cancelledAt || null;
          })(),
        };

        const commonRejection = (() => {
          const meta = (selectedOrderForDetails as any)?.metadata as any;
          return (selectedOrderForDetails as any)?.rejectionReason || meta?.rejectionReason || null;
        })();

        const commonRequestorInfo = selectedOrderForDetails
          ? {
              name:
                (() => {
                  const meta = (selectedOrderForDetails as any)?.metadata as any;
                  const req = meta?.contacts?.requestor || {};
                  return req.name || requestorProfile?.name || requestorProfileFromDirectory?.name || null;
                })(),
              address:
                (() => {
                  const meta = (selectedOrderForDetails as any)?.metadata as any;
                  const req = meta?.contacts?.requestor || {};
                  return req.address || requestorProfile?.address || requestorProfileFromDirectory?.address || null;
                })(),
              phone:
                (() => {
                  const meta = (selectedOrderForDetails as any)?.metadata as any;
                  const req = meta?.contacts?.requestor || {};
                  return req.phone || requestorProfile?.phone || requestorProfileFromDirectory?.phone || null;
                })(),
              email:
                (() => {
                  const meta = (selectedOrderForDetails as any)?.metadata as any;
                  const req = meta?.contacts?.requestor || {};
                  return req.email || requestorProfile?.email || requestorProfileFromDirectory?.email || null;
                })(),
            }
          : null;

        const commonDestinationInfo = selectedOrderForDetails
          ? {
              name:
                (() => {
                  const meta = (selectedOrderForDetails as any)?.metadata as any;
                  const dest = meta?.contacts?.destination || {};
                  return dest.name || destinationProfile?.name || destinationProfileFromDirectory?.name || null;
                })(),
              address:
                (() => {
                  const meta = (selectedOrderForDetails as any)?.metadata as any;
                  const dest = meta?.contacts?.destination || {};
                  return dest.address || destinationProfile?.address || destinationProfileFromDirectory?.address || null;
                })(),
              phone:
                (() => {
                  const meta = (selectedOrderForDetails as any)?.metadata as any;
                  const dest = meta?.contacts?.destination || {};
                  return dest.phone || destinationProfile?.phone || destinationProfileFromDirectory?.phone || null;
                })(),
              email:
                (() => {
                  const meta = (selectedOrderForDetails as any)?.metadata as any;
                  const dest = meta?.contacts?.destination || {};
                  return dest.email || destinationProfile?.email || destinationProfileFromDirectory?.email || null;
                })(),
            }
          : null;

        // Choose the appropriate modal
        if (orderType === 'service') {
          // Use ServiceOrderModal for service orders
          return (
            <ServiceOrderModal
              isOpen={!!selectedOrderForDetails}
              onClose={() => setSelectedOrderForDetails(null)}
              order={commonOrder}
              availability={commonAvailability}
              cancellationReason={commonCancellation.cancellationReason}
              cancelledBy={commonCancellation.cancelledBy}
              cancelledAt={commonCancellation.cancelledAt}
              rejectionReason={commonRejection}
              requestorInfo={commonRequestorInfo}
              destinationInfo={commonDestinationInfo}
            />
          );
        } else if (orderType === 'product') {
          // Use ProductOrderModal for product orders
          const items = selectedOrderForDetails?.items || [];
          return (
            <ProductOrderModal
              isOpen={!!selectedOrderForDetails}
              onClose={() => setSelectedOrderForDetails(null)}
              order={commonOrder ? { ...commonOrder, items } : null}
              availability={commonAvailability}
              cancellationReason={commonCancellation.cancellationReason}
              cancelledBy={commonCancellation.cancelledBy}
              cancelledAt={commonCancellation.cancelledAt}
              rejectionReason={commonRejection}
              requestorInfo={commonRequestorInfo}
              destinationInfo={commonDestinationInfo}
            />
          );
        } else {
          // Fallback to OrderDetailsModal
          return (
            <OrderDetailsModal
              isOpen={!!selectedOrderForDetails}
              onClose={() => setSelectedOrderForDetails(null)}
              order={commonOrder ? { ...commonOrder, orderType, items: selectedOrderForDetails?.items || [] } : null}
              infoBanner={
                (selectedOrderForDetails as any)?.archivedAt
                  ? 'This order has been archived by admin and is scheduled to be deleted from the system within 30 days.'
                  : null
              }
              availability={commonAvailability}
              cancellationReason={commonCancellation.cancellationReason}
              cancelledBy={commonCancellation.cancelledBy}
              cancelledAt={commonCancellation.cancelledAt}
              rejectionReason={commonRejection}
              requestorInfo={commonRequestorInfo}
              destinationInfo={commonDestinationInfo}
            />
          );
        }
      })()}

      <EditOrderModal
        isOpen={!!selectedOrderForEdit}
        onClose={() => setSelectedOrderForEdit(null)}
        currentNotes={selectedOrderForEdit?.notes || null}
        orderId={(selectedOrderForEdit as any)?.orderId || (selectedOrderForEdit as any)?.id || ''}
        onSubmit={async (payload) => {
          if (!selectedOrderForEdit) return;
          try {
            const targetId = (selectedOrderForEdit as any)?.orderId || (selectedOrderForEdit as any)?.id;
            if (!targetId) {
              throw new Error('Missing order ID');
            }
            await updateOrderFields(targetId, payload);
            alert('Order updated successfully!');
            // Optimistically update the details modal if it's open for the same order
            setSelectedOrderForDetails((prev) => {
              if (!prev) return prev;
              const prevId = (prev as any).orderId || (prev as any).id;
              if (prevId !== targetId) return prev;
              return {
                ...(prev as any),
                notes: payload.notes !== undefined ? (payload.notes || null) : (prev as any).notes ?? null,
              } as any;
            });
            setSelectedOrderForEdit(null);
            handleModalClose();
            // Refresh orders list
            mutate('/admin/directory/orders');
          } catch (error) {
            console.error('Failed to update order:', error);
            alert(`Failed to update order: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }}
      />

      <ReportDetailsModal
        isOpen={!!selectedReportForDetails}
        onClose={() => setSelectedReportForDetails(null)}
        report={selectedReportForDetails ? {
          id: selectedReportForDetails.id || selectedReportForDetails.report_id,
          type: selectedReportForDetails._entityType === 'feedback' ? 'feedback' : 'report',
          submittedBy: selectedReportForDetails.created_by_id || selectedReportForDetails.customerId || selectedReportForDetails.centerId,
          submittedDate: selectedReportForDetails.createdAt || selectedReportForDetails.created_at,
          status: selectedReportForDetails.status,
          description: selectedReportForDetails.description || selectedReportForDetails.message,
          reportCategory: selectedReportForDetails.report_category,
          relatedEntityId: selectedReportForDetails.related_entity_id,
          reportReason: selectedReportForDetails.report_reason,
          priority: selectedReportForDetails.priority,
          rating: selectedReportForDetails.rating,
          acknowledgments: selectedReportForDetails.acknowledgments || [],
          resolvedBy: selectedReportForDetails.resolved_by_id,
          resolvedAt: selectedReportForDetails.resolved_at,
          resolution: {
            notes: selectedReportForDetails.resolution_notes,
            actionTaken: selectedReportForDetails.action_taken
          },
          resolution_notes: selectedReportForDetails.resolution_notes
        } : null}
        currentUser={code || ''}
        userRole="admin"
      />
    </div>
  );

}













