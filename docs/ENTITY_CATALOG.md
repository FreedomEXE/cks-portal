# Entity Catalog - Single Source of Truth

## Overview

The Entity Catalog is the **single source of truth** for ALL entity metadata in the CKS Portal. Every entity type (orders, reports, services, users, locations) is defined in one centralized catalog with complete metadata about:

- **Identity**: ID patterns, tokens, display names
- **Database**: Table mappings, column names
- **Capabilities**: What lifecycle operations are supported
- **Activity Types**: Event keys for logging
- **UI Configuration**: Modal components, tab order (frontend only)
- **API Endpoints**: Detail fetch routes (frontend only)

## Architecture

### Twin Catalogs (No Cross-Imports)

```
apps/frontend/src/shared/constants/entityCatalog.ts  ← Frontend catalog
apps/backend/server/shared/entityCatalog.ts           ← Backend catalog
```

**Why separate catalogs?**
- Frontend and backend must NOT import each other's code
- Each catalog contains environment-specific fields
- Both catalogs share the same core entity definitions
- Manual synchronization required (trade-off for clean separation)

### Catalog Schema

```typescript
interface EntityDefinition {
  // Core Identity
  type: string;                    // 'order', 'report', 'service'
  displayName: string;             // "Order"
  displayNamePlural: string;       // "Orders"

  // ID Patterns
  idToken: string | string[];      // "RPT" or ["SO", "PO"]
  idPattern: RegExp;               // /^(?:[A-Z]{3}-\d{3}-)?RPT-\d+$/i
  scopePrefix?: string;            // "MGR-", "CON-", "CEN-" (for scoped entities)

  // Database Mapping
  backendTable: string;            // 'orders', 'reports', 'services'
  backendIdColumn: string;         // 'order_id', 'report_id'

  // Capabilities (What can this entity do?)
  supportsDetailFetch: boolean;    // Has detail endpoint?
  supportsArchive: boolean;        // Can be archived?
  supportsDelete: boolean;         // Can be hard-deleted?
  supportsRestore: boolean;        // Can be restored?
  supportsHistory: boolean;        // Has history timeline?
  supportsTombstone: boolean;      // Can show deleted snapshot?

  // Activity Types (must match event writers)
  activityTypes: {
    created: string;               // 'order_created'
    archived: string;              // 'order_archived'
    restored: string;              // 'order_restored'
    deleted: string;               // 'order_hard_deleted'
  };

  // Frontend-only fields
  detailsEndpoint?: (id: string) => string;  // id => '/api/order/ORD-123/details'
  modalComponent: string;                    // 'ActivityModal', 'ReportModal'
  defaultTabOrder: string[];                 // ['details', 'history', 'actions']
}
```

## Supported Entities

| Entity Type | ID Pattern | Table | Supports |
|-------------|------------|-------|----------|
| **order** | `SO-123`, `PO-456`, `CEN-010-SO-789` | `orders` | Archive, Delete, Restore, History, Tombstone, Details |
| **report** | `RPT-123`, `CEN-010-RPT-456` | `reports` | Archive, Delete, Restore, History, Tombstone, Details |
| **feedback** | `FBK-123`, `CEN-010-FBK-456` | `reports` | Archive, Delete, Restore, History, Tombstone, Details |
| **service** | `SRV-123` | `services` | Archive, Delete, Restore, History *(Details/Tombstone pending)* |
| **product** | `PRD-123`, `PRD-00000123` | `product_catalog` | Archive, Delete, Restore |
| **manager** | `MGR-123` | `managers` | Archive, Delete, Restore |
| **contractor** | `CON-123` | `contractors` | Archive, Delete, Restore |
| **customer** | `CUS-123` | `customers` | Archive, Delete, Restore |
| **center** | `CEN-123` | `centers` | Archive, Delete, Restore |
| **crew** | `CRW-123` | `crews` | Archive, Delete, Restore |
| **warehouse** | `WAR-123` | `warehouses` | Archive, Delete, Restore |

### Scoped IDs

Some entities support **scoped IDs** with prefixes:

```
CEN-010-SO-123    → Order scoped to center CEN-010
CEN-010-RPT-456   → Report scoped to center CEN-010
MGR-123           → Manager (uses MGR- as scope prefix)
CON-456           → Contractor (uses CON- as scope prefix)
```

## Usage Examples

