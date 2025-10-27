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
import toast from 'react-hot-toast';
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
import { contractorOverviewCards } from '@cks/domain-widgets';
import { Button, DataTable, OrderDetailsModal, ServiceViewModal, PageHeader, PageWrapper, Scrollbar, TabSection, OrderActionModal } from '@cks/ui';
import { useModals } from '../contexts';
import OrderDetailsGateway from '../components/OrderDetailsGateway';
import { useSWRConfig } from 'swr';
import { createReport as apiCreateReport, createFeedback as apiCreateFeedback, acknowledgeItem as apiAcknowledgeItem, resolveReport as apiResolveReport, fetchServicesForReports, fetchProceduresForReports, fetchOrdersForReports } from '../shared/api/hub';
import { useAuth } from '@cks/auth';
import { useFormattedActivities } from '../shared/activity/useFormattedActivities';
import { ActivityFeed } from '../components/ActivityFeed';
import ActivityModalGateway from '../components/ActivityModalGateway';
import { useEntityActions } from '../hooks/useEntityActions';

import MyHubSection from '../components/MyHubSection';
import {
  useHubDashboard,
  useHubOrders,
  useHubProfile,
  useHubReports,
  useHubRoleScope,
  type HubOrderItem,
} from '../shared/api/hub';
import { buildEcosystemTree } from '../shared/utils/ecosystem';
import { useCatalogItems } from '../shared/api/catalog';
import { useCertifiedServices } from '../hooks/useCertifiedServices';
import { useHubLoading } from '../contexts/HubLoadingContext';
import { dismissActivity, dismissAllActivities } from '../shared/api/directory';
import { buildContractorOverviewData } from '../shared/overview/builders';

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

// Main wrapper component that sets up ModalProvider
export default function ContractorHub({ initialTab = 'dashboard' }: ContractorHubProps) {
  const { code: authCode } = useAuth();
  const normalizedCode = useMemo(() => normalizeIdentity(authCode), [authCode]);

  return <ContractorHubContent initialTab={initialTab} />;
}

