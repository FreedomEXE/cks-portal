/*-----------------------------------------------
  Property of CKS  © 2025
-----------------------------------------------*/
/**
 * File: CenterHub.tsx
 *
 * Description:
 * Center Hub orchestrator component wired to real backend data.
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
import { centerOverviewCards } from '@cks/domain-widgets';
import { Button, DataTable, ModalProvider, OrderDetailsModal, ServiceViewModal, PageHeader, PageWrapper, Scrollbar, TabSection, OrderActionModal } from '@cks/ui';
import OrderDetailsGateway from '../components/OrderDetailsGateway';
import { useAuth } from '@cks/auth';
import { useSWRConfig } from 'swr';
import { useFormattedActivities } from '../shared/activity/useFormattedActivities';
import { ActivityFeed } from '../components/ActivityFeed';
import ActivityModalGateway from '../components/ActivityModalGateway';

import MyHubSection from '../components/MyHubSection';
import {
  useHubDashboard,
  useHubOrders,
  useHubProfile,
  useHubReports,
  useHubRoleScope,
  applyHubOrderAction,
  type HubOrderItem,
  type OrderActionRequest,
} from '../shared/api/hub';
import { createReport as apiCreateReport, createFeedback as apiCreateFeedback, acknowledgeItem as apiAcknowledgeItem, resolveReport as apiResolveReport, fetchServicesForReports, fetchProceduresForReports, fetchOrdersForReports } from '../shared/api/hub';

import { buildEcosystemTree, DEFAULT_ROLE_COLOR_MAP } from '../shared/utils/ecosystem';
import { useHubLoading } from '../contexts/HubLoadingContext';
import { buildCenterOverviewData } from '../shared/overview/builders';

interface CenterHubProps {
  initialTab?: string;
}

const ACTIVE_STATUSES = new Set(['pending', 'in-progress', 'approved', 'submitted', 'active']);
const HISTORY_STATUSES = new Set(['delivered', 'rejected', 'cancelled', 'completed', 'service-created']);

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
  if (normalized === 'completed' || normalized === 'delivered' || normalized === 'active') {
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
    return '—';
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


export default function CenterHub({ initialTab = 'dashboard' }: CenterHubProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [servicesTab, setServicesTab] = useState<'active' | 'history'>('active');
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [actionOrder, setActionOrder] = useState<any | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [fetchedServiceDetails, setFetchedServiceDetails] = useState<any>(null);
  const { code: authCode } = useAuth();
  const normalizedCode = useMemo(() => normalizeIdentity(authCode), [authCode]);
  const { setHubLoading } = useHubLoading();
  const { mutate } = useSWRConfig();


  // Fetch fresh service details when modal is opened
  useEffect(() => {
    if (!selectedServiceId) {
      setFetchedServiceDetails(null);
      return;
    }

    (async () => {
      try {
        const { apiFetch } = await import('../shared/api/client');
        const res = await apiFetch(`/services/${encodeURIComponent(selectedServiceId)}`);
        if (res && res.data) {
          setFetchedServiceDetails(res.data);
        }
      } catch (err) {
        console.error('[center] failed to load service details', err);
      }
    })();
  }, [selectedServiceId]);

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
  const { data: reportsData, isLoading: reportsLoading, mutate: mutateReports } = useHubReports(normalizedCode);

  const {
    data: scopeData,
  } = useHubRoleScope(normalizedCode);

  // Signal when critical data is loaded
  useEffect(() => {
    const hasCriticalData = !!profile && !!dashboard;
    if (hasCriticalData) {
      console.log('[CenterHub] Critical data loaded, signaling ready');
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

  const serviceOrders = useMemo<HubOrderItem[]>(() => {
    if (!orders?.serviceOrders) {
      return [];
    }
    return orders.serviceOrders.map((order) => ({
      ...order,
      title: order.title ?? order.serviceId ?? order.orderId,
      status: normalizeOrderStatus(order.viewerStatus ?? order.status),
    }));
  }, [orders]);

  const productOrders = useMemo<HubOrderItem[]>(() => {
    if (!orders?.productOrders) {
      return [];
    }
    return orders.productOrders.map((order) => ({
      ...order,
      title: order.title ?? order.orderId,
      status: normalizeOrderStatus(order.viewerStatus ?? order.status),
    }));
  }, [orders]);

  // Find selected order from hub data for transform-first approach
  
  // Use centralized order details hook (transform-first)
  
  const { activities, isLoading: activitiesLoading, error: activitiesError } = useFormattedActivities(normalizedCode, { limit: 20 });

  const overviewData = useMemo(() =>
    buildCenterOverviewData({
      dashboard: dashboard ?? null,
      profile: profile ?? null,
      scope: scopeData ?? null,
    }),
  [dashboard, profile, scopeData]);

  const centerScope = scopeData?.role === 'center' ? scopeData : null;

  const ecosystemTree = useMemo<TreeNode>(() => {
    const fallbackId = normalizedCode ?? 'CENTER';
    const fallbackName = profile?.name ?? fallbackId;
    if (!centerScope) {
      return {
      user: {
        id: fallbackId,
        role: 'Service Center',
        name: fallbackName,
      },
      type: 'center',
    };
    }
    return buildEcosystemTree(centerScope, { rootName: fallbackName });
  }, [centerScope, normalizedCode, profile?.name]);

  const ecosystemRootId = ecosystemTree.user.id;

  const { activeServicesData, serviceHistoryData } = useMemo(() => {
    const active: Array<{ serviceId: string; serviceName: string; crewAssigned: string; type: string; status: string; startDate: string }>
      = [];
    const history: Array<{ serviceId: string; serviceName: string; type: string; status: string; startDate: string; endDate: string }>
      = [];

    serviceOrders.forEach((order) => {
      // Check for service ID or transformed ID (handles both camelCase and snake_case)
      const hasServiceId = (order as any).serviceId || (order as any).transformedId || (order as any).transformed_id;
      if (!hasServiceId) {
        return;
      }
      const normalizedStatus = normalizeStatusValue(order.status);
      const metadata = (order as any).metadata || {};
      const svcStatus = normalizeStatusValue((metadata as any).serviceStatus);
      const serviceType = metadata.serviceType === 'recurring' ? 'Ongoing' : 'One-Time';
      const serviceStatus = svcStatus ? formatStatusLabel(svcStatus) : (normalizedStatus === 'service-created' || normalizedStatus === 'service_created' ? 'Active' : formatStatusLabel(order.status));
      const managedBy = metadata.warehouseId
        ? `${metadata.warehouseId}${metadata.warehouseName ? ' - ' + metadata.warehouseName : ''}`
        : metadata.managerId
          ? `${metadata.managerId}${metadata.managerName ? ' - ' + metadata.managerName : ''}`
          : '—';
      const actualStartDate = metadata.serviceActualStartTime || metadata.actualStartDate || metadata.serviceStartDate;

      const base = {
        serviceId: order.serviceId ?? order.orderId,
        serviceName: order.title ?? order.serviceId ?? order.orderId,
        type: serviceType,
        status: serviceStatus,
        managedBy: managedBy,
        startDate: svcStatus === 'created' ? 'Pending' : (actualStartDate ? formatDisplayDate(actualStartDate) : '—'),
        endDate: formatDisplayDate(order.expectedDate),
      };

      // Completed/cancelled services go to history for centers
      if (svcStatus === 'completed' || svcStatus === 'cancelled' || normalizedStatus === 'cancelled' || normalizedStatus === 'rejected') {
        history.push({
          serviceId: base.serviceId,
          serviceName: base.serviceName,
          type: base.type,
          status: base.status,
          startDate: base.startDate,
          endDate: base.endDate,
        });
      } else {
        // Include active service statuses: pending approval stages, in-progress work, AND created services that are active
        active.push({
          serviceId: base.serviceId,
          serviceName: base.serviceName,
          type: base.type,
          status: base.status,
          managedBy: base.managedBy,
          startDate: base.startDate,
        });
      }
    });

    return { activeServicesData: active, serviceHistoryData: history };
  }, [serviceOrders]);

  const tabs = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', path: '/center/dashboard' },
    { id: 'profile', label: 'My Profile', path: '/center/profile' },
    { id: 'ecosystem', label: 'My Ecosystem', path: '/center/ecosystem' },
    { id: 'services', label: 'Services', path: '/center/services' },
    { id: 'orders', label: 'Orders', path: '/center/orders' },
    { id: 'reports', label: 'Reports', path: '/center/reports' },
    { id: 'support', label: 'Support', path: '/center/support' },
  ], []);

  // Cards provided by shared domain widgets

  const profileCardData = useMemo(() => ({
    name: profile?.name ?? '-',
    centerId: normalizedCode ?? '-',
    address: profile?.address ?? '-',
    phone: profile?.phone ?? '-',
    email: profile?.email ?? '-',
    // Website: pass null when missing so ProfileTab hides the row
    website: getMetadataString(profile?.metadata ?? null, 'website') ?? null,
    customerId: (dashboard as any)?.customerId ?? '-',
    mainContact: profile?.mainContact ?? '-',
    startDate: formatDisplayDate(profile?.createdAt ?? null),
  }), [profile, normalizedCode, dashboard]);

  const accountManagerCard = useMemo(() => {
    if (!profile?.manager) {
      return null;
    }
    return {
      name: profile.manager.name ?? '—',
      id: profile.manager.id ?? '—',
      email: profile.manager.email ?? '—',
      phone: profile.manager.phone ?? '—',
    };
  }, [profile]);

  const profileLoadMessage = profileLoading && !profile ? 'Loading profile details…' : null;
  const ordersLoadMessage = ordersLoading && serviceOrders.length === 0 && productOrders.length === 0
    ? 'Loading latest orders…'
    : null;

  const profileErrorMessage = profileError ? 'Unable to load profile details. Showing cached values if available.' : null;
  const dashboardErrorMessage = dashboardError ? 'Unable to load dashboard metrics. Showing cached values if available.' : null;
  const ordersErrorMessage = ordersError ? 'Unable to load order data. Showing cached values if available.' : null;

  // Don't render anything until we have critical data
  if (!profile || !dashboard) {
    console.log('[CenterHub] Waiting for critical data...');
    return null;
  }

  return (
    <ModalProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
        <MyHubSection
          hubName="Center Hub"
          tabs={tabs}
          activeTab={activeTab}
          onTabClick={setActiveTab}
        userId={normalizedCode ?? 'CENTER'}
        role="center"
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
                cards={centerOverviewCards}
                data={overviewData}
                loading={dashboardLoading}
              />

              <PageHeader title="Recent Activity" />
              <ActivityFeed
                activities={activities}
                hub="center"
                onOpenActionableOrder={(order) => setActionOrder(order)}
                onOpenOrderModal={(order) => setSelectedOrderId(order?.orderId || order?.id || null)}
                onOpenServiceModal={setSelectedServiceId}
                isLoading={activitiesLoading}
                error={activitiesError}
                onError={(msg) => toast.error(msg)}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <NewsPreview color="#f97316" onViewAll={() => navigate('/news')} />
                <MemosPreview color="#f97316" onViewAll={() => navigate('/memos')} />
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
                role="center"
                profileData={profileCardData}
                accountManager={accountManagerCard}
                primaryColor="#f97316"
                onUpdatePhoto={() => undefined}
                onContactManager={() => undefined}
                onScheduleMeeting={() => undefined}
              />
            </PageWrapper>
          ) : activeTab === 'ecosystem' ? (
            <PageWrapper headerSrOnly>
              <EcosystemTree
                rootUser={ecosystemTree.user}
                treeData={ecosystemTree}
                onNodeClick={() => undefined}
                expandedNodes={ecosystemRootId ? [ecosystemRootId] : []}
                currentUserId={ecosystemRootId}
                title="Ecosystem"
                subtitle="Your center network overview"
                description="Click any row with an arrow to expand and explore your center ecosystem."
                roleColorMap={DEFAULT_ROLE_COLOR_MAP}
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
                  { id: 'active', label: 'Active Services', count: activeServicesData.length },
                  { id: 'history', label: 'Service History', count: serviceHistoryData.length },
                ]}
                activeTab={servicesTab}
                onTabChange={(tab) => setServicesTab(tab as 'active' | 'history')}
                description={
                  servicesTab === 'active'
                    ? 'Services currently being performed at this center'
                    : 'Completed services archive'
                }
                searchPlaceholder={
                  servicesTab === 'active'
                    ? 'Search active services'
                    : 'Search service history'
                }
                onSearch={setServicesSearchQuery}
                primaryColor="#f97316"
              >
                {servicesTab === 'active' && (
                  <DataTable
                    columns={[
                      { key: 'serviceId', label: 'SERVICE ID', clickable: true },
                      { key: 'serviceName', label: 'SERVICE NAME' },
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
                      { key: 'managedBy', label: 'MANAGED BY' },
                      { key: 'startDate', label: 'START DATE' },
                      {
                        key: 'actions',
                        label: 'ACTIONS',
                        render: (_: any, row: any) => (
                          <Button
                            size="sm"
                            roleColor="#f97316"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedServiceId(row.serviceId);
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
                        row.serviceName.toLowerCase().includes(query)
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
              <OrdersSection
                userRole="center"
                userCode={normalizedCode ?? undefined}
                serviceOrders={serviceOrders}
                productOrders={productOrders}
                onCreateServiceOrder={() => navigate('/catalog?mode=services')}
                onCreateProductOrder={() => navigate('/catalog?mode=products')}
                onOrderAction={(orderId, action) => {
                  if (action === 'View Details') {
                    setSelectedOrderId(orderId);
                    return;
                  }
                  // Map UI labels to backend actions
                  const label = (action || '').toLowerCase();
                  let act: OrderActionRequest['action'] | null = null;
                  if (label.includes('cancel')) act = 'cancel';
                  if (label.includes('accept') && !act) act = 'accept';
                  if (label.includes('reject') || label.includes('deny')) act = 'reject';
                  if (!act) return;
                  const notes = label === 'cancel' ? (window.prompt('Optional: reason for cancellation?')?.trim() || null) : null;
                  let payload: OrderActionRequest = { action: act } as OrderActionRequest;
                  if (typeof notes === 'string' && notes.trim().length > 0) {
                    payload.notes = notes;
                  }
                  applyHubOrderAction(orderId, payload)
                    .then(() => {
                      console.log('[center] action applied', { orderId, action: act });
                      mutate(`/hub/orders/${normalizedCode}`);
                    })
                    .catch((err) => console.error('[center] failed to apply action', err));
                }}
                showServiceOrders={true}
                showProductOrders={true}
                primaryColor="#f97316"
              />
            </PageWrapper>
          ) : activeTab === 'reports' ? (
            <PageWrapper headerSrOnly>
              <ReportsSection
                role="center"
                userId={normalizedCode ?? undefined}
                primaryColor="#f97316"
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
                        centerId: normalizedCode ?? undefined,
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
                        centerId: normalizedCode ?? undefined,
                      });
                    }
                  } else if (payload.type === 'report') {
                    // Legacy text-based reports (fallback)
                    await apiCreateReport({ title: payload.title, description: payload.description, category: payload.category, centerId: normalizedCode ?? undefined });
                  } else {
                    // Legacy text-based feedback (fallback)
                    await apiCreateFeedback({ title: payload.title, message: payload.description, category: payload.category, centerId: normalizedCode ?? undefined });
                  }
                  // Refresh
                  await mutateReports();
                }}
                fetchServices={fetchServicesForReports}
                fetchProcedures={fetchProceduresForReports}
                fetchOrders={fetchOrdersForReports}
                onAcknowledge={async (id, type) => {
                  console.log('[CenterHub] BEFORE acknowledge mutate');
                  await apiAcknowledgeItem(id, type);
                  const code = normalizedCode ?? '';
                  if (code) {
                    const { mutate } = await import('swr');
                    await (mutate as any)(`/hub/reports/${code}`);
                  }
                  console.log('[CenterHub] AFTER acknowledge mutate');
                }}
                onResolve={async (id, details) => {
                  console.log('[CenterHub] BEFORE resolve mutate');
                  await apiResolveReport(id, details ?? {});
                  const code = normalizedCode ?? '';
                  if (code) {
                    const { mutate } = await import('swr');
                    await (mutate as any)(`/hub/reports/${code}`);
                  }
                  console.log('[CenterHub] AFTER resolve mutate');
                }}
              />
            </PageWrapper>
          ) : activeTab === 'support' ? (
            <PageWrapper headerSrOnly>
              <SupportSection role="center" primaryColor="#f97316" />
            </PageWrapper>
          ) : (
            <PageWrapper title={activeTab} showHeader headerSrOnly>
              <h2>Center Hub - {activeTab}</h2>
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
            try {
              if (action === 'Accept') {
                await applyHubOrderAction(orderId, { action: 'accept' });
                mutate(`/hub/orders/${normalizedCode}`);
                return;
              }
              if (action === 'Decline' || action === 'Reject') {
                const reason = window.prompt('Please provide a short reason')?.trim() || '';
                if (!reason) { alert('A reason is required.'); return; }
                await applyHubOrderAction(orderId, { action: 'reject', notes: reason });
                mutate(`/hub/orders/${normalizedCode}`);
                return;
              }
              if (action === 'Cancel') {
                const confirmed = window.confirm('Are you sure you want to cancel this order?');
                if (!confirmed) return;
                const notes = window.prompt('Optional: provide a short reason')?.trim() || null;
                await applyHubOrderAction(orderId, { action: 'cancel', ...(notes ? { notes } : {}) });
                mutate(`/hub/orders/${normalizedCode}`);
                return;
              }
              setSelectedOrderId(orderId);
            } catch (err) {
              console.error('[center] failed to process action', err);
              alert('Failed to process action. Please try again.');
            }
          }}
        />
      )}

      <ActivityModalGateway
        isOpen={!!selectedOrderId}
        orderId={selectedOrderId}
        role="admin"
        onClose={() => setSelectedOrderId(null)}
        onEdit={() => {}}
        onArchive={async () => {}}
      />

      {/* Service View Modal */}
      {(() => {
        if (!selectedServiceId || !fetchedServiceDetails) return null;

        // Get product orders for this service
        const serviceProductOrders = (orders?.orders || [])
          .filter((order: any) => {
            if (order.orderType !== 'product') return false;
            const orderMeta = order.metadata || {};
            return orderMeta.serviceId === selectedServiceId;
          })
          .map((order: any) => {
            const items = order.items || [];
            const productName = items.length > 0 ? items.map((i: any) => i.name).join(', ') : 'Product Order';
            const totalQty = items.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
            return {
              orderId: order.orderId,
              productName,
              quantity: totalQty,
              status: order.status || 'pending',
            };
          });

        const metadata = fetchedServiceDetails.metadata || {};
        const serviceData = {
          serviceId: fetchedServiceDetails.serviceId,
          serviceName: fetchedServiceDetails.title || fetchedServiceDetails.serviceId,
          serviceType: metadata.serviceType === 'recurring' ? 'recurring' as const : 'one-time' as const,
          serviceStatus: metadata.serviceStatus || fetchedServiceDetails.status || 'Active',
          centerId: fetchedServiceDetails.centerId || null,
          centerName: metadata.centerName || null,
          managerId: metadata.managerId || null,
          managerName: metadata.managerName || null,
          warehouseId: metadata.warehouseId || null,
          warehouseName: metadata.warehouseName || null,
          managedBy: metadata.serviceManagedBy || null,
          startDate: metadata.actualStartDate || metadata.serviceStartDate || null,
          crew: metadata.crew || [],
          procedures: metadata.procedures || [],
          training: metadata.training || [],
          notes: fetchedServiceDetails.notes || metadata.notes || null,
          serviceStartNotes: metadata.serviceStartNotes || null,
          serviceCompleteNotes: metadata.serviceCompleteNotes || null,
          products: serviceProductOrders,
        };

        return (
          <ServiceViewModal
            isOpen={!!selectedServiceId}
            onClose={() => setSelectedServiceId(null)}
            service={serviceData}
            showProductsSection={true}
          />
        );
      })()}
      </div>
    </ModalProvider>
  );
}


