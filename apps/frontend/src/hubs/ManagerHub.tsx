/*-----------------------------------------------
  Property of CKS  Ac 2025
-----------------------------------------------*/

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@cks/auth';
import { EcosystemTree } from '@cks/domain-widgets';
import { useFormattedActivities } from '../shared/activity/useFormattedActivities';
import { ActivityFeed } from '../components/ActivityFeed';
import {
  MemosPreview,
  NewsPreview,
  OrdersSection,
  OverviewSection,
  ProfileInfoCard,
  ReportsSection,
  SupportSection,
  type Activity,
  type ReportFeedback,
} from '@cks/domain-widgets';
import {
  Button,
  DataTable,
  ModalProvider,
  OrderDetailsModal,
  ProductOrderModal,
  ServiceOrderModal,
  ServiceViewModal,
  PageHeader,
  PageWrapper,
  Scrollbar,
  TabSection,
} from '@cks/ui';
import { ServiceDetailsModal } from '@cks/ui';
import MyHubSection from '../components/MyHubSection';
import { useCatalogItems } from '../shared/api/catalog';
import { useLogout } from '../hooks/useLogout';

/**
 * File: ManagerHub.tsx
 *
 * Description:
 * Manager Hub orchestrator component
 *
 * Responsibilities:
 * - Orchestrate manager role hub interface
 * - Manage tab navigation and content rendering
 *
 * Role in system:
 * - Primary interface for manager users
 *
 * Notes:
 * Uses MyHubSection for navigation
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import {
  useHubReports,
  useHubRoleScope,
  useHubActivities,
  useHubOrders,
  useHubProfile,
  useHubDashboard,
  applyHubOrderAction,
  type HubReportItem,
  type HubOrderItem,
  type OrderActionRequest,
} from '../shared/api/hub';
import { createReport as apiCreateReport, createFeedback as apiCreateFeedback, acknowledgeItem as apiAcknowledgeItem, resolveReport as apiResolveReport, fetchServicesForReports, fetchProceduresForReports, fetchOrdersForReports } from '../shared/api/hub';
import { useSWRConfig } from 'swr';
import { buildEcosystemTree } from '../shared/utils/ecosystem';
import { useHubLoading } from '../contexts/HubLoadingContext';

interface ManagerHubProps {
  initialTab?: string;
}

type OrderStatus =
  | 'pending'
  | 'in-progress'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'delivered'
  | 'completed'
  | 'archived'
  | 'service-created'
  | 'pending-customer'
  | 'pending-contractor'
  | 'pending-manager'
  | 'manager-accepted'
  | 'crew-requested'
  | 'crew-assigned';

type HubOrder = {
  orderId: string;
  orderType: 'service' | 'product';
  title: string;
  requestedBy: string;
  destination?: string;
  requestedDate: string;
  expectedDate?: string;
  serviceStartDate?: string;
  deliveryDate?: string;
  status: OrderStatus;
  approvalStages?: Array<{
    role: string;
    status: 'pending' | 'approved' | 'rejected' | 'waiting' | 'accepted' | 'requested' | 'delivered';
    user?: string;
    timestamp?: string;
  }>;
  transformedId?: string;
  availableActions?: string[];
};

type ManagerServiceEntry = {
  id: string;
  name: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  category: string | null;
};

const HUB_TABS = [
  { id: 'dashboard', label: 'Dashboard', path: '/manager/dashboard' },
  { id: 'profile', label: 'My Profile', path: '/manager/profile' },
  { id: 'ecosystem', label: 'My Ecosystem', path: '/manager/ecosystem' },
  { id: 'services', label: 'My Services', path: '/manager/services' },
  { id: 'procedures', label: 'Procedures', path: '/manager/procedures' },
  { id: 'training', label: 'Training', path: '/manager/training' },
  { id: 'orders', label: 'Orders', path: '/manager/orders' },
  { id: 'reports', label: 'Reports', path: '/manager/reports' },
  { id: 'support', label: 'Support', path: '/manager/support' },
];

const OVERVIEW_CARDS = [
  { id: 'contractors', title: 'My Contractors', dataKey: 'contractorCount', color: 'green' },
  { id: 'customers', title: 'My Customers', dataKey: 'customerCount', color: 'yellow' },
  { id: 'centers', title: 'My Centers', dataKey: 'centerCount', color: 'orange' },
  { id: 'crew', title: 'My Crew', dataKey: 'crewCount', color: 'red' },
  { id: 'orders', title: 'Pending Orders', dataKey: 'pendingOrders', color: 'indigo' },
  { id: 'status', title: 'Account Status', dataKey: 'accountStatus', color: 'green' },
];

const MY_SERVICES_COLUMNS = [
  { key: 'serviceId', label: 'SERVICE ID', clickable: true },
  { key: 'serviceName', label: 'SERVICE NAME' },
  { key: 'certified', label: 'CERTIFIED' },
  { key: 'certificationDate', label: 'CERTIFICATION DATE' },
  { key: 'expires', label: 'EXPIRES' },
];

const ACTIVE_SERVICES_COLUMNS = [
  { key: 'serviceId', label: 'SERVICE ID', clickable: true },
  { key: 'serviceName', label: 'SERVICE NAME' },
  { key: 'centerId', label: 'CENTER ID' },
  { key: 'type', label: 'TYPE' },
  {
    key: 'status',
    label: 'STATUS',
    render: (value: string) => {
      const palette = getStatusBadgePalette(value);
      return (
        <span
          style={{
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500,
            backgroundColor: palette.background,
            color: palette.color,
          }}
        >
          {value ?? '—'}
        </span>
      );
    },
  },
  { key: 'startDate', label: 'START DATE' },
  {
    key: 'actions',
    label: 'ACTIONS',
    render: (_: any, row: any) => {
      const status = (row.status || '').toLowerCase();
      const isCreated = status === 'created';
      const isInProgress = status === 'in progress' || status === 'in_progress' || status === 'active';

      return (
        <div style={{ display: 'flex', gap: 8 }}>
          {isCreated && (
            <Button size="sm" variant="primary" onClick={row.onStart}>
              Start Service
            </Button>
          )}
          {isInProgress && (
            <Button size="sm" variant="primary" onClick={row.onComplete}>
              Complete
            </Button>
          )}
          <Button size="sm" onClick={row.onViewDetails}>
            View Details
          </Button>
        </div>
      );
    }
  }
];

const SERVICE_HISTORY_COLUMNS = [
  { key: 'serviceId', label: 'SERVICE ID', clickable: true },
  { key: 'serviceName', label: 'SERVICE NAME' },
  { key: 'centerId', label: 'CENTER ID' },
  { key: 'type', label: 'TYPE' },
  {
    key: 'status',
    label: 'STATUS',
    render: (value: string | null | undefined) => {
      if (!value) {
        return (
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#e2e8f0',
              color: '#475569',
            }}
          >
            N/A
          </span>
        );
      }
      const palette = getStatusBadgePalette(value);
      return (
        <span
          style={{
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500,
            backgroundColor: palette.background,
            color: palette.color,
          }}
        >
          {formatStatusLabel(value)}
        </span>
      );
    },
  },
  { key: 'startDate', label: 'START DATE' },
  { key: 'endDate', label: 'END DATE' },
];

const MANAGER_PRIMARY_COLOR = '#3b82f6';

const REPORT_CATEGORY_VALUES = new Set<ReportFeedback['category']>([
  'Service Quality',
  'Product Quality',
  'Crew Performance',
  'Delivery Issues',
  'System Bug',
  'Safety Concern',
  'Other',
]);

const FEEDBACK_CATEGORY_VALUES = new Set<ReportFeedback['category']>([
  'Service Excellence',
  'Staff Performance',
  'Process Improvement',
  'Product Suggestion',
  'System Enhancement',
  'Recognition',
  'Other',
]);

function normalizeReportCategory(item: HubReportItem, fallbackType: 'report' | 'feedback'): ReportFeedback['category'] {
  const rawCategory = (item.category ?? '').trim();
  const type = item.type === 'report' || item.type === 'feedback' ? item.type : fallbackType;
  const categories = type === 'feedback' ? FEEDBACK_CATEGORY_VALUES : REPORT_CATEGORY_VALUES;
  if (categories.has(rawCategory as ReportFeedback['category'])) {
    return rawCategory as ReportFeedback['category'];
  }
  return 'Other';
}

function mapHubReportItem(item: HubReportItem, fallbackType: 'report' | 'feedback'): ReportFeedback {
  const type = item.type === 'report' || item.type === 'feedback' ? item.type : fallbackType;
  const category = normalizeReportCategory(item, type);
  const status = item.status === 'closed' ? 'closed' : 'open';
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const acknowledgments = Array.isArray(item.acknowledgments)
    ? item.acknowledgments.map((ack) => ({
        userId: ack.userId ?? 'unknown',
        date: ack.date ?? new Date().toISOString(),
      }))
    : [];

  return {
    id: item.id,
    type,
    category,
    tags,
    title: item.title ?? 'Untitled',
    description: item.description ?? '',
    submittedBy: item.submittedBy ?? 'System',
    submittedDate: item.submittedDate ?? new Date().toISOString(),
    status,
    relatedService: item.relatedService ?? undefined,
    acknowledgments,
  };
}


// Tree node type is provided by domain-widgets

function normalizeId(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return 'N/A';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function normalizeOrderStatus(status: string | null | undefined): OrderStatus {
  const normalized = (status ?? 'pending').trim().toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
  switch (normalized) {
    case 'pending':
    case 'approved':
    case 'rejected':
    case 'cancelled':
    case 'delivered':
    case 'completed':
    case 'archived':
    case 'pending-customer':
    case 'pending-contractor':
    case 'pending-manager':
    case 'manager-accepted':
    case 'crew-requested':
    case 'crew-assigned':
    case 'service-created':
      return normalized;
    case 'in-progress':
    case 'inprogress':
    case 'processing':
    case 'scheduled':
      return 'in-progress';
    case 'closed':
      return 'cancelled';
    default:
      return 'pending';
  }
}

function formatStatusLabel(status: string | null | undefined): string {
  const normalized = normalizeOrderStatus(status);
  if (normalized === 'in-progress' || normalized === 'in_progress') {
    return 'Active';
  }
  if (normalized === 'service-created') {
    return 'Service Created';
  }
  return normalized.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusBadgePalette(value: string): { background: string; color: string } {
  const normalized = normalizeOrderStatus(value);
  switch (normalized) {
    case 'delivered':
    case 'approved':
    case 'completed':
    case 'archived':
    case 'pending-customer':
    case 'pending-contractor':
    case 'pending-manager':
    case 'manager-accepted':
    case 'crew-requested':
    case 'crew-assigned':
    case 'service-created':
      return { background: '#dcfce7', color: '#16a34a' };
    case 'pending':
      return { background: '#fef9c3', color: '#b45309' };
    case 'in-progress':
    case 'in_progress':
      return { background: '#dbeafe', color: '#1d4ed8' }; // Blue for active services
    case 'rejected':
    case 'cancelled':
      return { background: '#fee2e2', color: '#dc2626' };
    default:
      return { background: '#e2e8f0', color: '#475569' };
  }
}

function formatAccountStatus(status: string | null | undefined): string {
  if (!status) {
    return 'Unknown';
  }
  const trimmed = status.trim();
  if (!trimmed) {
    return 'Unknown';
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function formatReportsTo(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed === trimmed.toUpperCase()) {
    return trimmed;
  }
  return trimmed
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Sorting is handled within the shared ecosystem builder where applicable

export default function ManagerHub({ initialTab = 'dashboard' }: ManagerHubProps) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [servicesTab, setServicesTab] = useState<'my' | 'active' | 'history'>('my');
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Service modal state (for Active Services section)
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  const [serviceDetails, setServiceDetails] = useState<any>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  const { code, fullName, firstName } = useAuth();
  const logout = useLogout();
  const { setHubLoading } = useHubLoading();



  const managerCode = useMemo(() => normalizeId(code), [code]);

  // Fetch hub-scoped data
  const { data: profileData } = useHubProfile(managerCode);
  const { data: dashboardData } = useHubDashboard(managerCode);
  const { data: scopeData } = useHubRoleScope(managerCode);
  const { activities: formattedActivities, isLoading: activitiesLoading, error: activitiesError } = useFormattedActivities(managerCode, { limit: 20 });

  const { data: ordersData } = useHubOrders(managerCode);
  const { mutate } = useSWRConfig();

  // Signal when critical data is loaded (but only if NOT showing new order)
  useEffect(() => {
    const hasCriticalData = !!profileData && !!dashboardData;
    if (hasCriticalData) {
      console.log('[ManagerHub] Critical data loaded, signaling ready');
      setHubLoading(false);
    }
  }, [profileData, dashboardData, setHubLoading]);

  // Extract role-scoped entities from scope data
  const managerScope = scopeData?.role === 'manager' ? scopeData : null;
  const contractorEntries = managerScope?.relationships.contractors ?? [];
  const customerEntries = managerScope?.relationships.customers ?? [];
  const centerEntries = managerScope?.relationships.centers ?? [];
  const crewEntries = managerScope?.relationships.crew ?? [];
  const serviceEntries = useMemo<ManagerServiceEntry[]>(() => {
    if (!ordersData?.serviceOrders) {
      return [];
    }
    const map = new Map<string, ManagerServiceEntry>();
    ordersData.serviceOrders.forEach((order) => {
      // Only include once a Service exists (serviceId or transformedId)
      const serviceId = normalizeId(order.serviceId ?? order.transformedId ?? null);
      if (!serviceId) {
        return; // Skip untransformed service orders
      }
      const existing = map.get(serviceId);
      const status = order.status ?? null;
      const createdAt = order.orderDate ?? order.requestedDate ?? null;
      const updatedAt = order.completionDate ?? order.expectedDate ?? null;
      const name = order.title ?? order.serviceId ?? serviceId;
      if (existing) {
        map.set(serviceId, {
          ...existing,
          name: existing.name ?? name,
          status: status ?? existing.status,
          createdAt: existing.createdAt ?? createdAt,
          updatedAt: updatedAt ?? existing.updatedAt,
        });
      } else {
        map.set(serviceId, {
          id: serviceId,
          name,
          status,
          createdAt,
          updatedAt,
          category: 'Service',
        });
      }
    });
    return Array.from(map.values());
  }, [ordersData]);
  const orderEntries = useMemo<HubOrderItem[]>(() => {
    if (!ordersData) {
      return [];
    }
    let orders: any[] = [];
    if (Array.isArray(ordersData.orders) && ordersData.orders.length > 0) {
      orders = ordersData.orders;
    } else {
      const serviceOrders = ordersData.serviceOrders ?? [];
      const productOrders = ordersData.productOrders ?? [];
      orders = [...serviceOrders, ...productOrders];
    }
    // Use viewerStatus for display, keep actual status for filtering
    return orders.map(order => ({
      ...order,
      status: order.viewerStatus as any,
      actualStatus: order.status,
    }));
  }, [ordersData]);

  const managerRecord = profileData;
  const managerDisplayName = profileData?.name ?? fullName ?? firstName ?? 'Manager';
  const managerRootId = profileData?.cksCode ?? managerCode ?? 'MANAGER';

  // Fetch reports data
  const { data: reportsData, isLoading: reportsLoading, mutate: mutateReports } = useHubReports(managerCode);
  // IMPORTANT: Pass through structured fields from backend (reportCategory, relatedEntityId, reportReason, priority)
  // WarehouseHub already passes raw items; align ManagerHub to preserve all fields
  const managerReports = useMemo<ReportFeedback[]>(
    () => (reportsData?.reports ?? []) as unknown as ReportFeedback[],
    [reportsData],
  );

  const managerFeedback = useMemo<ReportFeedback[]>(
    () => (reportsData?.feedback ?? []) as unknown as ReportFeedback[],
    [reportsData],
  );

  // Debug: verify structured fields are present for permission logic & modal
  useEffect(() => {
    if (reportsData?.reports) {
      const dbg = (reportsData.reports as any[]).map((r) => ({
        id: r.id,
        reportCategory: (r as any).reportCategory,
        priority: (r as any).priority,
      }));
      console.log('ManagerHub reports:', dbg);
    }
  }, [reportsData]);


  // Hub scope data is already filtered for this manager
  const managerContractors = contractorEntries;
  const managerCustomers = customerEntries;

  // Hub scope data is already filtered for this manager
  const managerCenters = centerEntries;

  // Hub scope data is already filtered for this manager
  const managerCrew = crewEntries;

  const customerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    customerEntries.forEach((customer) => {
      const id = normalizeId(customer.id);
      if (id) {
        map.set(id, customer.name ?? customer.mainContact ?? id);
      }
    });
    return map;
  }, [customerEntries]);

  const centerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    centerEntries.forEach((center) => {
      const id = normalizeId(center.id);
      if (id) {
        map.set(id, center.name ?? id);
      }
    });
    return map;
  }, [centerEntries]);

  const serviceById = useMemo(() => {
    const map = new Map<string, (typeof serviceEntries)[number]>();
    serviceEntries.forEach((service) => {
      const id = normalizeId(service.id);
      if (id) {
        map.set(id, service);
      }
    });
    return map;
  }, [serviceEntries]);

  // Hub orders are already filtered for this manager
  const managerServiceOrders = useMemo(
    () => orderEntries.filter((order) => order.orderType === 'service'),
    [orderEntries],
  );
  const managerProductOrders = useMemo(
    () => orderEntries.filter((order) => order.orderType === 'product'),
    [orderEntries],
  );
  // Catalog services list for My Services tab (MVP: show all services to managers)
  const { data: catalogData } = useCatalogItems({ type: 'service', pageSize: 500 });

  const myServicesData = useMemo(() => {
    const items = catalogData?.items || [];
    return items.map((service: any) => ({
      serviceId: service.code ?? 'CAT-SRV',
      serviceName: service.name ?? 'Service',
      certified: 'Yes',
      certificationDate: null,
      expires: null,
    }));
  }, [catalogData]);

  const activeServicesData = useMemo(
    () =>
      managerServiceOrders
        .filter((order) => {
          // Only include transformed services (orders that have been converted to services)
          if (!(order as any).serviceId && !(order as any).transformedId) {
            return false;
          }
          const meta: any = (order as any).metadata || {};
          const svcStatus = (meta?.serviceStatus || '').toLowerCase().replace(/\s+/g, '_');
          if (svcStatus) {
            // Treat created/in_progress as active; completed/cancelled go to history
            return svcStatus === 'created' || svcStatus === 'in_progress';
          }
          const status = normalizeOrderStatus(order.status);
          // Fallback on order status for active list when serviceStatus isn't set yet
          return status === 'pending' || status === 'in-progress' || status === 'approved' || status === 'delivered' || status === 'service-created';
        })
        .map((order) => {
          const rawServiceId = (order as any).serviceId ?? (order as any).transformedId ?? 'Service';
          const serviceId = normalizeId(rawServiceId);
          const service = serviceId ? serviceById.get(serviceId) : null;
          const centerId = normalizeId(order.centerId ?? order.destination);
          const meta: any = (order as any).metadata || {};
          const onStart = async () => {
            try {
              const { applyServiceAction } = await import('../shared/api/hub');
              await applyServiceAction(rawServiceId, 'start');
              mutate(`/hub/orders/${managerCode}`, undefined, { revalidate: true });
              setToast('Service started');
              setTimeout(() => setToast(null), 1800);
            } catch (err) {
              console.error('[manager] failed to start service', err);
              alert(err instanceof Error ? err.message : 'Failed to start service');
            }
          };
          
          const onComplete = async () => {
            try {
              const { applyServiceAction } = await import('../shared/api/hub');
              await applyServiceAction(rawServiceId, 'complete');
              mutate(`/hub/orders/${managerCode}`, undefined, { revalidate: true });
              setToast('Service completed');
              setTimeout(() => setToast(null), 1800);
            } catch (err) {
              console.error('[manager] failed to complete service', err);
              alert(err instanceof Error ? err.message : 'Failed to complete service');
            }
          };

          const onVerify = async () => {
            try {
              const { applyServiceAction } = await import('../shared/api/hub');
              await applyServiceAction(rawServiceId, 'verify');
              mutate(`/hub/orders/${managerCode}`, undefined, { revalidate: true });
            } catch (err) {
              console.error('[manager] failed to verify service', err);
              alert(err instanceof Error ? err.message : 'Failed to verify service');
            }
          };
          const onViewDetails = async () => {
            try {
              const { apiFetch } = await import('../shared/api/client');
              const res = await apiFetch(`/services/${encodeURIComponent(rawServiceId)}`);
              if (res && res.data) {
                setServiceDetails(res.data);
                setShowServiceDetails(true);
              }
            } catch (err) {
              console.error('[manager] failed to load service details', err);
              alert('Failed to load service details. Please try again.');
            }
          };

          const svcStatus = (meta?.serviceStatus || '').toLowerCase().replace(/\s+/g, '_');
          const actualStartDate = meta.actualStartDate || meta.serviceStartDate;
          return {
            serviceId: rawServiceId,
            serviceName: service?.name ?? order.title ?? rawServiceId,
            centerId: centerId ?? 'N/A',
            type: meta.serviceType === 'ongoing' ? 'Ongoing' : 'One-Time',
            // Prefer live service status from metadata if present, fallback to order status
            status: formatStatusLabel((meta && meta.serviceStatus) || order.status),
            startDate: svcStatus === 'created' ? 'Pending' : (actualStartDate ? formatDate(actualStartDate) : formatDate(order.orderDate ?? order.requestedDate)),
            metadata: meta,
            onStart,
            onComplete,
            onVerify,
            onViewDetails,
          };
        }),
    [managerServiceOrders, serviceById, managerCode, mutate],
  );
  const serviceHistoryData = useMemo(
    () =>
      managerServiceOrders
        .filter((order) => {
          if (!(order as any).serviceId && !(order as any).transformedId) {
            return false;
          }
          const meta: any = (order as any).metadata || {};
          const svcStatus = (meta?.serviceStatus || '').toLowerCase().replace(/\s+/g, '_');
          if (svcStatus) {
            return svcStatus === 'completed' || svcStatus === 'cancelled';
          }
          const status = normalizeOrderStatus(order.status);
          return status === 'cancelled' || status === 'rejected' || status === 'completed';
        })
        .map((order) => {
          const rawServiceId = (order as any).serviceId ?? (order as any).transformedId ?? 'Service';
          const serviceId = normalizeId(rawServiceId);
          const service = serviceId ? serviceById.get(serviceId) : null;
          const centerId = normalizeId(order.centerId ?? order.destination);
          const meta: any = (order as any).metadata || {};
          return {
            serviceId: rawServiceId,
            serviceName: service?.name ?? order.title ?? rawServiceId,
            centerId: centerId ?? 'N/A',
            type: service?.category ?? 'Service',
            status: formatStatusLabel((meta && meta.serviceStatus) || order.status),
            startDate: formatDate(order.orderDate ?? order.requestedDate),
            endDate: formatDate((meta && (meta.serviceCompletedAt as string | null)) || order.completionDate || order.expectedDate),
          };
        }),
    [managerServiceOrders, serviceById],
  );
  const overviewData = useMemo(() => {
    if (dashboardData) {
      return {
        contractorCount: dashboardData.contractorCount ?? 0,
        customerCount: dashboardData.customerCount ?? 0,
        centerCount: dashboardData.centerCount ?? 0,
        crewCount: dashboardData.crewCount ?? 0,
        pendingOrders: dashboardData.pendingOrders ?? 0,
        accountStatus: formatAccountStatus(dashboardData.accountStatus),
      };
    }
    // Fallback to counting from scope data
    const pendingOrders = orderEntries.reduce((count, order) => {
      const status = normalizeOrderStatus(order.status);
      return count + (status === 'pending' || status === 'in-progress' ? 1 : 0);
    }, 0);
    return {
      contractorCount: contractorEntries.length,
      customerCount: customerEntries.length,
      centerCount: centerEntries.length,
      crewCount: crewEntries.length,
      pendingOrders,
      accountStatus: formatAccountStatus(profileData?.status),
    };
  }, [dashboardData, contractorEntries, customerEntries, centerEntries, crewEntries, orderEntries, profileData]);

  const managerProfileData = useMemo(
    () => ({
      fullName: managerDisplayName,
      managerId: profileData?.cksCode ?? managerCode ?? 'N/A',
      address: profileData?.address ?? null,
      phone: profileData?.phone ?? null,
      email: profileData?.email ?? null,
      territory: profileData?.metadata?.territory as string ?? null,
      role: profileData?.role ?? 'Manager',
      reportsTo: formatReportsTo(profileData?.metadata?.reportsTo as string ?? null),
      startDate: profileData?.createdAt ? formatDate(profileData.createdAt) : null,
    }),
    [managerCode, managerDisplayName, profileData],
  );

  const managerServiceOrderCards = useMemo<HubOrder[]>(
    () =>
      managerServiceOrders.map((order) => {
        const canonicalOrderId = order.orderId ?? order.id ?? 'ORD-UNKNOWN';
        // Only treat as a service when transformed
        const serviceId = normalizeId(order.serviceId ?? order.transformedId ?? null);
        const service = serviceId ? serviceById.get(serviceId) : null;
        const customerId = normalizeId(order.customerId ?? order.requestedBy);
        const centerId = normalizeId(order.centerId ?? order.destination);
        const status = normalizeOrderStatus(order.viewerStatus ?? order.status);
        const actualStatus = order.status;
        const customerName = customerId ? customerNameMap.get(customerId) : null;
        const requestedByLabel = customerId && customerName
          ? `${customerId} - ${customerName}`
          : customerId || order.customerId || order.requestedBy || 'Customer';
        const centerName = centerId ? centerNameMap.get(centerId) : null;
        const destinationLabel = centerId && centerName
          ? `${centerId} - ${centerName}`
          : centerId || order.destination;
        const requestedDate = order.requestedDate ?? order.orderDate ?? null;
        const expectedDate = order.expectedDate ?? order.completionDate ?? null;
        const deliveryDate = status === 'delivered' ? order.deliveryDate ?? expectedDate : undefined;
        const serviceStartDate = status === 'service-created' ? requestedDate : undefined;
        return {
          orderId: canonicalOrderId,
          orderType: 'service',
          title: service?.name ?? order.title ?? order.serviceId ?? canonicalOrderId,
          requestedBy: requestedByLabel,
          destination: destinationLabel,
          requestedDate: formatDate(requestedDate),
          expectedDate: formatDate(expectedDate),
          serviceStartDate: serviceStartDate ? formatDate(serviceStartDate) : undefined,
          deliveryDate: deliveryDate ? formatDate(deliveryDate) : undefined,
          status,
          actualStatus,
          approvalStages: (order as any).approvalStages || [],
          transformedId: order.transformedId ?? order.serviceId ?? null,
          availableActions: (order as any).availableActions || [],
        };
      }),
    [centerNameMap, customerNameMap, managerServiceOrders, serviceById],
  );
  const managerProductOrderCards = useMemo<HubOrder[]>(
    () =>
      managerProductOrders.map((order) => {
        const canonicalOrderId = order.orderId ?? order.id ?? 'ORD-UNKNOWN';
        const customerId = normalizeId(order.customerId ?? order.requestedBy);
        const centerId = normalizeId(order.centerId ?? order.destination);
        const status = normalizeOrderStatus(order.viewerStatus ?? order.status);
        const actualStatus = order.status;

        const customerName = customerId ? customerNameMap.get(customerId) : null;
        const requestedByLabel = customerId && customerName
          ? `${customerId} - ${customerName}`
          : customerId || order.customerId || order.requestedBy || 'Unknown';
        const centerName = centerId ? centerNameMap.get(centerId) : null;
        const destinationLabel = centerId && centerName
          ? `${centerId} - ${centerName}`
          : centerId || order.destination;

        const requestedDate = order.requestedDate ?? order.orderDate ?? null;
        const expectedDate = order.expectedDate ?? order.completionDate ?? null;
        const deliveryDate = status === 'delivered' ? order.deliveryDate ?? expectedDate : undefined;
        return {
          orderId: canonicalOrderId,
          orderType: 'product',
          title: order.title ?? order.notes ?? `Product Order ${canonicalOrderId}`,
          requestedBy: requestedByLabel,
          destination: destinationLabel,
          requestedDate: formatDate(requestedDate),
          expectedDate: formatDate(expectedDate),
          deliveryDate: deliveryDate ? formatDate(deliveryDate) : undefined,
          status,
          actualStatus,
          approvalStages: (order as any).approvalStages || [],
          availableActions: (order as any).availableActions || [],
        };
      }),
    [centerNameMap, customerNameMap, managerProductOrders],
  );
  const ecosystemTree = useMemo(() => {
    if (managerScope) {
      return buildEcosystemTree(managerScope, { rootName: managerDisplayName });
    }
    return {
      user: { id: managerRootId, role: 'Manager', name: managerDisplayName },
    };
  }, [managerScope, managerDisplayName, managerRootId]);

  const activityEmptyMessage = activitiesError
    ? 'Failed to load activity feed.'
    : activitiesLoading
      ? 'Loading recent activity...'
      : 'No recent manager activity';

  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<HubOrderItem | null>(null);

  const handleOrderAction = useCallback(async (orderId: string, action: string) => {
    if (action === 'View Details') {
      // Search in all orders including archived/completed ones
      let target = ordersData?.orders?.find((o: any) => (o.orderId || o.id) === orderId) || null;

      // If not found in main orders list, search in service/product order cards (includes archived)
      if (!target) {
        target = [...managerServiceOrderCards, ...managerProductOrderCards].find((o: any) => (o.orderId || o.id) === orderId) || null;
      }

      if (target) {
        setSelectedOrderForDetails(target);
      } else {
        console.error('[ManagerHub] Order not found for View Details:', orderId);
      }
      return;
    }

    if (action === 'Cancel') {
      const confirmed = window.confirm('Are you sure you want to cancel this order?');
      if (!confirmed) return;
      const notes = window.prompt('Optional: provide a short reason for cancellation');
      const payload: OrderActionRequest = {
        action: 'cancel',
        ...(notes && notes.trim().length > 0 ? { notes: notes.trim() } : {}),
      };
      try {
        await applyHubOrderAction(orderId, payload);
        mutate(`/hub/orders/${managerCode}`, undefined, { revalidate: true });
        console.log('[manager] order cancelled', { orderId });
      } catch (error) {
        console.error('[manager] failed to cancel order', error);
      }
      return;
    }

    // Handle service order manager actions
    const order = ordersData?.orders?.find((o: any) => (o.orderId || o.id) === orderId);

    if (action === 'Accept') {
      const target = ordersData?.orders?.find((o: any) => (o.orderId || o.id) === orderId) as any;
      const nextRole = (target?.nextActorRole || '').toLowerCase();
      if (nextRole && nextRole !== 'manager') {
        setNotice(`This order is now pending ${nextRole}. Refreshing...`);
        setTimeout(() => setNotice(null), 2000);
        mutate(`/hub/orders/${managerCode}`, undefined, { revalidate: true });
        return;
      }
      try {
        const payload: OrderActionRequest = { action: 'accept' };
        await applyHubOrderAction(orderId, payload);
        setNotice('Success'); setTimeout(() => setNotice(null), 1200); mutate(`/hub/orders/${managerCode}`, undefined, { revalidate: true });
        console.log('[manager] accepted order', { orderId });
      } catch (err) {
        console.error('[manager] failed to accept order', err);
        alert(err instanceof Error ? err.message : 'Failed to accept order');
      }
      return;
    }

    if (action === 'Reject') {
      const reason = window.prompt('Please provide a short reason for rejection (required)')?.trim() || '';
      if (!reason) {
        alert('Rejection requires a short reason.');
        return;
      }
      try {
        const payload: OrderActionRequest = { action: 'reject', notes: reason };
        const target = ordersData?.orders?.find((o: any) => (o.orderId || o.id) === orderId) as any;
        const nextRole = (target?.nextActorRole || '').toLowerCase();
        if (nextRole && nextRole !== 'manager') {
          setNotice(`This order is now pending ${nextRole}. Refreshing...`);
          setTimeout(() => setNotice(null), 2000);
          mutate(`/hub/orders/${managerCode}`, undefined, { revalidate: true });
          return;
        }
        await applyHubOrderAction(orderId, payload);
        setNotice('Success'); setTimeout(() => setNotice(null), 1200); mutate(`/hub/orders/${managerCode}`, undefined, { revalidate: true });
        console.log('[manager] rejected order', { orderId });
      } catch (err) {
        console.error('[manager] failed to reject order', err);
        alert(err instanceof Error ? err.message : 'Failed to reject order');
      }
      return;
    }

    // Note: Add Crew, Create Service, Add Training, Add Procedure are now managed from Active Services section
    // These actions are no longer available on orders after policy update

    try {
      // Apply other order actions
      const payload: OrderActionRequest = {
        action: action as any,
      };
      await applyHubOrderAction(orderId, payload);

      // Refresh the orders list
      mutate(`/hub/orders/${managerCode}`, undefined, { revalidate: true });

      console.log('[manager] order action applied', { orderId, action });
    } catch (error) {
      console.error('[manager] failed to apply order action', error);
    }
  }, [managerCode, mutate, ordersData]);

  const handleNodeClick = useCallback((userId: string) => {
    console.log('[manager] view ecosystem node', userId);
  }, []);

  // Note: Crew request and service creation handlers removed
  // Services are now auto-created on manager accept
  // Crew, procedures, training are managed from Active Services section

  // Don't render anything until we have critical data
  if (!profileData || !dashboardData) {
    console.log('[ManagerHub] Waiting for critical data...');
    return null;
  }

  return (
    <ModalProvider>
      <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
        <MyHubSection
          hubName="Manager Hub"
          tabs={HUB_TABS}
          activeTab={activeTab}
          onTabClick={setActiveTab}
        onLogout={logout}
        userId={managerCode ?? undefined}
        role="manager"
      />

      <Scrollbar style={{ flex: 1, padding: '0 24px' }} className="hub-content-scroll">
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {activeTab === 'dashboard' ? (
            <PageWrapper title="Dashboard" showHeader={false}>
              <PageHeader title="Overview" />
              <OverviewSection cards={OVERVIEW_CARDS} data={overviewData} />

              <PageHeader title="Recent Activity" />
              <ActivityFeed
                activities={formattedActivities}
                hub="manager"
                isLoading={activitiesLoading}
                error={activitiesError}
                onError={(msg) => toast.error(msg)}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <NewsPreview color={MANAGER_PRIMARY_COLOR} onViewAll={() => console.log('[manager] view news')} />
                <MemosPreview color={MANAGER_PRIMARY_COLOR} onViewAll={() => console.log('[manager] view memos')} />
              </div>
            </PageWrapper>
          ) : activeTab === 'profile' ? (
            <PageWrapper title="My Profile" showHeader headerSrOnly>
              <ProfileInfoCard
                role="manager"
                profileData={managerProfileData}
                accountManager={null}
                primaryColor={MANAGER_PRIMARY_COLOR}
                onUpdatePhoto={() => console.log('[manager] update photo')}
              />
            </PageWrapper>
          ) : activeTab === 'ecosystem' ? (
            <PageWrapper title="My Ecosystem" showHeader headerSrOnly>
              <EcosystemTree
                rootUser={{ id: managerRootId, role: 'Manager', name: managerDisplayName }}
                treeData={ecosystemTree}
                onNodeClick={handleNodeClick}
                expandedNodes={[managerRootId]}
                currentUserId={managerRootId}
                title="My Ecosystem"
                subtitle="Your Territory Overview"
                description="Click any row with an arrow to expand and explore your territory ecosystem"
                roleColorMap={{
                  manager: '#e0f2fe',
                  contractor: '#dcfce7',
                  customer: '#fef9c3',
                  center: '#ffedd5',
                  crew: '#fee2e2',
                }}
              />
            </PageWrapper>
          ) : activeTab === 'services' ? (
            <PageWrapper title="My Services" showHeader headerSrOnly>
              <TabSection
                tabs={[
                  { id: 'my', label: 'My Services', count: myServicesData.length },
                  { id: 'active', label: 'Active Services', count: activeServicesData.length },
                  { id: 'history', label: 'Service History', count: serviceHistoryData.length },
                ]}
                activeTab={servicesTab}
                onTabChange={(tabId) => {
                  setServicesTab(tabId as 'my' | 'active' | 'history');
                  setServicesSearchQuery('');
                }}
                description={
                  servicesTab === 'my'
                    ? 'Services you are certified in and qualified to train'
                    : servicesTab === 'active'
                      ? 'Services you currently manage'
                      : 'Services you no longer manage'
                }
                onSearch={setServicesSearchQuery}
                searchPlaceholder={
                  servicesTab === 'history'
                    ? 'Search service history...'
                    : servicesTab === 'active'
                      ? 'Search active services...'
                      : 'Search services...'
                }
                primaryColor={MANAGER_PRIMARY_COLOR}
              >
                {servicesTab === 'my' && (
                  <DataTable
                    columns={MY_SERVICES_COLUMNS}
                    data={myServicesData}
                    showSearch={false}
                    externalSearchQuery={servicesSearchQuery}
                    maxItems={10}
                    modalType="service-my-services"
                  />
                )}

                {servicesTab === 'active' && (
                  <DataTable
                    columns={ACTIVE_SERVICES_COLUMNS}
                    data={activeServicesData}
                    showSearch={false}
                    externalSearchQuery={servicesSearchQuery}
                    maxItems={10}
                    onRowClick={async (row: any) => {
                      try {
                        const { apiFetch } = await import('../shared/api/client');
                        const payload = await apiFetch(`/services/${encodeURIComponent(row.serviceId)}`);
                        if (payload && (payload as any).data) {
                          setServiceDetails((payload as any).data);
                          setShowServiceDetails(true);
                        }
                      } catch (err) {
                        console.error('[manager] failed to load service details', err);
                      }
                    }}
                  />
                )}

                {servicesTab === 'history' && (
                  <DataTable
                    columns={SERVICE_HISTORY_COLUMNS}
                    data={serviceHistoryData}
                    showSearch={false}
                    externalSearchQuery={servicesSearchQuery}
                    maxItems={10}
                    modalType="service-history"
                  />
                )}
              </TabSection>
            </PageWrapper>
          ) : activeTab === 'orders' ? (
            <PageWrapper title="Orders" showHeader headerSrOnly>
              {notice && (
                <div style={{ marginBottom: 12, padding: '8px 12px', background: '#ecfeff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6 }}>{notice}</div>
              )}
              <OrdersSection
                userRole="manager"
                userCode={managerCode}
                serviceOrders={managerServiceOrderCards}
                productOrders={managerProductOrderCards}
                onCreateProductOrder={() => navigate('/catalog?mode=products')}
                onOrderAction={handleOrderAction}
                showServiceOrders
                showProductOrders
                primaryColor={MANAGER_PRIMARY_COLOR}
              />
            </PageWrapper>
          ) : activeTab === 'procedures' ? (
            <PageWrapper title="Procedures" showHeader headerSrOnly>
              <div style={{ padding: 24, textAlign: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, marginBottom: 12 }}>Procedure Library</h2>
                <p style={{ color: '#6b7280', fontSize: 16, marginBottom: 24 }}>
                  Create, manage, and link standard operating procedures to services.
                </p>
                <div style={{
                  maxWidth: 600,
                  margin: '0 auto',
                  padding: 32,
                  backgroundColor: '#fef3c7',
                  borderRadius: 12,
                  border: '2px dashed #f59e0b'
                }}>
                  <h3 style={{ marginTop: 0, fontSize: 18, fontWeight: 600, color: '#92400e' }}>
                    Coming Post-MVP
                  </h3>
                  <p style={{ color: '#92400e', marginBottom: 16, fontSize: 14 }}>
                    Full procedure management system with:
                  </p>
                  <ul style={{ textAlign: 'left', color: '#92400e', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
                    <li>Drag-and-drop procedure builder</li>
                    <li>Task breakdowns with checklists</li>
                    <li>Crew assignments per task</li>
                    <li>Reusable procedure templates</li>
                    <li>Version control and approval workflows</li>
                    <li>File attachments and rich media support</li>
                  </ul>
                </div>
              </div>
            </PageWrapper>
          ) : activeTab === 'training' ? (
            <PageWrapper title="Training" showHeader headerSrOnly>
              <div style={{ padding: 24, textAlign: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, marginBottom: 12 }}>Training Library</h2>
                <p style={{ color: '#6b7280', fontSize: 16, marginBottom: 24 }}>
                  Manage training materials, certifications, and crew completion tracking.
                </p>
                <div style={{
                  maxWidth: 600,
                  margin: '0 auto',
                  padding: 32,
                  backgroundColor: '#fef3c7',
                  borderRadius: 12,
                  border: '2px dashed #f59e0b'
                }}>
                  <h3 style={{ marginTop: 0, fontSize: 18, fontWeight: 600, color: '#92400e' }}>
                    Coming Post-MVP
                  </h3>
                  <p style={{ color: '#92400e', marginBottom: 16, fontSize: 14 }}>
                    Full training management system with:
                  </p>
                  <ul style={{ textAlign: 'left', color: '#92400e', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
                    <li>Video uploads and streaming</li>
                    <li>PDF attachments and documents</li>
                    <li>Certification tracking with expiration dates</li>
                    <li>Crew completion status and progress</li>
                    <li>Quiz and assessment tools</li>
                    <li>Training history and compliance reporting</li>
                  </ul>
                </div>
              </div>
            </PageWrapper>
          ) : activeTab === 'support' ? (
            <PageWrapper title="Support" headerSrOnly>
              <SupportSection role="manager" primaryColor={MANAGER_PRIMARY_COLOR} />
            </PageWrapper>
          ) : activeTab === 'reports' ? (
          <PageWrapper title="Reports" headerSrOnly>
            <ReportsSection
              role="manager"
              userId={managerRootId}
              primaryColor={MANAGER_PRIMARY_COLOR}
              reports={managerReports}
              feedback={managerFeedback}
              isLoading={reportsLoading}
              onSubmit={async (payload) => {
                // Handle structured dropdown-based reports/feedback
                if (payload.reportCategory && payload.relatedEntityId && payload.reportReason) {
                  if (payload.type === 'report') {
                    await apiCreateReport({
                      reportCategory: payload.reportCategory,
                      relatedEntityId: payload.relatedEntityId,
                      reportReason: payload.reportReason,
                      priority: payload.priority,
                    });
                  } else {
                    await apiCreateFeedback({
                      title: 'Feedback',
                      message: payload.reportReason,
                      category: 'Recognition',
                      reportCategory: payload.reportCategory,
                      relatedEntityId: payload.relatedEntityId,
                      reportReason: payload.reportReason,
                      rating: payload.rating,
                    });
                  }
                } else if (payload.type === 'report') {
                  // Legacy text-based reports (fallback)
                  await apiCreateReport({ title: payload.title, description: payload.description, category: payload.category });
                } else {
                  // Legacy text-based feedback (fallback)
                  await apiCreateFeedback({ title: payload.title, message: payload.description, category: payload.category });
                }
                await mutateReports();
              }}
              fetchServices={fetchServicesForReports}
              fetchProcedures={fetchProceduresForReports}
              fetchOrders={fetchOrdersForReports}
              onAcknowledge={async (id, type) => {
                console.log('[ManagerHub] BEFORE acknowledge mutateReports');
                await apiAcknowledgeItem(id, type);
                await mutateReports();
                console.log('[ManagerHub] AFTER acknowledge mutateReports');
              }}
              onResolve={async (id, details) => {
                console.log('[ManagerHub] onResolve called with:', { id, details, managerCode });

                // Optimistic update: immediately update the local cache with all resolved fields
                await (mutateReports as any)(
                  async (currentData) => {
                    console.log('[ManagerHub] mutateReports updater - currentData:', currentData);
                    if (!currentData?.data) {
                      console.log('[ManagerHub] No currentData, returning early');
                      return currentData;
                    }

                    const now = new Date().toISOString();

                    // Update the specific report with all resolved-related fields
                    const updatedReports = currentData.data.reports.map(report =>
                      report.id === id ? {
                        ...report,
                        status: 'resolved' as const,
                        resolvedBy: managerCode,
                        resolvedAt: now,
                        resolution_notes: details?.notes || null
                      } : report
                    );

                    const updatedData = {
                      ...currentData,
                      data: {
                        ...currentData.data,
                        reports: updatedReports
                      }
                    };

                    console.log('[ManagerHub] mutateReports updater - returning updatedData:', updatedData);
                    return updatedData;
                  },
                  { revalidate: false }
                );

                console.log('[ManagerHub] Calling apiResolveReport');
                // Then make the API call in the background
                await apiResolveReport(id, details);

                console.log('[ManagerHub] Calling final mutateReports refetch');
                // Finally revalidate to get the complete updated data from server
                await mutateReports();
                console.log('[ManagerHub] onResolve complete');
              }}
            />
          </PageWrapper>
          ) : (
            <PageWrapper title={activeTab} showHeader headerSrOnly>
              <h2>Manager Hub - {activeTab}</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </PageWrapper>
          )}
        </div>
      </Scrollbar>

      {/* Order Details Modal */}
      {/* Conditional Modal Rendering based on orderType and status */}
      {(() => {
        const orderType = selectedOrderForDetails?.orderType || 'product';
        const status = ((selectedOrderForDetails as any)?.status || '').toLowerCase();
        const isServiceCreated = status === 'service_created' || status === 'service-created';

        const commonOrder = selectedOrderForDetails
          ? {
              orderId: selectedOrderForDetails.orderId,
              title: selectedOrderForDetails.title || null,
              requestedBy: selectedOrderForDetails.requestedBy || selectedOrderForDetails.centerId || selectedOrderForDetails.customerId || null,
              destination: selectedOrderForDetails.destination || selectedOrderForDetails.centerId || null,
              requestedDate: selectedOrderForDetails.requestedDate || null,
              notes: selectedOrderForDetails.notes || null,
              status: (selectedOrderForDetails as any).status || null,
              serviceId: ((selectedOrderForDetails as any)?.metadata?.serviceId) || null,
              managedBy: ((selectedOrderForDetails as any)?.metadata?.serviceManagedBy) || null,
              managedById: ((selectedOrderForDetails as any)?.metadata?.warehouseId) || ((selectedOrderForDetails as any)?.metadata?.managerId) || null,
              managedByName: ((selectedOrderForDetails as any)?.metadata?.warehouseName) || ((selectedOrderForDetails as any)?.metadata?.managerName) || null,
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
          cancellationReason: (selectedOrderForDetails as any)?.metadata?.cancellationReason || null,
          cancelledBy: (selectedOrderForDetails as any)?.metadata?.cancelledBy || null,
          cancelledAt: (selectedOrderForDetails as any)?.metadata?.cancelledAt || null,
        };

        const commonRejection = (selectedOrderForDetails as any)?.rejectionReason || (selectedOrderForDetails as any)?.metadata?.rejectionReason || null;

        const commonRequestorInfo = selectedOrderForDetails
          ? {
              name: (() => { const meta = (selectedOrderForDetails as any)?.metadata as any; const req = meta?.contacts?.requestor || {}; return (req.name || null); })(),
              address: (() => { const meta = (selectedOrderForDetails as any)?.metadata as any; const req = meta?.contacts?.requestor || {}; return (req.address || null); })(),
              phone: (() => { const meta = (selectedOrderForDetails as any)?.metadata as any; const req = meta?.contacts?.requestor || {}; return (req.phone || null); })(),
              email: (() => { const meta = (selectedOrderForDetails as any)?.metadata as any; const req = meta?.contacts?.requestor || {}; return (req.email || null); })(),
            }
          : null;

        const commonDestinationInfo = selectedOrderForDetails
          ? {
              name: (() => { const meta = (selectedOrderForDetails as any)?.metadata as any; const dest = meta?.contacts?.destination || {}; return (dest.name || null); })(),
              address: (() => { const meta = (selectedOrderForDetails as any)?.metadata as any; const dest = meta?.contacts?.destination || {}; return (dest.address || null); })(),
              phone: (() => { const meta = (selectedOrderForDetails as any)?.metadata as any; const dest = meta?.contacts?.destination || {}; return (dest.phone || null); })(),
              email: (() => { const meta = (selectedOrderForDetails as any)?.metadata as any; const dest = meta?.contacts?.destination || {}; return (dest.email || null); })(),
            }
          : null;

        // Choose the appropriate modal
        if (orderType === 'service') {
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
          return (
            <OrderDetailsModal
              isOpen={!!selectedOrderForDetails}
              onClose={() => setSelectedOrderForDetails(null)}
              order={commonOrder ? { ...commonOrder, orderType, items: selectedOrderForDetails?.items || [] } : null}
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

      {/* Service Details Modal - for Active Services section */}
      <ServiceDetailsModal
        isOpen={showServiceDetails}
        onClose={() => { setShowServiceDetails(false); setServiceDetails(null); }}
        service={serviceDetails ? { serviceId: serviceDetails.serviceId, title: serviceDetails.title, centerId: serviceDetails.centerId, metadata: serviceDetails.metadata } : null}
        editable
        availableCrew={crewEntries.map((c: any) => ({ code: c.id, name: c.name || c.id }))}
        serviceStatus={serviceDetails?.metadata?.serviceStatus || 'created'}
        serviceType={serviceDetails?.metadata?.serviceType || 'one-time'}
        productOrders={(() => {
          if (!serviceDetails?.serviceId) return [];
          // Filter product orders linked to this service
          return managerProductOrders
            .filter((order) => {
              const meta = (order as any).metadata || {};
              return meta.serviceId === serviceDetails.serviceId;
            })
            .map((order) => {
              const items = (order as any).items || [];
              const productName = items.length > 0 ? items.map((i: any) => i.name).join(', ') : 'Product Order';
              const totalQty = items.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
              return {
                orderId: order.orderId,
                productName,
                quantity: totalQty,
                status: order.status || 'pending',
                requestedDate: order.requestedDate || order.orderDate || null,
              };
            });
        })()}
        onSendCrewRequest={async (crewCodes: string[]) => {
          try {
            if (!serviceDetails?.serviceId) return;
            const { apiFetch } = await import('../shared/api/client');
            await apiFetch(`/services/${encodeURIComponent(serviceDetails.serviceId)}/crew-requests`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ crewCodes }),
            });
            mutate(`/hub/orders/${managerCode}`, undefined, { revalidate: true });
          } catch (err) {
            console.error('[manager] failed to send crew request', err);
            alert('Failed to send crew requests. Please try again.');
            throw err;
          }
        }}
        onSave={async (updates) => {
          try {
            if (!serviceDetails?.serviceId) return;
            const { apiFetch } = await import('../shared/api/client');
            await apiFetch(`/services/${encodeURIComponent(serviceDetails.serviceId)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            });
            setShowServiceDetails(false);
            setServiceDetails(null);
            mutate(`/hub/orders/${managerCode}`, undefined, { revalidate: true });
          } catch (err) {
            console.error('[manager] failed to update service', err);
          }
        }}
        onStartService={async () => {
          try {
            if (!serviceDetails?.serviceId) return;
            const { applyServiceAction } = await import('../shared/api/hub');
            await applyServiceAction(serviceDetails.serviceId, 'start');
            mutate(`/hub/orders/${managerCode}`, undefined, { revalidate: true });
            setToast('Service started');
            setTimeout(() => setToast(null), 1800);
          } catch (err) {
            console.error('[manager] failed to start service', err);
            alert(err instanceof Error ? err.message : 'Failed to start service');
          }
        }}
        onCompleteService={async () => {
          try {
            if (!serviceDetails?.serviceId) return;
            const { applyServiceAction } = await import('../shared/api/hub');
            await applyServiceAction(serviceDetails.serviceId, 'complete');
            mutate(`/hub/orders/${managerCode}`, undefined, { revalidate: true });
            setToast('Service completed');
            setTimeout(() => setToast(null), 1800);
          } catch (err) {
            console.error('[manager] failed to complete service', err);
            alert(err instanceof Error ? err.message : 'Failed to complete service');
          }
        }}
        onCancelService={async () => {
          try {
            if (!serviceDetails?.serviceId) return;
            const reason = window.prompt('Please provide a reason for cancellation:');
            if (!reason) return;
            const { applyServiceAction } = await import('../shared/api/hub');
            await applyServiceAction(serviceDetails.serviceId, 'cancel');
            mutate(`/hub/orders/${managerCode}`, undefined, { revalidate: true });
          } catch (err) {
            console.error('[manager] failed to cancel service', err);
            alert(err instanceof Error ? err.message : 'Failed to cancel service');
          }
        }}
      />

      {toast && (
        <div style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          background: '#10b981',
          color: '#fff',
          padding: '10px 14px',
          borderRadius: 8,
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          zIndex: 9999,
          fontSize: 14,
          fontWeight: 600,
        }}>
          {toast}
        </div>
      )}
      </div>
    </ModalProvider>
  );
}





