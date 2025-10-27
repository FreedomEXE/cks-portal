# Activity Description Migration Specification

**Objective:** Update all existing activity descriptions in the database to use concise, ID-based format.

**Principle:** Remove redundant entity type labels since IDs are prefixed (MGR-, SRV-, etc.)

---

## Format Rules

### Recent Activity vs Timeline/History
- **Recent Activity**: Include action verb (users scanning a feed)
- **Timeline/History**: ID only (context is clear from the timeline view)

---

## Activity Type Mappings

### 1. Creation Events

**Current Format:**
- `Created Manager MGR-012`
- `Created Contractor CTR-005`
- `Created Customer CUS-100`
- `Created Center CEN-050`
- `Created Crew CREW-200`
- `Created Warehouse WHS-001`
- `Created Order ORD-12345`
- `Created Service SVC-001`
- `Created CatalogService SRV-001`
- `Created Report RPT-001`
- `Created Feedback FBK-001`

**Target Format:**
- Recent Activity: `Created MGR-012`
- Timeline: `MGR-012`

**Activity Types:**
- `manager_created`
- `contractor_created`
- `customer_created`
- `center_created`
- `crew_created`
- `warehouse_created`
- `order_created`
- `service_created`
- `catalog_service_created`
- `report_created`
- `feedback_created`

**Migration Pattern:**
```sql
UPDATE system_activity
SET description = REGEXP_REPLACE(
  description,
  '^Created \w+ ([\w-]+)$',
  'Created \1'
)
WHERE activity_type LIKE '%_created';
```

---

### 2. Assignment Events

**Current Format:**
- `Assigned Contractor CTR-005 to Manager MGR-012`
- `Assigned Customer CUS-100 to Contractor CTR-005`
- `Assigned Center CEN-050 to Customer CUS-100`
- `Assigned Crew CREW-200 to Center CEN-050`
- `Assigned Order ORD-12345 to Warehouse WHS-001`

**Target Format:**
- Recent Activity: `Assigned CTR-005 to MGR-012`
- Timeline: `CTR-005 to MGR-012`

**Activity Types:**
- `assignment_made`
- `manager_assigned`
- `contractor_assigned_to_manager`
- `customer_assigned_to_contractor`
- `center_assigned_to_customer`
- `crew_assigned_to_center`
- `order_assigned_to_warehouse`

**Migration Pattern:**
```sql
UPDATE system_activity
SET description = REGEXP_REPLACE(
  description,
  '^Assigned \w+ ([\w-]+) to \w+ ([\w-]+)$',
  'Assigned \1 to \2'
)
WHERE activity_type LIKE '%assigned%';
```

---

### 3. Archived Events

**Current Format:**
- `Archived Manager MGR-012`
- `Archived Contractor CTR-005`
- `Archived Customer CUS-100`
- `Archived CatalogService SRV-001`
- `Archived Service SVC-001`

**Target Format:**
- Recent Activity: `Archived MGR-012`
- Timeline: `MGR-012`

**Activity Types:**
- `manager_archived`
- `contractor_archived`
- `customer_archived`
- `center_archived`
- `crew_archived`
- `warehouse_archived`
- `service_archived`
- `catalogService_archived`
- `product_archived`
- `order_archived`
- `report_archived`
- `feedback_archived`

**Migration Pattern:**
```sql
UPDATE system_activity
SET description = REGEXP_REPLACE(
  description,
  '^Archived \w+ ([\w-]+)$',
  'Archived \1'
)
WHERE activity_type LIKE '%_archived';
```

---

### 4. Restored Events

**Current Format:**
- `Restored Manager MGR-012`
- `Restored Contractor CTR-005`
- `Restored CatalogService SRV-001`

**Target Format:**
- Recent Activity: `Restored MGR-012`
- Timeline: `MGR-012`

**Activity Types:**
- `manager_restored`
- `contractor_restored`
- `customer_restored`
- `center_restored`
- `crew_restored`
- `warehouse_restored`
- `service_restored`
- `catalogService_restored`
- `product_restored`
- `order_restored`
- `report_restored`
- `feedback_restored`

