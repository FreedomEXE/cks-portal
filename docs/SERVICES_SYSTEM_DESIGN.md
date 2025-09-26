# My Services System - Complete Design Document

## Overview
Comprehensive service management system that transforms approved service orders into executable service entities. Manages crew assignments, scheduling, execution tracking, and completion verification across all roles.

## Core Concepts

### Service Lifecycle
```
Service Order (approved) → Service Entity Created → Crew Assignment →
Acceptance/Rejection → Scheduling → In Progress → Completion → Verification
```

### Key Relationships
- **Services** are created from approved **Service Orders**
- **Managers** assign services to **Crew**
- **Crew** can accept/reject assignments
- **Customers** track their requested services
- **Contractors** oversee services for their customers

### Service States
- **Draft** - Being created (manager preparing)
- **Pending Assignment** - Needs crew assignment
- **Assigned** - Crew assigned, awaiting response
- **Accepted** - Crew accepted, awaiting schedule
- **Scheduled** - Date/time confirmed
- **In Progress** - Being performed
- **Completed** - Work done, awaiting verification
- **Verified** - Customer/manager confirmed completion
- **Cancelled** - Service cancelled
- **Rejected** - Crew rejected assignment

## Database Schema

### Table: `services`
```sql
CREATE TABLE services (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_service_id(),

  -- Origin
  source_order_id VARCHAR(50) REFERENCES orders(id),
  created_from VARCHAR(50) DEFAULT 'order', -- 'order', 'recurring', 'manual'
  parent_service_id VARCHAR(50) REFERENCES services(id), -- for recurring

  -- Service Details
  service_code VARCHAR(100) NOT NULL, -- from catalog
  service_name VARCHAR(255) NOT NULL,
  service_type VARCHAR(100) NOT NULL, -- 'cleaning', 'maintenance', etc
  description TEXT,
  special_instructions TEXT,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending_assignment',
  status_reason TEXT,
  previous_status VARCHAR(50),
  status_changed_at TIMESTAMP,
  status_changed_by VARCHAR(50),

  -- Customer Information
  customer_id VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_type VARCHAR(50), -- 'customer', 'center', 'contractor'

  -- Location
  location_id VARCHAR(50),
  location_name VARCHAR(255),
  location_address TEXT NOT NULL,
  location_details TEXT, -- floor, suite, access codes
  location_contact_name VARCHAR(255),
  location_contact_phone VARCHAR(50),
  location_latitude DECIMAL(10,8),
  location_longitude DECIMAL(11,8),

  -- Assignment
  assigned_crew_id VARCHAR(50),
  assigned_crew_name VARCHAR(255),
  assigned_at TIMESTAMP,
  assigned_by VARCHAR(50),
  assignment_notes TEXT,

  -- Crew Response
  crew_response VARCHAR(20), -- 'accepted', 'rejected', null
  crew_response_at TIMESTAMP,
  crew_response_reason TEXT,
  reassignment_count INTEGER DEFAULT 0,
  previous_crew_ids TEXT[], -- track reassignment history

  -- Manager
  managing_manager_id VARCHAR(50) NOT NULL,
  managing_manager_name VARCHAR(255),
  supervisor_id VARCHAR(50), -- escalation contact

  -- Contractor (if applicable)
  contractor_id VARCHAR(50),
  contractor_name VARCHAR(255),

  -- Scheduling
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent', 'emergency')),
  requested_date DATE,
  requested_time_slot VARCHAR(50), -- 'morning', 'afternoon', 'evening', 'night'
  requested_start_time TIME,
  requested_end_time TIME,

  scheduled_date DATE,
  scheduled_start_time TIME,
  scheduled_end_time TIME,
  estimated_duration_minutes INTEGER,

  -- Recurring Schedule
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(50), -- 'daily', 'weekly', 'biweekly', 'monthly'
  recurrence_days TEXT[], -- ['monday', 'wednesday', 'friday']
  recurrence_end_date DATE,
  next_occurrence_date DATE,

  -- Execution
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  actual_duration_minutes INTEGER,

  -- Completion
  completed_at TIMESTAMP,
  completed_by VARCHAR(50),
  completion_notes TEXT,
  completion_photos TEXT[], -- URLs to photos
  completion_checklist JSONB, -- checklist items with status
  completion_signature_url TEXT,

  -- Verification
  verified_at TIMESTAMP,
  verified_by VARCHAR(50),
  verified_by_role VARCHAR(50), -- 'customer', 'manager', 'contractor'
  verification_notes TEXT,
  verification_rating INTEGER CHECK (verification_rating BETWEEN 1 AND 5),
  verification_feedback TEXT,

  -- Quality Control
  qc_required BOOLEAN DEFAULT false,
  qc_completed BOOLEAN DEFAULT false,
  qc_completed_at TIMESTAMP,
  qc_completed_by VARCHAR(50),
  qc_notes TEXT,
  qc_score INTEGER CHECK (qc_score BETWEEN 0 AND 100),

  -- Issues & Escalation
  has_issues BOOLEAN DEFAULT false,
  issue_description TEXT,
  issue_reported_at TIMESTAMP,
  issue_reported_by VARCHAR(50),
  escalated_to VARCHAR(50),
  escalated_at TIMESTAMP,
  escalation_reason TEXT,

  -- Financial
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  labor_hours DECIMAL(6,2),
  materials_cost DECIMAL(10,2),
  additional_charges DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  invoice_number VARCHAR(100),
  payment_status VARCHAR(50),

  -- Equipment & Materials
  required_equipment TEXT[],
  required_materials TEXT[],
  equipment_checklist JSONB,
  materials_used JSONB,

  -- Metadata
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  internal_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP,

  -- Indexes
  INDEX idx_services_status (status),
  INDEX idx_services_customer (customer_id, status),
  INDEX idx_services_crew (assigned_crew_id, status),
  INDEX idx_services_manager (managing_manager_id, status),
  INDEX idx_services_contractor (contractor_id, status),
  INDEX idx_services_dates (scheduled_date, scheduled_start_time),
  INDEX idx_services_location (location_id),
  INDEX idx_services_recurring (is_recurring, next_occurrence_date),
  INDEX idx_services_source_order (source_order_id)
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

### Table: `service_crew_availability`
```sql
CREATE TABLE service_crew_availability (
  id SERIAL PRIMARY KEY,
  crew_id VARCHAR(50) NOT NULL,

  -- Availability
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Capacity
  total_capacity_hours DECIMAL(4,2) DEFAULT 8,
  booked_hours DECIMAL(4,2) DEFAULT 0,
  available_hours DECIMAL(4,2) GENERATED ALWAYS AS (total_capacity_hours - booked_hours) STORED,

  -- Status
  is_available BOOLEAN DEFAULT true,
  unavailable_reason VARCHAR(100), -- 'vacation', 'sick', 'training', etc

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(crew_id, date),
  INDEX idx_availability_date (date, is_available),
  INDEX idx_availability_crew (crew_id, date)
);
```

### Table: `service_history`
```sql
CREATE TABLE service_history (
  id SERIAL PRIMARY KEY,
  service_id VARCHAR(50) NOT NULL REFERENCES services(id) ON DELETE CASCADE,

  -- Event
  event_type VARCHAR(50) NOT NULL, -- 'status_change', 'assignment', 'schedule_change', etc
  event_description TEXT,
  old_value TEXT,
  new_value TEXT,

  -- Actor
  performed_by VARCHAR(50) NOT NULL,
  performed_by_role VARCHAR(50) NOT NULL,
  performed_by_name VARCHAR(255),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_history_service (service_id, created_at DESC),
  INDEX idx_history_event (event_type, created_at DESC)
);
```

### Table: `service_comments`
```sql
CREATE TABLE service_comments (
  id SERIAL PRIMARY KEY,
  service_id VARCHAR(50) NOT NULL REFERENCES services(id) ON DELETE CASCADE,

  -- Comment
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- internal notes vs customer visible
  comment_type VARCHAR(50), -- 'note', 'issue', 'update', 'question'

  -- Author
  author_id VARCHAR(50) NOT NULL,
  author_role VARCHAR(50) NOT NULL,
  author_name VARCHAR(255) NOT NULL,

  -- Reply Threading
  parent_comment_id INTEGER REFERENCES service_comments(id),

  -- Attachments
  attachments JSONB DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMP,

  INDEX idx_comments_service (service_id, created_at),
  INDEX idx_comments_author (author_id)
);
```

### Table: `service_checklists`
```sql
CREATE TABLE service_checklists (
  id SERIAL PRIMARY KEY,
  service_type VARCHAR(100) NOT NULL,

  -- Checklist
  name VARCHAR(255) NOT NULL,
  description TEXT,
  items JSONB NOT NULL, -- [{item, required, order}]

  -- Usage
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,

  -- Metadata
  created_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_checklists_type (service_type, is_active)
);
```

## Backend API Structure

### File: `apps/backend/server/domains/services/types.ts`
```typescript
export interface Service {
  id: string;
  sourceOrderId?: string;
  createdFrom: 'order' | 'recurring' | 'manual';

