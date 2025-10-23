/**
 * useServiceDetails - Service Details Hook
 *
 * ON-DEMAND FETCHING PATTERN (Proper Modular Architecture):
 * - Fetches service by ID using session-based auth (matches reports/orders)
 * - No user code needed - backend determines permissions from session
 * - Normalizes into UI-friendly format for modals
 * - Handles loading/error states
 * - Works identically from Activity Feed, Directory, Archive, etc.
 */

import useSWR from 'swr';
import { apiFetch, type ApiResponse } from '../shared/api/client';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface NormalizedService {
  serviceId: string;
  title: string;
  centerId?: string;
  metadata?: {
    serviceStatus?: string;
    serviceType?: string;
    crew?: any[];
    crewRequests?: any[];
    procedures?: any[];
    training?: any[];
    notes?: string;
    serviceStartDate?: string;
    centerName?: string;
    managerName?: string;
    managerId?: string;
    warehouseId?: string;
    warehouseName?: string;
  };
  // Deletion metadata (tombstone)
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletionReason?: string;
  isTombstone?: boolean;
}

export interface UseServiceDetailsReturn {
  service: NormalizedService | null;
  isLoading: boolean;
  error: Error | null;
}

export interface UseServiceDetailsParams {
  serviceId: string | null;
}

// ============================================================================
// Normalization Utilities
// ============================================================================

/**
 * Normalize backend service into UI-friendly shape for modals
 */
function normalizeService(entity: any): NormalizedService {
  const metadata = entity.metadata || {};

  return {
    serviceId: entity.serviceId || entity.id,
    title: entity.title || entity.name || entity.serviceId,
    centerId: entity.centerId || metadata.centerId,
    metadata: {
      serviceStatus: metadata.serviceStatus || entity.status,
      serviceType: metadata.serviceType || entity.serviceType || 'one-time',
      crew: metadata.crew || entity.crew || [],
      crewRequests: metadata.crewRequests || entity.crewRequests || [],
      procedures: metadata.procedures || entity.procedures || [],
      training: metadata.training || entity.training || [],
      notes: metadata.notes || entity.notes || '',
      serviceStartDate: metadata.serviceStartDate || metadata.actualStartDate || entity.startDate,
      centerName: metadata.centerName || entity.centerName,
      managerName: metadata.managerName || entity.managerName,
      managerId: metadata.managerId || entity.managerId,
      warehouseId: metadata.warehouseId || entity.warehouseId,
      warehouseName: metadata.warehouseName || entity.warehouseName,
    },
    // Deletion metadata (tombstone)
    isDeleted: entity.isDeleted,
    deletedAt: entity.deletedAt,
    deletedBy: entity.deletedBy,
    deletionReason: entity.deletionReason,
    isTombstone: entity.isTombstone,
  };
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook to get normalized service details by fetching on-demand
 *
 * @param params - serviceId
 * @returns Normalized service data with loading/error states
 */
export function useServiceDetails(params: UseServiceDetailsParams): UseServiceDetailsReturn {
  const { serviceId } = params;

  // Construct SWR key: only fetch if we have serviceId
  // Session-based auth pattern (matches how reports/orders work)
  const shouldFetch = !!serviceId;
  const swrKey = shouldFetch ? `/services/${serviceId}/details` : null;

  // Fetch on-demand from backend (uses apiFetch for proper /api prefix)
  // With tombstone fallback on 404
  const { data, error, isLoading } = useSWR<ApiResponse<any>>(
    swrKey,
    async (url) => {
      try {
        return await apiFetch<ApiResponse<any>>(url);
      } catch (fetchErr: any) {
        // TOMBSTONE FALLBACK: If 404, try to fetch deleted snapshot
        if (fetchErr?.status === 404 || fetchErr?.message?.includes('404')) {
          console.log('[useServiceDetails] Service not found, attempting tombstone fallback...');
          try {
            const snapshotResponse = await fetch(`/api/deleted/service/${serviceId}/snapshot`);
            if (snapshotResponse.ok) {
              const snapshotData = await snapshotResponse.json();
              if (snapshotData.success && snapshotData.data) {
                // Return snapshot as if it came from normal endpoint
                return {
                  success: true,
                  data: {
                    ...snapshotData.data.snapshot,
                    isDeleted: true,
                    deletedAt: snapshotData.data.deletedAt,
                    deletedBy: snapshotData.data.deletedBy,
                    deletionReason: snapshotData.data.deletionReason,
                    isTombstone: true,
                  },
                };
              }
            }
          } catch (snapshotErr) {
            console.error('[useServiceDetails] Tombstone fallback failed:', snapshotErr);
          }
        }
        throw fetchErr; // Re-throw if not 404 or tombstone failed
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Normalize the fetched data
  const service = data?.data ? normalizeService(data.data) : null;

  return {
    service,
    isLoading,
    error: error || null,
  };
}
