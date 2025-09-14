/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * customer.d.ts
 * 
 * Description: TypeScript interface definitions for customer domain
 * Function: Type safety and data structure definitions for customer operations
 * Importance: Critical - Ensures type safety across customer components
 * Connects to: All customer components, API layer, state management
 */

// Customer state and profile interfaces
export interface CustomerState {
  loading: boolean;
  error: string | null;
  kind: string;
  data: CustomerProfile | null;
  _source?: string;
}

export interface CustomerProfile {
  customer_id: string;
  customer_name: string;
  business_type: string;
  address: string;
  main_contact: string;
  phone: string;
  email: string;
  website?: string;
  years_with_cks: string;
  contract_start_date: string;
  status: string;
  centers_managed: number;
  total_crew: number;
  active_contracts: string[];
  account_manager: AccountManager;
  _stub?: boolean;
}

export interface AccountManager {
  name: string;
  email: string;
  phone: string;
  manager_id: string;
}

// Center and operations interfaces
export interface Center {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'maintenance' | 'offline';
  contractor_assignments: ContractorAssignment[];
  crew_count: number;
  services_active: number;
}

export interface ContractorAssignment {
  contractor_id: string;
  contractor_name: string;
  services: string[];
  crew_assigned: CrewMember[];
  contract_status: 'active' | 'pending' | 'terminated';
  performance_rating: number;
}

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'on_break' | 'off_duty';
  current_task?: string;
}

// Service and order interfaces
export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  contractor: string;
  pricing: 'hourly' | 'fixed' | 'contract';
  price_range: string;
  availability: 'available' | 'limited' | 'unavailable';
  rating: number;
  response_time: string;
  is_active: boolean;
}

export interface ServiceRequest {
  id: string;
  service_name: string;
  center: string;
  contractor: string;
  requested_date: string;
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
}

export interface Order {
  id: string;
  center: string;
  services: string[];
  products: string[];
  contractor: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'archived';
  priority: 'high' | 'medium' | 'low';
  requested_date: string;
  scheduled_date?: string;
  total_amount: number;
}

// Reports and feedback interfaces
export interface Report {
  id: string;
  type: 'incident' | 'quality' | 'service_issue' | 'general';
  title: string;
  description: string;
  center: string;
  contractor: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'high' | 'medium' | 'low';
  created_date: string;
  updated_date: string;
}

export interface Feedback {
  id: string;
  kind: 'praise' | 'request' | 'issue';
  title: string;
  message: string;
  contractor: string;
  center: string;
  rating?: number;
  created_date: string;
  status: 'new' | 'reviewed' | 'responded';
}

// Support ticket interface
export interface SupportTicket {
  id: string;
  category: 'service_issue' | 'billing' | 'technical' | 'account' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  center?: string;
  subject: string;
  description: string;
  contact_method: 'email' | 'phone' | 'portal';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_date: string;
  updated_date: string;
  assigned_to?: string;
}

// Dashboard metrics interface
export interface DashboardMetrics {
  total_centers: number;
  active_centers: number;
  open_requests: number;
  total_crew: number;
  monthly_service_requests: number;
  customer_satisfaction: number;
  response_time_avg: string;
}

// API response interfaces
export interface CustomerApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  totals?: Record<string, number>;
}

// Component prop interfaces
export interface CustomerTabProps {
  userId: string;
  config: any;
  features: any;
  api: any;
}

// Form state interfaces
export interface ServiceRequestForm {
  service_id: string;
  center: string;
  preferred_date: string;
  priority: 'high' | 'medium' | 'low';
  notes: string;
}

export interface ReportForm {
  type: 'incident' | 'quality' | 'service_issue' | 'general';
  title: string;
  description: string;
  center: string;
  contractor?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface FeedbackForm {
  kind: 'praise' | 'request' | 'issue';
  title: string;
  message: string;
  contractor: string;
  center: string;
  rating?: number;
}

// Session and auth interfaces
export interface CustomerSession {
  role: string | null;
  code: string | null;
  companyName: string | null;
  timestamp: string | null;
}

// API endpoint types
export type CustomerApiEndpoint = 
  | '/profile'
  | '/dashboard'
  | '/centers'
  | '/services'
  | '/orders'
  | '/reports'
  | '/feedback'
  | '/support'
  | '/ecosystem'
  | '/metrics'
  | '/health';

// Configuration interfaces
export interface CustomerConfig {
  role: string;
  displayName: string;
  version: string;
  theme: {
    primaryColor: string;
    headerClass: string;
    accentColor: string;
  };
  tabs: CustomerTabConfig[];
  features: CustomerFeatures;
  api: {
    baseUrl: string;
    endpoints: Record<string, string>;
  };
  permissions: {
    default: string[];
    required: Record<string, string>;
  };
}

export interface CustomerTabConfig {
  id: string;
  label: string;
  component: string;
  icon: string;
  default?: boolean;
  requires: string[];
}

export interface CustomerFeatures {
  showCenterOverview: boolean;
  allowServiceRequests: boolean;
  enableEcosystemView: boolean;
  showAccountManager: boolean;
  supportTicketSystem: boolean;
  feedbackSystem: boolean;
  viewHierarchy: string[];
}