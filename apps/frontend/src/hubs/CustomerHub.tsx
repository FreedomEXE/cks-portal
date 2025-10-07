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

import { useEffect, useMemo, useState } from 'react';
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
import { Button, DataTable, OrderDetailsModal, ProductOrderModal, ServiceOrderModal, ServiceViewModal, PageHeader, PageWrapper, Scrollbar, TabSection } from '@cks/ui';
import { useAuth } from '@cks/auth';
import { useSWRConfig } from 'swr';

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
      role: 'customer',
      orderType: order.orderType,
      status: order.status,
    },
  }));
}

export default function CustomerHub({ initialTab = 'dashboard' }: CustomerHubProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [servicesTab, setServicesTab] = useState<'my' | 'history'>('my');
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<HubOrderItem | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [fetchedServiceDetails, setFetchedServiceDetails] = useState<any>(null);

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
  const {
    data: reportsData,
    isLoading: reportsLoading,
  } = useHubReports(normalizedCode);
  const {
    data: scopeData,
  } = useHubRoleScope(normalizedCode);
  const { mutate } = useSWRConfig();
  const [notice, setNotice] = useState<string | null>(null);

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

  const activities = useMemo(() => buildActivities(serviceOrders, productOrders), [serviceOrders, productOrders]);

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
    { id: 'services', label: 'My Services', path: '/customer/services' },
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
    name: profile?.name ?? '—',
    customerId: normalizedCode ?? '—',
    address: profile?.address ?? '—',
    phone: profile?.phone ?? '—',
    email: profile?.email ?? '—',
    website: getMetadataString(profile?.metadata ?? null, 'website') ?? '—',
    mainContact: profile?.mainContact ?? profile?.manager?.name ?? '—',
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

  return (
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
              <RecentActivity
                activities={activities}
                onClear={() => undefined}
                emptyMessage="No recent customer activity"
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
                actionButton={
                  <Button
                    variant="primary"
                    roleColor="#000000"
                    onClick={() => navigate('/catalog')}
                  >
                    Browse CKS Catalog
                  </Button>
                }
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
                    onRowClick={(row) => setSelectedServiceId(row.serviceId)}
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
  );
}
