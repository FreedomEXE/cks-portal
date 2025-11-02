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
  ProfileTab,
  adminOverviewCards,
  type Activity,
} from '@cks/domain-widgets';
import {
  ActionModal,
  Button,
  DataTable,
  EditOrderModal,
  NavigationTab,
  OrderDetailsModal,
  ServiceViewModal,
  PageHeader,
  PageWrapper,
  Scrollbar,
  TabContainer,
  UserModal,
  type UserAction,
} from '@cks/ui';
import { useModals } from '../contexts';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSWRConfig } from 'swr';

import MyHubSection from '../components/MyHubSection';
import { useLogout } from '../hooks/useLogout';
import { useAuth } from '@cks/auth';
import { getArchiveMetadataFromEntity } from '../hooks/useOrderDetails';
import { archiveAPI, type EntityType } from '../shared/api/archive';
import '../shared/api/test-archive'; // Temporary test import
import { isFeatureEnabled } from '../config/featureFlags';
import AdminAssignSection from './components/AdminAssignSection';
import AdminCreateSection from './components/AdminCreateSection';
import { useHubLoading } from '../contexts/HubLoadingContext';
import { buildOrderActions } from '@cks/domain-widgets';
import { mapProfileDataForRole, type DirectoryRole, directoryTabToRole } from '../shared/utils/profileMapping';
import { buildAdminOverviewData } from '../shared/overview/builders';

import { useAdminUsers, updateInventory, fetchAdminOrderById } from '../shared/api/admin';
import {
  useActivities,
  useCenters,
  useContractors,
  useCrew,
  useCustomers,
  useManagers,
  useOrders,
  useProcedures,
  useProducts,
  useServices,
  useTraining,
  useWarehouses,
} from '../shared/api/directory';
import { dismissActivity, dismissAllActivities } from '../shared/api/directory';
import {
  applyHubOrderAction,
  updateOrderFields,
  useHubProfile,
  useHubReports,
  type HubOrderItem,
  type OrderActionRequest,
  type UpdateOrderFieldsRequest,
} from '../shared/api/hub';
import { ActivityFeed } from '../components/ActivityFeed';

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
  { id: 'reports', label: 'Reports & Feedback', color: '#92400e' },
  { id: 'training', label: 'Training & Procedures', color: '#ec4899' },
];

interface DirectorySectionConfig {
  columns: Array<{ key: string; label: string; clickable?: boolean; render?: (value: any, row?: any) => ReactNode }>;
  data: Record<string, any>[];
  emptyMessage: string;
}

// AdminHub now renders directly - ModalProvider is at app level
export default function AdminHub({ initialTab = 'dashboard' }: AdminHubProps) {
  return <AdminHubContent initialTab={initialTab} />;
}

