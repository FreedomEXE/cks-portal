# Modal Context Provider Architecture - Detailed Refactor Plan

**Date:** 2025-01-19
**Status:** PROPOSAL - Awaiting Review
**Author:** Claude (CTO)

---

## Executive Summary

**Problem:** Each hub duplicates 50+ lines of modal state, callbacks, and rendering logic. Adding new sections or modals requires updating all 7 hubs.

**Solution:** Centralize modal management with a Context Provider that allows any component to open any modal without hub-level wiring.

**Impact:** ~350 lines of code removed, future modal additions require zero hub changes.

---

## 1. Current State Analysis

### 1.1 What We Have Now (After Recent Work)

**Each Hub Contains:**
```tsx
// STATE (duplicated in all 7 hubs)
const [selectedOrderFromActivity, setSelectedOrderFromActivity] = useState<{id: string, type: string} | null>(null);
const [selectedServiceFromActivity, setSelectedServiceFromActivity] = useState<string | null>(null);
const [selectedReportFromActivity, setSelectedReportFromActivity] = useState<{id: string, type: string} | null>(null);

// CALLBACKS (duplicated in all 7 hubs)
<ActivityFeed
  onOpenOrderModal={setSelectedOrderFromActivity}
  onOpenServiceModal={setSelectedServiceFromActivity}
  onOpenReportModal={setSelectedReportFromActivity}
/>

<ReportsSection
  onReportClick={(id, type) => setSelectedReportFromActivity({id, type})}
/>

// MODALS (duplicated in all 7 hubs)
<OrderModal isOpen={!!selectedOrderFromActivity} onClose={...} ... />
<ServiceViewModal isOpen={!!selectedServiceFromActivity} onClose={...} ... />
<ReportModal isOpen={!!selectedReportFromActivity} onClose={...} ... />
```

**Affected Hubs:**
- AdminHub.tsx (~2100 lines)
- ManagerHub.tsx (~1550 lines)
- WarehouseHub.tsx (~1330 lines)
- ContractorHub.tsx (~1070 lines)
- CustomerHub.tsx (~880 lines)
- CenterHub.tsx (~870 lines)
- CrewHub.tsx (~970 lines)

**Total Duplicate Code:** ~350 lines across all hubs

### 1.2 Pain Points

1. **Adding New Modal Type:**
   - Update `ActivityFeed` props interface
   - Update all 7 hubs with new state
   - Update all 7 hubs with new callback
   - Update all 7 hubs with new modal render

2. **Adding New Section:**
   - Define callback props in section component
   - Wire callbacks in all 7 hubs
   - Already have modal renders (but still coupling)

3. **Changing Modal Behavior:**
   - Update modal logic in 7 places
   - Risk of inconsistency

4. **Testing:**
   - Must test modal flows in every hub
   - Can't test modal in isolation

---

## 2. Proposed Architecture

### 2.1 Overview

```
┌─────────────────────────────────────────────┐
│           Hub Component (AdminHub)          │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │      ModalProvider (Context)          │ │
│  │  - Manages all modal state            │ │
│  │  - Renders all modals                 │ │
│  │  - Provides open/close functions      │ │
│  │                                       │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │   ActivityFeed                  │ │ │
│  │  │   - useModals() hook            │ │ │
│  │  │   - openOrderModal(id, type)    │ │ │
│  │  └─────────────────────────────────┘ │ │
│  │                                       │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │   ReportsSection                │ │ │
│  │  │   - useModals() hook            │ │ │
│  │  │   - openReportModal(id, type)   │ │ │
│  │  └─────────────────────────────────┘ │ │
│  │                                       │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │   Directory Section             │ │ │
│  │  │   - useModals() hook            │ │ │
│  │  │   - openServiceModal(id)        │ │ │
│  │  └─────────────────────────────────┘ │ │
│  │                                       │ │
│  │  [Modals Auto-Render Here]           │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 2.2 Core Components

#### A. ModalProvider (New)
**Location:** `apps/frontend/src/contexts/ModalProvider.tsx`

```tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { OrderModal, ServiceViewModal, ReportModal, UserModal } from '@cks/ui';
import { useOrderDetails } from '../hooks/useOrderDetails';
import { useReportDetails } from '../hooks/useReportDetails';

interface ModalContextValue {
  // Order Modals
  openOrderModal: (orderId: string, orderType: 'product' | 'service') => void;
  closeOrderModal: () => void;

