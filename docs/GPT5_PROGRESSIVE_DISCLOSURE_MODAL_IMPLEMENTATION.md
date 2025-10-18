# GPT-5 Implementation Task: Progressive Disclosure Modal Pattern

## Objective

Implement a **progressive disclosure pattern** for activity feed modals across **ALL 7 HUBS** (including AdminHub) to create a seamless user experience. Users should be able to see quick actions AND full details in the same modal without switching between multiple modals.

### Key Highlights

- ✅ **All 7 Hubs**: CrewHub, CenterHub, CustomerHub, ContractorHub, ManagerHub, WarehouseHub, **AdminHub**
- ✅ **Same Component**: `ActivityModal` with role-based behavior (`role="user"` or `role="admin"`)
- ✅ **User Actions**: Accept, Decline, Cancel (for workflow hubs)
- ✅ **Admin Actions**: Edit, Archive, Restore, Delete (for AdminHub)
- ✅ **Reuse Existing**: Wraps ProductOrderModal/ServiceOrderModal content (no duplication)
- ✅ **Progressive Disclosure**: Compact view → Expands in place → No modal switching

## Problem We're Solving

**Current Bad UX**:
```
User clicks activity → OrderActionModal opens (shows OrderCard + actions)
  ↓
User clicks "View Details" → OrderDetailsModal opens (SECOND MODAL)
  ↓
User wants to take action → Must close modal and click activity again
```

**New Seamless UX**:
```
User clicks activity → Modal opens showing compact OrderCard + quick actions
  ↓
User clicks "View Details" button → Modal EXPANDS IN PLACE to show full details
  ↓
User can see details AND actions in SAME VIEW
```

---

## Core Design Principle

**REUSE EXISTING MODALS** - We are NOT creating new modals from scratch. We are wrapping the existing `ProductOrderModal` and `ServiceOrderModal` with a progressive disclosure pattern.

**What Changes**:
- Add a compact "quick view" section at the top (OrderCard + action buttons)
- Add an expand/collapse mechanism
- When collapsed: Show only OrderCard + actions
- When expanded: Show OrderCard + actions + ALL existing detail sections

**What Stays the Same**:
- All existing detail sections (Requestor Info, Delivery Info, Product Items, etc.)
- All existing styling and layouts
- All existing banner logic (Archived, Deleted)

---

## Implementation Approach

### Option A: Wrapper Component (Recommended)

Create a new `ActivityModal` component that wraps the existing detail modals.

**Structure**:
```tsx
<ActivityModal>
  {/* Quick View Section - Always Visible */}
  <QuickViewSection>
    <OrderCard {...orderData} />
    <ActionButtons>
      <AcceptButton />
      <DeclineButton />
      <ViewDetailsButton onClick={() => setExpanded(!expanded)} />
    </ActionButtons>
  </QuickViewSection>

  {/* Expandable Details Section */}
  {expanded && (
    <DetailsSection>
      {/* Render existing ProductOrderModal or ServiceOrderModal content */}
      {orderType === 'product' ? (
        <ProductOrderModalContent {...props} />
      ) : (
        <ServiceOrderModalContent {...props} />
      )}
    </DetailsSection>
  )}
</ActivityModal>
```

### Option B: Enhance Existing Modals

Modify `ProductOrderModal` and `ServiceOrderModal` to accept an `isCompact` prop that controls progressive disclosure.

**Structure**:
```tsx
<ProductOrderModal isCompact={true} onExpand={() => setExpanded(true)}>
  {/* Compact mode: Show only OrderCard + actions */}
  {!expanded && <CompactView />}

  {/* Expanded mode: Show OrderCard + all existing content */}
  {expanded && (
    <>
      <CompactView />
      <ExistingDetailSections />
    </>
  )}
</ProductOrderModal>
```

---

## Required Components

### 1. ActivityModal (New Wrapper Component) - RECOMMENDED APPROACH

**File**: `packages/ui/src/modals/ActivityModal/ActivityModal.tsx`

**Purpose**: Wraps existing detail modals with progressive disclosure pattern

