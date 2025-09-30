# Order System - Complete Design Document

## Overview
Comprehensive order management system with catalog integration, role-based workflows, multi-step approvals, and viewer-specific status presentation. Orders flow through defined approval chains based on type (product/service) and originating role.

## Core Concepts

### Order Types
1. **Product Orders** - Physical inventory requests flowing to warehouse
2. **Service Orders** - Service requests that eventually transform into services

### Status vs ViewerStatus
- **Status**: Canonical, immutable truth about order state
- **ViewerStatus**: Persona-specific view (pending = action needed, in-progress = visibility)

Note (2025-09-29): Admin Directory uses canonical `status` directly and a central policy to drive actions/labels. ViewerStatus remains for role-scoped hub UIs but will be reduced where it hides state transitions.

### Order Lifecycle
```
Customer/Center → Contractor → Manager → Crew/Warehouse → Completion
                ↓              ↓         ↓
            (approve)      (approve)  (fulfill)
                ↓              ↓         ↓
            (reject)       (reject)   (deliver)
```

## Database Schema

### Catalog Tables

#### Table: `catalog_products`
```sql
CREATE TABLE catalog_products (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_product_id(),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),

  -- Pricing & Units
  unit_price DECIMAL(10,2) NOT NULL,
  unit_type VARCHAR(50) NOT NULL, -- 'each', 'case', 'box', 'gallon', etc
  units_per_case INTEGER,
  minimum_order_quantity INTEGER DEFAULT 1,
  maximum_order_quantity INTEGER,

  -- Inventory
  current_stock INTEGER DEFAULT 0,
  reserved_stock INTEGER DEFAULT 0,
  reorder_point INTEGER,
  lead_time_days INTEGER,

  -- Attributes
  brand VARCHAR(100),
  manufacturer VARCHAR(100),
  color VARCHAR(50),
  size VARCHAR(50),
  weight_pounds DECIMAL(8,2),
  dimensions_inches VARCHAR(50), -- "LxWxH"

  -- Media
  image_url TEXT,
  thumbnail_url TEXT,
  spec_sheet_url TEXT,
  safety_data_sheet_url TEXT,

  -- Categorization
  tags TEXT[],
  search_keywords TEXT,
  is_hazmat BOOLEAN DEFAULT false,
  requires_training BOOLEAN DEFAULT false,

  -- Availability
  is_active BOOLEAN DEFAULT true,
  is_orderable BOOLEAN DEFAULT true,
  restricted_roles TEXT[], -- roles that cannot order this

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP,

  INDEX idx_products_sku (sku),
  INDEX idx_products_category (category, subcategory),
  INDEX idx_products_active (is_active, is_orderable),
  FULLTEXT INDEX idx_products_search (name, description, search_keywords)
);

-- ID generator
CREATE OR REPLACE FUNCTION gen_product_id()
RETURNS VARCHAR AS $$
BEGIN
  RETURN 'PRD-' || LPAD(nextval('product_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE product_seq START 1;
```

### Archive Support (Orders)
Orders support soft delete/restore/hard delete via archive fields on the base `orders` table and shared archive routes (`/api/archive/*`). Admin Directory lists exclude archived rows.

```sql
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS archived_by VARCHAR(50),
  ADD COLUMN IF NOT EXISTS archive_reason TEXT,
  ADD COLUMN IF NOT EXISTS deletion_scheduled TIMESTAMP,
  ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS restored_by VARCHAR(50);
```