  // Service Modals
  openServiceModal: (serviceId: string) => void;
  closeServiceModal: () => void;

  // Report Modals
  openReportModal: (reportId: string, reportType: 'report' | 'feedback') => void;
  closeReportModal: () => void;

  // User Modals
  openUserModal: (userId: string) => void;
  closeUserModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children, currentUser }: { children: React.ReactNode, currentUser: string }) {
  // State for each modal type
  const [selectedOrder, setSelectedOrder] = useState<{id: string, type: 'product' | 'service'} | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<{id: string, type: 'report' | 'feedback'} | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Fetch full data using hooks (backend calls)
  const { order: orderDetails } = useOrderDetails(selectedOrder?.id || null, selectedOrder?.type || null);
  const { report: reportDetails } = useReportDetails({
    reportId: selectedReport?.id || null,
    reportType: selectedReport?.type || null,
    reportsData: null, // Would need to pass this from provider props
  });

  // Context value
  const value: ModalContextValue = {
    openOrderModal: useCallback((id, type) => setSelectedOrder({id, type}), []),
    closeOrderModal: useCallback(() => setSelectedOrder(null), []),

    openServiceModal: useCallback((id) => setSelectedService(id), []),
    closeServiceModal: useCallback(() => setSelectedService(null), []),

    openReportModal: useCallback((id, type) => setSelectedReport({id, type}), []),
    closeReportModal: useCallback(() => setSelectedReport(null), []),

    openUserModal: useCallback((id) => setSelectedUser(id), []),
    closeUserModal: useCallback(() => setSelectedUser(null), []),
  };

  return (
    <ModalContext.Provider value={value}>
      {children}

      {/* Modals auto-render based on state */}
      <OrderModal
        isOpen={!!selectedOrder}
        onClose={value.closeOrderModal}
        order={orderDetails}
        currentUser={currentUser}
      />

      <ServiceViewModal
        isOpen={!!selectedService}
        onClose={value.closeServiceModal}
        serviceId={selectedService || ''}
      />

      <ReportModal
        isOpen={!!selectedReport}
        onClose={value.closeReportModal}
        report={reportDetails}
        currentUser={currentUser}
      />

      <UserModal
        isOpen={!!selectedUser}
        onClose={value.closeUserModal}
        userId={selectedUser || ''}
      />
    </ModalContext.Provider>
  );
}

export function useModals() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModals must be used within ModalProvider');
  }
  return context;
}
```

#### B. Updated ActivityFeed (Modified)
**Location:** `apps/frontend/src/components/ActivityFeed.tsx`

**BEFORE:**
```tsx
interface ActivityFeedProps {
  onOpenOrderModal?: (data: { id: string; type: 'product' | 'service' }) => void;
  onOpenServiceModal?: (serviceId: string) => void;
  onOpenReportModal?: (data: { id: string; type: 'report' | 'feedback' }) => void;
}

export function ActivityFeed({ onOpenOrderModal, onOpenServiceModal, onOpenReportModal }: ActivityFeedProps) {
  // Uses callbacks
  <div onClick={() => onOpenOrderModal?.({id: orderId, type: 'product'})}>
}
```

**AFTER:**
```tsx
import { useModals } from '../contexts/ModalProvider';

interface ActivityFeedProps {
  // No modal callbacks needed!
}

export function ActivityFeed(props: ActivityFeedProps) {
  const { openOrderModal, openServiceModal, openReportModal } = useModals();

  // Direct calls
  <div onClick={() => openOrderModal(orderId, 'product')}>
}
```

#### C. Updated ReportsSection (Modified)
**Location:** `packages/domain-widgets/src/reports/ReportsSection.tsx`

**BEFORE:**
```tsx
interface ReportsSectionProps {
  onReportClick?: (reportId: string, reportType: 'report' | 'feedback') => void;
}

<ReportCard onClick={() => onReportClick?.(id, type)} />
```

**AFTER:**
```tsx
import { useModals } from '../../apps/frontend/src/contexts/ModalProvider'; // Need to export from shared location

interface ReportsSectionProps {
  // No callback needed!
}

const { openReportModal } = useModals();

