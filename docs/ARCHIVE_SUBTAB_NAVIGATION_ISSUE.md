# Archive Sub-Tab Navigation Issue

## Problem Statement

When clicking an archived order from the activity feed (e.g., "Product Order Details CEN-010-PO-106"), the Archive tab opens but defaults to the "Managers" sub-section instead of the "Orders" sub-section.

However, when clicking an active order from the activity feed (e.g., "Crew Product order CRW-006-PO-107 created"), it correctly navigates to Directory > Orders with the correct sub-tab (product-orders or service-orders).

## Current Implementation

### Active Orders (WORKS ✅)
```tsx
// AdminHub.tsx lines 1406-1419
// Active: navigate to Orders in Directory with correct sub-tab
setActiveTab('directory');
setDirectoryTab('orders');
setOrdersSubTab(orderType === 'service' ? 'service-orders' : 'product-orders');
setSelectedOrderForDetails(fullOrder as any);
```

**Directory Section Structure:**
- AdminHub directly controls tab state: `const [directoryTab, setDirectoryTab] = useState('admins')`
- AdminHub renders TabContainer and NavigationTabs inline (lines 1510-1520)
- AdminHub renders directory body based on `directoryTab` state
- **Parent-controlled state** - AdminHub owns and manages all directory tab state

### Archived Orders (DOESN'T WORK ❌)
```tsx
// AdminHub.tsx lines 1377-1402
// Archived: navigate to Archive tab and open modal
const detectedOrderType = orderType || (fullOrder as any).orderType || 'product';
setArchiveInitialTab('orders');
setArchiveInitialOrdersSubTab(detectedOrderType === 'service' ? 'service-orders' : 'product-orders');
setActiveTab('archive');
setSelectedOrderForDetails(fullOrder as any);
```

**Archive Section Structure:**
- ArchiveSection is a separate component (lines 1531-1547)
- ArchiveSection manages its OWN internal state:
  ```tsx
  const [activeTab, setActiveTab] = useState(initialTab || 'manager');
  const [ordersSubTab, setOrdersSubTab] = useState(initialOrdersSubTab || 'product-orders');
  ```
- AdminHub passes `initialTab` and `initialOrdersSubTab` as props
- ArchiveSection has useEffect hooks to watch prop changes and update state:
  ```tsx
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  ```
- **Child-controlled state** - ArchiveSection owns and manages its own tab state

## Root Cause Analysis

**Key Architectural Difference:**

1. **Directory Section**: Parent-controlled state
   - AdminHub: `setDirectoryTab('orders')` → Immediate state update
   - Re-render shows correct tab

2. **Archive Section**: Child-controlled state
   - AdminHub: `setArchiveInitialTab('orders')` → Prop change
   - ArchiveSection: `useEffect` fires → `setActiveTab(initialTab)` → State update
   - Timing issue: ArchiveSection may already be mounted, useEffect runs after render

**Timing/Lifecycle Issues:**

When navigating from Directory to Archive:
1. AdminHub sets `archiveInitialTab='orders'` (state update)
2. AdminHub sets `activeTab='archive'` (state update)
3. AdminHub re-renders
4. ArchiveSection receives new prop `initialTab='orders'`
5. ArchiveSection's useEffect fires
6. ArchiveSection calls `setActiveTab('orders')`
7. ArchiveSection re-renders

But if ArchiveSection was already mounted (user previously visited Archive tab), the component doesn't unmount/remount, so:
- `useState(initialTab || 'manager')` only runs on first mount → stuck on 'manager'
- `useEffect` should catch prop changes but may have race conditions or not trigger properly

## Attempted Solutions

1. ✅ **Initial props**: Added `initialTab` and `initialOrdersSubTab` props to ArchiveSection
2. ✅ **useEffect watchers**: Added useEffect hooks to update state when props change
3. ❌ **Still doesn't work**: Sub-tab still defaults to "Managers" instead of "Orders"

## Questions for Review

1. Why does the parent-controlled approach (Directory) work but the child-controlled approach (Archive) with prop-driven state updates fail?

2. Should we refactor ArchiveSection to use controlled components (parent owns state)?

3. Is there a React component key or remounting strategy we should use?

4. Are there any console logs showing the prop changes and state updates in ArchiveSection?

## Proposed Solutions

### Option 1: Controlled Component (Recommended)
Make ArchiveSection fully controlled like Directory:
```tsx
// AdminHub.tsx
const [archiveTab, setArchiveTab] = useState('manager');
const [archiveOrdersSubTab, setArchiveOrdersSubTab] = useState('product-orders');

// Activity handler
setArchiveTab('orders');
setArchiveOrdersSubTab('product-orders');
setActiveTab('archive');

// Render
<ArchiveSection
  activeTab={archiveTab}
  onTabChange={setArchiveTab}
  ordersSubTab={archiveOrdersSubTab}
  onOrdersSubTabChange={setArchiveOrdersSubTab}
/>
```

### Option 2: Key-based Remounting
Force ArchiveSection to remount when navigating:
```tsx
<ArchiveSection
  key={`${archiveInitialTab}-${archiveInitialOrdersSubTab}`}
  initialTab={archiveInitialTab}
  initialOrdersSubTab={archiveInitialOrdersSubTab}
/>
```

### Option 3: Imperative API
Expose methods on ArchiveSection via useImperativeHandle:
```tsx
archiveSectionRef.current?.navigateToTab('orders', 'product-orders');
```

## Request

Please review this issue and recommend the best approach to fix the Archive sub-tab navigation to match the working Directory sub-tab navigation behavior.