#### Table: `catalog_services`
```sql
CREATE TABLE catalog_services (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_service_id(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  service_type VARCHAR(100) NOT NULL, -- 'cleaning', 'maintenance', 'installation', etc
  category VARCHAR(100) NOT NULL,

  -- Pricing
  pricing_model VARCHAR(50) NOT NULL, -- 'hourly', 'fixed', 'square_foot', 'per_unit'
  base_price DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  minimum_hours DECIMAL(4,2),
  estimated_hours DECIMAL(4,2),

  -- Requirements
  required_crew_count INTEGER DEFAULT 1,
  required_certifications TEXT[],
  required_equipment TEXT[],

  -- Scheduling
  lead_time_days INTEGER DEFAULT 1,
  duration_minutes INTEGER,
  recurring_available BOOLEAN DEFAULT false,
  frequency_options TEXT[], -- ['daily', 'weekly', 'monthly']

  -- Attributes
  difficulty_level VARCHAR(20), -- 'easy', 'medium', 'hard', 'expert'
  indoor_outdoor VARCHAR(20), -- 'indoor', 'outdoor', 'both'

  -- Media
  image_url TEXT,
  thumbnail_url TEXT,
  instruction_pdf_url TEXT,
  training_video_url TEXT,

  -- Availability
  is_active BOOLEAN DEFAULT true,
  is_orderable BOOLEAN DEFAULT true,
  available_roles TEXT[], -- which roles can order this service
  service_areas TEXT[], -- geographic/building areas where available

  -- Metadata
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP,

  INDEX idx_services_code (code),
  INDEX idx_services_type (service_type, category),
  INDEX idx_services_active (is_active, is_orderable),
  FULLTEXT INDEX idx_services_search (name, description)
);

-- ID generator
CREATE OR REPLACE FUNCTION gen_service_id()
RETURNS VARCHAR AS $$
BEGIN
  RETURN 'SRV-' || LPAD(nextval('service_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE service_seq START 1;
```

#### View: `catalog_items`
```sql
CREATE VIEW catalog_items AS
SELECT
  id,
  'product' as item_type,
  sku as code,
  name,
  description,
  category,
  subcategory,
  unit_price as price,
  unit_type,
  image_url,
  is_active,
  is_orderable,
  tags,
  created_at,
  updated_at
FROM catalog_products
UNION ALL
SELECT
  id,
  'service' as item_type,
  code,
  name,
  description,
  service_type as category,
  category as subcategory,
  base_price as price,
  pricing_model as unit_type,
  image_url,
  is_active,
  is_orderable,
  tags,
  created_at,
  updated_at
FROM catalog_services;
```

### Order Tables

#### Table: `orders`
```sql
CREATE TABLE orders (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_order_id(),
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('product', 'service')),

  -- Status Management
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  status_details TEXT,
  previous_status VARCHAR(50),
  status_changed_at TIMESTAMP,
  status_changed_by VARCHAR(50),

  -- Originator
  created_by VARCHAR(50) NOT NULL,
  created_by_role VARCHAR(50) NOT NULL,
  created_for VARCHAR(50), -- if creating on behalf of someone
  originating_entity_id VARCHAR(50), -- customer_id, center_id, etc
  originating_entity_type VARCHAR(50), -- 'customer', 'center', 'contractor'

  -- Approval Chain (denormalized for performance)
  current_actor_id VARCHAR(50),
  current_actor_role VARCHAR(50),
  next_actor_id VARCHAR(50),
  next_actor_role VARCHAR(50),
  contractor_id VARCHAR(50),
  contractor_approved_at TIMESTAMP,
  contractor_approved_by VARCHAR(50),
  manager_id VARCHAR(50),
  manager_approved_at TIMESTAMP,
  manager_approved_by VARCHAR(50),

  -- Assignment & Fulfillment
  assigned_to_id VARCHAR(50), -- crew_id or warehouse_id
  assigned_to_type VARCHAR(50), -- 'crew' or 'warehouse'
  assigned_at TIMESTAMP,
  assigned_by VARCHAR(50),

  -- Transformation (service orders → services)
  transformed_to_service_id VARCHAR(50),
  transformed_at TIMESTAMP,
  transformed_by VARCHAR(50),

  -- Order Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Scheduling
  requested_date DATE,
  requested_time_slot VARCHAR(50), -- 'morning', 'afternoon', 'evening'
  scheduled_date DATE,
  scheduled_start_time TIME,
  scheduled_end_time TIME,

  -- Completion
  completed_at TIMESTAMP,
  completed_by VARCHAR(50),
  completion_notes TEXT,
  completion_signature_url TEXT,

  -- Delivery (for product orders)
  delivery_address TEXT,
  delivery_contact_name VARCHAR(255),
  delivery_contact_phone VARCHAR(50),
  delivery_instructions TEXT,
  delivered_at TIMESTAMP,
  delivered_by VARCHAR(50),
  delivery_signature_url TEXT,

  -- Financial
  estimated_total DECIMAL(10,2),
  actual_total DECIMAL(10,2),
  tax_amount DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  payment_status VARCHAR(50),
  invoice_number VARCHAR(100),

  -- Metadata
  tags TEXT[],
  attachments JSONB DEFAULT '[]',
  custom_fields JSONB DEFAULT '{}',
  internal_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP,

  -- Indexes
  INDEX idx_orders_status (status),
  INDEX idx_orders_type_status (order_type, status),
  INDEX idx_orders_created_by (created_by, created_at DESC),
  INDEX idx_orders_current_actor (current_actor_id, status),
  INDEX idx_orders_assigned_to (assigned_to_id, assigned_to_type),
  INDEX idx_orders_dates (requested_date, scheduled_date),
  INDEX idx_orders_contractor (contractor_id, status),
  INDEX idx_orders_manager (manager_id, status)
);

-- ID generator
CREATE OR REPLACE FUNCTION gen_order_id()
RETURNS VARCHAR AS $$
BEGIN
  RETURN 'ORD-' || LPAD(nextval('order_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE order_seq START 1;
```

