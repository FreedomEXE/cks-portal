/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: manager.d.ts
 * 
 * Description: DTOs for Manager (e.g., ManagerProfile, ManagerOrder, ManagerKPI) for Manager role.
 * Function: Declare types consumed by Manager frontend and API, extracted from legacy Manager Home monolith.
 * Importance: Ensures type safety and shared contracts as we refactor into modular slices.
 * Connects to: hub/roles/manager/api/manager.ts, hub/roles/manager/tabs/*, shared/types/api.d.ts.
 */

export interface ManagerKPI {
  contractors: number;
  customers: number;
  centers: number;
  crew: number;
}

/**
 * NewsItem: News items displayed on Manager dashboard (Home.tsx, NewsPreview.tsx).
 */
export type NewsItem = {
  id: string | number;
  title: string;
  date?: string;
  scope?: string;
  center_id?: string;
};

/**
 * ManagerSection: UI section keys used for navigation/state in Home.tsx.
 */
export type ManagerSection =
  | 'dashboard'
  | 'profile'
  | 'services'
  | 'contractors'
  | 'assign'
  | 'orders'
  | 'reports'
  | 'support';

/**
 * ManagerRequestBucket: Request list bucket keys (used in filters and badges).
 */
export type ManagerRequestBucket = 'needs_scheduling' | 'in_progress' | 'archive';

/**
 * ManagerRequestSortKey: Sort keys for the requests table.
 */
export type ManagerRequestSortKey = 'date' | 'services' | 'items' | 'status';

/**
 * ManagerSortDir: Sort direction for table sorting.
 */
export type ManagerSortDir = 'asc' | 'desc';

/**
 * ManagerRequest: Row returned by /api/manager/requests used by the Orders view.
 */
export interface ManagerRequest {
  order_id: string;
  customer_id?: string | null;
  center_id?: string | null;
  status: string;
  order_date: string | Date;
  item_count?: number | null;
  service_count?: number | null;
}

/**
 * ManagerRequestCounts: Approximate or calculated counts for UI badges.
 */
export interface ManagerRequestCounts {
  needs: number;
  progress: number;
  archive: number;
}

/**
 * ManagerScheduleForm: Values for scheduling a request.
 */
export interface ManagerScheduleForm {
  order_id: string;
  center_id: string;
  start: string; // ISO local string (datetime-local input)
  end: string;   // ISO local string (datetime-local input)
}

/**
 * ManagerOrder: Order header used in the order detail overlay.
 */
export interface ManagerOrder {
  order_id: string;
  status: string;
  customer_id?: string | null;
  center_id?: string | null;
  order_date: string | Date;
}

/**
 * ManagerOrderItem: Item line in an order detail (service or other item types).
 */
export interface ManagerOrderItem {
  order_item_id?: string | number;
  item_type: string; // e.g., 'service' | 'material'
  item_id: string | number;
  quantity?: number;
}

/**
 * ManagerOrderApproval: Approval record shown in order detail overlay.
 */
export interface ManagerOrderApproval {
  approval_id?: string | number;
  approver_type: string; // e.g., 'manager' | 'admin' | 'customer'
  status: string;        // e.g., 'approved' | 'pending' | 'rejected'
  decided_at?: string | Date | null;
}

/**
 * ManagerOrderDetail: Aggregated order detail shape used by Home.tsx.
 */
export interface ManagerOrderDetail {
  order: ManagerOrder;
  items: ManagerOrderItem[];
  approvals: ManagerOrderApproval[];
}

/**
 * ManagerReportStatus: Allowed statuses for reports in Manager UI.
 */
export type ManagerReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

/**
 * ManagerReportTab: Active tab for reports view (reports vs feedback).
 */
export type ManagerReportTab = 'reports' | 'feedback';

/**
 * ManagerReportScope: Scope for reports query (center vs customer).
 */
export type ManagerReportScope = 'center' | 'customer';

/**
 * ManagerReportListItem: Row in the reports list table.
 */
export interface ManagerReportListItem {
  report_id: string;
  title: string;
  type: string;
  severity?: string | null;
  status: ManagerReportStatus | string;
  created_at: string | Date;
}

/**
 * ManagerReportComment: Comment in a report's detail view.
 */
export interface ManagerReportComment {
  comment_id: string | number;
  author_role: string;
  created_at: string | Date;
  body: string;
}

/**
 * ManagerReportDetail: Detailed report view with comments.
 */
export interface ManagerReportDetail {
  report: {
    report_id: string;
    title: string;
    type: string;
    severity?: string | null;
    status: ManagerReportStatus | string;
    description?: string | null;
  };
  comments: ManagerReportComment[];
}

/**
 * ManagerFeedbackKind: Feedback kinds used in totals and list.
 */
export type ManagerFeedbackKind = 'praise' | 'request' | 'issue';

/**
 * ManagerFeedbackListItem: Row in the feedback list table.
 */
export interface ManagerFeedbackListItem {
  feedback_id: string;
  title: string;
  kind: ManagerFeedbackKind | string;
  created_at: string | Date;
}

/**
 * ManagerFeedbackDetail: Detailed feedback view fields used in UI.
 */
export interface ManagerFeedbackDetail {
  title: string;
  kind: ManagerFeedbackKind | string;
  center_id?: string | null;
  customer_id?: string | null;
  created_at: string | Date;
  message?: string | null;
  created_by_role?: string | null;
  created_by_id?: string | null;
}

/**
 * ManagerReportTotals: Totals by status for the reports tab.
 */
export interface ManagerReportTotals {
  open?: number;
  in_progress?: number;
  resolved?: number;
  closed?: number;
}

/**
 * ManagerFeedbackTotals: Totals by kind for the feedback tab.
 */
export interface ManagerFeedbackTotals {
  praise?: number;
  request?: number;
  issue?: number;
}
