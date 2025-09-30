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
  type Activity,
} from '@cks/domain-widgets';
import {
  ActionModal,
  Button,
  DataTable,
  NavigationTab,
  PageHeader,
  PageWrapper,
  Scrollbar,
  TabContainer,
} from '@cks/ui';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';

import MyHubSection from '../components/MyHubSection';
import { useLogout } from '../hooks/useLogout';
import { archiveAPI, type EntityType } from '../shared/api/archive';
import '../shared/api/test-archive'; // Temporary test import
import AdminAssignSection from './components/AdminAssignSection';
import AdminCreateSection from './components/AdminCreateSection';

import { useAdminUsers } from '../shared/api/admin';
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

const DIRECTORY_TABS: Array<{ id: string; label: string; color: string }> = [
  { id: 'admins', label: 'Admins', color: '#0f172a' },
  { id: 'managers', label: 'Managers', color: '#2563eb' },
  { id: 'contractors', label: 'Contractors', color: '#10b981' },
  { id: 'customers', label: 'Customers', color: '#eab308' },
  { id: 'centers', label: 'Centers', color: '#f97316' },
  { id: 'crew', label: 'Crew', color: '#ef4444' },
  { id: 'warehouses', label: 'Warehouses', color: '#8b5cf6' },
  { id: 'services', label: 'Services', color: '#14b8a6' },
  { id: 'orders', label: 'Orders', color: '#6366f1' },
  { id: 'products', label: 'Products', color: '#d946ef' },
  { id: 'training', label: 'Training & Procedures', color: '#ec4899' },
  { id: 'reports', label: 'Reports & Feedback', color: '#92400e' },
];

interface DirectorySectionConfig {
  columns: Array<{ key: string; label: string; clickable?: boolean; render?: (value: any, row?: any) => ReactNode }>;
  data: Record<string, any>[];
  emptyMessage: string;
}

export default function AdminHub({ initialTab = 'dashboard' }: AdminHubProps) {
  // Dynamic overview cards for admin metrics
  const overviewCards = [
    { id: 'users', title: 'Total Users', dataKey: 'userCount', color: 'blue' },
    { id: 'tickets', title: 'Open Support Tickets', dataKey: 'ticketCount', color: 'orange' },
    { id: 'priority', title: 'High Priority', dataKey: 'highPriorityCount', color: 'red' },
    { id: 'days', title: 'Days Online', dataKey: 'daysOnline', color: 'green' },
  ];
  const [activeTab, setActiveTab] = useState(initialTab);
  const [directoryTab, setDirectoryTab] = useState<string>('admins');
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Record<string, any> | null>(null);
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
  const { data: reports, isLoading: reportsLoading, error: reportsError } = useReports();
  const { data: feedbackEntries, isLoading: feedbackLoading, error: feedbackError } = useFeedback();
  const { data: activityItems, isLoading: activitiesLoading, error: activitiesError } = useActivities();

  const [activityFeed, setActivityFeed] = useState<Activity[]>([]);

  useEffect(() => {
    setActivityFeed(activityItems);
  }, [activityItems]);

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
      // Determine entity type based on the active directory tab
      let entityType: EntityType | null = null;
      let entityId: string | null = null;

      // Check which tab we're in and extract the appropriate ID
      if (directoryTab === 'orders' && entity.orderId) {
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
      } else if (directoryTab === 'services' && entity.id) {
        entityType = 'service';
        entityId = entity.id;
      } else if (directoryTab === 'products' && entity.id) {
        entityType = 'product';
        entityId = (entity as any).rawId || entity.id;
      } else if (entity.id) {
        // Fallback to generic id field and guess based on tab
        entityId = entity.id;
        if (directoryTab === 'managers') entityType = 'manager';
        else if (directoryTab === 'contractors') entityType = 'contractor';
        else if (directoryTab === 'customers') entityType = 'customer';
        else if (directoryTab === 'centers') entityType = 'center';
        else if (directoryTab === 'crew') entityType = 'crew';
        else if (directoryTab === 'warehouses') entityType = 'warehouse';
        else if (directoryTab === 'services') entityType = 'service';
        else if (directoryTab === 'products') entityType = 'product';
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
    [handleModalClose, directoryTab, mutate],
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
        status: formatText(service.status),
        updatedAt: formatDate(service.updatedAt),
      })),
    [services],
  );

  const orderRows = useMemo(
    () =>
      orders.map((order) => {
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
    services: {
      columns: [
        { key: 'id', label: 'SERVICE ID' },
        { key: 'name', label: 'NAME' },
        { key: 'category', label: 'CATEGORY' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'updatedAt', label: 'UPDATED' },
      ],
      data: serviceRows,
      emptyMessage: 'No services in the catalog yet.',
    },
    orders: {
      columns: [
        { key: 'id', label: 'ORDER ID' },
        { key: 'orderType', label: 'TYPE' },
        { key: 'requestedBy', label: 'REQUESTED BY' },
        { key: 'destination', label: 'DESTINATION' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'orderDate', label: 'CREATED' },
        { key: 'actions', label: 'ACTIONS', render: renderActions },
      ],
      data: orderRows,
      emptyMessage: 'No orders recorded.',
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
    orderRows,
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
    if (directoryTab === 'reports') {
      return (
        <div style={{ display: 'flex', gap: '4%' }}>
          <div style={{ width: '48%' }}>
            <DataTable
              columns={(directoryConfig as any).reports.columns}
              data={(directoryConfig as any).reports.data}
              emptyMessage={(directoryConfig as any).reports.emptyMessage}
              searchPlaceholder="Search reports..."
              maxItems={25}
              showSearch
            />
          </div>
          <div style={{ width: '48%' }}>
            <DataTable
              columns={(directoryConfig as any).feedback.columns}
              data={(directoryConfig as any).feedback.data}
              emptyMessage={(directoryConfig as any).feedback.emptyMessage}
              searchPlaceholder="Search feedback..."
              maxItems={25}
              showSearch
            />
          </div>
        </div>
      );
    }
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
            <ArchiveSection archiveAPI={archiveAPI} />
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
          // Determine title based on entity type
          if (directoryTab === 'orders') return 'Order Actions';
          if (directoryTab === 'products') return 'Product Actions';
          if (directoryTab === 'services') return 'Service Actions';
          if (directoryTab === 'warehouses') return 'Warehouse Actions';
          return undefined; // Use default title for users
        })()}
        actions={(() => {
          // Different actions based on entity type
          if (directoryTab === 'orders') {
            return [
              {
                label: 'View Details',
                variant: 'secondary' as const,
                onClick: () => console.log('View order details:', selectedEntity),
              },
              {
                label: 'Edit Order',
                variant: 'secondary' as const,
                onClick: () => console.log('Edit order:', selectedEntity),
              },
              {
                label: 'Cancel Order',
                variant: 'secondary' as const,
                onClick: () => console.log('Cancel order:', selectedEntity),
              },
              {
                label: 'Delete Order',
                variant: 'danger' as const,
                onClick: () => selectedEntity && handleDelete(selectedEntity),
              },
            ];
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
                onClick: () => console.log('Update inventory:', selectedEntity),
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
                onClick: () => console.log('View service:', selectedEntity),
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
    </div>
  );

}









