**Props**:
```typescript
interface ActivityModalProps {
  // Modal control
  isOpen: boolean;
  onClose: () => void;

  // Entity data (from useOrderDetails hook)
  order: {
    orderId: string;
    orderType: 'service' | 'product';
    title: string;
    requestedBy?: string;
    destination?: string;
    requestedDate: string;
    status: string;
    // ... other order fields
  };

  // Action handling
  onAction: (action: string) => void;
  availableActions: string[]; // e.g., ['Accept', 'Decline', 'Cancel', 'View Details']

  // Detail sections (pass through to ProductOrderModal/ServiceOrderModal)
  requestorInfo?: RequestorInfo;
  destinationInfo?: DestinationInfo;
  availability?: AvailabilityWindow;
  cancellationInfo?: CancellationInfo;
  rejectionInfo?: RejectionInfo;
  archiveMetadata?: ArchiveMetadata;

  // Progressive disclosure control
  defaultExpanded?: boolean; // Start expanded? (useful for certain roles)
}
```

**Behavior**:
1. Starts in **compact mode** (collapsed)
2. Shows OrderCard with order summary
3. Shows action buttons below OrderCard
4. "View Details" button toggles expansion
5. When expanded:
   - OrderCard + actions stay visible at top (sticky)
   - Full detail sections appear below
   - "View Details" button changes to "Hide Details"
6. Actions are always accessible (no scrolling to find them)

**Key Features**:
- Smooth expand/collapse animation (300ms ease-in-out)
- Sticky action bar when scrolling in expanded mode
- Keyboard accessible (Tab, Escape)
- Mobile responsive

---

### 2. Modify ProductOrderModal and ServiceOrderModal

**Goal**: Extract content sections for reusability

**Current Structure**:
```tsx
<ProductOrderModal>
  <Header />
  <DeletedBanner />
  <ArchivedBanner />
  <StatusBadge />
  <Content>
    <OrderInformation />
    <RequestorInformation />
    <DeliveryInformation />
    <ProductItems />
    <SpecialInstructions />
    <CancellationReason />
    <RejectionReason />
  </Content>
  <Footer />
</ProductOrderModal>
```

**New Structure** (Option 1 - Extract Content):
```tsx
// Extract content into separate component
export const ProductOrderContent = ({ order, requestorInfo, ... }) => (
  <>
    {/* All the existing detail sections */}
    <OrderInformation />
    <RequestorInformation />
    <DeliveryInformation />
    <ProductItems />
    <SpecialInstructions />
    <CancellationReason />
    <RejectionReason />
  </>
);

// Keep ProductOrderModal as-is for backward compatibility
export const ProductOrderModal = (props) => (
  <ModalRoot isOpen={props.isOpen} onClose={props.onClose}>
    <div className={styles.modal}>
      <Header />
      <DeletedBanner />
      <ArchivedBanner />
      <ProductOrderContent {...props} />
      <Footer />
    </div>
  </ModalRoot>
);
```

**This allows ActivityModal to reuse ProductOrderContent**:
```tsx
<ActivityModal>
  {/* Compact section */}
  <OrderCard />
  <ActionButtons />

  {/* Expanded section */}
  {expanded && (
    <>
      <DeletedBanner />
      <ArchivedBanner />
      <ProductOrderContent {...props} />
    </>
  )}
</ActivityModal>
```

---

## Visual Specification

### Compact Mode (Initial State)

```
┌─────────────────────────────────────────────────┐
│ Product Order #CEN-010-PO-106              [X]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ PRODUCT ORDER                             ┃  │
│  ┃ ─────────────                             ┃  │
│  ┃ Order ID: CEN-010-PO-106                  ┃  │
│  ┃ Product: 10x Cement Bags                  ┃  │
│  ┃ Requestor: CUS-001 - Customer One         ┃  │
│  ┃ Destination: WH-A - Warehouse Alpha       ┃  │
│  ┃ Status: 🟡 Pending Approval               ┃  │
│  ┃ Requested: Jan 15, 2025                   ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  [✓ Accept]  [✗ Decline]  [▼ View Details]│ │ ← Action Bar
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
   Height: ~400px (compact, fits on screen)
```

### Expanded Mode (After Clicking "View Details")

