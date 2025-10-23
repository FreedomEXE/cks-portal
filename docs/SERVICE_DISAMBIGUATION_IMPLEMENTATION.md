# Service Disambiguation Implementation

## Status: Ready to Implement (Next Session)

**Context:** Phase 0 entity catalog is complete. One critical fix applied: `parseEntityId.ts` now checks for `PRD-` instead of `PROD-` (committed).

**This document:** Detailed spec for distinguishing active service instances from catalog service definitions.

---

## Problem Statement

Currently, the system has TWO types of services but treats them identically:

1. **Active Service Instances** (scoped IDs like `CEN-010-SRV-001`)
   - Created from service orders (SO) via transformation
   - Stored in `services` table
   - Have lifecycle (start, complete, cancel)
   - Show in "My Services / Active Services" for participants
   - Managed by crews, have notes, procedures, training

2. **Catalog Service Definitions** (unscoped IDs like `SRV-001`)
   - Templates/definitions in `catalog_services` table
   - Used when creating service orders
   - No lifecycle actions
   - View-only in catalog pages

**Issue:** The entity catalog currently treats all `SRV-###` IDs as a single entity type. We need to disambiguate at parse time.

---

## Research Findings

### Active Services Pipeline

**Location:** `apps/frontend/src/hubs/ManagerHub.tsx` lines 731-800

**How it works:**
1. Manager accepts service order → order gets `create_service` action (via `useEntityActions.ts` line 236-239)
2. Backend creates service instance with scoped ID (e.g., `CEN-010-SRV-001`)
3. Order is archived, `transformed_id` field stores the new service ID
4. Order metadata gets `serviceStatus: 'created'`
5. Service appears in "Active Services" tab for manager/crew/participants

**Data flow:**
```typescript
// ManagerHub.tsx line 731-748
const activeServicesData = useMemo(
  () =>
    managerServiceOrders
      .filter((order) => {
        // Only include transformed services
        if (!(order as any).serviceId && !(order as any).transformedId) {
          return false;
        }
        const meta: any = (order as any).metadata || {};
        const svcStatus = (meta?.serviceStatus || '').toLowerCase().replace(/\s+/g, '_');
        // Active = created or in_progress
        return svcStatus === 'created' || svcStatus === 'in_progress';
      })
  // ...
)
```

**Service actions:** Start, Complete, Cancel (via `apps/backend/server/domains/services/service.ts`)

### Catalog Services

**Location:** `apps/backend/server/domains/directory/store.ts` line 510-513

**Table:** `catalog_services` (separate from `services`)

**Usage:** Referenced when creating service orders, displayed in catalog views

**Modal:** `packages/ui/src/modals/CatalogServiceModal/CatalogServiceModal.tsx` (view-only)

### ID Format in Database

**services table (active instances):**
- `service_id` column stores full scoped ID: `CEN-010-SRV-001`
- Created via order transformation
- Has `status`, `actual_start_time`, `actual_end_time`, `managed_by`, etc.

**catalog_services table (definitions):**
- `service_id` column stores unscoped ID: `SRV-001`
- No lifecycle fields
- Has `service_name`, `category`, `description`, `pricing_model`, etc.

---

## Implementation Plan

### Step 1: Update Frontend Entity Catalog

**File:** `apps/frontend/src/shared/constants/entityCatalog.ts`

**Changes:**

1. **Update `service` entity** to accept both scoped and unscoped:
```typescript
service: {
  type: 'service',
  displayName: 'Service',
  displayNamePlural: 'Services',
  idToken: 'SRV',
  // Pattern: Accepts both scoped (CEN-010-SRV-001) and unscoped (SRV-123)
  idPattern: /^(?:[A-Z]{3}-\d{3}-)?SRV-\d+$/i,
  backendTable: 'services',
  backendIdColumn: 'service_id',
  detailsEndpoint: (id) => `/api/services/${id}/details`,
  supportsDetailFetch: false,  // Still gated by SERVICE_DETAIL_FETCH flag
  supportsArchive: true,
  supportsDelete: true,
  supportsRestore: true,
  supportsHistory: true,
  supportsTombstone: false,
  modalComponent: 'ServiceDetailsModal',
  defaultTabOrder: ['details', 'history', 'actions'],
  activityTypes: {
    created: 'service_created',
    archived: 'service_archived',
    restored: 'service_restored',
    deleted: 'service_hard_deleted'
  }
},
```

