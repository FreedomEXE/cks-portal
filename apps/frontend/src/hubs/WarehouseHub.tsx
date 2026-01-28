/*-----------------------------------------------
  Property of CKS  © 2025
-----------------------------------------------*/
/**
 * File: WarehouseHub.tsx
 *
 * Description:
 * Warehouse Hub orchestrator component wired to real backend data.
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useHubLoading } from '../contexts/HubLoadingContext';
import { useClerk, useUser } from '@clerk/clerk-react';
import { loadUserPreferences, saveUserPreferences } from '../shared/preferences';
import { requestPasswordReset } from '../shared/api/account';
import { useNewsFeed } from '../shared/api/news';
import { dismissActivity, dismissAllActivities } from '../shared/api/directory';
import { applyServiceAction, type OrderActionType } from '../shared/api/hub';
import {
  MemosPreview,
  NewsPreview,
  OrdersSection,
  OverviewSection,
  ProfileInfoCard,
  RecentActivity,
  ReportsSection,
  SupportSection,
  type Activity,
} from '@cks/domain-widgets';
import { warehouseOverviewCards } from '@cks/domain-widgets';
import { Button, DataTable, PageHeader, PageWrapper, Scrollbar, TabSection } from '@cks/ui';
import { useModals } from '../contexts';
import { useAuth } from '@cks/auth';
import { useSWRConfig } from 'swr';
import { getAllowedActions, getActionLabel } from '@cks/policies';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import { useServices as useDirectoryServices } from '../shared/api/directory';
import { useCatalogItems } from '../shared/api/catalog';
import { useCertifiedServices } from '../hooks/useCertifiedServices';
import { buildWarehouseOverviewData } from '../shared/overview/builders';
import { resolvedUserCode } from '../shared/utils/userCode';
import { useAccessCodeRedemption } from '../hooks/useAccessCodeRedemption';
import OverviewDetailPanel, { type OverviewDetailItem } from '../components/overview/OverviewDetailPanel';
import { buildSupportTickets, mapSupportIssuePayload } from '../shared/support/supportTickets';

import MyHubSection from '../components/MyHubSection';
import {
  useHubDashboard,
  useHubOrders,
  useHubProfile,
  useHubReports,
  useHubRoleScope,
  useHubInventory,
  type HubOrderItem,
  type HubInventoryItem,
} from '../shared/api/hub';
import { useFormattedActivities } from '../shared/activity/useFormattedActivities';
import { ActivityFeed } from '../components/ActivityFeed';
import ProfileSkeleton from '../components/ProfileSkeleton';
// Legacy ActivityModalGateway removed - use universal ModalGateway via modals.openById()
import { useEntityActions } from '../hooks/useEntityActions';
import { createFeedback as apiCreateFeedback, acknowledgeItem as apiAcknowledgeItem, resolveReport as apiResolveReport, fetchServicesForReports, fetchProceduresForReports, fetchOrdersForReports } from '../shared/api/hub';

interface WarehouseHubProps {
  initialTab?: string;
}

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
  // Normalize both spaces and underscores to hyphens for consistent matching
  return value.trim().toLowerCase().replace(/[\s_]+/g, '-');
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

// Activities are now sourced from the backend via useFormattedActivities

// Main wrapper component that sets up ModalProvider
export default function WarehouseHub({ initialTab = 'dashboard' }: WarehouseHubProps) {
  const { code: authCode } = useAuth();
  const normalizedCode = useMemo(() => normalizeIdentity(authCode), [authCode]);

  return <WarehouseHubContent initialTab={initialTab} />;
}

// Inner component that has access to modal context
function WarehouseHubContent({ initialTab = 'dashboard' }: WarehouseHubProps) {
  const navigate = useNavigate();
  // local UI state (tabs/search)
  const [activeTab, setActiveTab] = useState(initialTab);
  const [servicesTab, setServicesTab] = useState<'my' | 'active' | 'history'>('active');
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [deliveriesTab, setDeliveriesTab] = useState<'pending' | 'completed'>('pending');
  const [deliveriesSearchQuery, setDeliveriesSearchQuery] = useState('');
  const [inventoryTab, setInventoryTab] = useState<'active' | 'archive'>('active');
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState<string>('');
  const [overviewFocus, setOverviewFocus] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ orderId: string; action: OrderActionType } | null>(null);

  // identity + helpers
  const { code: authCode, accessStatus, accessTier, accessSource } = useAuth();
  const { user } = useUser();
  const normalizedCode = useMemo(() => normalizeIdentity(authCode), [authCode]);
  const { setHubLoading } = useHubLoading();
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
  const { setTheme } = useAppTheme();
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
    mutate: refreshOrders,
  } = useHubOrders(normalizedCode);
  const { data: reportsData, isLoading: reportsLoading, mutate: mutateReports } = useHubReports(normalizedCode);
  const supportTickets = useMemo(() => buildSupportTickets(reportsData), [reportsData]);

  // Resolve final display/user code after profile is available
  const userCode = useMemo(() => resolvedUserCode(profile?.cksCode, normalizedCode), [profile?.cksCode, normalizedCode]);

  // Access modal context
  const modals = useModals();

  const {
    data: inventory,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useHubInventory(normalizedCode);
  const {
    data: scopeData,
  } = useHubRoleScope(normalizedCode);
  // Certified services for My Services tab (filtered by certifications)
  const { data: certifiedServicesData, isLoading: certifiedServicesLoading } = useCertifiedServices(normalizedCode, 'warehouse', 500);

  // Signal to App.tsx when critical data is loaded (but only if not highlighting an order)
  useEffect(() => {
    const hasCriticalData = !!profile && !!dashboard;

    if (hasCriticalData) {
      console.log('[WarehouseHub] Critical data loaded, signaling hub is ready (no highlight)');
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
    const mapped = orders.productOrders.map((order) => ({
      ...order,
      title: order.title ?? order.orderId,
      // Keep both: canonical status for deliveries filtering, viewer status for Orders section display
      canonicalStatus: order.status,
      status: normalizeOrderStatus(order.viewerStatus ?? order.status),
    }));
    console.log('[WAREHOUSE] Product orders after mapping:', mapped);
    return mapped;
  }, [orders]);

  // Find selected order from hub data for transform-first approach
  
  // Use centralized order details hook (transform-first)

  const { activities, isLoading: activitiesLoading, error: activitiesError, mutate: mutateActivities } = useFormattedActivities(normalizedCode, { limit: 20 });

  // Handle activity dismissal
  const handleClearActivity = useCallback(async (activityId: string) => {
    try {
      await dismissActivity(activityId);
      mutateActivities();
      console.log('[WarehouseHub] Activity dismissed:', activityId);
    } catch (error) {
      console.error('[WarehouseHub] Failed to dismiss activity:', error);
    }
  }, [mutateActivities]);

  // Clear ALL activities for current user
  const handleClearAll = useCallback(async () => {
    try {
      const result = await dismissAllActivities();
      mutateActivities();
      console.log(`[WarehouseHub] ${result.count} activities dismissed`);
    } catch (error) {
      console.error('[WarehouseHub] Failed to clear all activities:', error);
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
      console.error('[WarehouseHub] Failed to request password reset', error);
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

  const { pendingDeliveries, completedDeliveries } = useMemo(() => {
    const pending: Array<{
      deliveryId: string;
      itemName: string;
      destination: string;
      status: string;
      scheduledDate: string;
      order: HubOrderItem;
      canonicalStatus: string;
    }> = [];
    const completed: Array<{
      deliveryId: string;
      itemName: string;
      destination: string;
      status: string;
      scheduledDate: string;
      completedDate: string;
      order: HubOrderItem;
    }> = [];

    productOrders.forEach((order) => {
      // Use canonicalStatus from backend for filtering (delivered, awaiting_delivery, etc)
      const canonical = (order as any).canonicalStatus ?? order.status;
      const normalizedStatus = normalizeStatusValue(canonical);
      console.log(`[DELIVERIES] Processing order ${order.orderId}: canonical="${canonical}", normalized="${normalizedStatus}"`);

      const base = {
        deliveryId: order.orderId,
        itemName: order.title ?? order.orderId,
        destination: order.destination ?? 'Warehouse',
        status: formatStatusLabel(canonical),
        scheduledDate: formatDisplayDate(order.requestedDate),
        completedDate: formatDisplayDate(order.deliveryDate ?? order.expectedDate),
        order: order,
        canonicalStatus: canonical,
      };

      if (normalizedStatus === 'delivered') {
        console.log(`[DELIVERIES] → Adding to COMPLETED deliveries`);
        completed.push(base);
      } else if (normalizedStatus === 'awaiting-delivery') {
        console.log(`[DELIVERIES] → Adding to PENDING deliveries`);
        pending.push(base);
      } else {
        console.log(`[DELIVERIES] → NOT adding to deliveries (status: ${normalizedStatus})`);
      }
    });

    console.log(`[DELIVERIES] Final counts: ${pending.length} pending, ${completed.length} completed`);
    return { pendingDeliveries: pending, completedDeliveries: completed };
  }, [productOrders]);

  // Get inventory data from API
  const activeInventoryData = useMemo<HubInventoryItem[]>(() => {
    if (!inventory?.activeItems) {
      return [];
    }
    return inventory.activeItems;
  }, [inventory]);

  const archivedInventoryData = useMemo<HubInventoryItem[]>(() => {
    if (!inventory?.archivedItems) {
      return [];
    }
    return inventory.archivedItems;
  }, [inventory]);

  // Filter inventory data based on type filter
  const filteredActiveInventoryData = useMemo(() => {
    let filtered = activeInventoryData;

    if (inventoryFilter && inventoryFilter !== 'All Types') {
      if (inventoryFilter === 'Low Stock') {
        filtered = filtered.filter(item => item.isLow);
      } else {
        filtered = filtered.filter(item => item.type === inventoryFilter);
      }
    }

    if (inventorySearchQuery) {
      const query = inventorySearchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.productId.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [inventoryFilter, inventorySearchQuery, activeInventoryData]);

  const filteredArchivedInventoryData = useMemo(() => {
    let filtered = archivedInventoryData;

    if (inventoryFilter && inventoryFilter !== 'All Types') {
      if (inventoryFilter === 'Low Stock') {
        filtered = filtered.filter(item => item.isLow);
      } else {
        filtered = filtered.filter(item => item.type === inventoryFilter);
      }
    }

    if (inventorySearchQuery) {
      const query = inventorySearchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.productId.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [inventoryFilter, inventorySearchQuery, archivedInventoryData]);

  const { activeServicesData, serviceHistoryData } = useMemo(() => {
    const active: Array<{
      serviceId: string;
      serviceName: string;
      type: string;
      status: string;
      startDate: string;
      onStart?: () => void;
      onComplete?: () => void;
      onCancel?: () => void;
    }> = [];
    const history: Array<{ serviceId: string; serviceName: string; type: string; status: string; startDate: string; endDate: string }>
      = [];

    serviceOrders.forEach((order) => {
      // Only include transformed services (orders that have been converted to services)
      if (!(order as any).serviceId && !(order as any).transformedId) {
        return;
      }

      const meta: any = (order as any).metadata || {};
      const svcStatus = (meta?.serviceStatus || '').toLowerCase().replace(/\s+/g, '_');
      const normalizedStatus = normalizeStatusValue(order.status);
      const rawServiceId = (order as any).serviceId ?? (order as any).transformedId;

      const onStart = async () => {
        try {
          const notes = window.prompt('Add notes for starting this service (optional):');
          if (notes === null) return; // User cancelled
          await applyServiceAction(rawServiceId, 'start', notes || undefined);
          refreshOrders();
        } catch (err) {
          console.error('[warehouse] failed to start service', err);
          alert(err instanceof Error ? err.message : 'Failed to start service');
        }
      };

      const onComplete = async () => {
        try {
          const notes = window.prompt('Add notes for completing this service (describe work performed):');
          if (notes === null) return; // User cancelled
          await applyServiceAction(rawServiceId, 'complete', notes || undefined);
          refreshOrders();
        } catch (err) {
          console.error('[warehouse] failed to complete service', err);
          alert(err instanceof Error ? err.message : 'Failed to complete service');
        }
      };

      const onCancel = async () => {
        try {
          const reason = window.prompt('Please provide a reason for cancellation:');
          if (!reason) return;
          await applyServiceAction(rawServiceId, 'cancel');
          refreshOrders();
        } catch (err) {
          console.error('[warehouse] failed to cancel service', err);
          alert(err instanceof Error ? err.message : 'Failed to cancel service');
        }
      };

      // Determine service type from metadata
      const serviceType = meta.serviceType === 'recurring' ? 'Ongoing' : 'One-Time';

      // Use serviceStatus for display if available, otherwise use order status
      const displayStatus = svcStatus
        ? formatStatusLabel(svcStatus)
        : formatStatusLabel(order.status);

      // Only show start date if service has actually been started
      const actualStartDate = meta.serviceActualStartTime || meta.actualStartDate || null;
      const actualEndDate = meta.serviceCompletedAt || meta.serviceCancelledAt || null;

      const base = {
        serviceId: rawServiceId,
        serviceName: order.title ?? rawServiceId,
        type: serviceType,
        status: displayStatus,
        startDate: svcStatus === 'created' ? 'Pending' : (actualStartDate ? formatDisplayDate(actualStartDate) : '—'),
        endDate: actualEndDate ? formatDisplayDate(actualEndDate) : formatDisplayDate(order.expectedDate),
        onStart,
        onComplete,
        onCancel,
      };

      // Use serviceStatus from metadata to determine active vs history
      if (svcStatus) {
        // If serviceStatus is set, use it: created/in_progress = active, completed/cancelled = history
        if (svcStatus === 'completed' || svcStatus === 'cancelled') {
          const { onStart: _, onComplete: __, onCancel: ___, ...historyBase } = base;
          history.push(historyBase);
        } else {
          // created or in_progress
          active.push(base);
        }
      } else {
        // Fallback to order status
        if (HISTORY_STATUSES.has(normalizedStatus)) {
          const { onStart: _, onComplete: __, onCancel: ___, ...historyBase } = base;
          history.push(historyBase);
        } else {
          active.push(base);
        }
      }
    });

    return { activeServicesData: active, serviceHistoryData: history };
  }, [serviceOrders, refreshOrders]);

  const overviewData = useMemo(() =>
    buildWarehouseOverviewData({
      dashboard: dashboard ?? null,
      profile: profile ?? null,
      scope: scopeData ?? null,
      certifiedServices: certifiedServicesData,
      activeServicesCount: activeServicesData.length,
      inventory: inventory ?? null,
      accessStatus,
      accessTier,
    }),
  [dashboard, profile, scopeData, certifiedServicesData, activeServicesData.length, inventory, accessStatus, accessTier]);

  const overviewCards = useMemo(() => {
    return warehouseOverviewCards.map((card) => {
      switch (card.id) {
        case 'active-services':
        case 'inventory':
        case 'low-stock':
        case 'pending-orders':
        case 'account-status':
          return {
            ...card,
            onClick: () => setOverviewFocus((prev) => (prev === card.id ? null : card.id)),
          };
        default:
          return {
            ...card,
            onClick: () => setOverviewFocus((prev) => (prev === card.id ? null : card.id)),
          };
      }
    });
  }, []);

  const overviewDetail = useMemo(() => {
    if (!overviewFocus) return null;
    const cap = 5;
    const toItems = (rows: Array<{ primary: string; secondary?: string; meta?: string }>) =>
      rows.slice(0, cap).map((row) => ({ primary: row.primary, secondary: row.secondary, meta: row.meta }));

    switch (overviewFocus) {
      case 'active-services':
        return {
          title: 'Active Services',
          subtitle: 'Services currently managed',
          items: toItems(activeServicesData.map((svc) => ({
            primary: svc.serviceName ?? svc.serviceId,
            secondary: svc.serviceId,
            meta: svc.status,
          }))),
          emptyMessage: 'No active services yet.',
        };
      case 'inventory':
        return {
          title: 'Inventory',
          subtitle: 'Recent inventory items',
          items: toItems(activeInventoryData.map((item) => ({
            primary: item.name || item.productId,
            secondary: item.productId,
            meta: `On hand: ${item.onHand}`,
          }))),
          emptyMessage: 'No inventory items found.',
        };
      case 'low-stock': {
        const lowStock = activeInventoryData.filter((item) => item.isLow);
        return {
          title: 'Low Stock',
          subtitle: 'Items below minimum stock',
          items: toItems(lowStock.map((item) => ({
            primary: item.name || item.productId,
            secondary: item.productId,
            meta: `On hand: ${item.onHand}`,
          }))),
          emptyMessage: 'No low-stock items right now.',
        };
      }
      case 'pending-orders': {
        const pending = (orders?.orders || []).filter((order) => String(order.status || '').toLowerCase().includes('pending'));
        return {
          title: 'Pending Orders',
          subtitle: 'Orders awaiting action',
          items: toItems(pending.map((order) => ({
            primary: order.orderId || order.id || 'Order',
            secondary: order.title || undefined,
            meta: formatStatusLabel(order.status || 'pending'),
          }))),
          emptyMessage: 'No pending orders.',
        };
      }
      case 'account-status':
        return {
          title: 'Account Status',
          subtitle: 'Access and tier overview',
          items: [
            { primary: 'Access Status', secondary: accessStatus || dashboard?.accountStatus || '—' },
            { primary: 'Access Tier', secondary: accessTier || '—' },
            { primary: 'Access Source', secondary: accessSource || '—' },
          ],
          emptyMessage: 'No account status available.',
        };
      default:
        return null;
    }
  }, [overviewFocus, activeServicesData, activeInventoryData, orders?.orders, accessStatus, accessTier, accessSource, dashboard?.accountStatus]);

  // Column definitions for My Services
  const MY_SERVICES_COLUMNS_BASE = [
    { key: 'serviceId', label: 'SERVICE ID', clickable: true },
    { key: 'serviceName', label: 'SERVICE NAME' },
    { key: 'certifiedAt', label: 'CERTIFIED DATE' },
    { key: 'renewalDate', label: 'RENEWAL DATE' },
  ];

  const myCertifiedServices = useMemo(() => {
    return certifiedServicesData.map((service) => ({
      serviceId: service.serviceId,
      serviceName: service.name,
      certifiedAt: service.certifiedAt ? new Date(service.certifiedAt).toLocaleDateString() : '-',
      renewalDate: service.renewalDate ? new Date(service.renewalDate).toLocaleDateString() : '-',
    }));
  }, [certifiedServicesData]);

  const myServicesColumns = MY_SERVICES_COLUMNS_BASE;

  const tabs = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', path: '/warehouse/dashboard' },
    { id: 'profile', label: 'My Profile', path: '/warehouse/profile' },
    { id: 'inventory', label: 'Inventory', path: '/warehouse/inventory' },
    { id: 'services', label: 'Services', path: '/warehouse/services' },
    { id: 'deliveries', label: 'Deliveries', path: '/warehouse/deliveries' },
    { id: 'orders', label: 'Orders', path: '/warehouse/orders' },
    { id: 'reports', label: 'Reports', path: '/warehouse/reports' },
    { id: 'support', label: 'Support', path: '/warehouse/support' },
  ], []);

  // Cards provided by shared domain widgets

  const handleOrderAction = async (orderId: string, actionLabel: string, providedReason?: string) => {
    if (actionLabel === 'View Details') {
      setSelectedOrderId(orderId);
      return;
    }
    const actionId = actionLabel.toLowerCase().replace(/\s+/g, '-') as OrderActionType;
    if (pendingAction?.orderId === orderId && pendingAction.action === actionId) {
      return;
    }
    setPendingAction({ orderId, action: actionId });
    try {
      await handleAction(orderId, actionLabel);
    } finally {
      setPendingAction(null);
    }
  };
  const profileCardData = useMemo(() => ({
    name: profile?.name ?? '-',
    warehouseId: normalizedCode ?? '-',
    address: profile?.address ?? '-',
    phone: profile?.phone ?? '-',
    email: profile?.email ?? '-',
    // Prefer warehouse-specific mainContact; fallback to assigned manager name
    mainContact: profile?.mainContact ?? '-',
    startDate: formatDisplayDate(profile?.createdAt ?? null),
  }), [profile, normalizedCode]);

  const profileLoadMessage = profileLoading && !profile ? 'Loading profile details…' : null;
  const ordersLoadMessage = ordersLoading && serviceOrders.length === 0 && productOrders.length === 0
    ? 'Loading latest orders…'
    : null;

  const profileErrorMessage = profileError ? 'Unable to load profile details. Showing cached values if available.' : null;
  const dashboardErrorMessage = dashboardError ? 'Unable to load dashboard metrics. Showing cached values if available.' : null;
  const ordersErrorMessage = ordersError ? 'Unable to load order data. Showing cached values if available.' : null;
  const inventoryErrorMessage = inventoryError ? 'Unable to load inventory data. Showing cached values if available.' : null;
  const inventoryLoadMessage = inventoryLoading && activeInventoryData.length === 0 && archivedInventoryData.length === 0
    ? 'Loading inventory data…'
    : null;

  // Don't render anything until we have critical data
  if (!profile || !dashboard) {
    console.log('[WarehouseHub.tsx] Waiting for critical data...');
    return <ProfileSkeleton />;
  }

  const { openUserProfile } = useClerk();

  return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
        <MyHubSection
          hubName={(loadUserPreferences(normalizedCode ?? null).hubTitle?.trim() || 'Warehouse Hub')}
          tabs={tabs}
        activeTab={activeTab}
        onTabClick={setActiveTab}
        userId={normalizedCode ?? 'WAREHOUSE'}
        role="warehouse"
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
              {overviewDetail && (
                <OverviewDetailPanel
                  title={overviewDetail.title}
                  subtitle={overviewDetail.subtitle}
                  items={overviewDetail.items as OverviewDetailItem[]}
                  emptyMessage={overviewDetail.emptyMessage}
                  onClose={() => setOverviewFocus(null)}
                />
              )}

              <PageHeader title="Recent Activity" />
              <ActivityFeed
                activities={activities}
                hub="warehouse"
                viewerId={(userCode || normalizedCode || undefined) as string | undefined}
                onClearActivity={handleClearActivity}
                onClearAll={handleClearAll}
                onOpenServiceModal={(serviceId) => modals.openById(serviceId)}
                isLoading={activitiesLoading}
                error={activitiesError}
                onError={(msg) => toast.error(msg)}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <NewsPreview color="#8b5cf6" items={newsPreviewItems} onViewAll={() => navigate('/news')} />
                <MemosPreview color="#8b5cf6" onViewAll={() => navigate('/memos')} />
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
                role="warehouse"
                profileData={profileCardData}
                primaryColor="#8b5cf6"
                onUploadPhoto={handleUploadPhoto}
                onOpenAccountSecurity={() => openUserProfile?.()}
                onRequestPasswordReset={handlePasswordReset}
                passwordResetAvailable={Boolean(user?.passwordEnabled)}
                userPreferences={loadUserPreferences(normalizedCode ?? null)}
                onSaveUserPreferences={(prefs) => saveUserPreferences(normalizedCode ?? null, prefs)}
                accessStatus={accessStatus}
                accessTier={accessTier}
                accessSource={accessSource}
                onRedeemAccessCode={accessGate.redeem}
                onContactManager={() => undefined}
                onScheduleMeeting={() => undefined}
              />
            </PageWrapper>
          ) : activeTab === 'inventory' ? (
            <PageWrapper headerSrOnly>
              {inventoryLoadMessage && (
                <div style={{ marginBottom: 12, color: '#475569' }}>{inventoryLoadMessage}</div>
              )}
              {inventoryErrorMessage && (
                <div style={{ marginBottom: 12, color: '#dc2626' }}>{inventoryErrorMessage}</div>
              )}
              <TabSection
                tabs={[
                  { id: 'active', label: 'Product Inventory', count: filteredActiveInventoryData.length },
                  { id: 'archive', label: 'Archive', count: filteredArchivedInventoryData.length }
                ]}
                activeTab={inventoryTab}
                onTabChange={(tab) => setInventoryTab(tab as 'active' | 'archive')}
                description={inventoryTab === 'active' ? 'Current product inventory with stock levels' : 'Archived products no longer in active inventory'}
                searchPlaceholder={
                  inventoryTab === 'active' ? 'Search by Product ID or name' :
                  'Search archived products'
                }
                onSearch={setInventorySearchQuery}
                filterOptions={{
                  options: ['Low Stock', 'Equipment', 'Products', 'Materials'],
                  placeholder: 'All Types',
                  onFilter: setInventoryFilter
                }}
                primaryColor="#8b5cf6"
              >

                {inventoryTab === 'active' && (
                  <DataTable
                    columns={[
                      { key: 'productId', label: 'PRODUCT ID', clickable: true },
                      { key: 'name', label: 'NAME' },
                      { key: 'type', label: 'TYPE' },
                    { key: 'onHand', label: 'ON HAND' },
                    { key: 'min', label: 'MIN' },
                    { key: 'location', label: 'LOCATION' },
                    {
                      key: 'isLow',
                      label: 'LOW?',
                      render: (value: boolean) => (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          backgroundColor: value ? '#fee2e2' : '#dcfce7',
                          color: value ? '#dc2626' : '#16a34a'
                        }}>
                          {value ? 'Yes' : 'No'}
                        </span>
                      )
                    }
                    ]}
                    data={filteredActiveInventoryData}
                    showSearch={false}
                    maxItems={10}
                    onRowClick={(row) => {
                      const productId = row.productId || row.id;
                      if (productId) {
                        modals.openEntityModal('product', productId);
                      }
                    }}
                  />
                )}

                {inventoryTab === 'archive' && (
                  <DataTable
                    columns={[
                      { key: 'productId', label: 'PRODUCT ID', clickable: true },
                      { key: 'name', label: 'NAME' },
                    { key: 'type', label: 'TYPE' },
                    { key: 'archivedDate', label: 'ARCHIVED DATE' },
                    { key: 'reason', label: 'REASON' }
                    ]}
                    data={filteredArchivedInventoryData}
                    showSearch={false}
                    maxItems={10}
                    onRowClick={(row) => {
                      const productId = row.productId || row.id;
                      if (productId) {
                        modals.openEntityModal('product', productId, { state: 'archived' });
                      }
                    }}
                  />
                )}
              </TabSection>
            </PageWrapper>
          ) : activeTab === 'deliveries' ? (
            <PageWrapper headerSrOnly>
              {ordersLoadMessage && (
                <div style={{ marginBottom: 12, color: '#475569' }}>{ordersLoadMessage}</div>
              )}
              {ordersErrorMessage && (
                <div style={{ marginBottom: 12, color: '#dc2626' }}>{ordersErrorMessage}</div>
              )}
              <TabSection
                tabs={[
                  { id: 'pending', label: 'Pending Deliveries', count: pendingDeliveries.length },
                  { id: 'completed', label: 'Completed Deliveries', count: completedDeliveries.length },
                ]}
                activeTab={deliveriesTab}
                onTabChange={(tab) => setDeliveriesTab(tab as 'pending' | 'completed')}
                description={
                  deliveriesTab === 'pending'
                    ? 'Deliveries pending or in transit'
                    : 'Completed deliveries archive'
                }
                searchPlaceholder="Search deliveries"
                onSearch={setDeliveriesSearchQuery}
                primaryColor="#8b5cf6"
              >
                {deliveriesTab === 'pending' && (
                  <DataTable
                    columns={[
                      { key: 'deliveryId', label: 'DELIVERY ID', clickable: true },
                      { key: 'itemName', label: 'ITEM' },
                      { key: 'destination', label: 'DESTINATION' },
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
                      { key: 'scheduledDate', label: 'SCHEDULED DATE' },
                    ]}
                    data={pendingDeliveries.filter((row) => {
                      if (!deliveriesSearchQuery) {
                        return true;
                      }
                      const query = deliveriesSearchQuery.toLowerCase();
                      return (
                        row.deliveryId.toLowerCase().includes(query) ||
                        row.itemName.toLowerCase().includes(query) ||
                        row.destination.toLowerCase().includes(query)
                      );
                    })}
                    showSearch={false}
                    maxItems={10}
                    onRowClick={(row) => {
                      // ID-first universal modal: open by order ID
                      const orderId = row?.order?.orderId || row?.deliveryId;
                      if (orderId) {
                        modals.openById(orderId);
                      }
                    }}
                  />
                )}

                {deliveriesTab === 'completed' && (
                  <DataTable
                    columns={[
                      { key: 'deliveryId', label: 'DELIVERY ID', clickable: true },
                      { key: 'itemName', label: 'ITEM' },
                      { key: 'destination', label: 'DESTINATION' },
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
                      { key: 'scheduledDate', label: 'SCHEDULED DATE' },
                      { key: 'completedDate', label: 'COMPLETED DATE' },
                    ]}
                    data={completedDeliveries.filter((row) => {
                      if (!deliveriesSearchQuery) {
                        return true;
                      }
                      const query = deliveriesSearchQuery.toLowerCase();
                      return (
                        row.deliveryId.toLowerCase().includes(query) ||
                        row.itemName.toLowerCase().includes(query) ||
                        row.destination.toLowerCase().includes(query)
                      );
                    })}
                    showSearch={false}
                    maxItems={10}
                    onRowClick={(row) => {
                      const orderId = row?.order?.orderId || row?.deliveryId;
                      if (orderId) {
                        modals.openById(orderId);
                      }
                    }}
                  />
                )}
              </TabSection>
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
                  { id: 'my', label: 'My Services', count: myCertifiedServices.length },
                  { id: 'active', label: 'Active Services', count: activeServicesData.length },
                  { id: 'history', label: 'Service History', count: serviceHistoryData.length },
                ]}
                activeTab={servicesTab}
                onTabChange={(tab) => setServicesTab(tab as 'my' | 'active' | 'history')}
                description={
                  servicesTab === 'my'
                    ? 'Warehouse-specific services you are certified to offer'
                    : servicesTab === 'active'
                      ? 'Active services that you are managing'
                      : 'Completed services archive'
                }
                searchPlaceholder="Search services"
                onSearch={setServicesSearchQuery}
                primaryColor="#8b5cf6"
              >
                {servicesTab === 'my' && (
                  <DataTable
                    columns={myServicesColumns}
                    data={myCertifiedServices}
                    showSearch={false}
                    externalSearchQuery={servicesSearchQuery}
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
                              {value ?? '—'}
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
                userRole="warehouse"
                userCode={normalizedCode ?? undefined}
                serviceOrders={serviceOrders}
                productOrders={productOrders}
                onOrderAction={async (orderId, action) => {
                  if (action === 'View Details' || action === 'View') {
                    modals.openById(orderId);
                    return;
                  }
                  await handleOrderAction(orderId, action);
                }}
                showServiceOrders={true}
                showProductOrders={true}
                primaryColor="#8b5cf6"
              />
            </PageWrapper>
          ) : activeTab === 'reports' ? (
            <PageWrapper headerSrOnly>
              <ReportsSection
                role="warehouse"
                userId={normalizedCode ?? undefined}
                primaryColor="#8b5cf6"
                reports={reportsData?.reports || []}
                feedback={reportsData?.feedback || []}
                isLoading={reportsLoading}
                onSubmit={async (payload) => {
                  if (payload.type === 'feedback') {
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
                  } else {
                    alert('Warehouse can only submit feedback at this time.');
                    return;
                  }
                  console.log('[WarehouseHub] AFTER submit feedback - calling mutateReports');
                  await mutateReports();
                }}
                fetchServices={fetchServicesForReports}
                fetchProcedures={fetchProceduresForReports}
                fetchOrders={fetchOrdersForReports}
                onAcknowledge={async (id, type) => {
                  console.log('[WarehouseHub] BEFORE acknowledge mutateReports');
                  await apiAcknowledgeItem(id, type);
                  await mutateReports();
                  console.log('[WarehouseHub] AFTER acknowledge mutateReports');
                }}
                onResolve={async (id, details) => {
                  console.log('[WarehouseHub] BEFORE resolve mutateReports');
                  await apiResolveReport(id, details ?? {});
                  await mutateReports();
                  console.log('[WarehouseHub] AFTER resolve mutateReports');
                }}
                onReportClick={(reportId) => {
                  modals.openById(reportId);
                }}
              />
            </PageWrapper>
          ) : activeTab === 'support' ? (
            <PageWrapper headerSrOnly>
              <SupportSection
                role="warehouse"
                primaryColor="#8b5cf6"
                tickets={supportTickets}
                onSubmitTicket={handleSupportSubmit}
              />
            </PageWrapper>
          ) : (
            <PageWrapper title={activeTab} showHeader headerSrOnly>
              <h2>Warehouse Hub - {activeTab}</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </PageWrapper>
          )}
        </div>
      </Scrollbar>

      {/* Legacy order modals removed; all order modals open via modals.openById() */}

    </div>
  );
}







