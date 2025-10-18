/*-----------------------------------------------
  Property of CKS  © 2025
-----------------------------------------------*/
/**
 * File: CrewHub.tsx
 *
 * Description:
 * Crew Hub orchestrator component wired to real backend data.
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
import { Button, DataTable, ModalProvider, OrderDetailsModal, ServiceViewModal, PageHeader, PageWrapper, Scrollbar, TabSection } from '@cks/ui';
import ActivityModalGateway from '../components/ActivityModalGateway';
import { useAuth } from '@cks/auth';
import { useCatalogItems } from '../shared/api/catalog';
import { useServices as useDirectoryServices } from '../shared/api/directory';
import { useFormattedActivities } from '../shared/activity/useFormattedActivities';
import { ActivityFeed } from '../components/ActivityFeed';

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
import { useSWRConfig } from 'swr';
import { createFeedback as apiCreateFeedback, acknowledgeItem as apiAcknowledgeItem, fetchServicesForReports, fetchProceduresForReports, fetchOrdersForReports } from '../shared/api/hub';

import { buildEcosystemTree, DEFAULT_ROLE_COLOR_MAP } from '../shared/utils/ecosystem';
import { useHubLoading } from '../contexts/HubLoadingContext';

interface CrewHubProps {
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


export default function CrewHub({ initialTab = 'dashboard' }: CrewHubProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [servicesTab, setServicesTab] = useState<'my' | 'active' | 'history'>('active');
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [actionOrder, setActionOrder] = useState<any | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [fetchedServiceDetails, setFetchedServiceDetails] = useState<any>(null);

  const { code: authCode } = useAuth();
  const normalizedCode = useMemo(() => normalizeIdentity(authCode), [authCode]);
  const { mutate } = useSWRConfig();
  const { setHubLoading } = useHubLoading();



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
        console.error('[crew] failed to load service details', err);
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
  const { data: reportsData, isLoading: reportsLoading } = useHubReports(normalizedCode);

  const {
    data: scopeData,
  } = useHubRoleScope(normalizedCode);

  // Signal when critical data is loaded
  useEffect(() => {
    const hasCriticalData = !!profile && !!dashboard;
    if (hasCriticalData) {
      console.log('[CrewHub] Critical data loaded, signaling ready');
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
    let mapped = orders.serviceOrders.map((order) => {
      // Check if this service has a pending crew request for this crew member
      const meta: any = (order as any).metadata || {};
      const crewReqs: any[] = Array.isArray(meta.crewRequests) ? meta.crewRequests : [];
      const pendingForMe = !!normalizedCode && crewReqs.some(r =>
        (r.crewCode || '').toUpperCase() === normalizedCode && r.status === 'pending'
      );

      // If there's a pending crew request, add approval workflow stages and override status
      let approvalStages = (order as any).approvalStages || [];
      let orderStatus = normalizeOrderStatus(order.viewerStatus ?? order.status);
      let availableActions = (order as any).availableActions || [];

      if (pendingForMe) {
        approvalStages = [
          { role: 'manager', status: 'approved', label: 'Manager Created' },
          { role: 'crew', status: 'pending', label: 'Crew Pending' }
        ];
        // Override status to 'crew-requested' so it appears in active tabs, not archive
        orderStatus = 'crew-requested';
        // Add Accept/Reject actions for crew response
        availableActions = ['Accept', 'Reject', 'View Details'];
      }

      return {
        ...order,
        title: order.title ?? order.serviceId ?? order.orderId,
        status: orderStatus,
        approvalStages,
        availableActions,
      };
    });

    return mapped;
  }, [orders, normalizedCode]);

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
    activeServices: (dashboard as any)?.activeServices ?? 0,
    completedToday: (dashboard as any)?.completedToday ?? 0,
    trainings: (dashboard as any)?.trainings ?? 0,
    assignedCenter: (dashboard as any)?.assignedCenter ?? null,
    accountStatus: dashboard?.accountStatus ?? 'Unknown',
  }), [dashboard]);

  const crewScope = scopeData?.role === 'crew' ? scopeData : null;

  const ecosystemTree = useMemo<TreeNode>(() => {
    const fallbackId = normalizedCode ?? 'CREW';
    const fallbackName = profile?.name ?? normalizedCode ?? 'Crew';

    if (!crewScope) {
      return {
        user: {
          id: fallbackId,
          role: 'Crew',
          name: fallbackName,
        },
        type: 'crew',
      };
    }

    return buildEcosystemTree(crewScope, { rootName: fallbackName });
  }, [crewScope, normalizedCode, profile?.name]);

  const ecosystemRootId = ecosystemTree.user.id;
  const ecosystemCurrentUserId = normalizedCode ?? ecosystemRootId;
  const ecosystemExpandedNodes = useMemo(() => {
    const nodes: string[] = [];
    if (ecosystemRootId) {
      nodes.push(ecosystemRootId);
    }
    if (normalizedCode && !nodes.includes(normalizedCode)) {
      nodes.push(normalizedCode);
    }
    return nodes;
  }, [ecosystemRootId, normalizedCode]);

  const { activeServicesData, serviceHistoryData } = useMemo(() => {
    const active: Array<{ serviceId: string; serviceName: string; type: string; status: string; startDate: string; canRespond?: boolean; onAccept?: () => Promise<void>; onReject?: () => Promise<void> }>
      = [];
    const history: Array<{ serviceId: string; serviceName: string; type: string; status: string; startDate: string; endDate: string }>
      = [];

    serviceOrders.forEach((order) => {
      if (!(order as any).serviceId && !(order as any).transformedId) {
        return;
      }
      const normalizedStatus = normalizeStatusValue(order.status);
      const meta: any = (order as any).metadata || {};
      const svcStatus = normalizeStatusValue(meta?.serviceStatus as string | null);
      const actualStartDate = meta.actualStartDate || meta.serviceStartDate;
      const base: any = {
        serviceId: order.serviceId ?? order.orderId,
        serviceName: order.title ?? order.serviceId ?? order.orderId,
        type: order.orderType === 'service' ? 'Service' : 'Product',
        status: svcStatus ? formatStatusLabel(svcStatus) : formatStatusLabel(order.status),
        startDate: svcStatus === 'created' ? 'Pending' : (actualStartDate ? formatDisplayDate(actualStartDate) : formatDisplayDate(order.requestedDate)),
        endDate: formatDisplayDate(order.expectedDate),
      };

      const m = (order as any).metadata || {};
      const crewReqs: any[] = Array.isArray(m.crewRequests) ? m.crewRequests : [];
      const pendingForMe = !!normalizedCode && crewReqs.some(r => (r.crewCode || '').toUpperCase() === normalizedCode && r.status === 'pending');

      // If there's a pending crew request for this crew, it should appear in Service Orders tab, not here
      if (pendingForMe) {
        return; // Skip this service in Active Services
      }

      // Completed/cancelled services go to history for crew too
      if (svcStatus === 'completed' || svcStatus === 'cancelled' || normalizedStatus === 'cancelled' || normalizedStatus === 'rejected') {
        history.push(base);
      } else {
        // Include active service statuses: pending approval stages, in-progress work, AND created services that are active
        active.push(base);
      }
    });

    return { activeServicesData: active, serviceHistoryData: history };
  }, [serviceOrders]);

  const tabs = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', path: '/crew/dashboard' },
    { id: 'profile', label: 'My Profile', path: '/crew/profile' },
    { id: 'ecosystem', label: 'My Ecosystem', path: '/crew/ecosystem' },
    { id: 'services', label: 'Services', path: '/crew/services' },
    { id: 'orders', label: 'Orders', path: '/crew/orders' },
    { id: 'reports', label: 'Reports', path: '/crew/reports' },
    { id: 'support', label: 'Support', path: '/crew/support' },
  ], []);

  const overviewCards = useMemo(() => [
    { id: 'services', title: 'Active Services', dataKey: 'activeServices', color: 'teal' },
    { id: 'completed', title: 'Completed Tasks', dataKey: 'completedTasks', color: 'red' },
    { id: 'hours', title: 'Hours', dataKey: 'hours', color: 'red' },
    { id: 'status', title: 'Status', dataKey: 'accountStatus', color: 'red' },
  ], []);

  const profileCardData = useMemo(() => ({
    name: profile?.name ?? '-',
    crewId: normalizedCode ?? '-',
    address: profile?.address ?? '-',
    phone: profile?.phone ?? '-',
    email: profile?.email ?? '-',
    // ProfileTab for crew expects `emergencyContact`, not `mainContact`.
    // Source from metadata first (backend writes both), then fallback.
    emergencyContact: (profile?.metadata as any)?.emergencyContact ?? profile?.mainContact ?? '-',
    startDate: formatDisplayDate(profile?.createdAt ?? null),
  }), [profile, normalizedCode]);

  const accountManagerCard = useMemo(() => {
    // Crew members get their manager through their assigned center
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

  // Catalog-backed My Services (MVP): show all services to crew via catalog endpoint
  const { data: catalogData } = useCatalogItems({ type: 'service', pageSize: 500 });

  // Column definitions for My Services
  const MY_SERVICES_COLUMNS_BASE = [
    { key: 'serviceId', label: 'SERVICE ID', clickable: true },
    { key: 'serviceName', label: 'SERVICE NAME' },
  ];

  const MY_SERVICES_COLUMNS_CERTIFIED = [
    ...MY_SERVICES_COLUMNS_BASE,
    { key: 'certified', label: 'CERTIFIED' },
    { key: 'certificationDate', label: 'CERTIFICATION DATE' },
    { key: 'expires', label: 'EXPIRES' },
  ];

  const myCatalogServices = useMemo(() => {
    const items = catalogData?.items || [];
    return items.map((svc: any) => {
      const certifications = svc.metadata?.certifications || {};
      const crewCerts = certifications.crew || [];
      const isCertified = crewCerts.includes(normalizedCode);

      return {
        serviceId: svc.code ?? 'CAT-SRV',
        serviceName: svc.name ?? 'Service',
        certified: isCertified ? 'Yes' : 'No',
        certificationDate: isCertified ? '-' : null,
        expires: isCertified ? '-' : null,
        _isCertified: isCertified,
      };
    });
  }, [catalogData, normalizedCode]);

  // Check if any service has the user certified to determine columns
  const hasAnyCertification = useMemo(
    () => myCatalogServices.some((s: any) => s._isCertified),
    [myCatalogServices]
  );

  const myServicesColumns = hasAnyCertification
    ? MY_SERVICES_COLUMNS_CERTIFIED
    : MY_SERVICES_COLUMNS_BASE;

  // Centralized handler for actionable orders from ActivityFeed
  const handleOrderAction = useCallback(async (orderId: string, action: string) => {
    try {
      if (action === 'Accept') {
        const payload: OrderActionRequest = { action: 'accept' };
        await applyHubOrderAction(orderId, payload);
        mutate(`/hub/orders/${normalizedCode}`);
        return;
      }
      if (action === 'Decline' || action === 'Reject') {
        const reason = window.prompt('Please provide a short reason')?.trim() || '';
        if (!reason) {
          alert('A reason is required.');
          return;
        }
        const payload: OrderActionRequest = { action: 'reject', notes: reason };
        await applyHubOrderAction(orderId, payload);
        mutate(`/hub/orders/${normalizedCode}`);
        return;
      }
      if (action === 'Cancel') {
        const confirmed = window.confirm('Are you sure you want to cancel this order?');
        if (!confirmed) return;
        const notes = window.prompt('Optional: provide a short reason')?.trim() || null;
        const payload: OrderActionRequest = { action: 'cancel', ...(notes ? { notes } : {}) };
        await applyHubOrderAction(orderId, payload);
        mutate(`/hub/orders/${normalizedCode}`);
        return;
      }
      // Default: if action not recognized, open details
      setSelectedOrderId(orderId);
    } catch (err) {
      console.error('[crew] failed to process action', err);
      alert('Failed to process action. Please try again.');
    }
  }, [normalizedCode, mutate]);

  // Don't render anything until we have critical data
  if (!profile || !dashboard) {
    console.log('[CrewHub] Waiting for critical data...');
    return null;
  }

  return (
    <ModalProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
        <MyHubSection
          hubName="Crew Hub"
          tabs={tabs}
          activeTab={activeTab}
          onTabClick={setActiveTab}
        userId={normalizedCode ?? 'CREW'}
        role="crew"
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
                hub="crew"
        onOpenActionableOrder={(order) => setActionOrder(order)}
                onOpenOrderModal={(order) => setSelectedOrderId(order?.orderId || order?.id || null)}
                onOpenServiceModal={setSelectedServiceId}
                isLoading={activitiesLoading}
                error={activitiesError}
                onError={(msg) => toast.error(msg)}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <NewsPreview color="#ef4444" onViewAll={() => navigate('/news')} />
                <MemosPreview color="#ef4444" onViewAll={() => navigate('/memos')} />
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
                role="crew"
                profileData={profileCardData}
                accountManager={accountManagerCard}
                primaryColor="#ef4444"
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
                expandedNodes={ecosystemExpandedNodes}
                currentUserId={ecosystemCurrentUserId}
                title="Ecosystem"
                subtitle="Your network overview"
                description="Click any row with an arrow to expand and explore your crew ecosystem."
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
                  { id: 'my', label: 'My Services', count: myCatalogServices.length },
                  { id: 'active', label: 'Active Services', count: activeServicesData.length },
                  { id: 'history', label: 'Service History', count: serviceHistoryData.length },
                ]}
                activeTab={servicesTab}
                onTabChange={(tab) => setServicesTab(tab as 'my' | 'active' | 'history')}
                description={
                  servicesTab === 'my'
                    ? 'Services you are trained and certified to work on'
                    : servicesTab === 'active'
                      ? 'Active services you are currently working on'
                      : 'Services you no longer work on'
                }
                searchPlaceholder="Search services"
                onSearch={setServicesSearchQuery}
                primaryColor="#ef4444"
              >
                {servicesTab === 'my' && (
                  <DataTable
                    columns={myServicesColumns}
                    data={myCatalogServices.filter((row) => {
                      if (!servicesSearchQuery) return true;
                      const q = servicesSearchQuery.toLowerCase();
                      return row.serviceId.toLowerCase().includes(q) || row.serviceName.toLowerCase().includes(q);
                    })}
                    showSearch={false}
                    maxItems={10}
                    modalType="service-my-services"
                  />
                )}

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
                              {value ?? '-'}
                            </span>
                          );
                        },
                      },
                      { key: 'startDate', label: 'START DATE' },
                      {
                        key: 'actions',
                        label: 'ACTIONS',
                        render: (_: any, row: any) => {
                          if (row.canRespond) {
                            return (
                              <div style={{ display: 'flex', gap: 8 }}>
                                <Button size="sm" variant="primary" onClick={async () => { try { await row.onAccept?.(); mutate(`/hub/orders/${normalizedCode}`); } catch (e) { alert('Failed to accept.'); } }}>Accept</Button>
                                <Button size="sm" variant="danger" onClick={async () => { try { await row.onReject?.(); mutate(`/hub/orders/${normalizedCode}`); } catch (e) { alert('Failed to reject.'); } }}>Reject</Button>
                              </div>
                            );
                          }
                          return (
                            <Button
                              size="sm"
                              roleColor="#ef4444"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedServiceId(row.serviceId);
                              }}
                            >
                              View Details
                            </Button>
                          );
                        }
                      }
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
                userRole="crew"
                userCode={normalizedCode ?? undefined}
                serviceOrders={serviceOrders}
                productOrders={productOrders}
                onCreateServiceOrder={() => navigate('/catalog?mode=services')}
                onCreateProductOrder={() => navigate('/catalog?mode=products')}
                onOrderAction={async (orderId, action) => {
                  if (action === 'View Details') {
                    setSelectedOrderId(orderId);
                    return;
                  }
                  const label = (action || '').toLowerCase();
                  let act: OrderActionRequest['action'] | null = null;
                  if (label.includes('cancel')) act = 'cancel';
                  if (label.includes('accept') && !act) act = 'accept';
                  if (label.includes('reject') || label.includes('deny')) act = 'reject';
                  if (!act) return;

                  try {
                    // For crew assignment responses (accept/reject crew invites)
                    if (act === 'accept' || act === 'reject') {
                      const { apiFetch } = await import('../shared/api/client');

                      // Find the order to get serviceId/transformedId
                      const targetOrder = orders?.orders?.find((o: any) => (o.orderId || o.id) === orderId);
                      const serviceId = (targetOrder as any)?.serviceId || (targetOrder as any)?.transformedId;

                      if (serviceId) {
                        // Post-creation crew request: use service endpoint
                        await apiFetch(`/services/${encodeURIComponent(serviceId)}/crew-response`, {
                          method: 'POST',
                          body: JSON.stringify({ accept: act === 'accept' }),
                        });
                        console.log('[crew] responded to service crew invite', { serviceId, accept: act === 'accept' });
                      } else {
                        // Pre-creation crew request (during order approval): use order endpoint
                        await apiFetch(`/orders/${orderId}/crew-response`, {
                          method: 'POST',
                          body: JSON.stringify({ accept: act === 'accept' }),
                        });
                        console.log('[crew] responded to order crew invite', { orderId, accept: act === 'accept' });
                      }

                      mutate(`/hub/orders/${normalizedCode}`);
                    } else {
                      // Regular order actions (cancel, etc.)
                      const notes = act === 'cancel' ? (window.prompt('Optional: reason for cancellation?')?.trim() || null) : null;
                      let payload: OrderActionRequest = { action: act } as OrderActionRequest;
                      if (typeof notes === 'string' && notes.trim().length > 0) {
                        payload.notes = notes;
                      }
                      await applyHubOrderAction(orderId, payload);
                      mutate(`/hub/orders/${normalizedCode}`);
                    }
                  } catch (err) {
                    console.error('[crew] failed to apply action', err);
                    alert('Failed to process action. Please try again.');
                  }
                }}
                showServiceOrders={true}
                showProductOrders={true}
                primaryColor="#ef4444"
              />
            </PageWrapper>
          ) : activeTab === 'reports' ? (
            <PageWrapper headerSrOnly>
              <ReportsSection
                role="crew"
                userId={normalizedCode ?? undefined}
                primaryColor="#ef4444"
                reports={reportsData?.reports || []}
                feedback={reportsData?.feedback || []}
                isLoading={reportsLoading}
              onSubmit={async (payload) => {
                  await apiCreateFeedback({
                    title: payload.title || 'Feedback',
                    message: payload.description || (payload.reportReason ?? ''),
                    category: payload.category || 'Recognition',
                    ...(payload.reportCategory && payload.relatedEntityId && payload.reportReason ? {
                      reportCategory: payload.reportCategory,
                      relatedEntityId: payload.relatedEntityId,
                      reportReason: payload.reportReason,
                      rating: payload.rating,
                    } : {}),
                  });
                  await mutate(`/hub/reports/${normalizedCode}`);
                }}
                fetchServices={fetchServicesForReports}
                fetchProcedures={fetchProceduresForReports}
                fetchOrders={fetchOrdersForReports}
                onAcknowledge={async (id, type) => {
                  console.log('[CrewHub] BEFORE acknowledge mutate');
                  await apiAcknowledgeItem(id, type);
                  await (mutate as any)(`/hub/reports/${normalizedCode}`);
                  console.log('[CrewHub] AFTER acknowledge mutate');
                }}
              />
            </PageWrapper>
          ) : activeTab === 'support' ? (
            <PageWrapper headerSrOnly>
              <SupportSection role="crew" primaryColor="#ef4444" />
            </PageWrapper>
          ) : (
            <PageWrapper title={activeTab} showHeader headerSrOnly>
              <h2>Crew Hub - {activeTab}</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </PageWrapper>
          )}
        </div>
      </Scrollbar>

      {/* Action modal showing OrderCard with buttons for actionable orders */}
      {/* Progressive Disclosure Modal for orders (user role) */}
      {actionOrder && (
        <ActivityModalGateway
          isOpen={!!actionOrder}
          onClose={() => setActionOrder(null)}
          orderId={(actionOrder.orderId || actionOrder.id) as string}
          role="user"
          userAvailableActions={(actionOrder.availableActions || []) as string[]}
          onAction={(orderId, action) => {
            handleOrderAction(orderId, action);
            // keep modal open; details remain visible if user expands
          }}
        />
      )}

      {/* View-only legacy path replaced by ActivityModal expansion; keep for non-action cases via ActivityFeed */}
      {selectedOrderId && (
        <ActivityModalGateway
          isOpen={!!selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          orderId={selectedOrderId}
          role="user"
          userAvailableActions={[]}
          onAction={(orderId, action) => handleOrderAction(orderId, action)}
        />
      )}

      {/* Service View Modal */}
      {(() => {
        if (!selectedServiceId || !fetchedServiceDetails) return null;

        // Get product orders for this service
        const serviceProductOrders = productOrders
          .filter((order) => {
            const orderMeta = (order as any).metadata || {};
            return orderMeta.serviceId === selectedServiceId;
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