  // Service Info
  serviceCode: string;
  serviceName: string;
  serviceType: string;
  description?: string;
  specialInstructions?: string;

  // Status
  status: ServiceStatus;
  statusReason?: string;

  // Customer
  customerId: string;
  customerName: string;
  customerType: string;

  // Location
  locationId?: string;
  locationName?: string;
  locationAddress: string;
  locationDetails?: string;

  // Assignment
  assignedCrewId?: string;
  assignedCrewName?: string;
  assignedAt?: Date;
  assignedBy?: string;

  // Crew Response
  crewResponse?: 'accepted' | 'rejected';
  crewResponseAt?: Date;
  crewResponseReason?: string;

  // Management
  managingManagerId: string;
  managingManagerName?: string;
  contractorId?: string;

  // Scheduling
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'emergency';
  requestedDate?: Date;
  scheduledDate?: Date;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  estimatedDurationMinutes?: number;

  // Execution
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualDurationMinutes?: number;

  // Completion
  completedAt?: Date;
  completedBy?: string;
  completionNotes?: string;
  completionPhotos?: string[];

  // Verification
  verifiedAt?: Date;
  verifiedBy?: string;
  verificationRating?: number;
  verificationFeedback?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export type ServiceStatus =
  | 'draft'
  | 'pending_assignment'
  | 'assigned'
  | 'accepted'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'verified'
  | 'cancelled'
  | 'rejected';

export interface CrewAvailability {
  crewId: string;
  date: Date;
  startTime: string;
  endTime: string;
  totalCapacityHours: number;
  bookedHours: number;
  availableHours: number;
  isAvailable: boolean;
}

export interface ServiceChecklist {
  id: number;
  serviceType: string;
  name: string;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  item: string;
  required: boolean;
  completed?: boolean;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
}
```

### File: `apps/backend/server/domains/services/routes.fastify.ts`
```typescript
// Service Management (Manager)
POST   /api/services                      - Create service (from order or manual)
GET    /api/services                      - List services (filtered by role)
GET    /api/services/:id                  - Get service details
PUT    /api/services/:id                  - Update service
DELETE /api/services/:id                  - Cancel service

// Assignment (Manager)
POST   /api/services/:id/assign           - Assign to crew
POST   /api/services/:id/reassign         - Reassign to different crew
GET    /api/services/crew-availability    - Get crew availability

// Crew Actions
GET    /api/services/my-assignments       - Get assigned services
POST   /api/services/:id/accept           - Accept assignment
POST   /api/services/:id/reject           - Reject assignment with reason
POST   /api/services/:id/start            - Mark as in progress
POST   /api/services/:id/complete         - Mark as completed
POST   /api/services/:id/checklist        - Update checklist progress

// Scheduling
POST   /api/services/:id/schedule         - Set/update schedule
POST   /api/services/:id/reschedule       - Reschedule service
GET    /api/services/calendar             - Get service calendar view

// Customer Actions
GET    /api/services/my-services          - Get customer's services
POST   /api/services/:id/verify           - Verify completion
POST   /api/services/:id/report-issue     - Report an issue
POST   /api/services/:id/rate             - Rate completed service

// Comments & Communication
POST   /api/services/:id/comments         - Add comment
GET    /api/services/:id/comments         - Get comments
PUT    /api/services/:id/comments/:cid    - Edit comment

// Quality Control
POST   /api/services/:id/qc               - Perform quality check
GET    /api/services/qc-required          - List services needing QC

// Recurring Services
POST   /api/services/:id/make-recurring   - Convert to recurring
POST   /api/services/:id/generate-next    - Generate next occurrence
PUT    /api/services/:id/recurrence       - Update recurrence pattern
DELETE /api/services/:id/recurrence       - Stop recurrence

// Admin
GET    /api/admin/services/all            - All services (no filter)
GET    /api/admin/services/stats          - Service statistics
POST   /api/admin/services/bulk-assign    - Bulk assignment
```

### File: `apps/backend/server/domains/services/service.ts`
```typescript
export class ServiceService {
  /**
   * Create service from approved order
   */
  async createFromOrder(orderId: string): Promise<Service> {
    const order = await this.orderService.getOrder(orderId);

    if (order.orderType !== 'service') {
      throw new Error('Can only create services from service orders');
    }

    if (!['approved', 'pending_manager'].includes(order.status)) {
      throw new Error('Order must be approved to create service');
    }

    const service = {
      sourceOrderId: orderId,
      createdFrom: 'order',
      serviceCode: order.items[0].catalogItemId, // Primary service
      serviceName: order.items[0].itemName,
      serviceType: this.determineServiceType(order.items[0]),
      description: order.description,
      customerId: order.originatingEntityId,
      customerName: order.originatingEntityName,
      locationAddress: order.deliveryAddress,
      managingManagerId: order.managerId,
      priority: order.priority,
      requestedDate: order.requestedDate,
      status: 'pending_assignment'
    };

    // Create service
    const created = await this.repository.createService(service);

    // Update order with transformation
    await this.orderService.markTransformed(orderId, created.id);

    // Notify manager
    await this.notificationService.notify('service_created', created);

    return created;
  }

