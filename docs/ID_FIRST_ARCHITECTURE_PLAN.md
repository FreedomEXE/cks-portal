# ID-First Modal Architecture - Migration Plan

## Executive Summary

**Goal**: Complete the transformation to a fully ID-first modal architecture where any entity can be opened from anywhere using only its ID.

### Current Status Snapshot (updated)
- Reports/Feedback: COMPLETE (ID-first; on‑demand details)
- Orders: COMPLETE (ID-first; on‑demand details; provider decoupled)
- Services: FRONTEND DONE (new on‑demand hook); BACKEND ENDPOINT `/services/:serviceId/details` PENDING
- Phase 2 (call sites): ActivityFeed and AdminHub migrated behind `ID_FIRST_MODALS`; legacy fallbacks remain only for safety and will be removed after bake
- Phase 4 (props cleanup): COMPLETE — `ordersData` removed from provider/gateway

**Benefits**:
- Zero props passed through ModalProvider (fully modular)
- All modals work identically from Activity Feed, Directory, Archive, Search
- Consistent session-based auth pattern across all entities
- No more null data issues from timing/loading
- Adding new entity types becomes trivial (5 simple steps)

**Status**:
- ✅ Reports/Feedback: Complete (working with on-demand fetching)
- ✅ Orders: 80% complete (has detail hook, but still passes unused `ordersData` prop)
- ❌ Services: Needs conversion (still depends on preloaded `ordersData`)

---

## Core Philosophy: The Three Pillars

Every modal interaction is driven by three questions:

### 1. **What am I?** (Identity)
- **Solved by**: Entity ID parsing
- **File**: `apps/frontend/src/shared/utils/parseEntityId.ts`
- **How it works**: ID encodes type and scope
  - `CON-010-FBK-001` → `{ type: 'report', subtype: 'feedback', scope: 'CON-010' }`
  - `CEN-010-RPT-017` → `{ type: 'report', subtype: 'report', scope: 'CEN-010' }`
  - `MGR-005-SO-023` → `{ type: 'order', subtype: 'service', scope: 'MGR-005' }`

### 2. **What can I do?** (Capabilities)
- **Solved by**: Role-based permissions + entity state
- **File**: `apps/frontend/src/policies/permissions.ts`
- **How it works**: `can(entityType, action, role, { state, entityData })`
  - Centralized RBAC for all entity types
  - Admin: archive/restore/delete based on state
  - Users: workflow actions (acknowledge, resolve, accept, etc.)

### 3. **What do I look like?** (Presentation)
- **Solved by**: Reusable UI components + entity adapters
- **Files**:
  - `packages/ui/src/modals/BaseViewModal` - Universal modal shell
  - `apps/frontend/src/config/entityRegistry.tsx` - Maps types to components
- **How it works**: Entity adapters define tabs, quick actions, detail views

---

## Architecture Components

### 1. ID Parser (Already Exists)
**File**: `apps/frontend/src/shared/utils/parseEntityId.ts`

**Current capabilities**:
- Detects entity type and subtype from ID format
- Returns helpers: `getEntityTypeName()`, `supportsActions()`

**Missing**:
- Scope extraction (e.g., extract `CON-010` from `CON-010-FBK-001`)
- Validation utilities (`isValidId()`)

### 2. Modal Provider (Needs Enhancement)
**File**: `apps/frontend/src/contexts/ModalProvider.tsx`

**Current API**:
```tsx
modals.openEntityModal(type, id)     // Internal, takes explicit type
modals.openReportModal(id, 'report') // Wrapper, still needs type
modals.openOrderModal(id)            // Wrapper, still needs type
```

**Target API** (add one method):
```tsx
modals.openById(id)  // Parse ID → determine type → delegate to openEntityModal
```

### 3. Modal Gateway (Already Exists)
**File**: `apps/frontend/src/components/ModalGateway.tsx`

**What it does**:
- Universal orchestrator for all entity modals
- Calls detail hooks at top level (React rules)
- Detects entity state (active/archived/deleted)
- Binds actions from registry to handlers
- Renders correct modal component

**Works with**: Order, Report, Feedback, Service

### 4. Entity Registry (Already Exists)
**File**: `apps/frontend/src/config/entityRegistry.tsx`