```
┌─────────────────────────────────────────────────┐
│ Product Order #CEN-010-PO-106              [X]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ PRODUCT ORDER                             ┃  │
│  ┃ Order ID: CEN-010-PO-106                  ┃  │
│  ┃ Product: 10x Cement Bags                  ┃  │
│  ┃ Status: 🟡 Pending Approval               ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                 │
├═════════════════════════════════════════════════┤ ← Sticky when scrolling
│  [✓ Accept]  [✗ Decline]  [▲ Hide Details]     │
├─────────────────────────────────────────────────┤
│                                                 │
│  🗂️ ARCHIVED ORDER BANNER (if archived)        │
│  ───────────────────────────────────────────   │
│  [Grey banner with archive metadata]           │
│                                                 │
│  📋 DETAILED INFORMATION                        │
│  ══════════════════════                         │
│                                                 │
│  Requestor Information                          │
│  ───────────────────────                        │
│  Name:    CUS-001 - Customer One                │
│  Address: 123 Business Pkwy, Miami, FL          │
│  Phone:   (555) 123-4567                        │
│  Email:   customer.one@example.com              │
│                                                 │
│  Delivery Information                           │
│  ──────────────────────                         │
│  Destination: WH-A - Warehouse Alpha            │
│  Address:     456 Storage Ln, Miami, FL         │
│  ...                                            │
│                                                 │
│  Product Items                                  │
│  ──────────────                                 │
│  [Table with product line items]                │
│                                                 │
│  Special Instructions                           │
│  ──────────────────────                         │
│  "Deliver to loading dock B..."                 │
│                                                 │
├─────────────────────────────────────────────────┤
│  [✓ Accept Order]  [✗ Decline]  [Close]        │ ← Bottom actions
└─────────────────────────────────────────────────┘
   Height: Variable (scrollable content)
   Max-height: 90vh
```

---

## CSS Specifications

### Layout
- **Modal Width**:
  - Compact: `600px`
  - Expanded: `700px` (slightly wider to accommodate details)
  - Mobile: `100vw` (full screen)
- **Modal Max-Height**: `90vh` (prevent overflow)
- **Padding**: `24px` (desktop), `16px` (mobile)

### Action Bar (Sticky)
```css
.actionBar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); /* When scrolling */
}
```

### Expand/Collapse Animation
```css
.detailsSection {
  max-height: 0;
  overflow: hidden;
  transition: max-height 300ms ease-in-out;
}

.detailsSection.expanded {
  max-height: 5000px; /* Large enough to fit all content */
}
```

### View Details Button States
- **Collapsed**: `▼ View Details` (or "Show More")
- **Expanded**: `▲ Hide Details` (or "Show Less")
- **Icon rotation**: Smooth 180deg rotation on transition

### Responsive Breakpoints
```css
/* Mobile */
@media (max-width: 640px) {
  .modal { width: 100vw; padding: 16px; }
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  .modal { width: 90vw; }
}

/* Desktop */
@media (min-width: 1025px) {
  .modal { width: 600px; } /* 700px when expanded */
}
```

---

## Integration with Hubs

### Current Flow (Hub → OrderActionModal → OrderDetailsModal)

**CrewHub.tsx** (Example):
```tsx
const handleActivityClick = (activity: Activity) => {
  // Opens OrderActionModal
  setSelectedOrderForAction(activity.entityId);
};

// In JSX
{selectedOrderForAction && (
  <OrderActionModal
    orderId={selectedOrderForAction}
    onClose={() => setSelectedOrderForAction(null)}
    onAction={handleOrderAction}
  />
)}

{selectedOrderId && (
  <OrderDetailsGateway
    orderId={selectedOrderId}
    onClose={() => setSelectedOrderId(null)}
  />
)}
```

### New Flow (Hub → ActivityModal with Progressive Disclosure)

**CrewHub.tsx** (Updated):
```tsx
const handleActivityClick = (activity: Activity) => {
  // Opens ActivityModal (combines actions + details)
  setSelectedOrderId(activity.entityId);
};

// In JSX
{selectedOrderId && (
  <ActivityModal
    orderId={selectedOrderId}
    onClose={() => setSelectedOrderId(null)}
    onAction={handleOrderAction}
    defaultExpanded={false} // Start compact
  />
)}

// OrderActionModal and OrderDetailsGateway are NO LONGER USED
```

---

## Files to Create

