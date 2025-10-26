# Universal Modal System - Complete Migration Plan

**Date:** 2025-10-25
**Status:** 🔍 Research Complete - Awaiting Approval
**Goal:** Migrate ALL entity types to use the simple, consistent `openById()` pattern

---

## Executive Summary

After comprehensive research, I've identified the **simple, proven pattern** used for users and mapped ALL entity types in the system. This document outlines a straightforward migration plan to make EVERY entity type work the same way.

**The Simple Pattern:**
1. User clicks an ID anywhere (Directory, Activity Feed, Catalog, etc.)
2. Call `modals.openById(id)` - ONE LINE
3. ModalProvider fetches data automatically
4. EntityModalView renders with entity adapter
5. Activities are clickable via the same `openById()` call

---

## The Proven User Pattern (Our Template)

### How It Works (Users: Manager, Contractor, Customer, Center, Crew, Warehouse)

**Frontend Click:**
```typescript
// Anywhere in the app
modals.openById('MGR-005')
```

**ModalProvider.openById (apps/frontend/src/contexts/ModalProvider.tsx:92-125):**
```typescript
if (type === 'user' && subtype) {
  // Fetch fresh from database
  entityType = subtype as EntityType;  // 'manager'

  const response = await apiFetch(`/profile/${entityType}/${id}`);

  // Pass data via options
  enrichedOptions = {
    ...options,
    data: response.data,
    state: response.state,
    deletedAt: response.deletedAt,
    deletedBy: response.deletedBy,
    archivedAt: response.archivedAt,
    archivedBy: response.archivedBy,
  };
}

// Open modal with pre-loaded data
openEntityModal(entityType, id, enrichedOptions);
```

**Backend Endpoint:**
- `GET /api/profile/manager/MGR-005`
- Returns: Full user data + lifecycle state (active/archived/deleted)

**ModalGateway:**
- Uses `options.data` directly (NO hook needed)
- Renders EntityModalView immediately with user adapter

**Result:** ✅ Clean, fast, consistent pattern

---

## Current System Status

### ✅ FULLY WORKING (7 entity types)

| Entity Type | openById | Backend Endpoint | Activity Clicks | Adapter | Status |
|-------------|----------|------------------|-----------------|---------|--------|
| Manager | ✅ | `/profile/manager/:id` | ✅ | ✅ | **DONE** |
| Contractor | ✅ | `/profile/contractor/:id` | ✅ | ✅ | **DONE** |
| Customer | ✅ | `/profile/customer/:id` | ✅ | ✅ | **DONE** |
| Center | ✅ | `/profile/center/:id` | ✅ | ✅ | **DONE** |
| Crew | ✅ | `/profile/crew/:id` | ✅ | ✅ | **DONE** |
| Warehouse | ✅ | `/profile/warehouse/:id` | ✅ | ✅ | **DONE** |
| Order | ✅ | `/order/:id/details` | ✅ (gated) | ✅ | **DONE** |
| Report | ✅ (gated) | `/reports/:id/details` | ✅ (gated) | ✅ | **DONE** |
| Feedback | ✅ (gated) | `/reports/:id/details` | ✅ (gated) | ✅ | **DONE** |

**Pattern Used:** ModalProvider fetches → passes via options.data → ModalGateway uses directly

---

### 🚧 PARTIALLY WORKING (2 entity types)

| Entity Type | openById | Backend Endpoint | Activity Clicks | Adapter | Issue |
|-------------|----------|------------------|-----------------|---------|-------|
| Service (active) | ✅ | `/services/:id/details` ✅ | ⚠️ Gated (flag off) | ✅ | Activities disabled |
| CatalogService | ❌ BROKEN | `/catalog/services/:id/details` ✅ | ❌ Not implemented | ⚠️ Incomplete | **CURRENT ISSUE** |

**CatalogService Problem:**
- Backend endpoint EXISTS and works
- BUT: ModalProvider doesn't fetch (no special case like users)
- AND: ModalGateway uses hook instead of pre-loaded data
- RESULT: Hook receives `serviceId: null` → empty modal

**Fix Needed:** Add catalogService case to ModalProvider.openById (match user pattern)

---