#### Table: `order_items`
```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- Catalog Reference
  catalog_item_id VARCHAR(50) NOT NULL,
  catalog_item_type VARCHAR(20) NOT NULL, -- 'product' or 'service'

  -- Snapshot of catalog data at order time
  item_name VARCHAR(255) NOT NULL,
  item_sku VARCHAR(100),
  item_description TEXT,
  unit_price DECIMAL(10,2) NOT NULL,
  unit_type VARCHAR(50),

  -- Quantity & Totals
  quantity DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  total DECIMAL(10,2) NOT NULL,

  -- Fulfillment
  quantity_fulfilled DECIMAL(10,2) DEFAULT 0,
  quantity_cancelled DECIMAL(10,2) DEFAULT 0,
  fulfilled_at TIMESTAMP,

  -- Notes
  special_instructions TEXT,
  fulfillment_notes TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_order_items_order (order_id),
  INDEX idx_order_items_catalog (catalog_item_id, catalog_item_type)
);
```

#### Table: `order_status_history`
```sql
CREATE TABLE order_status_history (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- Status Change
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  reason TEXT,

  -- Actor
  changed_by VARCHAR(50) NOT NULL,
  changed_by_role VARCHAR(50) NOT NULL,
  changed_by_name VARCHAR(255),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_status_history_order (order_id, created_at DESC)
);
```

#### Table: `order_comments`
```sql
CREATE TABLE order_comments (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- Comment
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,

  -- Author
  author_id VARCHAR(50) NOT NULL,
  author_role VARCHAR(50) NOT NULL,
  author_name VARCHAR(255) NOT NULL,

  -- Reply Threading
  parent_comment_id INTEGER REFERENCES order_comments(id),

  -- Attachments
  attachments JSONB DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMP,

  INDEX idx_comments_order (order_id, created_at)
);
```

## Backend API Structure

### File: `apps/backend/server/domains/catalog/types.ts`
```typescript
export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  unitPrice: number;
  unitType: string;
  unitsPerCase?: number;
  minimumOrderQuantity: number;
  currentStock: number;
  imageUrl?: string;
  tags: string[];
  isActive: boolean;
  isOrderable: boolean;
  restrictedRoles?: string[];
}

export interface CatalogService {
  id: string;
  code: string;
  name: string;
  description?: string;
  serviceType: string;
  category: string;
  pricingModel: 'hourly' | 'fixed' | 'square_foot' | 'per_unit';
  basePrice?: number;
  hourlyRate?: number;
  estimatedHours?: number;
  requiredCrewCount: number;
  leadTimeDays: number;
  isActive: boolean;
  isOrderable: boolean;
  availableRoles?: string[];
}

export interface CatalogItem {
  id: string;
  itemType: 'product' | 'service';
  code: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  price: number;
  unitType: string;
  imageUrl?: string;
  isActive: boolean;
  isOrderable: boolean;
  tags: string[];
}
```

