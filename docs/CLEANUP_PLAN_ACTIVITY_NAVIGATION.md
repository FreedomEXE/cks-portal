# Cleanup Plan: Remove Navigation-Based Activity Code

## Overview

This document provides step-by-step instructions to safely remove all navigation-based activity code from the codebase in preparation for the new modal-based UX.

---

## Safety Checks Before Each Edit

Before removing any code block:
1. ✅ Verify the code is ONLY used for activity navigation
2. ✅ Check it's not used by other features (Directory, Create, Assign tabs, etc.)
3. ✅ Ensure removal won't break modal functionality
4. ✅ Keep modal state variables (setSelectedOrderForDetails, etc.)

---

## Files to Delete Entirely

These files are obsolete documentation:

```bash
rm docs/ARCHIVE_SUBTAB_NAVIGATION_ISSUE.md
rm docs/COMPLETE_ACTIVITY_ROUTING_PLAN.md
```

**Safe to delete**: These are markdown docs, not code files.

---

## AdminHub.tsx

**File**: `apps/frontend/src/hubs/AdminHub.tsx`

### Edit 1: Remove Archive Initial State
**Lines 230-232**
```tsx
// REMOVE THIS:
  // Archive section initial state (for activity navigation)
  const [archiveInitialTab, setArchiveInitialTab] = useState<string | undefined>(undefined);
  const [archiveInitialOrdersSubTab, setArchiveInitialOrdersSubTab] = useState<string | undefined>(undefined);
```

**Safety**: These state variables are ONLY used for activity navigation to Archive tab.

**Verification**: Search for `archiveInitialTab` usage - should only appear in:
- This declaration
- The reset useEffect (also being removed)
- ArchiveSection props (also being removed)
- handleActivityClick (also being removed)

---

### Edit 2: Remove Archive Reset useEffect
**Lines 254-260**
```tsx
// REMOVE THIS:
  // Reset archive initial values when leaving archive tab
  useEffect(() => {
    if (activeTab !== 'archive') {
      setArchiveInitialTab(undefined);
      setArchiveInitialOrdersSubTab(undefined);
    }
  }, [activeTab]);
```

**Safety**: This useEffect ONLY manages the state we're removing in Edit 1.

**Verification**: No other code depends on this cleanup logic.

---

### Edit 3: Remove handleActivityClick Function
**Lines 1356-1476** (entire function)

**IMPORTANT**: This is a large deletion (~120 lines). Verify carefully.

```tsx
// REMOVE FROM:
  const handleActivityClick = ({ targetType, targetId, orderType }: ActivityClickData) => {
    console.log('[AdminHub] Activity clicked:', { targetType, targetId, orderType });
    // ... entire function body
  };

// REMOVE TO (just before next function):
  };

  const someOtherFunction = ... // Keep this
```

**Safety**: This function is ONLY called by ActivityFeed's `onActivityClick` prop.

**Verification**:
- Search for `handleActivityClick` - should only appear in:
  - This declaration (being removed)
  - ActivityFeed prop `onActivityClick={handleActivityClick}` (will be removed in Edit 5)
- Does NOT affect other functionality

**Keep Adjacent Code**:
- ✅ KEEP: `const handleClearActivity = () => setActivityFeed([]);` (line 1354)
- ✅ KEEP: Next function after handleActivityClick

---

### Edit 4: Simplify ArchiveSection Render
**Lines 1554-1581**

**REMOVE**:
```tsx
// REMOVE THIS IIFE wrapper and props:
          ) : activeTab === 'archive' ? (
            (() => {
              console.log('[AdminHub] Rendering ArchiveSection with:', {
                key: `archive-${archiveInitialTab}-${archiveInitialOrdersSubTab}`,
                initialTab: archiveInitialTab,
                initialOrdersSubTab: archiveInitialOrdersSubTab
              });
              return (
                <ArchiveSection
                  key={`archive-${archiveInitialTab}-${archiveInitialOrdersSubTab}`}
                  archiveAPI={archiveAPI}
                  initialTab={archiveInitialTab}
                  initialOrdersSubTab={archiveInitialOrdersSubTab}
                  onViewOrderDetails={async (orderId: string, orderType: 'product' | 'service') => {
                    try {
                      // Fetch the full archived order
                      const fullOrder = await fetchAdminOrderById(orderId);
                      if (fullOrder) {
                        setSelectedOrderForDetails(fullOrder as any);
                      }
                    } catch (error) {
                      console.error('Failed to fetch archived order:', error);
                      alert('Failed to load order details');
                    }
                  }}
                />
              );
            })()
```

