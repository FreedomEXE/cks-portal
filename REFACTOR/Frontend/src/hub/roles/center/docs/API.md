# Center Hub API Documentation

## Overview

API specifications for Center hub operations, covering territory management, contractor coordination, and regional oversight functions.

## Base Configuration

```typescript
// API Base URL
const CENTER_API_BASE = '/api/center';

// Headers
interface CenterApiHeaders {
  'x-center-user-id': string;     // Center ID
  'x-user-id': string;            // User ID
  'x-user-role': 'center';        // Role validation
  'x-hub-type': 'center';         // Hub type
  'Accept': 'application/json';
  'Content-Type': 'application/json';
}
```

## Authentication

### Center Role Validation

```typescript
// Role validation function
export function validateCenterRole(user: any): boolean {
  const role = getCenterRole(user);
  return role === 'center';
}

// Session management
export function setCenterSession(code: string, name?: string) {
  sessionStorage.setItem('center:lastRole', 'center');
  sessionStorage.setItem('center:lastCode', code);
  if (name) sessionStorage.setItem('center:lastName', name);
}
```

## Core API Endpoints

### Center Profile Management

#### GET /api/center/profile
Retrieve center profile information.

**Parameters:**
- `code` (string): Center ID (CEN-XXX format)

**Response:**
```typescript
interface CenterProfileResponse {
  data: {
    center_id: string;
    name: string;
    region: string;
    email: string;
    phone: string;
    address: Address;
    manager_id: string;
    territories: Territory[];
    total_contractors: number;
    total_customers: number;
    total_orders: number;
    efficiency_rating: number;
    customer_satisfaction: number;
    status: CenterStatus;
    operating_hours: OperatingHours;
    service_areas: string[];
    created_at: string;
    updated_at: string;
  };
  success: boolean;
  message?: string;
}
```

#### PUT /api/center/profile
Update center profile information.

**Request Body:**
```typescript
interface UpdateCenterProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: Address;
  operating_hours?: OperatingHours;
  service_areas?: string[];
}
```

### Territory Management

#### GET /api/center/territories
Retrieve all territories managed by the center.

**Parameters:**
- `code` (string): Center ID
- `status` (optional): Filter by territory status
- `manager_id` (optional): Filter by territory manager

**Response:**
```typescript
interface TerritoriesResponse {
  data: Territory[];
  success: boolean;
  message?: string;
}

interface Territory {
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
```

#### PUT /api/center/territories/{territoryId}
Update territory information.

**Request Body:**
```typescript
interface UpdateTerritoryRequest {
  name?: string;
  boundaries?: GeographicBoundary[];
  manager_id?: string;
  service_types?: string[];
  status?: 'active' | 'inactive' | 'under_review';
}
```

### Contractor Management

#### GET /api/center/contractors
Retrieve contractors in the center's region.

**Parameters:**
- `code` (string): Center ID
- `territory_id` (optional): Filter by territory
- `status` (optional): Filter by contractor status
- `skill` (optional): Filter by skill/service type

**Response:**
```typescript
interface ContractorsResponse {
  data: Contractor[];
  success: boolean;
  message?: string;
}

interface Contractor {
  contractor_id: string;
  name: string;
  email: string;
  phone: string;
  territories: string[];
  skills: string[];
  rating: number;
  active_orders: number;
  completed_orders: number;
  status: 'active' | 'inactive' | 'suspended';
}
```

#### POST /api/center/contractors/assign
Assign contractor to territory.

**Request Body:**
```typescript
interface AssignContractorRequest {
  contractor_id: string;
  territory_id: string;
  assignment_type: 'primary' | 'secondary' | 'backup';
  effective_date?: string;
  notes?: string;
}
```

### Order Management

#### GET /api/center/orders
Retrieve orders in the center's region.

**Parameters:**
- `code` (string): Center ID
- `status` (optional): Filter by order status
- `territory_id` (optional): Filter by territory
- `date_from` (optional): Start date filter
- `date_to` (optional): End date filter
- `limit` (optional): Number of orders to return
- `offset` (optional): Pagination offset