**What it contains**:
- Action descriptors (pure, no hooks)
- Component mapping (which modal to render)
- Prop mapping (transform data for modal props)

**Current entities**: order, report, feedback, service

### 5. Permission System (Already Exists)
**File**: `apps/frontend/src/policies/permissions.ts`

**What it provides**:
- Centralized `can(entityType, action, role, context)` function
- Entity-specific permission logic
- Keeps "who can do what" out of components

### 6. Detail Hooks (Partially Complete)

| Entity | Hook | Status | Fetching Method |
|--------|------|--------|----------------|
| Orders | `useOrderDetails` | ✅ Complete | On-demand, session-based |
| Reports | `useReportDetails` | ✅ Complete | On-demand, session-based |
| Feedback | `useReportDetails` | ✅ Complete | On-demand, session-based |
| Services | `useServiceDetails` | ❌ Needs work | Uses preloaded ordersData |

---

## Migration Plan

### Phase 1: Add `openById()` Method
**Goal**: Single entrypoint that works for all current entities

**Changes**:
```tsx
// In ModalProvider.tsx
openById(id: string) {
  const { type, subtype } = parseEntityId(id);
  const entityType = subtype || type; // e.g., 'feedback' or 'order'
  this.openEntityModal(entityType, id);
}
```

**Impact**: Zero breaking changes, backward compatible

---

### Phase 2: Migrate All Call Sites
**Goal**: Use `openById()` everywhere, remove type-specific methods

**Files to update**:
1. `apps/frontend/src/components/ActivityFeed.tsx`
   - Change: `modals.openReportModal(targetId, targetType)`
   - To: `modals.openById(targetId)`

2. All Directory tables in role hubs:
   - `apps/frontend/src/hubs/AdminHub.tsx`
   - `apps/frontend/src/hubs/ManagerHub.tsx`
   - `apps/frontend/src/hubs/ContractorHub.tsx`
   - etc.
   - Change: `modals.openReportModal(row.id, 'report')`
   - To: `modals.openById(row.id)`

3. Any other modal open calls (search will find them)

**Validation**: Run `git grep "openReportModal\|openOrderModal"` to find remaining uses

---

### Phase 3: Convert Services to On-Demand Fetching
**Goal**: Remove last dependency on preloaded `ordersData`

**Backend** (create new endpoint):
```typescript
// apps/backend/server/domains/services/routes.fastify.ts
fastify.get('/services/:serviceId/details', async (request, reply) => {
  const user = await requireActiveRole(request, reply);
  if (!user) return;

  const { serviceId } = request.params;
  const service = await getServiceById(user.role, user.cksCode, serviceId);

  if (!service) {
    return reply.code(404).send({ error: 'Service not found or access denied' });
  }

  return reply.send({ data: service });
});
```

**Frontend** (rewrite hook):
```typescript
// apps/frontend/src/hooks/useServiceDetails.ts
export function useServiceDetails(params: { serviceId: string | null }) {
  const { serviceId } = params;
  const swrKey = serviceId ? `/services/${serviceId}/details` : null;

  const { data, error, isLoading } = useSWR<ApiResponse<any>>(
    swrKey,
    async (url) => apiFetch<ApiResponse<any>>(url),
    { revalidateOnFocus: false }
  );

  return {
    service: data?.data || null,
    isLoading,
    error: error || null,
  };
}
```

**Update ModalGateway**:
```tsx
// Remove ordersData parameter
const serviceDetails = useServiceDetails({
  serviceId: entityType === 'service' ? entityId : null,
  // ordersData: ordersData,  ← DELETE THIS
});
```

---

### Phase 4: Remove Unused Props
**Goal**: Clean up ModalProvider and ModalGateway

**Remove from ModalProvider**:
```tsx
// DELETE this prop
ordersData?: any;
```

**Remove from ModalGateway**:
```tsx
// DELETE this parameter
ordersData?: any;
```

**Validate**: Search codebase for `ordersData` - should only appear in old list views

---

### Phase 5: Enhance ID Parser (Optional)
**Goal**: Add missing utilities for advanced use cases

