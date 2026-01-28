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
import { Button, DataTable, PageHeader, PageWrapper, Scrollbar, TabSection } from '@cks/ui';
import { useModals } from '../contexts';
import { useAuth } from '@cks/auth';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useSWRConfig } from 'swr';
import { requestPasswordReset } from '../shared/api/account';
import { useNewsFeed } from '../shared/api/news';
import { useFormattedActivities } from '../shared/activity/useFormattedActivities';
import { resolvedUserCode } from '../shared/utils/userCode';
import { ActivityFeed } from '../components/ActivityFeed';
import ProfileSkeleton from '../components/ProfileSkeleton';
// ActivityModalGateway (legacy) removed in favor of universal ModalGateway via modals.openById()
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
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
import { createReport as apiCreateReport, createFeedback as apiCreateFeedback, acknowledgeItem as apiAcknowledgeItem, resolveReport as apiResolveReport, fetchServicesForReports, fetchProceduresForReports, fetchOrdersForReports } from '../shared/api/hub';

import { buildEcosystemTree, DEFAULT_ROLE_COLOR_MAP } from '../shared/utils/ecosystem';
import { useHubLoading } from '../contexts/HubLoadingContext';
import { loadUserPreferences, saveUserPreferences } from '../shared/preferences';
import { buildCenterOverviewData } from '../shared/overview/builders';
import { dismissActivity, dismissAllActivities } from '../shared/api/directory';
import { useAccessCodeRedemption } from '../hooks/useAccessCodeRedemption';
import OverviewSummaryModal, { type OverviewSummaryItem } from '../components/overview/OverviewSummaryModal';
import { buildSupportTickets, mapSupportIssuePayload } from '../shared/support/supportTickets';

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

// Main wrapper component that sets up ModalProvider
export default function CenterHub({ initialTab = 'dashboard' }: CenterHubProps) {
  const { code: authCode } = useAuth();
  const { openUserProfile } = useClerk();
  const { setTheme } = useAppTheme();
  const normalizedCode = useMemo(() => normalizeIdentity(authCode), [authCode]);

  return <CenterHubContent initialTab={initialTab} />;
}

