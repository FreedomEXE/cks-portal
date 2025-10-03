/*-----------------------------------------------
  Property of CKS  © 2025
-----------------------------------------------*/
/**
 * File: ContractorHub.tsx
 *
 * Description:
 * Contractor Hub orchestrator component wired to real backend data.
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EcosystemTree,
  MemosPreview,
  NewsPreview,
  OrdersSection,
  OverviewSection,
  ProfileInfoCard,
  RecentActivity,
  ReportsSection,
  SupportSection,
  type Activity,
  type TreeNode,
} from '@cks/domain-widgets';
import { Button, DataTable, OrderDetailsModal, PageHeader, PageWrapper, Scrollbar, TabSection } from '@cks/ui';
import { useSWRConfig } from 'swr';
import { useAuth } from '@cks/auth';

import MyHubSection from '../components/MyHubSection';
import {
  useHubActivities,
  useHubDashboard,
  useHubOrders,
  useHubProfile,
  useHubReports,
  useHubRoleScope,
  applyHubOrderAction,
  type HubOrderItem,
  type OrderActionRequest,
} from '../shared/api/hub';
import { buildEcosystemTree } from '../shared/utils/ecosystem';

interface ContractorHubProps {
  initialTab?: string;
}

const ACTIVE_STATUSES = new Set(['pending', 'in-progress', 'approved', 'submitted']);
const HISTORY_STATUSES = new Set(['delivered', 'rejected', 'cancelled', 'completed', 'service-created']);

type ContractorServiceEntry = {
  id: string;
  name: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  category: string | null;
};

const EMPTY_VALUE = 'N/A';

function normalizeId(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed.toUpperCase() : null;
}

function formatAccountStatus(status: string | null | undefined): string {
  const normalized = (status ?? '').trim().toLowerCase();
  if (!normalized) {
    return EMPTY_VALUE;
  }
  if (normalized === 'pending') {
    return 'Pending';
  }
  if (normalized === 'unassigned') {
    return 'Unassigned';
  }
  if (normalized === 'assigned' || normalized === 'active') {
    return 'Active';
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function createNodeSorter(a: TreeNode, b: TreeNode): number {
  return a.user.name.localeCompare(b.user.name);
}


function normalizeIdentity(value?: string | null) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed.toUpperCase() : null;
}

function normalizeStatusValue(value?: string | null) {
  if (!value) {
    return 'pending';
  }
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function getMetadataString(metadata: Record<string, unknown> | null | undefined, key: string): string | null {
  if (!metadata) {
    return null;
  }
  const value = metadata[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function formatStatusLabel(value?: string | null) {
  const normalized = normalizeStatusValue(value);
  if (!normalized) {
    return 'Pending';
  }
  return normalized
    .split('-')
    .map((segment) => (segment ? segment[0]?.toUpperCase() + segment.slice(1) : segment))
    .join(' ');
}

function getStatusBadgePalette(status: string | undefined) {
  const normalized = normalizeStatusValue(status);
  if (normalized === 'completed' || normalized === 'delivered') {
    return { background: '#dcfce7', color: '#16a34a' };
  }
  if (normalized === 'cancelled' || normalized === 'rejected') {
    return { background: '#fee2e2', color: '#dc2626' };
  }
  if (normalized === 'in-progress' || normalized === 'approved') {
    return { background: '#ede9fe', color: '#7c3aed' };
  }
  if (normalized === 'scheduled') {
    return { background: '#dbeafe', color: '#2563eb' };
  }
  return { background: '#fef3c7', color: '#d97706' };
}

function formatDisplayDate(value?: string | null) {
  if (!value) {
    return EMPTY_VALUE;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function normalizeOrderStatus(value?: string | null): HubOrderItem['status'] {
  const normalized = normalizeStatusValue(value);
  switch (normalized) {
    case 'pending':
    case 'in-progress':
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
    default:
      return 'pending';
  }
}

function buildActivities(serviceOrders: HubOrderItem[], productOrders: HubOrderItem[]): Activity[] {
  const combined = [...serviceOrders, ...productOrders]
    .map((order) => ({
      order,
      timestamp: order.requestedDate ? new Date(order.requestedDate) : new Date(),
    }))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);

  return combined.map(({ order, timestamp }) => ({
    id: order.orderId,
    message: `${order.orderType === 'service' ? 'Service' : 'Product'} order ${order.orderId} ${formatStatusLabel(order.status)}`,
    timestamp,
    type: getStatusBadgePalette(order.status).color === '#16a34a' ? 'success' : 'info',
    metadata: {
      role: 'contractor',
      orderType: order.orderType,
      status: order.status,
    },
  }));
}

export default function ContractorHub({ initialTab = 'dashboard' }: ContractorHubProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [servicesTab, setServicesTab] = useState<'my' | 'history'>('my');
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [activityFeed, setActivityFeed] = useState<Activity[]>([]);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<HubOrderItem | null>(null);

  const { code: authCode } = useAuth();
  const normalizedCode = useMemo(() => normalizeIdentity(authCode), [authCode]);

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useHubProfile(normalizedCode);
  const {
    data: dashboard,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useHubDashboard(normalizedCode);
  const {
    data: orders,
    isLoading: ordersLoading,
    error: ordersError,
  } = useHubOrders(normalizedCode);
  const { mutate } = useSWRConfig();
  const [notice, setNotice] = useState<string | null>(null);
  const {
    data: reportsData,
    isLoading: reportsLoading,
  } = useHubReports(normalizedCode);
  const { data: scopeData } = useHubRoleScope(normalizedCode);
  const {
    data: activitiesData,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useHubActivities(normalizedCode);

  const contractorCode = useMemo(() => profile?.cksCode ?? normalizedCode, [profile?.cksCode, normalizedCode]);
  const welcomeName = profile?.mainContact ?? profile?.name ?? undefined;

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

  const contractorScope = scopeData?.role === 'contractor' ? scopeData : null;
  const managerReference = contractorScope?.relationships.manager ?? null;
  const scopeCustomers = contractorScope?.relationships.customers ?? [];
  const scopeCenters = contractorScope?.relationships.centers ?? [];
  const scopeCrew = contractorScope?.relationships.crew ?? [];

  const serviceEntries = useMemo<ContractorServiceEntry[]>(() => {
    if (!orders?.serviceOrders) {
      return [];
    }
    const map = new Map<string, ContractorServiceEntry>();
    orders.serviceOrders.forEach((order) => {
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
  }, [orders]);

  const orderEntries = useMemo<HubOrderItem[]>(() => {
    if (!orders) {
      return [];
    }
    if (Array.isArray(orders.orders) && orders.orders.length > 0) {
      return orders.orders;
    }
    const serviceOrders = orders.serviceOrders ?? [];
    const productOrders = orders.productOrders ?? [];
    return [...serviceOrders, ...productOrders];
  }, [orders]);

  const serviceOrders = useMemo<HubOrderItem[]>(
    () =>
      orderEntries
        .filter((order) => order.orderType === 'service')
        .map((order) => ({
          ...order,
          title: order.title ?? order.serviceId ?? order.orderId ?? order.id ?? 'Service Order',
          status: normalizeOrderStatus(order.viewerStatus ?? order.status),
        })),
    [orderEntries],
  );

  const productOrders = useMemo<HubOrderItem[]>(
    () =>
      orderEntries
        .filter((order) => order.orderType === 'product')
        .map((order) => ({
          ...order,
          title: order.title ?? order.orderId ?? order.id ?? 'Product Order',
          status: normalizeOrderStatus(order.viewerStatus ?? order.status),
        })),
    [orderEntries],
  );

  const serviceById = useMemo(() => {
    const map = new Map<string, ContractorServiceEntry>();
    serviceEntries.forEach((service) => {
      const id = normalizeId(service.id);
      if (id) {
        map.set(id, service);
      }
    });
    return map;
  }, [serviceEntries]);

  const customerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    scopeCustomers.forEach((customer) => {
      const id = normalizeId(customer.id);
      if (id) {
        map.set(id, customer.name ?? customer.mainContact ?? id);
      }
    });
    return map;
  }, [scopeCustomers]);

  const centerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    scopeCenters.forEach((center) => {
      const id = normalizeId(center.id);
      if (id) {
        map.set(id, center.name ?? id);
      }
    });
    return map;
  }, [scopeCenters]);

  // Ecosystem grouping is handled by the shared builder; no local maps needed

  const fallbackActivities = useMemo(
    () => buildActivities(serviceOrders, productOrders),
    [serviceOrders, productOrders],
  );

  const apiActivities = useMemo<Activity[]>(() => {
    if (!activitiesData?.activities || activitiesData.activities.length === 0) {
      return [];
    }
    return activitiesData.activities.map((item) => ({
      id: item.id,
      message: item.description ?? `${item.category ?? 'Activity'} update`,
      timestamp: item.createdAt ? new Date(item.createdAt) : new Date(),
      type:
        item.category === 'warning'
          ? 'warning'
          : item.category === 'action'
            ? 'action'
            : 'info',
      metadata: {
        role: item.actorRole ?? 'system',
        userId: item.actorId ?? undefined,
        targetId: item.targetId ?? undefined,
        targetType: item.targetType ?? undefined,
      },
    }));
  }, [activitiesData]);

  const resolvedActivities = useMemo<Activity[]>(() => {
    if (apiActivities.length > 0) {
      return apiActivities;
    }
    if (activitiesLoading) {
      return [];
    }
    return fallbackActivities;
  }, [apiActivities, activitiesLoading, fallbackActivities]);

  useEffect(() => {
    setActivityFeed(resolvedActivities);
  }, [resolvedActivities]);

  const activityEmptyMessage = activitiesError
    ? 'Failed to load contractor activity.'
    : activitiesLoading && apiActivities.length === 0
      ? 'Loading recent activity...'
      : 'No recent contractor activity';

  const handleClearActivity = useCallback(() => {
    setActivityFeed([]);
  }, []);

  const ecosystemData = useMemo<TreeNode>(() => {
    if (scopeData) {
      return buildEcosystemTree(scopeData, { rootName: profile?.name ?? contractorCode ?? 'Contractor' });
    }
    return {
      user: { id: contractorCode ?? 'CONTRACTOR', role: 'Contractor', name: profile?.name ?? contractorCode ?? 'Contractor' },
    } as TreeNode;
  }, [scopeData, profile, contractorCode]);

  const { myServicesData, serviceHistoryData } = useMemo(() => {
    const active: Array<{ serviceId: string; serviceName: string; centerId: string; type: string; status: string; startDate: string }> = [];
    const history: Array<{ serviceId: string; serviceName: string; centerId: string; type: string; status: string; startDate: string; endDate: string }> = [];

    serviceOrders.forEach((order) => {
      // Only include after service is created
      if (!(order as any).serviceId && !(order as any).transformedId) {
        return;
      }
      const serviceKey = normalizeId(order.serviceId ?? order.transformedId ?? order.orderId ?? order.id ?? null);
      const service = serviceKey ? serviceById.get(serviceKey) : null;
      const centerId = normalizeId(order.centerId ?? order.destination);
      const normalizedStatus = normalizeStatusValue(order.status);
      const base = {
        serviceId: (order as any).serviceId ?? (order as any).transformedId ?? 'SERVICE',
        serviceName: service?.name ?? order.title ?? ((order as any).serviceId ?? (order as any).transformedId) ?? 'Service',
        centerId: centerId ? centerNameMap.get(centerId) ?? centerId : EMPTY_VALUE,
        type: service?.category ?? (order.orderType === 'product' ? 'Product' : 'Service'),
        status: formatStatusLabel(order.status),
        startDate: formatDisplayDate(order.requestedDate ?? order.orderDate),
        endDate: formatDisplayDate(order.expectedDate ?? order.completionDate),
      };

      if (HISTORY_STATUSES.has(normalizedStatus)) {
        history.push(base);
      } else {
        active.push({
          serviceId: base.serviceId,
          serviceName: base.serviceName,
          centerId: base.centerId,
          type: base.type,
          status: base.status,
          startDate: base.startDate,
        });
      }
    });

    return { myServicesData: active, serviceHistoryData: history };
  }, [serviceOrders, serviceById, centerNameMap]);

  const tabs = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', path: '/contractor/dashboard' },
    { id: 'profile', label: 'My Profile', path: '/contractor/profile' },
    { id: 'ecosystem', label: 'My Ecosystem', path: '/contractor/ecosystem' },
    { id: 'services', label: 'My Services', path: '/contractor/services' },
    { id: 'orders', label: 'Orders', path: '/contractor/orders' },
    { id: 'reports', label: 'Reports', path: '/contractor/reports' },
    { id: 'support', label: 'Support', path: '/contractor/support' },
  ], []);

  const overviewCards = useMemo(() => [
    { id: 'centers', title: 'Active Centers', dataKey: 'centerCount', color: 'blue' },
    { id: 'crew', title: 'Active Crew', dataKey: 'crewCount', color: 'green' },
    { id: 'services', title: 'Active Services', dataKey: 'activeServices', color: 'purple' },
    { id: 'orders', title: 'Pending Orders', dataKey: 'pendingOrders', color: 'orange' },
    { id: 'status', title: 'Account Status', dataKey: 'accountStatus', color: 'green' },
  ], []);

  const overviewData = useMemo(() => {
    if (dashboard) {
      const pendingOrders =
        (dashboard as any)?.pendingOrders ??
        orderEntries.reduce((count, order) => {
          const status = normalizeStatusValue(order.status);
          return count + (status === 'pending' || status === 'in-progress' ? 1 : 0);
        }, 0);
      return {
        centerCount: (dashboard as any)?.centerCount ?? 0,
        crewCount: (dashboard as any)?.crewCount ?? 0,
        activeServices: (dashboard as any)?.activeServices ?? (dashboard as any)?.serviceCount ?? serviceEntries.length,
        pendingOrders,
        accountStatus: formatAccountStatus(dashboard?.accountStatus ?? profile?.status ?? null),
      };
    }

    const summary = contractorScope?.summary;
    const pendingOrders = orderEntries.reduce((count, order) => {
      const status = normalizeStatusValue(order.status);
      return count + (status === 'pending' || status === 'in-progress' ? 1 : 0);
    }, 0);

    return {
      centerCount: summary?.centerCount ?? scopeCenters.length,
      crewCount: summary?.crewCount ?? scopeCrew.length,
      activeServices: summary?.serviceCount ?? serviceEntries.length,
      pendingOrders,
      accountStatus: formatAccountStatus(summary?.accountStatus ?? profile?.status ?? null),
    };
  }, [dashboard, contractorScope, scopeCenters, scopeCrew, serviceEntries, orderEntries, profile]);

  const profileCardData = useMemo(() => ({
    name: profile?.name ?? EMPTY_VALUE,
    contractorId: contractorCode ?? EMPTY_VALUE,
    address: profile?.address ?? EMPTY_VALUE,
    phone: profile?.phone ?? EMPTY_VALUE,
    email: profile?.email ?? EMPTY_VALUE,
    website: getMetadataString(profile?.metadata ?? null, 'website') ?? EMPTY_VALUE,
    mainContact: profile?.mainContact ?? managerReference?.name ?? EMPTY_VALUE,
    startDate: profile?.createdAt ? formatDisplayDate(profile.createdAt) : null,
  }), [profile, contractorCode, managerReference]);

  const accountManagerCard = useMemo(() => {
    const manager = profile?.manager ?? managerReference;
    if (!manager) {
      return null;
    }
    return {
      name: manager.name ?? EMPTY_VALUE,
      id: manager.id ?? EMPTY_VALUE,
      email: manager.email ?? EMPTY_VALUE,
      phone: manager.phone ?? EMPTY_VALUE,
    };
  }, [profile, managerReference]);

  const profileLoadMessage = profileLoading && !profile ? 'Loading profile details...' : null;
  const ordersLoadMessage = ordersLoading && serviceOrders.length === 0 && productOrders.length === 0
    ? 'Loading latest orders...'
    : null;

  const profileErrorMessage = profileError ? 'Unable to load profile details. Showing cached values if available.' : null;
  const dashboardErrorMessage = dashboardError ? 'Unable to load dashboard metrics. Showing cached values if available.' : null;
  const ordersErrorMessage = ordersError ? 'Unable to load order data. Showing cached values if available.' : null;



  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
      <MyHubSection
        hubName="Contractor Hub"
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={setActiveTab}
        userId={contractorCode ?? 'CONTRACTOR'}
        welcomeName={welcomeName}
        role="contractor"
      />

      <Scrollbar className="hub-content-scroll" style={{ flex: 1, padding: '0 24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {activeTab === 'dashboard' ? (
            <PageWrapper title="Dashboard" showHeader={false}>
              <PageHeader title="Overview" />
              {dashboardErrorMessage && (
                <div style={{ marginBottom: 12, color: '#dc2626' }}>{dashboardErrorMessage}</div>
              )}
              <OverviewSection
                cards={overviewCards}
                data={overviewData}
                loading={dashboardLoading}
              />

              <PageHeader title="Recent Activity" />
              <RecentActivity
                activities={activityFeed}
                onClear={handleClearActivity}
                emptyMessage={activityEmptyMessage}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <NewsPreview color="#10b981" onViewAll={() => navigate('/news')} />
                <MemosPreview color="#10b981" onViewAll={() => navigate('/memos')} />
              </div>
            </PageWrapper>
          ) : activeTab === 'profile' ? (
            <PageWrapper headerSrOnly>
              {profileLoadMessage && (
                <div style={{ marginBottom: 12, color: '#475569' }}>{profileLoadMessage}</div>
              )}
              {profileErrorMessage && (
                <div style={{ marginBottom: 12, color: '#dc2626' }}>{profileErrorMessage}</div>
              )}
              <ProfileInfoCard
                role="contractor"
                profileData={profileCardData}
                accountManager={accountManagerCard}
                primaryColor="#10b981"
                onUpdatePhoto={() => undefined}
                onContactManager={() => undefined}
                onScheduleMeeting={() => undefined}
              />
            </PageWrapper>
          ) : activeTab === 'ecosystem' ? (
            <PageWrapper headerSrOnly>
              <EcosystemTree
                rootUser={{
                  id: contractorCode ?? 'CONTRACTOR',
                  role: 'Contractor',
                  name: profile?.name ?? contractorCode ?? 'Contractor',
                }}
                treeData={ecosystemData}
                onNodeClick={() => undefined}
                expandedNodes={contractorCode ? [contractorCode] : []}
                currentUserId={contractorCode ?? undefined}
                title="Ecosystem"
                subtitle="Your business network overview"
                description="Ecosystem data will populate as relationships become available."
                roleColorMap={{
                  contractor: '#e0f2fe',
                  customer: '#fef9c3',
                  center: '#ffedd5',
                  crew: '#fee2e2',
                }}
              />
            </PageWrapper>
          ) : activeTab === 'services' ? (
            <PageWrapper headerSrOnly>
              {ordersLoadMessage && (
                <div style={{ marginBottom: 12, color: '#475569' }}>{ordersLoadMessage}</div>
              )}
              {ordersErrorMessage && (
                <div style={{ marginBottom: 12, color: '#dc2626' }}>{ordersErrorMessage}</div>
              )}
              <TabSection
                tabs={[
                  { id: 'my', label: 'My Services', count: myServicesData.length },
                  { id: 'history', label: 'Service History', count: serviceHistoryData.length },
                ]}
                activeTab={servicesTab}
                onTabChange={(tab) => setServicesTab(tab as 'my' | 'history')}
                description={
                  servicesTab === 'my'
                    ? 'CKS services currently provided at centers'
                    : 'Services archive'
                }
                searchPlaceholder={
                  servicesTab === 'my'
                    ? 'Search by Service ID or name'
                    : 'Search service history'
                }
                onSearch={setServicesSearchQuery}
                actionButton={
                  <Button
                    variant="primary"
                    roleColor="#000000"
                    onClick={() => navigate('/catalog')}
                  >
                    Browse CKS Catalog
                  </Button>
                }
                primaryColor="#10b981"
              >
                {servicesTab === 'my' && (
                  <DataTable
                    columns={[
                      { key: 'serviceId', label: 'SERVICE ID', clickable: true },
                      { key: 'serviceName', label: 'SERVICE NAME' },
                      { key: 'centerId', label: 'CENTER' },
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
                              {value ?? EMPTY_VALUE}
                            </span>
                          );
                        },
                      },
                      { key: 'startDate', label: 'START DATE' },
                    ]}
                    data={myServicesData.filter((row) => {
                      if (!servicesSearchQuery) {
                        return true;
                      }
                      const query = servicesSearchQuery.toLowerCase();
                      return (
                        row.serviceId.toLowerCase().includes(query) ||
                        row.serviceName.toLowerCase().includes(query)
                      );
                    })}
                    showSearch={false}
                    maxItems={10}
                    onRowClick={() => undefined}
                  />
                )}

                {servicesTab === 'history' && (
                  <DataTable
                    columns={[
                      { key: 'serviceId', label: 'SERVICE ID', clickable: true },
                      { key: 'serviceName', label: 'SERVICE NAME' },
                      { key: 'centerId', label: 'CENTER' },
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
                              {value ?? EMPTY_VALUE}
                            </span>
                          );
                        },
                      },
                      { key: 'startDate', label: 'START DATE' },
                      { key: 'endDate', label: 'END DATE' },
                    ]}
                    data={serviceHistoryData.filter((row) => {
                      if (!servicesSearchQuery) {
                        return true;
                      }
                      const query = servicesSearchQuery.toLowerCase();
                      return (
                        row.serviceId.toLowerCase().includes(query) ||
                        row.serviceName.toLowerCase().includes(query)
                      );
                    })}
                    showSearch={false}
                    maxItems={10}
                    onRowClick={() => undefined}
                  />
                )}
              </TabSection>
            </PageWrapper>
          ) : activeTab === 'orders' ? (
            <PageWrapper headerSrOnly>
              {ordersLoadMessage && (
                <div style={{ marginBottom: 12, color: '#475569' }}>{ordersLoadMessage}</div>
              )}
              {ordersErrorMessage && (
                <div style={{ marginBottom: 12, color: '#dc2626' }}>{ordersErrorMessage}</div>
              )}
              {notice && (
                <div style={{ marginBottom: 12, padding: '8px 12px', background: '#ecfeff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6 }}>{notice}</div>
              )}
              <OrdersSection
                userRole="contractor"
                userCode={contractorCode}
                serviceOrders={serviceOrders}
                productOrders={productOrders}
                onCreateServiceOrder={() => navigate('/catalog')}
                onCreateProductOrder={() => navigate('/catalog')}
                onOrderAction={(orderId, action) => {
                  if (action === 'View Details') {
                    const target = orders?.orders?.find((o: any) => (o.orderId || o.id) === orderId) || null;
                    if (target) {
                      setSelectedOrderForDetails(target);
                    }
                    return;
                  }
                  const target = orders?.orders?.find((o: any) => (o.orderId || o.id) === orderId) as any;
                  const label = (action || '').toLowerCase();
                  let act: OrderActionRequest['action'] | null = null;
                  if (label.includes('cancel')) act = 'cancel';
                  if (label.includes('accept') && !act) act = 'accept';
                  if ((label.includes('reject') || label.includes('deny')) && !act) act = 'reject';
                  if (!act) return;
                  const nextRole = (target?.nextActorRole || '').toLowerCase();
                  if ((act === 'accept' || act === 'reject') && nextRole && nextRole !== 'contractor') {
                    setNotice(`This order is now pending ${nextRole}. Refreshing...`);
                    setTimeout(() => setNotice(null), 2000);
                    mutate(`/hub/orders/${contractorCode}`);
                    return;
                  }
                  let notes: string | null = null;
                  if (act === 'cancel') {
                    notes = window.prompt('Optional: reason for cancellation?')?.trim() || null;
                  } else if (act === 'reject') {
                    const reason = window.prompt('Please provide a short reason for rejection (required)')?.trim() || '';
                    if (!reason) {
                      alert('Rejection requires a short reason.');
                      return;
                    }
                    notes = reason;
                  }
                  let payload: OrderActionRequest = { action: act } as OrderActionRequest;
                  if (typeof notes === 'string' && notes.trim().length > 0) {
                    payload.notes = notes;
                  }
                  applyHubOrderAction(orderId, payload)
                    .then(() => { setNotice('Success'); setTimeout(() => setNotice(null), 1200); mutate(`/hub/orders/${contractorCode}`); })
                    .catch((err) => {
                      console.error('[contractor] failed to apply action', err);
                      const msg = err instanceof Error ? err.message : 'Failed to apply action';
                      setNotice(msg);
                      setTimeout(() => setNotice(null), 2200);
                    });
                }}
                showServiceOrders={true}
                showProductOrders={true}
                primaryColor="#10b981"
              />
            </PageWrapper>
          ) : activeTab === 'reports' ? (
            <PageWrapper headerSrOnly>
              <ReportsSection
                role="contractor"
                userId={contractorCode ?? undefined}
                primaryColor="#10b981"
                reports={reportsData?.reports || []}
                feedback={reportsData?.feedback || []}
                isLoading={reportsLoading}
              />
            </PageWrapper>
          ) : activeTab === 'support' ? (
            <PageWrapper headerSrOnly>
              <SupportSection role="contractor" primaryColor="#10b981" />
            </PageWrapper>
          ) : (
            <PageWrapper title={activeTab} showHeader headerSrOnly>
              <h2>Contractor Hub - {activeTab}</h2>
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
    </div>
  );
}
















