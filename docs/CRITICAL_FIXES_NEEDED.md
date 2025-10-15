# Critical Fixes Needed Before Frontend Implementation

Based on ChatGPT's review, here are the issues that need addressing:

---

## Issue 1: Archive/Delete Flow - DECISION NEEDED

### Current State (Confusing)
- Admin archives order
- Two deletion paths:
  - **Path A**: Admin manually clicks "Hard Delete"
  - **Path B**: System auto-deletes after 30 days

### Proposed Simplification

**OPTION A: Auto-Delete Only (RECOMMENDED)**
- Remove manual "Hard Delete" button
- Archive → Auto-delete after X days (configurable)
- Simpler, predictable, less admin burden

**OPTION B: Manual Delete Only**
- Archive → Stays forever until admin deletes
- Full control, can purge immediately
- Requires manual cleanup

**OPTION C: Keep Both (Current - Not Recommended)**
- Complex, two code paths

**USER DECISION NEEDED: Which option?**

---

## Issue 2: Snapshot Completeness (CRITICAL)

### Problem
Current snapshot is:
```typescript
const snapshot = await query(`SELECT * FROM orders WHERE order_id = $1`);
// Returns: { order_id, status, created_at, ... }
// MISSING: order items, requestor details, destination details
```

When deleted order modal opens, it will be empty/incomplete.

### Solution
Capture enriched snapshot with all related data:

```typescript
const snapshot = await query(`
  SELECT
    o.*,
    json_agg(oi.*) as items,
    -- Requestor info
    CASE
      WHEN o.requested_by_role = 'crew' THEN
        (SELECT row_to_json(c.*) FROM crew c WHERE c.crew_id = o.requested_by_code)
      WHEN o.requested_by_role = 'center' THEN
        (SELECT row_to_json(ce.*) FROM centers ce WHERE ce.center_id = o.requested_by_code)
      -- ... other roles
    END as requestor,
    -- Destination info
    (SELECT row_to_json(ce.*) FROM centers ce WHERE ce.center_id = o.destination_center_id) as destination
  FROM orders o
  LEFT JOIN order_items oi ON o.order_id = oi.order_id
  WHERE o.order_id = $1
  GROUP BY o.order_id
`);
```

**Impact:** Modals can show full details even for deleted orders

**Effort:** ~1 hour to implement enriched snapshots for orders, services, etc.

---

## Issue 3: Auth/Scope Checks (CRITICAL SECURITY)

### Problem
Current endpoint has NO authentication:
```typescript
fastify.get('/entity/:type/:id', async (request, reply) => {
  // Anyone can call this!
  const result = await getEntityWithFallback(type, id, includeDeleted);
  return result;
});
```

### Solution
Add auth middleware:

```typescript
fastify.get('/entity/:type/:id',
  { preHandler: requireActiveRole },  // ← Auth check
  async (request, reply) => {
    const { type, id } = request.params;
    const includeDeleted = request.query.includeDeleted === '1';

    // Only admins can see deleted entities
    if (includeDeleted && request.role !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const result = await getEntityWithFallback(type, id, includeDeleted);

    // Scope check: ensure user can access this entity
    if (!userCanAccessEntity(request.user, type, result.entity)) {
      return reply.code(403).send({ error: 'Not in your scope' });
    }

    return result;
  }
);
```

**Impact:** Prevents unauthorized access to entities

**Effort:** ~30 min

---

## Issue 4: SQL Injection Risk (CRITICAL SECURITY)

### Problem
Dynamic table/column names from user input:
```typescript
function getTableInfo(entityType: string) {
  switch (entityType) {
    case 'order': return { tableName: 'orders', idColumn: 'order_id' };
    // ...
    default:
      // DANGEROUS: User controls table name!
      return { tableName: `${entityType}s`, idColumn: `${entityType}_id` };
  }
}

// Used in query:
await query(`SELECT * FROM ${tableName} WHERE ${idColumn} = $1`);
```

### Solution
Strict whitelist, no fallback:

```typescript
function getTableInfo(entityType: string) {
  const allowed: Record<string, { tableName: string; idColumn: string }> = {
    'order': { tableName: 'orders', idColumn: 'order_id' },
    'service': { tableName: 'services', idColumn: 'service_id' },
    'crew': { tableName: 'crew', idColumn: 'crew_id' },
    // ... all valid types
  };

  if (!allowed[entityType]) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }

  return allowed[entityType];
}
```

**Impact:** Prevents SQL injection attacks