**REPLACE WITH**:
```tsx
          ) : activeTab === 'archive' ? (
            <ArchiveSection
              archiveAPI={archiveAPI}
              onViewOrderDetails={async (orderId: string, orderType: 'product' | 'service') => {
                try {
                  const fullOrder = await fetchAdminOrderById(orderId);
                  if (fullOrder) {
                    setSelectedOrderForDetails(fullOrder as any);
                  }
                } catch (error) {
                  console.error('Failed to fetch archived order:', error);
                  alert('Failed to load order details');
                }
              }}
            />
```

**Safety**:
- Removes IIFE wrapper (only used for debug logging)
- Removes `key` prop (only used for forced remounting on navigation)
- Removes `initialTab` and `initialOrdersSubTab` props (navigation-related)
- KEEPS `archiveAPI` and `onViewOrderDetails` (still needed for Archive section functionality)

---

### Edit 5: Simplify ActivityFeed Props
**Lines 1514-1525**

**REMOVE**:
```tsx
              <ActivityFeed
                activities={activityFeed}
                hub="admin"
                onClear={handleClearActivity}
                onActivityClick={handleActivityClick}  // REMOVE THIS LINE
                isLoading={activitiesLoading}
                error={activitiesError}
                onError={(message) => {
                  setToast(message);
                  setTimeout(() => setToast(null), 3000);
                }}
              />
```

**REPLACE WITH** (for now - will update in implementation phase):
```tsx
              <ActivityFeed
                activities={activityFeed}
                hub="admin"
                onClear={handleClearActivity}
                isLoading={activitiesLoading}
                error={activitiesError}
                onError={(message) => {
                  setToast(message);
                  setTimeout(() => setToast(null), 3000);
                }}
                onOpenOrderModal={setSelectedOrderForDetails}
              />
```

**Note**: The `onOpenOrderModal` prop doesn't exist yet in ActivityFeed - that's fine for cleanup phase. ActivityFeed will just not trigger any modals (safe interim state).

---

## ArchiveSection.tsx

**File**: `packages/domain-widgets/src/admin/ArchiveSection.tsx`

### Edit 1: Remove Props from Interface
**Lines 27-32**

**REMOVE**:
```tsx
export interface ArchiveSectionProps {
  archiveAPI?: ArchiveAPI;
  onViewOrderDetails?: (orderId: string, orderType: 'product' | 'service') => void;
  initialTab?: string;              // REMOVE
  initialOrdersSubTab?: string;     // REMOVE
}
```

**REPLACE WITH**:
```tsx
export interface ArchiveSectionProps {
  archiveAPI?: ArchiveAPI;
  onViewOrderDetails?: (orderId: string, orderType: 'product' | 'service') => void;
}
```

---

### Edit 2: Remove Props from Function Signature
**Lines 93-98**

**REMOVE**:
```tsx
export default function ArchiveSection({
  archiveAPI,
  onViewOrderDetails,
  initialTab,                  // REMOVE
  initialOrdersSubTab         // REMOVE
}: ArchiveSectionProps) {
```

**REPLACE WITH**:
```tsx
export default function ArchiveSection({
  archiveAPI,
  onViewOrderDetails
}: ArchiveSectionProps) {
```

---

### Edit 3: Remove Debug Log for Initial Props
**Line 103**

**REMOVE**:
```tsx
  console.log('[ArchiveSection] initialTab:', initialTab, 'initialOrdersSubTab:', initialOrdersSubTab);
```

**Safety**: Just a debug log related to removed props.

---

### Edit 4: Remove InitialTab from useState
**Line 105**

**REMOVE**:
```tsx
  const [activeTab, setActiveTab] = useState(initialTab || 'manager');
```

**REPLACE WITH**:
```tsx
  const [activeTab, setActiveTab] = useState('manager');
```