2. **Add new `catalogService` entity:**
```typescript
catalogService: {
  type: 'catalogService',
  displayName: 'Service Definition',
  displayNamePlural: 'Service Definitions',
  idToken: 'SRV',
  // Pattern: Only unscoped SRV-### (catalog definitions)
  idPattern: /^SRV-\d+$/i,
  backendTable: 'catalog_services',
  backendIdColumn: 'service_id',
  detailsEndpoint: undefined,  // Catalog services have no detail endpoint
  supportsDetailFetch: false,
  supportsArchive: false,  // Catalog definitions not archived
  supportsDelete: false,
  supportsRestore: false,
  supportsHistory: false,
  supportsTombstone: false,
  modalComponent: 'CatalogServiceModal',
  defaultTabOrder: ['details'],
  activityTypes: {
    created: 'catalog_service_created',
    archived: 'catalog_service_archived',
    restored: 'catalog_service_restored',
    deleted: 'catalog_service_deleted'
  }
},
```

**Total entities:** 13 (was 12, added catalogService)

### Step 2: Update Backend Entity Catalog

**File:** `apps/backend/server/shared/entityCatalog.ts`

Apply the same changes as frontend (service + catalogService entities).

**Note:** Mirror the frontend exactly, excluding UI-specific fields (`detailsEndpoint`, `modalComponent`, `defaultTabOrder`).

### Step 3: Update Entity Catalog Documentation

**File:** `docs/ENTITY_CATALOG.md`

Add to supported entities table:

| Entity Type | ID Pattern | Table | Supports |
|-------------|------------|-------|----------|
| **service** (active) | `CEN-010-SRV-001`, `SRV-123` | `services` | Archive, Delete, Restore, History *(Details/Tombstone pending)* |
| **catalogService** | `SRV-001` (unscoped only) | `catalog_services` | None (view-only) |

Add ID pattern example:
```typescript
// Service: Scoped = active instance, unscoped = context-dependent
idPattern: /^(?:[A-Z]{3}-\d{3}-)?SRV-\d+$/i

Matches:
✅ CEN-010-SRV-001 (active instance)
✅ SRV-123 (catalog or active - parser determines)
❌ SERVICE-123 (wrong token)
```

### Step 4: Update getEntityByIdPattern Logic

**File:** `apps/frontend/src/shared/constants/entityCatalog.ts` (and backend twin)

**Problem:** Both `service` and `catalogService` patterns will match `SRV-123`. Need priority logic.

**Solution:** Update `getEntityByIdPattern()` to check for scope prefix:

```typescript
export function getEntityByIdPattern(id: string): EntityDefinition {
  // Special case: SRV token needs disambiguation
  if (id.toUpperCase().includes('SRV-')) {
    // Check if scoped (has prefix like CEN-010-)
    const hasScope = /^[A-Z]{3}-\d{3}-/.test(id);

    if (hasScope) {
      // Scoped = active service instance
      return ENTITY_CATALOG.service;
    } else {
      // Unscoped = catalog service definition
      // NOTE: In practice, unscoped SRV IDs in active contexts (like activity feed)
      // are legacy active services. Parser should default to 'service' for safety.
      return ENTITY_CATALOG.service;  // Default to active for backwards compat
    }
  }

  // Try each pattern (excluding unknown and catalogService - handled above)
  const match = Object.values(ENTITY_CATALOG)
    .filter(def => def.type !== 'unknown' && def.type !== 'catalogService')
    .find(def => def.idPattern.test(id));

  if (!match) {
    console.warn(`[EntityCatalog] Unknown ID pattern: "${id}"`);
  }

  return match || ENTITY_CATALOG.unknown;
}
```

**Alternative approach (explicit catalog detection):**
If you want strict separation, check calling context:
- Catalog pages → use `ENTITY_CATALOG.catalogService` explicitly
- Activity feed, hubs, modals → use `getEntityByIdPattern()` (defaults to `service`)

### Step 5: Update ModalGateway Routing

**File:** `apps/frontend/src/components/ModalGateway.tsx` (or wherever modal routing happens)

**Current behavior:** All services route to `ServiceDetailsModal`

