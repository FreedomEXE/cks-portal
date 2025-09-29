# Manual Fixes to Apply

## 1. Fix WarehouseHub.tsx - Add pendingAction state

**File:** `apps/frontend/src/hubs/WarehouseHub.tsx`
**Line:** After line 164 (after the inventoryFilter state)

Add this line:
```typescript
const [pendingAction, setPendingAction] = useState<{ orderId: string; action: OrderActionType } | null>(null);
```

## 2. Fix OrdersSection.tsx - Make completed orders larger

**File:** `packages/domain-widgets/src/OrdersSection/OrdersSection.tsx`
**Lines:** 272-273

Replace:
```typescript
collapsible={true}
defaultExpanded={false}
```

With:
```typescript
collapsible={order.status !== 'completed' && order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'rejected'}
defaultExpanded={order.status === 'completed' || order.status === 'delivered'}
```

This will make:
- Pending orders: Small and collapsible (flashing animation)
- Completed/delivered orders: Full size (about double) and always expanded