**Add to `parseEntityId.ts`**:
```typescript
export function extractScope(id: string): string | null {
  // "CON-010-FBK-001" → "CON-010"
  const match = id.match(/^([A-Z]+-\d+)-/);
  return match ? match[1] : null;
}

export function isValidId(id: string): boolean {
  // Check if ID matches expected format
  return /^[A-Z]+-\d+-[A-Z]+-\d+$/.test(id);
}
```

---

### Phase 6: Delete Deprecated Methods
**Goal**: Remove old modal open methods to enforce consistency

**Delete from ModalProvider**:
```tsx
openReportModal()  // ← DELETE
openOrderModal()   // ← DELETE
```

**Validation**: TypeScript will catch any remaining uses

---

## Adding New Entity Types (Future)

Once this migration is complete, adding a new entity type is trivial:

### Example: Adding "Training Certificate" Entity

**Step 1**: Add ID pattern to parser (2 lines)
```typescript
// parseEntityId.ts
else if (id.includes('-TRN-')) {
  return { type: 'training', subtype: 'certificate' };
}
```

**Step 2**: Create backend endpoint (copy/paste pattern)
```typescript
// apps/backend/server/domains/training/routes.fastify.ts
fastify.get('/training/:certId/details', async (request, reply) => {
  const user = await requireActiveRole(request, reply);
  // ... session-based auth like orders/reports
});
```

**Step 3**: Create detail hook (copy/paste pattern)
```typescript
// apps/frontend/src/hooks/useTrainingDetails.ts
export function useTrainingDetails({ certId }) {
  // ... same pattern as useReportDetails
}
```

**Step 4**: Add to ModalGateway (add case)
```typescript
const trainingDetails = useTrainingDetails({
  certId: entityType === 'training' ? entityId : null,
});

const detailsMap = {
  // ... existing
  training: {
    data: trainingDetails.certificate,
    isLoading: trainingDetails.isLoading,
    error: trainingDetails.error,
    state: 'active',
  },
};
```

**Step 5**: Add adapter to registry (copy/paste order adapter)
```typescript
// entityRegistry.tsx
const trainingAdapter: EntityAdapter = {
  getActionDescriptors: (context) => {
    // Define what actions are available
  },
  Component: TrainingModal,
  mapToProps: (data, actions, onClose) => ({
    isOpen: !!data,
    onClose,
    certificate: data,
    actions,
  }),
};

export const entityRegistry = {
  // ... existing
  training: trainingAdapter,
};
```

**Done!** It now works everywhere:
- `modals.openById('CON-010-TRN-001')` ✓
- Activity Feed ✓
- Directory ✓
- Archive ✓
- Search ✓

---

## Risks and Mitigations

### Risk 1: Breaking Changes During Migration
**Mitigation**: Phase 1 is backward compatible. Test thoroughly before Phase 2.

### Risk 2: ID Format Changes
**Mitigation**: All ID parsing is centralized in `parseEntityId.ts`. One file to update.

### Risk 3: Permission Edge Cases
**Mitigation**: Existing `permissions.ts` already handles all current cases. Add tests for new entities.

### Risk 4: Performance (Multiple Detail Fetches)
**Mitigation**: SWR provides automatic caching and deduplication. Opening same modal twice = zero extra requests.

---

## Testing Strategy

### Unit Tests
- Test `parseEntityId()` with various ID formats
- Test `can()` permission logic for all entity types
- Test entity adapters' `getActionDescriptors()` outputs

### Integration Tests
- Open modals from Activity Feed → verify correct entity loads
- Open modals from Directory → verify correct entity loads
- Open modals from Archive → verify correct state detection
- Test archived entities → verify "Restore" and "Delete" actions appear
- Test active entities → verify "Archive" action appears

### Manual Testing Checklist
- [ ] Admin Hub: Open report from Activity Feed
- [ ] Admin Hub: Open feedback from Directory
- [ ] Admin Hub: Open archived report from Archive tab
- [ ] Manager Hub: Open order from Activity Feed
- [ ] Contractor Hub: Open service from Directory
- [ ] All modals: Verify actions match role permissions
- [ ] All modals: Verify state banners (deleted/archived)

---

## Success Criteria

