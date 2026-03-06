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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useHubLoading } from '../contexts/HubLoadingContext';
import { useAuth as useClerkAuth, useClerk, useUser } from '@clerk/clerk-react';
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
import OverviewSummaryModal, { type OverviewSummaryItem } from '../components/overview/OverviewSummaryModal';
import { buildSupportTickets, mapSupportIssuePayload } from '../shared/support/supportTickets';
import { uploadProfilePhotoAndSyncLogo } from '../shared/profilePhoto';
import {
  CKS_DEFAULT_WATERMARK_URL,
  canRoleEditWatermark,
  sanitizeWatermarkPreferenceWrite,
} from '../shared/watermark';

import MyHubSection from '../components/MyHubSection';
import {
  useHubDashboard,
  useHubOrders,
  useHubProfile,
  useHubReports,
  useHubSupportTickets,
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
import { createReport as apiCreateReport, createFeedback as apiCreateFeedback, acknowledgeItem as apiAcknowledgeItem, resolveReport as apiResolveReport, createSupportTicket as apiCreateSupportTicket, fetchServicesForReports, fetchProceduresForReports, fetchOrdersForReports } from '../shared/api/hub';
import {
  createCatalogProduct,
  createCatalogService,
  getCatalogCategories,
  uploadCatalogImage,
  type CreateCatalogProductPayload,
  type CreateCatalogServicePayload,
} from '../shared/api/admin';

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
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [createProductForm, setCreateProductForm] = useState({ name: '', category: '', description: '', _newCategory: '' });
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [productPhotoFile, setProductPhotoFile] = useState<File | null>(null);
  const [productPhotoPreview, setProductPhotoPreview] = useState<string | null>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);
  const [showCreateService, setShowCreateService] = useState(false);
  const [createServiceForm, setCreateServiceForm] = useState({ name: '', category: '', description: '', _newCategory: '' });
  const [creatingService, setCreatingService] = useState(false);
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  const [servicePhotoFile, setServicePhotoFile] = useState<File | null>(null);
  const [servicePhotoPreview, setServicePhotoPreview] = useState<string | null>(null);
  const serviceFileInputRef = useRef<HTMLInputElement>(null);
  const [overviewModal, setOverviewModal] = useState<{
    id: string;
    title: string;
    subtitle?: string;
    items: OverviewSummaryItem[];
    emptyMessage?: string;
    accentColor?: string;
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<{ orderId: string; action: OrderActionType } | null>(null);

  // identity + helpers
  const { getToken } = useClerkAuth();

  // ── Fetch product categories for dropdown ─────────────────────────
  useEffect(() => {
    if (activeTab !== 'inventory' || !showCreateProduct) return;
    let cancelled = false;
    getCatalogCategories({ getToken })
      .then((d) => {
        if (cancelled) return;
        setProductCategories(d.products);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeTab, getToken, showCreateProduct]);

  useEffect(() => {
    if (activeTab !== 'services' || !showCreateService) return;
    let cancelled = false;
    getCatalogCategories({ getToken })
      .then((d) => {
        if (cancelled) return;
        setServiceCategories(d.services);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeTab, getToken, showCreateService]);
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
  const handleUploadPhoto = useCallback(async (file: File) => {
    await uploadProfilePhotoAndSyncLogo(user, file, normalizedCode, 'warehouse');
  }, [normalizedCode, user]);




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
  const { data: supportData, mutate: mutateSupportTickets } = useHubSupportTickets(normalizedCode);
  const supportTickets = useMemo(() => buildSupportTickets(supportData), [supportData]);

  // Resolve final display/user code after profile is available
  const userCode = useMemo(() => resolvedUserCode(profile?.cksCode, normalizedCode), [profile?.cksCode, normalizedCode]);
  const warehousePreferences = useMemo(() => loadUserPreferences(normalizedCode ?? null), [normalizedCode]);
  const warehouseEffectiveWatermarkUrl = CKS_DEFAULT_WATERMARK_URL;

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

  const clearProductPhoto = useCallback(() => {
    setProductPhotoFile(null);
    if (productPhotoPreview) URL.revokeObjectURL(productPhotoPreview);
    setProductPhotoPreview(null);
    if (productFileInputRef.current) productFileInputRef.current.value = '';
  }, [productPhotoPreview]);

  const handleProductPhotoSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (productPhotoPreview) URL.revokeObjectURL(productPhotoPreview);
    setProductPhotoFile(file);
    setProductPhotoPreview(URL.createObjectURL(file));
  }, [productPhotoPreview]);

  const clearServicePhoto = useCallback(() => {
    setServicePhotoFile(null);
    if (servicePhotoPreview) URL.revokeObjectURL(servicePhotoPreview);
    setServicePhotoPreview(null);
    if (serviceFileInputRef.current) serviceFileInputRef.current.value = '';
  }, [servicePhotoPreview]);

  const handleServicePhotoSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (servicePhotoPreview) URL.revokeObjectURL(servicePhotoPreview);
    setServicePhotoFile(file);
    setServicePhotoPreview(URL.createObjectURL(file));
  }, [servicePhotoPreview]);

  const handleCreateProduct = useCallback(async () => {
    if (!createProductForm.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    const resolvedCategory = createProductForm.category === '__new__'
      ? (createProductForm._newCategory.trim() || undefined)
      : (createProductForm.category.trim() || undefined);
    if (!resolvedCategory) {
      toast.error('Category is required');
      return;
    }
    setCreatingProduct(true);
    try {
      const payload: CreateCatalogProductPayload = {
        name: createProductForm.name.trim(),
        description: createProductForm.description.trim() || undefined,
        category: resolvedCategory,
      };
      const result = await createCatalogProduct(payload, { getToken });

      // Upload photo if selected
      if (productPhotoFile && result.productId) {
        try {
          await uploadCatalogImage(productPhotoFile, 'product', result.productId, { getToken });
        } catch {
          console.warn('Photo upload failed after product creation');
        }
      }

      toast.success(`Product created: ${result.productId}`);
      setCreateProductForm({ name: '', category: '', description: '', _newCategory: '' });
      clearProductPhoto();
      setShowCreateProduct(false);
      mutate((key: unknown) => typeof key === 'string' && (key.includes('/inventory') || key.includes('/catalog')), undefined, { revalidate: true });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create product');
    } finally {
      setCreatingProduct(false);
    }
  }, [createProductForm, productPhotoFile, getToken, mutate, clearProductPhoto]);

  const handleCreateService = useCallback(async () => {
    if (!createServiceForm.name.trim()) {
      toast.error('Service name is required');
      return;
    }
    const resolvedCategory = createServiceForm.category === '__new__'
      ? (createServiceForm._newCategory.trim() || undefined)
      : (createServiceForm.category.trim() || undefined);
    if (!resolvedCategory) {
      toast.error('Category is required');
      return;
    }

    setCreatingService(true);
    try {
      const payload: CreateCatalogServicePayload = {
        name: createServiceForm.name.trim(),
        description: createServiceForm.description.trim() || undefined,
        category: resolvedCategory,
      };
      const result = await createCatalogService(payload, { getToken });

      if (servicePhotoFile && result.serviceId) {
        try {
          await uploadCatalogImage(servicePhotoFile, 'service', result.serviceId, { getToken });
        } catch {
          console.warn('Photo upload failed after service request approval target creation');
        }
      }
      if (servicePhotoFile && !result.serviceId) {
        toast.success('Service request submitted. Add photo after admin approval.');
      }

      if (result.status === 'pending_approval') {
        toast.success(`Service request submitted: ${result.requestId ?? 'Pending review'}`);
      } else {
        toast.success(`Service created: ${result.serviceId}`);
      }
      setCreateServiceForm({ name: '', category: '', description: '', _newCategory: '' });
      clearServicePhoto();
      setShowCreateService(false);
      await Promise.all([
        mutate((key: unknown) => typeof key === 'string' && key.includes('/catalog'), undefined, { revalidate: true }),
        mutateActivities(),
      ]);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create service');
    } finally {
      setCreatingService(false);
    }
  }, [clearServicePhoto, createServiceForm, getToken, mutate, mutateActivities, servicePhotoFile]);

  useEffect(() => {
    if (activeTab !== 'inventory' || !showCreateProduct) {
      clearProductPhoto();
    }
  }, [activeTab, clearProductPhoto, showCreateProduct]);

  useEffect(() => {
    if (activeTab !== 'services' || !showCreateService) {
      clearServicePhoto();
    }
  }, [activeTab, clearServicePhoto, showCreateService]);

  const handleSupportSubmit = useCallback(async (payload: any) => {
    const mapped = await mapSupportIssuePayload(payload);
    await apiCreateSupportTicket(mapped);
    await mutateSupportTickets();
  }, [mutateSupportTickets]);

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
    return warehouseOverviewCards.map((card) => ({
      ...card,
      onClick: () => {
        const cap = 5;
        const toItems = (rows: OverviewSummaryItem[]) => rows.slice(0, cap);
        let payload: Omit<typeof overviewModal, 'id'> | null = null;

        switch (card.id) {
          case 'active-services':
            payload = {
              title: 'Active Services',
              subtitle: 'Services currently managed',
              items: toItems(activeServicesData.map((svc) => ({
                primary: svc.serviceName ?? svc.serviceId,
                secondary: svc.serviceId,
                meta: svc.status,
              }))),
              emptyMessage: 'No active services yet.',
              accentColor: card.color,
            };
            break;
          case 'inventory':
            payload = {
              title: 'Inventory',
              subtitle: 'Recent inventory items',
              items: toItems(activeInventoryData.map((item) => ({
                primary: item.name || item.productId,
                secondary: item.productId,
                meta: `On hand: ${item.onHand}`,
              }))),
              emptyMessage: 'No inventory items found.',
              accentColor: card.color,
            };
            break;
          case 'low-stock': {
            const lowStock = activeInventoryData.filter((item) => item.isLow);
            payload = {
              title: 'Low Stock',
              subtitle: 'Items below minimum stock',
              items: toItems(lowStock.map((item) => ({
                primary: item.name || item.productId,
                secondary: item.productId,
                meta: `On hand: ${item.onHand}`,
              }))),
              emptyMessage: 'No low-stock items right now.',
              accentColor: card.color,
            };
            break;
          }
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
  }, [activeServicesData, activeInventoryData, orders?.orders, accessStatus, accessTier, accessSource, dashboard?.accountStatus]);

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
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent' }}>
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
                userPreferences={warehousePreferences}
                onSaveUserPreferences={(prefs) => saveUserPreferences(normalizedCode ?? null, sanitizeWatermarkPreferenceWrite('warehouse', prefs))}
                canEditWatermark={canRoleEditWatermark('warehouse')}
                effectiveWatermarkUrl={warehouseEffectiveWatermarkUrl}
                accessStatus={accessStatus}
                accessTier={accessTier}
                accessSource={accessSource}
                onRedeemAccessCode={accessGate.redeem}
                onContactManager={() => undefined}
                onScheduleMeeting={() => undefined}
                photoUrl={user?.imageUrl}
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <Button
                  variant="primary"
                  roleColor="#8b5cf6"
                  onClick={() => setShowCreateProduct((v) => !v)}
                >
                  {showCreateProduct ? 'Cancel' : '+ New Product'}
                </Button>
              </div>

              {showCreateProduct && (
                <div style={{
                  marginBottom: 16,
                  padding: 20,
                  background: '#fff',
                  borderRadius: 10,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>Create New Product</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Product Name *</span>
                      <input value={createProductForm.name} onChange={(e) => setCreateProductForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. HEPA Vacuum Bags (Box of 10)" disabled={creatingProduct} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13 }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Category *</span>
                      <select value={createProductForm.category} onChange={(e) => setCreateProductForm(p => ({ ...p, category: e.target.value }))} disabled={creatingProduct} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, background: 'white' }}>
                        <option value="">Select category</option>
                        {productCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                        <option value="__new__">+ Add New Category</option>
                      </select>
                    </label>
                    {createProductForm.category === '__new__' && (
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>New Category *</span>
                        <input value={createProductForm._newCategory} onChange={(e) => setCreateProductForm(p => ({ ...p, _newCategory: e.target.value }))} placeholder="Enter new category name" disabled={creatingProduct} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13 }} />
                      </label>
                    )}
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Description</span>
                      <textarea value={createProductForm.description} onChange={(e) => setCreateProductForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the product, including packaging/quantity details..." disabled={creatingProduct} rows={2} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, resize: 'vertical' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Photo</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input ref={productFileInputRef} type="file" accept="image/*" onChange={handleProductPhotoSelect} disabled={creatingProduct} style={{ fontSize: 13 }} />
                        {productPhotoPreview && (
                          <div style={{ position: 'relative' }}>
                            <img src={productPhotoPreview} alt="Preview" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }} />
                            <button type="button" onClick={clearProductPhoto} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14, gap: 10 }}>
                    <Button variant="secondary" onClick={() => setShowCreateProduct(false)} disabled={creatingProduct}>Cancel</Button>
                    <Button variant="primary" roleColor="#8b5cf6" onClick={handleCreateProduct} disabled={creatingProduct}>
                      {creatingProduct ? 'Creating...' : 'Create Product'}
                    </Button>
                  </div>
                </div>
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <Button
                  variant="primary"
                  roleColor="#8b5cf6"
                  onClick={() => setShowCreateService((v) => !v)}
                >
                  {showCreateService ? 'Cancel' : '+ Request Service'}
                </Button>
              </div>

              {showCreateService && (
                <div style={{
                  marginBottom: 16,
                  padding: 20,
                  background: '#fff',
                  borderRadius: 10,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>Request New Service</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Service Name *</span>
                      <input
                        value={createServiceForm.name}
                        onChange={(e) => setCreateServiceForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Elevator Ceiling Cleaning"
                        disabled={creatingService}
                        style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Category *</span>
                      <select
                        value={createServiceForm.category}
                        onChange={(e) => setCreateServiceForm((p) => ({ ...p, category: e.target.value }))}
                        disabled={creatingService}
                        style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, background: 'white' }}
                      >
                        <option value="">Select category</option>
                        {serviceCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                        <option value="__new__">+ Add New Category</option>
                      </select>
                    </label>
                    {createServiceForm.category === '__new__' && (
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>New Category *</span>
                        <input
                          value={createServiceForm._newCategory}
                          onChange={(e) => setCreateServiceForm((p) => ({ ...p, _newCategory: e.target.value }))}
                          placeholder="Enter new category name"
                          disabled={creatingService}
                          style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}
                        />
                      </label>
                    )}
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Description</span>
                      <textarea
                        value={createServiceForm.description}
                        onChange={(e) => setCreateServiceForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Describe the service, scope, and any requirements..."
                        disabled={creatingService}
                        rows={2}
                        style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, resize: 'vertical' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Photo</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input
                          ref={serviceFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleServicePhotoSelect}
                          disabled={creatingService}
                          style={{ fontSize: 13 }}
                        />
                        {servicePhotoPreview && (
                          <div style={{ position: 'relative' }}>
                            <img src={servicePhotoPreview} alt="Preview" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }} />
                            <button type="button" onClick={clearServicePhoto} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14, gap: 10 }}>
                    <Button variant="secondary" onClick={() => setShowCreateService(false)} disabled={creatingService}>Cancel</Button>
                    <Button variant="primary" roleColor="#8b5cf6" onClick={handleCreateService} disabled={creatingService}>
                      {creatingService ? 'Submitting...' : 'Request Service'}
                    </Button>
                  </div>
                </div>
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
                onTicketClick={(ticket) => modals.openById(ticket.ticketId)}
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