**Safety**: Component always starts with 'manager' tab (default behavior).

---

### Edit 5: Remove InitialOrdersSubTab from useState
**Line 107**

**REMOVE**:
```tsx
  const [ordersSubTab, setOrdersSubTab] = useState<string>(initialOrdersSubTab || 'product-orders');
```

**REPLACE WITH**:
```tsx
  const [ordersSubTab, setOrdersSubTab] = useState<string>('product-orders');
```

**Safety**: Component always starts with 'product-orders' sub-tab (default behavior).

---

### Edit 6: Remove Both useEffect Prop Watchers
**Lines 116-129**

**REMOVE**:
```tsx
  // Update state when initial props change (for activity navigation)
  useEffect(() => {
    if (initialTab) {
      console.log('[ArchiveSection] Updating activeTab from prop:', initialTab);
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (initialOrdersSubTab) {
      console.log('[ArchiveSection] Updating ordersSubTab from prop:', initialOrdersSubTab);
      setOrdersSubTab(initialOrdersSubTab);
    }
  }, [initialOrdersSubTab]);
```

**Safety**: These useEffects ONLY watch the props we're removing.

---

## Other Hubs

### ManagerHub.tsx
**Lines 926-957**: Remove entire `handleActivityClick` function

**Lines ~1102**: Remove `onActivityClick={handleActivityClick}` prop from ActivityFeed (replace with `onOpenOrderModal` later)

### CenterHub.tsx
**Pattern**: Same as ManagerHub
- Find and remove `handleActivityClick`
- Remove `onActivityClick` prop from ActivityFeed

### ContractorHub.tsx
**Pattern**: Same as ManagerHub

### CustomerHub.tsx
**Pattern**: Same as ManagerHub

### CrewHub.tsx
**Pattern**: Same as ManagerHub

### WarehouseHub.tsx
**Pattern**: Same as ManagerHub

---

## Verification Steps

After each file edit:

1. **TypeScript Check**:
   ```bash
   cd apps/frontend
   npx tsc --noEmit
   ```

2. **Search for Removed Variables**:
   ```bash
   # Should find NO results after cleanup
   grep -r "archiveInitialTab" apps/frontend/src/hubs/AdminHub.tsx
   grep -r "initialTab" packages/domain-widgets/src/admin/ArchiveSection.tsx
   grep -r "handleActivityClick" apps/frontend/src/hubs/*.tsx
   ```

3. **Verify Modals Still Exist**:
   - Check that `setSelectedOrderForDetails` is still defined
   - Check that modal state variables still exist
   - Check that modals still render in JSX

4. **Test in Browser**:
   - Navigate to each hub
   - Verify no console errors
   - Activity clicks won't do anything (expected - waiting for implementation phase)
   - Direct interactions (clicking order cards) should still work

---

## Post-Cleanup State

After cleanup, the code should be in this state:

✅ **ActivityFeed exists** but doesn't have click handling logic yet
✅ **Hubs are clean** with minimal activity-related code
✅ **Modals exist** and can be opened manually
✅ **No navigation logic** remains
✅ **No TypeScript errors**
✅ **No console errors** at runtime
✅ **Ready for implementation** of smart ActivityFeed

---

## Rollback Plan

If something breaks:

1. **Git Reset** (safest):
   ```bash
   git checkout apps/frontend/src/hubs/AdminHub.tsx
   git checkout packages/domain-widgets/src/admin/ArchiveSection.tsx
   # ... other files
   ```

2. **Keep Edits Made So Far**:
   - Undo only the last edit
   - Run verification steps
   - Continue from there

---

## Timeline

- **Cleanup Phase**: 30-60 minutes (careful, methodical removal)
- **Verification**: 15 minutes (TypeScript + manual testing)
- **Ready for Implementation**: After cleanup verified

---

## Success Criteria

- [ ] All navigation-based activity code removed
- [ ] TypeScript compiles with no errors
- [ ] No console errors when visiting each hub
- [ ] Activity clicks do nothing (expected interim state)
- [ ] Direct interactions still work (order cards, etc.)
- [ ] Modals still exist and can open
- [ ] Codebase is clean and ready for smart ActivityFeed implementation