✅ **Definition of Done**:
1. All modals open using `modals.openById(id)` only
2. Zero `ordersData` or `reportsData` props in ModalProvider
3. Services use on-demand fetching like reports/orders
4. No type-specific modal open methods remain
5. All existing functionality works as before
6. Tests pass
7. Documentation updated

---

## Timeline Estimate

| Phase | Effort | Description |
|-------|--------|-------------|
| Phase 1 | 15 min | Add `openById()` method |
| Phase 2 | 2 hours | Migrate all call sites |
| Phase 3 | 4 hours | Convert services to on-demand |
| Phase 4 | 30 min | Remove unused props |
| Phase 5 | 1 hour | Enhance ID parser (optional) |
| Phase 6 | 15 min | Delete deprecated methods |
| Testing | 2 hours | Manual + automated testing |

**Total**: ~10 hours for complete migration

---

## Open Questions

1. **Scope extraction**: Do we need `extractScope()` now or wait for a use case?
   - **Decision**: Wait for use case (YAGNI principle)

2. **ID validation**: Should we validate IDs before opening modals?
   - **Decision**: Parser returns null for invalid IDs, which is handled

3. **Services**: Do we create `/services/:id/details` or reuse orders endpoint?
   - **Decision**: Separate endpoint (services might have different permissions)

4. **Backward compatibility**: Keep old methods during migration?
   - **Decision**: Yes, delete in Phase 6 only after all call sites updated

---

## References

- Original proposal: `docs/MODAL_ARCHITECTURE_PROPOSAL.md`
- Implementation details: `docs/MODAL_ARCHITECTURE_IMPLEMENTATION.md`
- GPT-5 conversation: Session context (see user's recent messages)
- Existing ID parser: `apps/frontend/src/shared/utils/parseEntityId.ts`
- Entity registry: `apps/frontend/src/config/entityRegistry.tsx`
- Permission system: `apps/frontend/src/policies/permissions.ts`

---

## Appendix: Current ID Format Patterns

| Entity Type | ID Format | Example | Type | Subtype |
|-------------|-----------|---------|------|---------|
| Product Order | `XXX-###-PO-###` | `CEN-010-PO-001` | `order` | `product` |
| Service Order | `XXX-###-SO-###` | `MGR-005-SO-023` | `order` | `service` |
| Report | `XXX-###-RPT-###` | `CEN-010-RPT-017` | `report` | `report` |
| Feedback | `XXX-###-FBK-###` | `CON-010-FBK-001` | `report` | `feedback` |
| Service | `XXX-###-SVC-###` | `MGR-005-SVC-042` | `service` | `service` |
| User/Center | `CEN-###` | `CEN-010` | `user` | `center` |
| User/Contractor | `CON-###` | `CON-010` | `user` | `contractor` |
| User/Manager | `MGR-###` | `MGR-005` | `user` | `manager` |

**Pattern**: `{ROLE_CODE}-{SITE_NUM}-{ENTITY_TOKEN}-{SEQUENCE}`

Where:
- `ROLE_CODE`: CEN, CON, MGR, CUST, CREW, WHS
- `SITE_NUM`: 3-digit site identifier
- `ENTITY_TOKEN`: PO, SO, RPT, FBK, SVC, TRN, etc.
- `SEQUENCE`: Auto-incrementing number

---

## Appendix: Session-Based Auth Pattern

All detail endpoints follow this pattern:

```typescript
fastify.get('/entity/:entityId/details', async (request, reply) => {
  // 1. Extract user from session (requireActiveRole)
  const user = await requireActiveRole(request, reply);
  if (!user) return;  // 401 if not authenticated

  // 2. Get entity ID from URL params
  const { entityId } = request.params;

  // 3. Use session user's code for permission checking
  const cksCode = user.cksCode || 'UNKNOWN';

  // 4. Fetch entity with role-based filtering
  const entity = await getEntityById(user.role as HubRole, cksCode, entityId);

  // 5. Return 404 if not found or no permission
  if (!entity) {
    return reply.code(404).send({ error: 'Entity not found or access denied' });
  }

  // 6. Return normalized data
  return reply.send({ data: entity });
});
```

**Key benefits**:
- No code in URL (cleaner, more RESTful)
- Backend enforces permissions automatically
- Same pattern for all entities
- Matches industry standard practices