// Inner component that has access to modal context
function CenterHubContent({ initialTab = 'dashboard' }: CenterHubProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [servicesTab, setServicesTab] = useState<'active' | 'history'>('active');
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [overviewModal, setOverviewModal] = useState<{
    id: string;
    title: string;
    subtitle?: string;
    items: OverviewSummaryItem[];
    emptyMessage?: string;
    accentColor?: string;
  } | null>(null);
  const { setTheme } = useAppTheme();
  // Legacy modal state removed; universal ModalGateway handles all entity modals
  const { code: authCode, accessStatus, accessTier, accessSource } = useAuth();
  const { user } = useUser();
  const normalizedCode = useMemo(() => normalizeIdentity(authCode), [authCode]);
  const { setHubLoading } = useHubLoading();
  const accessGate = useAccessCodeRedemption();
  const handleUploadPhoto = useCallback(async (file: File) => { if (!user) { toast.error('User not authenticated'); return; } try { await user.setProfileImage({ file }); toast.success('Profile photo updated'); } catch (e: any) { console.error('photo upload failed', e); toast.error(e?.message || 'Failed to update photo'); } }, [user]);
  const { mutate } = useSWRConfig();
  const { data: newsItems = [] } = useNewsFeed();
  const newsPreviewItems = useMemo(
    () =>
      newsItems.slice(0, 3).map((item) => ({
        id: item.id,
        title: item.title,
        date: new Date(item.createdAt),
      })),
    [newsItems],
  );
  const { handleAction } = useEntityActions();

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
  const supportTickets = useMemo(() => buildSupportTickets(reportsData), [reportsData]);
  // Resolved user code for preferences and identity
  const userCode = useMemo(() => profile?.cksCode ?? normalizedCode, [profile?.cksCode, normalizedCode]);

  // Access modal context
  const modals = useModals();

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

  const { activities, isLoading: activitiesLoading, error: activitiesError, mutate: mutateActivities } = useFormattedActivities(normalizedCode, { limit: 20 });

  // Handle activity dismissal
  const handleClearActivity = useCallback(async (activityId: string) => {
    try {
      await dismissActivity(activityId);
      mutateActivities();
      console.log('[CenterHub] Activity dismissed:', activityId);
    } catch (error) {
      console.error('[CenterHub] Failed to dismiss activity:', error);
    }
  }, [mutateActivities]);

  // Clear ALL activities for current user
  const handleClearAll = useCallback(async () => {
    try {
      const result = await dismissAllActivities();
      mutateActivities();
      console.log(`[CenterHub] ${result.count} activities dismissed`);
    } catch (error) {
      console.error('[CenterHub] Failed to clear all activities:', error);
    }
  }, [mutateActivities]);

  const handlePasswordReset = useCallback(async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const result = await requestPasswordReset(user.id);
      toast.success(result.message || 'Password reset email sent successfully');
    } catch (error) {
      console.error('[CenterHub] Failed to request password reset', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send password reset email');
    }
  }, [user?.id]);

  const handleSupportSubmit = useCallback(async (payload: any) => {
    const mapped = mapSupportIssuePayload(payload);
    if (mapped.type === 'report') {
      await apiCreateReport({
        title: mapped.title,
        description: mapped.description,
        category: mapped.category,
        priority: mapped.priority,
        centerId: normalizedCode ?? undefined,
      });
    } else {
      await apiCreateFeedback({
        title: mapped.title,
        message: mapped.description,
        category: mapped.category,
        centerId: normalizedCode ?? undefined,
      });
    }
    await mutateReports();
  }, [mutateReports, normalizedCode]);

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

      const serviceId = (order as any).serviceId ?? (order as any).transformedId ?? (order as any).transformed_id ?? null;
      if (!serviceId) {
        return;
      }
      const base = {
        serviceId,
        serviceName: order.title ?? serviceId,
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

  const overviewData = useMemo(() =>
    buildCenterOverviewData({
      dashboard: dashboard ?? null,
      profile: profile ?? null,
      scope: scopeData ?? null,
      activeServicesCount: activeServicesData.length,
      accessStatus,
      accessTier,
    }),
  [dashboard, profile, scopeData, activeServicesData.length, accessStatus, accessTier]);

  const overviewCards = useMemo(() => {
    return centerOverviewCards.map((card) => ({
      ...card,
      onClick: () => {
        const cap = 5;
        const toItems = (rows: OverviewSummaryItem[]) => rows.slice(0, cap);
        let payload: Omit<typeof overviewModal, 'id'> | null = null;

        switch (card.id) {
          case 'active-services':
            payload = {
              title: 'Active Services',
              subtitle: 'Services currently active at this center',
              items: toItems(activeServicesData.map((svc) => ({
                primary: svc.serviceName ?? svc.serviceId,
                secondary: svc.serviceId,
                meta: svc.status,
              }))),
              emptyMessage: 'No active services yet.',
              accentColor: card.color,
            };
            break;
          case 'active-crew':
            payload = {
              title: 'Active Crew',
              subtitle: 'Crew currently assigned to this center',
              items: toItems((scopeData?.relationships?.crew || []).map((crew) => ({
                primary: crew.name || crew.id,
                secondary: crew.id,
                meta: crew.assignedCenter || undefined,
              }))),
              emptyMessage: 'No crew assigned yet.',
              accentColor: card.color,
            };
            break;
          case 'pending-orders': {
            const pending = (orders?.orders || []).filter((order) => String(order.status || '').toLowerCase().includes('pending'));
            payload = {
              title: 'Pending Orders',
              subtitle: 'Orders awaiting action',
              items: toItems(pending.map((order) => ({
                primary: order.orderId || order.id || 'Order',
                secondary: order.title || undefined,
                meta: formatStatusLabel(order.status || 'pending'),
              }))),
              emptyMessage: 'No pending orders.',
              accentColor: card.color,
            };
            break;
          }
          case 'account-status':
            payload = {
              title: 'Account Status',
              subtitle: 'Access and tier overview',
              items: [
                { primary: 'Access Status', secondary: accessStatus || dashboard?.accountStatus || '—' },
                { primary: 'Access Tier', secondary: accessTier || '—' },
                { primary: 'Access Source', secondary: accessSource || '—' },
              ],
              emptyMessage: 'No account status available.',
              accentColor: card.color,
            };
            break;
          default:
            break;
        }

        if (!payload) return;
        setOverviewModal((prev) => (prev?.id === card.id ? null : { id: card.id, ...payload }));
      },
    }));
  }, [activeServicesData, scopeData?.relationships?.crew, orders?.orders, accessStatus, accessTier, accessSource, dashboard?.accountStatus]);

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
    console.log('[CenterHub.tsx] Waiting for critical data...');
    return <ProfileSkeleton />;
  }

  return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
            <MyHubSection
              hubName={(loadUserPreferences(userCode ?? normalizedCode).hubTitle?.trim() || 'Center Hub')}
              tabs={tabs}
          activeTab={activeTab}
          onTabClick={setActiveTab}
        userId={normalizedCode ?? 'CENTER'}
        role="center"
      />

      <Scrollbar className="hub-content-scroll" style={{ flex: 1, padding: '0 var(--hub-gutter, 24px)' }}>
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
              {overviewModal && (
                <OverviewSummaryModal
                  isOpen={!!overviewModal}
                  onClose={() => setOverviewModal(null)}
                  title={overviewModal.title}
                  subtitle={overviewModal.subtitle}
                  items={overviewModal.items}
                  emptyMessage={overviewModal.emptyMessage}
                  accentColor={overviewModal.accentColor}
                />
              )}

              <PageHeader title="Recent Activity" />
              <ActivityFeed
                activities={activities}
                hub="center"
                viewerId={userCode || undefined}
                onClearActivity={handleClearActivity}
                onClearAll={handleClearAll}
                onOpenServiceModal={(serviceId) => modals.openById(serviceId)}
                isLoading={activitiesLoading}
                error={activitiesError}
                onError={(msg) => toast.error(msg)}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <NewsPreview color="#f97316" items={newsPreviewItems} onViewAll={() => navigate('/news')} />
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
                enabledTabs={[ 'profile', 'accountManager', 'settings' ]}
                onUploadPhoto={handleUploadPhoto}
                onOpenAccountSecurity={() => openUserProfile?.()}
                onRequestPasswordReset={handlePasswordReset}
                passwordResetAvailable={Boolean(user?.passwordEnabled)}
                userPreferences={loadUserPreferences(userCode ?? normalizedCode)}
                onSaveUserPreferences={(prefs) => saveUserPreferences(userCode ?? normalizedCode, prefs)}
                availableTabs={tabs.map(t => ({ id: t.id, label: t.label }))}
                onSetTheme={setTheme}
                accessStatus={accessStatus}
                accessTier={accessTier}
                accessSource={accessSource}
                onRedeemAccessCode={accessGate.redeem}
                onContactManager={() => undefined}
                onScheduleMeeting={() => undefined}
              />
            </PageWrapper>
          ) : activeTab === 'ecosystem' ? (
            <PageWrapper headerSrOnly>
              <EcosystemTree
                rootUser={ecosystemTree.user}
                treeData={ecosystemTree}
                onNodeClick={(id) => modals.openById(id)}
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
                      // Actions column removed – rows open modal on click
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
                    onRowClick={(row: any) => {
                      modals.openById(row.serviceId);
                    }}
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
                    onRowClick={(row: any) => {
                      modals.openById(row.serviceId);
                    }}
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
                onOrderAction={async (orderId, action) => {
                  if (action === 'View Details' || action === 'View') {
                    modals.openById(orderId);
                    return;
                  }
                  await handleAction(orderId, action);
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
                        reportArea: payload.reportArea,
                        details: payload.details,
                        priority: payload.priority,
                        centerId: normalizedCode ?? undefined,
                      });
                    } else {
                      await apiCreateFeedback({
                        title: 'Feedback',
                        category: 'Recognition',
                        reportCategory: payload.reportCategory,
                        relatedEntityId: payload.relatedEntityId,
                        reportReason: payload.reportReason,
                        rating: payload.rating,
                        reportArea: payload.reportArea,
                        details: payload.details,
                        ratingBreakdown: payload.ratingBreakdown,
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
                onReportClick={(reportId) => {
                  modals.openById(reportId);
                }}
              />
            </PageWrapper>
          ) : activeTab === 'support' ? (
            <PageWrapper headerSrOnly>
              <SupportSection
                role="center"
                primaryColor="#f97316"
                tickets={supportTickets}
                onSubmitTicket={handleSupportSubmit}
              />
            </PageWrapper>
          ) : (
            <PageWrapper title={activeTab} showHeader headerSrOnly>
              <h2>Center Hub - {activeTab}</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </PageWrapper>
          )}
        </div>
      </Scrollbar>

      {/* Legacy order modals removed: all order interactions go through ModalGateway via modals.openById() */}


    </div>
  );
}












