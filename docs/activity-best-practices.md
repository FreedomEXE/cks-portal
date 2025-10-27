# Activity System Best Practices

**Philosophy:** Activities are atomic facts. Descriptions should be concise, ID-based, and context-aware.

---

## Core Principles

### 1. **IDs Tell the Story**
- Entity IDs are prefixed (MGR-012, SRV-001, CTR-005)
- Prefixes make entity types obvious
- NEVER repeat entity type in description: ❌ "Archived Manager MGR-012" → ✅ "Archived MGR-012"

### 2. **Context Determines Verbosity**
- **Recent Activity Feed**: Include action verb (users scanning chronologically)
  - Format: `[Action] [ID(s)]`
  - Example: `Certified MGR-012 for SRV-001`
- **Entity Timeline/History**: ID only (context clear from timeline UI)
  - Format: `[ID(s)]`
  - Example: `MGR-012 for SRV-001`

### 3. **Viewer-Relative Personalization**
- Generic description stored in DB
- Frontend or backend personalizes based on viewer
- Example: DB stores `Certified MGR-012 for SRV-001`
  - Admin sees: `Certified MGR-012 for SRV-001`
  - MGR-012 sees: `Certified you for SRV-001`

---

## Activity Description Format

### Standard Format
```
[Action] [Subject ID] [Preposition] [Object ID]
```

### Examples

#### Creation Events
- ✅ `Created MGR-012`
- ✅ `Created SRV-001`
- ❌ `Created Manager MGR-012`
- ❌ `Manager MGR-012 was created`

#### Assignment Events
- ✅ `Assigned CTR-005 to MGR-012`
- ❌ `Assigned Contractor CTR-005 to Manager MGR-012`
- ❌ `CTR-005 has been assigned to MGR-012`

#### Lifecycle Events
- ✅ `Archived MGR-012`
- ✅ `Restored SRV-001`
- ✅ `Deleted CTR-005`
- ❌ `Archived Manager MGR-012`
- ❌ `Permanently Deleted CatalogService SRV-001`

#### Certification Events
- ✅ `Certified MGR-012 for SRV-001`
- ✅ `Uncertified MGR-012 for SRV-001`
- ❌ `MGR-012 certified for Lawn Mowing (manager)`
- ❌ `MGR-012 removed from SRV-001 certifications`

#### Status Change Events
- ✅ `Completed ORD-12345`
- ✅ `Cancelled SVC-001`
- ✅ `Delivered ORD-12345`
- ❌ `Order ORD-12345 completed`
- ❌ `Service SVC-001 was cancelled`

---

## Implementation Guidelines

### Recording Activities

```typescript
// ✅ Good: Concise, ID-based
await recordActivity({
  activityType: 'catalog_service_certified',
  description: `Certified ${userId} for ${serviceId}`,
  actorId: admin.cksCode,
  actorRole: 'admin',
  targetId: serviceId,
  targetType: 'catalogService',
  metadata: { userId, role, serviceName }, // Store extra data for personalization
});

// ❌ Bad: Verbose, redundant entity types
await recordActivity({
  activityType: 'catalog_service_certified',
  description: `Manager ${userId} certified for catalog service ${serviceName} (${role})`,
  // ...
});
```

### Metadata Usage

**Store in metadata, NOT description:**
- Entity names (for personalization or tooltips)
- Role types
- Additional context
- Relationship references

```typescript
metadata: {
  userId: 'MGR-012',        // For filtering/personalization
  serviceName: 'Lawn Mowing', // For tooltips or detailed views
  role: 'manager',          // For filtering
}
```

### Timeline vs Feed (UI Polishing – 2025‑10‑27)

- Timeline (History) shows the action in the badge and only IDs in the text.
  - Examples: `SRV-001`, `CUS-015 to CON-010`, `MGR-012 for SRV-001`
- Recent Activity feed shows the action verb in the message.
  - Examples: `Seeded SRV-001`, `Assigned CUS-015 to CON-010`, `Certified MGR-012 for SRV-001`
- Badge color and label rules:
  - Check for "decertified" before "certified" when computing colors/labels, since "decertified" contains "certified" as a substring.
  - Assignment badges normalize to "Assigned" across all variants.

### Dev/Build Notes (UI packages)

- UI components live in `packages/ui` and `packages/domain-widgets`. Rebuild them if timeline/feed rendering changes:
  - `pnpm rebuild:ui` (root) builds both packages.
  - For live watch during dev: `pnpm dev:ui` and run frontend dev in a separate terminal.

### Activity Type Naming

```
[entity]_[action]
```

**Examples:**
- `catalog_service_created`
- `catalog_service_certified`
- `catalog_service_archived`
- `order_completed`
- `crew_assigned_to_center`

