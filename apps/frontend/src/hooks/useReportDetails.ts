/**
 * useReportDetails - Unified Report/Feedback Details Hook
 *
 * Follows the same pattern as useOrderDetails:
 * - Fetches report/feedback data from hub's useHubReports
 * - Normalizes into UI-friendly format for modals
 * - Handles loading/error states
 * - No client-side enrichment; backend is source of truth
 */

import { useMemo } from 'react';

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
}

export interface UseReportDetailsReturn {
  report: NormalizedReport | null;
  isLoading: boolean;
  error: Error | null;
}

export interface UseReportDetailsParams {
  reportId: string | null;
  reportType: 'report' | 'feedback' | null;
  reportsData: { reports: any[]; feedback: any[] } | null | undefined;
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
  };
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook to get normalized report/feedback details
 *
 * @param params - reportId, reportType, and reportsData from useHubReports
 * @returns Normalized report data for modal consumption
 */
export function useReportDetails(params: UseReportDetailsParams): UseReportDetailsReturn {
  const { reportId, reportType, reportsData } = params;

  const report = useMemo(() => {
    if (!reportId || !reportType || !reportsData) return null;

    if (reportType === 'report') {
      const entity = reportsData.reports.find((r: any) => r.id === reportId);
      if (!entity) return null;
      return normalizeReport(entity, 'report');
    }

    if (reportType === 'feedback') {
      const entity = reportsData.feedback.find((f: any) => f.id === reportId);
      if (!entity) return null;
      return normalizeReport(entity, 'feedback');
    }

    return null;
  }, [reportId, reportType, reportsData]);

  // No loading/error states needed since we're using hub's already-loaded data
  // If we need to fetch individual reports later, we can add that here
  return {
    report,
    isLoading: false,
    error: null,
  };
}