<ReportCard onClick={() => openReportModal(id, type)} />
```

#### D. Updated Hub (Simplified)
**Location:** `apps/frontend/src/hubs/CrewHub.tsx`

**BEFORE (Current):**
```tsx
export default function CrewHub() {
  // 50+ lines of modal state
  const [selectedOrderFromActivity, setSelectedOrderFromActivity] = useState(null);
  const [selectedServiceFromActivity, setSelectedServiceFromActivity] = useState(null);
  const [selectedReportFromActivity, setSelectedReportFromActivity] = useState(null);

  return (
    <>
      <ActivityFeed
        onOpenOrderModal={setSelectedOrderFromActivity}
        onOpenServiceModal={setSelectedServiceFromActivity}
        onOpenReportModal={setSelectedReportFromActivity}
      />

      <ReportsSection onReportClick={(id, type) => setSelectedReportFromActivity({id, type})} />

      {/* 30+ lines of modal renders */}
      <OrderModal isOpen={!!selectedOrderFromActivity} ... />
      <ServiceViewModal isOpen={!!selectedServiceFromActivity} ... />
      <ReportModal isOpen={!!selectedReportFromActivity} ... />
    </>
  );
}
```

**AFTER (New):**
```tsx
import { ModalProvider } from '../contexts/ModalProvider';

export default function CrewHub() {
  const { code } = useAuth();

  return (
    <ModalProvider currentUser={code || ''}>
      <ActivityFeed />
      <ReportsSection />
      {/* Modals auto-render from provider - NO CODE NEEDED */}
    </ModalProvider>
  );
}
```

**Code Reduction:** ~50 lines removed per hub × 7 hubs = **~350 lines removed**

---

## 3. Migration Plan

### Phase 1: Create Foundation (1-2 hours)

**Step 1.1:** Create ModalProvider
- [ ] Create `apps/frontend/src/contexts/ModalProvider.tsx`
- [ ] Implement state management for all 4 modal types
- [ ] Integrate hooks (useOrderDetails, useReportDetails, etc.)
- [ ] Render all modals internally

**Step 1.2:** Create useModals hook
- [ ] Export from ModalProvider.tsx
- [ ] Type definitions for all modal functions

**Step 1.3:** Export from shared location
- [ ] Add to `apps/frontend/src/contexts/index.ts`
- [ ] Make accessible to domain-widgets

### Phase 2: Update Shared Components (30 min)

**Step 2.1:** Update ActivityFeed
- [ ] Remove callback props from interface
- [ ] Add `useModals()` hook
- [ ] Replace callback calls with direct hook calls
- [ ] Update all 7 hubs that use ActivityFeed (remove prop passing)

**Step 2.2:** Update ReportsSection
- [ ] Remove `onReportClick` prop
- [ ] Add `useModals()` hook
- [ ] Replace callback with direct hook call

### Phase 3: Migrate Hubs One-by-One (2-3 hours)

**For Each Hub:**
1. Wrap content in `<ModalProvider currentUser={code}>`
2. Remove modal state (selectedOrderFromActivity, etc.)
3. Remove callback props from ActivityFeed
4. Remove callback props from ReportsSection
5. Remove all modal render code (OrderModal, ServiceViewModal, etc.)
6. Test all modal opening scenarios

**Order:**
1. CrewHub (simplest, already partially updated)
2. CustomerHub
3. CenterHub
4. ContractorHub
5. WarehouseHub
6. ManagerHub
7. AdminHub (most complex, has directory modals too)

### Phase 4: Handle Directory Modals (1 hour)

**Challenge:** Directory tables have inline `onRowClick` handlers:
```tsx
// Current
onRowClick: (row) => setSelectedOrderId(row.id);
```

**Solution Options:**

**Option A:** Keep directory modals local (recommended)
- Directory clicks are hub-specific code, not shared components
- Keep local state for directory-opened modals
- ModalProvider handles shared component modals only

**Option B:** Extend ModalProvider to handle all modals
- Add directory context to ModalProvider
- More centralized but more complex

**Recommendation:** Option A - keep directory modals as-is

### Phase 5: Testing & Validation (1-2 hours)

**Test Matrix:**
| Hub | Activity Feed → Order | Activity Feed → Service | Activity Feed → Report | Reports Section → Report | Directory → Order | Directory → Service |
|-----|----------------------|------------------------|----------------------|-------------------------|-------------------|-------------------|
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manager | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Warehouse | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Contractor | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Customer | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Center | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Crew | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 4. Impact Analysis

### 4.1 Files Changed

**New Files (1):**
- `apps/frontend/src/contexts/ModalProvider.tsx` (~150 lines)

**Modified Files (14):**
- `apps/frontend/src/components/ActivityFeed.tsx` (props removed, hook added)
- `packages/domain-widgets/src/reports/ReportsSection.tsx` (props removed, hook added)
- `apps/frontend/src/hubs/AdminHub.tsx` (-50 lines)
- `apps/frontend/src/hubs/ManagerHub.tsx` (-50 lines)
- `apps/frontend/src/hubs/WarehouseHub.tsx` (-50 lines)
- `apps/frontend/src/hubs/ContractorHub.tsx` (-50 lines)
- `apps/frontend/src/hubs/CustomerHub.tsx` (-50 lines)
- `apps/frontend/src/hubs/CenterHub.tsx` (-50 lines)
- `apps/frontend/src/hubs/CrewHub.tsx` (-50 lines)

**Deleted Files (0):**
- None

### 4.2 Code Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total Lines (hubs) | ~8,770 | ~8,420 | -350 lines (-4%) |
| Modal State Declarations | 21 (7 hubs × 3 types) | 4 (1 provider) | -17 (-81%) |
| Modal Render Blocks | 21 (7 hubs × 3 types) | 4 (1 provider) | -17 (-81%) |
| Callback Prop Wiring | 14 (7 hubs × 2 components) | 0 | -14 (-100%) |

### 4.3 Breaking Changes

**None** - This is pure refactor, no API changes for end users.

**Internal API Changes:**
- ActivityFeed no longer accepts modal callback props (breaking for hubs)
- ReportsSection no longer accepts `onReportClick` (breaking for hubs)
- Both require ModalProvider ancestor (new requirement)

---

## 5. Risks & Considerations

### 5.1 Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Data fetching in provider couples modals to hub data | Medium | Pass data sources as props to ModalProvider |
| Context re-renders entire tree on modal open | Low | Use React.memo on expensive components, context selectors |
| Harder to customize modal per hub | Low | Pass customization props to ModalProvider |
| Testing requires ModalProvider wrapper | Low | Create test utility wrapper |
| Domain-widgets accessing frontend context | Medium | Re-export useModals from shared location |

### 5.2 Alternatives Considered

**Alternative 1: Custom Hook Only (No Provider)**
```tsx
const { orderModal, serviceModal, reportModal } = useHubModals();
return (
  <>
    {orderModal}
    {serviceModal}
    {reportModal}
  </>
);
```
**Rejected:** Still requires hub to render modals, not truly plug-and-play.

**Alternative 2: Event Bus**
```tsx
eventBus.emit('openOrderModal', { id, type });
```
**Rejected:** Non-idiomatic React, harder to type, harder to debug.

**Alternative 3: Keep Current (Callback Pattern)**
**Rejected:** Doesn't solve modularity problem.

### 5.3 Technical Challenges

**Challenge 1:** Data Dependencies
- Modals need hub-specific data (orders, reports, services)
- Provider needs access to hub's data context

**Solution:** ModalProvider accepts data sources as props:
```tsx
<ModalProvider
  currentUser={code}
  ordersData={orders}
  reportsData={reportsData}
  servicesData={services}
