# Certification Timeline Debug - Claude Handoff

**Date:** 2025-10-27
**Status:** ✅ RESOLVED - Server restart + frontend badge fix
**Symptom:** Admin sees events, but service history and user hubs don't

---

## Resolution Summary

**Root Cause:** Backend TypeScript dev server failed to hot-reload changes. GPT5's code was already correct.

**Fix:**
1. Restarted backend server (loaded correct code)
2. Fixed frontend badge regex order in HistoryTab.tsx
3. Rebuilt UI package

**See:** `docs/certification-timeline-fix-summary.md` for full details.

---

# Original Debug Document

---

## Problem Statement

Catalog service certification/decertification events are:
- ✅ **Working:** Admin Recent Activity feed
- ❌ **Broken:** Service History timeline (entityType=catalogService)
- ❌ **Broken:** User hub activity feeds (affected users don't see their certs)

**Expected behavior:**
- Service SRV-001 timeline should show: "Certified MGR-012 for SRV-001"
- MGR-012 hub should show: "Certified you for SRV-001" (personalized)

**Actual behavior:**
- Service timeline shows only: created, archived, restored events
- User hub shows nothing related to certifications

---

## Current Symptoms

### Admin Recent Activity ✅ Working
```
GET /api/admin/directory?resource=activities

Response shows:
- "Certified MGR-012 for SRV-001"
- "Uncertified MGR-012 for SRV-001"
```

### Service History Timeline ❌ Not Working
```
GET /api/activity/entity/catalogService/SRV-001

Expected: certification events included
Actual: Only returns:
  - catalog_service_created
  - catalogService_archived
  - catalogService_restored

Missing: catalog_service_certified, catalog_service_decertified
```

### User Hub Feed ❌ Not Working
```
User MGR-012 logs in → Recent Activity section

Expected: "Certified you for SRV-001"
Actual: No certification events appear
```

---

## Data Verification

### Database Records Confirmed Present

Certification activities ARE being written to `system_activity` table:

```sql
-- Check if cert activities exist
SELECT
  activity_id,
  activity_type,
  description,
  target_id,
  target_type,
  metadata->>'serviceId' as service_id_meta,
  metadata->>'userId' as user_id_meta,
  created_at
FROM system_activity
WHERE activity_type LIKE '%certified%'
ORDER BY created_at DESC
LIMIT 20;

-- Expected results should show:
-- activity_type: catalog_service_certified | catalog_service_decertified
-- target_id: SRV-001 (service being certified)
-- target_type: catalogService
-- metadata.serviceId: SRV-001
-- metadata.userId: MGR-012 (user being certified)
```

**Admin feed sees these records**, so they exist in the database.

---

## Code Changes Already Made

### 1. Activity Recording (catalog/routes.fastify.ts)

**Location:** `apps/backend/server/domains/catalog/routes.fastify.ts:369, 396`

```typescript
// Certification
await recordActivity({
  activityType: 'catalog_service_certified',
  description: `Certified ${uid} for ${serviceId}`,
  actorId: admin.cksCode || 'ADMIN',
  actorRole: 'admin',
  targetId: serviceId,              // SRV-001
  targetType: 'catalogService',
  metadata: {
    userId: uid,                     // MGR-012
    role,
    serviceName,
    serviceId                        // SRV-001 (added by GPT5)
  },
});

// Decertification
await recordActivity({
  activityType: 'catalog_service_decertified',
  description: `Uncertified ${uid} for ${serviceId}`,
  // ... same structure
});
```

### 2. History Endpoint (activity/routes.fastify.ts)

**Location:** `apps/backend/server/domains/activity/routes.fastify.ts:227-238`

Added `catalogService` case to include certification events:

```typescript
case 'catalogService':
  // Include certification events for this service (match by target_id OR metadata.serviceId)
  relatedAssignmentClause = `
    OR (
      activity_type IN ('catalog_service_certified', 'catalog_service_decertified')
      AND (
        UPPER(target_id) = UPPER($1)
        OR (metadata ? 'serviceId' AND UPPER(metadata->>'serviceId') = UPPER($1))
      )
    )
  `;
  break;
```

**Also updated:** Dual LIKE pattern matching (lines 170-171)

```typescript
const likePrefixSnake = getActivityType(validatedType, 'created').replace(/_created$/i, '_%');
const likePrefixCamel = `${validatedType}_%`;

// Query uses both:
// activity_type LIKE $4  -- catalog_service_%
// OR activity_type LIKE $5  -- catalogService_%
```

### 3. User Scope Queries (scope/store.ts)

**Location:** All 6 role activity queries (manager, contractor, customer, center, crew, warehouse)

Added clause to show certification events to affected users:

```typescript
-- Catalog service certifications affecting YOU (viewer)
(
  activity_type IN (
    'catalog_service_certified',
    'catalog_service_decertified',
    'catalogService_certified',      // camelCase variant
    'catalogService_decertified'
  )
  AND metadata ? 'userId'
  AND UPPER(metadata->>'userId') = $2  // $2 is viewer's cksCode
)
OR
-- Catalog service creation events (visible to all users)
(activity_type = 'catalog_service_created')
```

**Lines:** 316-322, 968-974, 1061-1067, 1147-1153, 1231-1237, 1317-1323

### 4. Personalization Logic (scope/store.ts)

**Location:** `apps/backend/server/domains/scope/store.ts:74-78`

```typescript
if (row.activity_type === 'catalog_service_certified') {
  description = `Certified you for ${serviceId}`;
} else if (row.activity_type === 'catalog_service_decertified') {
  description = `Uncertified you for ${serviceId}`;
}
```

### 5. Backfill Scripts (completed)

**Location:** `apps/backend/scripts/backfill-catalog-activities.ts`

- Added `catalog_service_created` for seeded services
- Description format: `Seeded SRV-001` (not `Seeded CatalogService SRV-001`)

---

## Investigation Steps for Claude

### Step 1: Verify Database Records

Run this query to confirm cert events exist:

```sql
SELECT
  activity_id,
  activity_type,
  description,
  target_id,
  target_type,
  metadata,
  created_at
FROM system_activity
WHERE activity_type IN ('catalog_service_certified', 'catalog_service_decertified')
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:** Should return certification records with:
- `target_id = 'SRV-001'`
- `target_type = 'catalogService'`
- `metadata.userId = 'MGR-012'`
- `metadata.serviceId = 'SRV-001'`

### Step 2: Test History Endpoint Directly

```bash
curl http://localhost:4000/api/activity/entity/catalogService/SRV-001
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": 123,
        "type": "catalog_service_created",
        "description": "Seeded SRV-001",
        ...
      },
      {
        "id": 456,
        "type": "catalog_service_certified",
        "description": "Certified MGR-012 for SRV-001",
        ...
      },
      {
        "id": 789,
        "type": "catalog_service_decertified",
        "description": "Uncertified MGR-012 for SRV-001",
        ...
      }
    ]
  }
}
```

**Actual response:** Missing certification events

### Step 3: Check Query Parameters

Add debug logging to the history endpoint query (line 279):

```typescript
const result = await query(queryText, [
  entityId,        // Should be 'SRV-001'
  validatedType,   // Should be 'catalogService'
  activityTypes,   // Array of lifecycle types
  likePrefixSnake, // 'catalog_service_%'
  likePrefixCamel, // 'catalogService_%'
]);