**Rules:**
- Use snake_case
- Use past tense
- Be specific (not just `assigned`, but `crew_assigned_to_center`)

---

## RBAC Filtering

### Admin Activities (Visible to Admins Only)
- Archive events (`*_archived`)
- Delete events (`*_deleted`, `*_hard_deleted`)
- Restore events (`*_restored`)
- System administration changes

### User Activities (Visible to Affected Users)
- Creation events for catalog items
- Assignments where they're involved
- Certifications affecting them
- Status changes for their ecosystem entities

### Filtering Pattern

```typescript
// Admin sees everything
WHERE activity_type NOT LIKE 'internal_%'

// User sees filtered subset
WHERE (
  -- Show creation events for catalog items
  (activity_type = 'catalog_service_created')
  OR
  -- Show certifications affecting YOU
  (
    activity_type IN ('catalog_service_certified', 'catalog_service_decertified')
    AND metadata ? 'userId' AND UPPER(metadata->>'userId') = $viewerId
  )
  OR
  -- Show assignments where you're involved
  (activity_type LIKE '%_assigned%' AND (target_id = $viewerId OR actor_id = $viewerId))
  -- etc.
)
AND activity_type NOT LIKE '%_archived'
AND activity_type NOT LIKE '%_deleted'
AND activity_type NOT LIKE '%_restored'
```

---

## Timeline vs Activity Feed Display

### Timeline (Entity History Tab)
**Context:** User is viewing a specific entity's lifecycle
**Format:** ID only (action implied by timeline segment)

```
Timeline for SRV-001
├─ 2025-01-15  SRV-001                     (created)
├─ 2025-01-20  MGR-012 for SRV-001         (certified)
├─ 2025-02-01  MGR-012 for SRV-001         (decertified)
├─ 2025-03-01  SRV-001                     (archived)
└─ 2025-03-15  SRV-001                     (restored)
```

### Activity Feed (Recent Activity)
**Context:** User scanning chronological events across entities
**Format:** Action + ID (need context for each item)

```
Recent Activity
├─ Created SRV-001
├─ Certified MGR-012 for SRV-001
├─ Uncertified MGR-012 for SRV-001
├─ Archived SRV-001
└─ Restored SRV-001
```

---

## Common Patterns

### Pattern: Direct Action on Single Entity
```
[Action] [ID]

Created MGR-012
Archived SRV-001
Deleted CTR-005
```

### Pattern: Action Between Two Entities
```
[Action] [Subject] [Preposition] [Object]

Assigned CTR-005 to MGR-012
Certified MGR-012 for SRV-001
```

### Pattern: Status Change
```
[NewStatus] [ID]

Completed ORD-12345
Delivered ORD-12345
Cancelled SVC-001
```

---

## Anti-Patterns to Avoid

### ❌ Verbose Entity Types
```
Archived Manager MGR-012        → Archived MGR-012
Created CatalogService SRV-001  → Created SRV-001
```

### ❌ Passive Voice
```
Manager MGR-012 was created     → Created MGR-012
Order ORD-123 has been delivered → Delivered ORD-123
```

### ❌ Unnecessary Details in Description
```
MGR-012 certified for Lawn Mowing (manager) → Certified MGR-012 for SRV-001
// Store "Lawn Mowing" and "manager" in metadata instead
```

### ❌ Inconsistent Formats
```
Assigned CTR-005 to MGR-012
MGR-012 assigned to territory    → Assigned MGR-012 to TERR-EAST
// Pick one format and stick to it
```

---

## Testing Checklist

When implementing new activity types:

- [ ] Description follows `[Action] [ID(s)]` format
- [ ] No redundant entity type labels
- [ ] Metadata includes any extra context needed
- [ ] Activity type uses snake_case past tense
- [ ] RBAC filtering considers who should see this
- [ ] Timeline view works with ID-only format
- [ ] Activity feed works with action + ID format
- [ ] Personalization logic handles viewer context
- [ ] Activity dismissal/clearing works correctly

---

## Future Considerations

### Not Yet Implemented (TBD)
- Reports (`report_created`, `report_resolved`, `report_acknowledged`)
- Feedback (`feedback_created`, `feedback_acknowledged`)
- Support tickets (`support_ticket_created`, `support_ticket_updated`)
- Product lifecycle events
- Inventory events

When implementing these, follow the patterns above and update this document.

---

## Summary

**Golden Rule:** Write descriptions like you're announcing facts on a command line.

- ✅ `Certified MGR-012 for SRV-001`
- ✅ `Assigned CTR-005 to MGR-012`
- ✅ `Archived SRV-001`

**Not like you're writing a novel:**

- ❌ `Manager MGR-012 has been successfully certified for the catalog service named Lawn Mowing with the service ID SRV-001 under the manager role`

Keep it concise. IDs tell the story.
