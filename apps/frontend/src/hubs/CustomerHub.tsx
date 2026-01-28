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
import { customerOverviewCards } from '@cks/domain-widgets';
import { Button, DataTable, PageHeader, PageWrapper, Scrollbar, TabSection } from '@cks/ui';
import { useModals } from '../contexts';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import { useAuth } from '@cks/auth';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useSWRConfig } from 'swr';
import { requestPasswordReset } from '../shared/api/account';
import { useNewsFeed } from '../shared/api/news';
import { createReport as apiCreateReport, createFeedback as apiCreateFeedback, acknowledgeItem as apiAcknowledgeItem, resolveReport as apiResolveReport, fetchServicesForReports, fetchProceduresForReports, fetchOrdersForReports } from '../shared/api/hub';
import { useFormattedActivities } from '../shared/activity/useFormattedActivities';
import { ActivityFeed } from '../components/ActivityFeed';
import ProfileSkeleton from '../components/ProfileSkeleton';
// Legacy ActivityModalGateway removed - use universal ModalGateway via modals.openById()
import { useEntityActions } from '../hooks/useEntityActions';
import { resolvedUserCode } from '../shared/utils/userCode';

import MyHubSection from '../components/MyHubSection';
import {
  useHubDashboard,
  useHubOrders,
  useHubProfile,
  useHubReports,
  useHubRoleScope,
  type HubOrderItem,
} from '../shared/api/hub';
import { useCertifiedServices } from '../hooks/useCertifiedServices';

import { buildEcosystemTree, DEFAULT_ROLE_COLOR_MAP } from '../shared/utils/ecosystem';
import { buildCustomerOverviewData } from '../shared/overview/builders';
import { useHubLoading } from '../contexts/HubLoadingContext';
import { loadUserPreferences, saveUserPreferences } from '../shared/preferences';
import { dismissActivity, dismissAllActivities } from '../shared/api/directory';
import { useAccessCodeRedemption } from '../hooks/useAccessCodeRedemption';
import OverviewSummaryModal, { type OverviewSummaryItem } from '../components/overview/OverviewSummaryModal';
import { buildSupportTickets, mapSupportIssuePayload } from '../shared/support/supportTickets';

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


// Main wrapper component that sets up ModalProvider
export default function CustomerHub({ initialTab = 'dashboard' }: CustomerHubProps) {
  const { code: authCode } = useAuth();
  const { openUserProfile } = useClerk();
  const { setTheme } = useAppTheme();
  const normalizedCode = useMemo(() => normalizeIdentity(authCode), [authCode]);

  return <CustomerHubContent initialTab={initialTab} />;
}