### Frontend

```typescript
import {
  getEntityDefinition,
  getEntityByIdPattern,
  supportsLifecycleAction,
  validateEntityId
} from '@/shared/constants/entityCatalog';

// Get definition by type
const orderDef = getEntityDefinition('order');
console.log(orderDef.displayName);  // "Order"
console.log(orderDef.backendTable);  // "orders"

// Parse ID to determine type
const entity = getEntityByIdPattern('SO-123');
console.log(entity.type);  // "order"
console.log(entity.modalComponent);  // "ActivityModal"

// Check capabilities before calling API
if (supportsLifecycleAction('order', 'tombstone')) {
  // Safe to fetch deleted snapshot
  await fetchDeletedSnapshot(orderId);
}

// Validate ID before processing
const { valid, type, reason } = validateEntityId('INVALID-999');
if (!valid) {
  console.error(reason);  // "ID does not match any known entity pattern"
}

// Get endpoint dynamically
const endpoint = orderDef.detailsEndpoint?.('SO-123');
// => '/api/order/SO-123/details'
```

### Backend

```typescript
import {
  getEntityDefinition,
  getEntityByIdPattern,
  getEntityTableMapping,
  getActivityType,
  supportsLifecycleAction
} from '../shared/entityCatalog';

// Get table mapping for query
const { table, idColumn } = getEntityTableMapping('order');
const query = `SELECT * FROM ${table} WHERE ${idColumn} = $1`;
// => "SELECT * FROM orders WHERE order_id = $1"

// Get activity type for logging
const activityType = getActivityType('order', 'archived');
// => 'order_archived'

await logActivity({
  activity_type: activityType,
  target_id: orderId,
  // ...
});

// Check capability before attempting operation
if (!supportsLifecycleAction('service', 'tombstone')) {
  throw new Error('Service entity does not support tombstone retrieval');
}

// Parse incoming ID
const entity = getEntityByIdPattern(req.params.id);
if (entity.type === 'unknown') {
  return res.status(400).json({ error: 'Invalid entity ID' });
}
```

## Helper Functions

### Frontend & Backend (Shared)

| Function | Purpose | Example |
|----------|---------|---------|
| `getEntityDefinition(type)` | Get definition by type | `getEntityDefinition('order')` |
| `getEntityByIdPattern(id)` | Parse ID to find type | `getEntityByIdPattern('SO-123')` |
| `getAllEntityTypes()` | Get all types (excluding 'unknown') | `['order', 'report', ...]` |
| `supportsLifecycleAction(type, action)` | Check capability | `supportsLifecycleAction('order', 'archive')` |
| `validateEntityId(id)` | Validate ID format | `{ valid: true, type: 'order' }` |

### Backend-Only

| Function | Purpose | Example |
|----------|---------|---------|
| `getEntityTableMapping(type)` | Get table/column names | `{ table: 'orders', idColumn: 'order_id' }` |
| `getActivityType(type, action)` | Get activity event key | `getActivityType('order', 'deleted')` → `'order_hard_deleted'` |

## Migration Guide

### Before (Scattered Logic)

```typescript
// Modal opening - complex switch statement
if (entityType === 'order') {
  if (idToken === 'SO') {
    modals.openServiceOrderModal(id);
  } else {
    modals.openProductOrderModal(id);
  }
} else if (entityType === 'report') {
  modals.openReportModal(id);
}
// ... 50+ lines of similar logic
```

```typescript
// Archive logic - hardcoded table names
let table = '';
if (type === 'order') table = 'orders';
else if (type === 'report') table = 'reports';
else if (type === 'service') table = 'services';
// ... repeated in multiple files
```

### After (Catalog-Driven)

```typescript
// Modal opening - one line
modals.openById(entityId);  // Catalog determines everything

// Archive logic - dynamic
const { table, idColumn } = getEntityTableMapping(entityType);
await db.query(`UPDATE ${table} SET archived = true WHERE ${idColumn} = $1`, [id]);
```

## Capability Flags

Capability flags prevent calling non-existent endpoints or operations:

```typescript
// SAFE: Check before calling
if (supportsLifecycleAction('product', 'history')) {
  await fetchHistory(productId);
} else {
  // Show fallback UI - no history available
}

// UNSAFE: Blindly calling
await fetchHistory(productId);  // ❌ Fails - products don't support history
```

