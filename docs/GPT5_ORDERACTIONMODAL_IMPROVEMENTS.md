# GPT-5 Task: OrderActionModal UI Improvements

## Context

OrderActionModal is working correctly and showing the approval workflow when users click activities. However, it needs two UI enhancements:

1. **Add "View Details" button** - Currently filtered out, needs to be shown
2. **Add close button (X)** in top-right corner for better UX

## Current Issues

### Issue 1: "View Details" Button is Filtered Out

**File**: `packages/ui/src/modals/OrderActionModal/OrderActionModal.tsx:34`

```tsx
const actionButtons = (order.availableActions || []).filter((a) => a !== 'View Details');
```

This removes "View Details" from the action buttons. Users need this to switch from actionable view to read-only detailed view.

### Issue 2: No Visual Close Button

The modal can be closed by:
- Clicking outside the modal (overlay)
- Pressing Escape key

But there's no visible X button in the top-right corner, which users expect to see.

## Reference Implementation: OrderDetailsModal

**File**: `packages/ui/src/modals/OrderDetailsModal/OrderDetailsModal.tsx:102-104`

```tsx
<button className={styles.closeButton} onClick={onClose} aria-label="Close">
  ✕
</button>
```

**CSS File**: `packages/ui/src/modals/OrderDetailsModal/OrderDetailsModal.module.css:53-72`

```css
.closeButton {
  background: none;
  border: none;
  font-size: 24px;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.closeButton:hover {
  background-color: #f3f4f6;
  color: #374151;
}
```

## Requirements

### Requirement 1: Add "View Details" Button

**Behavior**:
1. Remove the filter that excludes "View Details" from action buttons
2. When user clicks "View Details":
   - Close OrderActionModal (call `onClose()`)
   - Open OrderDetailsModal by passing orderId to parent
3. Keep other actions (Accept, Decline, Cancel) working as they do now

**Implementation Approach**:

Update `OrderActionModal.tsx`:

```tsx
// REMOVE LINE 34:
// const actionButtons = (order.availableActions || []).filter((a) => a !== 'View Details');

// REPLACE WITH:
const actionButtons = order.availableActions || [];
```

Update the `onAction` handler in `OrderCard`:

```tsx
onAction={(action) => {
  if (action === 'View Details') {
    // Special case: open details modal instead of executing action
    onAction(order.orderId, action);
    onClose();
    return;
  }
  // Normal actions: execute and close
  onAction(order.orderId, action);
  onClose();
}}
```

**Hub-side handling** (already implemented in all hubs):

Example from `CrewHub.tsx:749-752`:
```tsx
if (action === 'View Details') {
  setSelectedOrderId(orderId);
  return;
}
```

This pattern exists in all 6 non-admin hubs, so no hub changes needed.

### Requirement 2: Add Close Button (X)

**Behavior**:
- Display an X button in the top-right corner of the modal
- On click: call `onClose()` to dismiss modal
- Style consistently with OrderDetailsModal

**Implementation Approach**:

1. **Create CSS Module**: `packages/ui/src/modals/OrderActionModal/OrderActionModal.module.css`

```css
.modal {
  position: relative;
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  min-width: 600px;
  max-width: 800px;
  max-height: 90vh;
  overflow: auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.closeButton {
  background: none;
  border: none;
  font-size: 24px;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.closeButton:hover {
  background-color: #f3f4f6;
  color: #374151;
}
```

2. **Update OrderActionModal.tsx**:

