/**
 * useOrderDetails - Unified fetch-first Order Details Hook
 *
 * - Always fetches a canonical order details payload from the backend
 * - Accepts optional `initial` to avoid flicker
 * - No client-side enrichment; backend is the source of truth
 */

import { useState, useEffect } from 'react';
import { fetchOrderDetails } from '../shared/api/orderDetails';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface OrderLineItem {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unitOfMeasure: string | null;
}

interface NormalizedOrder {
  orderId: string;
  orderType: 'service' | 'product';
  title: string | null;
  requestedBy: string | null;
  destination: string | null;
  requestedDate: string | null;
  status: string | null;
  notes: string | null;
  items?: OrderLineItem[];
  serviceId?: string | null;
  approvalStages?: Array<{
    role: string;
    status: string;
    user?: string | null;
    timestamp?: string | null;
  }>;
  metadata?: any;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  managedById?: string | null;
  managedByName?: string | null;
  fulfilledById?: string | null;
  fulfilledByName?: string | null;
}

interface ContactInfo {
  name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

interface Availability {
  tz: string | null;
  days: string[];
  window: { start: string; end: string } | null;
}

interface CancellationInfo {
  cancellationReason: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
}

interface ArchiveMetadata {
  archivedBy: string | null;
  archivedAt: string | null;
  reason: string | null;
  scheduledDeletion: string | null;
}

export interface UseOrderDetailsReturn {
  order: NormalizedOrder | null;
  requestorInfo: ContactInfo | null;
  destinationInfo: ContactInfo | null;
  availability: Availability | null;
  serviceDetails: {
    serviceId: string;
    serviceName: string | null;
    serviceType: string | null;
    description: string | null;
    status: string | null;
  } | null;
  cancellationInfo: CancellationInfo;
  rejectionReason: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  archiveMetadata: ArchiveMetadata | null;
  isLoading: boolean;
  error: Error | null;
  refresh?: () => void;
}

export interface UseOrderDetailsParams {
  orderId: string | null;
  initial?: any; // Order data from hub's useHubOrders or ActivityFeed
}

// ============================================================================
// Normalization Utilities
// ============================================================================

/**
 * Normalize backend order into the UI-friendly shape for modals
 */
function normalizeOrder(entity: any): NormalizedOrder {
  const metadata = entity.metadata || {};
  return {
    orderId: entity.order_id || entity.orderId || entity.id,
    orderType: entity.order_type || entity.orderType || 'product',
    title: entity.title || null,
    requestedBy: entity.requested_by || entity.requestedBy || entity.created_by || entity.createdBy || null,
    destination: entity.destination || entity.center_id || entity.centerId || entity.customer_id || entity.customerId || null,
    requestedDate:
      entity.requested_date ||
      entity.requestedDate ||
      entity.order_date ||
      entity.orderDate ||
      entity.created_at ||
      entity.createdAt ||
      null,
    status: entity.status || null,
    notes: entity.notes || null,
    items: (entity.items || []).map((i: any, idx: number) => ({
      id: i.id || `${entity.orderId || entity.order_id}-${idx + 1}`,
      code: i.catalog_item_code || i.code || null,
      name: i.name,
      description: i.description ?? null,
      quantity: typeof i.quantity === 'number' ? i.quantity : Number(i.quantity || 0),
      unitOfMeasure: i.unit_of_measure || i.unitOfMeasure || null,
    })),
    serviceId: entity.service_id || entity.serviceId || entity.transformedId || null,
    approvalStages: entity.approvalStages || [],
    metadata,
    isDeleted: false,
    deletedAt: undefined,
    deletedBy: undefined,
    managedById: metadata.managedById || null,
    managedByName: metadata.managedByName || null,
    fulfilledById: metadata.fulfilledById || null,
    fulfilledByName: metadata.fulfilledByName || null,
  };
}

function extractAvailability(metadata: any): Availability | null {
  const av = metadata?.availability;
  if (!av) return null;

  const days = Array.isArray(av.days) ? av.days : [];
  const window = av.window && av.window.start && av.window.end ? av.window : null;

  return {
    tz: av.tz ?? null,
    days,
    window,
  };
}

function extractCancellationInfo(metadata: any): CancellationInfo {
  const code = metadata?.cancelledByCode || metadata?.cancelledBy || null;
  const name = metadata?.cancelledByName || null;
  const display = metadata?.cancelledByDisplay || (code ? (name ? `${code} - ${name}` : code) : null);
  return {
    cancellationReason: metadata?.cancellationReason || null,
    cancelledBy: display,
    cancelledAt: metadata?.cancelledAt || null,
  };
}

function extractServiceDetails(order: any, metadata: any): {
  serviceId: string;
  serviceName: string | null;
  serviceType: string | null;
  description: string | null;
  status: string | null;
} | null {
  // Only extract service details for service orders
  if (order.orderType !== 'service') return null;

  // Get serviceId (may be null if order hasn't been transformed yet)
  const serviceId = order.serviceId || metadata?.serviceId || metadata?.service_id || null;

  // Get service details from metadata
  const serviceName = metadata?.serviceName || metadata?.service_name || null;
  const serviceType = metadata?.serviceType || metadata?.service_type || null;
  const description = metadata?.serviceDescription || metadata?.service_description || null;
  const status = metadata?.serviceStatus || metadata?.service_status || null;

  // Return if we have any service information available
  if (!serviceId && !serviceName && !serviceType && !description) return null;

  return {
    serviceId: serviceId || 'N/A',
    serviceName,
    serviceType,
    description,
    status,
  };
}

function extractRejectionReason(order: any, metadata: any): string | null {
  return order.rejectionReason || order.rejection_reason || metadata?.rejectionReason || null;
}

function extractArchiveMetadata(entity: any): ArchiveMetadata | null {
  const archivedAt = entity.archived_at || entity.archivedAt || null;
  if (!archivedAt) return null;

  // Check metadata as fallback for archive info
  const metadata = entity.metadata || {};

  return {
    archivedBy: entity.archived_by || entity.archivedBy || metadata.archivedBy || null,
    archivedAt: metadata.archivedAt || archivedAt,
    reason: entity.archive_reason || entity.archiveReason || metadata.archiveReason || null,
    scheduledDeletion: entity.deletion_scheduled || entity.deletionScheduled || metadata.scheduledDeletion || null,
  };
}

/**
 * Extract contact info from metadata; no client enrichment
 */
function extractContactInfo(
  metadata: any,
  contactType: 'requestor' | 'destination',
  fallbackCode: string | null,
): ContactInfo {
  const contact = metadata?.contacts?.[contactType] || {};

  // If contact info already in metadata, use it
  if (contact.name || contact.address || contact.phone || contact.email) {
    return {
      name: contact.name || fallbackCode || null,
      address: contact.address || null,
      phone: contact.phone || null,
      email: contact.email || null,
    };
  }

  // No enrichment available - return fallback
  return {
    name: fallbackCode || null,
    address: null,
    phone: null,
    email: null,
  };
}

// ============================================================================
// Main Hook
// ============================================================================

export function useOrderDetails(params: UseOrderDetailsParams): UseOrderDetailsReturn {
  const { orderId, initial } = params;

  const [orderData, setOrderData] = useState<{ order: NormalizedOrder; entity: any } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!orderId) {
      setOrderData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const processOrder = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Optimistic initial
        let entity: any = initial || null;

        // Fetch canonical details
        try {
          const fresh = await fetchOrderDetails(orderId);
          entity = fresh || entity;
        } catch (fetchErr: any) {
          // TOMBSTONE FALLBACK: If 404, try to fetch deleted snapshot
          if (fetchErr?.status === 404 || fetchErr?.message?.includes('404')) {
            console.log('[useOrderDetails] Order not found, attempting tombstone fallback...');
            try {
              const snapshotResponse = await fetch(`/api/deleted/order/${orderId}/snapshot`);
              if (snapshotResponse.ok) {
                const snapshotData = await snapshotResponse.json();
                if (snapshotData.success && snapshotData.data) {
                  // Reconstruct entity from snapshot
                  entity = {
                    ...snapshotData.data.snapshot,
                    isDeleted: true,
                    deletedAt: snapshotData.data.deletedAt,
                    deletedBy: snapshotData.data.deletedBy,
                    deletionReason: snapshotData.data.deletionReason,
                    isTombstone: true,
                  };
                  console.log('[useOrderDetails] Tombstone loaded successfully');
                } else {
                  throw fetchErr; // No snapshot available, throw original error
                }
              } else {
                throw fetchErr; // Snapshot fetch failed, throw original error
              }
            } catch (snapshotErr) {
              console.error('[useOrderDetails] Tombstone fallback failed:', snapshotErr);
              throw fetchErr; // Throw original 404 error
            }
          } else {
            throw fetchErr; // Not a 404, throw original error
          }
        }

        if (cancelled) return;

        // Normalize
        const normalizedOrder = normalizeOrder(entity);

        // Preserve deletion metadata
        if (entity.isDeleted) {
          normalizedOrder.isDeleted = true;
          normalizedOrder.deletedAt = entity.deletedAt;
          normalizedOrder.deletedBy = entity.deletedBy;
        }

        if (cancelled) return;

        // Store for modal
        setOrderData({ order: normalizedOrder, entity });
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error('[useOrderDetails] Failed to process order:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    processOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId, initial, refreshKey]);

  // If no order loaded yet, return empty state
  if (!orderData) {
    return {
      order: null,
      requestorInfo: null,
      destinationInfo: null,
      availability: null,
      serviceDetails: null,
      cancellationInfo: { cancellationReason: null, cancelledBy: null, cancelledAt: null },
      rejectionReason: null,
      archiveMetadata: null,
      isLoading,
      error,
      refresh: () => setRefreshKey((k) => k + 1),
    };
  }

  // Extract metadata and build enriched data
  const { order, entity } = orderData;
  const metadata = order.metadata || {};

  return {
    order,
    requestorInfo: extractContactInfo(metadata, 'requestor', order.requestedBy),
    destinationInfo: extractContactInfo(metadata, 'destination', order.destination),
    availability: extractAvailability(metadata),
    serviceDetails: extractServiceDetails(order, metadata),
    cancellationInfo: extractCancellationInfo(metadata),
    rejectionReason: extractRejectionReason(order, metadata),
    rejectedBy: metadata?.rejectedByDisplay || (metadata?.rejectedByCode ? (metadata?.rejectedByName ? `${metadata.rejectedByCode} - ${metadata.rejectedByName}` : metadata.rejectedByCode) : null),
    rejectedAt: metadata?.rejectedAt || null,
    archiveMetadata: extractArchiveMetadata(entity),
    isLoading,
    error,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}

/**
 * Helper to get archive metadata from raw entity (for hub-specific logic)
 */
export function getArchiveMetadataFromEntity(entity: any): ArchiveMetadata | null {
  const archivedAt = entity.archived_at || entity.archivedAt || null;
  if (!archivedAt) return null;
  return {
    archivedBy: entity.archived_by || entity.archivedBy || null,
    archivedAt,
    reason: entity.archive_reason || entity.archiveReason || null,
    scheduledDeletion: entity.deletion_scheduled || entity.deletionScheduled || null,
  };
}
