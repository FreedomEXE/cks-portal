/*-----------------------------------------------
  Property of CKS  Ac 2025
-----------------------------------------------*/
/**
 * File: CustomerHub.tsx
 *
 * Description:
 * Customer Hub orchestrator component wired to real backend data.
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
import { Button, DataTable, ModalProvider, OrderDetailsModal, ServiceViewModal, PageHeader, PageWrapper, Scrollbar, TabSection, OrderActionModal } from '@cks/ui';
import OrderDetailsGateway from '../components/OrderDetailsGateway';
import { useAuth } from '@cks/auth';
import { useSWRConfig } from 'swr';
import { createReport as apiCreateReport, createFeedback as apiCreateFeedback, acknowledgeItem as apiAcknowledgeItem, resolveReport as apiResolveReport, fetchServicesForReports, fetchProceduresForReports, fetchOrdersForReports } from '../shared/api/hub';
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

import { buildEcosystemTree, DEFAULT_ROLE_COLOR_MAP } from '../shared/utils/ecosystem';
import { useHubLoading } from '../contexts/HubLoadingContext';

interface CustomerHubProps {
  initialTab?: string;
}

const ACTIVE_STATUSES = new Set(['pending', 'in-progress', 'approved', 'submitted']);
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


export default function CustomerHub({ initialTab = 'dashboard' }: CustomerHubProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [servicesTab, setServicesTab] = useState<'my' | 'history'>('my');
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [actionOrder, setActionOrder] = useState<any | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [fetchedServiceDetails, setFetchedServiceDetails] = useState<any>(null);
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
  const {
    data: reportsData,
    isLoading: reportsLoading,
  mutate: mutateReports } = useHubReports(normalizedCode);
  const {
    data: scopeData,
  } = useHubRoleScope(normalizedCode);
  const { mutate } = useSWRConfig();
  const [notice, setNotice] = useState<string | null>(null);

  // Signal when critical data is loaded (but only if not highlighting an order)
  useEffect(() => {
    const hasCriticalData = !!profile && !!dashboard;
    if (hasCriticalData) {
      console.log('[CustomerHub] Critical data loaded, signaling ready (no highlight)');
      setHubLoading(false);
    }
  }, [profile, dashboard, setHubLoading]);

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
        console.error('[customer] failed to load service details', err);
      }
    })();
  }, [selectedServiceId]);

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

  const overviewData = useMemo(() => ({
    serviceCount: dashboard?.serviceCount ?? 0,
    centerCount: dashboard?.centerCount ?? 0,
    crewCount: dashboard?.crewCount ?? 0,
    pendingRequests: dashboard?.pendingRequests ?? 0,
    accountStatus: dashboard?.accountStatus === 'assigned' ? 'Active' : (dashboard?.accountStatus ?? 'Unknown'),
  }), [dashboard]);

  const customerScope = scopeData?.role === 'customer' ? scopeData : null;

  const ecosystemTree = useMemo<TreeNode>(() => {
    const fallbackId = normalizedCode ?? 'CUSTOMER';
    const fallbackName = profile?.name ?? fallbackId;
    if (!customerScope) {
      return {
      user: {
        id: fallbackId,
        role: 'Customer',
        name: fallbackName,
      },
      type: 'customer',
    };
    }
    return buildEcosystemTree(customerScope, { rootName: fallbackName });
  }, [customerScope, normalizedCode, profile?.name]);

  const ecosystemRootId = ecosystemTree.user.id;

  const { myServicesData, serviceHistoryData } = useMemo(() => {
    const my: Array<{ serviceId: string; serviceName: string; type: string; status: string; startDate: string }>
      = [];
    const history: Array<{ serviceId: string; serviceName: string; centerId: string; type: string; status: string; startDate: string; endDate: string }>
      = [];

    serviceOrders.forEach((order) => {
      // Only include after service is created
      if (!(order as any).serviceId && !(order as any).transformedId) {
        return;
      }
      const normalizedStatus = normalizeStatusValue(order.status);
      const metadata = (order as any).metadata || {};
      const svcStatus = normalizeStatusValue((metadata as any).serviceStatus);
      const serviceType = metadata.serviceType === 'recurring' ? 'Ongoing' : 'One-Time';
      const serviceStatus = svcStatus ? formatStatusLabel(svcStatus) : (normalizedStatus === 'service-created' || normalizedStatus === 'service_created' ? 'Active' : formatStatusLabel(order.status));
      const managedBy = metadata.managerId ? `${metadata.managerId}${metadata.managerName ? ' - ' + metadata.managerName : ''}` : '—';
      const actualStartDate = metadata.actualStartDate || metadata.serviceStartDate;

      const base = {
        serviceId: order.serviceId ?? order.orderId,
        serviceName: order.title ?? order.serviceId ?? order.orderId,
        centerId: order.centerId ?? order.destination ?? '—',
        type: serviceType,
        status: serviceStatus,
        managedBy: managedBy,
        startDate: svcStatus === 'created' ? 'Pending' : (actualStartDate ? formatDisplayDate(actualStartDate) : '—'),
        endDate: formatDisplayDate(order.expectedDate),
      };

      // Completed/cancelled services go to history; otherwise active
      if (svcStatus === 'completed' || svcStatus === 'cancelled' || normalizedStatus === 'cancelled' || normalizedStatus === 'rejected') {
        history.push(base);
      } else {
        // Include active service statuses: pending approval stages, in-progress work, AND created services that are active
        my.push({
          serviceId: base.serviceId,
          serviceName: base.serviceName,
          type: base.type,
          status: base.status,
          managedBy: base.managedBy,
          startDate: base.startDate,
        });
      }
    });

    return { myServicesData: my, serviceHistoryData: history };
  }, [serviceOrders]);

  const tabs = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', path: '/customer/dashboard' },
    { id: 'profile', label: 'My Profile', path: '/customer/profile' },
    { id: 'ecosystem', label: 'My Ecosystem', path: '/customer/ecosystem' },
    { id: 'services', label: 'Active Services', path: '/customer/services' },
    { id: 'orders', label: 'Orders', path: '/customer/orders' },
    { id: 'reports', label: 'Reports', path: '/customer/reports' },
    { id: 'support', label: 'Support', path: '/customer/support' },
  ], []);

  const overviewCards = useMemo(() => [
    { id: 'services', title: 'Active Services', dataKey: 'serviceCount', color: 'teal' },
    { id: 'centers', title: 'Active Centers', dataKey: 'centerCount', color: 'orange' },
    { id: 'crew', title: 'Active Crew', dataKey: 'crewCount', color: 'red' },
    { id: 'requests', title: 'Pending Requests', dataKey: 'pendingRequests', color: 'yellow' },
    { id: 'status', title: 'Account Status', dataKey: 'accountStatus', color: 'yellow' },
  ], []);

  const profileCardData = useMemo(() => ({
    name: profile?.name ?? '-',
    customerId: normalizedCode ?? '-',
    address: profile?.address ?? '-',
    phone: profile?.phone ?? '-',
    email: profile?.email ?? '-',
    // Website: pass null when missing so ProfileTab hides the row
    website: getMetadataString(profile?.metadata ?? null, 'website') ?? null,
    mainContact: profile?.mainContact ?? profile?.manager?.name ?? '-',
    startDate: formatDisplayDate(profile?.createdAt ?? null),
  }), [profile, normalizedCode]);

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
    console.log('[CustomerHub] Waiting for critical data...');
    return null;
  }

  return (
    <ModalProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
        <MyHubSection
          hubName="Customer Hub"
          tabs={tabs}
          activeTab={activeTab}
          onTabClick={setActiveTab}
        userId={normalizedCode ?? 'CUSTOMER'}
        role="customer"
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
              <ActivityFeed
                activities={activities}
                hub="customer"
                onOpenActionableOrder={(order) => setActionOrder(order)}
                onOpenOrderModal={(order) => setSelectedOrderId(order?.orderId || order?.id || null)}
                onOpenServiceModal={setSelectedServiceId}
                isLoading={activitiesLoading}
                error={activitiesError}
                onError={(msg) => toast.error(msg)}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <NewsPreview color="#eab308" onViewAll={() => navigate('/news')} />
                <MemosPreview color="#eab308" onViewAll={() => navigate('/memos')} />
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
                role="customer"
                profileData={profileCardData}
                accountManager={accountManagerCard}
                primaryColor="#eab308"
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
                subtitle="Your business network overview"
                description="Click any row with an arrow to expand and explore your ecosystem connections."
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
                  { id: 'my', label: 'My Services', count: myServicesData.length },
                  { id: 'history', label: 'Service History', count: serviceHistoryData.length },
                ]}
                activeTab={servicesTab}
                onTabChange={(tab) => setServicesTab(tab as 'my' | 'history')}
                description={
                  servicesTab === 'my'
                    ? 'CKS services currently provided at your centers'
                    : 'Services archive'
                }
                searchPlaceholder={
                  servicesTab === 'my'
                    ? 'Search by Service ID or name'
                    : 'Search service history'
                }
                onSearch={setServicesSearchQuery}
                primaryColor="#eab308"
              >
                {servicesTab === 'my' && (
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
                            roleColor="#eab308"
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
                  />
                )}

                {servicesTab === 'history' && (
                  <DataTable
                    columns={[
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
              {notice && (
                <div style={{ marginBottom: 12, padding: '8px 12px', background: '#ecfeff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6 }}>{notice}</div>
              )}
              <OrdersSection
                userRole="customer"
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
                  const target = orders?.orders?.find((o: any) => (o.orderId || o.id) === orderId) as any;
                  const label = (action || '').toLowerCase();
                  let act: OrderActionRequest['action'] | null = null;
                  if (label.includes('cancel')) act = 'cancel';
                  if (label.includes('accept') && !act) act = 'accept';
                  if ((label.includes('reject') || label.includes('deny')) && !act) act = 'reject';
                  if (!act) return;
                  const nextRole = (target?.nextActorRole || '').toLowerCase();
                  if ((act === 'accept' || act === 'reject') && nextRole && nextRole !== 'customer') {
                    setNotice(`This order is now pending ${nextRole}. Refreshing...`);
                    setTimeout(() => setNotice(null), 2000);
                    mutate(`/hub/orders/${normalizedCode}`);
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
                    .then(() => { setNotice('Success'); setTimeout(() => setNotice(null), 1200); mutate(`/hub/orders/${normalizedCode}`); })
                    .catch((err) => {
                      console.error('[customer] failed to apply action', err);
                      const msg = err instanceof Error ? err.message : 'Failed to apply action';
                      setNotice(msg);
                      setTimeout(() => setNotice(null), 2200);
                    });
                }}
                showServiceOrders={true}
                showProductOrders={true}
                primaryColor="#eab308"
              />
            </PageWrapper>
          ) : activeTab === 'reports' ? (
            <PageWrapper headerSrOnly>
              <ReportsSection
                role="customer"
                userId={normalizedCode ?? undefined}
                primaryColor="#eab308"
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
                        customerId: normalizedCode ?? undefined,
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
                        customerId: normalizedCode ?? undefined,
                      });
                    }
                  } else if (payload.type === 'report') {
                    // Legacy text-based reports (fallback)
                    await apiCreateReport({ title: payload.title, description: payload.description, category: payload.category, customerId: normalizedCode ?? undefined });
                  } else {
                    // Legacy text-based feedback (fallback)
                    await apiCreateFeedback({ title: payload.title, message: payload.description, category: payload.category, customerId: normalizedCode ?? undefined });
                  }
                  await mutate(`/hub/reports/${normalizedCode}`);
                }}
                fetchServices={fetchServicesForReports}
                fetchProcedures={fetchProceduresForReports}
                fetchOrders={fetchOrdersForReports}
                onAcknowledge={async (id, type) => {
                  console.log('[CustomerHub] BEFORE acknowledge mutate');
                  await apiAcknowledgeItem(id, type);
                  await mutate(`/hub/reports/${normalizedCode}`);
                  console.log('[CustomerHub] AFTER acknowledge mutate');
                }}
                onResolve={async (id, details) => {
                  console.log('[CustomerHub] BEFORE resolve mutate');
                  await apiResolveReport(id, details ?? {});
                  await mutate(`/hub/reports/${normalizedCode}`);
                  console.log('[CustomerHub] AFTER resolve mutate');
                }}
              />
            </PageWrapper>
          ) : activeTab === 'support' ? (
            <PageWrapper headerSrOnly>
              <SupportSection role="customer" primaryColor="#eab308" />
            </PageWrapper>
          ) : (
            <PageWrapper title={activeTab} showHeader headerSrOnly>
              <h2>Customer Hub - {activeTab}</h2>
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
              console.error('[customer] failed to process action', err);
              alert('Failed to process action. Please try again.');
            }
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


