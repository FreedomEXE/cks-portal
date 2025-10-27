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
  // Archive metadata
  archivedAt?: string;
  archivedBy?: string;
  archiveReason?: string;
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
    // Archive metadata (support snake_case from backend)
    archivedAt: entity.archivedAt || entity.archived_at || metadata.archivedAt,
    archivedBy: entity.archivedBy || entity.archived_by || metadata.archivedBy,
    archiveReason: entity.archiveReason || entity.archive_reason || metadata.archiveReason,
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

  // Fetch on-demand from backend (apiFetch handles tombstone fallback on 404)
  const { data, error, isLoading } = useSWR<ApiResponse<any>>(
    swrKey,
    (url) => apiFetch<ApiResponse<any>>(url),
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
