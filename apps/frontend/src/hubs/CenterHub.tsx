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
import { Button, DataTable, OrderDetailsModal, PageHeader, PageWrapper, Scrollbar, TabSection } from '@cks/ui';
import { useAuth } from '@cks/auth';

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
      role: 'center',
      orderType: order.orderType,
      status: order.status,
    },
  }));
}

export default function CenterHub({ initialTab = 'dashboard' }: CenterHubProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [servicesTab, setServicesTab] = useState<'active' | 'history'>('active');
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
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
  const { data: reportsData, isLoading: reportsLoading } = useHubReports(normalizedCode);

  const {
    data: scopeData,
  } = useHubRoleScope(normalizedCode);

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
    crewCount: (dashboard as any)?.crewCount ?? 0,
    activeServices: (dashboard as any)?.activeServices ?? 0,
    pendingRequests: (dashboard as any)?.pendingRequests ?? 0,
    equipmentCount: (dashboard as any)?.equipmentCount ?? 0,
    accountStatus: dashboard?.accountStatus ?? 'Unknown',
  }), [dashboard]);

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
      const base = {
        serviceId: order.serviceId ?? order.orderId,
        serviceName: order.title ?? order.serviceId ?? order.orderId,
        crewAssigned: getMetadataString(order as any, 'crewAssigned') ?? '—',
        type: order.orderType === 'service' ? 'Service' : 'Product',
        status: formatStatusLabel(order.status),
        startDate: formatDisplayDate(order.requestedDate),
        endDate: formatDisplayDate(order.expectedDate),
      };

      // Only show cancelled/rejected services in history
      // Active services (delivered/service-created) should remain in Active Services until explicitly completed
      if (normalizedStatus === 'cancelled' || normalizedStatus === 'rejected') {
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
          crewAssigned: base.crewAssigned,
          type: base.type,
          status: base.status,
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

  const overviewCards = useMemo(() => [
    { id: 'crew', title: 'Active Crew', dataKey: 'crewCount', color: 'red' },
    { id: 'services', title: 'Active Services', dataKey: 'activeServices', color: 'teal' },
    { id: 'requests', title: 'Pending Requests', dataKey: 'pendingRequests', color: 'orange' },
    { id: 'equipment', title: 'Equipment', dataKey: 'equipmentCount', color: 'purple' },
    { id: 'status', title: 'Center Status', dataKey: 'accountStatus', color: 'orange' },
  ], []);

  const profileCardData = useMemo(() => ({
    name: profile?.name ?? '—',
    centerId: normalizedCode ?? '—',
    address: profile?.address ?? '—',
    phone: profile?.phone ?? '—',
    email: profile?.email ?? '—',
    customerId: (dashboard as any)?.customerId ?? '—',
    mainContact: profile?.mainContact ?? '—',
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

  return (
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
                cards={overviewCards}
                data={overviewData}
                loading={dashboardLoading}
              />

              <PageHeader title="Recent Activity" />
              <RecentActivity
                activities={activities}
                onClear={() => undefined}
                emptyMessage="No recent center activity"
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
                actionButton={
                  <Button
                    variant="primary"
                    roleColor="#000000"
                    onClick={() => navigate('/catalog')}
                  >
                    Browse CKS Catalog
                  </Button>
                }
                primaryColor="#f97316"
              >
                {servicesTab === 'active' && (
                  <DataTable
                    columns={[
                      { key: 'serviceId', label: 'SERVICE ID', clickable: true },
                      { key: 'serviceName', label: 'SERVICE NAME' },
                      { key: 'crewAssigned', label: 'CREW ASSIGNED' },
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
                    onRowClick={() => undefined}
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
              <OrdersSection
                userRole="center"
                userCode={normalizedCode ?? undefined}
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
