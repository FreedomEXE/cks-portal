# Services View System - Complete Design Document

## Overview
The Services tab provides role-specific views of service data across the CKS ecosystem. This is a **read-only viewing system** that displays different service information based on the user's role. Services are created from approved service orders and then displayed in various contexts - there is no approval or assignment logic here.

## Core Concepts

### What Services Are
- **Services** are entities created automatically when service orders are approved
- They represent ongoing or completed work in the system
- Different roles see different aspects of services based on their relationship

### Role-Based Views

#### Manager View
- **My Services**: Services they are certified/trained in
- **Active Services**: Services currently being managed
- **Service History**: Completed/archived services

#### Crew View
- **Active Services**: Currently assigned services
- **Service History**: Completed services archive

#### Customer View
- **My Services**: Services requested/received
- **Service History**: Past services

#### Contractor View
- **My Services**: Services for their customers
- **Service History**: Historical services

#### Warehouse View
- **Active Services**: Services requiring materials/support
- **Service History**: Completed services

## Database Schema

### Table: `services`
```sql
CREATE TABLE services (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_service_id(),

  -- Service Identity
  code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  type VARCHAR(100), -- 'cleaning', 'maintenance', 'installation', etc

  -- Origin
  source_order_id VARCHAR(50) REFERENCES orders(id),
  created_from_order BOOLEAN DEFAULT true,

  -- Status (simple, no complex workflow)
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'archived', 'cancelled'

  -- Relationships
  customer_id VARCHAR(50),
  customer_name VARCHAR(255),
  contractor_id VARCHAR(50),
  contractor_name VARCHAR(255),
  center_id VARCHAR(50),
  center_name VARCHAR(255),
  assigned_crew_id VARCHAR(50),
  assigned_crew_name VARCHAR(255),
  managing_manager_id VARCHAR(50),
  managing_manager_name VARCHAR(255),

  -- Service Details
  location_address TEXT,
  location_name VARCHAR(255),
  scheduled_date DATE,
  start_date DATE,
  end_date DATE,
  completion_date DATE,

  -- Training/Certification (for manager view)
  requires_certification BOOLEAN DEFAULT false,
  certification_type VARCHAR(100),

  -- Metadata
  notes TEXT,
  tags TEXT[],
  priority VARCHAR(20) DEFAULT 'normal',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP,

  -- Indexes for filtering
  INDEX idx_services_status (status),
  INDEX idx_services_customer (customer_id, status),
  INDEX idx_services_contractor (contractor_id, status),
  INDEX idx_services_center (center_id, status),
  INDEX idx_services_crew (assigned_crew_id, status),
  INDEX idx_services_manager (managing_manager_id, status),
  INDEX idx_services_dates (scheduled_date, start_date),
  INDEX idx_services_category (category, type)
);

-- ID generator
CREATE OR REPLACE FUNCTION gen_service_id()
RETURNS VARCHAR AS $$
BEGIN
  RETURN 'SVC-' || LPAD(nextval('service_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE service_seq START 1;
```

### Table: `manager_certifications`
```sql
CREATE TABLE manager_certifications (
  id SERIAL PRIMARY KEY,
  manager_id VARCHAR(50) NOT NULL,
  service_code VARCHAR(100) NOT NULL,
  service_name VARCHAR(255) NOT NULL,

  -- Certification Details
  certified BOOLEAN DEFAULT false,
  can_train BOOLEAN DEFAULT false,
  certification_date DATE,
  expiration_date DATE,
  certification_level VARCHAR(50), -- 'basic', 'advanced', 'expert'

  -- Training
  trained_by VARCHAR(50),
  training_hours INTEGER,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(manager_id, service_code),
  INDEX idx_cert_manager (manager_id, certified),
  INDEX idx_cert_expiration (expiration_date)
);
```

## Backend API Structure