### File: `apps/backend/server/domains/orders/types.ts`
```typescript
export interface Order {
  id: string;
  orderType: 'product' | 'service';
  status: OrderStatus;
  statusDetails?: string;

  // Viewer-specific computed field
  viewerStatus?: ViewerStatus;

  // Origin
  createdBy: string;
  createdByRole: string;
  originatingEntityId?: string;
  originatingEntityType?: string;

  // Approval chain
  currentActorId?: string;
  currentActorRole?: string;
  nextActorId?: string;
  nextActorRole?: string;
  contractorId?: string;
  managerId?: string;

  // Assignment
  assignedToId?: string;
  assignedToType?: 'crew' | 'warehouse';

  // Transformation
  transformedToServiceId?: string;

  // Details
  title: string;
  description?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  items: OrderItem[];

  // Scheduling
  requestedDate?: Date;
  scheduledDate?: Date;

  // Financial
  estimatedTotal: number;
  actualTotal?: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: number;
  catalogItemId: string;
  catalogItemType: 'product' | 'service';
  itemName: string;
  itemSku?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  total: number;
}

export type OrderStatus =
  | 'draft'
  | 'pending'
  | 'pending_contractor'
  | 'pending_manager'
  | 'pending_assignment'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'delivered'
  | 'cancelled'
  | 'rejected';

export type ViewerStatus =
  | 'pending'      // Yellow - action needed
  | 'in_progress'  // Blue - visibility
  | 'completed'    // Green - done
  | 'rejected'     // Red - denied
  | 'cancelled';   // Gray - cancelled
```

### File: `apps/backend/server/domains/catalog/routes.fastify.ts`
```typescript
// Public endpoints (all authenticated users)
GET    /api/catalog/items                 - List all items (with filters)
GET    /api/catalog/products              - List products
GET    /api/catalog/products/:id          - Get product details
GET    /api/catalog/services              - List services
GET    /api/catalog/services/:id          - Get service details
GET    /api/catalog/search                - Full-text search

// Admin endpoints
POST   /api/admin/catalog/products        - Create product
PUT    /api/admin/catalog/products/:id    - Update product
DELETE /api/admin/catalog/products/:id    - Archive product
POST   /api/admin/catalog/services        - Create service
PUT    /api/admin/catalog/services/:id    - Update service
DELETE /api/admin/catalog/services/:id    - Archive service
POST   /api/admin/catalog/import          - Bulk import from CSV
```

### File: `apps/backend/server/domains/orders/routes.fastify.ts`
```typescript
// User endpoints (role-based access)
POST   /api/orders                        - Create order
GET    /api/orders                        - List orders (filtered by role/permissions)
GET    /api/orders/:id                    - Get order details
PUT    /api/orders/:id                    - Update order (limited fields)
POST   /api/orders/:id/cancel             - Cancel order
POST   /api/orders/:id/comments           - Add comment

// Approval endpoints
POST   /api/orders/:id/approve            - Approve order (contractor/manager)
POST   /api/orders/:id/reject             - Reject order with reason
POST   /api/orders/:id/assign             - Assign to crew/warehouse

// Fulfillment endpoints
POST   /api/orders/:id/start              - Mark as in progress
POST   /api/orders/:id/complete           - Mark as completed
POST   /api/orders/:id/deliver            - Mark as delivered (products)

// Service transformation
POST   /api/orders/:id/transform-to-service - Convert service order to service

// Admin endpoints
GET    /api/admin/orders                  - List all orders (no filtering)
GET    /api/admin/orders/stats            - Order statistics
PUT    /api/admin/orders/:id              - Update any field
DELETE /api/admin/orders/:id              - Hard delete order
```