>
```

**Challenge 2:** Cross-Package Imports
- domain-widgets (ReportsSection) needs to import from apps/frontend (ModalProvider)
- Violates package boundaries

**Solution:** Create shared context package or re-export from a shared location:
```
packages/
  contexts/
    src/
      ModalContext.ts  ← Shared between frontend & domain-widgets
```

---

## 6. Future Extensibility

### 6.1 Adding New Modal Type

**Before (Current):**
1. Update ActivityFeed props (1 file)
2. Update 7 hubs with state (7 files)
3. Update 7 hubs with callbacks (7 files)
4. Update 7 hubs with modal render (7 files)
**Total:** 22 file changes

**After (Proposed):**
1. Add state to ModalProvider (1 file)
2. Add function to ModalContextValue (1 file)
3. Add modal render to ModalProvider (1 file)
**Total:** 1 file changed (3 sections)

### 6.2 Adding New Section

**Current:** Define callbacks, wire in all hubs
**Proposed:** Just use `useModals()` hook, zero wiring

### 6.3 Example: Adding InventoryModal

```tsx
// In ModalProvider.tsx - ONLY file that changes
const [selectedInventory, setSelectedInventory] = useState<string | null>(null);

// Add to context
openInventoryModal: (productId) => setSelectedInventory(productId),

