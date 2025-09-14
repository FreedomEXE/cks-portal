/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * center.d.ts
 * 
 * Description: TypeScript type definitions for Center hub
 * Function: Provides type safety for center-specific data structures
 * Importance: Critical - Ensures type safety across Center hub
 * Connects to: All Center components, API calls, and data management
 * 
 * Notes: Center-specific types for regional operations and territory management.
 *        Extends base CKS types with center-specific properties.
 */

export interface Center {
  center_id: string;              // CEN-XXX format
  name: string;                   // Center name
  region: string;                 // Geographic region
  email: string;                  // Contact email
  phone: string;                  // Contact phone
  address: Address;               // Center location
  manager_id: string;             // Regional manager
  
  // Operational data
  territories: Territory[];       // Managed territories
  total_contractors: number;      // Contractor count
  total_customers: number;        // Customer count
  total_orders: number;          // Order volume
  
  // Performance metrics
  efficiency_rating: number;      // Operational efficiency
  customer_satisfaction: number;  // Customer satisfaction score
  contractor_retention: number;   // Contractor retention rate
  
  // Status and settings
  status: CenterStatus;
  operating_hours: OperatingHours;
  service_areas: string[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Territory {
  territory_id: string;
  name: string;
  center_id: string;
  boundaries: GeographicBoundary[];
  manager_id?: string;
  contractor_count: number;
  customer_count: number;
  service_types: string[];
  status: 'active' | 'inactive' | 'under_review';
}

export interface GeographicBoundary {
  type: 'polygon' | 'circle' | 'postal_codes';
  coordinates?: number[][];       // For polygon/circle
  postal_codes?: string[];        // For postal code areas
  radius?: number;               // For circle boundaries
}

export interface CenterOrder {
  order_id: string;
  center_id: string;
  territory_id: string;
  customer_id: string;
  contractor_id?: string;
  service_type: string;
  status: OrderStatus;
  priority: OrderPriority;
  estimated_value: number;
  created_at: string;
  scheduled_date?: string;
}

export interface CenterMetrics {
  center_id: string;
  period_start: string;
  period_end: string;
  
  // Volume metrics
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  pending_orders: number;
  
  // Performance metrics
  completion_rate: number;        // Percentage
  average_response_time: number;  // Hours
  customer_satisfaction: number;  // Rating 1-5
  contractor_utilization: number; // Percentage
  
  // Financial metrics
  total_revenue: number;
  average_order_value: number;
  cost_per_acquisition: number;
  
  // Territory metrics
  territory_performance: TerritoryMetrics[];
}

export interface TerritoryMetrics {
  territory_id: string;
  name: string;
  orders_completed: number;
  revenue: number;
  contractor_count: number;
  customer_satisfaction: number;
  efficiency_score: number;
}

export interface CenterActivity {
  activity_id: string;
  center_id: string;
  activity_type: CenterActivityType;
  description: string;
  actor_role: string;
  territory_id?: string;
  contractor_id?: string;
  customer_id?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface OperatingHours {
  [key: string]: {              // day of week
    open: string;               // HH:MM format
    close: string;              // HH:MM format
    is_open: boolean;
  };
}

// Enums and Types
export type CenterStatus = 'active' | 'inactive' | 'maintenance' | 'expanding';

export type OrderStatus = 
  | 'pending' 
  | 'assigned' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'on_hold';

export type OrderPriority = 'low' | 'medium' | 'high' | 'urgent';

export type CenterActivityType = 
  | 'territory_update'
  | 'contractor_assigned'
  | 'customer_onboarded'
  | 'order_escalated'
  | 'performance_review'
  | 'system_update'
  | 'policy_change';

// API Response Types
export interface CenterApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedCenterResponse<T> extends CenterApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

// Hook Types
export interface CenterDataState {
  loading: boolean;
  error: string | null;
  kind: string;
  data: Center | null;
  _source?: string;
}

// Component Props
export interface CenterComponentProps {
  centerId: string;
  onError?: (error: string) => void;
  onSuccess?: (data: any) => void;
}