**Migration Pattern:**
```sql
UPDATE system_activity
SET description = REGEXP_REPLACE(
  description,
  '^Restored \w+ ([\w-]+)$',
  'Restored \1'
)
WHERE activity_type LIKE '%_restored';
```

---

### 5. Deletion Events

**Current Format:**
- `Permanently Deleted Manager MGR-012`
- `Permanently Deleted CatalogService SRV-001`
- `Deleted Manager MGR-012`

**Target Format:**
- Recent Activity: `Deleted MGR-012`
- Timeline: `MGR-012`

**Activity Types:**
- `manager_deleted`
- `manager_hard_deleted`
- `contractor_deleted`
- `contractor_hard_deleted`
- `customer_deleted`
- `customer_hard_deleted`
- `center_deleted`
- `center_hard_deleted`
- `crew_deleted`
- `crew_hard_deleted`
- `warehouse_deleted`
- `warehouse_hard_deleted`
- `service_deleted`
- `service_hard_deleted`
- `catalogService_deleted`
- `catalogService_hard_deleted`
- `product_deleted`
- `product_hard_deleted`
- `order_deleted`
- `order_hard_deleted`

**Migration Pattern:**
```sql
UPDATE system_activity
SET description = REGEXP_REPLACE(
  description,
  '^(Permanently )?Deleted \w+ ([\w-]+)$',
  'Deleted \2'
)
WHERE activity_type LIKE '%_deleted' OR activity_type LIKE '%_hard_deleted';
```

---

### 6. Seed Events

**Current Format:**
- `Seeded CatalogService SRV-001`
- `Seeded Product PRD-001`

**Target Format:**
- Recent Activity: `Seeded SRV-001`
- Timeline: `SRV-001`

**Note:** These are from the backfill script GPT5 created

**Migration Pattern:**
```sql
UPDATE system_activity
SET description = REGEXP_REPLACE(
  description,
  '^Seeded \w+ ([\w-]+)$',
  'Seeded \1'
)
WHERE description LIKE 'Seeded %';
```

---

### 7. Certification Events

**Current Format:**
- `MGR-012 certified for Lawn Mowing (manager)`
- `MGR-012 certified for catalog service SRV-001 (manager)`
- `MGR-012 removed from Lawn Mowing certifications`

**Target Format:**
- Recent Activity: `Certified MGR-012 for SRV-001`
- Timeline: `MGR-012 for SRV-001`

**Activity Types:**
- `catalog_service_certified`
- `catalog_service_decertified`

**Migration Pattern:**
```sql
-- Certified events: Extract user ID and service ID
UPDATE system_activity
SET description = CONCAT('Certified ', target_id, ' for ',
  REGEXP_REPLACE(description, '^(\w+-\d+) certified for.*$', '\1'))
WHERE activity_type = 'catalog_service_certified';

-- Decertified events
UPDATE system_activity
SET description = CONCAT('Uncertified ', target_id, ' for ',
  REGEXP_REPLACE(description, '^(\w+-\d+) removed from.*$', '\1'))
WHERE activity_type = 'catalog_service_decertified';
```

---

### 8. Order Lifecycle Events

**Current Format:**
- `Order ORD-12345 delivered`
- `Order ORD-12345 completed`
- `Order ORD-12345 accepted`
- `Order ORD-12345 approved`
- `Order ORD-12345 cancelled`
- `Order ORD-12345 rejected`
- `Order ORD-12345 failed`
- `Order ORD-12345 updated`

**Target Format:**
- Recent Activity: `Delivered ORD-12345`
- Timeline: `ORD-12345`

**Activity Types:**
- `order_delivered`
- `order_completed`
- `order_accepted`
- `order_approved`
- `order_cancelled`
- `order_rejected`
- `order_failed`
- `order_updated`

**Migration Pattern:**
```sql
UPDATE system_activity
SET description = REGEXP_REPLACE(
  description,
  '^Order ([\w-]+) (\w+)$',
  '\2 \1'
)
WHERE activity_type LIKE 'order_%';
```

---

### 9. Service Lifecycle Events

**Current Format:**
- `Service SVC-001 completed`
- `Service SVC-001 cancelled`
- `Service SVC-001 updated`

