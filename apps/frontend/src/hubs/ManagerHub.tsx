/*-----------------------------------------------
  Property of CKS  Ac 2025
-----------------------------------------------*/

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@cks/auth';
import { EcosystemTree } from '@cks/domain-widgets';
import {
  MemosPreview,
  NewsPreview,
  OrdersSection,
  OverviewSection,
  ProfileInfoCard,
  RecentActivity,
  ReportsSection,
  SupportSection,
  type Activity,
  type ReportFeedback,
} from '@cks/domain-widgets';
import {
  Button,
  DataTable,
  OrderDetailsModal,
  PageHeader,
  PageWrapper,
  Scrollbar,
  TabSection,
  CrewSelectionModal,
  CreateServiceModal,
  type CreateServiceFormData
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
import { useSWRConfig } from 'swr';
import { buildEcosystemTree } from '../shared/utils/ecosystem';

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
  { key: 'startDate', label: 'START DATE' },
  {
    key: 'actions',
    label: 'ACTIONS',
    render: (_: any, row: any) => {
            const started = !!row.metadata?.serviceStartedAt;
      const completed = !!row.metadata?.serviceCompletedAt;
      const verified = !!row.metadata?.serviceVerifiedAt;
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          {!started && !completed && (
            <Button size="sm" onClick={row.onStart}>Start</Button>
          )}
          {started && !completed && (
            <Button size="sm" variant="primary" onClick={row.onComplete}>Complete</Button>
          )}
          {completed && !verified && (
            <Button size="sm" variant="primary" onClick={row.onVerify}>Verify</Button>
          )}
          {completed && verified && (
            <span style={{ fontSize: 12, color: '#16a34a' }}>Verified</span>
          )}
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
  if (normalized === 'in-progress') {
    return 'In Progress';
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
    case 'in-progress':
      return { background: '#fef9c3', color: '#b45309' };
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
  const [activityFeed, setActivityFeed] = useState<Activity[]>([]);

  // Service order modal state
  const [showCrewModal, setShowCrewModal] = useState(false);
  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<HubOrderItem | null>(null);
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

  const managerCode = useMemo(() => normalizeId(code), [code]);

  // Fetch hub-scoped data
  const { data: profileData } = useHubProfile(managerCode);
  const { data: dashboardData } = useHubDashboard(managerCode);
  const { data: scopeData } = useHubRoleScope(managerCode);
  const { data: activitiesData, isLoading: activitiesLoading, error: activitiesError } = useHubActivities(managerCode);
  const { data: ordersData } = useHubOrders(managerCode);
  const { mutate } = useSWRConfig();

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

  // Map hub activities to the Activity format expected by RecentActivity component
  const activityItems = useMemo(() => {
    if (!activitiesData?.activities) return [];
    return activitiesData.activities.map(item => ({
      id: item.id,
      timestamp: item.createdAt ? new Date(item.createdAt) : new Date(),
      actorType: item.actorRole ?? 'Manager',
      actorName: item.actorId ?? 'System',
      action: item.category ?? 'action',
      target: item.targetId ?? '',
      details: item.description ?? '',
      location: item.targetType ?? '',
      status: 'completed' as const
    }));
  }, [activitiesData]);

  useEffect(() => {
    setActivityFeed(activityItems);
  }, [activityItems]);

  const managerRecord = profileData;
  const managerDisplayName = profileData?.name ?? fullName ?? firstName ?? 'Manager';
  const managerRootId = profileData?.cksCode ?? managerCode ?? 'MANAGER';

  // Fetch reports data
  const { data: reportsData, isLoading: reportsLoading } = useHubReports(managerCode);
  const managerReports = useMemo<ReportFeedback[]>(
    () => (reportsData?.reports ?? []).map((item) => mapHubReportItem(item, 'report')),
    [reportsData],
  );

  const managerFeedback = useMemo<ReportFeedback[]>(
    () => (reportsData?.feedback ?? []).map((item) => mapHubReportItem(item, 'feedback')),
    [reportsData],
  );


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
          const status = normalizeOrderStatus(order.status);
          // Include active service statuses: pending approval stages, in-progress work, AND created services that are active
          return status === 'pending' || status === 'in-progress' || status === 'approved' || status === 'delivered' || status === 'service-created' || status === 'completed';
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
              mutate(`/hub/orders/${managerCode}`);
            } catch (err) {
              console.error('[manager] failed to start service', err);
              alert(err instanceof Error ? err.message : 'Failed to start service');
            }
          };
          
          const onVerify = async () => {
            try {
              const { applyServiceAction } = await import('../shared/api/hub');
              await applyServiceAction(rawServiceId, 'verify');
              mutate(`/hub/orders/${managerCode}`);
            } catch (err) {
              console.error('[manager] failed to verify service', err);
              alert(err instanceof Error ? err.message : 'Failed to verify service');
            }
          };
          return {
            serviceId: rawServiceId,
            serviceName: service?.name ?? order.title ?? rawServiceId,
            centerId: centerId ?? 'N/A',
            type: service?.category ?? 'Service',
            status: formatStatusLabel(order.status),
            startDate: formatDate(order.orderDate ?? order.requestedDate),
            metadata: meta,
            onStart,
            onComplete, 
            onVerify, 
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
          const status = normalizeOrderStatus(order.status);
          // Only show cancelled/rejected services in history
          // Active services (delivered/service-created) should remain in Active Services until explicitly completed
          return status === 'cancelled' || status === 'rejected';
        })
        .map((order) => {
          const rawServiceId = (order as any).serviceId ?? (order as any).transformedId ?? 'Service';
          const serviceId = normalizeId(rawServiceId);
          const service = serviceId ? serviceById.get(serviceId) : null;
          const centerId = normalizeId(order.centerId ?? order.destination);
          return {
            serviceId: rawServiceId,
            serviceName: service?.name ?? order.title ?? rawServiceId,
            centerId: centerId ?? 'N/A',
            type: service?.category ?? 'Service',
            status: formatStatusLabel(order.status),
            startDate: formatDate(order.orderDate ?? order.requestedDate),
            endDate: formatDate(order.completionDate ?? order.expectedDate),
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
        const requestedByLabel = customerId
          ? customerNameMap.get(customerId) ?? order.customerId ?? order.requestedBy ?? 'Customer'
          : order.customerId ?? order.requestedBy ?? 'Customer';
        const destinationLabel = centerId ? centerNameMap.get(centerId) ?? centerId : undefined;
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

        // Backend now formats requestedBy and destination as "ID - Name"
        const requestedDate = order.requestedDate ?? order.orderDate ?? null;
        const expectedDate = order.expectedDate ?? order.completionDate ?? null;
        const deliveryDate = status === 'delivered' ? order.deliveryDate ?? expectedDate : undefined;
        return {
          orderId: canonicalOrderId,
          orderType: 'product',
          title: order.title ?? order.notes ?? `Product Order ${canonicalOrderId}`,
          requestedBy: order.requestedBy || 'Unknown',
          destination: order.destination || undefined,
          requestedDate: formatDate(requestedDate),
          expectedDate: formatDate(expectedDate),
          deliveryDate: deliveryDate ? formatDate(deliveryDate) : undefined,
          status,
          actualStatus,
          approvalStages: (order as any).approvalStages || [],
          availableActions: (order as any).availableActions || [],
        };
      }),
    [managerProductOrders],
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

  const handleClearActivity = useCallback(() => {
    setActivityFeed([]);
  }, []);

  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<HubOrderItem | null>(null);

  const handleOrderAction = useCallback(async (orderId: string, action: string) => {
    if (action === 'View Details') {
      const target = ordersData?.orders?.find((o: any) => (o.orderId || o.id) === orderId) || null;
      if (target) {
        setSelectedOrderForDetails(target);
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
        mutate(`/hub/orders/${managerCode}`);
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
        mutate(`/hub/orders/${managerCode}`);
        return;
      }
      try {
        const payload: OrderActionRequest = { action: 'accept' };
        await applyHubOrderAction(orderId, payload);
        setNotice('Success'); setTimeout(() => setNotice(null), 1200); mutate(`/hub/orders/${managerCode}`);
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
          mutate(`/hub/orders/${managerCode}`);
          return;
        }
        await applyHubOrderAction(orderId, payload);
        setNotice('Success'); setTimeout(() => setNotice(null), 1200); mutate(`/hub/orders/${managerCode}`);
        console.log('[manager] rejected order', { orderId });
      } catch (err) {
        console.error('[manager] failed to reject order', err);
        alert(err instanceof Error ? err.message : 'Failed to reject order');
      }
      return;
    }

    if (action === 'Add Crew') {
      setSelectedOrder(order || null);
      setShowCrewModal(true);
      return;
    }

    if (action === 'Create Service') {
      setSelectedOrder(order || null);
      setShowCreateServiceModal(true);
      return;
    }

    // Add Training and Add Procedure are placeholders for now
    if (action === 'Add Training' || action === 'Add Procedure') {
      alert(`${action} functionality coming soon!`);
      return;
    }

    try {
      // Apply other order actions
      const payload: OrderActionRequest = {
        action: action as any,
      };
      await applyHubOrderAction(orderId, payload);

      // Refresh the orders list
      mutate(`/hub/orders/${managerCode}`);

      console.log('[manager] order action applied', { orderId, action });
    } catch (error) {
      console.error('[manager] failed to apply order action', error);
    }
  }, [managerCode, mutate, ordersData]);

  const handleNodeClick = useCallback((userId: string) => {
    console.log('[manager] view ecosystem node', userId);
  }, []);

  // Crew request handler
  const handleCrewRequest = useCallback(async (selectedCrew: string[], message?: string) => {
    if (!selectedOrder) return;

    try {
      const { apiFetch } = await import('../shared/api/client');
      await apiFetch(`/orders/${selectedOrder.orderId}/crew-requests`, {
        method: 'POST',
        body: JSON.stringify({
          crewCodes: selectedCrew,
          message,
        }),
      });

      mutate(`/hub/orders/${managerCode}`);
      setShowCrewModal(false);
      setSelectedOrder(null);
      console.log('[manager] crew requested', { orderId: selectedOrder.orderId, crewCodes: selectedCrew });
    } catch (error) {
      console.error('[manager] failed to request crew', error);
      alert('Failed to request crew assignment. Please try again.');
    }
  }, [selectedOrder, managerCode, mutate]);

  // Create service handler
  const handleCreateService = useCallback(async (data: CreateServiceFormData) => {
    if (!selectedOrder) return;

    try {
      const payload: OrderActionRequest = {
        action: 'create-service',
        metadata: {
          serviceType: data.serviceType,
          startDate: data.startDate,
          startTime: data.startTime,
          endDate: data.endDate,
          endTime: data.endTime,
          notes: data.notes,
        },
      };

      await applyHubOrderAction(selectedOrder.orderId, payload);
      mutate(`/hub/orders/${managerCode}`);
      console.log('[manager] service created', { orderId: selectedOrder.orderId });
    } catch (error) {
      console.error('[manager] failed to create service', error);
      alert('Failed to create service. Please try again.');
    }
  }, [selectedOrder, managerCode, mutate]);

  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <MyHubSection
        hubName="Manager Hub"
        tabs={HUB_TABS}
        activeTab={activeTab}
        onTabClick={setActiveTab}
        onLogout={logout}
      />

      <Scrollbar style={{ flex: 1, padding: '0 24px' }} className="hub-content-scroll">
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {activeTab === 'dashboard' ? (
            <PageWrapper title="Dashboard" showHeader={false}>
              <PageHeader title="Overview" />
              <OverviewSection cards={OVERVIEW_CARDS} data={overviewData} />

              <PageHeader title="Recent Activity" />
              <RecentActivity
                activities={activityFeed}
                onClear={handleClearActivity}
                emptyMessage={activityEmptyMessage}
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
                actionButton={
                  <Button
                    variant="primary"
                    roleColor="#000000"
                    onClick={() => navigate('/catalog')}
                  >
                    Browse CKS Catalog
                  </Button>
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
                    onRowClick={(row: unknown) => console.log('[manager] view service', row)}
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
                        const res = await fetch(`/api/services/${encodeURIComponent(row.serviceId)}`, { credentials: 'include' });
                        const payload = await res.json();
                        if (payload && payload.data) {
                          setServiceDetails(payload.data);
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
                    onRowClick={(row: unknown) => console.log('[manager] view service history', row)}
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
                onCreateProductOrder={() => navigate('/catalog')}
                onOrderAction={handleOrderAction}
                showServiceOrders
                showProductOrders
                primaryColor={MANAGER_PRIMARY_COLOR}
              />
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
      <OrderDetailsModal
        isOpen={!!selectedOrderForDetails}
        onClose={() => setSelectedOrderForDetails(null)}
        order={selectedOrderForDetails ? {
          orderId: selectedOrderForDetails.orderId,
          orderType: selectedOrderForDetails.orderType,
          title: selectedOrderForDetails.title || null,
          requestedBy: selectedOrderForDetails.requestedBy || selectedOrderForDetails.centerId || selectedOrderForDetails.customerId || null,
          destination: selectedOrderForDetails.destination || selectedOrderForDetails.centerId || null,
          requestedDate: selectedOrderForDetails.requestedDate || null,
          status: (selectedOrderForDetails as any).status || null,
          notes: selectedOrderForDetails.notes || null,
          items: selectedOrderForDetails.items || [],
        } : null}
        availability={(() => {
          const meta = (selectedOrderForDetails as any)?.metadata as any;
          const av = meta?.availability;
          if (!av) return null;
          const days = Array.isArray(av.days) ? av.days : [];
          const window = av.window && av.window.start && av.window.end ? av.window : null;
          return { tz: av.tz ?? null, days, window };
        })()}
        cancellationReason={(selectedOrderForDetails as any)?.metadata?.cancellationReason || null}
        cancelledBy={(selectedOrderForDetails as any)?.metadata?.cancelledBy || null}
        cancelledAt={(selectedOrderForDetails as any)?.metadata?.cancelledAt || null}
        rejectionReason={(selectedOrderForDetails as any)?.rejectionReason || (selectedOrderForDetails as any)?.metadata?.rejectionReason || null}
        requestorInfo={
          selectedOrderForDetails
            ? {
                name: (() => { const meta = (selectedOrderForDetails as any)?.metadata as any; const req = meta?.contacts?.requestor || {}; return (req.name || null); })(),
                address: (() => { const meta = (selectedOrderForDetails as any)?.metadata as any; const req = meta?.contacts?.requestor || {}; return (req.address || null); })(),
                phone: (() => { const meta = (selectedOrderForDetails as any)?.metadata as any; const req = meta?.contacts?.requestor || {}; return (req.phone || null); })(),
                email: (() => { const meta = (selectedOrderForDetails as any)?.metadata as any; const req = meta?.contacts?.requestor || {}; return (req.email || null); })(),
              }
            : null
        }
        destinationInfo={
          selectedOrderForDetails
            ? {
                name: (() => { const meta = (selectedOrderForDetails as any)?.metadata as any; const dest = meta?.contacts?.destination || {}; return (dest.name || null); })(),
                address: (() => { const meta = (selectedOrderForDetails as any)?.metadata as any; const dest = meta?.contacts?.destination || {}; return (dest.address || null); })(),
                phone: (() => { const meta = (selectedOrderForDetails as any)?.metadata as any; const dest = meta?.contacts?.destination || {}; return (dest.phone || null); })(),
                email: (() => { const meta = (selectedOrderForDetails as any)?.metadata as any; const dest = meta?.contacts?.destination || {}; return (dest.email || null); })(),
              }
            : null
        }
      />

      {/* Crew Selection Modal */}
      <CrewSelectionModal
        isOpen={showCrewModal}
        onClose={() => {
          setShowCrewModal(false);
          setSelectedOrder(null);
        }}
        onSubmit={handleCrewRequest}
        availableCrew={crewEntries.map((c: any) => ({ code: c.id, name: c.name || c.id }))
        }
      />

      {/* Create Service Modal */}
      <CreateServiceModal
        isOpen={showCreateServiceModal}
        onClose={() => {
          setShowCreateServiceModal(false);
          setSelectedOrder(null);
        }}
        onSubmit={handleCreateService}
        orderId={selectedOrder?.orderId}
      />

      <ServiceDetailsModal
        isOpen={showServiceDetails}
        onClose={() => setShowServiceDetails(false)}
        service={serviceDetails ? { serviceId: serviceDetails.serviceId, title: serviceDetails.title, centerId: serviceDetails.centerId, metadata: serviceDetails.metadata } : null}
        editable
        availableCrew={crewEntries.map((c: any) => ({ code: c.id, name: c.name || c.id }))}
        onSave={async (updates) => {
          try {
            if (!serviceDetails?.serviceId) return;
            await fetch(`/api/services/${encodeURIComponent(serviceDetails.serviceId)}`, {
              method: 'PATCH',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            });
            setShowServiceDetails(false);
            setServiceDetails(null);
            mutate(`/hub/orders/${managerCode}`);
          } catch (err) {
            console.error('[manager] failed to update service', err);
          }
        }}
      />
    </div>
  );
}