  /**
   * Assign service to crew
   */
  async assignToCrew(
    serviceId: string,
    crewId: string,
    assignedBy: string
  ): Promise<Service> {
    const service = await this.getService(serviceId);

    // Check crew availability
    const available = await this.checkCrewAvailability(
      crewId,
      service.scheduledDate,
      service.estimatedDurationMinutes
    );

    if (!available) {
      throw new Error('Crew not available for scheduled time');
    }

    // Update assignment
    const updated = await this.repository.updateService(serviceId, {
      assignedCrewId: crewId,
      assignedCrewName: await this.getCrewName(crewId),
      assignedAt: new Date(),
      assignedBy,
      status: 'assigned',
      crewResponse: null,
      crewResponseAt: null
    });

    // Book crew time
    await this.bookCrewTime(crewId, service.scheduledDate, service.estimatedDurationMinutes);

    // Notify crew
    await this.notificationService.notifyCrew(crewId, 'new_assignment', updated);

    // Log history
    await this.logHistory(serviceId, 'assignment', null, crewId, assignedBy);

    return updated;
  }

  /**
   * Crew accepts/rejects assignment
   */
  async handleCrewResponse(
    serviceId: string,
    crewId: string,
    response: 'accepted' | 'rejected',
    reason?: string
  ): Promise<Service> {
    const service = await this.getService(serviceId);

    if (service.assignedCrewId !== crewId) {
      throw new Error('Service not assigned to this crew');
    }

    if (response === 'accepted') {
      return await this.repository.updateService(serviceId, {
        crewResponse: 'accepted',
        crewResponseAt: new Date(),
        status: 'scheduled'
      });
    } else {
      // Release crew booking
      await this.releaseCrewTime(crewId, service.scheduledDate);

      // Update service
      const updated = await this.repository.updateService(serviceId, {
        crewResponse: 'rejected',
        crewResponseAt: new Date(),
        crewResponseReason: reason,
        status: 'pending_assignment',
        reassignmentCount: service.reassignmentCount + 1,
        previousCrewIds: [...(service.previousCrewIds || []), crewId]
      });

      // Notify manager for reassignment
      await this.notificationService.notifyManager(
        service.managingManagerId,
        'assignment_rejected',
        updated
      );

      return updated;
    }
  }

