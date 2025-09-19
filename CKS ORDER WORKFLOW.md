# CKS ORDER WORKFLOW DOCUMENTATION

## Overview
This document provides comprehensive documentation of all order workflows in the CKS Portal system, including service and product order lifecycles, approval stages, and role-based interactions.

## Order ID Format
All orders follow a consistent ID format: `{UserID}-ORD-{TypeID}`
- **UserID**: The ID of the user/entity creating the order (e.g., CRW001, CTR002, CUS003)
- **ORD**: Fixed identifier indicating this is an order
- **TypeID**: Either SRV### for service orders or PRD### for product orders

Examples:
- `CRW001-ORD-PRD001` - Product order created by Crew member CRW001
- `CTR002-ORD-SRV005` - Service order created by Center CTR002

## Order Types

### 1. Service Orders
Service orders are requests for CKS services (cleaning, maintenance, etc.)

**Who can create:**
- Customers
- Centers
- Contractors
- Warehouse

**Approval Flow:**
1. Customer/Center/Contractor creates service request
2. Manager reviews and creates service (transforms to service ID)
3. Service is scheduled and assigned to crew
4. Service execution and completion

### 2. Product Orders
Product orders are requests for supplies and equipment from the warehouse.

**Who can create:**
- Crew members
- Centers
- Contractors
- Customers
- Managers

**Approval Flow:**
1. Requester creates product order
2. Warehouse reviews (Accept/Deny)
3. If accepted, warehouse prepares for delivery
4. Delivery completion

## Order Status States

### Primary Status Values
- **pending**: Action required by current user
- **in-progress**: Waiting for other users to take action
- **approved**: Order has been approved but not yet fulfilled
- **rejected**: Order was denied
- **delivered**: Product order has been delivered (final state)
- **service-created**: Service order has been transformed into a service (final state)
- **cancelled**: Order was cancelled by requester

### Visual Indicators
- **Yellow (Pulsing)**: Active states requiring attention (pending, waiting, accepted but not delivered)
- **Green**: Completed/approved states
- **Red**: Rejected/cancelled states
- **Blue**: In-progress states

## Approval Workflow Visualization

Each order displays an approval workflow tree showing:
```
Role → Role → Role
```

Each stage shows:
- **Role name**: The responsible party
- **Status**: Current status (pending/approved/rejected/accepted)
- **User ID**: Only shown for completed stages (not for pulsing/active stages)
- **Timestamp**: When the action was taken (for completed stages)

### Visual States in Workflow
1. **Completed Stage**: Green box with user ID and timestamp
2. **Active Stage (Pending)**: Yellow pulsing box showing "pending"
3. **Active Stage (Accepted)**: Yellow pulsing box showing "accepted"
4. **Rejected Stage**: Red box with user ID and timestamp

## Product Order Workflow Examples

### Example 1: Pending Warehouse Acceptance
**Order ID**: `CRW001-ORD-PRD001`
**Created by**: CRW-001
**Destination**: CTR-001
**Status**: in-progress (for Crew), pending (for Warehouse)

**Workflow Tree**:
```
Crew (✓ Approved) → Warehouse (⏳ Pending)
```

**Available Actions**:
- Warehouse: Accept, Deny
- Crew: View Details
- Manager: View Details

### Example 2: Accepted by Warehouse (Pending Delivery)
**Order ID**: `CRW001-ORD-PRD002`
**Created by**: CRW-001
**Destination**: CTR-002
**Status**: in-progress (for Crew), approved (for Warehouse)

**Workflow Tree**:
```
Crew (✓ Approved) → Warehouse (⏳ Accepted)
```

**Available Actions**:
- Warehouse: View Details
- Crew: View Details
- Manager: View Details

*Note: Warehouse "Accepted" still shows as pulsing yellow to indicate delivery is pending*

### Example 3: Delivered (Archived)
**Order ID**: `CRW001-ORD-PRD003`
**Created by**: CRW-001
**Destination**: CTR-003
**Status**: delivered (all users)

**Workflow Tree**:
```
Crew (✓ Approved) → Warehouse (✓ Approved)
```

**Order Badge**: DELIVERED (green)
**Available Actions**: View Details (shows delivery details, POD, waybill)

### Example 4: Rejected by Warehouse
**Order ID**: `CRW001-ORD-PRD004`
**Created by**: CRW-001
**Destination**: CTR-001
**Status**: rejected (all users)

**Workflow Tree**:
```
Crew (✓ Approved) → Warehouse (✗ Rejected)
```

**Order Badge**: REJECTED (red)
**Available Actions**: View Details (shows rejection reason)
**Rejection Reason**: "Out of stock - requires special order"

## Service Order Workflow Examples

### Example 1: Pending Manager Approval
**Order ID**: `CTR001-ORD-SRV001`
**Created by**: CTR-001
**Status**: in-progress (for Center), pending (for Manager)

**Workflow Tree**:
```
Center (✓ Approved) → Manager (⏳ Pending)
```

**Available Actions**:
- Manager: Create Service
- Center: Cancel

### Example 2: Service Created (Transformed)
**Order ID**: `CTR001-ORD-SRV002`
**Transformed to**: `SRV-2025-001`
**Status**: service-created

**Workflow Tree**:
```
Center (✓ Approved) → Manager (✓ Service Created)
```

**Order Badge**: SERVICE CREATED (green)
**Shows**: "✓ Transformed to Service ID: SRV-2025-001"

## Role-Based Views

### Manager View
- Can see ALL orders in the ecosystem
- Service orders: Can "Create Service" when pending
- Product orders: View only (monitoring)
- Shows full workflow tree for all orders

