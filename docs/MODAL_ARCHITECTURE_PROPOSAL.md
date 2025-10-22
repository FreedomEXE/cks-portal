# Modal Architecture Proposal - Unified Modular Pattern

## Problem Statement

Current modal architecture is inconsistent across entity types:
- **Orders**: Use `ActivityModalGateway` (smart wrapper)
- **Services**: Direct modals with callbacks in `ModalProvider`
- **Reports**: Direct modal with NO action callbacks

This makes it confusing to:
- Add new entity types
- Understand where logic lives
- Open modals from different locations (activity feed vs directory)
- Maintain role-based permissions

**Goal**: Every entity type follows the SAME pattern. Any developer (or AI) can look at one example and understand how to build modals for all entities.

---

## Proposed Architecture: The Gateway Pattern

### Layers Overview

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: UI Components (Pure - No Business Logic)      │
│ - ModalRoot: Portal, backdrop, animations              │
│ - BaseViewModal: Standard layout (card + tabs)         │
│ - EntityModal: Renders data passed as props            │
└─────────────────────────────────────────────────────────┘
                           ▲
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Gateway Components (Smart Orchestrators)      │
│ - OrderModalGateway                                     │
│ - ReportModalGateway                                    │
│ - ServiceModalGateway                                   │
│ - UserModalGateway                                      │
│                                                          │
│ Each Gateway:                                           │
│ 1. Fetches data (useEntityDetails hook)                │
│ 2. Gets actions (useEntityActions hook)                │
│ 3. Derives state (active/archived/deleted)             │
│ 4. Builds action list based on role + state            │
│ 5. Passes everything to pure UI component              │
└─────────────────────────────────────────────────────────┘
                           ▲
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Data Hooks (Fetching & Normalization)         │
│ - useOrderDetails(orderId)                              │
│ - useReportDetails(reportId)                            │
│ - useServiceDetails(serviceId)                          │
│ - useUserDetails(userId)                                │
└─────────────────────────────────────────────────────────┘
                           ▲
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Action Hooks (Business Logic)                 │
│ - useEntityActions() - All CRUD + archive/restore       │
│ - Returns: handleAction, handleArchive, handleDelete   │
└─────────────────────────────────────────────────────────┘
                           ▲
┌─────────────────────────────────────────────────────────┐
│ Layer 5: ModalProvider (State Management Only)         │
│ - Tracks which modals are open                          │
│ - Provides openXModal / closeXModal context            │
│ - Renders all XModalGateway components                 │
└─────────────────────────────────────────────────────────┘
```

---

## The Gateway Pattern (Template)

Every entity follows this exact template:

### File: `apps/frontend/src/components/ReportModalGateway.tsx`

```tsx
import React, { useMemo } from 'react';
import { ReportModal, type ReportAction } from '@cks/ui';
import { useReportDetails } from '../hooks/useReportDetails';
import { useEntityActions } from '../hooks/useEntityActions';

export interface ReportModalGatewayProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string | null;
  reportType: 'report' | 'feedback';
  role: 'user' | 'admin';

  // Optional state override
  reportState?: 'active' | 'archived' | 'deleted';
}

export function ReportModalGateway({
  isOpen,
  onClose,
  reportId,
  reportType,
  role,
  reportState,
}: ReportModalGatewayProps) {
  // 1. Fetch data
  const { report, isLoading } = useReportDetails({ reportId, reportType });

  // 2. Get action handlers
  const { handleAction } = useEntityActions();

  // 3. Derive state
  const derivedState = useMemo(() => {
    if (reportState) return reportState;
    if (report?.isDeleted) return 'deleted';
    if (report?.archivedAt) return 'archived';
    return 'active';
  }, [reportState, report]);

  // 4. Build actions based on role and state
  const actions: ReportAction[] = useMemo(() => {
    if (!report) return [];

    if (role === 'admin') {
      if (derivedState === 'active') {
        return [
          {
            label: 'Archive Report',
            variant: 'secondary',
            onClick: () => handleAction(reportId, 'archive')
          },
        ];
      }

      if (derivedState === 'archived') {
        return [
          {
            label: 'Restore Report',
            variant: 'secondary',
            onClick: () => handleAction(reportId, 'restore')
          },
          {
            label: 'Delete Permanently',
            variant: 'danger',
            onClick: () => handleAction(reportId, 'delete')
          },
        ];
      }
    }

    // User actions (acknowledge, resolve, etc.)
    if (role === 'user') {
      const userActions = [];

      if (report.status === 'open') {
        userActions.push({
          label: 'Acknowledge',
          variant: 'primary',
          onClick: () => handleAction(reportId, 'acknowledge')
        });
      }

      if (reportType === 'report' && report.status === 'open') {
        userActions.push({
          label: 'Resolve',
          variant: 'primary',
          onClick: () => handleAction(reportId, 'resolve')
        });
      }

      return userActions;
    }

    return [];
  }, [report, role, derivedState, reportId, reportType, handleAction]);

  // 5. Render pure UI component with all data
  return (
    <ReportModal
      isOpen={isOpen}
      onClose={onClose}
      report={report}
      actions={actions}
      isLoading={isLoading}
      showQuickActions={true}
    />
  );
}

