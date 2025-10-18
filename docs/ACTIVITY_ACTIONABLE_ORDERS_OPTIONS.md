# Activity Feed: Actionable Orders - Architecture Options

## Current Architecture Understanding

### How Order Actions Work Today

**OrderCard Component** (`packages/ui/src/cards/OrderCard/OrderCard.tsx`):
- Shows order details in collapsible card format
- Renders action buttons (Accept, Decline, Cancel, etc.) when `actions` array is provided
- Calls `onAction(actionName)` when button clicked

**OrdersSection Widget** (`packages/domain-widgets/src/OrdersSection/OrdersSection.tsx`):
- Container that displays multiple OrderCards in tabs (All/Service/Product/Archive)
- Passes `onOrderAction` callback to each OrderCard
- OrderCards expand inline to show details + action buttons

**Hub Integration** (e.g., CrewHub.tsx):
```tsx
<OrdersSection
  userRole="crew"
  userCode={normalizedCode}
  serviceOrders={serviceOrders}
  productOrders={productOrders}
  onOrderAction={async (orderId, action) => {
    if (action === 'View Details') {
      setSelectedOrderId(orderId);  // Opens OrderDetailsModal
      return;
    }
    // Execute action: accept, decline, cancel, etc.
    await handleOrderAction(orderId, action);
  }}
/>
```

**Current Activity Feed Flow (Admin only works):**
1. User clicks activity → ActionModal opens
2. User clicks "View Details" → OrderDetailsModal opens (read-only)
3. User clicks action button (Archive, etc.) → Action executes

---

## Your Goal (As I Understand It)

> "When they click recent activity, if order needs action (accept/decline/etc), show them the SAME UI they see in Orders page with action buttons. If order is view-only (completed), just show OrderDetailsModal."

**Key Requirements:**
1. ✅ Reuse existing OrderCard action button code (no new buttons)
2. ✅ Stay in Recent Activity section (no page navigation)
3. ✅ Detect if order needs action vs. view-only
4. ✅ Show actionable interface for actionable orders
5. ✅ Show read-only modal for view-only orders

---

## Three Implementation Options

### Option 1: OrderCard in Modal (⭐ RECOMMENDED)

**How It Works:**
1. User clicks activity
2. Backend returns order data with `availableActions` array
3. Frontend checks:
   - If `availableActions.length > 0`: Show OrderCard in modal
   - If empty: Show OrderDetailsModal

**Implementation:**
- Create new `OrderActionModal` component that wraps a single OrderCard
- Modal shows expanded OrderCard with action buttons
- Reuses ALL existing OrderCard logic (buttons, workflow, etc.)
- When action clicked: Execute action → Close modal → Refresh activity feed

**Pros:**
- ✅ 100% code reuse of OrderCard component
- ✅ Exact same UX as Orders section
- ✅ Stay in Recent Activity section
- ✅ Clean separation of concerns

**Cons:**
- ⚠️ Need to create new modal component (but simple wrapper)
- ⚠️ OrderCard in modal might look different than in list

**Code Sketch:**
```tsx
// New component: OrderActionModal.tsx
<Modal isOpen={isOpen} onClose={onClose}>
  <OrderCard
    orderId={order.orderId}
    orderType={order.orderType}
    title={order.title}
    status={order.status}
    actions={order.availableActions}  // e.g., ['Accept', 'Decline', 'Cancel']
    onAction={(action) => {
      handleOrderAction(order.orderId, action);
      onClose();
    }}
    showWorkflow={true}
    collapsible={false}  // Always expanded in modal
    defaultExpanded={true}
  />
</Modal>
```

---

### Option 2: Navigate to Orders Tab + Highlight

**How It Works:**
1. User clicks activity
2. Check if order has actions
3. If yes: Navigate to Orders tab → Auto-expand and highlight the order
4. If no: Show OrderDetailsModal

**Implementation:**
- Use existing URL navigation: `?tab=orders&orderId=CRW-006-PO-107`
- OrdersSection already has highlighting logic (`newOrderId` prop)
- Order auto-expands to show action buttons

**Pros:**
- ✅ Zero new components needed
- ✅ Uses existing highlight/navigation logic
- ✅ User sees order in context with other orders

**Cons:**
- ❌ Navigates away from Recent Activity section
- ❌ User loses place in activity feed
- ❌ More jarring UX (page changes)

---

### Option 3: Inline Expansion in Activity Item

**How It Works:**
1. User clicks activity
2. Activity item expands inline
3. Shows embedded OrderCard with action buttons
4. User takes action → Card collapses

