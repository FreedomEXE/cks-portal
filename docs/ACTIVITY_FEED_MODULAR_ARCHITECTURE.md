# Activity Feed Modular Architecture - Modal-Based UX

## Design Principles

1. **Zero Hub Logic**: Hubs should NOT contain activity click handling logic
2. **Smart Components**: ActivityFeed handles ALL logic internally
3. **Prop-Driven**: Hubs pass modal setters as props
4. **State Preservation**: User stays in Recent Activity section
5. **Future-Proof**: Easy to add features like mark-as-read, filters, etc.

---

## Current State (Navigation-Based - TO BE REMOVED)

### Hub Code Complexity (AdminHub example):
```tsx
// ~200 lines of activity-related code in hub file ❌
const [archiveInitialTab, setArchiveInitialTab] = useState(undefined);
const [archiveInitialOrdersSubTab, setArchiveInitialOrdersSubTab] = useState(undefined);

useEffect(() => { /* reset archive state */ }, [activeTab]);

const handleActivityClick = ({ targetType, targetId, orderType }) => {
  if (targetType === 'order') {
    // Fetch entity state
    // Detect deleted/archived/active
    // Navigate to different tabs
    // Set sub-tabs
    // Delay modal opening
    // Complex state management
  }
  // ... 100+ more lines
};

<ArchiveSection
  key={`archive-${archiveInitialTab}-${archiveInitialOrdersSubTab}`}  // Force remount
  initialTab={archiveInitialTab}
  initialOrdersSubTab={archiveInitialOrdersSubTab}
/>
```

### Problems:
- ❌ Hub files bloated with activity logic
- ❌ Each hub implements its own navigation logic
- ❌ Complex state synchronization
- ❌ Timing bugs (setTimeout hacks)
- ❌ Context loss (user navigates away from activity feed)
- ❌ Hard to maintain consistency across 7 hubs

---

## New Architecture (Modal-Based - FUTURE STATE)

### Hub Code Simplicity:
```tsx
// ~10 lines of activity-related code in hub file ✅
<ActivityFeed
  activities={activityFeed}
  hub="admin"
  onOpenOrderModal={setSelectedOrderForDetails}
  onOpenServiceModal={setSelectedServiceCatalog}
  onOpenUserModal={setSelectedUser}
  onError={setToast}
  onClear={handleClearActivity}
/>
```

### Where Logic Lives:

#### 1. ActivityFeed Component (Smart Component)
**Location**: `apps/frontend/src/components/ActivityFeed.tsx`

**Responsibilities**:
- Parse activity metadata
- Fetch full entity data (with state: deleted/archived/active)
- Determine appropriate modal to open
- Handle errors
- Stay 100% hub-agnostic

**Example Structure**:
```tsx
// ActivityFeed.tsx
export function ActivityFeed({
  activities,
  hub,
  onOpenOrderModal,
  onOpenServiceModal,
  onOpenUserModal,
  onError
}) {
  const handleActivityClick = async (activity) => {
    const { targetType, targetId } = activity.metadata;

    try {
      if (targetType === 'order') {
        // Fetch order with state detection
        const order = await fetchOrderWithState(targetId);

        // Enrich with deletion/archive info
        if (order.isDeleted) {
          order.deletedBanner = true;
        }

        // Open modal (user stays in activity section)
        onOpenOrderModal(order);
      }
      else if (targetType === 'service') {
        const service = await fetchServiceWithState(targetId);
        onOpenServiceModal(service);
      }
      // ... other types
    } catch (err) {
      onError('Failed to load details');
    }
  };

  return <RecentActivity activities={activitiesWithHandlers} />;
}
```

#### 2. Entity Fetching Utilities (Reusable)
**Location**: `apps/frontend/src/shared/utils/activityHelpers.ts` (NEW FILE)

**Responsibilities**:
- Fetch entities with `includeDeleted=1`
- Detect state (deleted/archived/active)
- Enrich with metadata (deletedAt, deletedBy, archivedAt, etc.)
- Handle errors consistently

**Example**:
```tsx
// activityHelpers.ts
export async function fetchOrderWithState(orderId: string) {
  // Use entity API
  const resp = await fetchJson(`/entity/order/${orderId}?includeDeleted=1`);
  const { entity, state, deletedAt, deletedBy } = resp.data;

  // Fetch full order details
  const fullOrder = await fetchOrderById(orderId);

  // Enrich with state metadata
  return {
    ...fullOrder,
    isDeleted: state === 'deleted',
    isArchived: state === 'archived',
    deletedAt,
    deletedBy,
  };
}

export async function fetchServiceWithState(serviceId: string) {
  // Similar pattern
}

export async function fetchUserWithState(userId: string) {
  // Similar pattern
}
```

#### 3. Hub Modals (Unchanged)
Hubs already have modals that handle:
- OrderDetailsModal (with DeletedBanner support)
- ServiceDetailsModal
- UserProfileModal (TODO)

No changes needed to modals.

---

## File Structure

```
apps/frontend/src/
├── components/
│   ├── ActivityFeed.tsx              [MODIFY] - Smart component with all logic
│   └── ActivityFeed.test.tsx         [NEW] - Unit tests
│
├── shared/
│   └── utils/
│       ├── activityHelpers.ts        [NEW] - Entity fetching utilities
│       ├── activityHelpers.test.ts   [NEW] - Unit tests
│       └── activityRouter.ts         [KEEP] - Entity API types
│
├── hubs/
│   ├── AdminHub.tsx                  [CLEAN] - Remove handleActivityClick logic
│   ├── ManagerHub.tsx                [CLEAN] - Remove handleActivityClick logic
│   ├── CenterHub.tsx                 [CLEAN] - Remove handleActivityClick logic
│   ├── ContractorHub.tsx             [CLEAN] - Remove handleActivityClick logic
│   ├── CustomerHub.tsx               [CLEAN] - Remove handleActivityClick logic
│   ├── CrewHub.tsx                   [CLEAN] - Remove handleActivityClick logic
│   └── WarehouseHub.tsx              [CLEAN] - Remove handleActivityClick logic
│
packages/domain-widgets/src/
├── admin/
│   └── ArchiveSection.tsx            [CLEAN] - Remove initialTab props and useEffect watchers
│
└── activity/
    └── RecentActivity.tsx            [KEEP] - Presentation component (unchanged)
```

