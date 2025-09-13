# Contractor Hub - Data Model

## Core Data Structures

### Contractor Entity
```typescript
interface Contractor {
  contractor_id: string;           // Unique identifier (CON-XXX)
  name: string;                   // Business/contractor name
  email: string;                  // Primary contact email
  phone: string;                  // Primary phone number
  business_type: BusinessType;    // LLC, Corporation, Sole Proprietor, etc.
  license_number?: string;        // Business license number
  tax_id?: string;               // Tax identification number
  insurance_policy?: string;      // Insurance policy number
  
  // Location & Service Areas
  address: Address;
  service_areas: string[];        // Geographic areas served
  
  // Business Information
  services: ServiceOffering[];    // Available services
  certifications: Certification[]; // Professional certifications
  experience_years: number;       // Years in business
  
  // Performance Metrics
  rating: number;                // Average customer rating (1-5)
  total_orders: number;          // Total completed orders
  completion_rate: number;       // Percentage of completed orders
  on_time_rate: number;          // Percentage of on-time completions
  
  // Status & Availability
  status: ContractorStatus;      // active, inactive, suspended
  availability: AvailabilityWindow[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_active: string;
}
```

### Order Management
```typescript
interface Order {
  order_id: string;              // Unique identifier (ORD-XXX)
  customer_id: string;           // Reference to customer
  contractor_id?: string;        // Assigned contractor
  
  // Order Details
  service_type: string;          // Type of service requested
  description: string;           // Detailed requirements
  priority: OrderPriority;       // low, medium, high, urgent
  status: OrderStatus;           // pending, assigned, in_progress, completed, cancelled
  
  // Scheduling
  requested_date?: string;       // Customer preferred date
  scheduled_date?: string;       // Confirmed appointment date
  estimated_duration: number;    // Hours
  
  // Location
  service_address: Address;
  access_notes?: string;         // Special access instructions
  
  // Financial
  estimated_value: number;       // Quoted price
  actual_cost?: number;          // Final billed amount
  payment_status: PaymentStatus; // pending, paid, overdue
  
  // Documentation
  photos: string[];              // Before/after photos
  notes: OrderNote[];            // Progress notes
  completion_report?: string;    // Final report
  
  // Customer Interaction
  customer_rating?: number;      // Customer satisfaction (1-5)
  customer_feedback?: string;    // Customer comments
  
  // Timestamps
  created_at: string;
  updated_at: string;
  completed_at?: string;
}
```

### Service Offerings
```typescript
interface ServiceOffering {
  service_id: string;
  service_type: string;          // roofing, siding, gutters, etc.
  category: ServiceCategory;     // exterior, interior, maintenance, repair
  
  // Pricing
  pricing_model: PricingModel;   // hourly, fixed, per_sqft, custom
  base_price: number;
  minimum_charge?: number;
  travel_fee?: number;
  
  // Availability
  available: boolean;
  seasonal_only?: boolean;
  lead_time_days: number;        // Minimum notice required
  
  // Requirements
  license_required: boolean;
  insurance_required: boolean;
  equipment_needed: string[];
  
  // Description
  title: string;
  description: string;
  specializations: string[];     // Specific expertise areas
}
```

### Activity Tracking
```typescript
interface Activity {
  activity_id: string;
  contractor_id: string;
  
  // Activity Details
  activity_type: ActivityType;   // order_assigned, status_update, profile_update, etc.
  description: string;
  actor_role: string;            // Who performed the action
  
  // Context
  related_order_id?: string;
  related_customer_id?: string;
  metadata: Record<string, any>; // Additional context data
  
  // Timestamps
  created_at: string;
}
```

### Performance Metrics
```typescript
interface PerformanceMetrics {
  contractor_id: string;
  period_start: string;
  period_end: string;
  
  // Order Statistics
  orders_assigned: number;
  orders_completed: number;
  orders_cancelled: number;
  completion_rate: number;       // Percentage
  
  // Quality Metrics
  average_rating: number;        // 1-5 stars
  customer_satisfaction: number; // Percentage
  repeat_customers: number;
  complaints: number;
  
  // Timeliness
  on_time_completions: number;
  on_time_rate: number;         // Percentage
  average_completion_time: number; // Hours
  
  // Financial
  total_earnings: number;
  average_order_value: number;
  payment_issues: number;
  
  // Efficiency
  response_time_hours: number;   // Average response to assignment
  rework_requests: number;       // Quality issues requiring rework
}
```

## Enums & Types

### Business Enums
```typescript
enum BusinessType {
  SOLE_PROPRIETOR = 'sole_proprietor',
  LLC = 'llc',
  CORPORATION = 'corporation',
  PARTNERSHIP = 'partnership'
}

enum ContractorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_APPROVAL = 'pending_approval'
}

enum OrderStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

enum OrderPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  DISPUTED = 'disputed'
}
```

### Supporting Types
```typescript
interface Address {
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

interface Certification {
  certification_id: string;
  name: string;
  issuing_body: string;
  issued_date: string;
  expiry_date?: string;
  certificate_number: string;
}

interface AvailabilityWindow {
  day_of_week: number;          // 0-6 (Sunday-Saturday)
  start_time: string;           // HH:MM format
  end_time: string;             // HH:MM format
  available: boolean;
}

interface OrderNote {
  note_id: string;
  content: string;
  author: string;
  note_type: 'progress' | 'issue' | 'customer_communication';
  created_at: string;
}
```

## Data Relationships

### Entity Relationships
```
Contractor 1:N Orders
Contractor 1:N ServiceOfferings
Contractor 1:N Activities
Contractor 1:N PerformanceMetrics
Order 1:N OrderNotes
Order N:1 Customer (external)
```

### API Response Patterns
```typescript
// Standard API Response
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
  };
}

// Paginated Response
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}
```

## Data Validation

### Input Validation Rules
- **Email**: Valid email format, unique per contractor
- **Phone**: E.164 format preferred
- **Contractor ID**: Format CON-XXXXX (5 digits)
- **Order ID**: Format ORD-XXXXX (5 digits)
- **Rating**: Decimal 1.0-5.0, one decimal place
- **Dates**: ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)

### Business Rules
- Contractor must have at least one service offering to be active
- Orders cannot be assigned to inactive contractors
- Rating calculations based on last 100 orders or 1 year, whichever is larger
- Performance metrics calculated in rolling 30/90/365 day windows

---

*Data model documentation for Contractor hub development*