/**
 * useReportDetails - Unified Report/Feedback Details Hook
 *
 * ON-DEMAND FETCHING PATTERN (Proper Modular Architecture):
 * - Fetches report/feedback by ID using session-based auth (matches orders)
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

export interface ReportAcknowledgment {
  userId: string;
  timestamp: string;
}

export interface ReportResolution {
  notes?: string;
  actionTaken?: string;
}

export interface NormalizedReport {
  id: string;
  type: 'report' | 'feedback';
  reportReason?: string;
  status: 'open' | 'resolved' | 'closed';
  priority?: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  rating?: number | null;
  reportCategory?: string;
  submittedBy: string;
  submittedDate: string;
  relatedEntityId?: string;
  serviceManagedBy?: string;
  description?: string;
  acknowledgments?: ReportAcknowledgment[];
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: ReportResolution;
  resolution_notes?: string;
  // Archive metadata (for state detection)
  archivedAt?: string;
  archivedBy?: string;
  archiveReason?: string;
  deletionScheduled?: string;
  // Deletion metadata (tombstone)
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletionReason?: string;
  isTombstone?: boolean;
}

export interface UseReportDetailsReturn {
  report: NormalizedReport | null;
  isLoading: boolean;
  error: Error | null;
}

export interface UseReportDetailsParams {
  reportId: string | null;
  reportType: 'report' | 'feedback' | null;
}

// ============================================================================
// Normalization Utilities
// ============================================================================

/**
 * Normalize backend report into UI-friendly shape for modals
 */
function normalizeReport(entity: any, type: 'report' | 'feedback'): NormalizedReport {
  if (type === 'report') {
    return {
      id: entity.id,
      type: 'report',
      reportReason: entity.reportReason || entity.title,
      status: entity.status as 'open' | 'resolved' | 'closed',
      priority: entity.priority as 'HIGH' | 'MEDIUM' | 'LOW' | null,
      rating: null,
      reportCategory: entity.reportCategory,
      submittedBy: entity.submittedBy || '',
      submittedDate: entity.submittedDate,
      relatedEntityId: entity.relatedEntityId,
      serviceManagedBy: entity.serviceManagedBy,
      description: entity.description,
      acknowledgments: entity.acknowledgments || [],
      resolvedBy: entity.resolvedBy,
      resolvedAt: entity.resolvedAt,
      resolution: entity.resolution,
      resolution_notes: entity.resolution_notes,
      // Archive metadata
      archivedAt: entity.archivedAt,
      archivedBy: entity.archivedBy,
      archiveReason: entity.archiveReason,
      deletionScheduled: entity.deletionScheduled,
      // Deletion metadata (tombstone)
      isDeleted: entity.isDeleted,
      deletedAt: entity.deletedAt,
      deletedBy: entity.deletedBy,
      deletionReason: entity.deletionReason,
      isTombstone: entity.isTombstone,
    };
  }

  // Feedback
  return {
    id: entity.id,
    type: 'feedback',
    reportReason: entity.reportReason || entity.title,
    status: (entity.status as 'open' | 'resolved' | 'closed') || 'open',
    priority: null,
    rating: entity.rating || null,
    reportCategory: entity.reportCategory || entity.category,
    submittedBy: entity.submittedBy || '',
    submittedDate: entity.submittedDate,
    relatedEntityId: entity.relatedEntityId,
    serviceManagedBy: entity.serviceManagedBy,
    description: entity.description,
    acknowledgments: entity.acknowledgments || [],
    resolvedBy: entity.resolvedBy,
    resolvedAt: entity.resolvedAt,
    resolution: entity.resolution,
    resolution_notes: entity.resolution_notes,
    // Archive metadata
    archivedAt: entity.archivedAt,
    archivedBy: entity.archivedBy,
    archiveReason: entity.archiveReason,
    deletionScheduled: entity.deletionScheduled,
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
 * Hook to get normalized report/feedback details by fetching on-demand
 *
 * @param params - reportId and reportType
 * @returns Normalized report data with loading/error states
 */
export function useReportDetails(params: UseReportDetailsParams): UseReportDetailsReturn {
  const { reportId, reportType } = params;

  // Construct SWR key: only fetch if we have reportId
  // Session-based auth pattern (matches how orders work)
  const shouldFetch = !!(reportId && reportType);
  const swrKey = shouldFetch ? `/reports/${reportId}/details` : null;

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
          console.log(`[useReportDetails] ${reportType} not found, attempting tombstone fallback...`);
          try {
            const snapshotResponse = await fetch(`/api/deleted/${reportType}/${reportId}/snapshot`);
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
            console.error('[useReportDetails] Tombstone fallback failed:', snapshotErr);
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
  const report = data?.data ? normalizeReport(data.data, reportType) : null;

  return {
    report,
    isLoading,
    error: error || null,
  };
}