### 1. ActivityModal Component
- `packages/ui/src/modals/ActivityModal/ActivityModal.tsx`
- `packages/ui/src/modals/ActivityModal/ActivityModal.module.css`
- `packages/ui/src/modals/ActivityModal/types.ts`

### 2. Content Extraction (if needed)
- `packages/ui/src/modals/ProductOrderModal/ProductOrderContent.tsx` (optional)
- `packages/ui/src/modals/ServiceOrderModal/ServiceOrderContent.tsx` (optional)

---

## Files to Modify

### 1. UI Package Exports
**File**: `packages/ui/src/index.ts`

Add:
```typescript
export * from './modals/ActivityModal/ActivityModal';
export { default as ActivityModal } from './modals/ActivityModal/ActivityModal';
```

### 2. Hub Files (All 6 Hubs)
**Files**:
- `apps/frontend/src/hubs/CrewHub.tsx`
- `apps/frontend/src/hubs/CenterHub.tsx`
- `apps/frontend/src/hubs/CustomerHub.tsx`
- `apps/frontend/src/hubs/ContractorHub.tsx`
- `apps/frontend/src/hubs/ManagerHub.tsx`
- `apps/frontend/src/hubs/WarehouseHub.tsx`

**Changes**:
1. Replace `OrderActionModal` usage with `ActivityModal`
2. Remove separate `OrderDetailsGateway` rendering (now integrated)
3. Update `handleActivityClick` to use single modal

### 3. OrderDetailsGateway (Potential Refactor)
**File**: `apps/frontend/src/components/OrderDetailsGateway.tsx`

**Option A**: Keep as-is for backward compatibility (AdminHub still uses it)

**Option B**: Refactor to be used BY ActivityModal:
```tsx
// ActivityModal internally uses OrderDetailsGateway to get data
const ActivityModal = ({ orderId, onAction, ... }) => {
  const orderDetails = useOrderDetails({ orderId });

  return (
    <Modal>
      <OrderCard {...orderDetails.order} />
      {expanded && <OrderDetailsContent {...orderDetails} />}
    </Modal>
  );
};
```

---

## Action Button Handling

### Available Actions
Actions come from the backend via the order's `availableActions` array:
- `"Accept"` / `"Approve"`
- `"Decline"` / `"Reject"`
- `"Cancel"`
- `"View Details"` (special - toggles expansion)

### Action Handler
```typescript
const handleAction = (action: string) => {
  if (action === 'View Details') {
    setExpanded(!expanded);
    return;
  }

  // For other actions, call the onAction callback
  onAction?.(action);
};
```

### Filter "View Details" from Backend Actions
Since "View Details" is now an expand button (not an action sent to backend), filter it out:
```typescript
const backendActions = availableActions.filter(a => a !== 'View Details');
```

---

## Data Flow

### 1. User Clicks Activity in Feed
```
User clicks activity → handleActivityClick(activity)
  ↓
setSelectedOrderId(activity.entityId)
  ↓
ActivityModal opens with orderId
```

### 2. ActivityModal Fetches Data
```
ActivityModal receives orderId
  ↓
Uses useOrderDetails hook to fetch order data
  ↓
Renders OrderCard with order summary
  ↓
Renders action buttons
```

### 3. User Clicks "View Details"
```
User clicks "View Details" button
  ↓
setExpanded(true)
  ↓
Details section animates in (expand transition)
  ↓
User can now see OrderCard + Actions + Full Details in SAME modal
```

### 4. User Takes Action
```
User clicks "Accept" or "Decline"
  ↓
onAction('Accept') called
  ↓
Hub's handleOrderAction processes the action
  ↓
Backend API call made
  ↓
Modal closes or refreshes
```

---

## Testing Checklist

### Component Testing
- ✅ ActivityModal renders with order data
- ✅ Compact mode shows OrderCard + action buttons
- ✅ "View Details" button expands modal
- ✅ Expanded mode shows all detail sections
- ✅ Action buttons work in both modes
- ✅ Sticky action bar works when scrolling
- ✅ Expand/collapse animation is smooth
- ✅ Modal closes on X button click
- ✅ Modal closes on outside click
- ✅ Keyboard navigation works (Tab, Escape)