### ❌ NOT IMPLEMENTED (2 entity types)

| Entity Type | openById | Backend Endpoint | Activity Clicks | Adapter | Issue |
|-------------|----------|------------------|-----------------|---------|-------|
| Product | ❌ | ❌ **MISSING** | ❌ | ❌ | No detail endpoint exists |
| Training | ❌ | ❌ **MISSING** | ❌ | ❌ | No domain/endpoint |
| Procedure | ❌ | ❌ **MISSING** | ❌ | ❌ | No domain/endpoint |

**Note:** These need backend endpoints created first

---

## Migration Plan - The Simple Way

### Pattern to Follow (Copy from Users)

**For EVERY entity type:**

#### 1. ModalProvider.openById - Add Fetch Case

**Location:** `apps/frontend/src/contexts/ModalProvider.tsx:92-128`

**Template:**
```typescript
if (type === 'YOUR_TYPE_HERE') {
  // Fetch from backend
  const response = await apiFetch(`/YOUR_ENDPOINT_HERE/${id}`);

  // Pass data via options
  enrichedOptions = {
    ...options,
    data: response.data,
    state: response.state || 'active',
    deletedAt: response.deletedAt,
    deletedBy: response.deletedBy,
    archivedAt: response.archivedAt,
    archivedBy: response.archivedBy,
  };

  entityType = 'YOUR_ENTITY_TYPE' as EntityType;
}
```

#### 2. ModalGateway - Use Pre-loaded Data

**Location:** `apps/frontend/src/components/ModalGateway.tsx:167-206`

**Pattern:**
```typescript
// NO HOOK - use options.data directly
const detailsMap = {
  yourEntityType: {
    data: options?.data || null,  // Use pre-loaded data
    isLoading: false,
    error: null,
    lifecycle: extractLifecycle(options?.data, null),
  },
};
```

#### 3. Activity Integration

**Location:** `apps/frontend/src/components/ActivityFeed.tsx`

**Pattern:**
```typescript
if (targetType === 'yourEntityType') {
  modals.openById(targetId);  // That's it!
  return;
}
```

---

## Entity-by-Entity Migration Checklist

### 🔧 PRIORITY 1: Fix Broken CatalogService

**Entity:** CatalogService (SRV-001, SRV-123)

**Backend:** ✅ `/api/catalog/services/:serviceId/details` EXISTS

**Steps:**
1. ✅ Backend endpoint - DONE
2. ✅ parseEntityId detects 'catalogService' - DONE
3. ❌ **TODO:** Add catalogService case to ModalProvider.openById (lines 92-128)
4. ❌ **TODO:** Remove useCatalogServiceDetails hook from ModalGateway
5. ❌ **TODO:** Use options.data in detailsMap (line 153-158)
6. ❌ **TODO:** Enable activity clicks in ActivityFeed (currently not implemented)
7. ✅ Entity adapter - EXISTS but may need header/tabs fixes

**Estimated Time:** 30 minutes

---

### 🔧 PRIORITY 2: Active Services

**Entity:** Service (CEN-010-SRV-001)

**Backend:** ✅ `/api/services/:serviceId/details` EXISTS

**Steps:**
1. ✅ Backend endpoint - DONE
2. ✅ parseEntityId detects 'service' - DONE
3. ❌ **TODO:** Add service case to ModalProvider.openById
4. ❌ **TODO:** Remove useServiceDetails hook from ModalGateway
5. ❌ **TODO:** Use options.data in detailsMap
6. ⚠️ **TODO:** Enable activity clicks (currently gated by SERVICE_DETAIL_FETCH flag)
7. ✅ Entity adapter - DONE

**Estimated Time:** 30 minutes

---

### 🔧 PRIORITY 3: Products (Needs Backend First)

**Entity:** Product (PRD-123)

**Backend:** ❌ NO DETAIL ENDPOINT

**Steps:**
1. ❌ **TODO:** Create `/api/catalog/products/:productId/details` endpoint
2. ❌ **TODO:** Add 'product' to parseEntityId
3. ❌ **TODO:** Add product case to ModalProvider.openById
4. ❌ **TODO:** Create product entity adapter
5. ❌ **TODO:** Enable activity clicks
6. ❌ **TODO:** Replace CatalogProductModal usage in AdminHub + CKSCatalog