### File: `apps/backend/server/domains/orders/service.ts`
```typescript
export class OrderService {
  /**
   * Compute viewer-specific status based on role and position in workflow
   */
  computeViewerStatus(
    order: Order,
    viewerRole: string,
    viewerId: string
  ): ViewerStatus {
    // Terminal states pass through
    if (['cancelled', 'rejected'].includes(order.status)) {
      return order.status as ViewerStatus;
    }

    if (['completed', 'delivered'].includes(order.status)) {
      return 'completed';
    }

    // Check if viewer is the next actor
    if (order.nextActorId === viewerId || order.currentActorRole === viewerRole) {
      return 'pending'; // Yellow - action needed
    }

    // Default to in-progress for visibility
    return 'in_progress'; // Blue - FYI
  }

  /**
   * Determine next actor in approval chain
   */
  determineNextActor(order: Order): { id?: string; role?: string } {
    switch (order.status) {
      case 'pending':
        // Customer/Center orders go to their contractor
        if (['customer', 'center'].includes(order.createdByRole)) {
          return {
            id: order.originatingEntityId, // contractor_id from relationship
            role: 'contractor'
          };
        }
        // Others go directly to manager
        return { role: 'manager' };

      case 'pending_contractor':
        return { role: 'manager' };

      case 'pending_manager':
        // Service orders go to crew, product orders to warehouse
        return {
          role: order.orderType === 'service' ? 'crew' : 'warehouse'
        };

      default:
        return {};
    }
  }

  /**
   * Validate if user can perform action on order
   */
  canUserActOnOrder(
    order: Order,
    userId: string,
    userRole: string,
    action: string
  ): boolean {
    switch (action) {
      case 'approve':
        return order.nextActorId === userId || order.currentActorRole === userRole;

      case 'reject':
        return ['contractor', 'manager', 'admin'].includes(userRole) &&
               (order.nextActorId === userId || order.currentActorRole === userRole);

      case 'cancel':
        return order.createdBy === userId || userRole === 'admin';

      case 'assign':
        return userRole === 'manager' && order.status === 'pending_manager';

      case 'complete':
        return order.assignedToId === userId && order.status === 'assigned';

      default:
        return false;
    }
  }
}
```

## Frontend Integration

### File: `apps/frontend/src/shared/api/catalog.ts`
```typescript
// Catalog hooks
export const useCatalogItems = (filters?: CatalogFilters) => {
  return useSWR(`/api/catalog/items?${buildQuery(filters)}`);
};

export const useCatalogProduct = (id: string) => {
  return useSWR(`/api/catalog/products/${id}`);
};

export const useCatalogService = (id: string) => {
  return useSWR(`/api/catalog/services/${id}`);
};

export const useCatalogSearch = (query: string) => {
  return useSWR(`/api/catalog/search?q=${query}`);
};
```

### File: `apps/frontend/src/shared/api/orders.ts`
```typescript
// Order hooks
export const useCreateOrder = () => {
  return useSWRMutation('/api/orders', postRequest);
};

export const useMyOrders = (filters?: OrderFilters) => {
  return useSWR(`/api/orders?${buildQuery(filters)}`);
};

export const useOrderDetails = (id: string) => {
  return useSWR(`/api/orders/${id}`);
};

export const useApproveOrder = () => {
  return useSWRMutation((id: string) => `/api/orders/${id}/approve`, postRequest);
};

export const useRejectOrder = () => {
  return useSWRMutation((id: string) => `/api/orders/${id}/reject`, postRequest);
};
```

### Order Creation Flow Component
```typescript
// apps/frontend/src/components/OrderBuilder.tsx
export const OrderBuilder = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'product' | 'service'>();
  const { data: catalogItems } = useCatalogItems({ type: orderType });
  const createOrder = useCreateOrder();

  const handleSubmit = async () => {
    const orderData = {
      orderType,
      title: generateTitle(cart),
      items: cart.map(item => ({
        catalogItemId: item.id,
        catalogItemType: item.itemType,
        quantity: item.quantity,
        unitPrice: item.price
      })),
      requestedDate: form.requestedDate,
      priority: form.priority,
      description: form.description
    };

    await createOrder.trigger(orderData);
  };

  // Render catalog grid, cart sidebar, submission form
};
```

## User Flows & Edge Cases

### Product Order Flow (Crew requests supplies)
1. **Initiation**: Crew clicks "Request Products" in CrewHub
2. **Catalog Browse**:
   - Filter by category (cleaning, safety, equipment)
   - Search by name/SKU
   - Check stock availability
3. **Cart Building**:
   - Add items with quantities
   - Validate minimum order quantities
   - Calculate estimated total
4. **Order Submission**:
   - Add delivery instructions
   - Set requested date
   - Submit creates order with status='pending_manager'
5. **Manager Review**:
   - Sees yellow "pending" badge
   - Reviews items and quantities
   - Can approve, reject, or modify