### Warehouse View
- Sees product orders requiring warehouse action
- Pending orders show Accept/Deny buttons
- Accepted orders show View Details only
- Cannot see service orders unless warehouse created them

### Crew View
- Can create product orders
- Sees their own product orders
- Service orders they're assigned to
- Limited workflow visibility

### Center/Customer/Contractor Views
- Can create both service and product orders
- See orders they created or are involved in
- Can cancel pending orders they created

## Order Tabs Organization

All order sections have three tabs:
1. **Service Orders**: Active service order requests
2. **Product Orders**: Active product order requests
3. **Archive**: Completed/rejected orders (delivered, service-created, rejected)

Each tab shows:
- Count badge with number of orders
- Search functionality
- Action buttons (role-dependent)

## Action Buttons by Role

### Request Service Button
Available for: Contractor, Customer, Center, Warehouse

### Request Products Button
Available for: Contractor, Customer, Center, Crew, Manager

### View Details Action
Available for all orders, shows different content based on status:
- **Delivered**: "Delivery and order details will show here later. We will be able to add a POD or waybill here."
- **Rejected**: "Rejection details will show here later. It will also show a waybill and a rejection reason."
- **Pending/In-Progress**: "List of products ordered will show here and some other info."

## Order Card Display

### Collapsed State (Default)
Shows single-line colored header with:
- Expand arrow
- Order type badge (SERVICE/PRODUCT)
- Order ID (blue, clickable)
- Title (gray)
- Status badge (right-aligned)

### Expanded State
Shows full details including:
- Order Details section (Requested By, Destination, dates)
- Approval Workflow visualization
- Product/service items list
- Action buttons
- Transformation notice (for service-created orders)

## Status Logic Rules

### For Product Orders:
1. **Crew creates order**:
   - Crew sees: status = 'in-progress'
   - Warehouse sees: status = 'pending'

2. **Warehouse accepts**:
   - Crew sees: status = 'in-progress'
   - Warehouse sees: status = 'approved'
   - Workflow shows: Warehouse (accepted) - still pulsing

3. **Warehouse delivers**:
   - All users see: status = 'delivered'
   - Order moves to Archive tab

### For Service Orders:
1. **Customer/Center creates**:
   - Creator sees: status = 'in-progress'
   - Manager sees: status = 'pending'

2. **Manager creates service**:
   - All users see: status = 'service-created'
   - Shows transformation to Service ID
   - Order moves to Archive tab

## Visual Design Elements

### Pulsing Animation
Applied to active workflow stages using CSS animation:
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7);
  }
  50% {
    opacity: 0.9;
    box-shadow: 0 0 0 8px rgba(251, 191, 36, 0);
  }
}
```

Pulsing indicates stages requiring attention or awaiting action.

### Color Scheme
- **Blue (#3b82f6)**: Order IDs, clickable elements
- **Yellow (#fbbf24)**: Pending/active states
- **Green (#10b981)**: Approved/completed states
- **Red (#ef4444)**: Rejected/cancelled states
- **Gray (#6b7280)**: Inactive/informational elements

## Data Fields

### Required Fields
- `orderId`: Unique identifier
- `orderType`: 'service' | 'product'
- `title`: Order title/description
- `requestedBy`: User ID who created order
- `requestedDate`: Creation date
- `status`: Current order status

### Optional Fields
- `destination`: Delivery destination (for product orders)
- `expectedDate`: Requested delivery/service date
- `deliveryDate`: Actual delivery completion
- `serviceStartDate`: When service begins
- `approvalStages`: Workflow visualization array
- `transformedId`: New ID after transformation
- `items`: Array of products/services requested
- `notes`: Additional order notes
- `rejectionReason`: Why order was rejected

## Future Enhancements

1. **Clickable IDs**: All user/center/warehouse IDs will be clickable to view details
2. **POD Integration**: Proof of delivery upload and viewing
3. **Waybill Tracking**: Integration with shipping providers
4. **Email Notifications**: Automated alerts for status changes
5. **Bulk Orders**: Multiple items in single order
6. **Recurring Orders**: Automated repeat orders
7. **Order Templates**: Save frequently used orders
8. **Analytics Dashboard**: Order metrics and trends
9. **Mobile App Integration**: Order management on mobile devices
10. **API Integration**: Third-party system connectivity

## Testing Scenarios

### Product Order Flow Test
1. Create order as Crew
2. View in Warehouse (should show Accept/Deny)
3. Accept order
4. Verify buttons change to View Details only
5. Verify workflow shows "accepted" while pulsing
6. Simulate delivery
7. Verify order moves to Archive

### Service Order Flow Test
1. Create order as Center
2. View in Manager hub
3. Create Service action
4. Verify transformation ID appears
5. Verify order moves to Archive
6. Check all roles can see final state

### Edge Cases to Test
- Rejecting order with long reason text
- Multiple orders from same user
- Orders with many items
- Simultaneous status updates
- Search functionality across tabs
- Tab count accuracy
- Permission boundaries by role

## Notes for Developers

1. **Status vs Workflow Display**: The `status` field controls actions and overall badge, while `approvalStages` controls the workflow tree visualization

2. **Pulsing Logic**: Any stage with status 'pending', 'waiting', or 'accepted' (for warehouse) will pulse

3. **Tab Organization**: Archive tab combines all final states (delivered, service-created, rejected)

4. **Action Button Logic**: Determined by combination of user role, order type, and current status

5. **Date Fields**: Multiple date fields track different milestones (requested, expected, actual delivery, etc.)

---

*Last Updated: 2025-09-19*
*Version: 1.0*