// Inner component that has access to modal context
function ContractorHubContent({ initialTab = 'dashboard' }: ContractorHubProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [servicesTab, setServicesTab] = useState<'my' | 'active' | 'history'>('my');
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [actionOrder, setActionOrder] = useState<any | null>(null);
  const { code: authCode } = useAuth();
  const normalizedCode = useMemo(() => normalizeIdentity(authCode), [authCode]);
  const { setHubLoading } = useHubLoading();

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
  const { handleAction } = useEntityActions();
  const [notice, setNotice] = useState<string | null>(null);
  const {
    data: reportsData,
    isLoading: reportsLoading,
  mutate: mutateReports } = useHubReports(normalizedCode);

  // Access modal context
  const modals = useModals();

  const { data: scopeData } = useHubRoleScope(normalizedCode);
  const { activities: formattedActivities, isLoading: activitiesLoading, error: activitiesError, mutate: mutateActivities } = useFormattedActivities(normalizedCode, { limit: 20 });

  // Handle activity dismissal
  const handleClearActivity = useCallback(async (activityId: string) => {
    try {
      await dismissActivity(activityId);
      mutateActivities();
      console.log('[ContractorHub] Activity dismissed:', activityId);
    } catch (error) {
      console.error('[ContractorHub] Failed to dismiss activity:', error);
    }
  }, [mutateActivities]);

  // Clear ALL activities for current user
  const handleClearAll = useCallback(async () => {
    try {
      const result = await dismissAllActivities();
      mutateActivities();
      console.log(`[ContractorHub] ${result.count} activities dismissed`);
    } catch (error) {
      console.error('[ContractorHub] Failed to clear all activities:', error);
    }
  }, [mutateActivities]);

  const contractorCode = useMemo(() => profile?.cksCode ?? normalizedCode, [profile?.cksCode, normalizedCode]);
  const welcomeName = profile?.mainContact ?? profile?.name ?? undefined;

  // Signal when critical data is loaded (but only if not highlighting an order)
  useEffect(() => {
    const hasCriticalData = !!profile && !!dashboard;
    if (hasCriticalData) {
      console.log('[ContractorHub] Critical data loaded, signaling ready (no highlight)');
      setHubLoading(false);
    }
  }, [profile, dashboard, setHubLoading]);

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
    () => orderEntries
      .filter((order) => order.orderType === 'service')
      .map((order) => ({
        ...order,
        title: order.title ?? order.serviceId ?? order.orderId ?? order.id ?? 'Service Order',
        status: normalizeOrderStatus(order.viewerStatus ?? order.status),
      })),
    [orderEntries],
  );

  const productOrders = useMemo<HubOrderItem[]>(
    () => orderEntries
      .filter((order) => order.orderType === 'product')
      .map((order) => ({
        ...order,
        title: order.title ?? order.orderId ?? order.id ?? 'Product Order',
        status: normalizeOrderStatus(order.viewerStatus ?? order.status),
      })),
    [orderEntries],
  );

  // Find selected order from hub data for transform-first approach
  
  // Use centralized order details hook (transform-first)
  
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

  const activityEmptyMessage = activitiesError
    ? 'Failed to load contractor activity.'
    : activitiesLoading
      ? 'Loading recent activity...'
      : 'No recent contractor activity';

  const ecosystemData = useMemo<TreeNode>(() => {
    if (scopeData) {
      return buildEcosystemTree(scopeData, { rootName: profile?.name ?? contractorCode ?? 'Contractor' });
    }
    return {
      user: { id: contractorCode ?? 'CONTRACTOR', role: 'Contractor', name: profile?.name ?? contractorCode ?? 'Contractor' },
    } as TreeNode;
  }, [scopeData, profile, contractorCode]);

  const { activeServicesData, serviceHistoryData } = useMemo(() => {
    const active: Array<{ serviceId: string; serviceName: string; centerId: string; type: string; status: string; managedBy: string; startDate: string }> = [];
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
      const metadata = (order as any).metadata || {};
      const serviceType = metadata.serviceType === 'recurring' ? 'Ongoing' : 'One-Time';
      const svcStatus = normalizeStatusValue((metadata as any).serviceStatus);
      const serviceStatus = svcStatus ? formatStatusLabel(svcStatus) : (normalizedStatus === 'service-created' || normalizedStatus === 'service_created' ? 'Active' : formatStatusLabel(order.status));
      const managedBy = metadata.managerId ? `${metadata.managerId}${metadata.managerName ? ' - ' + metadata.managerName : ''}` : '—';
      const actualStartDate = metadata.actualStartDate || metadata.serviceStartDate;

      const base = {
        serviceId: (order as any).serviceId ?? (order as any).transformedId ?? 'SERVICE',
        serviceName: service?.name ?? order.title ?? ((order as any).serviceId ?? (order as any).transformedId) ?? 'Service',
        centerId: centerId ? centerNameMap.get(centerId) ?? centerId : EMPTY_VALUE,
        type: serviceType,
        status: serviceStatus,
        managedBy: managedBy,
        startDate: svcStatus === 'created' ? 'Pending' : (actualStartDate ? formatDisplayDate(actualStartDate) : '—'),
        endDate: formatDisplayDate(order.expectedDate ?? order.completionDate),
      };

      // Completed/cancelled services go to history for contractors
      if (svcStatus === 'completed' || svcStatus === 'cancelled' || normalizedStatus === 'cancelled' || normalizedStatus === 'rejected') {
        history.push(base);
      } else {
        // Include active service statuses: pending approval stages, in-progress work, AND created services that are active
        active.push({
          serviceId: base.serviceId,
          serviceName: base.serviceName,
          centerId: base.centerId,
          type: base.type,
          status: base.status,
          managedBy: base.managedBy,
          startDate: base.startDate,
        });
      }
    });

    return { activeServicesData: active, serviceHistoryData: history };
  }, [serviceOrders, serviceById, centerNameMap]);

  // Certified services for My Services tab (filtered by certifications)
  const { data: certifiedServicesData, isLoading: certifiedServicesLoading } = useCertifiedServices(contractorCode, 'contractor', 500);

  // Column definitions for My Services
  const MY_SERVICES_COLUMNS_BASE = [
    { key: 'serviceId', label: 'SERVICE ID', clickable: true },
    { key: 'serviceName', label: 'SERVICE NAME' },
    { key: 'category', label: 'CATEGORY' },
    { key: 'certifiedAt', label: 'CERTIFIED DATE' },
    { key: 'renewalDate', label: 'RENEWAL DATE' },
  ];

  const myCatalogServices = useMemo(() => {
    return certifiedServicesData.map((service) => ({
      serviceId: service.serviceId,
      serviceName: service.name,
      category: service.category ?? '-',
      certifiedAt: service.certifiedAt ? new Date(service.certifiedAt).toLocaleDateString() : '-',
      renewalDate: service.renewalDate ? new Date(service.renewalDate).toLocaleDateString() : '-',
    }));
  }, [certifiedServicesData]);

  const myServicesColumns = MY_SERVICES_COLUMNS_BASE;

  const tabs = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', path: '/contractor/dashboard' },
    { id: 'profile', label: 'My Profile', path: '/contractor/profile' },
    { id: 'ecosystem', label: 'My Ecosystem', path: '/contractor/ecosystem' },
    { id: 'services', label: 'Services', path: '/contractor/services' },
    { id: 'orders', label: 'Orders', path: '/contractor/orders' },
    { id: 'reports', label: 'Reports', path: '/contractor/reports' },
    { id: 'support', label: 'Support', path: '/contractor/support' },
  ], []);

  const overviewData = useMemo(() =>
    buildContractorOverviewData({
      dashboard: dashboard ?? null,
      profile: profile ?? null,
      scope: contractorScope ?? null,
      certifiedServices: certifiedServicesData,
      orders: orders?.orders ?? [],
    }),
  [dashboard, profile, contractorScope, certifiedServicesData, orders]);

  const profileCardData = useMemo(() => ({
    name: profile?.name ?? EMPTY_VALUE,
    contractorId: contractorCode ?? EMPTY_VALUE,
    address: profile?.address ?? EMPTY_VALUE,
    phone: profile?.phone ?? EMPTY_VALUE,
    email: profile?.email ?? EMPTY_VALUE,
    // Website: pass null when missing so ProfileTab hides the row
    website: getMetadataString(profile?.metadata ?? null, 'website') ?? null,
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

  // Don't render anything until we have critical data
  if (!profile || !dashboard) {
    console.log('[ContractorHub] Waiting for critical data...');
    return null;
  }

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
                cards={contractorOverviewCards}
                data={overviewData}
                loading={dashboardLoading}
              />

              <PageHeader title="Recent Activity" />
              <ActivityFeed
                activities={formattedActivities}
                hub="contractor"
                viewerId={normalizedCode || undefined}
                onClearActivity={handleClearActivity}
                onClearAll={handleClearAll}
                onOpenActionableOrder={(order) => setActionOrder(order)}
                onOpenOrderModal={(order) => setSelectedOrderId(order?.orderId || order?.id || null)}
                onOpenServiceModal={(serviceId) => modals.openById(serviceId)}
                isLoading={activitiesLoading}
                error={activitiesError}
                onError={(msg) => toast.error(msg)}
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
                  { id: 'my', label: 'My Services', count: myCatalogServices.length },
                  { id: 'active', label: 'Active Services', count: activeServicesData.length },
                  { id: 'history', label: 'Service History', count: serviceHistoryData.length },
                ]}
                activeTab={servicesTab}
                onTabChange={(tab) => setServicesTab(tab as 'my' | 'active' | 'history')}
                description={
                  servicesTab === 'my'
                    ? 'Services you offer through CKS'
                    : servicesTab === 'active'
                      ? 'Current active services managed by CKS'
                      : 'Completed services archive'
                }
                searchPlaceholder={
                  servicesTab === 'my'
                    ? 'Search catalog services'
                    : servicesTab === 'active'
                      ? 'Search active services'
                      : 'Search service history'
                }
                onSearch={setServicesSearchQuery}
                primaryColor="#10b981"
              >
                {servicesTab === 'my' && (
                  <DataTable
                    columns={myServicesColumns}
                    data={myCatalogServices.filter((row) => {
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
                    modalType="service-my-services"
                    onRowClick={(row: any) => {
                      modals.openById(row.serviceId);
                    }}
                  />
                )}

                {servicesTab === 'active' && (
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
                      { key: 'managedBy', label: 'MANAGED BY' },
                      { key: 'startDate', label: 'START DATE' },
                      {
                        key: 'actions',
                        label: 'ACTIONS',
                        render: (_: any, row: any) => (
                          <Button
                            size="sm"
                            roleColor="#22c55e"
                            onClick={(e) => {
                              e.stopPropagation();
                              modals.openById(row.serviceId);
                            }}
                          >
                            View Details
                          </Button>
                        ),
                      },
                    ]}
                    data={activeServicesData.filter((row) => {
                      if (!servicesSearchQuery) {
                        return true;
                      }
                      const query = servicesSearchQuery.toLowerCase();
                      return (
                        row.serviceId.toLowerCase().includes(query) ||
                        row.serviceName.toLowerCase().includes(query) ||
                        row.centerId.toLowerCase().includes(query)
                      );
                    })}
                    showSearch={false}
                    maxItems={10}
                  />
                )}

                {servicesTab === 'history' && (
                  <DataTable
                    columns={[
                      { key: 'serviceId', label: 'SERVICE ID', clickable: true },
                      { key: 'serviceName', label: 'SERVICE NAME' },
                      { key: 'centerId', label: 'CENTER' },
                      { key: 'type', label: 'TYPE' },
                      { key: 'status', label: 'STATUS' },
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
                        row.serviceName.toLowerCase().includes(query) ||
                        row.centerId.toLowerCase().includes(query)
                      );
                    })}
                    showSearch={false}
                    maxItems={10}
                    modalType="service-history"
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
                onCreateServiceOrder={() => navigate('/catalog?mode=services')}
                onCreateProductOrder={() => navigate('/catalog?mode=products')}
                onOrderAction={async (orderId, action) => {
                  if (action === 'View Details') {
                    setSelectedOrderId(orderId);
                    return;
                  }
                  await handleAction(orderId, action);
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
                  await mutate(`/hub/reports/${contractorCode}`);
                }}
                fetchServices={fetchServicesForReports}
                fetchProcedures={fetchProceduresForReports}
                fetchOrders={fetchOrdersForReports}
                onAcknowledge={async (id, type) => {
                  console.log('[ContractorHub] BEFORE acknowledge mutate');
                  await apiAcknowledgeItem(id, type);
                  await (mutate as any)(`/hub/reports/${contractorCode}`);
                  console.log('[ContractorHub] AFTER acknowledge mutate');
                }}
                onResolve={async (id, details) => {
                  console.log('[ContractorHub] BEFORE resolve mutate');
                  await apiResolveReport(id, details ?? {});
                  await (mutate as any)(`/hub/reports/${contractorCode}`);
                  console.log('[ContractorHub] AFTER resolve mutate');
                }}
                onReportClick={(reportId) => {
                  modals.openById(reportId);
                }}
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

      {/* Actionable order modal (OrderCard with inline buttons) */}
      {actionOrder && (
        <OrderActionModal
          isOpen={!!actionOrder}
          onClose={() => setActionOrder(null)}
          order={{
            orderId: actionOrder.orderId || actionOrder.id,
            orderType: (actionOrder.orderType || actionOrder.order_type || 'product') as 'service' | 'product',
            title: actionOrder.title || actionOrder.orderId || actionOrder.id,
            requestedBy: actionOrder.requestedBy || null,
            destination: actionOrder.destination || null,
            requestedDate: actionOrder.requestedDate || actionOrder.orderDate || null,
            expectedDate: actionOrder.expectedDate || null,
            serviceStartDate: actionOrder.serviceStartDate || null,
            deliveryDate: actionOrder.deliveryDate || null,
            status: actionOrder.status || 'pending',
            approvalStages: actionOrder.approvalStages || [],
            availableActions: actionOrder.availableActions || [],
            transformedId: actionOrder.transformedId || null,
          }}
          onAction={async (orderId, action) => {
            if (action === 'View Details') {
              setSelectedOrderId(orderId);
              return;
            }
            await handleAction(orderId, action);
          }}
        />
      )}

      <ActivityModalGateway
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        orderId={selectedOrderId}
        role="user"
        userAvailableActions={[]}
      />


      </div>
  );
}