6. **Warehouse Processing**:
   - Receives approved order
   - Picks and packs items
   - Updates inventory
   - Marks as delivered
7. **Edge Cases**:
   - Out of stock: Show backorder option or substitutes
   - Quantity limits: Enforce max order quantities
   - Rush orders: High priority bypasses some approvals
   - Partial fulfillment: Track fulfilled vs ordered quantities

### Service Order Flow (Customer requests cleaning)
1. **Initiation**: Customer clicks "Request Service"
2. **Service Selection**:
   - Browse service catalog
   - Filter by type (regular, deep clean, special)
   - View estimated hours and pricing
3. **Configuration**:
   - Select service date/time
   - Add special instructions
   - Attach floor plans or photos
4. **Contractor Review**:
   - Sees yellow "pending" badge
   - Reviews service details
   - Validates capability to fulfill
   - Approves → status='pending_manager'
5. **Manager Assignment**:
   - Reviews approved service
   - Assigns to available crew
   - Transforms to service entity
6. **Crew Execution**:
   - Accepts assignment
   - Performs service
   - Marks complete with notes/photos
7. **Edge Cases**:
   - No available crew: Queue for later assignment
   - Recurring services: Auto-generate future orders
   - Service modifications: Version tracking
   - Weather delays: Automatic rescheduling

### Approval Chain Logic
```
CUSTOMER → CONTRACTOR → MANAGER → CREW
CENTER → CONTRACTOR → MANAGER → CREW
CREW → MANAGER → WAREHOUSE
CONTRACTOR → MANAGER → CREW/WAREHOUSE
MANAGER → (direct) → CREW/WAREHOUSE
```

### Status Transition Rules
```typescript
const validTransitions = {
  'draft': ['pending', 'cancelled'],
  'pending': ['pending_contractor', 'pending_manager', 'rejected', 'cancelled'],
  'pending_contractor': ['pending_manager', 'rejected', 'cancelled'],
  'pending_manager': ['assigned', 'rejected', 'cancelled'],
  'assigned': ['in_progress', 'cancelled'],
  'in_progress': ['completed', 'cancelled'],
  'completed': ['delivered'], // products only
  'delivered': [],
  'rejected': ['pending'], // allow retry
  'cancelled': []
};
```

## Real-time Updates

### WebSocket Events
```typescript
// Order events
'order:created' - New order in system
'order:updated' - Status or details changed
'order:assigned' - Order assigned to user
'order:commented' - New comment added

// Catalog events
'catalog:updated' - Price or availability changed
'catalog:new_item' - New product/service added

// Subscribe based on role
io.on('connect', () => {
  // Users see their own orders
  socket.join(`user:${userId}`);

  // Contractors see their customer orders
  if (role === 'contractor') {
    socket.join(`contractor:${contractorId}`);
  }

  // Managers see all pending approvals
  if (role === 'manager') {
    socket.join('approvals:manager');
  }

  // Warehouse sees product orders
  if (role === 'warehouse') {
    socket.join('orders:products');
  }
});
```

## Cart & Catalog Features

### Shopping Cart Persistence
```typescript
// Use localStorage + context for cart
const CartContext = createContext<{
  items: CartItem[];
  addItem: (item: CatalogItem, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  total: number;
}>();

// Persist to localStorage
useEffect(() => {
  localStorage.setItem('orderCart', JSON.stringify(cart));
}, [cart]);
```

### Catalog Search & Filters
```typescript
interface CatalogFilters {
  type?: 'product' | 'service';
  category?: string;
  subcategory?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  tags?: string[];
  sortBy?: 'name' | 'price' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
```

## Implementation Strategy

### Phase 1: Catalog Foundation (Week 1)
1. Create catalog tables and migrations
2. Seed sample products and services
3. Build catalog API endpoints
4. Create catalog browsing UI
5. Implement search and filtering

### Phase 2: Order Creation (Week 1-2)
1. Create order tables and migrations
2. Build order creation API
3. Implement shopping cart
4. Create order builder UI
5. Connect to catalog

### Phase 3: Approval Workflow (Week 2)
1. Implement status transition logic
2. Build approval/rejection APIs
3. Add viewer status computation
4. Update hub UIs with actions
5. Add email notifications

