# Viewer-Relative Activity Implementation Summary

**Date:** 2025-10-24
**Status:** ⚠️ Testing - Click behavior not working as expected

---

## Problem Statement

**Current Behavior (Before Changes):**
- Activity: "Assigned CRW-006 to center CEN-010"
- When crew CRW-006 clicks → Opens CRW-006 modal ❌
- When center CEN-010 clicks → Opens CRW-006 modal ❌

**Desired Behavior:**
- Activity: "Assigned CRW-006 to center CEN-010"
- When crew CRW-006 clicks → Opens CEN-010 modal (where they're going) ✅
- When center CEN-010 clicks → Opens CRW-006 modal (who was assigned to them) ✅
- When admin clicks → Opens CEN-010 modal (the recipient) ✅

**Plus:** Personalized messages
- Crew sees: "You have been assigned to center CEN-010!"
- Center sees: "Crew CRW-006 has been assigned to you!"
- Admin sees: "Assigned Crew CRW-006 to Center CEN-010" (generic)

---

## Implementation Details

### 1. Backend Data Structure (No Changes)

Activities are stored with this pattern:
```typescript
{
  activityType: 'crew_assigned_to_center',
  targetId: 'CRW-006',        // The crew (entity being assigned)
  targetType: 'crew',
  metadata: {
    crewId: 'CRW-006',        // Who was assigned
    centerId: 'CEN-010',       // Where they were assigned
    crewName: '...',
    centerName: '...'
  }
}
```

**Pattern applies to all assignments:**
- contractor_assigned_to_manager
- customer_assigned_to_contractor
- center_assigned_to_customer
- order_assigned_to_warehouse

---

### 2. Frontend Changes Made

#### File 1: `apps/frontend/src/components/ActivityFeed.tsx`

**Added `viewerId` prop:**
```typescript
export interface ActivityFeedProps {
  // ... existing props
  viewerId?: string; // Current user's CKS code for viewer-relative clicks
}
```

**Added viewer-relative click logic (lines 170-230):**

Logic flow:
1. Extract `activityType` from `activity.metadata`
2. Check if it's an assignment type
3. Extract `actorId` (entity being assigned) and `targetEntityId` (recipient) from metadata
4. Compare `viewerId` to determine which modal to open:
   - If viewerId === actorId → Open targetEntityId (where you're going)
   - If viewerId === targetEntityId → Open actorId (who was assigned to you)
   - Else (admin) → Open targetEntityId (recipient)

**Placement:** This check happens BEFORE the general user activities check

```typescript
// Line 170: Handle assignment activities with viewer-relative clicks
const activityType = activity.metadata?.activityType || activity.metadata?.category;
const assignmentTypes = [
  'crew_assigned_to_center',
  'contractor_assigned_to_manager',
  'customer_assigned_to_contractor',
  'center_assigned_to_customer',
  'order_assigned_to_warehouse'
];

if (activityType && assignmentTypes.includes(activityType) && viewerId) {
  // Extract IDs based on assignment type
  let actorId, targetEntityId;

  switch (activityType) {
    case 'crew_assigned_to_center':
      actorId = metadata?.crewId;
      targetEntityId = metadata?.centerId;
      break;
    // ... other cases
  }

  // Viewer-relative logic
  if (viewerId.toUpperCase() === actorId.toUpperCase()) {
    modals.openById(targetEntityId); // Open where you're going
  } else if (viewerId.toUpperCase() === targetEntityId.toUpperCase()) {
    modals.openById(actorId); // Open who was assigned to you
  } else {
    modals.openById(targetEntityId); // Admin: open recipient
  }

  return; // Stop here, don't continue to user activities check
}

// Line 232: General user activities check (existing code)
const userTypes = ['manager', 'contractor', 'customer', 'center', 'crew', 'warehouse'];
if (userTypes.includes(targetType)) {
  modals.openById(targetId); // This is where it was going before
  return;
}
```

---

#### File 2: `apps/frontend/src/shared/activity/useFormattedActivities.ts`

**Added `personalizeMessage` function (lines 77-178):**

Personalizes messages based on viewer:
- Checks if `viewerId` matches actor or target
- Returns personalized message or falls back to original

**Updated `mapHubItemToActivity` function (lines 180-207):**

Changes:
1. Calls `personalizeMessage(item, viewerId)`
2. Uses personalized message instead of `item.description`
3. **CRITICAL:** Adds `activityType: item.activityType` to metadata

```typescript
return {
  id: item.id,
  message: personalizedMessage,
  timestamp: validDate,
  type: toActivityType(item.category),
  metadata: {
    // ... existing fields
    activityType: item.activityType || undefined, // <-- ADDED THIS
    ...(item.metadata ?? undefined),
  },
};
```

**Updated `useFormattedActivities` hook (line 228):**

Now passes `cksCode` to mapping function:
```typescript
const mapped = filtered.map((item) => mapHubItemToActivity(item, cksCode));
```

---

#### File 3-9: All 7 Hub Files Updated

Added `viewerId` prop to ActivityFeed:

**CrewHub.tsx (line 516):**
```typescript
<ActivityFeed
  activities={activities}
  hub="crew"
  viewerId={normalizedCode || undefined} // <-- ADDED
  ...
/>
```

**Similar changes in:**
- AdminHub.tsx → `viewerId={code || undefined}`
- ManagerHub.tsx → `viewerId={managerCode || undefined}`
- ContractorHub.tsx → `viewerId={normalizedCode || undefined}`
- CustomerHub.tsx → `viewerId={normalizedCode || undefined}`
- CenterHub.tsx → `viewerId={normalizedCode || undefined}`
- WarehouseHub.tsx → `viewerId={normalizedCode || undefined}`

---

## Expected Data Flow

### When Crew CRW-006 Views Activity Feed:

1. **Backend returns:**
```json
{
  "activityType": "crew_assigned_to_center",
  "targetId": "CRW-006",
  "targetType": "crew",
  "metadata": {
    "crewId": "CRW-006",
    "centerId": "CEN-010"
  }
}
```

2. **useFormattedActivities processes:**
```typescript
// Input: item (from backend), viewerId = 'CRW-006'
personalizeMessage(item, 'CRW-006')
// Returns: "You have been assigned to center CEN-010!"

mapHubItemToActivity(item, 'CRW-006')
// Returns:
{
  message: "You have been assigned to center CEN-010!",
  metadata: {
    targetId: "CRW-006",
    targetType: "crew",
    activityType: "crew_assigned_to_center", // <-- CRITICAL
    crewId: "CRW-006",
    centerId: "CEN-010"
  }
}
```

3. **ActivityFeed click handler receives:**
```typescript
activity = {
  message: "You have been assigned to center CEN-010!",
  metadata: {
    activityType: "crew_assigned_to_center",
    crewId: "CRW-006",
    centerId: "CEN-010",
    targetId: "CRW-006",
    targetType: "crew"
  }
}

viewerId = "CRW-006"
```

4. **Click logic executes:**
```typescript
const activityType = activity.metadata.activityType; // 'crew_assigned_to_center'
const actorId = metadata.crewId; // 'CRW-006'
const targetEntityId = metadata.centerId; // 'CEN-010'

// Check: viewerId === actorId?
// 'CRW-006' === 'CRW-006' → TRUE

// Execute: Open targetEntityId
modals.openById('CEN-010'); // <-- Should open center modal
```

---

## Testing Results

**❌ FAILED - Still Opening Crew Modal**

User tested on Crew Hub (CRW-006):
- Activity: "Assigned CRW-006 to center CEN-010"
- Click result: Opens CRW-006 modal (crew)
- Expected: Opens CEN-010 modal (center)

**Also tested:**
- Activity: "Crew CRW-006 created"
- Click result: Opens CRW-006 modal
- Expected: Opens CRW-006 modal ✅ (this is correct)

---

## Debugging Questions

### 1. Is `activityType` in the metadata?

Check browser console for the activity data:
```javascript
// Should see:
metadata: {
  activityType: "crew_assigned_to_center", // Is this present?
  crewId: "CRW-006",
  centerId: "CEN-010",
  // ...
}
```

### 2. Is the assignment check triggering?

Look for console logs in ActivityFeed.tsx:
```
[ActivityFeed] Assignment: Actor viewing, opening target: CEN-010
```

If you see this, the logic is working but openById is broken.
If you DON'T see this, the assignment check is being skipped.

### 3. Is viewerId being passed correctly?

In CrewHub, check if `normalizedCode` equals 'CRW-006':
```typescript
console.log('[CrewHub] normalizedCode:', normalizedCode);
// Should be: 'CRW-006'
```

### 4. What does the raw activity look like?

Check the backend response:
```javascript
// In browser console
console.log('Raw activity from backend:', data.activities[0]);
// Does it have activityType: 'crew_assigned_to_center'?
```

---

## Possible Issues

### Issue 1: `activityType` not in backend response

**Symptom:** Assignment check never triggers
**Cause:** Backend doesn't return `activityType` field
**Fix:** Check `apps/backend/server/domains/scope/store.ts` - does the SELECT query include `activity_type`?

### Issue 2: Metadata spreading overwrites `activityType`

**Symptom:** `activityType` is in metadata but then disappears
**Code location:** useFormattedActivities.ts line 204
```typescript
metadata: {
  activityType: item.activityType || undefined,
  ...(item.metadata ?? undefined), // <-- Could overwrite activityType?
}
```

**Potential fix:** Spread metadata first, then add activityType:
```typescript
metadata: {
  ...(item.metadata ?? undefined),
  activityType: item.activityType || undefined, // Move to end
}
```

### Issue 3: Case sensitivity mismatch

**Symptom:** viewerId comparison fails
**Check:** Are all IDs being uppercased consistently?

### Issue 4: Assignment check happens but falls through

**Symptom:** Console shows assignment log but still opens wrong modal
**Cause:** Logic error in openById or modal routing

---

## Files Modified

1. `apps/frontend/src/components/ActivityFeed.tsx` - Viewer-relative click logic
2. `apps/frontend/src/shared/activity/useFormattedActivities.ts` - Message personalization
3. `apps/frontend/src/hubs/CrewHub.tsx` - Added viewerId prop
4. `apps/frontend/src/hubs/AdminHub.tsx` - Added viewerId prop
5. `apps/frontend/src/hubs/ManagerHub.tsx` - Added viewerId prop
6. `apps/frontend/src/hubs/ContractorHub.tsx` - Added viewerId prop
7. `apps/frontend/src/hubs/CustomerHub.tsx` - Added viewerId prop
8. `apps/frontend/src/hubs/CenterHub.tsx` - Added viewerId prop
9. `apps/frontend/src/hubs/WarehouseHub.tsx` - Added viewerId prop

---

## Next Steps for Debugging

1. **Check browser console** for:
   - ActivityFeed click logs
   - Activity metadata structure
   - viewerId value

2. **Verify backend data** includes `activityType` field

3. **Test metadata spreading** order in useFormattedActivities

4. **Add debug logging** at each step of the click flow

---

## Questions for ChatGPT Review

1. Is the implementation approach correct (checking activityType before general user activities)?
2. Is the metadata spreading order causing issues?
3. Should `activityType` be retrieved differently from the activity object?
4. Is there a race condition or async issue with the click handler?
5. Are there any TypeScript typing issues that could cause silent failures?

---

**End of Summary**
