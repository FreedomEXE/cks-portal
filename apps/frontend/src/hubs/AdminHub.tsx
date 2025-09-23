/*-----------------------------------------------
  Property of CKS  © 2025
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

import { inferRoleFromIdentifier, normalizeImpersonationCode, persistImpersonation } from '@cks/auth';
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
  DataTable,
  NavigationTab,
  PageHeader,
  PageWrapper,
  Scrollbar,
  TabContainer,
} from '@cks/ui';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import MyHubSection from '../components/MyHubSection';
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

const MILLIS_PER_DAY = 1000 * 60 * 60 * 24;

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
  const normalized = (value ?? 'unassigned').toLowerCase().trim().replace(/\s+/g, '_');
  const palette = STATUS_PALETTES[normalized] ?? STATUS_PALETTES.unknown;
  const label = (value ?? 'Unassigned').replace(/_/g, ' ');
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
    return '�';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '�';
  }
  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatText(value?: string | null): string {
  if (!value) {
    return '�';
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : '�';
}

const HUB_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'directory', label: 'Directory' },
  { id: 'create', label: 'Create' },
  { id: 'assign', label: 'Assign' },
  { id: 'archive', label: 'Archive' },
  { id: 'support', label: 'Support' },
];

const DIRECTORY_TABS: Array<{ id: string; label: string; color: string }> = [
  { id: 'admins', label: 'Admins', color: '#0f172a' },
  { id: 'managers', label: 'Managers', color: '#2563eb' },
  { id: 'contractors', label: 'Contractors', color: '#0ea5e9' },
  { id: 'customers', label: 'Customers', color: '#10b981' },
  { id: 'centers', label: 'Centers', color: '#f97316' },
  { id: 'crew', label: 'Crew', color: '#ef4444' },
  { id: 'warehouses', label: 'Warehouses', color: '#8b5cf6' },
  { id: 'services', label: 'Services', color: '#0ea5e9' },
  { id: 'orders', label: 'Orders', color: '#7c3aed' },
  { id: 'products', label: 'Products', color: '#0f172a' },
  { id: 'training', label: 'Training & Procedures', color: '#ec4899' },
  { id: 'reports', label: 'Reports & Feedback', color: '#6b7280' },
];

interface DirectorySectionConfig {
  columns: Array<{ key: string; label: string; clickable?: boolean; render?: (value: any, row?: any) => ReactNode }>;
  data: Record<string, any>[];
  emptyMessage: string;
}

export default function AdminHub({ initialTab = 'dashboard' }: AdminHubProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [directoryTab, setDirectoryTab] = useState<string>('admins');
  const navigate = useNavigate();

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

  const navigateToHub = useCallback(
    (identifier?: string | null, displayName?: string | null, roleHint?: string | null) => {
      const normalized = normalizeImpersonationCode(identifier ?? null);
      if (!normalized) {
        return;
      }

      const stored = persistImpersonation({
        code: normalized,
        role: roleHint ?? inferRoleFromIdentifier(normalized),
        displayName,
      });

      if (!stored) {
        console.warn('[admin] Unable to prepare impersonation context for', normalized);
        return;
      }

      const pathSegment = normalized.toLowerCase();
      const destination = `/${encodeURIComponent(pathSegment)}/hub`;
      navigate(destination);
    },
    [navigate],
  );

  const handleDirectoryRowClick = useCallback(
    (row: Record<string, any>) => {
      if (!row) {
        return;
      }

      let target: string | null = null;
      let roleHint: string | null = null;
      let displayName: string | null = null;

      switch (directoryTab) {
        case 'admins': {
          const code = typeof row.code === 'string' ? row.code.trim() : '';
          target = code || (typeof row.id === 'string' ? row.id : null);
          displayName =
            typeof row.name === 'string' && row.name.trim()
              ? row.name.trim()
              : typeof row.fullName === 'string' && row.fullName.trim()
                ? row.fullName.trim()
                : typeof row.email === 'string' && row.email.trim()
                  ? row.email.trim()
                  : null;
          roleHint = 'admin';
          break;
        }
        case 'managers': {
          const managerId = typeof row.managerId === 'string' ? row.managerId.trim() : '';
          target = managerId || (typeof row.id === 'string' ? row.id : null);
          displayName =
            typeof row.name === 'string' && row.name.trim()
              ? row.name.trim()
              : typeof row.fullName === 'string' && row.fullName.trim()
                ? row.fullName.trim()
                : null;
          roleHint = 'manager';
          break;
        }
        case 'contractors': {
          target = typeof row.id === 'string' ? row.id : null;
          displayName =
            typeof row.companyName === 'string' && row.companyName.trim()
              ? row.companyName.trim()
              : typeof row.name === 'string' && row.name.trim()
                ? row.name.trim()
                : null;
          roleHint = 'contractor';
          break;
        }
        case 'customers': {
          target = typeof row.id === 'string' ? row.id : null;
          displayName =
            typeof row.name === 'string' && row.name.trim()
              ? row.name.trim()
              : typeof row.companyName === 'string' && row.companyName.trim()
                ? row.companyName.trim()
                : null;
          roleHint = 'customer';
          break;
        }
        case 'centers': {
          target = typeof row.id === 'string' ? row.id : null;
          displayName =
            typeof row.name === 'string' && row.name.trim()
              ? row.name.trim()
              : null;
          roleHint = 'center';
          break;
        }
        case 'crew': {
          target = typeof row.id === 'string' ? row.id : null;
          displayName =
            typeof row.name === 'string' && row.name.trim()
              ? row.name.trim()
              : null;
          roleHint = 'crew';
          break;
        }
        case 'warehouses': {
          target = typeof row.id === 'string' ? row.id : null;
          displayName =
            typeof row.name === 'string' && row.name.trim()
              ? row.name.trim()
              : null;
          roleHint = 'warehouse';
          break;
        }
        default: {
          target = null;
        }
      }

      if (typeof target !== 'string') {
        return;
      }

      const trimmed = target.trim();
      if (!trimmed) {
        return;
      }

      navigateToHub(trimmed, displayName, roleHint);
    },
    [directoryTab, navigateToHub],
  );

  const overviewCards = useMemo(
    () => [
      { id: 'users', title: 'Total Users', dataKey: 'userCount', color: 'black' },
      { id: 'tickets', title: 'Open Support Tickets', dataKey: 'ticketCount', color: '#2563eb' },
      { id: 'priority', title: 'High Priority', dataKey: 'highPriorityCount', color: '#dc2626' },
      { id: 'uptime', title: 'Days Online', dataKey: 'daysOnline', color: '#16a34a' },
    ],
    [],
  );

  const overviewData = useMemo(() => {
    const totalUsers =
      adminUsers.length +
      managers.length +
      contractors.length +
      customers.length +
      centers.length +
      crew.length;

    const openReportsCount = reports.filter((report) => {
      const status = (report.status ?? '').toLowerCase();
      return status === 'open' || status === 'pending' || status === 'in_progress';
    }).length;

    const highPriorityReports = reports.filter((report) => {
      return typeof report.severity === 'string' && report.severity.toLowerCase().includes('high');
    }).length;

    const timestamps: number[] = [];
    const pushTimestamp = (value?: string | null) => {
      if (!value) {
        return;
      }
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        timestamps.push(parsed.getTime());
      }
    };

    adminUsers.forEach((user) => pushTimestamp(user.createdAt));
    managers.forEach((manager) => pushTimestamp(manager.createdAt));
    contractors.forEach((contractor) => pushTimestamp(contractor.createdAt));
    warehouses.forEach((warehouse) => pushTimestamp(warehouse.createdAt));

    if (timestamps.length === 0 && activityItems.length > 0) {
      activityItems.forEach((activity) => {
        const timestamp =
          activity.timestamp instanceof Date ? activity.timestamp : new Date(activity.timestamp);
        if (!Number.isNaN(timestamp.getTime())) {
          timestamps.push(timestamp.getTime());
        }
      });
    }

    let daysOnline = 0;
    if (timestamps.length) {
      const earliest = Math.min(...timestamps);
      daysOnline = Math.max(1, Math.round((Date.now() - earliest) / MILLIS_PER_DAY));
    } else if (GO_LIVE_TIMESTAMP && GO_LIVE_TIMESTAMP <= Date.now()) {
      daysOnline = Math.max(0, Math.round((Date.now() - GO_LIVE_TIMESTAMP) / MILLIS_PER_DAY));
    }

    if ((!GO_LIVE_TIMESTAMP || GO_LIVE_TIMESTAMP > Date.now()) && timestamps.length === 0) {
      daysOnline = 0;
    }

    return {
      userCount: totalUsers,
      ticketCount: openReportsCount,
      highPriorityCount: highPriorityReports,
      daysOnline,
    };
  }, [activityItems, adminUsers, managers, contractors, warehouses, crew, customers, centers, reports]);

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
        companyName: formatText(contractor.companyName),
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
        managerId: formatText(customer.managerId),
        contactName: formatText(customer.contactName),
        email: formatText(customer.email),
        phone: formatText(customer.phone),
        totalCenters: customer.totalCenters ?? 0,
        status: customer.managerId ? 'active' : 'unassigned',
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
        email: formatText(center.email),
        phone: formatText(center.phone),
        status: center.customerId ? 'active' : 'unassigned',
      })),
    [centers],
  );

  const crewRows = useMemo(
    () =>
      crew.map((member) => ({
        id: member.id,
        name: formatText(member.name),
        role: formatText(member.role),
        email: formatText(member.email),
        phone: formatText(member.phone),
        assignedCenter: formatText(member.assignedCenter),
        status: member.assignedCenter ? 'active' : 'unassigned',
      })),
    [crew],
  );

  const warehouseRows = useMemo(
    () =>
      warehouses.map((warehouse) => ({
        id: warehouse.id,
        name: formatText(warehouse.name),
        managerName: formatText(warehouse.managerName),
        warehouseType: formatText(warehouse.warehouseType),
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
      orders.map((order) => ({
        id: order.id,
        customerId: formatText(order.customerId),
        centerId: formatText(order.centerId),
        serviceId: formatText(order.serviceId),
        status: formatText(order.status),
        orderDate: formatDate(order.orderDate),
      })),
    [orders],
  );

  const productRows = useMemo(
    () =>
      products.map((product) => ({
        id: product.id,
        name: formatText(product.name),
        category: formatText(product.category),
        status: formatText(product.status),
        updatedAt: formatDate(product.updatedAt),
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

  const directoryConfig = useMemo(() => ({
    admins: {
      columns: [
        { key: 'code', label: 'ADMIN ID', clickable: true },
        { key: 'name', label: 'NAME' },
        { key: 'email', label: 'EMAIL' },
        { key: 'role', label: 'ROLE' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'createdAt', label: 'CREATED' },
      ],
      data: adminRows,
      emptyMessage: 'No admin users found yet.',
    },
    managers: {
      columns: [
        { key: 'managerId', label: 'MANAGER ID', clickable: true },
        { key: 'name', label: 'NAME' },
        { key: 'territory', label: 'TERRITORY' },
        { key: 'email', label: 'EMAIL' },
        { key: 'phone', label: 'PHONE' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
      ],
      data: managerRows,
      emptyMessage: 'No managers found.',
    },
    contractors: {
      columns: [
        { key: 'id', label: 'CONTRACTOR ID', clickable: true },
        { key: 'companyName', label: 'COMPANY' },
        { key: 'managerId', label: 'ASSIGNED MANAGER' },
        { key: 'email', label: 'EMAIL' },
        { key: 'phone', label: 'PHONE' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
      ],
      data: contractorRows,
      emptyMessage: 'No contractors found.',
    },
    customers: {
      columns: [
        { key: 'id', label: 'CUSTOMER ID', clickable: true },
        { key: 'name', label: 'NAME' },
        { key: 'managerId', label: 'MANAGER' },
        { key: 'contactName', label: 'CONTACT' },
        { key: 'email', label: 'EMAIL' },
        { key: 'totalCenters', label: '# CENTERS' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
      ],
      data: customerRows,
      emptyMessage: 'No customers found.',
    },
    centers: {
      columns: [
        { key: 'id', label: 'CENTER ID', clickable: true },
        { key: 'name', label: 'NAME' },
        { key: 'customerId', label: 'CUSTOMER' },
        { key: 'contractorId', label: 'CONTRACTOR' },
        { key: 'managerId', label: 'MANAGER' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
      ],
      data: centerRows,
      emptyMessage: 'No centers found.',
    },
    crew: {
      columns: [
        { key: 'id', label: 'CREW ID', clickable: true },
        { key: 'name', label: 'NAME' },
        { key: 'role', label: 'ROLE' },
        { key: 'assignedCenter', label: 'ASSIGNED CENTER' },
        { key: 'phone', label: 'PHONE' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
      ],
      data: crewRows,
      emptyMessage: 'No crew members found.',
    },
    warehouses: {
      columns: [
        { key: 'id', label: 'WAREHOUSE ID', clickable: true },
        { key: 'name', label: 'NAME' },
        { key: 'managerName', label: 'MANAGER' },
        { key: 'warehouseType', label: 'TYPE' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'createdAt', label: 'CREATED' },
      ],
      data: warehouseRows,
      emptyMessage: 'No warehouses found.',
    },
    services: {
      columns: [
        { key: 'id', label: 'SERVICE ID', clickable: true },
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
        { key: 'id', label: 'ORDER ID', clickable: true },
        { key: 'customerId', label: 'CUSTOMER' },
        { key: 'centerId', label: 'CENTER' },
        { key: 'serviceId', label: 'SERVICE' },
        { key: 'status', label: 'STATUS', render: renderStatusBadge },
        { key: 'orderDate', label: 'ORDER DATE' },
      ],
      data: orderRows,
      emptyMessage: 'No orders recorded.',
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
    },
    training: {
      columns: [
        { key: 'id', label: 'TRAINING ID', clickable: true },
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
        { key: 'id', label: 'PROCEDURE ID', clickable: true },
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
        { key: 'id', label: 'FEEDBACK ID', clickable: true },
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
              columns={directoryConfig.training.columns}
              data={directoryConfig.training.data}
              emptyMessage={directoryConfig.training.emptyMessage}
              searchPlaceholder="Search training..."
              maxItems={25}
              showSearch
              onRowClick={handleDirectoryRowClick}
            />
          </div>
          <div style={{ width: '48%' }}>
            <DataTable
              columns={directoryConfig.procedures.columns}
              data={directoryConfig.procedures.data}
              emptyMessage={directoryConfig.procedures.emptyMessage}
              searchPlaceholder="Search procedures..."
              maxItems={25}
              showSearch
              onRowClick={handleDirectoryRowClick}
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
              columns={directoryConfig.reports.columns}
              data={directoryConfig.reports.data}
              emptyMessage={directoryConfig.reports.emptyMessage}
              searchPlaceholder="Search reports..."
              maxItems={25}
              showSearch
              onRowClick={handleDirectoryRowClick}
            />
          </div>
          <div style={{ width: '48%' }}>
            <DataTable
              columns={directoryConfig.feedback.columns}
              data={directoryConfig.feedback.data}
              emptyMessage={directoryConfig.feedback.emptyMessage}
              searchPlaceholder="Search feedback..."
              maxItems={25}
              showSearch
              onRowClick={handleDirectoryRowClick}
            />
          </div>
        </div>
      );
    }
    const section = directoryConfig[directoryTab];
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
        onRowClick={handleDirectoryRowClick}
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
            <ArchiveSection />
          ) : activeTab === 'support' ? (
            <PageWrapper headerSrOnly>
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
    </div>
  );
}


