### File: `apps/backend/server/domains/services/types.ts`
```typescript
// Base service type
export interface Service {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  type?: string;
  status: 'active' | 'completed' | 'archived' | 'cancelled';

  // Relationships
  customerId?: string;
  customerName?: string;
  contractorId?: string;
  contractorName?: string;
  centerId?: string;
  centerName?: string;
  assignedCrewId?: string;
  assignedCrewName?: string;
  managingManagerId?: string;
  managingManagerName?: string;

  // Details
  locationAddress?: string;
  locationName?: string;
  scheduledDate?: Date;
  startDate?: Date;
  endDate?: Date;
  completionDate?: Date;

  // Metadata
  priority?: string;
  notes?: string;
  tags?: string[];

  createdAt: Date;
  updatedAt: Date;
}

// Manager-specific view includes certification
export interface ManagerServiceView extends Service {
  certified: boolean;
  canTrain: boolean;
  certificationDate?: Date;
  certificationExpires?: Date;
}

// Crew-specific view includes assignment details
export interface CrewServiceView extends Service {
  assignmentDate?: Date;
  expectedDuration?: number;
  actualDuration?: number;
  completionNotes?: string;
}

// Customer-specific view includes satisfaction
export interface CustomerServiceView extends Service {
  satisfactionRating?: number;
  feedback?: string;
  invoiceNumber?: string;
  cost?: number;
}
```

### File: `apps/backend/server/domains/services/routes.fastify.ts`
```typescript
// Service viewing endpoints (all read-only)
GET /api/services                    - List services (filtered by role)
GET /api/services/:id                - Get service details
GET /api/services/stats              - Service statistics for dashboard

// Role-specific endpoints
GET /api/services/manager/my         - Manager's certified services
GET /api/services/manager/active     - Services manager oversees
GET /api/services/manager/history    - Manager's service history

GET /api/services/crew/active        - Crew's assigned services
GET /api/services/crew/history       - Crew's completed services

GET /api/services/customer/my        - Customer's services
GET /api/services/customer/history   - Customer's service history

GET /api/services/contractor/my      - Contractor's customer services
GET /api/services/contractor/history - Contractor's service history

// Search and filter
GET /api/services/search             - Search services
GET /api/services/filter             - Advanced filtering
```

### File: `apps/backend/server/domains/services/service.ts`
```typescript
export class ServiceService {
  /**
   * Get services based on user role and permissions
   */
  async getServicesForUser(
    userId: string,
    role: string,
    filter?: ServiceFilter
  ): Promise<Service[]> {
    switch (role) {
      case 'manager':
        return this.getManagerServices(userId, filter);

      case 'crew':
        return this.getCrewServices(userId, filter);

      case 'customer':
        return this.getCustomerServices(userId, filter);

      case 'contractor':
        return this.getContractorServices(userId, filter);

      case 'warehouse':
        return this.getWarehouseServices(userId, filter);

      case 'admin':
        return this.getAllServices(filter);

      default:
        return [];
    }
  }

  /**
   * Get manager-specific service views
   */
  async getManagerServices(
    managerId: string,
    filter?: ServiceFilter
  ): Promise<ManagerServiceView[]> {
    // Get base services
    const services = await this.repository.getServicesByManager(managerId, filter);

    // Get certifications
    const certifications = await this.repository.getManagerCertifications(managerId);
    const certMap = new Map(certifications.map(c => [c.serviceCode, c]));

    // Merge certification data
    return services.map(service => ({
      ...service,
      certified: certMap.get(service.code)?.certified || false,
      canTrain: certMap.get(service.code)?.canTrain || false,
      certificationDate: certMap.get(service.code)?.certificationDate,
      certificationExpires: certMap.get(service.code)?.expirationDate,
    }));
  }

  /**
   * Transform order to service when approved
   */
  async createServiceFromOrder(orderId: string): Promise<Service> {
    const order = await this.orderService.getOrder(orderId);

    // Only service orders become services
    if (order.orderType !== 'service') {
      throw new Error('Only service orders can become services');
    }

    // Extract service details from order
    const service: Partial<Service> = {
      code: order.items[0]?.catalogItemId || 'UNKNOWN',
      name: order.items[0]?.itemName || order.title,
      description: order.description,
      category: order.items[0]?.category,
      type: this.determineServiceType(order),
      status: 'active',
      sourceOrderId: orderId,

      // Relationships from order
      customerId: order.originatingEntityId,
      customerName: order.originatingEntityName,
      contractorId: order.contractorId,
      centerId: order.centerId,
      managingManagerId: order.managerId,

      // Details
      locationAddress: order.deliveryAddress,
      scheduledDate: order.requestedDate,
      priority: order.priority,
      notes: order.internalNotes,
    };

    return await this.repository.createService(service);
  }

  /**
   * Get service statistics for dashboards
   */
  async getServiceStats(userId: string, role: string): Promise<ServiceStats> {
    const baseFilter = this.getBaseFilterForRole(userId, role);

    const [active, completed, thisMonth, lastMonth] = await Promise.all([
      this.repository.countServices({ ...baseFilter, status: 'active' }),
      this.repository.countServices({ ...baseFilter, status: 'completed' }),
      this.repository.countServices({
        ...baseFilter,
        createdAfter: startOfMonth(new Date())
      }),
      this.repository.countServices({
        ...baseFilter,
        createdAfter: startOfMonth(subMonths(new Date(), 1)),
        createdBefore: startOfMonth(new Date())
      }),
    ]);

    return {
      activeCount: active,
      completedCount: completed,
      thisMonthCount: thisMonth,
      lastMonthCount: lastMonth,
      percentChange: lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0,
    };
  }
}
```

