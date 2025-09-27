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
import { Button, DataTable, PageHeader, PageWrapper, Scrollbar, TabSection } from '@cks/ui';
import MyHubSection from '../components/MyHubSection';
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
  type HubReportItem,
  type HubOrderItem,
} from '../shared/api/hub';

interface ManagerHubProps {
  initialTab?: string;
}

type OrderStatus = 'pending' | 'in-progress' | 'approved' | 'rejected' | 'cancelled' | 'delivered' | 'service-created';

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


type EcosystemNode = {
  user: {
    id: string;
    role: string;
    name: string;
  };
  count?: number;
  type?: string;
  children?: EcosystemNode[];
};

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
    case 'service-created':
      return normalized;
    case 'in-progress':
    case 'inprogress':
    case 'processing':
    case 'scheduled':
      return 'in-progress';
    case 'completed':
      return 'delivered';
    case 'closed':
    case 'archived':
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

function createNodeSorter(a: EcosystemNode, b: EcosystemNode): number {
  return a.user.name.localeCompare(b.user.name);
}

export default function ManagerHub({ initialTab = 'dashboard' }: ManagerHubProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [servicesTab, setServicesTab] = useState<'my' | 'active' | 'history'>('my');
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [activityFeed, setActivityFeed] = useState<Activity[]>([]);

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
      const serviceId = normalizeId(order.serviceId ?? order.transformedId ?? order.orderId ?? order.id ?? null);
      if (!serviceId) {
        return;
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
    if (Array.isArray(ordersData.orders) && ordersData.orders.length > 0) {
      return ordersData.orders;
    }
    const serviceOrders = ordersData.serviceOrders ?? [];
    const productOrders = ordersData.productOrders ?? [];
    return [...serviceOrders, ...productOrders];
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

  const managerContractorIdSet = useMemo(() => {
    const set = new Set<string>();
    managerContractors.forEach((contractor) => {
      const id = normalizeId(contractor.id);
      if (id) {
        set.add(id);
      }
    });
    return set;
  }, [managerContractors]);

  const managerCustomerIdSet = useMemo(() => {
    const set = new Set<string>();
    managerCustomers.forEach((customer) => {
      const id = normalizeId(customer.id);
      if (id) {
        set.add(id);
      }
    });
    return set;
  }, [managerCustomers]);

  // Hub scope data is already filtered for this manager
  const managerCenters = centerEntries;

  const managerCenterIdSet = useMemo(() => {
    const set = new Set<string>();
    managerCenters.forEach((center) => {
      const id = normalizeId(center.id);
      if (id) {
        set.add(id);
      }
    });
    return set;
  }, [managerCenters]);

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
  const managerServices = serviceEntries;

  const myServicesData = useMemo(
    () =>
      managerServices.map((service) => {
        const status = service.status?.toLowerCase() ?? 'unknown';
        const certified = status === 'active' || status === 'approved' ? 'Yes' : status === 'unknown' ? 'Unknown' : 'No';
        return {
          serviceId: service.id ?? 'SRV-???',
          serviceName: service.name ?? 'Service',
          certified,
          certificationDate: formatDate(service.createdAt),
          expires: formatDate(service.updatedAt),
        };
      }),
    [managerServices],
  );

  const activeServicesData = useMemo(
    () =>
      managerServiceOrders
        .filter((order) => {
          const status = normalizeOrderStatus(order.status);
          return status === 'pending' || status === 'in-progress' || status === 'approved';
        })
        .map((order) => {
          const rawServiceId = order.serviceId ?? order.transformedId ?? order.orderId ?? order.id ?? 'Service';
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
          };
        }),
    [managerServiceOrders, serviceById],
  );
  const serviceHistoryData = useMemo(
    () =>
      managerServiceOrders
        .filter((order) => {
          const status = normalizeOrderStatus(order.status);
          return status === 'delivered' || status === 'service-created' || status === 'cancelled' || status === 'rejected';
        })
        .map((order) => {
          const rawServiceId = order.serviceId ?? order.transformedId ?? order.orderId ?? order.id ?? 'Service';
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
        const serviceId = normalizeId(order.serviceId ?? order.transformedId ?? canonicalOrderId);
        const service = serviceId ? serviceById.get(serviceId) : null;
        const customerId = normalizeId(order.customerId ?? order.requestedBy);
        const centerId = normalizeId(order.centerId ?? order.destination);
        const status = normalizeOrderStatus(order.status);
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
          approvalStages: [],
          transformedId: order.transformedId ?? order.serviceId ?? null,
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
        const status = normalizeOrderStatus(order.status);
        const requestedByLabel = customerId
          ? customerNameMap.get(customerId) ?? order.customerId ?? order.requestedBy ?? 'Customer'
          : order.customerId ?? order.requestedBy ?? 'Customer';
        const destinationLabel = centerId ? centerNameMap.get(centerId) ?? centerId : undefined;
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
          approvalStages: [],
        };
      }),
    [centerNameMap, customerNameMap, managerProductOrders],
  );
  const centersByCustomerId = useMemo(() => {
    const map = new Map<string, (typeof managerCenters)[number][]>();
    managerCenters.forEach((center) => {
      const customerId = normalizeId(center.customerId);
      if (!customerId) {
        return;
      }
      const existing = map.get(customerId);
      if (existing) {
        existing.push(center);
      } else {
        map.set(customerId, [center]);
      }
    });
    return map;
  }, [managerCenters]);

  const crewByCenterId = useMemo(() => {
    const map = new Map<string, (typeof managerCrew)[number][]>();
    managerCrew.forEach((member) => {
      const centerId = normalizeId(member.assignedCenter);
      if (!centerId) {
        return;
      }
      const existing = map.get(centerId);
      if (existing) {
        existing.push(member);
      } else {
        map.set(centerId, [member]);
      }
    });
    return map;
  }, [managerCrew]);

  const ecosystemTree = useMemo<EcosystemNode>(() => {
    const children: EcosystemNode[] = [];

    const contractorNodes = managerContractors
      .map<EcosystemNode>((contractor) => ({
        user: {
          id: contractor.id ?? 'CONTRACTOR',
          role: 'Contractor',
          name: contractor.name ?? 'Contractor',
        },
      }))
      .sort(createNodeSorter);

    const customerNodes = managerCustomers
      .map<EcosystemNode>((customer) => {
        const customerId = normalizeId(customer.id);
        const centersForCustomer = customerId ? centersByCustomerId.get(customerId) ?? [] : [];
        const centerNodes = centersForCustomer
          .map<EcosystemNode>((center) => {
            const centerId = normalizeId(center.id);
            const crewForCenter = centerId ? crewByCenterId.get(centerId) ?? [] : [];
            const crewNodes = crewForCenter
              .map<EcosystemNode>((member) => ({
                user: {
                  id: member.id ?? 'CREW',
                  role: 'Crew',
                  name: member.name ?? 'Crew Member',
                },
              }))
              .sort(createNodeSorter);

            return {
              user: {
                id: center.id ?? 'CENTER',
                role: 'Center',
                name: center.name ?? 'Service Center',
              },
              children: crewNodes.length > 0 ? crewNodes : undefined,
            };
          })
          .sort(createNodeSorter);

        return {
          user: {
            id: customer.id ?? 'CUSTOMER',
            role: 'Customer',
            name: customer.name ?? customer.mainContact ?? 'Customer',
          },
          children: centerNodes.length > 0 ? centerNodes : undefined,
        };
      })
      .sort(createNodeSorter);

    const orphanCenters = managerCenters.filter((center) => {
      const customerId = normalizeId(center.customerId);
      return !customerId || !managerCustomerIdSet.has(customerId);
    });

    const orphanCenterNodes = orphanCenters
      .map<EcosystemNode>((center) => {
        const centerId = normalizeId(center.id);
        const crewForCenter = centerId ? crewByCenterId.get(centerId) ?? [] : [];
        const crewNodes = crewForCenter
          .map<EcosystemNode>((member) => ({
            user: {
              id: member.id ?? 'CREW',
              role: 'Crew',
              name: member.name ?? 'Crew Member',
            },
          }))
          .sort(createNodeSorter);

        return {
          user: {
            id: center.id ?? 'CENTER',
            role: 'Center',
            name: center.name ?? 'Service Center',
          },
          children: crewNodes.length > 0 ? crewNodes : undefined,
        };
      })
      .sort(createNodeSorter);

    children.push(...contractorNodes, ...customerNodes, ...orphanCenterNodes);

    const root: EcosystemNode = {
      user: {
        id: managerRootId,
        role: 'Manager',
        name: managerDisplayName,
      },
    };

    if (children.length > 0) {
      root.children = children;
    }

    return root;
  }, [
    managerContractors,
    managerCustomers,
    managerCenters,
    managerCustomerIdSet,
    managerDisplayName,
    managerRootId,
    centersByCustomerId,
    crewByCenterId,
  ]);

  const activityEmptyMessage = activitiesError
    ? 'Failed to load activity feed.'
    : activitiesLoading
      ? 'Loading recent activity...'
      : 'No recent manager activity';

  const handleClearActivity = useCallback(() => {
    setActivityFeed([]);
  }, []);

  const handleOrderAction = useCallback((orderId: string, action: string) => {
    console.log('[manager] order action', { orderId, action });
  }, []);

  const handleNodeClick = useCallback((userId: string) => {
    console.log('[manager] view ecosystem node', userId);
  }, []);

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
                    onRowClick={(row: unknown) => console.log('[manager] view active service', row)}
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
              <OrdersSection
                userRole="manager"
                serviceOrders={managerServiceOrderCards}
                productOrders={managerProductOrderCards}
                onCreateProductOrder={() => console.log('[manager] request products')}
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
    </div>
  );
}