export default ReportModalGateway;
```

---

## ModalProvider Updates

### Before (Inconsistent)

```tsx
function ModalProvider() {
  // Orders use gateway
  <ActivityModalGateway
    isOpen={!!selectedOrderId}
    orderId={selectedOrderId}
    role={role}
    onArchive={onArchive}
    onDelete={onDelete}
    onRestore={onRestore}
  />

  // Services pass callbacks directly (no gateway)
  <ServiceDetailsModal
    isOpen={!!selectedService}
    service={serviceDetails}  // Provider fetches this
    onSave={onServiceSave}    // Provider defines this
    onStartService={onStartService}
  />

  // Reports have no actions at all
  <ReportModal
    isOpen={!!selectedReport}
    report={reportDetails}  // Provider fetches this
    showQuickActions={true}
  />
}
```

### After (Consistent)

```tsx
function ModalProvider({ children, role }: ModalProviderProps) {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<{ id: string; type: 'report' | 'feedback' } | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const value = {
    openOrderModal: (id: string) => setSelectedOrder(id),
    closeOrderModal: () => setSelectedOrder(null),
    openReportModal: (id: string, type: 'report' | 'feedback') => setSelectedReport({ id, type }),
    closeReportModal: () => setSelectedReport(null),
    openServiceModal: (id: string) => setSelectedService(id),
    closeServiceModal: () => setSelectedService(null),
    openUserModal: (id: string) => setSelectedUser(id),
    closeUserModal: () => setSelectedUser(null),
  };

  return (
    <ModalContext.Provider value={value}>
      {children}

      {/* All modals follow same gateway pattern */}
      <OrderModalGateway
        isOpen={!!selectedOrder}
        onClose={value.closeOrderModal}
        orderId={selectedOrder}
        role={role}
      />

      <ReportModalGateway
        isOpen={!!selectedReport}
        onClose={value.closeReportModal}
        reportId={selectedReport?.id}
        reportType={selectedReport?.type}
        role={role}
      />

      <ServiceModalGateway
        isOpen={!!selectedService}
        onClose={value.closeServiceModal}
        serviceId={selectedService}
        role={role}
      />

      <UserModalGateway
        isOpen={!!selectedUser}
        onClose={value.closeUserModal}
        userId={selectedUser}
        role={role}
      />
    </ModalContext.Provider>
  );
}
```

---

## How to Add a New Entity Modal

1. **Create data hook**: `hooks/useProductDetails.ts`
   - Fetches product data from API
   - Normalizes into UI-friendly format

2. **Add action handlers**: Update `hooks/useEntityActions.ts`
   - Add `handleProductAction()` function
   - Handle archive, delete, restore, etc.

3. **Create gateway**: `components/ProductModalGateway.tsx`
   - Copy the template above
   - Replace "Report" with "Product"
   - Define role-based actions

4. **Create UI modal**: `packages/ui/src/modals/ProductModal/`
   - Use `BaseViewModal` for consistent layout
   - Create `ProductCard` component
   - Create `ProductQuickActions` and `ProductDetails` tabs

5. **Wire to provider**: Update `contexts/ModalProvider.tsx`
   - Add `openProductModal` / `closeProductModal` to context
   - Add `<ProductModalGateway>` to render tree

That's it. No special cases, no confusion about where logic lives.

---

## Benefits

✅ **Consistency**: Every entity type works the same way
✅ **Modularity**: Each layer has a single responsibility
✅ **Reusability**: Modals work from activity feed, directory, anywhere
✅ **Role-based**: Permissions handled in gateway, not scattered
✅ **Testable**: Pure components, isolated hooks
✅ **Self-documenting**: Clear naming shows what each piece does
✅ **AI-friendly**: Pattern is obvious, easy to extend

---

## Migration Plan

### Phase 1: Create Missing Gateways
1. ✅ `OrderModalGateway` - Already exists (rename from ActivityModalGateway)
2. 🔨 `ReportModalGateway` - Create following template above
3. 🔨 `ServiceModalGateway` - Extract logic from ModalProvider
4. 🔨 `UserModalGateway` - Extract logic from ModalProvider

### Phase 2: Update Hooks
1. ✅ `useEntityActions` - Already exists, needs report/service actions
2. ✅ `useOrderDetails` - Already exists
3. ✅ `useReportDetails` - Already exists
4. ✅ `useServiceDetails` - Already exists

### Phase 3: Simplify ModalProvider
1. Remove data fetching logic (gateways handle it)
2. Remove callback definitions (useEntityActions handles it)
3. Just manage open/close state + render gateways

### Phase 4: Update UI Components
1. Add `actions` prop to ReportModal
2. Ensure all modals accept actions array
3. Remove hardcoded role logic from UI components

---

## Files to Create/Update

### New Files
- `apps/frontend/src/components/ReportModalGateway.tsx`
- `apps/frontend/src/components/ServiceModalGateway.tsx`
- `apps/frontend/src/components/UserModalGateway.tsx`

### Updates
- `apps/frontend/src/components/ActivityModalGateway.tsx` → Rename to `OrderModalGateway.tsx`
- `apps/frontend/src/contexts/ModalProvider.tsx` - Simplify, use gateways
- `apps/frontend/src/hooks/useEntityActions.ts` - Add report/service actions
- `packages/ui/src/modals/ReportModal/ReportModal.tsx` - Add actions prop
- `packages/ui/src/modals/ReportModal/components/ReportQuickActions.tsx` - Render actions

---

## Open Question for CTO Approval

Should we proceed with this architecture? If yes, I recommend starting with ReportModalGateway since that's the immediate need (archive/delete functionality).

**Estimated effort**:
- ReportModalGateway: 1-2 hours
- Full migration: 4-6 hours

**Alternative**: Keep current inconsistency and just add archive/delete buttons to ReportModal directly. Fast but creates more tech debt.

Your call, boss.