## Frontend Integration

### File: `apps/frontend/src/shared/api/services.ts`
```typescript
// Service viewing hooks
export const useServices = (filter?: ServiceFilter) => {
  return useSWR(`/api/services?${buildQuery(filter)}`);
};

export const useServiceDetails = (id: string) => {
  return useSWR(`/api/services/${id}`);
};

// Role-specific hooks
export const useManagerServices = (type: 'my' | 'active' | 'history') => {
  return useSWR(`/api/services/manager/${type}`);
};

export const useCrewServices = (type: 'active' | 'history') => {
  return useSWR(`/api/services/crew/${type}`);
};

export const useCustomerServices = (type: 'my' | 'history') => {
  return useSWR(`/api/services/customer/${type}`);
};

export const useServiceStats = () => {
  return useSWR('/api/services/stats');
};
```

### Service View Components

#### Manager Services View
```typescript
// Shows certifications and training capabilities
const ManagerServicesView = () => {
  const [tab, setTab] = useState<'my' | 'active' | 'history'>('my');
  const { data: services } = useManagerServices(tab);

  const columns = {
    my: [
      { key: 'serviceId', label: 'SERVICE ID' },
      { key: 'serviceName', label: 'SERVICE NAME' },
      { key: 'certified', label: 'CERTIFIED', render: (v) => v ? 'Yes' : 'No' },
      { key: 'certificationDate', label: 'CERTIFICATION DATE' },
      { key: 'expires', label: 'EXPIRES' },
    ],
    active: [
      { key: 'serviceId', label: 'SERVICE ID' },
      { key: 'serviceName', label: 'SERVICE NAME' },
      { key: 'centerId', label: 'CENTER ID' },
      { key: 'type', label: 'TYPE' },
      { key: 'startDate', label: 'START DATE' },
    ],
    history: [
      { key: 'serviceId', label: 'SERVICE ID' },
      { key: 'serviceName', label: 'SERVICE NAME' },
      { key: 'status', label: 'STATUS' },
      { key: 'completionDate', label: 'COMPLETED' },
    ]
  };

  return (
    <TabSection
      tabs={[
        { id: 'my', label: 'My Services', count: services?.my?.length },
        { id: 'active', label: 'Active Services', count: services?.active?.length },
        { id: 'history', label: 'Service History', count: services?.history?.length },
      ]}
      description={
        tab === 'my' ? 'Services you are certified in and qualified to train' :
        tab === 'active' ? 'Services you currently manage' :
        'Services you no longer manage'
      }
    >
      <DataTable columns={columns[tab]} data={services} />
    </TabSection>
  );
};
```

#### Crew Services View
```typescript
// Shows assigned services
const CrewServicesView = () => {
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const { data: services } = useCrewServices(tab);

  const columns = {
    active: [
      { key: 'serviceId', label: 'SERVICE ID' },
      { key: 'serviceName', label: 'SERVICE NAME' },
      { key: 'type', label: 'TYPE' },
      { key: 'status', label: 'STATUS' },
      { key: 'scheduledDate', label: 'SCHEDULED' },
    ],
    history: [
      { key: 'serviceId', label: 'SERVICE ID' },
      { key: 'serviceName', label: 'SERVICE NAME' },
      { key: 'completionDate', label: 'COMPLETED' },
      { key: 'duration', label: 'DURATION' },
    ]
  };

  return (
    <TabSection
      tabs={[
        { id: 'active', label: 'Active Services', count: services?.active?.length },
        { id: 'history', label: 'Service History', count: services?.history?.length },
      ]}
      description={
        tab === 'active' ? 'Active services' : 'Completed services archive'
      }
    >
      <DataTable columns={columns[tab]} data={services} />
    </TabSection>
  );
};
```

