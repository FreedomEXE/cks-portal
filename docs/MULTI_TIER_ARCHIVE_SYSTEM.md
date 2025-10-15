# Multi-Tier Archive System Design

## Overview
A three-tier visibility system for orders/data lifecycle with automatic archiving and manual deletion.

---

## User's Requirements

1. ✅ **Keep manual hard delete** - Admins can manually delete when needed
2. ✅ **Auto-archive after X days** - System automatically archives old completed/cancelled orders
3. ✅ **"System" actor for auto-archives** - Activity shows "System archived order..." (not "Admin")
4. ✅ **Prevent user archive bloat** - Old archived items disappear from user view but stay in admin view

---

## Proposed Three-Tier System

### Tier 1: Active (Visible to All)
```
Order Status: pending/in-progress/delivered/etc.
Created: < X days ago (configurable, e.g., 30 days)
Visibility:
  - Users: YES (in Orders section)
  - Admin: YES (in Directory)
Activity: "Manager created order MGR-004-PO-123"
```

### Tier 2: Auto-Archived - Recent (Greyed for Users)
```
Order Status: completed/cancelled/delivered/rejected
Auto-archived: X to Y days ago (e.g., 30-90 days)
Visibility:
  - Users: YES (greyed in Archive section)
  - Admin: YES (in Archive section)
Activity: "System archived order MGR-004-PO-123" ← Shows "System" not "Admin"
```

### Tier 3: Auto-Archived - Old (Admin Only)
```
Order Status: completed/cancelled/delivered/rejected
Auto-archived: > Y days ago (e.g., 90+ days)
Visibility:
  - Users: NO (hidden from their Archive section)
  - Admin: YES (still in Archive section)
Activity: Same as Tier 2
```

### Tier 4: Hard Deleted (Manual Only)
```
Deleted by: Admin manually clicks "Hard Delete"
Visibility:
  - Users: NO (tombstone modal if clicking old activity)
  - Admin: NO (tombstone modal if clicking old activity)
Activity: "Admin permanently deleted order MGR-004-PO-123"
Snapshot: Stored in activity metadata
```

---

## Implementation Details

### Auto-Archive Logic

**Trigger:** Cron job runs daily (or every hour)

**Criteria for Auto-Archive:**

**Orders:**
```sql
SELECT order_id, order_type, status
FROM orders
WHERE archived_at IS NULL  -- Not already archived
  AND (
    -- Product orders: 30 days after delivery
    (order_type = 'product'
     AND status = 'delivered'
     AND delivery_date < NOW() - INTERVAL '30 days')
    OR
    -- Product orders: 30 days after cancellation/rejection
    (order_type = 'product'
     AND status IN ('cancelled', 'rejected')
     AND updated_at < NOW() - INTERVAL '30 days')
    OR
    -- Service orders: 30 days after completion/cancellation
    (order_type = 'service'
     AND status IN ('completed', 'cancelled')
     AND updated_at < NOW() - INTERVAL '30 days')
  )
```

**Services:**
```sql
SELECT service_id
FROM services
WHERE archived_at IS NULL
  AND status IN ('completed', 'cancelled', 'terminated')
  AND updated_at < NOW() - INTERVAL '30 days'
```

**Reports:**
```sql
SELECT report_id
FROM reports
WHERE archived_at IS NULL
  AND status IN ('resolved', 'closed', 'dismissed')
  AND updated_at < NOW() - INTERVAL '30 days'
```

**Feedback:**
```sql
SELECT feedback_id
FROM feedback
WHERE archived_at IS NULL
  AND status IN ('processed', 'closed', 'archived')
  AND updated_at < NOW() - INTERVAL '30 days'
```