**Effort:** ~10 min

---

## Issue 5: Transaction Atomicity (CRITICAL DATA LOSS RISK)

### Problem
Current flow:
```typescript
// 1. Capture snapshot
const snapshot = await query(`SELECT * FROM orders...`);

// 2. Delete row
await query(`DELETE FROM orders WHERE order_id = $1`);

// 3. Record activity with snapshot
await recordActivity(..., { snapshot });  // ← If this fails, snapshot is LOST!
```

If step 3 fails (network error, DB crash, etc.), the order is deleted but snapshot is not saved = **permanent data loss**.

### Solution
Use database transaction:

```typescript
await query('BEGIN');
try {
  // 1. Capture snapshot
  const snapshot = await query(`SELECT * FROM orders...`);

  // 2. Record activity FIRST (safer)
  await recordActivity(..., { snapshot });

  // 3. Then delete
  await query(`DELETE FROM orders WHERE order_id = $1`);

  await query('COMMIT');
} catch (error) {
  await query('ROLLBACK');
  throw error;
}
```

**Impact:** Guarantees snapshot is saved before deletion

**Effort:** ~20 min

---

## Issue 6: Performance Indexes (IMPORTANT)

### Problem
Deleted entity lookup queries `system_activity` table without index:
```sql
SELECT metadata FROM system_activity
WHERE target_id = 'ORDER-123'
  AND target_type = 'order'
  AND activity_type = 'order_hard_deleted'
```

This is a full table scan on large activity tables.

### Solution
Add composite index:

```sql
CREATE INDEX idx_activity_deleted_lookup
ON system_activity(target_type, target_id, activity_type, created_at DESC);
```

Also ensure `archived_at` is indexed on all entity tables.

**Impact:** 10-100x faster lookups

**Effort:** ~15 min (create migration script)

---

## Issue 7: PII Redaction (COMPLIANCE)

### Problem
Deleted user snapshots contain full PII:
```json
{
  "manager_id": "MGR-001",
  "email": "john.doe@company.com",  // ← PII
  "phone": "555-1234",               // ← PII
  "address": "123 Main St",          // ← PII
  "ssn": "123-45-6789"               // ← VERY SENSITIVE!
}
```

### Solution
Redact PII before storing snapshot:

```typescript
function redactPII(entityType: string, snapshot: any) {
  if (['manager', 'contractor', 'customer', 'crew'].includes(entityType)) {
    return {
      ...snapshot,
      email: '[REDACTED]',
      phone: '[REDACTED]',
      address: '[REDACTED]',
      ssn: '[REDACTED]',
      // Keep: id, name, role, relationships
    };
  }
  return snapshot;
}

// Use when storing:
const redactedSnapshot = redactPII(entityType, snapshot);
await recordActivity(..., { snapshot: redactedSnapshot });
```

**Impact:** GDPR/privacy compliance

**Effort:** ~30 min

---

## Priority & Effort Summary

| Issue | Priority | Effort | Impact |
|-------|----------|--------|--------|
| 1. Archive/Delete Flow | HIGH | 0 min (decision) | Simplicity |
| 2. Snapshot Completeness | CRITICAL | 1 hour | Modals work |
| 3. Auth/Scope Checks | CRITICAL | 30 min | Security |
| 4. SQL Injection | CRITICAL | 10 min | Security |
| 5. Transaction | CRITICAL | 20 min | Data integrity |
| 6. Performance Indexes | HIGH | 15 min | Performance |
| 7. PII Redaction | HIGH | 30 min | Compliance |

**Total Effort: ~3 hours**

---

## Recommendation

**Fix these in order BEFORE moving to frontend:**

1. ✅ **Decision**: Simplify archive/delete flow (Option A recommended)
2. ✅ **Security**: SQL injection fix (10 min)
3. ✅ **Security**: Auth/scope checks (30 min)
4. ✅ **Data**: Transaction atomicity (20 min)
5. ✅ **Data**: Snapshot completeness (1 hour)
6. ✅ **Compliance**: PII redaction (30 min)
7. ✅ **Performance**: Add indexes (15 min)

After these fixes, the backend will be production-ready and frontend can confidently consume the API.

---

## Questions for User

1. **Archive/Delete Flow**: Which option do you want? (A, B, or C)
2. **Scope**: Should we fix all 7 issues now, or prioritize top 3-4?
3. **Timeline**: Fix backend first (3 hours), then frontend? Or acceptable?