// Add before query:
console.log('[HISTORY DEBUG]', {
  entityId,
  validatedType,
  activityTypes,
  likePrefixSnake,
  likePrefixCamel,
  relatedAssignmentClause
});
```

**Check:** Is `relatedAssignmentClause` empty? If so, the switch case isn't matching.

### Step 4: Examine WHERE Clause Logic

**File:** `apps/backend/server/domains/activity/routes.fastify.ts:245-265`

The WHERE clause is:

```sql
WHERE (
  (
    UPPER(target_id) = UPPER($1)          -- SRV-001
    AND target_type = $2                   -- catalogService
    AND (
      activity_type = ANY($3)              -- [created, archived, restored, deleted]
      OR activity_type LIKE $4             -- catalog_service_%
      OR activity_type LIKE $5             -- catalogService_%
    )
  )
  ${relatedAssignmentClause}               -- OR clause for certs
)
ORDER BY created_at ASC
```

**Potential Issue:**
- The main WHERE block requires `target_type = 'catalogService'`
- If cert events have `target_type` set differently, they won't match
- BUT `relatedAssignmentClause` is ORed, so it should still work

**Check cert records for target_type:**

```sql
SELECT activity_type, target_type
FROM system_activity
WHERE activity_type LIKE '%certified%';
```

If `target_type` is NULL or different, that's the issue.

### Step 5: Test relatedAssignmentClause Independently

Run the certification clause alone:

```sql
SELECT activity_id, activity_type, description, target_id, metadata
FROM system_activity
WHERE activity_type IN ('catalog_service_certified', 'catalog_service_decertified')
  AND (
    UPPER(target_id) = 'SRV-001'
    OR (metadata ? 'serviceId' AND UPPER(metadata->>'serviceId') = 'SRV-001')
  )
