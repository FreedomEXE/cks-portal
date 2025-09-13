# Customer Hub - Data Model

## Core Data Structures

### Customer Entity
```typescript
interface Customer {
  customer_id: string;           // CUS-XXX format
  name: string;                 // Customer name
  email: string;                // Contact email
  phone: string;                // Phone number
  address: Address;             // Primary address
  account_type: 'basic' | 'premium' | 'enterprise';
  member_since: string;         // Registration date
  total_orders: number;         // Order count
  satisfaction_rating: number;  // Average rating
  status: 'active' | 'inactive';
}
```

### Order Management
```typescript
interface CustomerOrder {
  order_id: string;             // ORD-XXX format
  customer_id: string;          // Reference to customer
  service_type: string;         // Requested service
  status: OrderStatus;          // Current status
  contractor_id?: string;       // Assigned contractor
  scheduled_date?: string;      // Service date
  total_cost: number;          // Order total
  payment_status: PaymentStatus;
}
```

### Service Requests
```typescript
interface ServiceRequest {
  request_id: string;
  customer_id: string;
  service_type: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  requested_date: string;
  estimated_cost?: number;
  quotes: Quote[];
}
```

---

*Customer data model documentation*