// Inner component that has access to modal context
function CustomerHubContent({ initialTab = 'dashboard' }: CustomerHubProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [servicesTab, setServicesTab] = useState<'my' | 'history'>('my');
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
  // Legacy modal state removed; universal ModalGateway handles all modals
  const { code: authCode, accessStatus, accessTier, accessSource } = useAuth();
  const { user } = useUser();
  const normalizedCode = useMemo(() => normalizeIdentity(authCode), [authCode]);
  const { setHubLoading } = useHubLoading();
  const accessGate = useAccessCodeRedemption();
  const handleUploadPhoto = useCallback(async (file: File) => { if (!user) { toast.error('User not authenticated'); return; } try { await user.setProfileImage({ file }); toast.success('Profile photo updated'); } catch (e: any) { console.error('photo upload failed', e); toast.error(e?.message || 'Failed to update photo'); } }, [user]);

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
    mutate: mutateReports,
  } = useHubReports(normalizedCode);

  const userCode = useMemo(() => resolvedUserCode(profile?.cksCode, normalizedCode), [profile?.cksCode, normalizedCode]);
  const supportTickets = useMemo(() => buildSupportTickets(reportsData), [reportsData]);
  

  // Access modal context
  const modals = useModals();

  const {
    data: scopeData,
  } = useHubRoleScope(normalizedCode);
  const { data: certifiedServicesData, isLoading: certifiedServicesLoading } = useCertifiedServices(normalizedCode, 'customer', 500);
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
  const [notice, setNotice] = useState<string | null>(null);

  // Signal when critical data is loaded (but only if not highlighting an order)
  useEffect(() => {
    const hubReady =
      !profileLoading &&
      !dashboardLoading &&
      (!!profile || !!profileError) &&
      (!!dashboard || !!dashboardError);
    if (hubReady) {
      console.log('[CustomerHub] Critical data loaded (or errored), signaling ready');
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
      console.log('[CustomerHub] Activity dismissed:', activityId);
    } catch (error) {
      console.error('[CustomerHub] Failed to dismiss activity:', error);
    }
  }, [mutateActivities]);

  // Clear ALL activities for current user
  const handleClearAll = useCallback(async () => {
    try {
      const result = await dismissAllActivities();
      mutateActivities();
      console.log(`[CustomerHub] ${result.count} activities dismissed`);
    } catch (error) {
      console.error('[CustomerHub] Failed to clear all activities:', error);
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
      console.error('[CustomerHub] Failed to request password reset', error);
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
        customerId: normalizedCode ?? undefined,
      });
    } else {
      await apiCreateFeedback({
        title: mapped.title,
        message: mapped.description,
        category: mapped.category,
        customerId: normalizedCode ?? undefined,
      });
    }
    await mutateReports();
  }, [mutateReports, normalizedCode]);

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

      const serviceId = (order as any).serviceId ?? (order as any).transformedId ?? (order as any).transformed_id ?? null;
      if (!serviceId) {
        return;
      }
      const base = {
        serviceId,
        serviceName: order.title ?? serviceId,
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

  const overviewData = useMemo(() =>
    buildCustomerOverviewData({
      dashboard: dashboard ?? null,
      profile: profile ?? null,
      scope: scopeData ?? null,
      certifiedServices: certifiedServicesData,
      activeServicesCount: myServicesData.length,
      accessStatus,
      accessTier,
    }),
  [dashboard, profile, scopeData, certifiedServicesData, myServicesData.length, accessStatus, accessTier]);

  const overviewCards = useMemo(() => {
    return customerOverviewCards.map((card) => ({
      ...card,
      onClick: () => {
        const cap = 5;
        const toItems = (rows: OverviewSummaryItem[]) => rows.slice(0, cap);
        let payload: Omit<typeof overviewModal, 'id'> | null = null;

        switch (card.id) {
          case 'active-services':
            payload = {
              title: 'Active Services',
              subtitle: 'Services currently active',
              items: toItems(myServicesData.map((svc) => ({
                primary: svc.serviceName ?? svc.serviceId,
                secondary: svc.serviceId,
                meta: svc.status,
              }))),
              emptyMessage: 'No active services yet.',
              accentColor: card.color,
            };
            break;
          case 'my-centers':
            payload = {
              title: 'My Centers',
              subtitle: 'Centers tied to your account',
              items: toItems((scopeData?.relationships?.centers || []).map((center) => ({
                primary: center.name || center.id,
                secondary: center.id,
                meta: center.mainContact || undefined,
              }))),
              emptyMessage: 'No centers found.',
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
  }, [myServicesData, scopeData?.relationships?.centers, orders?.orders, accessStatus, accessTier, accessSource, dashboard?.accountStatus]);

  const tabs = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', path: '/customer/dashboard' },
    { id: 'profile', label: 'My Profile', path: '/customer/profile' },
    { id: 'ecosystem', label: 'My Ecosystem', path: '/customer/ecosystem' },
    { id: 'services', label: 'Services', path: '/customer/services' },
    { id: 'orders', label: 'Orders', path: '/customer/orders' },
    { id: 'reports', label: 'Reports', path: '/customer/reports' },
    { id: 'support', label: 'Support', path: '/customer/support' },
  ], []);

  // Cards provided by shared domain widgets

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
    console.log('[CustomerHub.tsx] Waiting for critical data...');
    return <ProfileSkeleton />;
  }

  return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
      <MyHubSection
        hubName={(loadUserPreferences(userCode ?? normalizedCode).hubTitle?.trim() || 'Customer Hub')}
        tabs={tabs}
          activeTab={activeTab}
          onTabClick={setActiveTab}
        userId={normalizedCode ?? 'CUSTOMER'}
        role="customer"
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
                hub="customer"
                viewerId={userCode || undefined}
                onClearActivity={handleClearActivity}
                onClearAll={handleClearAll}
                onOpenServiceModal={(serviceId) => modals.openById(serviceId)}
                isLoading={activitiesLoading}
                error={activitiesError}
                onError={(msg) => toast.error(msg)}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <NewsPreview color="#eab308" items={newsPreviewItems} onViewAll={() => navigate('/news')} />
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
                      // Actions column removed – rows open modal on click
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
                onOrderAction={async (orderId, action) => {
                  if (action === 'View Details' || action === 'View') {
                    modals.openById(orderId);
                    return;
                  }
                  await handleAction(orderId, action);
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
                        reportArea: payload.reportArea,
                        details: payload.details,
                        priority: payload.priority,
                        customerId: normalizedCode ?? undefined,
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
                onReportClick={(reportId) => {
                  modals.openById(reportId);
                }}
              />
            </PageWrapper>
          ) : activeTab === 'support' ? (
            <PageWrapper headerSrOnly>
              <SupportSection
                role="customer"
                primaryColor="#eab308"
                tickets={supportTickets}
                onSubmitTicket={handleSupportSubmit}
              />
            </PageWrapper>
          ) : (
            <PageWrapper title={activeTab} showHeader headerSrOnly>
              <h2>Customer Hub - {activeTab}</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </PageWrapper>
          )}
        </div>
      </Scrollbar>

      {/* Legacy order modals removed; all order interactions go through ModalGateway (modals.openById) */}


    </div>
  );
}