```tsx
import React from 'react';
import { ModalRoot } from '../ModalRoot';
import OrderCard from '../../cards/OrderCard';
import styles from './OrderActionModal.module.css';  // NEW IMPORT

export interface OrderActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    orderId: string;
    orderType: 'service' | 'product';
    title: string;
    requestedBy?: string | null;
    destination?: string | null;
    requestedDate: string | null;
    expectedDate?: string | null;
    serviceStartDate?: string | null;
    deliveryDate?: string | null;
    status: string;
    approvalStages?: Array<{
      role: string;
      status: string;
      user?: string | null;
      timestamp?: string | null;
    }>;
    availableActions?: string[];
    transformedId?: string | null;
  };
  onAction: (orderId: string, action: string) => void;
}

export function OrderActionModal({ isOpen, onClose, order, onAction }: OrderActionModalProps) {
  if (!isOpen || !order) return null;

  // Don't filter out "View Details" anymore
  const actionButtons = order.availableActions || [];

  return (
    <ModalRoot isOpen={isOpen} onClose={onClose}>
      <div className={styles.modal}>
        {/* NEW: Header with close button */}
        <div className={styles.header}>
          <div style={{ flex: 1 }} /> {/* Spacer to push X to the right */}
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Existing OrderCard */}
        <OrderCard
          orderId={order.orderId}
          orderType={order.orderType}
          title={order.title}
          requestedBy={order.requestedBy ?? undefined}
          destination={order.destination ?? undefined}
          requestedDate={order.requestedDate || new Date().toISOString()}
          expectedDate={order.expectedDate || undefined}
          serviceStartDate={order.serviceStartDate || undefined}
          deliveryDate={order.deliveryDate || undefined}
          status={(order.status || 'pending') as any}
          approvalStages={(order.approvalStages as any) || []}
          actions={actionButtons}
          onAction={(action) => {
            if (action === 'View Details') {
              // Pass to parent to handle opening OrderDetailsModal
              onAction(order.orderId, action);
              onClose();
              return;
            }
            // Normal actions
            onAction(order.orderId, action);
            onClose();
          }}
          showWorkflow={true}
          collapsible={false}
          defaultExpanded={true}
          transformedId={order.transformedId || undefined}
        />
      </div>
    </ModalRoot>
  );
}
```

## Files to Modify

1. **packages/ui/src/modals/OrderActionModal/OrderActionModal.tsx**
   - Remove "View Details" filter
   - Add CSS import
   - Add header div with close button
   - Update modal wrapper to use CSS class
   - Update onAction handler to support "View Details"

2. **packages/ui/src/modals/OrderActionModal/OrderActionModal.module.css** (NEW FILE)
   - Create with modal, header, and closeButton styles

## Testing Checklist

After implementation:

### Test 1: Close Button
- [ ] Click activity in CrewHub → OrderActionModal opens
- [ ] X button visible in top-right corner
- [ ] Click X → Modal closes
- [ ] X button has hover effect (gray background)

### Test 2: View Details Button
- [ ] Click activity for pending order → OrderActionModal opens
- [ ] "View Details" button visible alongside Accept/Decline/Cancel
- [ ] Click "View Details" → OrderActionModal closes → OrderDetailsModal opens
- [ ] Order details display correctly in OrderDetailsModal

### Test 3: Other Action Buttons Still Work
- [ ] Click "Accept" → Action executes → Modal closes → Orders refresh
- [ ] Click "Decline" → Prompt for reason → Action executes → Modal closes
- [ ] Click "Cancel" → Confirm dialog → Action executes → Modal closes

### Test 4: All Hubs
- [ ] CrewHub activity → OrderActionModal works
- [ ] CenterHub activity → OrderActionModal works
- [ ] CustomerHub activity → OrderActionModal works
- [ ] ContractorHub activity → OrderActionModal works
- [ ] ManagerHub activity → OrderActionModal works
- [ ] WarehouseHub activity → OrderActionModal works

## Expected Outcome

**Before**:
- ✅ OrderActionModal shows approval workflow
- ✅ Action buttons work (Accept, Decline, Cancel)
- ❌ No "View Details" button
- ❌ No visible close button (X)

**After**:
- ✅ OrderActionModal shows approval workflow
- ✅ Action buttons work (Accept, Decline, Cancel)
- ✅ "View Details" button present and functional
- ✅ X button in top-right corner
- ✅ Clicking "View Details" opens OrderDetailsModal
- ✅ Clicking X or outside modal closes it

## Build Verification

After changes:
```bash
pnpm build
```

Should pass with no TypeScript errors.

## Notes

- All 6 non-admin hubs already handle "View Details" action correctly (sets selectedOrderId)
- No hub code changes needed
- Only OrderActionModal component needs updating
- CSS module approach keeps styles scoped and consistent with other modals

## Success Criteria

✅ "View Details" button visible in OrderActionModal
✅ Clicking "View Details" opens OrderDetailsModal
✅ Close button (X) visible and functional
✅ All action buttons still work correctly
✅ Build passes with no errors
✅ Consistent UX across all 6 non-admin hubs
