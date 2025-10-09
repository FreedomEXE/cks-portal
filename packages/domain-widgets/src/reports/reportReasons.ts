// Report category types - ONLY Service, Order, Procedure
export type ReportCategory = 'service' | 'order' | 'procedure';

// Reason lists for REPORTS
export const SERVICE_REPORT_REASONS = [
  'Quality Issue',
  'Incomplete Work',
  'Crew Behavior',
  'Timing Problem',
  'Safety Concern',
  'Other'
] as const;

export const ORDER_REPORT_REASONS = [
  'Billing Issue',
  'Incorrect Details',
  'Delayed Processing',
  'Missing Information',
  'Other'
] as const;

export const PROCEDURE_REPORT_REASONS = [
  'Unclear Instructions',
  'Process Inefficiency',
  'Safety Concern',
  'Documentation Issue',
  'Other'
] as const;

// Reason lists for FEEDBACK
export const SERVICE_FEEDBACK_REASONS = [
  'Excellent Quality',
  'Professional Crew',
  'Timely Completion',
  'Great Communication',
  'Other'
] as const;

export const ORDER_FEEDBACK_REASONS = [
  'Smooth Process',
  'Quick Turnaround',
  'Clear Communication',
  'Accurate Details',
  'Other'
] as const;

export const PROCEDURE_FEEDBACK_REASONS = [
  'Clear Instructions',
  'Efficient Process',
  'Well Documented',
  'Easy to Follow',
  'Other'
] as const;

// Helper function to get reasons based on type and category
export function getReasonsForCategory(
  type: 'report' | 'feedback',
  category: ReportCategory
): readonly string[] {
  if (type === 'report') {
    switch (category) {
      case 'service':
        return SERVICE_REPORT_REASONS;
      case 'order':
        return ORDER_REPORT_REASONS;
      case 'procedure':
        return PROCEDURE_REPORT_REASONS;
      default:
        return [];
    }
  } else {
    switch (category) {
      case 'service':
        return SERVICE_FEEDBACK_REASONS;
      case 'order':
        return ORDER_FEEDBACK_REASONS;
      case 'procedure':
        return PROCEDURE_FEEDBACK_REASONS;
      default:
        return [];
    }
  }
}

// Category display names
export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  service: 'Service',
  order: 'Order',
  procedure: 'Procedure'
};