**Action:**
```typescript
async function autoArchiveOldOrders() {
  const oldOrders = await findOrdersToArchive();

  for (const order of oldOrders) {
    // Archive order
    await query(
      `UPDATE orders SET archived_at = NOW() WHERE order_id = $1`,
      [order.order_id]
    );

    // Record activity with "SYSTEM" actor (not "ADMIN")
    // This activity will ONLY appear in Admin feed (Tier-4 filter excludes for users)
    await recordActivity({
      activityType: 'order_archived',
      description: `${order.order_type === 'product' ? 'Product' : 'Service'} order ${order.order_id} archived`,
      actorId: 'SYSTEM',           // ← Key: shows as "System" in Admin activity feed
      actorRole: 'system',          // ← Key: system color in UI (indigo)
      targetId: order.order_id,
      targetType: 'order',
      metadata: {
        orderId: order.order_id,
        orderType: order.order_type,
        autoArchived: true,        // ← Flag to identify system archives
        archivedReason: 'Auto-archived after 30 days',
        // ... hierarchy IDs (customerId, centerId, etc.)
      }
    });
  }
}
```

**Cron Job:**
```typescript
// In server startup or separate cron service
import cron from 'node-cron';

// Run every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Running auto-archive job...');
  await autoArchiveOldOrders();
  console.log('Auto-archive complete');
});
```

---

### User Archive Visibility (Tier 2 vs Tier 3)

**Current User Archive Query** (shows ALL archived):
```sql
SELECT * FROM orders
WHERE archived_at IS NOT NULL
  AND customer_id = 'CUS-015'  -- User's scope
ORDER BY archived_at DESC
```

**Updated Query** (hide old archives from users):
```sql
SELECT * FROM orders
WHERE archived_at IS NOT NULL
  AND archived_at > NOW() - INTERVAL '90 days'  -- ← Only recent archives (Tier 2)
  AND customer_id = 'CUS-015'
ORDER BY archived_at DESC
```

**Admin Archive Query** (shows ALL including Tier 3):
```sql
SELECT * FROM orders
WHERE archived_at IS NOT NULL
ORDER BY archived_at DESC
-- No time filter, admin sees everything
```

---

### Activity Feed - "System" Actor

**New Role Color Mapping:**

```typescript
// In ActivityItem component
const roleColors: Record<string, { bg: string; text: string }> = {
  // ... existing roles ...
  system: {
    bg: '#e0e7ff',      // Light indigo (different from admin grey)
    text: '#3730a3',     // Dark indigo
  },
  // ...
};
```

**Activity Format:**
- Auto-archived: "System archived product order CRW-006-PO-105"
- Manual archived: "Admin archived product order CRW-006-PO-105"
- Hard deleted: "Admin permanently deleted product order MGR-004-PO-999"

---

## Configuration

**Settings (configurable per environment):**

```typescript
// apps/backend/server/config/archive.ts
export const ARCHIVE_CONFIG = {
  // Tier 1 → Tier 2: Auto-archive after X days
  AUTO_ARCHIVE_DAYS: 30,

  // Tier 2 → Tier 3: Hide from users after Y days (admin still sees)
  USER_ARCHIVE_VISIBILITY_DAYS: 90,

  // Tier 3 → Tier 4: Auto-delete after Z days (optional, can be disabled)
  AUTO_DELETE_DAYS: null,  // null = never auto-delete, admin must manually delete

  // What statuses trigger auto-archive
  ARCHIVABLE_STATUSES: ['completed', 'cancelled', 'delivered', 'rejected'],

  // Run cron job schedule
  CRON_SCHEDULE: '0 2 * * *',  // 2 AM daily
};
```

---

## Database Schema Changes Needed

### Add `auto_archived` flag (optional):
```sql
ALTER TABLE orders ADD COLUMN auto_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE services ADD COLUMN auto_archived BOOLEAN DEFAULT FALSE;
-- Repeat for other entity tables
```

**Or** rely on `activity.metadata.autoArchived` flag (no schema change).

---

## User Flows

### Flow 1: Product Order Lifecycle (Auto-Archive)
```
Day 0:   CRW-006 creates product order CRW-006-PO-105
Day 1:   WHS-004 delivers order
Day 2-29: Order shows in "My Orders" (active)
Day 30:  System auto-archives → moves to Archive section (greyed)
         Activity: "System archived product order CRW-006-PO-105"
Day 31-89: Order visible in CRW-006's Archive section (greyed)
Day 90+: Order disappears from CRW-006's view
         Admin still sees in Archive section
```

### Flow 2: Admin Manual Archive
```
Day 0:  MGR-004 creates service order
Day 5:  Admin manually archives (before 30 days)
        Activity: "Admin archived service order MGR-004-SO-200"
        Order appears in Archive section (greyed)
        Stays visible to users for 90 days, then hidden
```