**Target Format:**
- Recent Activity: `Completed SVC-001`
- Timeline: `SVC-001`

**Activity Types:**
- `service_completed`
- `service_cancelled`
- `service_updated`

**Migration Pattern:**
```sql
UPDATE system_activity
SET description = REGEXP_REPLACE(
  description,
  '^Service ([\w-]+) (\w+)$',
  '\2 \1'
)
WHERE activity_type LIKE 'service_%'
  AND activity_type NOT IN ('service_created', 'service_archived', 'service_deleted', 'service_restored');
```

---

### 10. Report Events

**Current Format:**
- `Report RPT-001 resolved`
- `Report RPT-001 acknowledged`

**Target Format:**
- Recent Activity: `Resolved RPT-001`
- Timeline: `RPT-001`

**Activity Types:**
- `report_resolved`
- `report_acknowledged`

**Migration Pattern:**
```sql
UPDATE system_activity
SET description = REGEXP_REPLACE(
  description,
  '^Report ([\w-]+) (\w+)$',
  '\2 \1'
)
WHERE activity_type LIKE 'report_%'
  AND activity_type NOT IN ('report_created', 'report_archived', 'report_deleted');
```

---

### 11. Feedback Events

**Current Format:**
- `Feedback FBK-001 acknowledged`

**Target Format:**
- Recent Activity: `Acknowledged FBK-001`
- Timeline: `FBK-001`

**Activity Types:**
- `feedback_acknowledged`

**Migration Pattern:**
```sql
UPDATE system_activity
SET description = REGEXP_REPLACE(
  description,
  '^Feedback ([\w-]+) (\w+)$',
  '\2 \1'
)
WHERE activity_type = 'feedback_acknowledged';
```

---

### 12. Profile Events

**Current Format:**
- `Profile MGR-012 updated`

**Target Format:**
- Recent Activity: `Updated MGR-012`
- Timeline: `MGR-012`

**Activity Types:**
- `profile_updated`

**Migration Pattern:**
```sql
UPDATE system_activity
SET description = REGEXP_REPLACE(
  description,
  '^Profile ([\w-]+) updated$',
  'Updated \1'
)
WHERE activity_type = 'profile_updated';
```

---

## Implementation Notes

1. **Order of execution matters**: Run certification migrations first (most complex regex)
2. **Test on a sample first**: Use `WHERE activity_id IN (SELECT activity_id FROM system_activity LIMIT 100)` for testing
3. **Backup before running**: This modifies existing data
4. **Run in transaction**: Wrap all updates in BEGIN/COMMIT for rollback safety
5. **PostgreSQL regex syntax**: Uses `REGEXP_REPLACE` (not MySQL syntax)

---

## Migration Script Structure

```sql
BEGIN;

-- 1. Certification events (complex extraction)
UPDATE system_activity...

-- 2. Creation events
UPDATE system_activity...

-- 3. Assignment events
UPDATE system_activity...

-- 4. Archived events
UPDATE system_activity...

-- 5. Restored events
UPDATE system_activity...

-- 6. Deletion events
UPDATE system_activity...

-- 7. Seed events
UPDATE system_activity...

-- 8-12. Other lifecycle events
UPDATE system_activity...

COMMIT;
```

---

## Events Excluded from Migration (Not Yet Implemented)

The following activity types exist in the codebase but are not yet fully implemented. Skip these in migration:

- `report_created`, `report_resolved`, `report_acknowledged`
- `feedback_created`, `feedback_acknowledged`
- `support_ticket_updated`

These will follow the same patterns when implemented.

---

## Assignment Events Clarification

All assignment activity types should use the same format:
- `assignment_made` → Same as specific assignment types
- `manager_assigned` → Same as `contractor_assigned_to_manager`

**Unified Pattern:**
```sql
UPDATE system_activity
SET description = REGEXP_REPLACE(
  description,
  '^(Assigned )?\w+ ([\w-]+) to \w+ ([\w-]+)$',
  'Assigned \2 to \3'
)
WHERE activity_type LIKE '%assigned%' OR activity_type = 'assignment_made';
```

---

## Ready for Implementation

This spec covers all currently active activity types in the system. GPT5 can proceed with implementation.