**Response:**
```typescript
interface OrdersResponse {
  data: CenterOrder[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
  success: boolean;
}

interface CenterOrder {
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
```

### Performance Metrics

#### GET /api/center/metrics
Retrieve center performance metrics.

**Parameters:**
- `code` (string): Center ID
- `period` (optional): Time period ('7d', '30d', '90d', '1y')
- `metric_type` (optional): Specific metric type

**Response:**
```typescript
interface MetricsResponse {
  data: CenterMetrics;
  success: boolean;
}

interface CenterMetrics {
  center_id: string;
  period_start: string;
  period_end: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  pending_orders: number;
  completion_rate: number;
  average_response_time: number;
  customer_satisfaction: number;
  contractor_utilization: number;
  total_revenue: number;
  average_order_value: number;
  territory_performance: TerritoryMetrics[];
}
```

### Customer Management

#### GET /api/center/customers
Retrieve customers in the center's region.

**Parameters:**
- `code` (string): Center ID
- `territory_id` (optional): Filter by territory
- `status` (optional): Filter by customer status
- `search` (optional): Search by name/email

**Response:**
```typescript
interface CustomersResponse {
  data: Customer[];
  success: boolean;
}

interface Customer {
  customer_id: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
  territory_id: string;
  total_orders: number;
  lifetime_value: number;
  satisfaction_score: number;
  status: 'active' | 'inactive';
  last_service_date?: string;
}
```

### Activity Tracking

#### GET /api/center/activity
Retrieve recent center activities.

**Parameters:**
- `code` (string): Center ID
- `limit` (optional): Number of activities to return (default: 5)
- `activity_type` (optional): Filter by activity type

**Response:**
```typescript
interface ActivityResponse {
  data: CenterActivity[];
  success: boolean;
}

interface CenterActivity {
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
```

#### POST /api/center/clear-activity
Clear center activity history.

**Parameters:**
- `code` (string): Center ID

**Response:**
```typescript
interface ClearActivityResponse {
  success: boolean;
  message: string;
  cleared_count: number;
}
```

### Reports and Analytics

#### GET /api/center/reports
Generate center reports.

**Parameters:**
- `code` (string): Center ID
- `type` (string): Report type ('performance', 'territory', 'contractor', 'customer')
- `period` (optional): Time period for report
- `format` (optional): Output format ('json', 'csv', 'pdf')

**Response:**
```typescript
interface ReportResponse {
  data: {
    report_id: string;
    report_type: string;
    generated_at: string;
    period: string;
    data: any; // Report-specific data structure
  };
  success: boolean;
}
```

### Support and Escalation

#### POST /api/center/support/tickets
Create support ticket.

**Request Body:**
```typescript
interface CreateTicketRequest {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  territory_id?: string;
  contractor_id?: string;
  customer_id?: string;
}
```

## Error Handling

### Standard Error Response

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}
```

### Common Error Codes

- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid or missing authentication)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (center/territory/resource not found)
- `422` - Validation Error (invalid data format)
- `500` - Internal Server Error

## Rate Limiting

- **General API calls**: 1000 requests per hour per center
- **Report generation**: 10 requests per hour per center
- **Bulk operations**: 100 requests per hour per center

## API Utilities

### URL Builder

```typescript
export function buildCenterApiUrl(path: string, params: Record<string, any> = {}) {
  let url = CENTER_API_BASE + path;
  const searchParams = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      searchParams.set(k, String(v));
    }
  }
  const queryString = searchParams.toString();
  if (queryString) url += '?' + queryString;
  return url;
}
```

### Fetch Wrapper

```typescript
export async function centerApiFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  
  // Add required headers
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (!headers.has('x-hub-type')) headers.set('x-hub-type', 'center');
  
  // Add authentication headers if available
  const userId = getCenterClerkUserId();
  if (userId) {
    headers.set('x-center-user-id', userId);
    headers.set('x-user-id', userId);
  }
  
  const opts: RequestInit = { 
    credentials: 'include', 
    ...init, 
    headers 
  };
  
  return await fetch(input, opts);
}
```