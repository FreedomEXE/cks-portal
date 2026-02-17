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
import { crewOverviewCards } from '@cks/domain-widgets';
import { Button, DataTable, PageHeader, PageWrapper, Scrollbar, TabSection } from '@cks/ui';
import { useModals } from '../contexts';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import { respondToCrewInvite } from '../shared/api/hub';
import { useEntityActions } from '../hooks/useEntityActions';
import { useAuth } from '@cks/auth';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useCatalogItems } from '../shared/api/catalog';
import { requestPasswordReset } from '../shared/api/account';
import { useNewsFeed } from '../shared/api/news';
import { useCertifiedServices } from '../hooks/useCertifiedServices';
import { useServices as useDirectoryServices } from '../shared/api/directory';
import { useFormattedActivities } from '../shared/activity/useFormattedActivities';
import { ActivityFeed } from '../components/ActivityFeed';
import ProfileSkeleton from '../components/ProfileSkeleton';
import { dismissActivity, dismissAllActivities } from '../shared/api/directory';

import MyHubSection from '../components/MyHubSection';
import {
  useHubDashboard,
  useHubOrders,
  useHubProfile,
  useHubReports,
  useHubRoleScope,
  type HubOrderItem,
} from '../shared/api/hub';
import { useSWRConfig } from 'swr';
import { createFeedback as apiCreateFeedback, acknowledgeItem as apiAcknowledgeItem, fetchServicesForReports, fetchProceduresForReports, fetchOrdersForReports } from '../shared/api/hub';

import { buildEcosystemTree, DEFAULT_ROLE_COLOR_MAP } from '../shared/utils/ecosystem';
import { buildCrewOverviewData } from '../shared/overview/builders';
import { resolvedUserCode } from '../shared/utils/userCode';
import { useHubLoading } from '../contexts/HubLoadingContext';
import { loadUserPreferences, saveUserPreferences } from '../shared/preferences';
import { useAccessCodeRedemption } from '../hooks/useAccessCodeRedemption';
import OverviewSummaryModal, { type OverviewSummaryItem } from '../components/overview/OverviewSummaryModal';
import { buildSupportTickets, mapSupportIssuePayload } from '../shared/support/supportTickets';
import { uploadProfilePhotoAndSyncLogo } from '../shared/profilePhoto';

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


// Main wrapper component that sets up ModalProvider
export default function CrewHub({ initialTab = 'dashboard' }: CrewHubProps) {
  const { code: authCode } = useAuth();
  const { openUserProfile } = useClerk();
  const { setTheme } = useAppTheme();
  const normalizedCode = useMemo(() => normalizeIdentity(authCode), [authCode]);

  return <CrewHubContent initialTab={initialTab} />;
}