// Inner component that has access to modal context
function AdminHubContent({ initialTab = 'dashboard' }: AdminHubProps) {
  const { code, firstName, fullName } = useAuth();
  const { setHubLoading } = useHubLoading();

  // Local tab state (no URL changes)
  const [activeTab, setActiveTab] = useState(initialTab);
  const [directoryTab, setDirectoryTab] = useState('admins');
  const [ordersSubTab, setOrdersSubTab] = useState('product-orders');
  const [servicesSubTab, setServicesSubTab] = useState('catalog-services');
  const [reportsSubTab, setReportsSubTab] = useState('reports');

  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Record<string, any> | null>(null);
  // Legacy product modal state removed in favor of universal modal
  const [toast, setToast] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<HubOrderItem | null>(null);
  const logout = useLogout();
  const { mutate } = useSWRConfig();

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
  // Use hub endpoint for complete report data (same as all other roles)
  const { data: reportsData, isLoading: reportsLoading } = useHubReports(code || 'ADMIN');
  const { data: activityItems, isLoading: activitiesLoading, error: activitiesError } = useActivities();

  const [activityFeed, setActivityFeed] = useState<Activity[]>([]);

  // Access modal context
  const modals = useModals();

  // Signal when critical data is loaded
  useEffect(() => {
    const hasCriticalData = !!activityItems && !activitiesLoading;
    if (hasCriticalData) {
      console.log('[AdminHub] Critical data loaded, signaling ready');
      setHubLoading(false);
    }
  }, [activityItems, activitiesLoading, setHubLoading]);

  useEffect(() => {
    console.log('[AdminHub] Activity items received:', activityItems);
    if (activityItems && activityItems.length > 0) {
      console.log('[AdminHub] First activity sample:', activityItems[0]);
      console.log('[AdminHub] First activity metadata:', activityItems[0]?.metadata);
    }
    setActivityFeed(activityItems);
  }, [activityItems]);


  // Find selected order for modal (no pre-enrichment needed - hook handles it)
  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;

    // Try to find order in orders data first
    const allOrders = [
      ...(orders?.productOrders || []),
      ...(orders?.serviceOrders || []),
    ];

    let foundOrder = allOrders.find(
      (o: any) => o.orderId === selectedOrderId || o.id === selectedOrderId
    );

    // If not found in orders, might be from activity feed
    // Hook will fetch via entity endpoint
    return foundOrder || null;
  }, [selectedOrderId, orders]);

  // Use centralized order details hook (with directory context for enrichment)
  // OrderDetails are now handled via OrderDetailsGateway

  // Fetch inventory when product catalog modal opens
  // Product inventory fetching handled by modal adapter (universal modal)

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

        // Refresh the activity feed (Recent Activity section)
        mutate('/admin/directory/activities');

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

  // User actions are now handled by the universal modal system via entity registry

  const overviewData = useMemo(() =>
    buildAdminOverviewData({
      adminUsers,
      managers,
      contractors,
      customers,
      centers,
      crew,
      warehouses,
      reports: reportsData?.reports || [],
      goLiveTimestamp: GO_LIVE_TIMESTAMP,
    }),
  [adminUsers, managers, contractors, customers, centers, crew, warehouses, reportsData]);

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
        originalName: product.name, // Store original for modal
        category: formatText(product.category),
        originalCategory: product.category, // Store original for modal
        status: formatText(product.status),
        originalStatus: product.status, // Store original for modal
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

  const reportRows = useMemo(() => {
    return (reportsData?.reports || []).map((report: any) => ({
      id: report.id,
      title: report.title,
      severity: formatText(report.severity),
      customerId: formatText((report as any).customerId),
      centerId: formatText((report as any).centerId),
      status: formatText(report.status),
      // Admin directory uses createdAt; hub uses submittedDate
      createdAt: formatDate((report as any).createdAt ?? (report as any).submittedDate),
      // Store full report data for modal
      _fullReport: report,
      _entityType: 'report',
    }));
  }, [reportsData]);

  const feedbackRows = useMemo(
    () =>
      (reportsData?.feedback || []).map((entry: any) => ({
        id: entry.id,
        kind: formatText(entry.kind || (entry as any).category),
        title: entry.title,
        customerId: formatText((entry as any).customerId),
        centerId: formatText((entry as any).centerId),
        // Admin directory uses createdAt; hub uses submittedDate
        createdAt: formatDate((entry as any).createdAt ?? (entry as any).submittedDate),
        // Store full feedback data for modal
        _fullFeedback: entry,
        _entityType: 'feedback',
      })),
    [reportsData],
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
        { key: 'code', label: 'ADMIN ID', clickable: true },
        { key: 'name', label: 'NAME' },
        { key: 'email', label: 'EMAIL' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'createdAt', label: 'CREATED' },
      ],
      data: adminRows,
      emptyMessage: 'No admin users found yet.',
      onRowClick: (row: any) => {
        // Open admin user modal via universal modal system
        // Admins don't have a specific adapter yet, so skip for now
        console.log('[AdminHub] Admin user modals not yet migrated:', row.code);
      },
    },
    managers: {
      columns: [
        { key: 'managerId', label: 'MANAGER ID' },
        { key: 'name', label: 'NAME' },
        { key: 'email', label: 'EMAIL' },
        { key: 'phone', label: 'PHONE' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'createdAt', label: 'CREATED' },
        // Actions column removed – rows open modal on click
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
        // Actions column removed – rows open modal on click
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
        // Actions column removed – rows open modal on click
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
        // Actions column removed – rows open modal on click
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
        // Actions column removed – rows open modal on click
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
        // Actions column removed – rows open modal on click
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
        // Actions column removed – rows open modal on click
      ],
      data: serviceRows,
      emptyMessage: 'No catalog services found.',
    },
    'active-services': {
      columns: [
        { key: 'id', label: 'SERVICE ID', clickable: true },
        { key: 'name', label: 'SERVICE NAME' },
        { key: 'requestedBy', label: 'REQUESTED BY' },
        { key: 'destination', label: 'LOCATION' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'orderDate', label: 'CREATED' },
      ],
      data: serviceOrderRows.filter(order => {
        // Filter for transformed service orders (active services)
        return order.serviceId && order.serviceId.match(/^[a-z]{3}-\d+-srv-\d+$/i);
      }).map(order => ({
        ...order,
        id: order.serviceId || order.id,
        name: order.title || 'Service',
        orderId: order.orderId || order.id, // Preserve orderId for ActivityModalGateway
      })),
      emptyMessage: 'No active services found.',
      onRowClick: (row: any) => {
        // Open ActivityModalGateway for active services (transformed orders)
        setSelectedOrderId(row.orderId || row.id);
      },
    },
    'product-orders': {
      columns: [
        { key: 'id', label: 'ORDER ID' },
        { key: 'orderType', label: 'TYPE' },
        { key: 'requestedBy', label: 'REQUESTED BY' },
        { key: 'destination', label: 'DESTINATION' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'orderDate', label: 'CREATED' },
        // Actions column removed – rows open modal on click
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
        // Actions column removed – rows open modal on click
      ],
      data: serviceOrderRows,
      emptyMessage: 'No service orders recorded.',
    },
    products: {
      columns: [
        { key: 'id', label: 'PRODUCT ID', clickable: true },
        { key: 'name', label: 'NAME' },
        { key: 'category', label: 'CATEGORY' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'updatedAt', label: 'UPDATED' },
      ],
      data: productRows,
      emptyMessage: 'No products available.',
      onRowClick: (row: any) => {
        // Open universal product modal for products
        const productId = row.id || row.productId || row.code;
        if (productId) {
          modals.openEntityModal('product', productId);
        }
      },
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
        { key: 'id', label: 'REPORT ID', clickable: true },
        { key: 'title', label: 'TITLE' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'createdAt', label: 'CREATED' },
      ],
      data: reportRows,
      emptyMessage: 'No reports filed.',
      onRowClick: (row: any) => {
        // Phase 2: ID-first modal opening (with feature flag)
        if (isFeatureEnabled('ID_FIRST_MODALS')) {
          console.log('[AdminHub Directory] Phase 2: Opening report via openById():', row.id);
          modals.openById(row.id);
        } else {
          // Legacy path (backwards compatibility) - use openEntityModal directly
          modals.openEntityModal('report', row.id, { context: { reportType: 'report' } });
        }
      },
    },
    feedback: {
      columns: [
        { key: 'id', label: 'FEEDBACK ID', clickable: true },
        { key: 'title', label: 'TITLE' },
        { key: 'createdAt', label: 'CREATED' },
      ],
      data: feedbackRows,
      emptyMessage: 'No feedback submitted.',
      onRowClick: (row: any) => {
        // Phase 2: ID-first modal opening (with feature flag)
        if (isFeatureEnabled('ID_FIRST_MODALS')) {
          console.log('[AdminHub Directory] Phase 2: Opening feedback via openById():', row.id);
          modals.openById(row.id);
        } else {
          // Legacy path (backwards compatibility) - use openEntityModal directly
          modals.openEntityModal('feedback', row.id, { context: { reportType: 'feedback' } });
        }
      },
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
    reportsLoading;

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
    proceduresError;
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
            onRowClick={(row) => {
              // Use openById for all services to fetch full details (including admin lists)
              modals.openById(row.id);
            }}
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
              onRowClick={(row) => {
                const id = row.orderId || row.id;
                if (id) {
                  // Use universal modal flow (ModalGateway) for orders
                  // Ensures modular archive/restore/delete actions with auto-close + row removal
                  modals.openById(id);
                }
              }}
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
            onRowClick={section.onRowClick}
          />
        </>
      );
    }

    // Default handling for other tabs
    const section = (directoryConfig as any)[directoryTab];
    if (!section) {
      return <div style={{ color: '#64748b', fontSize: 14 }}>No data available.</div>;
    }
    // Determine if this is a user entity that should open UserModal
    const isUserEntity = ['managers', 'contractors', 'customers', 'crew', 'centers', 'warehouses'].includes(directoryTab);
    const isAdminEntity = directoryTab === 'admins';

    // Use section's onRowClick if defined, otherwise use user entity logic
    const onRowClick = section.onRowClick || (isUserEntity ? (row: any) => {
      // Resolve the full directory object so fields like reportsTo
      // (not included in table rows) are available in the modal
      let full: any = row;
      let entityType = directoryTabToRole(directoryTab);

      try {
        if (directoryTab === 'managers') {
          const found = (managers || []).find((m) => m.id === row.id);
          if (found) full = found;
        } else if (directoryTab === 'contractors') {
          const found = (contractors || []).find((m) => m.id === row.id);
          if (found) full = found;
        } else if (directoryTab === 'customers') {
          const found = (customers || []).find((m) => m.id === row.id);
          if (found) full = found;
        } else if (directoryTab === 'centers') {
          const found = (centers || []).find((m) => m.id === row.id);
          if (found) full = found;
        } else if (directoryTab === 'crew') {
          const found = (crew || []).find((m) => m.id === row.id);
          if (found) full = found;
        } else if (directoryTab === 'warehouses') {
          const found = (warehouses || []).find((m) => m.id === row.id);
          if (found) full = found;
        }
      } catch {}

      // Open via universal modal system with pre-loaded data
      modals.openEntityModal(entityType, row.id, {
        data: full,
        context: { source: 'directory' }
      });
    } : undefined);

    return (
      <DataTable
        columns={section.columns}
        data={section.data}
        emptyMessage={section.emptyMessage}
        searchPlaceholder={`Search ${directoryTab}...`}
        maxItems={25}
        showSearch
        onRowClick={onRowClick}
      />
    );
  };

  // Clear individual activity (CTO-corrected: calls backend + invalidates cache)
  const handleClearActivity = useCallback(async (activityId: string) => {
    try {
      await dismissActivity(activityId);

      // Immediately remove from local state for instant feedback
      setActivityFeed((prev) => prev.filter((a) => a.id !== activityId));

      // Invalidate cache to ensure fresh data on next load
      mutate('/admin/directory/activities');

      console.log('[AdminHub] Activity dismissed:', activityId);
    } catch (error) {
      console.error('[AdminHub] Failed to dismiss activity:', error);
      // TODO: Show error toast to user
    }
  }, [mutate]);

  // Clear ALL activities for current user
  const handleClearAll = useCallback(async () => {
    try {
      const result = await dismissAllActivities();

      // Clear local state immediately
      setActivityFeed([]);

      // Invalidate cache
      mutate('/admin/directory/activities');

      console.log(`[AdminHub] ${result.count} activities dismissed`);
    } catch (error) {
      console.error('[AdminHub] Failed to clear all activities:', error);
    }
  }, [mutate]);

  const handleOrderActions = useCallback((data: { entity: any; state: string; deletedAt?: string; deletedBy?: string }) => {
    const { entity, state } = data;

    // Extract archive metadata correctly from entity fields
    const archiveMeta = getArchiveMetadataFromEntity(entity);

    // Prepare entity for ActionModal with normalized fields
    const selectedEntityData = {
      orderId: entity.orderId || entity.order_id || entity.id,
      orderType: entity.orderType || entity.order_type,
      requestedBy: entity.requestedBy || entity.requested_by || entity.customerId || entity.customer_id,
      destination: entity.destination || entity.centerId || entity.center_id,
      status: entity.status,
      orderDate: entity.orderDate || entity.order_date || entity.createdAt || entity.created_at,
      completionDate: entity.completionDate || entity.completion_date,
      customerId: entity.customerId || entity.customer_id,
      centerId: entity.centerId || entity.center_id,
      serviceId: entity.serviceId || entity.service_id,
      assignedWarehouse: entity.assignedWarehouse || entity.assigned_warehouse,
      notes: entity.notes || null,

      // State flags and archive metadata (correctly extracted from entity.archived_* fields)
      isArchived: state === 'archived',
      archivedAt: archiveMeta?.archivedAt,
      archivedBy: archiveMeta?.archivedBy,
      archiveReason: archiveMeta?.reason,
      deletionScheduled: archiveMeta?.scheduledDeletion,
    };

    setSelectedEntity(selectedEntityData);
    setShowActionModal(true);
  }, []);

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
              <OverviewSection cards={adminOverviewCards} data={overviewData} />

              <PageHeader title="Recent Activity" />
              <ActivityFeed
                activities={activityFeed}
                hub="admin"
                viewerId={code || undefined}
                onClearActivity={handleClearActivity}
                onClearAll={handleClearAll}
                onOpenOrderModal={(order) => setSelectedOrderId(order?.orderId || order?.id || null)}
                onOpenServiceModal={(service) => modals.openById(service?.serviceId || service?.id || null)}
                isLoading={activitiesLoading}
                error={activitiesError}
                onError={(message) => {
                  setToast(message);
                  setTimeout(() => setToast(null), 3000);
                }}
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
        onViewOrderDetails={(orderId: string) => {
          modals.openById(orderId, { state: 'archived' });
        }}
        onViewServiceDetails={(serviceId: string) => {
          modals.openById(serviceId, { state: 'archived' });
        }}
        onViewProductDetails={(productId: string) => {
          modals.openEntityModal('product', productId, { state: 'archived' });
        }}
        onViewReportDetails={(reportId: string) => {
          modals.openById(reportId, { state: 'archived' });
        }}
        onViewUserDetails={(userId: string, userType) => {
          modals.openEntityModal(userType, userId, { state: 'archived' });
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
          const row = selectedEntity as any;
          const isOrderEntity = row?.orderId || row?._fullOrder;

          if (directoryTab === 'orders' || isOrderEntity) {
            const isArchived = row?.isArchived === true;
            return isArchived ? 'Archived Order' : 'Order Actions';
          }
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
        archiveMetadata={(() => {
          const row = selectedEntity as any;
          const isOrderEntity = row?.orderId || row?._fullOrder;
          if ((directoryTab === 'orders' || isOrderEntity) && row?.isArchived) {
            return {
              archivedBy: row.archivedBy,
              archivedAt: row.archivedAt,
              reason: row.archiveReason,
              scheduledDeletion: row.deletionScheduled,
            };
          }
          return undefined;
        })()}
        actions={(() => {
          // Different actions based on entity type
          // Check if entity is an order (by presence of orderId or _fullOrder)
          const row = selectedEntity as any;
          const isOrderEntity = row?.orderId || row?._fullOrder;

          if (directoryTab === 'orders' || isOrderEntity) {
            const isArchived = row?.isArchived === true;

            // Use shared action builder for all order actions
            return buildOrderActions({
              order: {
                orderId: row?.orderId || row?.id,
                status: row?.status,
                orderType: row?.orderType,
              },
              state: isArchived ? 'archived' : 'active',
              role: 'admin',
              callbacks: {
                onViewDetails: () => {
                  if (!selectedEntity) return;
                  const orderId = (selectedEntity as any).orderId || (selectedEntity as any).id;
                  if (orderId) {
                    setSelectedOrderId(orderId);
                    handleModalClose();
                  }
                },
                onEdit: () => {
                  if (!selectedEntity) return;
                  const orderData = (selectedEntity as any)._fullOrder || selectedEntity;
                  const orderId = orderData.orderId || orderData.id;
                  if (orderId) {
                    setSelectedOrderForEdit({
                      orderId,
                      id: orderId,
                      notes: orderData.notes || null,
                    } as HubOrderItem);
                  }
                },
                onCancel: async () => {
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
                    mutate('/admin/directory/orders');
                  } catch (error) {
                    console.error('Failed to cancel order:', error);
                    alert(`Failed to cancel order: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                },
                onRestore: async () => {
                  const orderId = row.orderId || row.id;
                  const confirmed = window.confirm(`Restore order ${orderId}?`);
                  if (!confirmed) return;

                  try {
                    await archiveAPI.restoreEntity('order', orderId);
                    handleModalClose();
                    mutate('/admin/directory/activities');
                    mutate('/admin/directory/orders');
                    alert('Order restored successfully.');
                  } catch (error) {
                    console.error('Failed to restore order:', error);
                    alert(`Failed to restore order: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                },
                onDelete: () => selectedEntity && handleDelete(selectedEntity),
                onHardDelete: async () => {
                  const orderId = row.orderId || row.id;
                  const confirmed = window.confirm(
                    `Permanently delete order ${orderId}? This action cannot be undone!`
                  );
                  if (!confirmed) return;

                  try {
                    await archiveAPI.hardDelete('order', orderId);
                    handleModalClose();
                    mutate('/admin/directory/activities');
                    mutate('/admin/directory/orders');
                    alert('Order permanently deleted.');
                  } catch (error) {
                    console.error('Failed to delete order:', error);
                    alert(`Failed to delete order: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                },
                onViewRelationships: async () => {
                  const orderId = row.orderId || row.id;
                  try {
                    const relationships = await archiveAPI.getRelationships('order', orderId);
                    alert(JSON.stringify(relationships, null, 2));
                  } catch (error) {
                    console.error('Failed to get relationships:', error);
                    alert(`Failed to get relationships: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                },
              },
            });
          }
          if (directoryTab === 'products') {
            return [
              {
                label: 'View Product',
                variant: 'secondary' as const,
                onClick: () => {
                  if (selectedEntity) {
                    const productId = (selectedEntity as any).rawId || (selectedEntity as any).id;
                    if (productId) {
                      modals.openEntityModal('product', productId);
                      setShowActionModal(false);
                    }
                  }
                },
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
                  modals.openById(selectedEntity.id);
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


      {/* CatalogProductModal removed; universal product modal is used via modals.openEntityModal */}

      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, background: '#ecfeff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', zIndex: 10000, boxShadow: '0 8px 18px rgba(0,0,0,0.08)' }}>
          {toast}
        </div>
      )}

      {/* merged assign flow into CatalogServiceModal */}

      {/* Activity Modal Gateway - DISABLED - now using ModalProvider + ModalGateway */}
      {false && <ActivityModalGateway
        isOpen={!!selectedOrderId}
        orderId={selectedOrderId}
        role="admin"
        onClose={() => setSelectedOrderId(null)}
        onEdit={(ord) => {
          const oid = (ord as any)?.orderId || (ord as any)?.id;
          if (!oid) return;
          setSelectedOrderForEdit({ orderId: oid, id: oid, notes: (ord as any)?.notes || null } as any);
        }}
        onArchive={async (orderId: string) => {
          const reason = window.prompt('Provide an archive reason (optional):') || undefined;
          try {
            await archiveAPI.archiveEntity('order', orderId, reason);
            alert('Order archived successfully.');
            // Keep modal open; it will refresh on next open
            mutate('/admin/directory/orders');
            mutate('/admin/directory/activities');
          } catch (err) {
            console.error('[admin] archive order failed', err);
            alert('Failed to archive order');
          }
        }}
        onRestore={async (orderId: string) => {
          try {
            await archiveAPI.restoreEntity('order', orderId);
            alert('Order restored successfully.');
            mutate('/admin/directory/orders');
            mutate('/admin/directory/activities');
          } catch (err) {
            console.error('[admin] restore order failed', err);
            alert('Failed to restore order');
          }
        }}
        onDelete={async (orderId: string) => {
          const confirmed = window.confirm('Permanently delete this order? This cannot be undone.');
          if (!confirmed) return;
          const reason = window.prompt('Provide a deletion reason (optional):') || undefined;
          try {
            await archiveAPI.hardDelete('order', orderId, reason);
            alert('Order permanently deleted.');
            setSelectedOrderId(null);
            mutate('/admin/directory/orders');
            mutate('/admin/directory/activities');
          } catch (err) {
            console.error('[admin] hard delete order failed', err);
            alert('Failed to delete order');
          }
        }}
      />}

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
            setSelectedOrderForEdit(null);
            handleModalClose();
            // Refresh orders list and activities (order details will refetch automatically via hook)
            mutate('/admin/directory/orders');
            mutate('/admin/directory/activities');
          } catch (error) {
            console.error('Failed to update order:', error);
            alert(`Failed to update order: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }}
      />

      {/* User modals now handled by universal modal system via ModalProvider */}
    </div>
  );

}