**Implementation:**
- Modify ActivityItem component to support "expanded" state
- When expanded, render OrderCard inline
- Similar to how OrderCard expands in OrdersSection

**Pros:**
- ✅ Stay in Recent Activity section
- ✅ No modal needed
- ✅ Feels like Orders section expansion

**Cons:**
- ⚠️ Activity items might become very tall when expanded
- ⚠️ Harder to scan activity feed if items expand inline
- ⚠️ Scrolling issues if many activities expanded

---

## Recommendation: Option 1 (OrderCard in Modal)

**Why:**
1. **Code Reuse**: 100% reuse of OrderCard component and all its logic
2. **UX Consistency**: Exact same UI as Orders section, just in modal
3. **No Navigation**: Stay in Recent Activity section
4. **Clean**: Clear visual separation between activity feed and action UI

**Implementation Effort:**
- **Easy**: Create `OrderActionModal` wrapper (~30 lines)
- **Easy**: Wire up modal to ActivityFeed component
- **Easy**: Add logic to detect actionable vs view-only orders

---

## Decision Logic: Actionable vs View-Only

**Backend Already Provides This:**
```tsx
interface Order {
  availableActions?: string[];  // e.g., ['Accept', 'Decline', 'Cancel']
}
```

**Frontend Logic:**
```tsx
// When activity clicked
const order = await fetchOrderForActivity(activityTargetId);

if (order.availableActions && order.availableActions.length > 0) {
  // Actionable: Show OrderActionModal with buttons
  setActionableOrder(order);
} else {
  // View-only: Show OrderDetailsModal
  setSelectedOrderId(order.orderId);
}
```

---

## Implementation Plan (Option 1)

### Phase 1: Create OrderActionModal Component
```tsx
// packages/ui/src/modals/OrderActionModal/OrderActionModal.tsx
export function OrderActionModal({
  isOpen,
  onClose,
  order,
  onAction,
}) {
  return (
    <ModalRoot isOpen={isOpen} onClose={onClose}>
      <OrderCard
        {...order}
        actions={order.availableActions}
        onAction={(action) => {
          onAction(order.orderId, action);
          onClose();
        }}
        showWorkflow={true}
        collapsible={false}
        defaultExpanded={true}
      />
    </ModalRoot>
  );
}
```

### Phase 2: Update ActivityFeed Component
```tsx
// apps/frontend/src/components/ActivityFeed.tsx
const handleActivityClick = async (activity: Activity) => {
  const order = await fetchOrderForActivity(activity.targetId);

  // Decision logic
  if (order.availableActions && order.availableActions.length > 0) {
    // Actionable order: Show OrderActionModal
    onOpenActionableOrder?.(order);
  } else {
    // View-only: Show OrderDetailsModal
    onOpenOrderModal?.(order);
  }
};
```

### Phase 3: Wire Up in Hubs
```tsx
// apps/frontend/src/hubs/CrewHub.tsx (and others)
const [actionableOrder, setActionableOrder] = useState(null);

<ActivityFeed
  onOpenActionableOrder={setActionableOrder}  // NEW
  onOpenOrderModal={(order) => setSelectedOrderId(order.orderId)}
/>

{/* New Modal */}
{actionableOrder && (
  <OrderActionModal
    isOpen={true}
    onClose={() => setActionableOrder(null)}
    order={actionableOrder}
    onAction={handleOrderAction}
  />
)}

{/* Existing Modal */}
<OrderDetailsGateway
  orderId={selectedOrderId}
  onClose={() => setSelectedOrderId(null)}
/>
```

---

## Summary Table

| Aspect | Option 1: Modal | Option 2: Navigate | Option 3: Inline |
|--------|----------------|-------------------|------------------|
| Code Reuse | ✅ 100% | ✅ 100% | ✅ 100% |
| Stay in Activity | ✅ Yes | ❌ No | ✅ Yes |
| New Components | ⚠️ 1 simple modal | ✅ None | ⚠️ Modify ActivityItem |
| UX Clarity | ✅ Excellent | ⚠️ Disruptive | ⚠️ Can be cluttered |
| Effort | ⭐ Low | ⭐ Very Low | ⭐⭐ Medium |

**My Vote: Option 1** 🎯

---

## Questions for You

1. **Does Option 1 (OrderCard in Modal) match your vision?**
2. **Or do you prefer Option 2 (navigate to Orders tab)?**
3. **Any concerns about showing OrderCard in a modal?**
4. **Do you want me to implement Option 1 or have GPT-5 do it?**

Let me know your preference and I'll create the implementation plan!
