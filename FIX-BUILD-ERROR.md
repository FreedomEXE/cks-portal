# Fix Build Error

## TypeScript Error Fix

**File:** `apps/backend/server/domains/orders/store.ts`

### Option 1: Add "complete" to the type (RECOMMENDED)
**Line 119:** Change
```typescript
export type OrderActionType = "accept" | "reject" | "deliver" | "cancel" | "create-service";
```
To:
```typescript
export type OrderActionType = "accept" | "reject" | "deliver" | "cancel" | "create-service" | "complete";
```

### Option 2: Remove the "complete" case
**Lines 1026-1033:** Delete this entire case block:
```typescript
case "complete":
  if (orderType !== "service") {
    throw new Error("Complete action applies only to service orders.");
  }
  newStatus = "service_completed";
  nextActorRole = null;
  serviceStartDate = new Date().toISOString();
  break;
```

Choose Option 1 if "complete" is a valid action for service orders, Option 2 if it's not needed.