# Center Hub Data Model Documentation

## Overview

Data model specifications for Center hub entities, relationships, and data structures used in regional operations management.

## Core Entities

### Center
Primary entity representing a regional service center.

```typescript
interface Center {
  center_id: string;              // Primary key: CEN-XXX format
  name: string;                   // Center display name
  region: string;                 // Geographic region identifier
  email: string;                  // Primary contact email
  phone: string;                  // Primary contact phone
  address: Address;               // Physical location
  manager_id: string;             // Regional manager ID
  
  // Operational relationships
  territories: Territory[];       // Managed territories
  total_contractors: number;      // Active contractor count
  total_customers: number;        // Served customer count
  total_orders: number;          // Historical order volume
  
  // Performance metrics
  efficiency_rating: number;      // Operational efficiency (0-5)
  customer_satisfaction: number;  // Average satisfaction (0-5)
  contractor_retention: number;   // Retention percentage (0-100)
  
  // Configuration
  status: CenterStatus;
  operating_hours: OperatingHours;
  service_areas: string[];        // Supported service types
  
  // Audit fields
  created_at: string;             // ISO timestamp
  updated_at: string;             // ISO timestamp
}
```

### Territory
Geographic area managed by a center.

```typescript
interface Territory {
  territory_id: string;           // Primary key: TER-XXX format
  name: string;                   // Territory display name
  center_id: string;              // Foreign key to Center
  boundaries: GeographicBoundary[]; // Geographic definitions
  manager_id?: string;            // Optional territory manager
  contractor_count: number;       // Assigned contractor count
  customer_count: number;         // Customer count in territory
  service_types: string[];        // Available service types
  status: TerritoryStatus;        // Operational status
}

interface GeographicBoundary {
  type: 'polygon' | 'circle' | 'postal_codes';
  coordinates?: number[][];       // For polygon/circle boundaries
  postal_codes?: string[];        // For postal code areas
  radius?: number;               // For circle boundaries (km)
}

type TerritoryStatus = 'active' | 'inactive' | 'under_review';
```

### CenterOrder
Orders processed through the center.

```typescript
interface CenterOrder {
  order_id: string;               // Primary key: ORD-XXX format
  center_id: string;              // Foreign key to Center
  territory_id: string;           // Foreign key to Territory
  customer_id: string;            // Foreign key to Customer
  contractor_id?: string;         // Foreign key to Contractor (if assigned)
  service_type: string;           // Type of service requested
  status: OrderStatus;
  priority: OrderPriority;
  estimated_value: number;        // Estimated order value (USD)
  created_at: string;             // Order creation timestamp
  scheduled_date?: string;        // Scheduled service date
  completed_date?: string;        // Actual completion date
  notes?: string;                 // Additional order notes
}

type OrderStatus = 
  | 'pending'           // Awaiting assignment
  | 'assigned'          // Assigned to contractor
  | 'in_progress'       // Work in progress
  | 'completed'         // Successfully completed
  | 'cancelled'         // Cancelled by customer/center
  | 'on_hold';          // Temporarily suspended

type OrderPriority = 'low' | 'medium' | 'high' | 'urgent';
```

### CenterMetrics
Performance metrics for center operations.

```typescript
interface CenterMetrics {
  center_id: string;              // Foreign key to Center
  period_start: string;           // Metrics period start
  period_end: string;             // Metrics period end
  
  // Volume metrics
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  pending_orders: number;
  
  // Performance metrics
  completion_rate: number;        // Percentage (0-100)
  average_response_time: number;  // Hours
  customer_satisfaction: number;  // Rating (0-5)
  contractor_utilization: number; // Percentage (0-100)
  
  // Financial metrics
  total_revenue: number;          // USD
  average_order_value: number;    // USD
  cost_per_acquisition: number;   // USD
  
  // Territory breakdown
  territory_performance: TerritoryMetrics[];
}

interface TerritoryMetrics {
  territory_id: string;
  name: string;
  orders_completed: number;
  revenue: number;
  contractor_count: number;
  customer_satisfaction: number;
  efficiency_score: number;       // Calculated efficiency rating
}
```

### CenterActivity
Activity log for center operations.

```typescript
interface CenterActivity {
  activity_id: string;            // Primary key
  center_id: string;              // Foreign key to Center
  activity_type: CenterActivityType;
  description: string;            // Human-readable description
  actor_role: string;             // Role of user who performed action
  territory_id?: string;          // Related territory (if applicable)
  contractor_id?: string;         // Related contractor (if applicable)
  customer_id?: string;           // Related customer (if applicable)
  metadata: Record<string, any>;  // Additional structured data
  created_at: string;             // Activity timestamp
}

type CenterActivityType = 
  | 'territory_update'      // Territory boundary or config changes
  | 'contractor_assigned'   // Contractor assignment to territory
  | 'customer_onboarded'    // New customer added to territory
  | 'order_escalated'       // Order escalated to center level
  | 'performance_review'    // Performance metrics updated
  | 'system_update'         // System configuration changes
  | 'policy_change';        // Operational policy updates
```