ORDER BY created_at ASC;
```

If this returns rows, the issue is with how it's ORed into the main query.

### Step 6: Check User Scope Query

For user MGR-012, check if the filter is correct:

```sql
-- Simulate user scope query for MGR-012
SELECT activity_id, activity_type, description, metadata
FROM system_activity
WHERE activity_type IN (
  'catalog_service_certified',
  'catalog_service_decertified',
  'catalogService_certified',
  'catalogService_decertified'
)
AND metadata ? 'userId'
AND UPPER(metadata->>'userId') = 'MGR-012'
AND NOT EXISTS (
  SELECT 1 FROM activity_dismissals ad
  WHERE ad.activity_id = system_activity.activity_id
    AND ad.user_id = 'MGR-012'
)
ORDER BY created_at DESC;
```

Should return cert events for MGR-012.

---

## Hypotheses

### Hypothesis 1: relatedAssignmentClause Not Being Applied

**Symptom:** Switch case for `catalogService` not matching

**Debug:**
- Add logging before switch statement to verify `validatedType === 'catalogService'`
- Check if TypeScript enum/type is using different casing

**Fix if true:**
- Verify entityType parameter in frontend call
- Check entity type parsing in route

### Hypothesis 2: target_type Mismatch

**Symptom:** Cert records have wrong `target_type`

**Debug:**
```sql
SELECT DISTINCT target_type
FROM system_activity
WHERE activity_type LIKE '%certified%';
```

**Fix if true:**
- Update cert recording to ensure `targetType: 'catalogService'`
- Run migration to fix existing records

### Hypothesis 3: Query OR Logic Issue

**Symptom:** OR clause not working due to precedence

**Debug:**
- Simplify query to ONLY certification clause
- Check if parentheses are correct

**Fix if true:**
- Adjust WHERE clause parentheses
- Test query in psql directly

### Hypothesis 4: Frontend Not Requesting Correctly

**Symptom:** Frontend passes wrong entityType

**Debug:**
- Check browser network tab for history API call
- Verify entityType parameter

**Fix if true:**
- Update frontend entityRegistry to use correct type

---

## Files to Review

1. **Activity Recording:**
   - `apps/backend/server/domains/catalog/routes.fastify.ts:366-405`

2. **History Endpoint:**
   - `apps/backend/server/domains/activity/routes.fastify.ts:130-305`
   - Specifically lines 227-238 (catalogService case)
   - Specifically lines 245-268 (WHERE clause)

3. **User Scope Queries:**
   - `apps/backend/server/domains/scope/store.ts:258-354` (manager)
   - `apps/backend/server/domains/scope/store.ts:914-1005` (contractor)
   - `apps/backend/server/domains/scope/store.ts:1007-1098` (customer)
   - `apps/backend/server/domains/scope/store.ts:1100-1184` (center)
   - `apps/backend/server/domains/scope/store.ts:1186-1268` (crew)
   - `apps/backend/server/domains/scope/store.ts:1270-1354` (warehouse)

4. **Frontend History Tab:**
   - `apps/frontend/src/config/entityRegistry.tsx:1548-1559` (catalogService adapter)
   - `packages/ui/src/tabs/HistoryTab.tsx` (timeline rendering)

---

## Expected Fix

Once debugged, the likely fix will be one of:

1. **Query clause ordering** - Adjust WHERE parentheses
2. **target_type normalization** - Ensure all cert events have `target_type = 'catalogService'`
3. **Case sensitivity** - Entity type matching issue (catalogService vs catalog_service)
4. **Missing LIKE pattern** - Add explicit OR for cert types in main WHERE block

---

## Success Criteria

After fix, verify:

1. ✅ GET `/api/activity/entity/catalogService/SRV-001` returns cert events
2. ✅ Service History UI shows "Certified MGR-012 for SRV-001"
3. ✅ User MGR-012 hub shows "Certified you for SRV-001"
4. ✅ Admin Recent Activity still works (don't break this)

---

## Context Documents

- **Best Practices:** `docs/activity-best-practices.md`
- **Migration Spec:** `docs/activity-description-migration-spec.md`

---

## Summary for Claude

**What works:** Admin can see cert events in their feed
**What doesn't work:** Service timelines and user feeds don't show cert events
**Root cause unknown:** Query filtering too strict, OR clause not working, or data shape issue
**Next step:** Debug history endpoint WHERE clause and user scope queries to find why cert events are excluded

Good luck, Claude! 🚀
