/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * contractor.d.ts
 * 
 * Description: TypeScript type definitions for contractor domain objects
 * Function: Provide type safety for all contractor-related data structures
 * Importance: Critical - Ensures type safety across contractor components
 * Connects to: All contractor components, API layer, data validation
 * 
 * Notes: Complete type definitions for contractor business domain.
 *        Includes profiles, services, orders, reports, and business metrics.
 */

// Contractor Profile Types
export interface ContractorProfile {
  contractor_id: string;
  company_name: string;
  address?: string;
  cks_manager?: string;
  main_contact?: string;
  phone?: string;
  email?: string;
  website?: string;
  years_with_cks?: string;
  num_customers?: string | number;
  contract_start_date?: string;
  status?: string;
  services_specialized?: string;
  payment_status?: string;
  customers_served?: number;
  locations_active?: number;
  services_purchased?: string[];
  crew_assigned?: number;
  pending_orders?: number;
}

// Account Manager Types
export interface AccountManager {
  manager_id: string;
  name: string;
  email?: string;
  phone?: string;
  territory?: string;
  role?: string;
}

// Business Metrics Types
export interface BusinessMetric {
  label: string;
  value: string | number;
  trend?: string;
  color?: string;
}

// Service Management Types
export interface ContractorService {
  service_id: string;
  service_name: string;
  category: string;
  description?: string;
  is_favorite: boolean;
  is_selected?: boolean;
}

// Customer and Network Types
export interface CustomerSummary {
  id: string;
  name: string;
  centers: number;
  status: 'Active' | 'Pending' | 'Inactive';
  last_service: string;
  total_value?: number;
}

export type NodeType = 'contractor' | 'customer' | 'center' | 'crew';

export interface EcosystemNode {
  id: string;
  name: string;
  type: NodeType;
  stats?: {
    customers?: number;
    centers?: number;
    crew?: number;
  };
  children?: EcosystemNode[];
}

// Order Management Types
export interface ContractorOrder {
  order_id: string;
  customer_id: string;
  center_id: string;
  status: string;
  item_count: number;
  service_count: number;
  product_count: number;
  order_date: string;
  total_amount?: number;
}

export interface OrderItem {
  order_item_id: string;
  item_id: string;
  item_type: 'service' | 'product';
  quantity: number;
  description?: string;
  unit_price?: number;
  total_price?: number;
}

export interface OrderApproval {
  approval_id: string;
  approver_type: string;
  approver_id?: string;
  status: 'pending' | 'approved' | 'denied';
  decided_at?: string;
  notes?: string;
}

export interface OrderDetail {
  order: ContractorOrder;
  items: OrderItem[];
  approvals: OrderApproval[];
  history?: Array<{
    action: string;
    timestamp: string;
    user_id: string;
    notes?: string;
  }>;
}

// Reports and Feedback Types
export interface ContractorReport {
  report_id: string;
  title: string;
  type: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_by_role: string;
  created_by_id: string;
  created_at: string;
  updated_at?: string;
  description?: string;
  center_id?: string;
  customer_id?: string;
}

export interface ReportComment {
  comment_id: string;
  report_id: string;
  commenter_role: string;
  commenter_id: string;
  content: string;
  created_at: string;
}

export interface ReportDetail {
  report: ContractorReport;
  comments: ReportComment[];
}

export interface ContractorFeedback {
  feedback_id: string;
  title: string;
  kind: 'praise' | 'request' | 'issue' | 'suggestion';
  created_by_role: string;
  created_by_id: string;
  created_at: string;
  message?: string;
  center_id?: string;
  customer_id?: string;
  rating?: number;
  status?: 'new' | 'reviewed' | 'responded';
}

// Activity and Notifications
export interface ContractorActivity {
  activity_id: string;
  activity_type: string;
  description: string;
  created_at: string;
  metadata?: Record<string, any>;
  user_id?: string;
  related_entity_type?: string;
  related_entity_id?: string;
}

// Support System Types
export interface SupportTicket {
  ticket_id?: string;
  user_id: string;
  user_role: 'contractor';
  user_hub: 'contractor';
  issue_type: 'bug' | 'how_to' | 'feature_question' | 'business_support' | 'account_issue' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  steps_to_reproduce?: string;
  browser_info?: string;
  current_url?: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at?: string;
  updated_at?: string;
}

// API Response Types
export interface ContractorApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  totalsByStatus?: Record<string, number>;
  totalsByKind?: Record<string, number>;
}

// Dashboard Data Types
export interface DashboardData {
  metrics: BusinessMetric[];
  customers: CustomerSummary[];
  recent_activity: ContractorActivity[];
  news?: Array<{
    id: string;
    title: string;
    content: string;
    created_at: string;
  }>;
  messages?: Array<{
    id: string;
    subject: string;
    from: string;
    created_at: string;
    unread: boolean;
  }>;
}

// Component Props Types
export interface ContractorTabProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

// Configuration Types
export interface ContractorConfig {
  role: 'contractor';
  displayName: string;
  version: string;
  theme: {
    primaryColor: string;
    headerClass: string;
    accentColor: string;
  };
  tabs: Array<{
    id: string;
    label: string;
    component: string;
    icon: string;
    default?: boolean;
    requires?: string[];
  }>;
  features: {
    showRecentActions: boolean;
    showBusinessMetrics: boolean;
    allowServiceManagement: boolean;
    allowOrderApprovals: boolean;
    premiumSupport: boolean;
    accountManagerAccess: boolean;
  };
  api: {
    baseUrl: string;
    endpoints: Record<string, string>;
  };
  permissions: {
    default: string[];
    required: Record<string, string>;
  };
}

// State Management Types
export interface ContractorState {
  loading: boolean;
  error: string | null;
  kind: string;
  data: ContractorProfile | null;
  _source?: string;
}

// Utility Types
export type ContractorSection = 'dashboard' | 'profile' | 'services' | 'ecosystem' | 'orders' | 'reports' | 'support';
export type OrderStatus = 'pending' | 'approved' | 'archive';
export type ReportTab = 'reports' | 'feedback';

// Export all types for external use
export type {
  ContractorProfile,
  AccountManager,
  BusinessMetric,
  ContractorService,
  CustomerSummary,
  EcosystemNode,
  ContractorOrder,
  OrderItem,
  OrderApproval,
  OrderDetail,
  ContractorReport,
  ReportComment,
  ReportDetail,
  ContractorFeedback,
  ContractorActivity,
  SupportTicket,
  ContractorApiResponse,
  DashboardData,
  ContractorTabProps,
  ContractorConfig,
  ContractorState,
  ContractorSection,
  OrderStatus,
  ReportTab,
  NodeType
};