**New behavior:**
```typescript
// In modal routing logic
const entityDef = getEntityByIdPattern(entityId);

if (entityDef.type === 'service') {
  return <ServiceDetailsModal serviceId={entityId} {...props} />;
}

if (entityDef.type === 'catalogService') {
  return <CatalogServiceModal serviceId={entityId} {...props} />;
}
```

**Safety:** Since `getEntityByIdPattern()` defaults unscoped SRV to `service`, no existing behavior breaks. Catalog pages can explicitly pass `type: 'catalogService'` if needed.

### Step 6: Verify Transformation Flow Preserved

**No changes needed** - order transformation logic is in `useEntityActions.ts` and backend `services/service.ts`. It already creates scoped IDs correctly.

**Acceptance test:**
1. Create service order (SO)
2. Manager accepts → `create_service` action
3. Service created with scoped ID (e.g., `CEN-010-SRV-001`)
4. Order archived, `transformed_id` set
5. Service appears in "Active Services" tab
6. Opening service shows `ServiceDetailsModal` with actions

---

## Test Setup (Unblock Pre-Push)

**Problem:** `App.test.tsx` failures blocking git push
1. `useLoading must be used within LoadingProvider`
2. Missing polyfills (fetch, sessionStorage)
3. Feature flag divergence

### Quick Fixes

**File:** `apps/frontend/src/tests/setup.ts` (create if doesn't exist)

```typescript
import { vi } from 'vitest';

// Polyfill fetch
if (!global.fetch) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({}),
      text: async () => '',
      blob: async () => new Blob(),
    } as Response)
  );
}

// Polyfill sessionStorage
if (!global.sessionStorage) {
  const storage = new Map<string, string>();
  global.sessionStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    key: (index: number) => Array.from(storage.keys())[index] ?? null,
    get length() { return storage.size; }
  };
}

// Mock LoadingService
vi.mock('../services/LoadingService', () => ({
  LoadingService: {
    show: vi.fn(),
    hide: vi.fn(),
    isLoading: vi.fn(() => false)
  }
}));

// Disable feature flags in tests (or set stable path)
process.env.ID_FIRST_MODALS = 'false';
process.env.SERVICE_DETAIL_FETCH = 'false';
```

**Import in:** `apps/frontend/vite.config.ts`

```typescript
export default defineConfig({
  test: {
    setupFiles: ['./src/tests/setup.ts'],
    // ... rest of config
  }
})
```

**Alternative:** Fix the specific test failures by wrapping components with proper providers.

---

## Rollout Checklist

- [ ] Update frontend entity catalog (service + catalogService)
- [ ] Update backend entity catalog (mirror)
- [ ] Update `getEntityByIdPattern()` with disambiguation logic
- [ ] Update documentation with new entity type
- [ ] Update ModalGateway routing (if needed - default behavior may be sufficient)
- [ ] Create test setup file with polyfills
- [ ] Run `pnpm typecheck:frontend` - should pass
- [ ] Run `pnpm test:frontend` - should pass with setup
- [ ] Test transformation flow: SO → active service → modal opens
- [ ] Test catalog view: unscoped SRV → CatalogServiceModal
- [ ] Commit and push

---

## Notes

- **Backward compatibility:** Parser defaults unscoped `SRV-###` to `service` type for safety
- **Explicit routing:** Catalog pages can explicitly specify `type: 'catalogService'` when needed
- **No data migration:** Active services already have scoped IDs in database
- **Transformation preserved:** Order → service flow requires no changes
- **manage-crew UI:** Known regression in ServiceDetailsModal - out of scope for this pass

---

## Files Changed Summary

### Must Change
1. `apps/frontend/src/shared/constants/entityCatalog.ts` - Add catalogService, update service pattern
2. `apps/backend/server/shared/entityCatalog.ts` - Mirror frontend changes
3. `apps/frontend/src/shared/utils/parseEntityId.ts` - ✅ ALREADY FIXED (PRD)
4. `docs/ENTITY_CATALOG.md` - Document new entity type

### Should Change
5. `apps/frontend/src/tests/setup.ts` - Create polyfills for tests
6. `apps/frontend/vite.config.ts` - Reference setup file

### Optional
7. Modal routing (if explicit catalogService handling needed)
8. Catalog pages (if explicit type passing needed)

---

**Status:** Specification complete. Ready for implementation in next session.

**Estimated effort:** 30-45 minutes (catalog updates + test setup)

**Blocker removed:** `parseEntityId.ts` PRD fix committed ✅