**Estimated Time:** 2 hours (backend + frontend)

---

### 🔧 PRIORITY 4: Training & Procedures (Future)

**Entities:** Training (TRN-XXX), Procedure (PRC-XXX)

**Backend:** ❌ NO ENDPOINTS OR DOMAIN

**Steps:**
1. ❌ **TODO:** Create domain folders + endpoints
2. ❌ **TODO:** Add to parseEntityId
3. ❌ **TODO:** Add cases to ModalProvider.openById
4. ❌ **TODO:** Create entity adapters
5. ❌ **TODO:** Enable activity clicks

**Estimated Time:** 4 hours each

---

## Code Locations Reference

### Files to Modify (Same for Every Entity)

**1. ID Parsing**
- File: `apps/frontend/src/shared/utils/parseEntityId.ts`
- Add pattern detection (if not already present)

**2. Type Definitions**
- File: `apps/frontend/src/types/entities.ts`
- Add to EntityType union (if not already present)

**3. Modal Provider (THE KEY FILE)**
- File: `apps/frontend/src/contexts/ModalProvider.tsx`
- Lines 92-128: Add fetch case (COPY user pattern)

**4. Modal Gateway**
- File: `apps/frontend/src/components/ModalGateway.tsx`
- Lines 153-206: Use options.data instead of hooks

**5. Entity Registry**
- File: `apps/frontend/src/config/entityRegistry.tsx`
- Create adapter with getHeaderConfig + getDetailsSections + getTabDescriptors

**6. Activity Feed**
- File: `apps/frontend/src/components/ActivityFeed.tsx`
- Add case to handleActivityClick (one line: `modals.openById(targetId)`)

---

## Anti-Patterns to Avoid

### ❌ DON'T DO THIS (What We Did Wrong with CatalogService):

```typescript
// ModalProvider.openById - NO FETCH
// Skipped the fetch, left it to ModalGateway

// ModalGateway - HOOK-BASED FETCH
const catalogServiceDetails = useCatalogServiceDetails({
  serviceId: entityType === 'catalogService' ? entityId : null
});
```

**Why It's Bad:**
- Two different patterns (users vs other entities)
- Hooks complicate ModalGateway
- Breaks when entityType doesn't match
- Not modular/consistent

### ✅ DO THIS (User Pattern):

```typescript
// ModalProvider.openById - FETCH HERE
if (type === 'catalogService') {
  const response = await apiFetch(`/catalog/services/${id}/details`);
  enrichedOptions = { ...options, data: response.data, state: 'active' };
  entityType = 'catalogService';
}

// ModalGateway - USE PRE-LOADED DATA
const detailsMap = {
  catalogService: {
    data: options?.data || null,
    isLoading: false,
    error: null,
    lifecycle: { state: 'active' },
  },
};
```

**Why It's Good:**
- ONE pattern for all entities
- ModalGateway stays simple (no hooks per entity)
- Works the same everywhere
- Easy to add new entities (copy-paste)

---

## Testing Checklist (Per Entity)

After migrating each entity, test:

- [ ] **Directory Click:** Click entity in Admin Directory → modal opens
- [ ] **Activity Click:** Click activity in Recent Activity → modal opens
- [ ] **Direct Call:** `modals.openById('ID')` → modal opens
- [ ] **Catalog Click** (if applicable): Click in CKS Catalog → modal opens
- [ ] **Hub Click** (if applicable): Click in role hub → modal opens
- [ ] **Data Loads:** All fields populated correctly
- [ ] **Admin View:** Admin sees admin-only tabs/actions
- [ ] **User View:** Non-admin sees appropriate tabs
- [ ] **Lifecycle States:** Archived/deleted entities show banners
- [ ] **Console:** No errors, clean logs

---

## Success Metrics

### When Migration is Complete:

✅ **All entity types open via `modals.openById(id)`**
✅ **All activity clicks work (no "not implemented" errors)**
✅ **No hook-based fetching in ModalGateway** (except orders/reports if needed)
✅ **Consistent pattern across entire codebase**
✅ **Legacy modals deprecated/removed:**
   - CatalogServiceModal
   - CatalogProductModal
   - ServiceViewModal
   - ServiceOrderModal
   - ProductOrderModal
   - OrderActionModal (replaced by action descriptors)
   - OrderDetailsModal (replaced by EntityModalView)

✅ **One central modal system for everything**

---

## Rollout Strategy

### Phase 1: Fix Broken (Immediate)
1. CatalogService - Fix empty modal issue
2. Active Services - Complete migration

**Timeline:** Today (1 hour)

### Phase 2: Complete Existing (Short-term)
1. Products - Create backend endpoint + adapter
2. Enable all activity clicks
3. Remove legacy modal dependencies

**Timeline:** This Week (1 day)

### Phase 3: New Entities (Long-term)
1. Training - Create domain + endpoint + adapter
2. Procedures - Create domain + endpoint + adapter
3. Any future entity types

**Timeline:** As Needed

---

## Migration Template (Copy-Paste)

### For Any New Entity Type:

**1. Backend Endpoint** (`apps/backend/server/domains/DOMAIN/routes.fastify.ts`):
```typescript
server.get('/api/DOMAIN/:entityId/details', async (request, reply) => {
  const user = await requireActiveRole(request, reply, {});
  if (!user) return;

  const { entityId } = request.params;
  const result = await query('SELECT * FROM table WHERE id = $1', [entityId]);

  return reply.send({
    data: normalize(result.rows[0]),
    state: 'active'  // or derive from data
  });
});
```

**2. ModalProvider Case** (`apps/frontend/src/contexts/ModalProvider.tsx`):
```typescript
if (type === 'ENTITY_TYPE') {
  const response = await apiFetch(`/DOMAIN/${id}/details`);
  enrichedOptions = { ...options, data: response.data, state: response.state || 'active' };
  entityType = 'ENTITY_TYPE' as EntityType;
}
```

**3. Entity Adapter** (`apps/frontend/src/config/entityRegistry.tsx`):
```typescript
const entityAdapter: EntityAdapter = {
  getActionDescriptors: (context) => {
    if (context.role === 'admin') {
      return [{ key: 'edit', label: 'Edit', variant: 'secondary' }];
    }
    return [];
  },

  getHeaderConfig: (context) => ({
    id: context.entityData?.id || '',
    type: 'Entity Type',
    status: context.entityData?.status || 'active',
    fields: [
      { label: 'Name', value: context.entityData?.name || '—' },
    ],
  }),

  getDetailsSections: (context) => [
    {
      id: 'info',
      type: 'key-value-grid',
      title: 'Information',
      columns: 2,
      fields: [
        { label: 'ID', value: context.entityData?.id || '-' },
        { label: 'Name', value: context.entityData?.name || '-' },
      ],
    },
  ],

  getTabDescriptors: (context, actions) => [
    {
      id: 'details',
      label: 'Details',
      content: <DetailsComposer sections={buildDetailsSections(context)} />
    },
  ],
};
```

**4. Activity Integration** (`apps/frontend/src/components/ActivityFeed.tsx`):
```typescript
if (targetType === 'ENTITY_TYPE') {
  modals.openById(targetId);
  return;
}
```

---

## Questions for User

Before proceeding with implementation:

1. **Priority Order:** Should we fix CatalogService first, then Service, then Products? Or different order?

2. **Products Backend:** Should we create the `/api/catalog/products/:id/details` endpoint as part of this migration?

3. **Training/Procedures:** Should these wait, or include in current scope?

4. **Legacy Modal Cleanup:** After migration, should we remove old modal files or keep for now?

5. **Feature Flags:** Should we use feature flags for rollout, or migrate directly?

---

## Next Steps

**Awaiting your approval to proceed with:**

1. Fix CatalogService (the broken one from screenshot)
2. Complete Active Services migration
3. Products backend + frontend (if approved)
4. Activity integration for all
5. Legacy modal cleanup

**Estimated Total Time:** 1-2 days for Priority 1 & 2, additional days for Priority 3 & 4

---

**Document Status:** ✅ Research Complete | ⏸️ Awaiting Approval
