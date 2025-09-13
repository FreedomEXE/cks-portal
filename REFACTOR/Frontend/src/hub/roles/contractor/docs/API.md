# Contractor Hub - API Documentation

## Base Configuration

### Endpoints
- **Base URL**: `/api/contractor`
- **Environment Variable**: `VITE_CONTRACTOR_API_URL`
- **Authentication**: Header-based with `x-contractor-user-id`

### API Client
```typescript
import { buildContractorApiUrl, contractorApiFetch } from './utils/contractorApi';

// Build URL with parameters
const url = buildContractorApiUrl('/profile', { code: 'CON-001' });

// Make authenticated request
const response = await contractorApiFetch(url);
const data = await response.json();
```

## Core Endpoints

### Profile Management

#### Get Contractor Profile
```http
GET /api/contractor/profile?code=CON-001
Headers:
  x-contractor-user-id: CON-001
  Accept: application/json
```

**Response:**
```json
{
  "contractor_id": "CON-001",
  "name": "ABC Construction",
  "email": "contact@abc-construction.com",
  "phone": "(555) 123-4567",
  "business_type": "LLC",
  "license_number": "LIC-12345",
  "services": ["roofing", "siding", "gutters"],
  "service_areas": ["Metro Area", "Suburbs"],
  "rating": 4.8,
  "total_orders": 156,
  "status": "active"
}
```

#### Update Contractor Profile
```http
PUT /api/contractor/profile
Content-Type: application/json

{
  "name": "ABC Construction Co",
  "phone": "(555) 123-4568",
  "services": ["roofing", "siding", "gutters", "windows"]
}
```

### Order Management

#### Get Active Orders
```http
GET /api/contractor/orders?status=active&limit=10
```

**Response:**
```json
{
  "data": [
    {
      "order_id": "ORD-001",
      "customer_name": "John Smith",
      "service_type": "roofing",
      "status": "assigned",
      "priority": "high",
      "scheduled_date": "2025-01-15",
      "address": "123 Main St, City, State",
      "estimated_value": 2500.00,
      "requirements": "Replace damaged shingles"
    }
  ],
  "total": 5,
  "page": 1
}
```

#### Update Order Status
```http
PUT /api/contractor/orders/ORD-001/status
Content-Type: application/json

{
  "status": "in_progress",
  "notes": "Started work on site",
  "photos": ["photo1.jpg", "photo2.jpg"]
}
```

### Activity & Analytics

#### Get Recent Activity
```http
GET /api/contractor/activity?limit=5
```

**Response:**
```json
{
  "data": [
    {
      "activity_id": "act-001",
      "description": "Order ORD-001 assigned",
      "activity_type": "order_assigned",
      "created_at": "2025-01-12T10:30:00Z",
      "metadata": {
        "order_id": "ORD-001",
        "action_link": true
      }
    }
  ]
}
```

#### Clear Activity History
```http
POST /api/contractor/clear-activity
```

#### Get Performance Metrics
```http
GET /api/contractor/metrics?period=30d
```

**Response:**
```json
{
  "completion_rate": 98.5,
  "average_rating": 4.8,
  "total_earnings": 15750.00,
  "orders_completed": 12,
  "on_time_percentage": 95.0,
  "customer_satisfaction": 4.9
}
```

### Service Management

#### Get Service Catalog
```http
GET /api/contractor/services
```

#### Update Service Offerings
```http
PUT /api/contractor/services
Content-Type: application/json

{
  "services": [
    {
      "service_type": "roofing",
      "base_price": 150.00,
      "per_hour": true,
      "available": true
    }
  ]
}
```

## Authentication

### Headers Required
```typescript
const headers = {
  'x-contractor-user-id': contractorId,
  'x-user-id': contractorId,
  'x-user-role': 'contractor',
  'x-hub-type': 'contractor',
  'Accept': 'application/json'
};
```

### Session Management
```typescript
// Get session data
const session = getContractorSession();

// Set session data
setContractorSession('CON-001', 'ABC Construction');

// Clear session
clearContractorSession();
```

## Error Handling

### Standard Error Responses
```json
{
  "error": "Order not found",
  "code": "ORDER_NOT_FOUND",
  "details": {
    "order_id": "ORD-999"
  }
}
```

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Server Error

### Error Recovery
```typescript
try {
  const response = await contractorApiFetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.json();
} catch (error) {
  // Fallback to mock data in development
  if (isDevelopment && isNetworkError(error)) {
    return getMockContractorData();
  }
  throw error;
}
```

## Rate Limiting

- **General Endpoints**: 100 requests per minute
- **Update Operations**: 10 requests per minute
- **File Uploads**: 5 requests per minute

## WebSocket Events (Future)

### Real-time Order Updates
```typescript
const ws = new WebSocket('/ws/contractor/CON-001');

ws.on('order_assigned', (data) => {
  // Handle new order assignment
});

ws.on('order_status_changed', (data) => {
  // Handle order status updates
});
```

---

*API documentation for Contractor hub integration*