---

## Cleanup Checklist

### AdminHub.tsx
**Lines to REMOVE**:
- [ ] Line 231-232: `archiveInitialTab`, `archiveInitialOrdersSubTab` state
- [ ] Line 254-260: Reset useEffect for archive state
- [ ] Line 1356-1476: Entire `handleActivityClick` function (~120 lines)
- [ ] Line 1555-1560: Debug console.log wrapper for ArchiveSection
- [ ] Line 1563: `key` prop on ArchiveSection
- [ ] Line 1565-1566: `initialTab`, `initialOrdersSubTab` props on ArchiveSection

**Lines to KEEP**:
- [ ] Line 78: `import { ActivityFeed, type ActivityClickData }` (modify import later)
- [ ] Line 307: `activityFeed` state
- [ ] Line 1354: `handleClearActivity`
- [ ] Line 1514-1525: `<ActivityFeed>` render (modify props later)

### ArchiveSection.tsx (packages/domain-widgets)
**Lines to REMOVE**:
- [ ] Line 30-31: `initialTab`, `initialOrdersSubTab` from props interface
- [ ] Line 96-97: Destructure `initialTab`, `initialOrdersSubTab` from props
- [ ] Line 103: Debug console.log for initial props
- [ ] Line 105: `initialTab ||` from useState (keep just `'manager'`)
- [ ] Line 107: `initialOrdersSubTab ||` from useState (keep just `'product-orders'`)
- [ ] Line 116-129: Both useEffect hooks for prop watching

**Lines to KEEP**:
- [ ] Everything else (component still needs its own internal tab state)

### ManagerHub.tsx
**Lines to REMOVE**:
- [ ] Line 926-957: Entire `handleActivityClick` function (~32 lines)

**Lines to KEEP**:
- [ ] ActivityFeed render and props (modify later)

### Other Hubs (CenterHub, ContractorHub, CustomerHub, CrewHub, WarehouseHub)
**Pattern**: Similar to ManagerHub - remove `handleActivityClick`, keep ActivityFeed render

---

## Implementation Phases

### Phase 1: Cleanup (This Session)
1. Remove all navigation-based activity code from hubs
2. Remove prop-sync code from ArchiveSection
3. Delete obsolete documentation files
4. Verify nothing breaks (modals still exist, just not triggered)

### Phase 2: Build Smart ActivityFeed (Next Session)
1. Create `activityHelpers.ts` with entity fetching
2. Update `ActivityFeed.tsx` with internal click handling
3. Update hub props to pass modal setters
4. Test with one hub (Admin)

### Phase 3: Roll Out to All Hubs (Next Session)
1. Apply same pattern to remaining 6 hubs
2. Verify consistency across all hubs
3. Test deleted/archived/active orders

### Phase 4: Polish Features (Future)
1. Mark as read/unread
2. Dismiss activities
3. Filter by type
4. Bulk actions
5. Activity categories

---

## Benefits Summary

### Code Reduction
- **AdminHub**: ~200 lines → ~10 lines (95% reduction)
- **ArchiveSection**: ~20 lines removed (prop sync)
- **All Hubs**: Consistent ~95% reduction in activity code
- **Total**: ~1000+ lines removed across 7 hubs

### Maintainability
- ✅ Single source of truth (ActivityFeed)
- ✅ Easy to add features (one place)
- ✅ Consistent behavior across all hubs
- ✅ Testable in isolation

### UX
- ✅ User stays in command center
- ✅ Fast triage of multiple activities
- ✅ No context loss
- ✅ Standard industry pattern

### Architecture
- ✅ Truly modular
- ✅ Hub-agnostic
- ✅ Future-proof
- ✅ No hub code bloat

---

## Action Types (Future Enhancement)

Different activities will have different behaviors:

### View-Only Activities
- "Product Order Details CEN-010-PO-106"
- "Admin Archived order CEN-010-PO-106"
→ Open read-only modal

### Action-Required Activities
- "Order CEN-010-PO-107 pending approval"
- "Service request from CEN-015 awaiting assignment"
→ Open modal with action buttons (Approve/Deny/Assign)

### Navigational Activities (Optional)
- "New crew member added to CRW-006"
→ Open modal, with optional "View in Ecosystem" button

---

## Questions Answered

**Q: Does this make it simpler?**
A: YES - 95% code reduction in hubs, single source of truth

**Q: Can we remove code from hubs?**
A: YES - Remove ~200 lines per hub, all navigation logic

**Q: Do we need to delete files?**
A: YES - Delete obsolete docs, no new files needed yet (will create activityHelpers.ts later)

**Q: Is this modular?**
A: YES - ActivityFeed is self-contained, hubs just pass props

**Q: Is this future-proof?**
A: YES - Easy to add mark-as-read, filters, bulk actions, etc.

**Q: Does this follow industry patterns?**
A: YES - Gmail, Slack, GitHub all work this way

---

## Next Steps

1. ✅ Review this architecture document
2. ⏳ Create detailed cleanup plan with line numbers
3. ⏳ Execute cleanup (remove obsolete code)
4. ⏳ Verify no breakage
5. ⏳ Ready for implementation phase