### Integration Testing
- ✅ CrewHub activity click opens ActivityModal
- ✅ CenterHub activity click opens ActivityModal
- ✅ CustomerHub activity click opens ActivityModal
- ✅ ContractorHub activity click opens ActivityModal
- ✅ ManagerHub activity click opens ActivityModal
- ✅ WarehouseHub activity click opens ActivityModal
- ✅ AdminHub activity click opens ActivityModal (with admin actions)

### Order Type Testing
- ✅ Product orders display correctly
- ✅ Service orders display correctly
- ✅ Archived orders show grey banner (in expanded view)
- ✅ Deleted orders show red banner (in expanded view)
- ✅ Cancelled orders show cancellation info
- ✅ Rejected orders show rejection info

### Action Testing
- ✅ Accept action works
- ✅ Decline/Reject action works
- ✅ Cancel action works
- ✅ Actions prompt for reason when needed
- ✅ Actions update backend correctly
- ✅ Modal refreshes/closes after action

### Responsive Testing
- ✅ Desktop (1920x1080) - Modal centered, 600px/700px width
- ✅ Tablet (768x1024) - Modal 90% width
- ✅ Mobile (375x667) - Full screen modal

---

## Future Extensions

### Support for Other Entity Types

The ActivityModal should be designed to support:
1. **Orders** (product + service) ← Start here
2. **Reports** - Same pattern: ReportCard + actions + report details
3. **Feedback** - Same pattern: FeedbackCard + actions + feedback details
4. **Services** (managers) - ServiceCard + manager-specific actions + service details
5. **Deliveries** (warehouses) - DeliveryCard + delivery actions + delivery details

**Approach**:
```typescript
interface ActivityModalProps {
  entityType: 'order' | 'report' | 'feedback' | 'service' | 'delivery';
  entityId: string;
  // ...
}

// Inside ActivityModal
const renderCard = () => {
  switch (entityType) {
    case 'order': return <OrderCard {...data} />;
    case 'report': return <ReportCard {...data} />;
    case 'feedback': return <FeedbackCard {...data} />;
    // ...
  }
};

const renderDetails = () => {
  switch (entityType) {
    case 'order': return <OrderDetailsContent {...data} />;
    case 'report': return <ReportDetailsContent {...data} />;
    // ...
  }
};
```

---

## Important Notes

### AdminHub Integration (UPDATED REQUIREMENT)

**ALL 7 HUBS** (including AdminHub) will use the progressive disclosure pattern!

**Key Difference**: AdminHub shows **admin actions** instead of user workflow actions.

#### Admin Actions vs User Actions

**User Hubs** (CrewHub, CenterHub, etc.):
- Accept Order
- Decline Order
- Cancel Order
- View Details

**AdminHub**:
- Edit Order
- Archive Order
- Restore Order (for archived orders)
- Delete Order
- View Details

#### ActivityModal Role Support

The ActivityModal component must support a `role` prop:

```typescript
interface ActivityModalProps {
  // ... other props
  role: 'user' | 'admin';
  orderState?: 'active' | 'archived' | 'deleted';

  // Admin-specific callbacks
  onEdit?: (order: OrderData) => void;
  onArchive?: (orderId: string, reason: string) => Promise<void>;
  onRestore?: (orderId: string) => Promise<void>;
  onDelete?: (orderId: string) => Promise<void>;

  // User-specific callback
  onAction?: (action: string) => void;
}
```

**When `role === 'admin'`**:
- Use `buildOrderActions()` from `@cks/domain-widgets` to generate admin actions
- Show Edit, Archive, Delete, Restore buttons based on order state
- Admin actions appear in same position as user actions (top action bar)

**When `role === 'user'`**:
- Use `order.availableActions` from backend
- Show Accept, Decline, Cancel buttons
- User actions appear in top action bar

**See `docs/ADMINHUB_PROGRESSIVE_DISCLOSURE_INTEGRATION.md` for full AdminHub specifications.**

### Backward Compatibility
- Keep `ProductOrderModal` and `ServiceOrderModal` as standalone components (for future direct usage)
- **Remove** `OrderActionModal` usage from all hubs (including AdminHub)
- New `ActivityModal` replaces both OrderActionModal and OrderDetailsGateway usage

### Build Requirements
- Run `pnpm build` after changes to UI package
- Verify frontend builds successfully
- Check bundle size (should not increase significantly)

---

## Success Criteria

