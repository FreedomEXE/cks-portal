# CKS Orders System - Complete Implementation Guide

**Document Version:** 2.0
**Last Updated:** September 19, 2025
**Purpose:** Comprehensive specification for the CKS order system with actual implementation details

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Order Types](#order-types)
3. [User Roles & Workflows](#user-roles--workflows)
4. [Product Order Workflows](#product-order-workflows)
5. [Service Order Workflows](#service-order-workflows)
6. [Order Status System](#order-status-system)
7. [UI Components & Behavior](#ui-components--behavior)
8. [Technical Implementation](#technical-implementation)
9. [Business Rules](#business-rules)

---

## System Overview

The CKS order system consists of two distinct workflow types:

### **Product Orders**
- **Purpose**: Request physical supplies/equipment
- **ID Format**: `[USER-ID]-ORD-PRD[NUMBER]`
- **Workflow**: Center/Crew → Warehouse (simple) OR Center → Customer → Contractor → Warehouse (complex)

### **Service Orders**
- **Purpose**: Request services to be performed
- **ID Format**: `[USER-ID]-ORD-SRV[NUMBER]`
- **Workflow**: Center → Customer → Contractor → Manager → Crew

### **Core Principles**
1. **Visual Workflow Trees**: Every order shows complete approval chain
2. **Selective Pulsing**: Only the immediate next approver's stage pulses
3. **Role-Based Perspectives**: Same order appears differently to each role
4. **Chain Preservation**: Crew rejections don't break service chains

---

## Order Types

### Product Orders (PRD)

**Simple Flow**: Direct requests to warehouse
- Crew → Warehouse (immediate approval)

**Complex Flow**: Customer approval chain
- Center → Customer → Contractor → Warehouse

**Key Features**:
- Three-stage warehouse progression: pending → accepted → delivered
- Archive shows delivered orders without duplicate "accepted" stage
- Status perspective varies by role (pending for you, in-progress for others)

### Service Orders (SRV)

**Single Flow**: Center-initiated services
- Center → Customer → Contractor → Manager → Crew

**Key Features**:
- Manager creates service and assigns crew
- Crew can accept/deny assignments (doesn't break chain)
- Status becomes "service-created" when complete
- Crew rejections require manager reassignment

---

## User Roles & Workflows

### Center Hub
**Product Orders Can Create**:
- Simple: Direct to warehouse
- Complex: Through customer approval chain

**Service Orders Can Create**:
- Service requests requiring customer/contractor/manager approval

**Actions Available**:
- Create Product Order
- Create Service Order
- View order status and workflow trees

### Customer Hub
**Views**:
- Product orders from their centers requiring approval
- Service orders from their centers requiring approval

**Actions Available**:
- Approve/Reject product orders from centers
- Approve/Reject service orders from centers
- View Details on all orders

### Contractor Hub
**Views**:
- Product orders approved by customers, pending contractor approval
- Service orders approved by customers, pending contractor approval

**Actions Available**:
- Approve/Reject product orders after customer approval
- Approve/Reject service orders after customer approval
- View Details on completed orders

### Manager Hub
**Views**:
- Service orders fully approved by center/customer/contractor, pending manager action
- Product orders (monitoring crew orders)

**Actions Available**:
- Create Service (for approved service orders)
- Assign Crew (internal process)
- View all orders system-wide

### Crew Hub
**Product Orders**:
- Can create direct product orders to warehouse
- View own product order status

**Service Orders**:
- Receive service assignments from manager
- Accept/Deny service assignments
- View active and completed services

**Actions Available**:
- Request Products (to warehouse)
- Accept/Deny service assignments
- View Details on orders and services

### Warehouse Hub
**Views**:
- All product orders requiring warehouse action
- Both crew direct orders and complex chain orders

**Actions Available**:
- Accept/Deny product orders
- Mark as Delivered when fulfillment complete
- View order history

---

## Product Order Workflows

### Crew Direct Product Orders
```
Crew → Warehouse
CRW001-ORD-PRD001

States:
1. Crew creates order (status: pending)
   - Crew sees: pending (can cancel)
   - Warehouse sees: pending (can accept/deny)

2. Warehouse accepts (status: approved)
   - Crew sees: in-progress (waiting for delivery)
   - Warehouse sees: accepted (ready for delivery)

3. Warehouse delivers (status: delivered)
   - Both see: delivered (archived)
```

### Center Complex Product Orders
```
Center → Customer → Contractor → Warehouse
CTR001-ORD-PRD001

States:
1. Center creates order
   - Center sees: in-progress (waiting for customer)
   - Customer sees: pending (needs their approval) ← PULSES

2. Customer approves
   - Customer sees: in-progress (waiting for contractor)
   - Contractor sees: pending (needs their approval) ← PULSES

3. Contractor approves
   - Contractor sees: in-progress (waiting for warehouse)
   - Warehouse sees: pending (needs their approval) ← PULSES

4. Warehouse accepts
   - All see: in-progress (warehouse processing)

5. Warehouse delivers
   - All see: delivered (archived)
```

### Approval Chain Display Rules
- **Show full chain**: All roles see complete workflow
- **Pulse current approver**: Only immediate next stage pulses
- **Archive simplification**: Remove "warehouse accepted" from delivered orders

---

## Service Order Workflows

### Center Service Orders
```
Center → Customer → Contractor → Manager → Crew
CTR001-ORD-SRV001

States:
1. Center creates service request
   - Center sees: in-progress (waiting for customer)
   - Customer sees: pending (needs approval) ← PULSES

2. Customer approves
   - Customer sees: in-progress (waiting for contractor)
   - Contractor sees: pending (needs approval) ← PULSES

3. Contractor approves
   - Contractor sees: in-progress (waiting for manager)
   - Manager sees: pending (needs to create service) ← PULSES

4. Manager creates service and assigns crew
   - All see: service-created (service active)
   - Crew sees: pending (needs to accept assignment) ← SPECIAL CASE

5. Crew accepts assignment
   - Service remains service-created
   - Crew assignment handled internally by manager

6. If crew denies assignment
   - Service remains pending at manager level
   - Manager reassigns different crew
   - Original order chain unaffected
```

### Crew Service Assignment Process
**Manager assigns crew to service**:
- Crew receives assignment notification
- Options: Accept or Deny
- If denied: Manager must reassign (service stays active)
- If accepted: Service proceeds normally

**Special Rules**:
- Crew denial does NOT archive the service order
- Manager handles crew assignment through separate interface
- Service workflow continues regardless of individual crew responses

---

## Order Status System

### Order Status Values
- **pending**: User needs to take action
- **in-progress**: Waiting for others in the chain
- **approved**: Fully approved, proceeding to fulfillment
- **delivered**: Product orders completed
- **service-created**: Service orders completed and active
- **rejected**: Denied at any approval stage

### Status Perspective Rules
- **For the actor**: Shows "pending" when action needed
- **For observers**: Shows "in-progress" when waiting
- **For completed**: Shows final status (delivered/service-created/rejected)

### Visual Indicators
- **Green**: Completed stages (requested, approved, delivered, service-created)
- **Yellow**: Active stages (pending, waiting, accepted)
- **Red**: Failed stages (rejected, denied)
- **Blue**: In-progress stages
- **Pulsing**: Only applied to immediate next approver

---

## UI Components & Behavior

### OrdersSection Component
**Tab Structure**:
1. **Service Orders**: All service-related orders
2. **Product Orders**: All product-related orders
3. **Archive**: Completed/rejected orders (delivered, service-created, rejected)

**Key Features**:
- Role-based action buttons
- Search functionality
- Collapsible order cards
- Real-time status updates

### OrderCard Component
**Visual Elements**:
- Order ID and type badge
- Title and description
- Approval workflow tree with arrows
- Action buttons based on user role and order status
- Expandable details section

**Workflow Tree Display**:
- Shows all approval stages
- Arrows connect stages
- Only immediate next approver pulses
- Color-coded by status
- Timestamps for completed stages

### Action Buttons by Role

#### Center
- **Request Service**: Creates service orders
- **Request Products**: Creates product orders
- **View Details**: For all orders

#### Customer
- **Approve**: For pending orders requiring approval
- **Reject**: For pending orders requiring approval
- **View Details**: For all other orders

#### Contractor
- **Approve**: For orders pending contractor approval
- **Reject**: For orders pending contractor approval
- **View Details**: For all other orders

#### Manager
- **Create Service**: For approved service orders
- **View Details**: For all orders

#### Crew
- **Request Products**: For product orders to warehouse
- **Accept**: For service assignments
- **Deny**: For service assignments
- **View Details**: For all other orders

#### Warehouse
- **Accept**: For pending product orders
- **Deny**: For pending product orders
- **Deliver**: For accepted orders ready for delivery
- **View Details**: For completed orders

---

## Technical Implementation

### Data Structure
```typescript
interface Order {
  orderId: string;  // Format: UserID-ORD-TYPE###
  orderType: 'service' | 'product';
  title: string;
  requestedBy: string;
  destination: string;
  requestedDate: string;
  expectedDate?: string;
  serviceStartDate?: string;  // For service orders
  deliveryDate?: string;      // For product orders
  status: 'pending' | 'in-progress' | 'approved' | 'rejected' | 'delivered' | 'service-created';
  approvalStages: ApprovalStage[];
  // Additional fields...
}

interface ApprovalStage {
  role: string;
  status: 'pending' | 'approved' | 'rejected' | 'waiting' | 'accepted' | 'requested' | 'delivered' | 'service-created';
  user?: string;
  timestamp?: string;
}
```

### Component Architecture
```
OrdersSection
├── TabSection (Service/Product/Archive tabs)
├── OrderCard[] (Collapsible order display)
│   ├── Workflow Tree (Approval stages)
│   ├── Order Details (Expandable)
│   └── Action Buttons (Role-based)
└── Search/Filter Controls
```

### Pulsing Logic
```typescript
// Find first pending/accepted stage to pulse
const firstPendingIndex = approvalStages.findIndex(s =>
  s.status === 'pending' || s.status === 'accepted'
);
const shouldPulse = index === firstPendingIndex;
```

### Status Calculation
- Order status reflects current stage of workflow
- Role-specific perspective (pending vs in-progress)
- Archive filtering by final states

---

## Business Rules

### Product Order Rules
1. **Crew can create direct orders** to warehouse (no approval chain)
2. **Center orders through customer** require customer → contractor → warehouse approval
3. **Warehouse has final authority** on product fulfillment
4. **Delivered status is final** - no further actions possible

### Service Order Rules
1. **All service orders require customer approval** before contractor review
2. **Manager must create service** after contractor approval
3. **Crew assignment is separate** from main approval chain
4. **Crew rejection doesn't break chain** - manager reassigns
5. **Service-created status indicates active service**

### Approval Chain Rules
1. **Sequential approval required** - cannot skip stages
2. **Rejection at any stage** moves order to archive
3. **Only immediate next approver** can take action
4. **Previous approvers cannot revoke** decisions

### UI Display Rules
1. **Full workflow visibility** for all participants
2. **Pulsing only on actionable stages** for current user
3. **Archive simplification** - remove redundant intermediate stages
4. **Role-appropriate action buttons** based on order status and user permissions

### Crew Assignment Rules (Service Orders Only)
1. **Manager controls crew assignment** through separate interface
2. **Crew can accept or deny** assignments without affecting main workflow
3. **Service remains active** regardless of individual crew responses
4. **Manager must reassign** if crew denies assignment
5. **Assignment status tracked separately** from main order status

---

## Example Order Flows

### Product Order: CRW001-ORD-PRD001
**Crew Direct to Warehouse**
```
Initial: Crew creates order
├── Crew sees: pending (can cancel)
└── Warehouse sees: pending (can accept/deny)

Accepted: Warehouse accepts
├── Crew sees: in-progress (waiting delivery)
└── Warehouse sees: accepted (ready to deliver)

Delivered: Warehouse delivers
├── Crew sees: delivered (archived)
└── Warehouse sees: delivered (archived)
```

### Service Order: CTR001-ORD-SRV001
**Center Service Request**
```
Initial: Center creates service request
├── Center sees: in-progress
├── Customer sees: pending ← PULSES
├── Contractor sees: waiting
└── Manager sees: waiting

Customer Approved: Customer approves
├── Center sees: in-progress
├── Customer sees: in-progress
├── Contractor sees: pending ← PULSES
└── Manager sees: waiting

Contractor Approved: Contractor approves
├── Center sees: in-progress
├── Customer sees: in-progress
├── Contractor sees: in-progress
└── Manager sees: pending ← PULSES

Service Created: Manager creates service
├── All see: service-created
└── Crew sees: pending assignment (separate process)
```

---

## Future Considerations

### Planned Enhancements
1. **Bulk operations** for managers
2. **Mobile notifications** for urgent orders
3. **Analytics dashboard** for order patterns
4. **Automated escalation** for overdue approvals
5. **Integration with external systems** for real-time tracking

### Scalability Notes
1. **Component architecture is production-ready** - only mock data needs replacement
2. **Order filtering by status** enables efficient archive management
3. **Role-based permissions** built into component logic
4. **Workflow trees adapt** to any number of approval stages

---

**Document End**

*This document reflects the actual implementation of the CKS order system as built. All UI components, workflows, and business logic are documented based on the current codebase.*