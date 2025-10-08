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

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Button, DataTable, OrderDetailsModal, ProductOrderModal, ServiceOrderModal, ServiceViewModal, PageHeader, PageWrapper, Scrollbar, TabSection } from '@cks/ui';
import { useAuth } from '@cks/auth';
import { getAllowedActions, getActionLabel } from '@cks/policies';
import { useServices as useDirectoryServices } from '../shared/api/directory';
import { useCatalogItems } from '../shared/api/catalog';

import MyHubSection from '../components/MyHubSection';
import {
  useHubDashboard,
  useHubOrders,
  useHubProfile,
  useHubReports,
  useHubInventory,
  applyHubOrderAction,
  type HubOrderItem,
  type HubInventoryItem,
  type OrderActionRequest,
  type OrderActionType,
} from '../shared/api/hub';
import { createFeedback as apiCreateFeedback, acknowledgeItem as apiAcknowledgeItem, resolveReport as apiResolveReport } from '../shared/api/hub';

const ACTION_LABEL_MAP: Record<string, OrderActionType> = {
  Accept: 'accept',
  Approve: 'accept',
  Deny: 'reject',
  Reject: 'reject',
  'Start Delivery': 'start-delivery',
  'Mark Delivered': 'deliver',
  'Create Service': 'create-service',
  Cancel: 'cancel',
};
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
      role: 'warehouse',
      orderType: order.orderType,
      status: order.status,
    },
  }));
}