### Current Capability Matrix

| Capability | Orders | Reports | Feedback | Services | Products | Users | Locations |
|------------|:------:|:-------:|:--------:|:--------:|:--------:|:-----:|:---------:|
| **DetailFetch** | ✅ | ✅ | ✅ | ⏳ | ❌ | ❌ | ❌ |
| **Archive** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Delete** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Restore** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **History** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Tombstone** | ✅ | ✅ | ✅ | ⏳ | ❌ | ❌ | ❌ |

*Legend: ✅ Supported | ❌ Not Supported | ⏳ Pending Implementation*

## Activity Type Consistency

Activity types MUST match backend event writers exactly:

```typescript
// Catalog definition
activityTypes: {
  created: 'order_created',
  archived: 'order_archived',
  restored: 'order_restored',
  deleted: 'order_hard_deleted'
}

// Backend event writer - MUST USE SAME KEY
await logActivity({
  activity_type: 'order_archived',  // ✅ Matches catalog
  // NOT 'order_archive' or 'orderArchived' ❌
});
```

## ID Pattern Rules

### Pattern Design Principles

1. **Anchored**: All patterns use `^` and `$` to match entire string
2. **Case-insensitive**: Use `/i` flag for user-friendly matching
3. **Optional scopes**: Support `CEN-010-` prefix where applicable
4. **Token variants**: Support multiple tokens (e.g., `SO` and `PO` for orders)
5. **Padded formats**: Handle zero-padded IDs (e.g., `PRD-00000123`)

### Examples

```typescript
// Order: Supports SO/PO with optional scope
idPattern: /^(?:[A-Z]{3}-\d{3}-)?(?:S|P)O-\d+$/i

Matches:
✅ SO-123
✅ PO-456
✅ CEN-010-SO-789
✅ so-123 (case-insensitive)
❌ ORDER-123
❌ S-123

// Product: Only PRD (product catalog items)
// NOTE: Product ORDERS use 'PO' token (e.g., CRW-001-PO-010)
idPattern: /^PRD-\d{1,8}$/i

Matches:
✅ PRD-001
✅ PRD-123
✅ PRD-00000123 (padded)
❌ PROD-123 (wrong token)
❌ PO-123 (that's a product ORDER, not a product)
```

## Synchronization Requirements

### Critical: Keep Catalogs in Sync

When adding or modifying entities:

1. **Update both catalogs** (frontend and backend)
2. **Match these fields exactly**:
   - `type`
   - `displayName` / `displayNamePlural`
   - `idToken`
   - `idPattern`
   - `backendTable` / `backendIdColumn`
   - `supportsX` capability flags
   - `activityTypes`

3. **Verify in PR review**:
   - Side-by-side comparison of both files
   - Run catalog consistency tests (when available)

### Divergence Points (Expected)

Frontend catalog has these extra fields:
- `detailsEndpoint?: (id: string) => string`
- `modalComponent: string`
- `defaultTabOrder: string[]`

Backend catalog has these extra helper functions:
- `getEntityTableMapping(type)`
- `getActivityType(entityType, action)`

## Unknown Entity Fallback

Both catalogs include an `unknown` entity definition for graceful degradation:

```typescript
unknown: {
  type: 'unknown',
  displayName: 'Unknown Entity',
  displayNamePlural: 'Unknown Entities',
  idToken: '',
  idPattern: /.*/,  // Matches anything
  supportsArchive: false,
  supportsDelete: false,
  // ... all capabilities disabled
}
```

**When used:**
- ID doesn't match any known pattern
- Entity type not found in catalog
- Prevents crashes, logs warning for analytics

**Example:**
```typescript
const entity = getEntityByIdPattern('WEIRD-999');
console.log(entity.type);  // "unknown"
// Warning logged: [EntityCatalog] Unknown ID pattern: "WEIRD-999"
```

## Testing Strategy

### Manual Testing Checklist

- [ ] All 11 entity types resolve correctly by ID pattern
- [ ] Scoped IDs parse correctly (e.g., `CEN-010-SO-123`)
- [ ] Case-insensitive matching works (e.g., `so-123` === `SO-123`)
- [ ] Unknown IDs return `unknown` entity (no crashes)
- [ ] Capability checks prevent invalid operations
- [ ] Activity types match backend event writers
- [ ] Frontend endpoints generate correct URLs
- [ ] Backend table mappings query correct tables

