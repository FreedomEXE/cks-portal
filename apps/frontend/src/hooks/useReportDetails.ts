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
  creatorId?: string | null;
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
      creatorId: entity.creatorId ?? null,
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
    creatorId: entity.creatorId ?? null,
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
  const report = data?.data ? normalizeReport(data.data, reportType) : null;

  return {
    report,
    isLoading,
    error: error || null,
  };
}