  /**
   * Get services visible to user based on role
   */
  async getServicesForUser(userId: string, role: string): Promise<Service[]> {
    switch (role) {
      case 'crew':
        return this.repository.getCrewServices(userId);

      case 'manager':
        return this.repository.getManagerServices(userId);

      case 'customer':
        return this.repository.getCustomerServices(userId);

      case 'contractor':
        return this.repository.getContractorServices(userId);

      default:
        return [];
    }
  }

  /**
   * Calculate crew availability for date range
   */
  async getCrewAvailability(
    startDate: Date,
    endDate: Date,
    serviceType?: string
  ): Promise<CrewAvailability[]> {
    // Get all crew
    const crews = await this.crewService.getActiveCrews(serviceType);

    // Calculate availability for each
    const availability = [];
    for (const crew of crews) {
      const schedule = await this.repository.getCrewSchedule(
        crew.id,
        startDate,
        endDate
      );

      availability.push({
        crewId: crew.id,
        crewName: crew.name,
        schedule
      });
    }

    return availability;
  }
}
```

## Frontend Integration

### File: `apps/frontend/src/shared/api/services.ts`
```typescript
// Service hooks
export const useMyServices = (filters?: ServiceFilters) => {
  return useSWR(`/api/services?${buildQuery(filters)}`);
};

export const useServiceDetails = (id: string) => {
  return useSWR(`/api/services/${id}`);
};

export const useCreateService = () => {
  return useSWRMutation('/api/services', postRequest);
};

export const useAssignService = () => {
  return useSWRMutation(
    (data: { serviceId: string; crewId: string }) =>
      `/api/services/${data.serviceId}/assign`,
    postRequest
  );
};

// Crew hooks
export const useMyAssignments = () => {
  return useSWR('/api/services/my-assignments');
};

export const useAcceptAssignment = () => {
  return useSWRMutation(
    (serviceId: string) => `/api/services/${serviceId}/accept`,
    postRequest
  );
};

export const useRejectAssignment = () => {
  return useSWRMutation(
    (data: { serviceId: string; reason: string }) =>
      `/api/services/${data.serviceId}/reject`,
    postRequest
  );
};

export const useStartService = () => {
  return useSWRMutation(
    (serviceId: string) => `/api/services/${serviceId}/start`,
    postRequest
  );
};

export const useCompleteService = () => {
  return useSWRMutation(
    (data: { serviceId: string; notes: string; photos?: string[] }) =>
      `/api/services/${data.serviceId}/complete`,
    postRequest
  );
};

// Customer hooks
export const useVerifyService = () => {
  return useSWRMutation(
    (data: { serviceId: string; rating: number; feedback?: string }) =>
      `/api/services/${data.serviceId}/verify`,
    postRequest
  );
};

// Manager hooks
export const useCrewAvailability = (startDate: Date, endDate: Date) => {
  return useSWR(`/api/services/crew-availability?start=${startDate}&end=${endDate}`);
};
```

### Service Management Component (Manager View)
```typescript
// apps/frontend/src/components/ServiceManager.tsx
export const ServiceManager = () => {
  const { data: services } = useMyServices({ status: 'pending_assignment' });
  const { data: availability } = useCrewAvailability(startDate, endDate);
  const assignService = useAssignService();

  const handleAssignment = async (serviceId: string, crewId: string) => {
    await assignService.trigger({ serviceId, crewId });
    // Show success, refresh data
  };

  return (
    <div>
      {/* Service list with assignment UI */}
      {/* Crew availability calendar */}
      {/* Drag-and-drop assignment interface */}
    </div>
  );
};
```

### Crew Assignment Response Component
```typescript
// apps/frontend/src/components/CrewAssignments.tsx
export const CrewAssignments = () => {
  const { data: assignments } = useMyAssignments();
  const acceptAssignment = useAcceptAssignment();
  const rejectAssignment = useRejectAssignment();

  return (
    <div>
      {assignments?.map(service => (
        <ServiceCard key={service.id}>
          <h3>{service.serviceName}</h3>
          <p>{service.locationAddress}</p>
          <p>{service.scheduledDate}</p>

          {service.status === 'assigned' && (
            <div>
              <Button onClick={() => acceptAssignment.trigger(service.id)}>
                Accept
              </Button>
              <Button onClick={() => openRejectModal(service.id)}>
                Reject
              </Button>
            </div>
          )}

          {service.status === 'scheduled' && (
            <Button onClick={() => startService(service.id)}>
              Start Service
            </Button>
          )}
        </ServiceCard>
      ))}
    </div>
  );
};
```

## User Flows & Edge Cases

### Service Creation from Order
1. **Order Approval**: Service order gets approved by manager
2. **Automatic Creation**: System creates service entity from order
3. **Manager Notification**: Manager notified of new service needing assignment
4. **Data Transfer**:
   - Service details from catalog
   - Customer info from order
   - Location from delivery address
   - Priority and requested date
5. **Edge Cases**:
   - Multiple services in one order: Create primary service, link others
   - Missing location data: Require manager to complete
   - Past requested date: Flag for immediate attention

### Crew Assignment Flow
1. **Manager Views Service**: Opens pending assignment service
2. **Check Availability**:
   - View crew calendar
   - Filter by skills/certifications
   - Check workload balance
3. **Make Assignment**:
   - Select crew
   - Add assignment notes
   - Set scheduled time
4. **Crew Notification**: Push/email to assigned crew
5. **Crew Response Window**: 24 hours to accept/reject
6. **Edge Cases**:
   - No response: Auto-reject after 24 hours, notify manager
   - All crews busy: Queue for next available slot
   - Emergency service: Override normal availability
   - Crew on vacation: Exclude from available list

### Service Execution Flow
1. **Pre-Service**:
   - Crew reviews details night before
   - Prepares equipment/materials
   - Confirms route/schedule
2. **Check-In**: Crew starts service, GPS location logged
3. **Execution**:
   - Follow checklist items
   - Document issues
   - Take progress photos
4. **Completion**:
   - Fill completion checklist
   - Add notes
   - Upload photos
   - Get customer signature (if required)
5. **Post-Service**:
   - Update actual time
   - Report any issues
   - Schedule follow-up if needed
6. **Edge Cases**:
   - Customer not present: Photo documentation, proceed per SOP
   - Access issues: Contact manager, document attempt
   - Weather delays: Auto-reschedule, notify all parties
   - Incomplete service: Mark partial, create follow-up

### Customer Verification Flow
1. **Notification**: Customer notified of completion
2. **Review**:
   - Check completion photos
   - Review checklist
   - Inspect work (if on-site)
3. **Feedback**:
   - Rate service (1-5 stars)
   - Add comments
   - Report issues if any
4. **Verification**: Mark as verified or dispute
5. **Edge Cases**:
   - No response: Auto-verify after 48 hours
   - Dispute: Escalate to manager
   - Partial satisfaction: Create follow-up service

## Real-time Updates

### WebSocket Events
```typescript
// Service events
'service:created' - New service created
'service:assigned' - Service assigned to crew
'service:accepted' - Crew accepted assignment
'service:rejected' - Crew rejected assignment
'service:started' - Service in progress
'service:completed' - Service completed
'service:verified' - Customer verified

// Subscription patterns
io.on('connect', () => {
  // Crew gets their assignments
  if (role === 'crew') {
    socket.join(`crew:${crewId}:assignments`);
  }

  // Manager gets all their services
  if (role === 'manager') {
    socket.join(`manager:${managerId}:services`);
  }

  // Customer gets their services
  if (role === 'customer') {
    socket.join(`customer:${customerId}:services`);
  }
});
```

## Scheduling & Calendar Features

### Availability Management
```typescript
interface CrewSchedule {
  crewId: string;
  crewName: string;
  date: Date;
  shifts: {
    start: string;
    end: string;
    services: {
      id: string;
      name: string;
      duration: number;
      customer: string;
      location: string;
    }[];
  }[];
  utilization: number; // percentage of time booked
}
```

### Scheduling Algorithm
```typescript
function findOptimalCrewAssignment(
  service: Service,
  availableCrews: Crew[]
): Crew | null {
  // Factors to consider:
  // 1. Availability on requested date
  // 2. Geographic proximity to reduce travel
  // 3. Skill match for service type
  // 4. Workload balance across crews
  // 5. Customer preference (if any)
  // 6. Historical performance rating

  return crews
    .filter(crew => crew.isAvailable(service.requestedDate))
    .filter(crew => crew.hasSkills(service.requiredSkills))
    .sort((a, b) => {
      const scoreA = calculateAssignmentScore(a, service);
      const scoreB = calculateAssignmentScore(b, service);
      return scoreB - scoreA;
    })[0] || null;
}
```

## Recurring Services

### Creation Pattern
```typescript
interface RecurringServiceConfig {
  pattern: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  days?: string[]; // ['monday', 'wednesday', 'friday']
  dayOfMonth?: number; // for monthly
  endDate?: Date;
  endAfterOccurrences?: number;
}

async function createRecurringService(
  baseService: Service,
  config: RecurringServiceConfig
): Promise<Service[]> {
  const occurrences = generateOccurrences(config);
  const services = [];

  for (const date of occurrences) {
    const recurring = {
      ...baseService,
      scheduledDate: date,
      parentServiceId: baseService.id,
      createdFrom: 'recurring'
    };
    services.push(await createService(recurring));
  }

  return services;
}
```

## Quality Control

### QC Process
1. **Random Selection**: X% of completed services flagged for QC
2. **Manager Review**:
   - Review photos
   - Check checklist completion
   - Verify time spent
3. **Site Inspection** (if needed):
   - Physical verification
   - Customer interview
4. **Scoring**:
   - Completeness (40%)
   - Quality (40%)
   - Timeliness (20%)
5. **Feedback**: Share with crew for improvement

## Performance Metrics

### Key Service KPIs
```typescript
interface ServiceMetrics {
  // Efficiency
  averageCompletionTime: number;
  onTimeCompletionRate: number;
  firstTimeResolutionRate: number;