### Automated Testing (Future)

```typescript
// Example unit tests
describe('EntityCatalog', () => {
  it('should parse order IDs correctly', () => {
    const entity = getEntityByIdPattern('SO-123');
    expect(entity.type).toBe('order');
  });

  it('should handle scoped IDs', () => {
    const entity = getEntityByIdPattern('CEN-010-RPT-456');
    expect(entity.type).toBe('report');
  });

  it('should return unknown for invalid IDs', () => {
    const entity = getEntityByIdPattern('INVALID-999');
    expect(entity.type).toBe('unknown');
  });

  it('should prevent unsupported operations', () => {
    expect(supportsLifecycleAction('product', 'history')).toBe(false);
  });
});
```

## Rollout Plan

### Phase 0: Foundation (Current)
- [x] Create frontend entity catalog
- [x] Create backend entity catalog
- [x] Create documentation
- [ ] Test all ID patterns
- [ ] Migrate ID parser to use catalog
- [ ] Migrate archive logic to use catalog

### Phase 1: Backend Integration
- [ ] Update archive store to use `getEntityTableMapping()`
- [ ] Update activity writers to use `getActivityType()`
- [ ] Create lifecycle endpoints using catalog
- [ ] Add capability checks to all operations

### Phase 2: Frontend Integration
- [ ] Update modal system to use catalog endpoints
- [ ] Update hooks to check capabilities before API calls
- [ ] Migrate all hardcoded entity logic to catalog lookups
- [ ] Remove deprecated entity-specific code

### Phase 3: Validation
- [ ] Add catalog consistency tests
- [ ] Add catalog sync CI check
- [ ] Performance testing (catalog lookups should be fast)
- [ ] Analytics on `unknown` entity warnings

## Benefits

### Before Entity Catalog

- **50+ locations** with hardcoded entity logic
- **Inconsistent** table names, ID patterns, activity types
- **Fragile** - adding new entity type requires changes in 10+ files
- **Error-prone** - easy to forget to update all locations
- **No validation** - typos cause runtime failures

### After Entity Catalog

- **1 location** defines all entity metadata
- **Consistent** - guaranteed same table names, patterns everywhere
- **Extensible** - add new entity by adding 1 catalog entry
- **Type-safe** - TypeScript enforces all required fields
- **Validated** - capability checks prevent invalid operations
- **Self-documenting** - catalog is living documentation

## FAQ

**Q: Why not use a database table for the catalog?**
A: Catalog is code-level configuration, not user data. Needs to be available at compile-time for type safety. No runtime database dependency.

**Q: Why not share one catalog between frontend/backend?**
A: Frontend and backend must not import each other's code. Clean separation is more important than avoiding duplication.

**Q: What if frontend and backend catalogs get out of sync?**
A: Manual synchronization required (trade-off). Future: Add CI check to validate both catalogs match on core fields.

**Q: How do I add a new entity type?**
A:
1. Add entry to both catalogs (frontend + backend)
2. Follow existing pattern for all required fields
3. Add ID pattern with proper regex
4. Set capability flags based on what backend supports
5. Test ID parsing and validation

**Q: Can I have multiple ID tokens for one entity?**
A: Yes - use array: `idToken: ['SO', 'PO']`. The `idPattern` regex must match all variants.

**Q: What if an entity doesn't have certain capabilities?**
A: Set capability flags to `false`. Frontend will hide UI, backend will reject operations. Example: products don't support history.

**Q: How do I know which activity type keys to use?**
A: Look at existing activity log writes in backend. Activity types MUST match exactly what's written to `activity_log` table.

## Related Documentation

- [Universal Lifecycle Implementation Plan](./UNIVERSAL_LIFECYCLE_IMPLEMENTATION_PLAN.md)
- [ID-First Modal Architecture](./ID_FIRST_ARCHITECTURE.md) *(if exists)*
- [Archive System](./ARCHIVE_SYSTEM.md) *(if exists)*

## Maintenance

**Review frequency**: Quarterly or when adding new entity types

**Update triggers**:
- Adding new entity type to system
- Changing database schema (table/column renames)
- Adding new lifecycle capabilities
- Changing activity log event keys
- Adding new ID token variants

**Owner**: CTO/Tech Lead

---

*Last updated: 2025-10-22*
*Version: 1.0 (Phase 0)*