## Supporting Types

### Address
Standardized address structure.

```typescript
interface Address {
  street: string;                 // Street address
  city: string;                   // City name
  state: string;                  // State/province code
  zip_code: string;               // Postal code
  country: string;                // Country code (ISO 3166)
  coordinates?: {
    latitude: number;             // GPS coordinates
    longitude: number;
  };
}
```

### OperatingHours
Business hours configuration.

```typescript
interface OperatingHours {
  [key: string]: {              // Day of week (monday, tuesday, etc.)
    open: string;               // Opening time (HH:MM format)
    close: string;              // Closing time (HH:MM format)
    is_open: boolean;           // Whether center operates this day
  };
}

// Example:
// {
//   "monday": { "open": "08:00", "close": "17:00", "is_open": true },
//   "tuesday": { "open": "08:00", "close": "17:00", "is_open": true },
//   "sunday": { "open": "00:00", "close": "00:00", "is_open": false }
// }
```

### Status Enums

```typescript
type CenterStatus = 
  | 'active'        // Fully operational
  | 'inactive'      // Temporarily closed
  | 'maintenance'   // Under maintenance
  | 'expanding';    // Expanding operations
```

## API Response Wrappers

### Standard API Response

```typescript
interface CenterApiResponse<T> {
  data: T;                        // Response data
  success: boolean;               // Operation success flag
  message?: string;               // Optional message
  errors?: string[];              // Validation/error details
}
```

### Paginated Response

```typescript
interface PaginatedCenterResponse<T> extends CenterApiResponse<T[]> {
  meta: {
    total: number;                // Total records available
    page: number;                 // Current page number
    per_page: number;             // Records per page
    total_pages: number;          // Total number of pages
  };
}
```

## State Management Types

### Hook State

```typescript
interface CenterDataState {
  loading: boolean;               // Data fetch in progress
  error: string | null;           // Error message if any
  kind: string;                   // Data type identifier
  data: Center | null;            // Center data
  _source?: string;               // Data source for debugging
}
```

### Component Props

```typescript
interface CenterComponentProps {
  centerId: string;               // Required center ID
  onError?: (error: string) => void;      // Error callback
  onSuccess?: (data: any) => void;        // Success callback
}
```

## Data Relationships

### Entity Relationship Diagram

```
Center (1) ----< (M) Territory
  |                    |
  |                    |
  v                    v
CenterMetrics        TerritoryMetrics
  |                    |
  |                    |
  v                    v
CenterActivity ----< (M) CenterOrder
                         |
                         |
                         v
                      Customer
                         |
                         |
                         v
                      Contractor
```

### Data Flow

```
Center Registration
  → Territory Creation
    → Boundary Definition
      → Contractor Assignment
        → Customer Onboarding
          → Order Processing
            → Performance Tracking
              → Metrics Aggregation
```

## Validation Rules

### Center Validation

- `center_id`: Must match pattern `CEN-[0-9]{3}`
- `name`: Required, 2-100 characters
- `email`: Valid email format
- `phone`: Valid phone number format
- `efficiency_rating`: Number between 0-5
- `customer_satisfaction`: Number between 0-5

### Territory Validation

- `territory_id`: Must match pattern `TER-[0-9]{3}`
- `name`: Required, 2-50 characters
- `boundaries`: At least one boundary required
- `service_types`: At least one service type required

### Order Validation

- `order_id`: Must match pattern `ORD-[0-9]{6}`
- `estimated_value`: Positive number
- `scheduled_date`: Future date only
- `priority`: Must be valid OrderPriority value

## Data Transformations

### Mock Data Generation

```typescript
function makeCenterDemoData(code?: string): Center {
  return {
    center_id: code || 'CEN-000',
    name: 'Center Demo',
    region: 'Demo Region',
    email: 'center@demo.com',
    phone: '(555) 123-4567',
    // ... additional mock properties
    _stub: true  // Indicates mock data
  };
}
```

### Data Normalization

```typescript
function normalizeCenterData(rawData: any): Center {
  return {
    center_id: rawData.center_id || rawData.id,
    name: rawData.name || 'Unnamed Center',
    region: rawData.region || 'Unknown Region',
    // ... normalize all required fields
    created_at: new Date(rawData.created_at).toISOString(),
    updated_at: new Date(rawData.updated_at).toISOString()
  };
}
```