**UX Goals**:
- ✅ User can see order details WITHOUT switching modals
- ✅ User can take action WITHOUT leaving modal
- ✅ Actions always visible (sticky header when scrolling)
- ✅ Smooth, intuitive expand/collapse interaction
- ✅ Zero modal-switching friction

**Technical Goals**:
- ✅ Single modal component (no nested modals)
- ✅ Reuses existing ProductOrderModal/ServiceOrderModal content
- ✅ Accessible (WCAG 2.1 AA)
- ✅ Mobile-friendly
- ✅ <300ms load time
- ✅ Clean, maintainable code

---

## Questions for Clarification

1. **OrderCard in Compact Mode**: Should we reuse the existing `OrderCard` component or create a simplified version?
   - Current OrderCard has collapsible mode - can we leverage this?

2. **Action Button Layout**:
   - Should actions be horizontal (side by side) or vertical (stacked)?
   - Mobile layout: Should actions stack on small screens?

3. **Initial Expansion State**:
   - Always start collapsed?
   - Or start expanded for certain roles (e.g., Admins)?

4. **"View Details" Button Placement**:
   - As a button next to Accept/Decline?
   - Or as a toggle icon/link?

5. **Animation Preference**:
   - Slide down animation?
   - Fade in animation?
   - Height expansion (recommended for performance)?

---

## Implementation Steps

### Phase 1: Create ActivityModal Component
1. Create `ActivityModal.tsx` with basic structure
2. Add expand/collapse state management
3. Render OrderCard in compact mode
4. Add action buttons with "View Details" toggle
5. Add CSS module with animations

### Phase 2: Integrate with Order Details
1. Import ProductOrderModal and ServiceOrderModal content
2. Render detail sections when expanded
3. Handle archived/deleted banners
4. Test with sample order data

### Phase 3: Update All 7 Hubs
1. Replace OrderActionModal with ActivityModal in CrewHub (pilot with `role="user"`)
2. Test thoroughly with user actions
3. Roll out to other 5 user hubs (Center, Customer, Contractor, Manager, Warehouse)
4. Update AdminHub with `role="admin"` and admin action callbacks
5. Test AdminHub admin actions (Edit, Archive, Restore, Delete)
6. Remove old OrderActionModal and OrderDetailsGateway imports from all hubs

### Phase 4: Polish & Test
1. Add smooth animations
2. Implement sticky action bar
3. Test responsive layouts
4. Keyboard accessibility testing
5. Cross-browser testing

---

## Deliverables

1. **New ActivityModal Component** - Progressive disclosure modal with role support (user + admin)
2. **Updated Hub Files** - All 7 hubs (CrewHub, CenterHub, CustomerHub, ContractorHub, ManagerHub, WarehouseHub, AdminHub) using new modal
3. **CSS Modules** - Styling for expand/collapse animations and action button variants
4. **Type Definitions** - TypeScript interfaces for ActivityModal props (with role support)
5. **buildOrderActions Integration** - AdminHub uses existing buildOrderActions from @cks/domain-widgets
6. **Build Verification** - Successful build of UI package and frontend
7. **Documentation** - Update implementation docs

---

## References

- Research Doc: `docs/SEAMLESS_ACTIVITY_MODAL_UX_RESEARCH.md`
- AdminHub Integration Doc: `docs/ADMINHUB_PROGRESSIVE_DISCLOSURE_INTEGRATION.md`
- Previous Session: `docs/sessions/SESSION WITH-CLAUDE-2025-10-16.md`
- Existing Components:
  - `packages/ui/src/modals/ProductOrderModal/ProductOrderModal.tsx`
  - `packages/ui/src/modals/ServiceOrderModal/ServiceOrderModal.tsx`
  - `packages/ui/src/modals/OrderActionModal/OrderActionModal.tsx`
  - `packages/ui/src/modals/ActionModal/ActionModal.tsx`
  - `packages/ui/src/cards/OrderCard/OrderCard.tsx`
- Shared Functions:
  - `packages/domain-widgets/src/shared/utils/buildOrderActions.ts`

---

**Implementation Priority**: HIGH
**Estimated Effort**: 5-7 hours (including AdminHub integration)
**Dependencies**: None (all components exist)
**Risks**: Low (additive change, doesn't break existing functionality)

---

**Ready to implement!**