### Phase 4: Fulfillment (Week 3)
1. Assignment logic
2. Crew/warehouse actions
3. Completion tracking
4. Delivery management
5. Service transformation

### Phase 5: Polish & Testing (Week 4)
1. Real-time updates
2. Performance optimization
3. Comprehensive testing
4. Documentation
5. Edge case handling

## Security & Validation

### Role-Based Access Control
```typescript
// Middleware to check order access
const checkOrderAccess = (req, res, next) => {
  const { orderId } = req.params;
  const { userId, role } = req.user;

  const order = await getOrder(orderId);

  // Check ownership or role permissions
  if (order.createdBy === userId ||
      order.assignedToId === userId ||
      ['admin', 'manager'].includes(role) ||
      (role === 'contractor' && order.contractorId === userId)) {
    next();
  } else {
    res.status(403).send('Access denied');
  }
};
```

### Input Validation
```typescript
const createOrderSchema = {
  orderType: Joi.string().valid('product', 'service').required(),
  title: Joi.string().max(255).required(),
  description: Joi.string().max(1000),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent'),
  items: Joi.array().items({
    catalogItemId: Joi.string().required(),
    quantity: Joi.number().positive().required()
  }).min(1).required(),
  requestedDate: Joi.date().min('now')
};
```

## Performance Considerations

### Database Optimizations
1. **Denormalize** approval chain in orders table for fast queries
2. **Materialize** viewer status in a view for each role
3. **Partition** orders table by created_at for historical data
4. **Cache** catalog data with Redis (changes infrequently)
5. **Index** all foreign keys and filter columns

### API Optimizations
1. **Pagination** on all list endpoints (default 20 items)
2. **Projection** to return only needed fields
3. **Batch** operations for bulk updates
4. **Queue** heavy operations (PDF generation, bulk emails)
5. **CDN** for catalog images

## Monitoring & Analytics

### Key Metrics
- Orders created per day/week/month by type
- Average approval time per step
- Rejection rate by role
- Most ordered products/services
- Order value distribution
- Fulfillment time (order to delivery)
- Cart abandonment rate
- Catalog browse to order conversion

### Dashboards
1. **Operations**: Real-time order flow, bottlenecks
2. **Inventory**: Stock levels, reorder alerts
3. **Financial**: Order values, trends
4. **Performance**: API latency, database queries
5. **User Behavior**: Popular items, search terms

## Testing Strategy

### Unit Tests
```typescript
describe('OrderService', () => {
  test('computeViewerStatus returns pending for next actor', () => {
    const order = {
      status: 'pending_manager',
      nextActorRole: 'manager'
    };
    const status = service.computeViewerStatus(order, 'manager', 'MGR-001');
    expect(status).toBe('pending');
  });
});
```

### Integration Tests
- API endpoints with real database
- Approval chain flow
- Catalog to order flow
- WebSocket event delivery

### E2E Tests
```typescript
test('Customer creates service order through to completion', async () => {
  // 1. Customer browses catalog
  // 2. Adds service to cart
  // 3. Submits order
  // 4. Contractor approves
  // 5. Manager assigns to crew
  // 6. Crew completes service
  // 7. Customer sees completed status
});
```

## Migration Path

### From Current Mock Data
1. Keep existing UI components
2. Replace mock data calls with real API hooks
3. Migrate existing orders to new schema
4. Gradually enable features by role
5. Monitor and fix issues

## Open Questions & Decisions Needed

1. **Pricing**: How are prices calculated? Markups? Discounts?
2. **Inventory**: Real-time stock tracking or periodic updates?
3. **Notifications**: Email only or SMS/push too?
4. **Recurring Orders**: Built-in or separate system?
5. **Payments**: When/how is payment processed?
6. **SLA**: Service level agreements for approval times?
7. **Audit Trail**: How long to retain order history?
8. **Multi-location**: Orders across different sites?

## Related Systems to Consider

1. **Inventory Management** - Stock levels affect orderable items
2. **Service Management** - Service orders become service entities
3. **Reporting System** - Orders feed analytics
4. **Notification System** - Email/SMS for status changes
5. **Payment System** - Future integration point
6. **Document Generation** - POs, invoices, receipts