// Add to render
<InventoryModal isOpen={!!selectedInventory} ... />
```

**Then any component can:**
```tsx
const { openInventoryModal } = useModals();
<button onClick={() => openInventoryModal('PROD-123')}>View Inventory</button>
```

---

## 7. Recommendation

### ✅ Proceed with Modal Context Provider

**Reasons:**
1. **Eliminates 350 lines of duplicate code**
2. **Future-proof:** New modals/sections require zero hub changes
3. **Consistent:** All modals work the same way
4. **Testable:** Modals can be tested in isolation
5. **Maintainable:** Single source of truth for modal logic

**Timeline:** 5-7 hours total
**Risk Level:** Low (pure refactor, no functionality changes)
**ROI:** High (saves hours on every future modal/section addition)

---

## 8. Open Questions for Review

1. **Should directory modals be included in ModalProvider, or keep them hub-local?**
   - Recommendation: Keep hub-local (Option A in Phase 4)

2. **Where should ModalProvider live - in apps/frontend or shared package?**
   - Recommendation: apps/frontend initially, move to shared package if needed

3. **How to handle hub-specific modal customization (e.g., Admin has extra actions)?**
   - Recommendation: Pass customization props to ModalProvider

4. **Should we migrate all hubs at once or incrementally?**
   - Recommendation: Incremental (one hub at a time) to reduce risk

5. **Do we need modal history/stacking (opening modal from modal)?**
   - Recommendation: Not for v1, add if needed later

---

## 9. Next Steps

**If Approved:**
1. Create `ModalProvider.tsx` foundation
2. Test with CrewHub (pilot)
3. If successful, migrate remaining 6 hubs
4. Update documentation
5. Clean up old callback code

**If Rejected:**
1. Complete current callback pattern (5 remaining hubs)
2. Document the pattern
3. Accept the duplication cost

---

## Appendix A: Code Samples

### Before/After Comparison - CrewHub

**BEFORE:**
```tsx
// CrewHub.tsx - Lines 200-280 (80 lines)
const [selectedOrderFromActivity, setSelectedOrderFromActivity] = useState<{
  id: string;
  type: 'product' | 'service';
} | null>(null);
const [selectedServiceFromActivity, setSelectedServiceFromActivity] = useState<string | null>(null);
const [selectedReportFromActivity, setSelectedReportFromActivity] = useState<{
  id: string;
  type: 'report' | 'feedback';
} | null>(null);

const { order: selectedOrderFromActivityFull } = useOrderDetails(
  selectedOrderFromActivity?.id || null,
  selectedOrderFromActivity?.type || null
);

const { report: selectedReportFromActivityFull } = useReportDetails({
  reportId: selectedReportFromActivity?.id || null,
  reportType: selectedReportFromActivity?.type || null,
  reportsData,
});

// ... 40 lines later ...

<ActivityFeed
  activities={activityFeed}
  onClearActivity={handleClearActivity}
  onOpenOrderModal={setSelectedOrderFromActivity}
  onOpenServiceModal={setSelectedServiceFromActivity}
  onOpenReportModal={setSelectedReportFromActivity}
/>

<ReportsSection
  onReportClick={(id, type) => setSelectedReportFromActivity({id, type})}
  // ... other props
/>

// ... 30 lines later ...

<OrderModal
  isOpen={!!selectedOrderFromActivity}
  onClose={() => setSelectedOrderFromActivity(null)}
  order={selectedOrderFromActivityFull}
  currentUser={normalizedCode || ''}
/>

<ServiceViewModal
  isOpen={!!selectedServiceFromActivity}
  onClose={() => setSelectedServiceFromActivity(null)}
  serviceId={selectedServiceFromActivity || ''}
/>

<ReportModal
  isOpen={!!selectedReportFromActivity}
  onClose={() => setSelectedReportFromActivity(null)}
  report={selectedReportFromActivityFull}
  currentUser={normalizedCode || ''}
  showQuickActions={true}
/>
```

**AFTER:**
```tsx
// CrewHub.tsx - Lines 200-210 (10 lines)
import { ModalProvider } from '../contexts/ModalProvider';

export default function CrewHub() {
  const { code } = useAuth();

  return (
    <ModalProvider currentUser={code || ''} reportsData={reportsData}>
      <PageWrapper>
        <ActivityFeed activities={activityFeed} onClearActivity={handleClearActivity} />
        <ReportsSection role="crew" userId={code} />
      </PageWrapper>
    </ModalProvider>
  );
}
```

**Difference:** 70 lines removed from CrewHub alone.

---

**End of Plan Document**

*Please review with second opinion before proceeding. Key decision points highlighted in Section 8 (Open Questions).*