### Flow 3: Admin Manual Delete
```
Day 100: Admin opens Archive section
         Finds old order CEN-010-PO-999 (auto-archived 100 days ago)
         Clicks "Hard Delete" → Confirmation modal
         Order permanently deleted
         Activity: "Admin permanently deleted product order CEN-010-PO-999"
         Snapshot stored in activity metadata
```

---

## Implementation Checklist

### Backend
- [ ] Create `autoArchiveOldOrders()` function (also for services, reports, feedback)
- [ ] Add cron job scheduler (runs daily)
- [ ] Update archive queries to filter by `archived_at` age for non-admin users
- [ ] Add "SYSTEM" actor role to `recordActivity()`
- [ ] Add `autoArchived: true` flag to auto-archive activity metadata
- [ ] Create config file for archive settings
- [ ] **Update Tier-4 filter** to exclude `order_archived` activities with `actorRole = 'system'` from user feeds
  - Users should NOT see "System archived order..." in their activity feed
  - Only admin sees these activities

### Frontend
- [ ] Add "system" role color to ActivityItem
- [ ] Update Archive section queries to respect visibility rules
- [ ] Update Admin Archive section to show all archives
- [ ] Test Tier 2 vs Tier 3 visibility

### Database
- [ ] (Optional) Add `auto_archived` column to entity tables
- [ ] Add index on `archived_at` for performance

### Testing
- [ ] Create order → wait 30 days (or manually set dates) → verify auto-archive
- [ ] Verify "System" appears in activity feed
- [ ] Verify users see Tier 2 archives (30-90 days)
- [ ] Verify users DON'T see Tier 3 archives (90+ days)
- [ ] Verify admin sees ALL archives
- [ ] Test manual hard delete flow

---

## Configuration (FINALIZED)

### 1. Auto-Archive Timing ✅
**30 days after completion/cancellation date**

For each data type:
- **Orders**: 30 days after `delivery_date` (delivered) OR `updated_at` (cancelled/rejected)
- **Services**: 30 days after moved to Service History (completed/cancelled)
- **Reports**: 30 days after resolution/closure
- **Feedback**: 30 days after processed/closed

This aligns with when items naturally move to Archive/History sections.

### 2. User Archive Visibility Window ✅
**90 days** threshold:
- **Tier 2** (visible to users): 0-90 days in archive (greyed but visible)
- **Tier 3** (hidden from users): 90+ days in archive (admin only)

Configurable via `USER_ARCHIVE_VISIBILITY_DAYS`

### 3. Apply to All Entity Types ✅
Auto-archive for **all data types with user archive/history sections**:
- ✅ **Orders** → Archive tab
- ✅ **Services** → Service History tab
- ✅ **Reports** → Archive tab
- ✅ **Feedback** → Archive tab
- ❌ **Users** (manager, contractor, etc.) → Manual archive only

### 4. Activity Feed for Users ✅
**NO** - Don't show "System archived..." activity to users
- Users already see items in Archive/History sections
- Reduces noise in activity feed
- Clicking old activities will redirect to archived item

**YES** - Show "System archived..." in **Admin activity feed only**
- Admin sees "System" at top (not "Admin")
- Indigo color distinguishes from manual admin actions

---

## Advantages of This System

✅ **No data loss** - Nothing auto-deleted, only auto-archived
✅ **Clean user experience** - Old archives disappear from user view
✅ **Admin visibility** - Admins always see everything
✅ **Transparent** - "System" actor shows automation
✅ **Manual control** - Admins can hard delete when needed
✅ **Configurable** - Timing thresholds adjustable
✅ **Scalable** - Archive grows in admin view only, users see recent subset

---

## Next Steps

1. **Confirm design** - User approves three-tier system
2. **Set configuration** - Finalize day thresholds (30 days? 90 days?)
3. **Implement backend** - Auto-archive cron job + visibility filters (~2 hours)
4. **Update frontend** - Archive queries + "system" role color (~1 hour)
5. **Test** - Verify all three tiers work correctly
6. **Then** proceed with critical backend fixes (auth, transactions, etc.)

**User: Does this design match your vision?**
