# Activity Feed System Documentation

**Version:** 1.0
**Last Updated:** 2025-11-02
**Status:** Production

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Activity Creation](#activity-creation)
3. [Activity Personalization Rules](#activity-personalization-rules)
4. [Role-Based Visibility](#role-based-visibility)
5. [Frontend Display](#frontend-display)
6. [Adding New Activity Types](#adding-new-activity-types)
7. [Examples & Patterns](#examples--patterns)
8. [Common Pitfalls](#common-pitfalls)

---

## System Overview

The Activity Feed system provides real-time visibility into CKS Portal actions across all roles. Activities flow through a four-stage pipeline:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  1. CREATION    │────▶│ 2. STORAGE       │────▶│ 3. FILTERING    │────▶│ 4. DISPLAY      │
│                 │     │                  │     │                 │     │                 │
│ recordActivity()│     │ system_activity  │     │ mapActivityRow()│     │ ActivityItem    │
│ in domain code  │     │ table (DB)       │     │ + role scoping  │     │ + color coding  │
└─────────────────┘     └──────────────────┘     └─────────────────┘     └─────────────────┘
```

### Key Design Principles

1. **Canonical Descriptions** - Activities are recorded with generic, action-focused descriptions like "Created Product Order CEN-010-PO-001"
2. **Viewer-Based Personalization** - Descriptions are personalized during retrieval based on who is viewing them
3. **Role-Based Color Coding** - Visual design (colored card backgrounds) indicates the actor's role without requiring text prefixes
4. **Ecosystem Scoping** - Each role sees only activities relevant to their scope (e.g., managers see their contractors' activities)
5. **Smart Click Routing** - Activity cards are clickable and route to the appropriate modal based on entity type

---

## Activity Creation

### Standard Format

Activities are created using the `recordActivity()` function from `apps/backend/server/domains/activity/writer.ts`.

#### Required Fields

```typescript
interface ActivityWriterPayload {
  activityType: string;        // Specific type like 'order_created', 'catalog_service_certified'
  description: string;          // Canonical description (NOT personalized)
  actorId: string;             // CKS code of who performed the action
  actorRole: string;           // Role of actor (admin, manager, crew, etc.)
  targetId: string;            // ID of the primary entity affected
  targetType: string;          // Type of target (order, service, user, etc.)
  metadata?: Record<string, unknown>;  // Additional context for personalization/filtering
}
```

#### Usage Example

```typescript
import { recordActivity } from '../activity/writer';

// Example: Recording an order creation
await recordActivity({
  activityType: 'order_created',
  description: `Created Product Order ${orderId}`,
  actorId: creatorCode,
  actorRole: 'center',
  targetId: orderId,
  targetType: 'order',
  metadata: {
    orderId,
    orderType: 'product',
    customerId: 'CUS-005',
    centerId: 'CEN-010',
    // ... other relevant context
  },
});
```

### Best Practices

✅ **DO:**
- Use canonical descriptions without actor prefixes (e.g., "Created Product Order PO-001")
- Include all relevant entity IDs in metadata for filtering
- Use specific activity types (e.g., `order_created`, not `entity_created`)
- Make descriptions action-focused (what happened, not who did it)
- Include target entity ID in the description for clarity

❌ **DON'T:**
- Include actor role in description (e.g., "Admin created..." or "Crew CRW-006 created...")
- Duplicate information that's already in actor fields
- Use generic activity types
- Include sensitive information in descriptions

### Activity Type Naming Convention

- Use snake_case: `entity_action_context`
- Be specific: `catalog_service_certified` not `service_certified`
- Include state changes: `order_delivered`, `user_archived`
- Examples:
  - `order_created`
  - `order_delivered`
  - `catalog_service_certified`
  - `crew_assigned_to_center`
  - `product_inventory_adjusted`
  - `manager_archived`

---

## Activity Personalization Rules

Personalization happens at **retrieval time** in the `mapActivityRow()` function (`apps/backend/server/domains/scope/store.ts:149-194`).

### Currently Personalized Activity Types

#### 1. Certification Activities

**Canonical:** `Certified MGR-012 for SRV-001`
**Personalized (for MGR-012):** `Certified you for SRV-001`

```typescript
// Location: scope/store.ts:152-168
if (affectedUserId === normalizedViewerId) {
  if (row.activity_type === 'catalog_service_certified') {
    description = `Certified you for ${serviceId}`;
  } else if (row.activity_type === 'catalog_service_decertified') {
    description = `Uncertified you for ${serviceId}`;
  }
}
```

**Metadata Required:** `{ userId: 'MGR-012', serviceName: 'SRV-001' }`

#### 2. Catalog Creation Events (Non-Admin Only)

**Canonical:** `Created catalog service SRV-001`
**Personalized (for crew/centers):** `New Service (SRV-001) added to the CKS Catalog!`

```typescript
// Location: scope/store.ts:170-180
if (viewerRole && viewerRole !== 'admin') {
  if (row.activity_type === 'catalog_service_created' && targetId) {
    description = `New Service (${targetId}) added to the CKS Catalog!`;
  } else if (row.activity_type === 'product_created' && targetId) {
    description = `New Product (${targetId}) added to the CKS Catalog!`;
  }
}
```

#### 3. Inventory Adjustments (Warehouse Only)

**Canonical:** `Adjusted inventory for PRD-001`
**Personalized (for warehouse):** `Inventory adjusted for PRD-001`

```typescript
// Location: scope/store.ts:177-179
if (row.activity_type === 'product_inventory_adjusted' && viewerRole === 'warehouse' && targetId) {
  description = `Inventory adjusted for ${targetId}`;
}
```

### When to Personalize

- **DO personalize** when the viewer is directly affected by the action
- **DO personalize** to add excitement for non-admin users (catalog additions)
- **DO personalize** to simplify language for specific roles
- **DON'T personalize** admin views (they need canonical descriptions)
- **DON'T personalize** assignment activities (color coding handles this)

---

## Role-Based Visibility

Each role sees activities scoped to their ecosystem. Filtering happens in role-specific functions like `getCrewActivities()`, `getManagerActivities()`, etc.

### Visibility Matrix

| Activity Type | Admin | Manager | Contractor | Customer | Center | Crew | Warehouse |
|--------------|-------|---------|------------|----------|--------|------|-----------|
| order_created | ✅ All | ✅ Their ecosystem | ✅ Their ecosystem | ✅ Their ecosystem | ✅ Their ecosystem | ✅ Their ecosystem | ✅ Their orders |
| catalog_service_certified | ✅ All | ✅ If affects their users | ✅ If affects their users | ✅ If affects their users | ✅ If affects their users | ✅ Only if affects them | ❌ |
| manager_created | ✅ All | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| crew_assigned_to_center | ✅ All | ✅ Their ecosystem | ✅ Their ecosystem | ✅ Their ecosystem | ✅ Their ecosystem | ✅ If they're the crew | ❌ |
| product_inventory_adjusted | ✅ All | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ All |

### Scoping Rules

#### Admin
- Sees **all** activities across the entire system
- No filtering applied
- Uses canonical descriptions (no personalization)

#### Manager
- Sees activities for:
  - Their assigned contractors
  - Customers under those contractors
  - Centers under those customers
  - Crew under those centers
  - Orders involving any of the above

#### Crew
- Sees activities for:
  - Their assigned center
  - Orders they're involved in
  - Certifications affecting them
  - **Does NOT see** other crew's activities

#### Warehouse
- Sees activities for:
  - Product orders assigned to them
  - Inventory adjustments
  - Product catalog additions

### Implementation Example

```typescript
// Example: getCrewActivities() filtering
// Location: apps/backend/server/domains/scope/store.ts

const activityRows = await query<ActivityRow>(
  `SELECT sa.*
   FROM system_activity sa
   WHERE (
     -- Orders involving this crew
     (sa.target_type = 'order' AND sa.metadata->>'crewId' = $1)
     OR
     -- Certifications for this crew
     (sa.activity_type IN ('catalog_service_certified', 'catalog_service_decertified')
      AND sa.metadata->>'userId' = $1)
     OR
     -- Center activities
     (sa.target_type = 'center' AND sa.target_id = $2)
   )
   ORDER BY sa.created_at DESC
   LIMIT 50`,
  [crewId, centerId]
);
```

---

## Frontend Display

### Color-Coded Activity Cards

The visual design uses role-based color schemes to indicate who performed the action **without requiring text prefixes** in the description.

#### Color Scheme Reference

**File:** `packages/domain-widgets/src/activity/RecentActivity/ActivityItem.tsx:14-51`

```typescript
const roleColors: Record<string, { bg: string; text: string }> = {
  admin: {
    bg: '#f3f4f6',      // Light gray
    text: '#111827',     // Black
  },
  manager: {
    bg: '#eff6ff',      // Light blue
    text: '#1e40af',     // Dark blue
  },
  contractor: {
    bg: '#ecfdf5',      // Light green
    text: '#065f46',     // Dark green
  },
  customer: {
    bg: '#fef3c7',      // Light yellow
    text: '#78350f',     // Dark yellow/brown
  },
  center: {
    bg: '#fef2e8',      // Light orange
    text: '#7c2d12',     // Dark orange
  },
  crew: {
    bg: '#fee2e2',      // Light red
    text: '#991b1b',     // Dark red
  },
  warehouse: {
    bg: '#fae8ff',      // Light purple
    text: '#581c87',     // Dark purple
  },
  system: {
    bg: '#e0e7ff',      // Light indigo
    text: '#3730a3',     // Dark indigo
  },
  default: {
    bg: '#f9fafb',      // Light gray
    text: '#374151',     // Dark gray
  },
};
```

### Activity Card Structure

```
┌─────────────────────────────────────────────────┐
│  [Optional Title]                               │
│  Created Product Order CEN-010-PO-001           │  ← Description
│  5 minutes ago • 2:30 PM                        │  ← Timestamp
└─────────────────────────────────────────────────┘
    ↑
    Background color indicates actor's role
```

### Click Handling

Activities are clickable and route to the appropriate modal based on `targetType`:

**File:** `apps/frontend/src/components/ActivityFeed.tsx:63-274`

| Target Type | Routing Behavior |
|-------------|------------------|
| `order` | Opens `ModalGateway` → `OrderDetailsModal` or `OrderActionsModal` |
| `service` | Opens service modal via `openById()` |
| `catalogService` | Opens catalog service detail modal |
| `product` | Opens product modal |
| `manager`, `contractor`, `customer`, `center`, `crew`, `warehouse` | Opens user profile modal via `openById()` |
| `report`, `feedback` | Opens report/feedback modal |

#### Viewer-Relative Clicks (Assignment Activities)

For assignment activities, the modal routing is **viewer-relative**:

```typescript
// Example: "Crew CRW-006 assigned to Center CEN-010"

if (viewerId === 'CRW-006') {
  // Crew viewing: "You have been assigned to..." → Open CEN-010
  modals.openById('CEN-010');
} else if (viewerId === 'CEN-010') {
  // Center viewing: "CRW-006 has been assigned to you!" → Open CRW-006
  modals.openById('CRW-006');
} else {
  // Admin viewing: Default to opening recipient (CEN-010)
  modals.openById('CEN-010');
}
```

---

## Adding New Activity Types

### Step-by-Step Guide

#### 1. Define the Activity Type

Choose a descriptive snake_case name following the convention: `entity_action_context`

```typescript
// Example: Adding a new training completion activity
const activityType = 'training_completed';
```

#### 2. Record the Activity in Domain Code

Add `recordActivity()` call where the action occurs:

```typescript
// File: apps/backend/server/domains/training/store.ts

import { recordActivity } from '../activity/writer';

export async function completeTraining(trainingId: string, crewId: string) {
  // ... business logic ...

  // Record activity
  await recordActivity({
    activityType: 'training_completed',
    description: `Completed training ${trainingId}`,
    actorId: crewId,
    actorRole: 'crew',
    targetId: trainingId,
    targetType: 'training',
    metadata: {
      trainingId,
      crewId,
      completedAt: new Date().toISOString(),
    },
  });

  return result;
}
```

#### 3. Add Personalization (Optional)

If the activity should be personalized for certain viewers, add logic to `mapActivityRow()`:

```typescript
// File: apps/backend/server/domains/scope/store.ts:149-194

function mapActivityRow(row: ActivityRow, viewerId?: string, viewerRole?: string): HubActivityItem {
  let description = row.description;

  // Add personalization for training completion
  if (viewerId && row.metadata) {
    const metadata = row.metadata as Record<string, any>;
    const completedByCrewId = metadata.crewId?.toString().trim().toUpperCase();
    const normalizedViewerId = viewerId.trim().toUpperCase();

    if (completedByCrewId === normalizedViewerId && row.activity_type === 'training_completed') {
      description = `You completed training ${row.target_id}`;
    }
  }

  // ... rest of function
}
```

#### 4. Add Role-Based Filtering

Update role-specific activity functions to include the new activity type:

```typescript
// File: apps/backend/server/domains/scope/store.ts

async function getCrewActivities(crewId: string, centerId: string) {
  const activityRows = await query<ActivityRow>(
    `SELECT sa.*
     FROM system_activity sa
     WHERE (
       -- Existing filters...
       OR
       -- Add new training filter
       (sa.activity_type = 'training_completed' AND sa.metadata->>'crewId' = $1)
     )
     ORDER BY sa.created_at DESC
     LIMIT 50`,
    [crewId]
  );

  // ...
}
```

#### 5. Add Frontend Click Handling (Optional)

If the activity should be clickable, add routing logic to `ActivityFeed.tsx`:

```typescript
// File: apps/frontend/src/components/ActivityFeed.tsx:63-274

async function handleActivityClick(activity: Activity) {
  const { targetType, targetId } = activity.metadata || {};

  // Add training click handling
  if (targetType === 'training') {
    console.log('[ActivityFeed] Opening training modal:', targetId);
    modals.openById(targetId);
    return;
  }

  // ... rest of function
}
```

#### 6. Add Category Mapping (Optional)

If needed, add a category for visual styling:

```typescript
// File: apps/backend/server/domains/scope/store.ts

const activityTypeCategory: Record<string, 'info' | 'success' | 'warning' | 'action'> = {
  // ... existing mappings
  training_completed: 'success',
};
```

### Checklist

- [ ] Define activity type name (snake_case)
- [ ] Add `recordActivity()` call in domain code
- [ ] Include all relevant metadata for filtering
- [ ] Add personalization logic (if needed)
- [ ] Update role-based filtering queries
- [ ] Add frontend click handling (if clickable)
- [ ] Add category mapping (if needed)
- [ ] Test visibility for each role
- [ ] Test click behavior
- [ ] Test personalization (if applicable)

---

## Examples & Patterns

### Pattern 1: Order Creation

**Backend Recording:**
```typescript
// File: apps/backend/server/domains/orders/store.ts:1911-1929

await recordActivity({
  activityType: 'order_created',
  description: `Created Product Order ${orderId}`,
  actorId: creatorCode,
  actorRole: 'center',
  targetId: orderId,
  targetType: 'order',
  metadata: {
    orderId,
    orderType: 'product',
    customerId: 'CUS-005',
    centerId: 'CEN-010',
  },
});
```

**What Each Role Sees:**
- **Admin:** Red card (crew) → "Created Product Order CEN-010-PO-001"
- **Manager MGR-001:** Red card (crew) → "Created Product Order CEN-010-PO-001" (if CEN-010 is in their ecosystem)
- **Crew CRW-006:** Red card (crew) → "Created Product Order CEN-010-PO-001" (if it's their center's order)

**Click Behavior:** Opens order modal

### Pattern 2: Certification

**Backend Recording:**
```typescript
// File: apps/backend/server/domains/catalog/routes.fastify.ts:483-491

await recordActivity({
  activityType: 'catalog_service_certified',
  description: `Certified ${uid} for ${serviceId}`,
  actorId: 'ADM-001',
  actorRole: 'admin',
  targetId: serviceId,
  targetType: 'catalogService',
  metadata: { userId: uid, role: 'crew', serviceName: serviceId },
});
```

**What Each Role Sees:**
- **Admin ADM-001:** Gray card (admin) → "Certified CRW-006 for SRV-001"
- **Crew CRW-006:** Gray card (admin) → "Certified you for SRV-001" ✨ (personalized!)
- **Manager MGR-001:** Gray card (admin) → "Certified CRW-006 for SRV-001" (if CRW-006 is in their ecosystem)

**Click Behavior:** Opens catalog service detail modal

### Pattern 3: Assignment

**Backend Recording:**
```typescript
// File: apps/backend/server/domains/assignments/store.ts

await recordActivity({
  activityType: 'crew_assigned_to_center',
  description: `Assigned ${crewId} to ${centerId}`,
  actorId: 'ADM-001',
  actorRole: 'admin',
  targetId: centerId,
  targetType: 'center',
  metadata: { crewId, centerId },
});
```

**What Each Role Sees:**
- **Admin ADM-001:** Gray card (admin) → "Assigned CRW-006 to CEN-010"
- **Crew CRW-006:** Gray card (admin) → "Assigned CRW-006 to CEN-010"
- **Center CEN-010:** Gray card (admin) → "Assigned CRW-006 to CEN-010"

**Click Behavior (Viewer-Relative):**
- If viewer is CRW-006 → Opens CEN-010 modal
- If viewer is CEN-010 → Opens CRW-006 modal
- If viewer is admin → Opens CEN-010 modal (default)

### Pattern 4: Archive/Delete

**Backend Recording:**
```typescript
// File: apps/backend/server/domains/archive/store.ts

await recordActivity({
  activityType: 'manager_archived',
  description: `Archived ${entityId}`,
  actorId: actor.cksCode,
  actorRole: actor.role,
  targetId: entityId,
  targetType: 'manager',
  metadata: {
    entityId,
    entityType: 'manager',
    archiveReason: reason,
  },
});
```

**What Each Role Sees:**
- **Admin only** (other roles don't see archive activities)

**Click Behavior:** Opens manager profile modal (shows archived state)

---

## Common Pitfalls

### ❌ Including Actor Information in Description

**Wrong:**
```typescript
description: `Admin certified CRW-006 for SRV-001`
description: `Crew CRW-006 created Product Order CEN-010-PO-001`
```

**Why:** The actor role is shown via color coding, and the actor ID is available in metadata.

**Right:**
```typescript
description: `Certified CRW-006 for SRV-001`
description: `Created Product Order CEN-010-PO-001`
```

### ❌ Personalizing in recordActivity()

**Wrong:**
```typescript
// Don't personalize at creation time
const description = actorId === viewerId
  ? `You created order ${orderId}`
  : `${actorId} created order ${orderId}`;

await recordActivity({ description, ... });
```

**Why:** The activity is stored once but viewed by many users. Personalization must happen during retrieval.

**Right:**
```typescript
// Record canonical description
await recordActivity({
  description: `Created order ${orderId}`,
  // ...
});

// Personalize in mapActivityRow() during retrieval
if (viewerId === row.actor_id) {
  description = `You created order ${orderId}`;
}
```

### ❌ Missing Metadata for Filtering

**Wrong:**
```typescript
await recordActivity({
  activityType: 'crew_assigned_to_center',
  description: `Assigned CRW-006 to CEN-010`,
  actorId: 'ADM-001',
  actorRole: 'admin',
  targetId: 'CEN-010',
  targetType: 'center',
  metadata: {}, // ❌ Missing crewId!
});
```

**Why:** Role-specific filters need metadata to determine visibility.

**Right:**
```typescript
await recordActivity({
  activityType: 'crew_assigned_to_center',
  description: `Assigned CRW-006 to CEN-010`,
  actorId: 'ADM-001',
  actorRole: 'admin',
  targetId: 'CEN-010',
  targetType: 'center',
  metadata: { crewId: 'CRW-006', centerId: 'CEN-010' }, // ✅ Include all relevant IDs
});
```

### ❌ Generic Activity Types

**Wrong:**
```typescript
activityType: 'entity_created'
activityType: 'user_updated'
activityType: 'assignment'
```

**Why:** Too generic for filtering and personalization.

**Right:**
```typescript
activityType: 'order_created'
activityType: 'manager_profile_updated'
activityType: 'crew_assigned_to_center'
```

### ❌ Not Testing Role Visibility

**Common Issue:** Activity is recorded but not visible to expected roles.

**Solution:** For each new activity type, test visibility for:
1. Admin (should always see it)
2. Direct actor (should see it)
3. Related entities (should see it if in their ecosystem)
4. Unrelated entities (should NOT see it)

### ❌ Forgetting to Add Click Handlers

**Common Issue:** Activity appears but isn't clickable.

**Solution:** Add routing logic in `ActivityFeed.tsx:handleActivityClick()` for the new `targetType`.

---

## Key Files Reference

### Backend
- **Activity Writer:** `apps/backend/server/domains/activity/writer.ts`
- **Personalization:** `apps/backend/server/domains/scope/store.ts:149-194` (mapActivityRow)
- **Role Filtering:** `apps/backend/server/domains/scope/store.ts` (get{Role}Activities functions)
- **Example Writers:**
  - Orders: `apps/backend/server/domains/orders/store.ts:1911`
  - Certifications: `apps/backend/server/domains/catalog/routes.fastify.ts:484`
  - Archive: `apps/backend/server/domains/archive/store.ts`
  - Assignments: `apps/backend/server/domains/assignments/store.ts`
  - Inventory: `apps/backend/server/domains/inventory/store.ts`

### Frontend
- **Activity Display:** `packages/domain-widgets/src/activity/RecentActivity/ActivityItem.tsx`
- **Click Routing:** `apps/frontend/src/components/ActivityFeed.tsx`
- **Color Scheme:** `packages/domain-widgets/src/activity/RecentActivity/ActivityItem.tsx:14-51`

---

## Summary

The Activity Feed system uses a four-stage pipeline:

1. **Creation** - Record canonical activities with `recordActivity()`
2. **Storage** - Store in `system_activity` table with actor, target, and metadata
3. **Filtering** - Apply role-based scoping and viewer-based personalization
4. **Display** - Render with role-based color coding and smart click routing

**Key Takeaway:** Activity descriptions should focus on WHAT happened, not WHO did it. The visual design (color-coded cards) and actor fields handle the WHO. Personalization adds viewer-specific context during retrieval, not at creation time.

---

**Questions or Issues?** Refer to the example patterns above or check the key files reference section for implementation details.
