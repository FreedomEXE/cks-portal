/*-----------------------------------------------
  Property of CKS  Ac 2025
-----------------------------------------------*/
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
} from '@cks/domain-widgets';
import { Button, DataTable, PageHeader, PageWrapper, Scrollbar, TabSection } from '@cks/ui';
import MyHubSection from '../components/MyHubSection';
import {
  useActivities,
  useCenters,
  useContractors,
  useCrew,
  useCustomers,
  useManagers,
  useOrders,
  useServices,
} from '../shared/api/directory';
import { useHubReports } from '../shared/api/hub';

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

  const { data: managerEntries } = useManagers();
  const { data: contractorEntries } = useContractors();
  const { data: customerEntries } = useCustomers();
  const { data: centerEntries } = useCenters();
  const { data: crewEntries } = useCrew();
  const { data: serviceEntries } = useServices();
  const { data: orderEntries } = useOrders();
  const { data: activityItems, isLoading: activitiesLoading, error: activitiesError } = useActivities();

  useEffect(() => {
    setActivityFeed(activityItems);
  }, [activityItems]);

  const managerCode = useMemo(() => normalizeId(code), [code]);

  const managerRecord = useMemo(() => {
    if (!managerCode) {
      return null;
    }
    return managerEntries.find((entry) => normalizeId(entry.id) === managerCode) ?? null;
  }, [managerEntries, managerCode]);

  const managerDisplayName = managerRecord?.name ?? fullName ?? firstName ?? 'Manager';
  const managerRootId = managerRecord?.id ?? managerCode ?? 'MANAGER';

  // Fetch reports data
  const { data: reportsData, isLoading: reportsLoading } = useHubReports(managerCode);

  const managerContractors = useMemo(() => {
    if (!managerCode) {
      return [] as typeof contractorEntries;
    }
    return contractorEntries.filter((contractor) => normalizeId(contractor.managerId) === managerCode);
  }, [contractorEntries, managerCode]);

  const managerCustomers = useMemo(() => {
    if (!managerCode) {
      return [] as typeof customerEntries;
    }
    return customerEntries.filter((customer) => normalizeId(customer.managerId) === managerCode);
  }, [customerEntries, managerCode]);

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

  const managerCenters = useMemo(() => {
    if (!managerCode && managerCustomerIdSet.size === 0 && managerContractorIdSet.size === 0) {
      return [] as typeof centerEntries;
    }
    return centerEntries.filter((center) => {
      const centerManager = normalizeId(center.managerId);
      const customerId = normalizeId(center.customerId);
      const contractorId = normalizeId(center.contractorId);
      if (managerCode && centerManager === managerCode) {
        return true;
      }
      if (customerId && managerCustomerIdSet.has(customerId)) {
        return true;
      }
      if (contractorId && managerContractorIdSet.has(contractorId)) {
        return true;
      }
      return false;
    });
  }, [centerEntries, managerCode, managerCustomerIdSet, managerContractorIdSet]);

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

  const managerCrew = useMemo(
    () =>
      crewEntries.filter((member) => {
        const centerId = normalizeId(member.assignedCenter);
        return !!centerId && managerCenterIdSet.has(centerId);
      }),
    [crewEntries, managerCenterIdSet],
  );

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

  const managerOrders = useMemo(
    () =>
      orderEntries.filter((order) => {
        const customerId = normalizeId(order.customerId);
        const centerId = normalizeId(order.centerId);
        return (customerId && managerCustomerIdSet.has(customerId)) || (centerId && managerCenterIdSet.has(centerId));
      }),
    [orderEntries, managerCustomerIdSet, managerCenterIdSet],
  );

  const managerServiceOrders = useMemo(
    () => managerOrders.filter((order) => !!normalizeId(order.serviceId)),
    [managerOrders],
  );

  const managerProductOrders = useMemo(
    () => managerOrders.filter((order) => !normalizeId(order.serviceId)),
    [managerOrders],
  );

  const managerServices = useMemo(() => {
    const unique = new Map<string, (typeof serviceEntries)[number]>();
    managerServiceOrders.forEach((order) => {
      const serviceId = normalizeId(order.serviceId);
      if (!serviceId || unique.has(serviceId)) {
        return;
      }
      const service = serviceById.get(serviceId);
      if (service) {
        unique.set(serviceId, service);
      }
    });
    return Array.from(unique.values());
  }, [managerServiceOrders, serviceById]);

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
          const serviceId = normalizeId(order.serviceId);
          const service = serviceId ? serviceById.get(serviceId) : null;
          const centerId = normalizeId(order.centerId);
          return {
            serviceId: order.serviceId ?? order.id,
            serviceName: service?.name ?? (order.serviceId ?? 'Service'),
            centerId: centerId ?? 'N/A',
            type: service?.category ?? 'Service',
            startDate: formatDate(order.orderDate),
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
          const serviceId = normalizeId(order.serviceId);
          const service = serviceId ? serviceById.get(serviceId) : null;
          const centerId = normalizeId(order.centerId);
          return {
            serviceId: order.serviceId ?? order.id,
            serviceName: service?.name ?? (order.serviceId ?? 'Service'),
            centerId: centerId ?? 'N/A',
            type: service?.category ?? 'Service',
            status: formatStatusLabel(order.status),
            startDate: formatDate(order.orderDate),
            endDate: formatDate(order.completionDate),
          };
        }),
    [managerServiceOrders, serviceById],
  );

  const overviewData = useMemo(() => {
    const pendingOrders = managerServiceOrders.reduce((count, order) => {
      const status = normalizeOrderStatus(order.status);
      return count + (status === 'pending' || status === 'in-progress' ? 1 : 0);
    }, 0);
    return {
      contractorCount: managerContractors.length,
      customerCount: managerCustomers.length,
      centerCount: managerCenters.length,
      crewCount: managerCrew.length,
      pendingOrders,
      accountStatus: formatAccountStatus(managerRecord?.status),
    };
  }, [managerContractors, managerCustomers, managerCenters, managerCrew, managerServiceOrders, managerRecord]);

  const managerProfileData = useMemo(
    () => ({
      fullName: managerDisplayName,
      managerId: managerRecord?.id ?? managerCode ?? 'N/A',
      address: managerRecord?.address ?? null,
      phone: managerRecord?.phone ?? null,
      email: managerRecord?.email ?? null,
      territory: managerRecord?.territory ?? null,
      role: managerRecord?.role ?? 'Manager',
      reportsTo: formatReportsTo(managerRecord?.reportsTo),
      startDate: managerRecord?.createdAt ? formatDate(managerRecord.createdAt) : null,
    }),
    [managerCode, managerDisplayName, managerRecord],
  );

  const managerServiceOrderCards = useMemo<HubOrder[]>(
    () =>
      managerServiceOrders.map((order) => {
        const serviceId = normalizeId(order.serviceId);
        const service = serviceId ? serviceById.get(serviceId) : null;
        const customerId = normalizeId(order.customerId);
        const centerId = normalizeId(order.centerId);
        const status = normalizeOrderStatus(order.status);
        const requestedBy = customerId ? customerNameMap.get(customerId) ?? order.customerId ?? 'Customer' : order.customerId ?? 'Customer';
        const destination = centerId ? centerNameMap.get(centerId) ?? centerId : undefined;
        const deliveryDate = status === 'delivered' ? formatDate(order.completionDate) : undefined;
        return {
          orderId: order.id,
          orderType: 'service',
          title: service?.name ?? (order.serviceId ?? 'Service Order'),
          requestedBy,
          destination,
          requestedDate: formatDate(order.orderDate),
          expectedDate: formatDate(order.completionDate),
          serviceStartDate: status === 'service-created' ? formatDate(order.orderDate) : undefined,
          deliveryDate,
          status,
          approvalStages: [],
        };
      }),
    [customerNameMap, centerNameMap, managerServiceOrders, serviceById],
  );

  const managerProductOrderCards = useMemo<HubOrder[]>(
    () =>
      managerProductOrders.map((order) => {
        const customerId = normalizeId(order.customerId);
        const centerId = normalizeId(order.centerId);
        const status = normalizeOrderStatus(order.status);
        const requestedBy = customerId ? customerNameMap.get(customerId) ?? order.customerId ?? 'Customer' : order.customerId ?? 'Customer';
        const destination = centerId ? centerNameMap.get(centerId) ?? centerId : undefined;
        const deliveryDate = status === 'delivered' ? formatDate(order.completionDate) : undefined;
        return {
          orderId: order.id,
          orderType: 'product',
          title: order.notes ?? `Product Order ${order.id}`,
          requestedBy,
          destination,
          requestedDate: formatDate(order.orderDate),
          expectedDate: formatDate(order.completionDate),
          deliveryDate,
          status,
          approvalStages: [],
        };
      }),
    [customerNameMap, centerNameMap, managerProductOrders],
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
            <PageWrapper headerSrOnly>
              <SupportSection role="manager" primaryColor={MANAGER_PRIMARY_COLOR} />
            </PageWrapper>
          ) : activeTab === 'reports' ? (
            <PageWrapper headerSrOnly>
              <ReportsSection
                role="manager"
                userId={managerRootId}
                primaryColor={MANAGER_PRIMARY_COLOR}
                reports={reportsData?.reports || []}
                feedback={reportsData?.feedback || []}
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