## Data Flow

### Service Creation (Automatic from Orders)
```
1. Service Order Approved →
2. Order System calls ServiceService.createServiceFromOrder() →
3. Service entity created with data from order →
4. Service appears in relevant role views
```

### Service Viewing
```
1. User navigates to Services tab →
2. Frontend calls role-specific API →
3. Backend filters services based on role/relationships →
4. Returns appropriate service view data →
5. Frontend displays in DataTable
```

## Implementation Strategy

### Phase 1: Core Service Storage (Week 1)
1. Create services table migration
2. Build service creation from orders
3. Basic CRUD operations
4. Simple status management

### Phase 2: Role-Based Views (Week 1-2)
1. Implement role-specific queries
2. Create view APIs for each role
3. Add filtering and search
4. Build frontend components

### Phase 3: Manager Certifications (Week 2)
1. Create certifications table
2. Link services to certifications
3. Show certification status in UI
4. Add expiration tracking

### Phase 4: Polish & Performance (Week 2-3)
1. Add caching for frequently accessed data
2. Optimize queries with proper indexes
3. Add pagination for large datasets
4. Implement search functionality

## Key Differences from Original Design

### What's NOT Included
- ❌ Complex approval workflows (handled in Orders)
- ❌ Crew assignment/acceptance logic
- ❌ Service execution tracking
- ❌ Real-time status updates
- ❌ Quality control processes
- ❌ Scheduling algorithms

### What IS Included
- ✅ Simple service data storage
- ✅ Role-based viewing permissions
- ✅ Manager certification tracking
- ✅ Historical service records
- ✅ Basic filtering and search
- ✅ Service statistics for dashboards

## Performance Considerations

### Query Optimization
```sql
-- Materialized view for manager certifications
CREATE MATERIALIZED VIEW manager_service_view AS
SELECT
  s.*,
  mc.certified,
  mc.can_train,
  mc.certification_date,
  mc.expiration_date
FROM services s
LEFT JOIN manager_certifications mc ON s.code = mc.service_code;

-- Refresh periodically
REFRESH MATERIALIZED VIEW manager_service_view;
```

### Caching Strategy
- Cache service catalog data (changes infrequently)
- Cache manager certifications (changes rarely)
- Cache service counts for tab badges
- Use Redis with 5-minute TTL

## Security

### Access Control
```typescript
// Middleware to filter services by role
const filterServicesByRole = (req, res, next) => {
  const { userId, role } = req.user;

  // Add role-based filter to query
  switch (role) {
    case 'customer':
      req.query.customerId = userId;
      break;
    case 'crew':
      req.query.assignedCrewId = userId;
      break;
    case 'manager':
      req.query.managingManagerId = userId;
      break;
    // Admin sees all
  }

  next();
};
```

## Testing Strategy

### Unit Tests
```typescript
describe('ServiceService', () => {
  test('creates service from approved order', async () => {
    const order = mockApprovedServiceOrder();
    const service = await serviceService.createServiceFromOrder(order.id);
    expect(service.sourceOrderId).toBe(order.id);
    expect(service.status).toBe('active');
  });

  test('filters services by manager role', async () => {
    const services = await serviceService.getServicesForUser('MGR-001', 'manager');
    expect(services.every(s => s.managingManagerId === 'MGR-001')).toBe(true);
  });
});
```

## Migration Notes

### From Current Mock Data
1. Keep existing UI structure
2. Replace mock data arrays with API calls
3. Map existing column definitions
4. Add proper typing for service data

## Summary

The Services View system is a **read-only display system** that shows different aspects of service data based on user roles. Services are automatically created from approved service orders and then displayed in various filtered views. Each role sees services relevant to their work:

- **Managers** see certifications and services they manage
- **Crew** see assigned services
- **Customers** see their requested services
- **Contractors** see customer services
- **Warehouses** see services needing materials

This is much simpler than a full service execution system - it's primarily about viewing and filtering existing service data in role-appropriate ways.