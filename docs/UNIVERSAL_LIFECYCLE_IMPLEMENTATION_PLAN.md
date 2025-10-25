# Universal Lifecycle System - Implementation Plan

**Status:** Ready for Implementation
**Created:** 2025-10-22
**Last Updated:** 2025-10-22

---

## Executive Summary

This plan implements a **truly modular** lifecycle system where:
- ONE entity catalog defines ALL entity metadata
- ONE lifecycle detection function works for ALL entities
- ONE banner component renders for ALL entities
- ONE history tab component works for ALL entities
- ONE tombstone pattern works for ALL entities

**Result:** Adding a new entity type requires ONE catalog entry. Everything else is automatic.

---

## Table of Contents

1. [Phase 0: Entity Catalog Foundation](#phase-0-entity-catalog-foundation)
2. [Phase 1: Lifecycle Backend](#phase-1-lifecycle-backend)
3. [Phase 2: Lifecycle Frontend System](#phase-2-lifecycle-frontend-system)
4. [Phase 3: Universal Banner Rendering](#phase-3-universal-banner-rendering)
5. [Phase 4: Tombstone Support](#phase-4-tombstone-support)
6. [Phase 5: History Tab](#phase-5-history-tab)
7. [Phase 6: Comprehensive Testing](#phase-6-comprehensive-testing)
8. [Acceptance Criteria](#acceptance-criteria)

---

## Phase 0: Entity Catalog Foundation

### Problem
- ID patterns hardcoded in multiple files
- Backend table mappings duplicated
- Display names inconsistent ("Service" vs "service" vs "SVC")
- No validation for supported capabilities
- Mismatches between frontend/backend (PROD vs PRD, SRV vs SVC)

### Solution: Canonical Entity Catalog

**Twin Files (Keep Synchronized):**
- `apps/frontend/src/shared/constants/entityCatalog.ts`
- `apps/backend/server/shared/entityCatalog.ts`

**Do NOT import across boundaries** - maintain separate but identical catalogs.

---

### Entity Definition Schema

```typescript
export interface EntityDefinition {
  // Core identity
  type: string;                    // 'order', 'report', 'service', etc.
  displayName: string;             // "Order" (proper case)
  displayNamePlural: string;       // "Orders"

  // ID patterns (anchored, case-insensitive)
  idToken: string | string[];      // "RPT" or ["SO", "PO"]
  idPattern: RegExp;               // /^(?:[A-Z]{3}-\d{3}-)?RPT-\d+$/i
  scopePrefix?: string;            // "MGR-", "CON-", etc.

  // Backend mapping
  backendTable: string;            // 'orders', 'reports'
  backendIdColumn: string;         // 'order_id', 'report_id'

  // Frontend endpoints
  detailsEndpoint?: (id: string) => string;

  // Capability flags
  supportsDetailFetch: boolean;    // Details endpoint exists?
  supportsArchive: boolean;
  supportsDelete: boolean;
  supportsRestore: boolean;
  supportsHistory: boolean;
  supportsTombstone: boolean;

  // UI/Modal
  modalComponent: string;
  defaultTabOrder: string[];

  // Activity types (must match backend exactly)
  activityTypes: {
    created: string;
    archived: string;
    restored: string;
    deleted: string;
  };
}
```

---

### Supported Entity Types

| Type | Display Name | ID Pattern | Table | Detail Endpoint | Status |
|------|--------------|------------|-------|-----------------|--------|
| order | Order | `*-PO-*` or `*-SO-*` | orders | `/api/order/:id/details` | ✅ Ready |
| report | Report | `*-RPT-*` | reports | `/api/reports/:id/details` | ✅ Ready |
| feedback | Feedback | `*-FBK-*` | reports | `/api/reports/:id/details` | ✅ Ready |
| service | Service | `SRV-*` | services | `/api/services/:id/details` | ⚠️ Pending |
| product | Product | `PROD-*` or `PRD-*` | product_catalog | undefined | ⚠️ TODO |
| manager | Manager | `MGR-*` | managers | undefined | ⚠️ TODO |
| contractor | Contractor | `CON-*` | contractors | undefined | ⚠️ TODO |
| customer | Customer | `CUS-*` | customers | undefined | ⚠️ TODO |
| center | Center | `CEN-*` | centers | undefined | ⚠️ TODO |
| crew | Crew | `CRW-*` | crews | undefined | ⚠️ TODO |
| warehouse | Warehouse | `WAR-*` | warehouses | undefined | ⚠️ TODO |
| unknown | Unknown Entity | `.*` (fallback) | N/A | undefined | ✅ Fallback |

---

### Critical Implementation Notes

#### Endpoint Conventions
- **Orders:** Use SINGULAR `/api/order/:id/details` (per backend convention)
- **Reports/Feedback:** Use PLURAL `/api/reports/:id/details` (existing)
- **Services:** Pending - gate with `supportsDetailFetch: false` and `SERVICE_DETAIL_FETCH` flag
- **Others:** Mark as `undefined` and `supportsDetailFetch: false` until implemented

#### ID Pattern Requirements
- **Anchored:** Use `^` and `$` to prevent partial matches
- **Case-insensitive:** Use `/i` flag
- **Scope support:** Handle both `RPT-123` and `CEN-010-RPT-123`
- **Example:** `/^(?:[A-Z]{3}-\d{3}-)?(?:S|P)O-\d+$/i` for orders

#### Activity Type Consistency
Must match backend event writers exactly:
- `order_hard_deleted` (not `order_deleted`)
- `report_archived` (not `report_archive`)
- Pattern: `{type}_{action_past_tense}`

#### Fallback Handling
The `unknown` entity type prevents crashes:
```typescript
unknown: {
  type: 'unknown',
  displayName: 'Unknown Entity',
  supportsDetailFetch: false,
  supportsArchive: false,
  // ... all capabilities disabled
}
```

---

### Helper Functions

```typescript
// Get definition (always returns something - uses 'unknown' fallback)
export function getEntityDefinition(type: string): EntityDefinition {
  return ENTITY_CATALOG[type] || ENTITY_CATALOG.unknown;
}

// Parse ID to find type
export function getEntityByIdPattern(id: string): EntityDefinition {
  const match = Object.values(ENTITY_CATALOG)
    .filter(def => def.type !== 'unknown')
    .find(def => def.idPattern.test(id));

  if (!match) {
    console.warn(`[EntityCatalog] Unknown ID pattern: "${id}"`);
  }

  return match || ENTITY_CATALOG.unknown;
}

// Check capabilities
export function supportsLifecycleAction(
  type: string,
  action: 'archive' | 'delete' | 'restore' | 'detailFetch' | 'history' | 'tombstone'
): boolean {
  const def = getEntityDefinition(type);
  switch(action) {
    case 'archive': return def.supportsArchive;
    case 'delete': return def.supportsDelete;
    case 'restore': return def.supportsRestore;
    case 'detailFetch': return def.supportsDetailFetch;
    case 'history': return def.supportsHistory;
    case 'tombstone': return def.supportsTombstone;
    default: return false;
  }
}

// Validate ID
export function validateEntityId(id: string): { valid: boolean; type: string; reason?: string } {
  const def = getEntityByIdPattern(id);
  if (def.type === 'unknown') {
    return { valid: false, type: 'unknown', reason: 'ID does not match any known pattern' };
  }
  return { valid: true, type: def.type };
}
```

---

### Phase 0 Tasks

#### 0.1: Create Catalogs
- [ ] Create `apps/frontend/src/shared/constants/entityCatalog.ts`
  - Include all 11 entity types + unknown fallback
  - Define accurate ID patterns with scope support
  - Set capability flags based on current endpoint availability
  - Add helper functions
- [ ] Create `apps/backend/server/shared/entityCatalog.ts`
  - Mirror frontend catalog (server-relevant fields only)
  - Do NOT import frontend code
- [ ] Create `docs/ENTITY_CATALOG.md`
  - Human-readable reference table
  - Document ID patterns with examples
  - List current endpoint status

#### 0.2: Migrate ID Parser
- [ ] Update `apps/frontend/src/shared/utils/parseEntityId.ts`
  - Replace hardcoded patterns with `getEntityByIdPattern()`
  - Add scope extraction using catalog
  - Add temporary logging for unknown IDs (analytics during rollout)
  - Return `type: 'unknown'` for unrecognized IDs (graceful degradation)
- [ ] Test all ID variations:
  - Scoped: `CEN-010-PO-001`
  - Unscoped: `RPT-456`
  - Padded: `PRD-00000123`
  - Invalid: `INVALID-ID` → should return `unknown`

#### 0.3: Backend Integration
- [ ] Update `apps/backend/server/domains/archive/store.ts`
  - Import backend catalog
  - Replace table/column switch with `getEntityDefinition(type)`
  - Add capability checks before operations:
    ```typescript
    const def = getEntityDefinition(entityType);
    if (!def.supportsArchive) {
      throw new Error(`${entityType} does not support archiving`);
    }
    ```
  - Use `def.backendTable` and `def.backendIdColumn`
  - Use `def.activityTypes.archived` for event logging

#### 0.4: Update Detail Hooks
- [ ] `apps/frontend/src/hooks/useOrderDetails.ts`
  - Check `supportsDetailFetch` before calling
  - Use `detailsEndpoint()` from catalog
- [ ] `apps/frontend/src/hooks/useReportDetails.ts`
  - Same pattern
- [ ] `apps/frontend/src/hooks/useServiceDetails.ts`
  - Check both `supportsDetailFetch` AND `SERVICE_DETAIL_FETCH` flag
  - Graceful handling when endpoint not available

#### 0.5: Standardize UI Labels
- [ ] Search codebase for hardcoded entity names
- [ ] Replace with `ENTITY_CATALOG[type].displayName`
- [ ] Use `displayNamePlural` for lists/tables
- [ ] Ensure consistency (no more "service" vs "Service" vs "SVC")

#### 0.6: Testing
- [ ] Create `apps/frontend/src/tests/entityCatalog.test.ts`
- [ ] Test ID parsing for all entity types
- [ ] Test scoped vs unscoped variants
- [ ] Test unknown ID handling
- [ ] Verify all entities have complete definitions
- [ ] Test capability flag checks

---

## Phase 1: Lifecycle Backend

### New Endpoints Required

#### 1.1: Deleted Snapshot Endpoint
**Path:** `GET /api/deleted/:entityType/:entityId/snapshot`

**Purpose:** Retrieve last known state before hard deletion (tombstone view)

**Implementation:**
- File: `apps/backend/server/domains/archive/routes.fastify.ts`
- Query activity log for `{type}_hard_deleted` event
- Extract snapshot from activity metadata
- Return:
  ```json
  {
    "snapshot": { /* last known entity state */ },
    "deletedAt": "2025-10-22T10:30:00Z",
    "deletedBy": "admin-123",
    "deletionReason": "Data retention policy"
  }
  ```

**Validation:**
- Check entity type exists in catalog
- Check `supportsTombstone` capability
- Return 404 if no deletion event found
- Redact sensitive PII per existing hardDelete logic

#### 1.2: Entity History Endpoint
**Path:** `GET /api/activity/entity/:entityType/:entityId`

**Purpose:** Get chronological timeline of entity lifecycle events

**Implementation:**
- File: `apps/backend/server/domains/activity/routes.fastify.ts`
- Query activity log filtered by:
  - `target_type = entityType`
  - `target_id = entityId`
- Return events in chronological order:
  ```json
  [
    { "type": "order_created", "timestamp": "...", "actor": "..." },
    { "type": "order_archived", "timestamp": "...", "actor": "...", "reason": "..." },
    { "type": "order_restored", "timestamp": "...", "actor": "..." },
    { "type": "order_hard_deleted", "timestamp": "...", "actor": "...", "reason": "..." }
  ]
  ```

**Validation:**
- Check entity type exists in catalog
- Check `supportsHistory` capability
- Support pagination (optional): `?limit=50&offset=0`
- Filter to lifecycle events only (created/archived/restored/deleted)

#### 1.3: Backend Tasks
- [ ] Implement snapshot endpoint
- [ ] Implement history endpoint
- [ ] Test with orders (full lifecycle)
- [ ] Test with reports/feedback
- [ ] Verify activity type names match catalog
- [ ] Add error handling for unsupported entity types

---

## Phase 2: Lifecycle Frontend System

### 2.1: Lifecycle Interface

**File:** `apps/frontend/src/types/entities.ts`

**Add:**
```typescript
export interface Lifecycle {
  state: 'active' | 'archived' | 'deleted';

  // Archive metadata (when state === 'archived')
  archivedAt?: string;
  archivedBy?: string;
  archiveReason?: string;
  scheduledDeletion?: string;

  // Deletion metadata (when state === 'deleted')
  deletedAt?: string;
  deletedBy?: string;
  deletionReason?: string;
  isTombstone?: boolean;  // True if loaded from snapshot
}
```

### 2.2: Universal Lifecycle Extraction

**File:** `apps/frontend/src/components/ModalGateway.tsx`

**Add helper function:**
```typescript
function extractLifecycle(data: any, archiveMetadata: any): Lifecycle {
  // Priority 1: Deleted state
  if (data?.isDeleted || data?.deletedAt) {
    return {
      state: 'deleted',
      deletedAt: data.deletedAt,
      deletedBy: data.deletedBy,
      deletionReason: data.deletionReason,
      isTombstone: data.isTombstone || false
    };
  }

  // Priority 2: Archived state
  if (archiveMetadata?.archivedAt || data?.archivedAt) {
    return {
      state: 'archived',
      archivedAt: archiveMetadata?.archivedAt || data.archivedAt,
      archivedBy: archiveMetadata?.archivedBy || data.archivedBy,
      archiveReason: archiveMetadata?.reason || data.archiveReason,
      scheduledDeletion: archiveMetadata?.scheduledDeletion
    };
  }

  // Default: Active
  return { state: 'active' };
}
```

**Update detailsMap (lines 85-111):**
```typescript
const detailsMap = {
  order: {
    data: orderDetails.order,
    lifecycle: extractLifecycle(orderDetails.order, orderDetails.archiveMetadata)
  },
  report: {
    data: reportDetails.report,
    lifecycle: extractLifecycle(reportDetails.report, null)
  },
  service: {
    data: serviceDetails.service,
    lifecycle: extractLifecycle(serviceDetails.service, null)
  }
  // ... etc for all types
};
```

### 2.3: Pass Lifecycle to Adapters

**File:** `apps/frontend/src/config/entityRegistry.tsx`

**Update each adapter's `mapToProps`:**
```typescript
mapToProps: (data: any, actions: EntityAction[], onClose: () => void, lifecycle: Lifecycle) => {
  return {
    // ... existing props
    lifecycle,  // NEW: Pass lifecycle to modal
  };
}
```

### 2.4: Phase 2 Tasks
- [ ] Add `Lifecycle` interface to types
- [ ] Add `extractLifecycle()` helper to ModalGateway
- [ ] Update all entity detailsMap entries to extract lifecycle
- [ ] Update all adapters to forward lifecycle in mapToProps
- [ ] Test lifecycle detection for active/archived/deleted states

---

## Phase 3: Universal Banner Rendering

### Problem
Currently only order modals show archived/deleted banners. Reports, services, and all other entities don't show banners even when archived.

### Solution
Move banner rendering to modal shells (BaseViewModal, ActivityModal) so ALL entities get banners automatically.

### 3.1: Update BaseViewModal

**File:** `packages/ui/src/modals/BaseViewModal/BaseViewModal.tsx`

**Add imports:**
```typescript
import { ArchivedBanner } from '../../banners/ArchivedBanner';
import { DeletedBanner } from '../../banners/DeletedBanner';
```

**Update props:**
```typescript
export interface BaseViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: ReactNode;
  children: ReactNode;
  lifecycle?: Lifecycle;      // NEW
  entityType?: string;         // NEW
  entityId?: string;           // NEW
}
```

**Add banner rendering:**
```typescript
export default function BaseViewModal({
  isOpen,
  onClose,
  card,
  children,
  lifecycle,
  entityType = 'entity',
  entityId
}: BaseViewModalProps) {
  if (!isOpen) return null;

  return (
    <ModalRoot isOpen={isOpen} onClose={onClose}>
      <div className={styles.modalContainer}>
        <button className={styles.closeX} onClick={onClose}>×</button>

        <div className={styles.header}>{card}</div>

        {/* UNIVERSAL BANNER - renders for ANY entity */}
        {lifecycle && lifecycle.state !== 'active' && (
          <div style={{ padding: '0 16px', marginTop: '16px' }}>
            {lifecycle.state === 'archived' && (
              <ArchivedBanner
                archivedAt={lifecycle.archivedAt}
                archivedBy={lifecycle.archivedBy}
                reason={lifecycle.archiveReason}
                scheduledDeletion={lifecycle.scheduledDeletion}
                entityType={entityType}
                entityId={entityId}
              />
            )}
            {lifecycle.state === 'deleted' && (
              <DeletedBanner
                deletedAt={lifecycle.deletedAt}
                deletedBy={lifecycle.deletedBy}
                entityType={entityType}
                entityId={entityId}
                isTombstone={lifecycle.isTombstone}
              />
            )}
          </div>
        )}

        <div className={styles.tabContent}>{children}</div>
      </div>
    </ModalRoot>
  );
}
```

### 3.2: Update ActivityModal

**File:** `packages/ui/src/modals/ActivityModal/ActivityModal.tsx`

**Same pattern as BaseViewModal:**
- Add `lifecycle` prop
- Add banner rendering before tab content
- Remove duplicate banner code from ProductOrderContent/ServiceOrderContent

### 3.3: Update All Modal Components

**Files to update:**
- `packages/ui/src/modals/ReportModal/ReportModal.tsx`
- `packages/ui/src/modals/ServiceDetailsModal/ServiceDetailsModal.tsx`
- `packages/ui/src/modals/ProductModal/ProductModal.tsx`
- Any other modals using BaseViewModal

**Changes:**
- Accept `lifecycle`, `entityType`, `entityId` props
- Pass to BaseViewModal
- Remove any existing banner code

### 3.4: Update Entity Adapters

**File:** `apps/frontend/src/config/entityRegistry.tsx`

**For each adapter, update mapToProps to pass lifecycle:**
```typescript
const reportAdapter: EntityAdapter = {
  // ...
  mapToProps: (data: any, actions: EntityAction[], onClose: () => void, lifecycle: Lifecycle) => {
    return {
      isOpen: !!data,
      onClose,
      report: data,
      actions,
      lifecycle,           // NEW
      entityType: 'report', // NEW
      entityId: data?.id    // NEW
    };
  }
};
```

### 3.5: Phase 3 Tasks
- [ ] Update BaseViewModal to accept lifecycle props
- [ ] Add banner rendering to BaseViewModal
- [ ] Update ActivityModal similarly
- [ ] Update all modal components to accept lifecycle props
- [ ] Update all adapters to pass lifecycle
- [ ] Remove duplicate banner code from order content components
- [ ] Build UI package
- [ ] Test banners appear for all entity types

---

## Phase 4: Tombstone Support

### Problem
When user clicks a hard-deleted entity in activity feed, nothing happens because detail endpoint returns 404.

### Solution
Fallback to snapshot endpoint on 404, return tombstone data.

### 4.1: Update Detail Hooks Pattern

**Files:**
- `apps/frontend/src/hooks/useOrderDetails.ts`
- `apps/frontend/src/hooks/useReportDetails.ts`
- `apps/frontend/src/hooks/useServiceDetails.ts`

**Add tombstone fallback:**
```typescript
export function useOrderDetails({ orderId }: UseOrderDetailsProps) {
  const { data, error, isLoading, mutate } = useSWR(
    orderId ? `/api/order/${orderId}/details` : null,
    async (url) => {
      try {
        // Try normal fetch
        const response = await apiFetch(url);
        return response;
      } catch (error: any) {
        // On 404, try snapshot fallback
        if (error.status === 404 && supportsLifecycleAction('order', 'tombstone')) {
          console.log(`[useOrderDetails] Order ${orderId} not found, trying snapshot...`);

          try {
            const snapshot = await apiFetch(`/api/deleted/order/${orderId}/snapshot`);
            return {
              order: {
                ...snapshot.snapshot,
                isDeleted: true,
                deletedAt: snapshot.deletedAt,
                deletedBy: snapshot.deletedBy,
                deletionReason: snapshot.reason,
                isTombstone: true
              },
              archiveMetadata: null
            };
          } catch (snapshotError) {
            console.error('[useOrderDetails] Snapshot fetch failed:', snapshotError);
            throw error; // Throw original 404
          }
        }
        throw error;
      }
    }
  );

  // ... rest of hook
}
```

### 4.2: Phase 4 Tasks
- [x] Update useOrderDetails with tombstone fallback
- [x] Update useReportDetails with tombstone fallback
- [x] Update useServiceDetails with tombstone fallback (when supported)
- [x] Test opening deleted order from activity feed
- [x] Verify DeletedBanner shows with isTombstone message
- [x] Verify no Quick Actions available (read-only)
- [x] Test graceful degradation if snapshot missing

### 4.3: Centralized Implementation (COMPLETED)

**Status:** ✅ Shipped (commit `47b5efc`)

**Implementation:** Instead of duplicating tombstone logic in each hook, we centralized it in `apiFetch` with catalog validation:

**Changes:**
- Enhanced `apps/frontend/src/shared/api/client.ts`:
  - `parseDetailEndpoint()` validates catalog-backed detail endpoints
  - `fetchTombstoneSnapshot()` fetches deleted snapshots
  - Enhanced 404 handler with conditional tombstone fallback
  - Only attempts fallback on validated detail endpoints (prevents false positives)
- Removed 90+ lines of duplicated code from detail hooks
- Added 13 comprehensive tests in `client.test.ts`

**Benefits:**
- All 12 entity types with detail endpoints inherit tombstone support automatically
- Future detail hooks get it for free - no manual duplication needed
- Consistent `ApiResponse<T>` shape with `meta.isTombstone` flag
- Catalog-based validation prevents tombstone attempts on non-detail endpoints

**⚠️ Legacy Endpoint Pattern:**

`/api/entity/:type/:id?includeDeleted=1` is a legacy pattern still used by Activity click handlers. This endpoint has its own tombstone fallback via `getEntityWithFallback()` in the backend.

**Files using legacy pattern:**
- `apps/frontend/src/shared/utils/activityHelpers.ts`
- `apps/frontend/src/shared/utils/activityRouter.ts`
- `apps/frontend/src/shared/utils/adminActivityRouter.ts`
- `apps/backend/server/domains/entities/routes.fastify.ts`

**⚠️ DO NOT implement tombstone logic in hooks** - `apiFetch` handles all detail endpoint 404s automatically.

**🔄 Future Migration (Post-Bake):**
Migrate Activity helpers to use catalog-backed detail endpoints instead of `/api/entity/` once:
1. Detail endpoints have equivalent ecosystem scoping
2. Bake period confirms apiFetch tombstone logic is stable
3. Backend `/api/entity/` endpoint can be deprecated

---

## Phase 5: History Tab

### 5.1: Create History Component

**File:** `packages/ui/src/modals/_shared/HistoryTab.tsx`

```typescript
import React from 'react';

export interface HistoryEvent {
  type: string;           // 'order_created', 'order_archived', etc.
  timestamp: string;
  actor: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface HistoryTabProps {
  events: HistoryEvent[];
  isLoading?: boolean;
  error?: Error | null;
}

export function HistoryTab({ events, isLoading, error }: HistoryTabProps) {
  if (isLoading) {
    return <div style={{ padding: 24 }}>Loading history...</div>;
  }

  if (error) {
    return <div style={{ padding: 24, color: '#dc2626' }}>Failed to load history</div>;
  }

  if (!events || events.length === 0) {
    return <div style={{ padding: 24, color: '#6b7280' }}>No history available</div>;
  }

  // Format event type for display
  const formatEventType = (type: string) => {
    const parts = type.split('_');
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  return (
    <div style={{ padding: 24 }}>
      <h3 style={{ marginBottom: 16 }}>Lifecycle History</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {events.map((event, idx) => (
          <div
            key={idx}
            style={{
              padding: 12,
              border: '1px solid #e5e7eb',
              borderRadius: 4,
              backgroundColor: '#f9fafb'
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {formatEventType(event.type)}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              <div>
                <strong>When:</strong> {new Date(event.timestamp).toLocaleString()}
              </div>
              <div>
                <strong>By:</strong> {event.actor}
              </div>
              {event.reason && (
                <div>
                  <strong>Reason:</strong> {event.reason}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5.2: Create History Hook

**File:** `apps/frontend/src/hooks/useEntityHistory.ts`

```typescript
import useSWR from 'swr';
import { apiFetch } from '../shared/api/apiFetch';
import { supportsLifecycleAction } from '../shared/constants/entityCatalog';

export function useEntityHistory(entityType: string | null, entityId: string | null) {
  const shouldFetch = entityType && entityId && supportsLifecycleAction(entityType, 'history');

  const { data, error, isLoading } = useSWR(
    shouldFetch ? `/api/activity/entity/${entityType}/${entityId}` : null,
    apiFetch
  );

  return {
    events: data || [],
    error,
    isLoading
  };
}
```

### 5.3: Integrate into Modals

**Update BaseViewModal:**
```typescript
export interface BaseViewModalProps {
  // ... existing props
  entityHistory?: HistoryEvent[];
  historyLoading?: boolean;
  historyError?: Error | null;
  tabs?: Array<{ id: string; label: string }>;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

// Add tab rendering logic
{activeTab === 'history' && (
  <HistoryTab
    events={entityHistory || []}
    isLoading={historyLoading}
    error={historyError}
  />
)}
```

**Update ModalGateway:**
```typescript
// Fetch history
const history = useEntityHistory(entityType, entityId);

// Pass to modal via adapter
const componentProps = adapter.mapToProps(
  data,
  actions,
  onClose,
  lifecycle,
  history.events  // NEW
);
```

### 5.4: Standardize Tab Order

**Default:** `['details', 'history', 'actions']`

**Override per entity in catalog:**
- Orders: `['actions', 'details', 'history']` (actions first for workflow)
- Others: `['details', 'history', 'actions']` (details first)

### 5.5: Phase 5 Tasks
- [x] Create HistoryTab component
- [ ] Create useEntityHistory hook (NOT NEEDED - HistoryTab fetches directly)
- [ ] Update BaseViewModal to support tabs
- [ ] Update ActivityModal to support tabs
- [ ] Update ModalGateway to fetch history
- [ ] Update adapters to pass history
- [x] Test history tab for orders
- [x] Test history tab for reports
- [x] Verify chronological order
- [x] Verify events show correct metadata

### 5.6: Phase 5 Status (PARTIALLY COMPLETE)

**✅ What's Done:**
- HistoryTab component created and working (`packages/ui/src/tabs/HistoryTab.tsx`)
- HistoryTab fetches data directly via `/api/activity/entity/:type/:id` (no hook needed)
- Backend history endpoint working (`/api/activity/entity/:entityType/:entityId`)
- Lifecycle banners working universally

**❌ What's NOT Done:**
- Tab composition is STILL per-modal (ActivityModal, ReportModal, ServiceDetailsModal each define tabs locally)
- Adding HistoryTab required editing 3 separate modal files
- Tab order hardcoded in each modal
- No RBAC visibility logic for tabs

**🔥 Problem Identified:**
After 48 hours of making lifecycle/tombstone/banners universal, tab composition is still per-modal. This defeats the purpose of modularity. Adding a new tab = touching N modal files.

**➡️ Solution:** Phase 6 - Universal Tab Composition

---

## Phase 6: Universal Tab Composition with RBAC

**Status:** 🚧 IN PROGRESS (2025-10-23)

### Problem Statement

Current architecture requires editing multiple modal files to add a tab:
- `ActivityModal` defines tabs locally
- `ReportModal` defines tabs locally
- `ServiceDetailsModal` defines tabs locally

**What we want:**
1. **ONE place** to define tab composition for all entities
2. **RBAC visibility** - tabs shown based on user role + entity state
3. **Entity-specific overrides** - some entities have custom tabs/ordering

### Solution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ ModalGateway/Adapter                                        │
│ • Builds tab descriptors in ONE place                       │
│ • Applies RBAC visibility logic                             │
│ • Passes tab descriptors to BaseViewModal                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ BaseViewModal                                               │
│ • Renders tabs from descriptors                             │
│ • Filters based on visible(role, lifecycle)                 │
│ • Renders active tab content                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Entity Content Components (Extracted)                       │
│ • OrderDetailsContent, OrderActionsContent                  │
│ • ReportDetailsContent, ReportActionsContent                │
│ • ServiceDetailsContent, ServiceActionsContent              │
│ • NO tab management logic - pure content rendering          │
└─────────────────────────────────────────────────────────────┘
```

### 6.1: Tab Descriptor Contract

**File:** `packages/ui/src/modals/types.ts` (new)

```typescript
export interface TabDescriptor {
  id: string;
  label: string;
  visible: (context: TabVisibilityContext) => boolean;
  content: ReactNode;
}

export interface TabVisibilityContext {
  role: string;
  lifecycle: Lifecycle;
  hasActions: boolean; // For conditional Quick Actions tab
}

// Default tab order (can be overridden per entity in catalog)
export const DEFAULT_TAB_ORDER = ['details', 'history', 'actions'];
```

### 6.2: Update BaseViewModal

**Changes:**
1. Accept `tabs: TabDescriptor[]` prop
2. Accept `role: string` and `lifecycle: Lifecycle` for visibility filtering
3. Manage active tab state internally
4. Render tabs and content generically

```typescript
export interface BaseViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: ReactNode;
  tabs: TabDescriptor[];  // NEW
  role: string;            // NEW
  lifecycle?: Lifecycle;
  entityType?: string;
  entityId?: string;
}

export default function BaseViewModal({
  isOpen,
  onClose,
  card,
  tabs,
  role,
  lifecycle,
  entityType,
  entityId,
}: BaseViewModalProps) {
  // Filter tabs based on visibility
  const visibleTabs = tabs.filter(tab =>
    tab.visible({ role, lifecycle, hasActions: true })
  );

  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id || 'details');

  // Render tab buttons and active content
}
```

### 6.3: Extract Content Components

**From ActivityModal → Extract to:**
- `packages/ui/src/modals/ActivityModal/OrderDetailsContent.tsx`
- `packages/ui/src/modals/ActivityModal/OrderActionsContent.tsx`

**From ReportModal → Extract to:**
- `packages/ui/src/modals/ReportModal/ReportDetailsContent.tsx`
- `packages/ui/src/modals/ReportModal/ReportActionsContent.tsx`

**From ServiceDetailsModal → Extract to:**
- `packages/ui/src/modals/ServiceDetailsModal/ServiceDetailsContent.tsx`

**ServiceDetailsModal keeps its custom tabs** (overview, crew, products, procedures, training, notes) but adds History as a shared tab.

### 6.4: Update Adapters to Build Tab Descriptors

**File:** `apps/frontend/src/config/entityRegistry.tsx`

```typescript
// Order adapter
mapToProps: (data: any, actions: EntityAction[], onClose: () => void, lifecycle: Lifecycle, role: string) => {
  const tabs: TabDescriptor[] = [
    {
      id: 'details',
      label: 'Details',
      visible: () => true,
      content: <OrderDetailsContent order={data} />
    },
    {
      id: 'history',
      label: 'History',
      visible: () => true,
      content: <HistoryTab entityType="order" entityId={data.orderId} />
    },
    {
      id: 'actions',
      label: 'Quick Actions',
      visible: ({ hasActions, lifecycle }) =>
        hasActions && lifecycle?.state !== 'deleted', // No actions on tombstones
      content: <OrderActionsContent actions={actions} order={data} />
    }
  ];

  return {
    isOpen: !!data,
    onClose,
    card: <OrderCard {...cardProps} />,
    tabs,
    role,
    lifecycle,
    entityType: 'order',
    entityId: data?.orderId
  };
}
```

### 6.5: RBAC Visibility Examples

```typescript
// Quick Actions tab - only visible if:
// 1. There are actions available
// 2. Entity is not deleted (tombstones are read-only)
{
  id: 'actions',
  label: 'Quick Actions',
  visible: ({ hasActions, lifecycle }) =>
    hasActions && lifecycle?.state !== 'deleted'
}

// Admin-only tab example (future):
{
  id: 'audit',
  label: 'Audit Log',
  visible: ({ role }) => role === 'admin'
}

// History tab - visible to all users for all entities
{
  id: 'history',
  label: 'History',
  visible: () => true
}
```

### 6.6: Phase 6 Tasks

**Current Status:** 🚧 IN PROGRESS

- [x] Document problem and solution architecture
- [ ] Create TabDescriptor type definitions
- [ ] Update BaseViewModal to accept and render tab descriptors
- [ ] Extract OrderDetailsContent and OrderActionsContent from ActivityModal
- [ ] Extract ReportDetailsContent and ReportActionsContent from ReportModal
- [ ] Update ServiceDetailsModal to add History tab alongside custom tabs
- [ ] Update adapters in entityRegistry to build tab descriptors
- [ ] Remove old tab management code from ActivityModal
- [ ] Remove old tab management code from ReportModal
- [ ] Build UI package
- [ ] Typecheck
- [ ] Test tab visibility for different roles
- [ ] Test tombstone read-only behavior (no Quick Actions)
- [ ] Commit universal tab composition refactor

**Result:** Adding a new tab = **ONE line** in adapter config. RBAC visibility built-in. Zero per-modal duplication.

---

## Phase 7: Hub Activity Feeds with User Profile Modal Support

**Status:** 🟡 IN PROGRESS (2025-10-24)

### Problem Statement

Non-admin users (manager, contractor, customer, center, crew, warehouse) need to see their creation and assignment activities in their hub's "Recent Activity" section. When clicking these activities, profile modals should open via openById() with fresh database fetches.

**User Requirements:**
- Users should ONLY see their own creation event and their own assignment events
- Users should NOT see ecosystem user creations (e.g., crew shouldn't see "center_created")
- Clicking activities should open profile modals with Profile + History tabs
- All roles should be able to view profiles of their assigned entities

### 7.1: Backend Activity Query Fixes

**File:** `apps/backend/server/domains/scope/store.ts`

**Changes Applied:**

1. **Crew Assignment Metadata Check** (lines 1246-1247)
   - Problem: crew_assigned_to_center has target_id = center, crew ID in metadata
   - Solution: Added metadata-based filtering
   ```sql
   OR
   (activity_type = 'crew_assigned_to_center' AND metadata ? 'crewId' AND UPPER(metadata->>'crewId') = $2)
   ```

2. **Activity Dismissals Support**
   - Problem: Backend queries ignored activity_dismissals table
   - Solution: Added filter to all 6 role queries
   ```sql
   AND NOT EXISTS (
     SELECT 1 FROM activity_dismissals ad
     WHERE ad.activity_id = system_activity.activity_id AND ad.user_id = $2
   )
   ```

3. **User Creation Exclusions Maintained** (lines 1251-1255)
   - Problem: Users would see entire ecosystem's user creations
   - Solution: Keep exclusions in ecosystem clause
   - Users ONLY see their own creation (when target_id = self)
   - Users do NOT see ecosystem creations
   ```sql
   -- EXCLUDE user creations (only show self-creation above, not ecosystem creations)
   (
     activity_type NOT IN ('manager_created', 'contractor_created', 'customer_created', 'center_created', 'crew_created', 'warehouse_created')
     AND activity_type NOT LIKE '%assigned%'
     AND activity_type != 'assignment_made'
   )
   ```

### 7.2: Frontend Tab Policy Updates

**File:** `apps/frontend/src/policies/tabs.ts`

**Change:** Profile tab now visible to all roles (lines 98-106)

**Before:**
```typescript
case 'profile':
  return (
    (entityType === 'manager' || entityType === 'contractor' || ...) &&
    (role === 'admin' || role === 'manager')  // ❌ Only admin/manager
  );
```

**After:**
```typescript
case 'profile':
  return (
    entityType === 'manager' || entityType === 'contractor' || entityType === 'customer' ||
    entityType === 'crew' || entityType === 'center' || entityType === 'warehouse'
  );  // ✅ All roles
```

**Reason:** Users need to see profiles of their assignments (crew sees center, contractor sees customers, etc.)

### 7.3: Database Restoration

**Problem:** 240 user creation/assignment activities were dismissed (user clicked "Clear All")

**Solution:** Created restore script

**File:** `apps/backend/scripts/restore-user-activities.js`

**Activity Types Restored:**
- User creations: manager_created, contractor_created, customer_created, center_created, crew_created, warehouse_created
- User assignments: contractor_assigned_to_manager, customer_assigned_to_contractor, center_assigned_to_customer, crew_assigned_to_center, order_assigned_to_warehouse

### 7.4: Architecture Patterns

#### Metadata-Based Assignment Filtering

Assignment activities often have target_id pointing to parent entity, with assigned user ID in metadata:

```sql
-- Example: crew_assigned_to_center
-- target_id = CEN-010 (the center)
-- metadata->>'crewId' = CRW-006 (the crew)

-- Visibility check:
(activity_type = 'crew_assigned_to_center' AND metadata ? 'crewId' AND UPPER(metadata->>'crewId') = $2)
```

**Pattern Applies To:**
- contractor_assigned_to_manager (metadata->>'contractorId')
- customer_assigned_to_contractor (metadata->>'customerId')
- center_assigned_to_customer (metadata->>'centerId')
- order_assigned_to_warehouse (metadata->>'warehouseId')

#### OpenById Pattern with Fresh DB Fetches

**Flow:** Activity click → parseEntityId() → openById() → Fetch /api/profile/:type/:id → Pass to modal

**Files Involved:**
- `apps/frontend/src/components/ActivityFeed.tsx` (lines 168-178) - Click handler
- `apps/frontend/src/contexts/ModalProvider.tsx` (lines 91-135) - openById implementation

**Benefits:**
- No stale directory cache
- Always shows latest database state
- Works for deleted entities (tombstone fallback)

### 7.5: Phase 7 Tasks

**Status:** 🟡 IN PROGRESS

- [x] Identify why user activities not showing in hubs
- [x] Add crew assignment metadata filtering
- [x] Add activity_dismissals support to all 6 queries
- [x] Maintain user creation exclusions (only self, not ecosystem)
- [x] Update Profile tab visibility for all roles
- [x] Restore dismissed user creation/assignment activities
- [x] Test warehouse hub shows creation activity
- [x] Test crew backend query returns correct scope
- [ ] Test all 6 user hubs (manager, contractor, customer, center, crew, warehouse)
- [ ] Test all assignment activity clicks open correct profiles
- [ ] Test Profile + History tabs visible for all roles
- [ ] Verify no regressions in existing flows
- [ ] Add automated tests for hub activity feeds

### 7.6: Testing Status

**✅ Verified Working:**
- Warehouse hub shows warehouse_created activity
- Warehouse profile modal opens with Profile + History tabs
- Crew backend query returns only self-creation + assignment (not ecosystem)
- 240 activities successfully restored from dismissals

**⚠️ Limited Testing:**
User explicitly noted: "I HAVE NOT TESTED ALL POSSIBLE FLOWS TO SEE IF THE FIXES/CODE WE APPLIED MAY HAVE BROKEN ANYTHING OR HAS BUGS"

**Not Yet Tested:**
- Manager, Contractor, Customer, Center hubs
- Assignment activity clicks (contractor_assigned_to_manager, etc.)
- Profile modals opening from other user types
- Edge cases (deleted users, missing metadata, etc.)

### 7.7: Known Issues

1. **No Automated Tests** - Hub activity feed logic not covered by tests
2. **Incomplete Manual Testing** - Only 2 of 6 user hubs verified
3. **Activity Dismissal UX** - Should certain activity types be non-dismissible?

### 7.8: Next Steps

**Immediate:**
1. Systematic testing of all 6 user hubs
2. Test all assignment activity types
3. Add integration tests for activity scoping logic

**Future (User's Stated Goal):**
> "then we can move on to services and products"

- Service creation activities
- Product creation activities
- Service/product relationship activities

---

## Phase 8: Comprehensive Testing

### 8.1: Entity Catalog Tests

**File:** `apps/frontend/src/tests/entityCatalog.test.ts`

```typescript
describe('Entity Catalog', () => {
  // Test ID parsing for all entities
  const idTests = [
    { id: 'CEN-010-PO-001', type: 'order', subtype: 'product', scope: 'CEN-010' },
    { id: 'RPT-456', type: 'report' },
    { id: 'SRV-999', type: 'service' },
    { id: 'INVALID', type: 'unknown', valid: false }
  ];

  test.each(idTests)('parses $id correctly', ({ id, type, valid = true }) => {
    const result = parseEntityId(id);
    expect(result.type).toBe(type);
    expect(result.valid).toBe(valid);
  });

  // Test all entities have complete definitions
  getAllEntityTypes().forEach(type => {
    test(`${type} has complete definition`, () => {
      const def = getEntityDefinition(type);
      expect(def.displayName).toBeTruthy();
      expect(def.backendTable).toBeTruthy();
      expect(def.idPattern).toBeInstanceOf(RegExp);
    });
  });
});
```

### 6.2: Lifecycle System Tests

**Test Matrix:**

| Entity Type | Archive Banner | Delete Banner | Tombstone | History |
|-------------|----------------|---------------|-----------|---------|
| Order (Product) | ✅ Test | ✅ Test | ✅ Test | ✅ Test |
| Order (Service) | ✅ Test | ✅ Test | ✅ Test | ✅ Test |
| Report | ✅ Test | ✅ Test | ✅ Test | ✅ Test |
| Feedback | ✅ Test | ✅ Test | ✅ Test | ✅ Test |
| Service | ✅ Test | ✅ Test | ⚠️ Skip* | ⚠️ Skip* |

*Skip until SERVICE_DETAIL_FETCH enabled

### 6.3: Integration Tests

**For each entity type:**

1. **Archive Flow:**
   - Archive entity from Directory
   - Open from Archive tab → Verify ArchivedBanner shows
   - Verify reason/date/actor displayed
   - Verify modal closes after archive

2. **Restore Flow:**
   - Restore archived entity
   - Verify disappears from Archive
   - Verify reappears in Directory
   - Verify activity logged

3. **Delete Flow:**
   - Hard delete archived entity
   - Verify modal closes
   - Verify disappears from Archive
   - Verify "Permanently Deleted" activity appears
   - Click activity → Modal opens with DeletedBanner
   - Verify tombstone data shown
   - Verify no Quick Actions

4. **History Tab:**
   - Open any entity
   - Click History tab
   - Verify chronological timeline
   - Verify events: Created, Archived, Restored, Deleted

### 6.4: Phase 6 Tasks
- [ ] Write catalog unit tests
- [ ] Write lifecycle detection tests
- [ ] Test archive banner for all entity types
- [ ] Test delete banner for all entity types
- [ ] Test tombstone views for all entity types
- [ ] Test history tab for all entity types
- [ ] Test unknown entity handling
- [ ] Verify no TypeScript errors
- [ ] Verify no console errors
- [ ] Performance test (catalog lookup overhead)

---

## Acceptance Criteria

### Must Pass Before Rollout

#### ✅ Catalog Foundation
- [ ] All 11 entity types defined in catalog
- [ ] All ID patterns tested (scoped + unscoped)
- [ ] Backend catalog mirrors frontend
- [ ] Parser handles unknown IDs gracefully
- [ ] All entities have accurate capability flags

#### ✅ Lifecycle Detection
- [ ] `extractLifecycle()` works for all entity types
- [ ] Active state detected correctly
- [ ] Archived state detected correctly
- [ ] Deleted state detected correctly
- [ ] Tombstone flag set when loaded from snapshot

#### ✅ Universal Banners
- [ ] ArchivedBanner shows for ALL archived entities
- [ ] DeletedBanner shows for ALL deleted entities
- [ ] Banners display correct metadata (reason, date, actor)
- [ ] Banners positioned consistently
- [ ] No duplicate banner code in individual modals

#### ✅ Tombstone Views
- [ ] Deleted orders open from activity feed
- [ ] Deleted reports open from activity feed
- [ ] DeletedBanner shows with tombstone message
- [ ] No Quick Actions tab (read-only)
- [ ] Graceful handling if snapshot missing

#### ✅ History Tab
- [ ] History tab appears in all modals (when supported)
- [ ] Events shown chronologically
- [ ] Created/Archived/Restored/Deleted events visible
- [ ] Metadata (reason, actor) displayed
- [ ] Tab order consistent per entity type

#### ✅ Testing
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No TypeScript errors
- [ ] No console warnings/errors
- [ ] Archive → Restore → Delete flow works for all types

---

## Rollout Strategy

### Week 1: Catalog Foundation
- Implement Phase 0
- Test thoroughly
- Verify no regressions in existing functionality

### Week 2: Backend + Frontend Lifecycle
- Implement Phases 1-2
- Test lifecycle detection for orders/reports
- Verify archive/restore/delete still work

### Week 3: Banners + Tombstones
- Implement Phases 3-4
- Test banners for all entity types
- Test tombstone views

### Week 4: History + Testing
- Implement Phases 5-6
- Comprehensive testing
- Fix bugs
- Performance optimization

### Week 5: Documentation + Rollout
- Update developer docs
- Create runbook for adding new entities
- Enable in production
- Monitor for issues

---

## Success Metrics

**Before Implementation:**
- Banners only on orders (1 entity type)
- Deleted items can't be opened (0% coverage)
- No history timeline (0 entity types)
- Adding new entity = 8+ file changes

**After Implementation:**
- Banners on ALL entity types (11 entity types)
- Deleted items open as tombstones (100% coverage)
- History timeline on all entities (11 entity types)
- Adding new entity = 1 catalog entry

**Code Reduction:**
- Remove ~200 lines of duplicate banner code
- Remove ~150 lines of duplicate lifecycle detection
- Consolidate ID parsing into catalog-driven system

**Developer Experience:**
- Single source of truth for all entity metadata
- Consistent patterns across all entity types
- Self-documenting (catalog is the documentation)
- Type-safe (TypeScript catches missing definitions)

---

## Future Enhancements

### Post-MVP
1. **Entity Relationships in History**
   - Show transformed entities (order → service)
   - Show related entities in timeline

2. **Advanced Filtering**
   - Filter history by event type
   - Filter history by date range
   - Filter history by actor

3. **Audit Trail Export**
   - Export history as CSV/JSON
   - Compliance reporting

4. **Real-time Updates**
   - WebSocket updates for activity feed
   - Live history updates when other users make changes

5. **Undo/Redo Support**
   - Undo archive → auto-restore
   - Snapshot comparison view

---

## Notes for Implementation

### Critical Success Factors
1. **Catalog First** - Don't proceed to Phase 1 until Phase 0 is complete and tested
2. **Backend Mirror** - Keep frontend/backend catalogs synchronized
3. **Capability Flags** - Respect `supportsDetailFetch`, `supportsHistory`, etc.
4. **Graceful Degradation** - Unknown entities should not crash the app
5. **Testing Coverage** - Test ALL entity types, not just orders

### Common Pitfalls to Avoid
1. Don't hardcode entity names anywhere
2. Don't skip capability checks
3. Don't forget to update both catalog files
4. Don't assume all entities support all capabilities
5. Don't break existing functionality during migration

### Code Review Checklist
- [ ] Catalog entries complete for all types
- [ ] ID patterns anchored and case-insensitive
- [ ] Activity types match backend exactly
- [ ] Capability flags accurate
- [ ] Helper functions handle edge cases
- [ ] Tests cover all entity types
- [ ] No hardcoded entity names
- [ ] No duplicate logic
- [ ] TypeScript types consistent
- [ ] Documentation updated

---

**Document Version:** 1.1
**Last Updated:** 2025-10-24
**Status:** Phase 7 In Progress
**Estimated Effort:** 4-5 weeks
**Risk Level:** Medium (well-scoped, incremental phases)

---

## Recent Updates

### 2025-10-24: Phase 7 - Hub Activity Feeds
- Added Phase 7 documentation for Hub Activity Feeds with User Profile Modal Support
- Backend: Fixed crew assignment visibility, added activity dismissals support
- Frontend: Updated Profile tab policy for all roles
- Database: Restored 240 dismissed user activities
- Status: In progress - partial testing complete, comprehensive testing needed
- See: `docs/sessions/SESSION WITH-CLAUDE-2025-10-24.md` for full details