// Inner component that has access to modal context
function CrewHubContent({ initialTab = 'dashboard' }: CrewHubProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [servicesTab, setServicesTab] = useState<'my' | 'active' | 'history'>('active');
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

  const { code: authCode, accessStatus, accessTier, accessSource } = useAuth();
  const normalizedCode = useMemo(() => normalizeIdentity(authCode), [authCode]);
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
  const { user } = useUser();
  const { setHubLoading } = useHubLoading();
  const accessGate = useAccessCodeRedemption();
  const handleUploadPhoto = useCallback(async (file: File) => {
    await uploadProfilePhotoAndSyncLogo(user, file, normalizedCode);
  }, [normalizedCode, user]);

  // Centralized entity action handler (replaces handleOrderAction)
  const { handleAction } = useEntityActions();

  // Access modal context
  const modals = useModals();

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
  const userCode = useMemo(() => resolvedUserCode(profile?.cksCode, normalizedCode), [profile?.cksCode, normalizedCode]);

  const {
    data: scopeData,
  } = useHubRoleScope(normalizedCode);
  // Certified services for My Services tab
  const { data: certifiedServicesData, isLoading: certifiedServicesLoading } = useCertifiedServices(normalizedCode, 'crew', 500);

  // Signal when critical data is loaded
  useEffect(() => {
    const hubReady =
      !profileLoading &&
      !dashboardLoading &&
      (!!profile || !!profileError) &&
      (!!dashboard || !!dashboardError);
    if (hubReady) {
      console.log('[CrewHub] Critical data loaded (or errored), signaling ready');
      setHubLoading(false);
    }
  }, [profile, dashboard, profileLoading, dashboardLoading, profileError, dashboardError, setHubLoading]);

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

  const { activities, isLoading: activitiesLoading, error: activitiesError, mutate: mutateActivities } = useFormattedActivities(normalizedCode, { limit: 20 });

  // Handle activity dismissal
  const handleClearActivity = useCallback(async (activityId: string) => {
    try {
      await dismissActivity(activityId);
      mutateActivities();
      console.log('[CrewHub] Activity dismissed:', activityId);
    } catch (error) {
      console.error('[CrewHub] Failed to dismiss activity:', error);
    }
  }, [mutateActivities]);

  // Clear ALL activities for current user
  const handleClearAll = useCallback(async () => {
    try {
      const result = await dismissAllActivities();
      mutateActivities();
      console.log(`[CrewHub] ${result.count} activities dismissed`);
    } catch (error) {
      console.error('[CrewHub] Failed to clear all activities:', error);
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
      console.error('[CrewHub] Failed to request password reset', error);
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
      });
    } else {
      await apiCreateFeedback({
        title: mapped.title,
        message: mapped.description,
        category: mapped.category,
      });
    }
    await mutateReports();
  }, [mutateReports]);

  const assignedTaskItems = useMemo<OverviewSummaryItem[]>(() => {
    const me = (normalizedCode || '').toUpperCase();
    const sos = orders?.serviceOrders || [];
    const dayNames = ['sun','mon','tue','wed','thu','fri','sat'];
    const todayKey = dayNames[new Date().getDay()];
    const items: Array<{ primary: string; secondary?: string; meta?: string }> = [];

    for (const o of sos) {
      const meta: any = o.metadata || {};
      const status = String(meta.serviceStatus || meta.service_status || '').toLowerCase();
      if (status !== 'in_progress') continue;
      const tasks: any[] = Array.isArray(meta.tasks) ? meta.tasks : [];
      const assignedTasks = tasks.filter((t: any) => {
        const assigned = Array.isArray(t?.assignedTo) ? t.assignedTo.map((x: any) => String(x).toUpperCase()) : [];
        if (!assigned.includes(me) || t?.completedAt) return false;
        const days: string[] = Array.isArray(t?.days) ? t.days.map((d: any) => String(d).toLowerCase()) : [];
        const freq = String(t?.frequency || '').toLowerCase();
        return (days.length > 0 && days.includes(todayKey)) || freq === 'daily' || days.length === 0;
      });
      if (assignedTasks.length > 0) {
        items.push({
          primary: o.title || o.serviceId || o.orderId || 'Service',
          secondary: o.serviceId || o.orderId || undefined,
          meta: `${assignedTasks.length} task${assignedTasks.length === 1 ? '' : 's'}`,
        });
      }
    }
    return items;
  }, [orders?.serviceOrders, normalizedCode]);

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
      const serviceId = (order as any).serviceId ?? (order as any).transformedId ?? (order as any).transformed_id ?? null;
      if (!serviceId) {
        return;
      }
      const base: any = {
        serviceId,
        serviceName: order.title ?? serviceId,
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
  }, [serviceOrders, normalizedCode]);

  const dashboardCards = useMemo(() => {
    return crewOverviewCards.map((card) => ({
      ...card,
      onClick: () => {
        const cap = 5;
        const toItems = (rows: OverviewSummaryItem[]) => rows.slice(0, cap);
        let payload: Omit<typeof overviewModal, 'id'> | null = null;

        switch (card.id) {
          case 'active-services':
            payload = {
              title: 'Active Services',
              subtitle: 'Services you are working on',
              items: toItems(activeServicesData.map((svc) => ({
                primary: svc.serviceName ?? svc.serviceId,
                secondary: svc.serviceId,
                meta: svc.status,
              }))),
              emptyMessage: 'No active services yet.',
              accentColor: card.color,
            };
            break;
          case 'my-tasks':
            payload = {
              title: 'My Tasks',
              subtitle: 'Tasks assigned for today',
              items: toItems(assignedTaskItems),
              emptyMessage: 'No tasks assigned right now.',
              accentColor: card.color,
            };
            break;
          case 'timecard':
            payload = {
              title: 'Timecard',
              subtitle: 'Quick snapshot',
              items: [
                { primary: 'Completed Today', secondary: String(dashboard?.completedToday ?? 0) },
                { primary: 'Active Services', secondary: String(dashboard?.activeServices ?? 0) },
              ],
              emptyMessage: 'No timecard data available.',
              accentColor: card.color,
            };
            break;
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
  }, [activeServicesData, assignedTaskItems, dashboard?.completedToday, dashboard?.activeServices, dashboard?.accountStatus, accessStatus, accessTier, accessSource]);

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

  const overviewData = useMemo(() =>
    buildCrewOverviewData({
      dashboard: dashboard ?? null,
      profile: profile ?? null,
      scope: scopeData ?? null,
      certifiedServices: certifiedServicesData,
      activeServicesCount: activeServicesData.length,
      orders: orders?.serviceOrders ?? [],
      viewerId: normalizedCode,
      accessStatus,
      accessTier,
    }),
  [dashboard, profile, scopeData, certifiedServicesData, activeServicesData.length, orders?.serviceOrders, normalizedCode, accessStatus, accessTier]);

  const tabs = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', path: '/crew/dashboard' },
    { id: 'profile', label: 'My Profile', path: '/crew/profile' },
    { id: 'ecosystem', label: 'My Ecosystem', path: '/crew/ecosystem' },
    { id: 'services', label: 'Services', path: '/crew/services' },
    { id: 'orders', label: 'Orders', path: '/crew/orders' },
    { id: 'reports', label: 'Reports', path: '/crew/reports' },
    { id: 'support', label: 'Support', path: '/crew/support' },
  ], []);

  // Cards provided by shared domain widgets

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

  // Column definitions for My Services
  const MY_SERVICES_COLUMNS_BASE = [
    { key: 'serviceId', label: 'SERVICE ID', clickable: true },
    { key: 'serviceName', label: 'SERVICE NAME' },
    { key: 'certifiedAt', label: 'CERTIFIED DATE' },
    { key: 'renewalDate', label: 'RENEWAL DATE' },
  ];

  const myCatalogServices = useMemo(() => {
    return certifiedServicesData.map((service) => ({
      serviceId: service.serviceId,
      serviceName: service.name,
      certifiedAt: service.certifiedAt ? new Date(service.certifiedAt).toLocaleDateString() : '-',
      renewalDate: service.renewalDate ? new Date(service.renewalDate).toLocaleDateString() : '-',
    }));
  }, [certifiedServicesData]);

  const myServicesColumns = MY_SERVICES_COLUMNS_BASE;


  // Don't render anything until we have critical data
  if (!profile || !dashboard) {
    console.log('[CrewHub.tsx] Waiting for critical data...');
    return <ProfileSkeleton />;
  }

  return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
            <MyHubSection
              hubName={(loadUserPreferences(userCode ?? normalizedCode).hubTitle?.trim() || 'Crew Hub')}
              tabs={tabs}
          activeTab={activeTab}
          onTabClick={setActiveTab}
        userId={normalizedCode ?? 'CREW'}
        role="crew"
      />

      <Scrollbar className="hub-content-scroll" style={{ flex: 1, padding: '0 var(--hub-gutter, 24px)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {activeTab === 'dashboard' ? (
            <PageWrapper title="Dashboard" showHeader={false}>
              <PageHeader title="Overview" />
              {dashboardErrorMessage && (
                <div style={{ marginBottom: 12, color: '#dc2626' }}>{dashboardErrorMessage}</div>
              )}
              <OverviewSection cards={dashboardCards} data={overviewData} loading={dashboardLoading} />
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
                hub="crew"
                viewerId={userCode || undefined}
                onClearActivity={handleClearActivity}
                onClearAll={handleClearAll}
                onOpenServiceModal={(serviceId) => modals.openById(serviceId)}
                isLoading={activitiesLoading}
                error={activitiesError}
                onError={(msg) => toast.error(msg)}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <NewsPreview color="#ef4444" items={newsPreviewItems} onViewAll={() => navigate('/news')} />
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
                      // Open service modal (RBAC determines permissions)
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
                userRole="crew"
                userCode={normalizedCode ?? undefined}
                serviceOrders={serviceOrders}
                productOrders={productOrders}
                onCreateServiceOrder={() => navigate('/catalog?mode=services')}
                onCreateProductOrder={() => navigate('/catalog?mode=products')}
                onOrderAction={async (orderId, action) => {
                  if (action === 'View Details') {
                    // Open order modal using ID-first approach (universal modal)
                    modals.openById(orderId);
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
                      const targetOrder = orders?.orders?.find((o: any) => (o.orderId || o.id) === orderId);
                      const serviceId = (targetOrder as any)?.serviceId || (targetOrder as any)?.transformedId;

                      await respondToCrewInvite(orderId, serviceId, act === 'accept');
                      console.log('[crew] responded to crew invite', { orderId, serviceId, accept: act === 'accept' });

                      mutate(`/hub/orders/${normalizedCode}`);
                      mutate(`/hub/activities/${normalizedCode}`);
                    } else {
                      // Regular order actions (cancel, etc.) - use centralized handler
                      const success = await handleAction(orderId, action);
                      if (success) {
                        // Action succeeded - cache already invalidated by handler
                        console.log('[crew] Order action succeeded via centralized handler');
                      }
                    }
                  } catch (err) {
                    console.error('[crew] Failed to apply action:', err);
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
                  category: payload.category || 'Recognition',
                  ...(payload.reportCategory && payload.relatedEntityId && payload.reportReason ? {
                    reportCategory: payload.reportCategory,
                    relatedEntityId: payload.relatedEntityId,
                    reportReason: payload.reportReason,
                    rating: payload.rating,
                    reportArea: payload.reportArea,
                    details: payload.details,
                    ratingBreakdown: payload.ratingBreakdown,
                  } : {
                    message: payload.description
                  }),
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
                onReportClick={(reportId, reportType) => {
                  modals.openById(reportId);
                }}
              />
            </PageWrapper>
          ) : activeTab === 'support' ? (
            <PageWrapper headerSrOnly>
              <SupportSection
                role="crew"
                primaryColor="#ef4444"
                tickets={supportTickets}
                onSubmitTicket={handleSupportSubmit}
              />
            </PageWrapper>
          ) : (
            <PageWrapper title={activeTab} showHeader headerSrOnly>
              <h2>Crew Hub - {activeTab}</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </PageWrapper>
          )}
        </div>
      </Scrollbar>

      </div>
  );
}