export default function WarehouseHub({ initialTab = 'dashboard' }: WarehouseHubProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [servicesTab, setServicesTab] = useState<'my' | 'active' | 'history'>('active');
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [deliveriesTab, setDeliveriesTab] = useState<'pending' | 'completed'>('pending');
  const [deliveriesSearchQuery, setDeliveriesSearchQuery] = useState('');
  const [inventoryTab, setInventoryTab] = useState<'active' | 'archive'>('active');
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<{ orderId: string; action: OrderActionType } | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<HubOrderItem | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

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
    mutate: refreshOrders,
  } = useHubOrders(normalizedCode);
  const { data: reportsData, isLoading: reportsLoading } = useHubReports(normalizedCode);
  const {
    data: inventory,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useHubInventory(normalizedCode);

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

  const activities = useMemo(() => buildActivities(serviceOrders, productOrders), [serviceOrders, productOrders]);

  const overviewData = useMemo(() => ({
    inventoryCount: (dashboard as any)?.inventoryCount ?? 0,
    pendingOrders: (dashboard as any)?.pendingOrders ?? 0,
    deliveriesScheduled: (dashboard as any)?.deliveriesScheduled ?? 0,
    lowStockItems: (dashboard as any)?.lowStockItems ?? 0,
    accountStatus: dashboard?.accountStatus ?? 'Unknown',
  }), [dashboard]);


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
      filtered = filtered.filter(item => item.type === inventoryFilter);
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
      filtered = filtered.filter(item => item.type === inventoryFilter);
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
          const { applyServiceAction } = await import('../shared/api/hub');
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
          const { applyServiceAction } = await import('../shared/api/hub');
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
          const { applyServiceAction } = await import('../shared/api/hub');
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

  // Fetch warehouse-specific services from catalog
  const { data: catalogData } = useCatalogItems({ type: 'service', pageSize: 500 });

  const myCertifiedServices = useMemo(() => {
    const items = catalogData?.items || [];
    // Filter to only show warehouse-managed services
    const warehouseServices = items.filter((service: any) => service.managedBy === 'warehouse');
    return warehouseServices.map((service: any) => ({
      serviceId: service.code ?? 'SRV',
      serviceName: service.name ?? 'Warehouse Service',
      certified: 'Yes',
      certificationDate: null,
      expires: null,
    }));
  }, [catalogData]);

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

  const overviewCards = useMemo(() => [
    { id: 'inventory', title: 'Inventory Items', dataKey: 'inventoryCount', color: 'purple' },
    { id: 'pending', title: 'Pending Orders', dataKey: 'pendingOrders', color: 'indigo' },
    { id: 'deliveries', title: 'Scheduled Deliveries', dataKey: 'deliveriesScheduled', color: 'purple' },
    { id: 'lowstock', title: 'Low Stock Items', dataKey: 'lowStockItems', color: 'magenta' },
    { id: 'status', title: 'Status', dataKey: 'accountStatus', color: 'purple' },
  ], []);

  const handleOrderAction = async (orderId: string, actionLabel: string, providedReason?: string) => {
    console.log('[WAREHOUSE] Order action triggered:', { orderId, actionLabel, providedReason });

    if (actionLabel === 'View Details') {
      const target = orders?.orders?.find((o: any) => (o.orderId || o.id) === orderId) || null;
      if (target) {
        setSelectedOrderForDetails(target);
      }
      return;
    }

    const mapped = ACTION_LABEL_MAP[actionLabel];
    if (!mapped) {
      console.error('[WAREHOUSE] Unknown action label:', actionLabel);
      return;
    }

    console.log('[WAREHOUSE] Mapped action:', mapped);

    if (pendingAction && pendingAction.orderId === orderId && pendingAction.action === mapped) {
      console.log('[WAREHOUSE] Action already pending, skipping');
      return;
    }

    const request: OrderActionRequest = {
      action: mapped,
    };

    if (mapped === 'reject') {
      const notes = window.prompt('Please share a short reason for rejecting this order.');
      const trimmed = notes?.trim();
      if (!trimmed) {
        return;
      }
      request.notes = trimmed;
    }

    if (mapped === 'cancel' && providedReason) {
      request.notes = providedReason;
    }

    if (mapped === 'create-service') {
      const transformedId = window.prompt('Enter a service tracking ID (optional). Leave blank to auto-generate.');
      const trimmed = transformedId?.trim();
      if (trimmed) {
        request.transformedId = trimmed;
      }
    }

    setPendingAction({ orderId, action: mapped });
    console.log('[WAREHOUSE] Sending order action request:', request);

    try {
      const result = await applyHubOrderAction(orderId, request);
      console.log('[WAREHOUSE] Order action successful:', result);

      // Show success message
      const successMessage = mapped === 'accept' ? 'Order accepted successfully!' :
                           mapped === 'deliver' ? 'Order marked as delivered!' :
                           mapped === 'reject' ? 'Order rejected.' :
                           'Order updated successfully!';
      window.alert(successMessage);

      await refreshOrders();
      console.log('[WAREHOUSE] Orders refreshed');
    } catch (error) {
      console.error('[WAREHOUSE] Failed to update order:', error);
      window.alert('Unable to update the order. Please try again.');
    } finally {
      setPendingAction(null);
    }
  };
  const profileCardData = useMemo(() => ({
    name: profile?.name ?? '—',
    warehouseId: normalizedCode ?? '—',
    address: profile?.address ?? '—',
    phone: profile?.phone ?? '—',
    email: profile?.email ?? '—',
    mainContact: profile?.mainContact ?? '—',
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
      <MyHubSection
        hubName="Warehouse Hub"
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={setActiveTab}
        userId={normalizedCode ?? 'WAREHOUSE'}
        role="warehouse"
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
                emptyMessage="No recent warehouse activity"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <NewsPreview color="#8b5cf6" onViewAll={() => navigate('/news')} />
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
                onUpdatePhoto={() => undefined}
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
                  options: ['Equipment', 'Products', 'Materials'],
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
                  onRowClick={(row) => console.log('View product details:', row)}
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
                  onRowClick={(row) => console.log('View archived product:', row)}
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
                              {value ?? '—'}
                            </span>
                          );
                        },
                      },
                      { key: 'scheduledDate', label: 'SCHEDULED DATE' },
                      {
                        key: 'actions',
                        label: 'ACTIONS',
                        render: (_value: string, row: any) => {
                          const deliveryStarted = row.order?.metadata?.deliveryStarted === true;

                          return (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {!deliveryStarted ? (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOrderAction(row.order.orderId, 'Start Delivery');
                                    }}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      fontWeight: 500,
                                      border: 'none',
                                      cursor: 'pointer',
                                      backgroundColor: '#3b82f6',
                                      color: 'white',
                                    }}
                                  >
                                    Start Delivery
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const reason = window.prompt('Please provide a reason for cancellation:');
                                      if (reason && reason.trim()) {
                                        handleOrderAction(row.order.orderId, 'Cancel', reason.trim());
                                      }
                                    }}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      fontWeight: 500,
                                      border: 'none',
                                      cursor: 'pointer',
                                      backgroundColor: '#ef4444',
                                      color: 'white',
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOrderAction(row.order.orderId, 'Mark Delivered');
                                    }}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      fontWeight: 500,
                                      border: 'none',
                                      cursor: 'pointer',
                                      backgroundColor: '#10b981',
                                      color: 'white',
                                    }}
                                  >
                                    Mark Delivered
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const reason = window.prompt('Please provide a reason for cancellation:');
                                      if (reason && reason.trim()) {
                                        handleOrderAction(row.order.orderId, 'Cancel', reason.trim());
                                      }
                                    }}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      fontWeight: 500,
                                      border: 'none',
                                      cursor: 'pointer',
                                      backgroundColor: '#ef4444',
                                      color: 'white',
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                            </div>
                          );
                        },
                      },
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
                    onRowClick={() => undefined}
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
                    onRowClick={() => undefined}
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
                    columns={[
                      { key: 'serviceId', label: 'SERVICE ID', clickable: true },
                      { key: 'serviceName', label: 'SERVICE NAME' },
                      { key: 'certified', label: 'CERTIFIED' },
                      { key: 'certificationDate', label: 'CERTIFICATION DATE' },
                      { key: 'expires', label: 'EXPIRES' },
                    ]}
                    data={myCertifiedServices}
                    showSearch={false}
                    externalSearchQuery={servicesSearchQuery}
                    maxItems={10}
                    onRowClick={(row: unknown) => console.log('[warehouse] view service', row)}
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
                      {
                        key: 'actions',
                        label: 'ACTIONS',
                        render: (_: any, row: any) => {
                          const status = (row.status || '').toLowerCase();
                          const isCreated = status === 'created';
                          const isInProgress = status === 'in progress' || status === 'in_progress' || status === 'active';

                          return (
                            <div style={{ display: 'flex', gap: 8 }}>
                              {isCreated && row.onStart && (
                                <Button size="sm" variant="primary" roleColor="#8b5cf6" onClick={(e) => { e.stopPropagation(); row.onStart(); }}>
                                  Start
                                </Button>
                              )}
                              {isInProgress && row.onComplete && (
                                <Button size="sm" variant="primary" roleColor="#8b5cf6" onClick={(e) => { e.stopPropagation(); row.onComplete(); }}>
                                  Complete
                                </Button>
                              )}
                              <Button
                                size="sm"
                                roleColor="#8b5cf6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedServiceId(row.serviceId);
                                }}
                              >
                                View
                              </Button>
                              {(isCreated || isInProgress) && row.onCancel && (
                                <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); row.onCancel(); }}>
                                  Cancel
                                </Button>
                              )}
                            </div>
                          );
                        },
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
                      {
                        key: 'actions',
                        label: 'ACTIONS',
                        render: (_: any, row: any) => (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedServiceId(row.serviceId)}
                          >
                            View
                          </Button>
                        ),
                      },
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
                userRole="warehouse"
                userCode={normalizedCode ?? undefined}
                serviceOrders={serviceOrders}
                productOrders={productOrders}
                onOrderAction={handleOrderAction}
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
                    await apiCreateFeedback({ title: payload.title, message: payload.description, category: payload.category });
                  } else {
                    alert('Warehouse can only submit feedback at this time.');
                    return;
                  }
                  const { mutate } = await import('swr');
                  (mutate as any)(`/hub/reports/${normalizedCode}`);
                }}
                onAcknowledge={async (id, type) => {
                  await apiAcknowledgeItem(id, type);
                  const { mutate } = await import('swr');
                  (mutate as any)(`/hub/reports/${normalizedCode}`);
                }}
                onResolve={async (id, details) => {
                  await apiResolveReport(id, details ?? {});
                  const { mutate } = await import('swr');
                  (mutate as any)(`/hub/reports/${normalizedCode}`);
                }}
              />
            </PageWrapper>
          ) : activeTab === 'support' ? (
            <PageWrapper headerSrOnly>
              <SupportSection role="warehouse" primaryColor="#8b5cf6" />
            </PageWrapper>
          ) : (
            <PageWrapper title={activeTab} showHeader headerSrOnly>
              <h2>Warehouse Hub - {activeTab}</h2>
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

        const meta = (selectedOrderForDetails as any)?.metadata || {};
        const commonOrder = selectedOrderForDetails
          ? {
              orderId: selectedOrderForDetails.orderId,
              title: selectedOrderForDetails.title || null,
              requestedBy: selectedOrderForDetails.requestedBy || selectedOrderForDetails.centerId || selectedOrderForDetails.customerId || null,
              destination: selectedOrderForDetails.destination || selectedOrderForDetails.centerId || null,
              requestedDate: selectedOrderForDetails.requestedDate || null,
              notes: selectedOrderForDetails.notes || null,
              status: (selectedOrderForDetails as any).status || null,
              serviceId: meta.serviceId || null,
              managedBy: meta.serviceManagedBy || null,
              managedById: meta.warehouseId || meta.managerId || null,
              managedByName: meta.warehouseName || meta.managerName || null,
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

      {/* Warehouse Service Details Modal */}
      {selectedServiceId && (() => {
        const service = serviceOrders.find(o => (o.serviceId ?? o.orderId) === selectedServiceId);
        if (!service) return null;

        const meta = (service as any).metadata || {};
        const serviceData = {
          serviceId: service.serviceId ?? service.orderId,
          serviceName: service.title ?? service.serviceId ?? service.orderId,
          serviceType: (meta.serviceType || 'one-time') as 'one-time' | 'recurring',
          serviceStatus: formatStatusLabel(meta.serviceStatus || service.status),
          centerId: service.centerId || null,
          centerName: meta.contacts?.destination?.name || service.centerId || null,
          warehouseId: meta.warehouseId || null,
          warehouseName: meta.warehouseName || null,
          managedBy: 'warehouse' as const,
          startDate: meta.serviceActualStartTime || meta.actualStartDate || null,
          serviceStartNotes: meta.serviceStartNotes || null,
          serviceCompleteNotes: meta.serviceCompleteNotes || null,
        };

        const onStart = async () => {
          try {
            const notes = window.prompt('Add notes for starting this service (optional):');
            if (notes === null) return;
            const { applyServiceAction } = await import('../shared/api/hub');
            await applyServiceAction(selectedServiceId, 'start', notes || undefined);
            refreshOrders();
            setSelectedServiceId(null); // Close modal after action
          } catch (err) {
            console.error('[warehouse] failed to start service', err);
            alert(err instanceof Error ? err.message : 'Failed to start service');
          }
        };

        const onComplete = async () => {
          try {
            const notes = window.prompt('Add notes for completing this service (describe work performed):');
            if (notes === null) return;
            const { applyServiceAction } = await import('../shared/api/hub');
            await applyServiceAction(selectedServiceId, 'complete', notes || undefined);
            refreshOrders();
            setSelectedServiceId(null); // Close modal after action
          } catch (err) {
            console.error('[warehouse] failed to complete service', err);
            alert(err instanceof Error ? err.message : 'Failed to complete service');
          }
        };

        const onCancel = async () => {
          try {
            const reason = window.prompt('Please provide a reason for cancellation:');
            if (!reason) return;
            const { applyServiceAction } = await import('../shared/api/hub');
            await applyServiceAction(selectedServiceId, 'cancel');
            refreshOrders();
            setSelectedServiceId(null); // Close modal after action
          } catch (err) {
            console.error('[warehouse] failed to cancel service', err);
            alert(err instanceof Error ? err.message : 'Failed to cancel service');
          }
        };

        const onAddNotes = async () => {
          try {
            const notes = window.prompt('Add notes for this service:');
            if (!notes) return;
            const { applyServiceAction } = await import('../shared/api/hub');
            await applyServiceAction(selectedServiceId, 'update-notes', notes);
            refreshOrders();
          } catch (err) {
            console.error('[warehouse] failed to add notes', err);
            alert(err instanceof Error ? err.message : 'Failed to add notes');
          }
        };

        return (
          <ServiceViewModal
            isOpen={true}
            onClose={() => setSelectedServiceId(null)}
            service={serviceData}
            onStartService={onStart}
            onCompleteService={onComplete}
            onCancelService={onCancel}
            onAddNotes={onAddNotes}
          />
        );
      })()}
    </div>
  );
}