  // Quality
  averageCustomerRating: number;
  verificationRate: number;
  issueReportRate: number;
  qcPassRate: number;

  // Assignment
  assignmentAcceptanceRate: number;
  averageAssignmentTime: number;
  reassignmentRate: number;

  // Utilization
  crewUtilizationRate: number;
  servicePerCrewPerDay: number;

  // Financial
  averageServiceValue: number;
  profitMargin: number;
}
```

## Implementation Phases

### Phase 1: Core Service Management (Week 1)
1. Database schema creation
2. Service CRUD operations
3. Basic assignment flow
4. Status management

### Phase 2: Crew Integration (Week 1-2)
1. Assignment acceptance/rejection
2. Service execution tracking
3. Completion workflow
4. Basic scheduling

### Phase 3: Customer Features (Week 2)
1. Service visibility
2. Verification process
3. Rating and feedback
4. Issue reporting

### Phase 4: Advanced Scheduling (Week 3)
1. Crew availability management
2. Calendar views
3. Conflict resolution
4. Optimal assignment algorithm

### Phase 5: Recurring & QC (Week 4)
1. Recurring service patterns
2. Quality control workflow
3. Performance metrics
4. Reporting dashboards

## Security & Validation

### Permission Matrix
```typescript
const servicePermissions = {
  create: ['manager', 'admin'],
  view: {
    own: ['customer', 'crew', 'contractor'],
    all: ['manager', 'admin']
  },
  assign: ['manager', 'admin'],
  accept: ['crew'],
  reject: ['crew'],
  start: ['crew'],
  complete: ['crew'],
  verify: ['customer', 'manager', 'admin'],
  cancel: ['manager', 'admin', 'customer'], // customer only their own
  edit: ['manager', 'admin']
};
```

### Validation Rules
- Service dates must be future (except for manual backdating)
- Crew can only act on services assigned to them
- Status transitions must follow valid flow
- Completion requires minimum checklist items done
- Verification window expires after X days

## Testing Strategy

### Unit Tests
- Service creation from orders
- Assignment logic
- Status transitions
- Scheduling calculations

### Integration Tests
- Full service lifecycle
- Crew availability updates
- Notification delivery
- Recurring service generation

### E2E Tests
```typescript
describe('Service Complete Flow', () => {
  test('Order to verified service', async () => {
    // 1. Create and approve service order
    // 2. System creates service
    // 3. Manager assigns to crew
    // 4. Crew accepts
    // 5. Crew completes service
    // 6. Customer verifies
    // 7. Check all status updates
  });
});
```

## Migration Considerations

### From Current System
1. Map existing service data to new schema
2. Generate service IDs for existing records
3. Link to historical orders where possible
4. Set reasonable defaults for new required fields
5. Run in parallel for testing period

## Open Questions

1. **Crew Skills**: How to track and match crew certifications?
2. **Service Bundling**: Can multiple services be grouped?
3. **Customer Preferences**: Store preferred crews/times?
4. **Service Templates**: Predefined service configurations?
5. **Mobile App**: Crew mobile app for field work?
6. **GPS Tracking**: Real-time crew location during service?
7. **Inventory Integration**: Track materials used per service?
8. **Invoice Generation**: When/how to generate invoices?

## Related Systems

1. **Order System** - Services created from approved orders
2. **Crew Management** - Crew profiles, skills, availability
3. **Customer Management** - Customer preferences, history
4. **Inventory System** - Materials/equipment tracking
5. **Billing System** - Invoice generation from services
6. **Reporting System** - Service analytics and metrics
7. **Notification System** - Multi-channel notifications