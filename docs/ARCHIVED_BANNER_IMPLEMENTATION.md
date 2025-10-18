# Archived Banner Implementation - Missing Archive Display

## Problem Statement

**Issue**: Archived orders no longer show the grey "This order has been archived" banner when viewed.

**Root Cause**:
1. `ActionModal` component accepts `archiveMetadata` prop but **never renders it**
2. No `ArchivedBanner` component exists (only `DeletedBanner` exists)
3. `OrderDetailsModal` doesn't support archived state at all

**Evidence**:
- `packages/ui/src/modals/ActionModal/ActionModal.tsx:22-27` - `ArchiveMetadata` interface defined
- `packages/ui/src/modals/ActionModal/ActionModal.tsx:35` - Prop accepted
- `packages/ui/src/modals/ActionModal/ActionModal.tsx:49` - Parameter declared
- **BUT**: No rendering code exists in the component body

## Expected Behavior

When any user views an archived order:
1. **From Order History/Archive tab**: Show grey "Archived" banner
2. **From Recent Activity**: Show grey "Archived" banner
3. Banner should display:
   - Archived timestamp (formatted)
   - Who archived it (CODE - Name format)
   - Optional: Archive reason
   - Optional: Scheduled deletion date (30 days)

## Solution Overview

### Part 1: Create ArchivedBanner Component

**New File**: `packages/ui/src/banners/ArchivedBanner.tsx`

Pattern should match `DeletedBanner.tsx` but with grey color scheme:
- Background: `#f3f4f6` (light grey)
- Border: `#9ca3af` (grey)
- Text: `#374151` (dark grey)

**Full Implementation**:

```tsx
/**
 * ArchivedBanner Component
 *
 * Shows at the top of modals/views to indicate an entity was archived.
 * Displays archive timestamp, actor, and scheduled deletion date.
 *
 * Usage:
 * ```tsx
 * {archiveMetadata && (
 *   <ArchivedBanner
 *     archivedAt={archiveMetadata.archivedAt}
 *     archivedBy={archiveMetadata.archivedBy}
 *     reason={archiveMetadata.reason}
 *     scheduledDeletion={archiveMetadata.scheduledDeletion}
 *     entityType="order"
 *     entityId={order.orderId}
 *   />
 * )}
 * ```
 */

import React from 'react';

export interface ArchivedBannerProps {
  /** ISO timestamp of archive action */
  archivedAt?: string;

  /** User/actor who archived the entity */
  archivedBy?: string;

  /** Optional reason for archiving */
  reason?: string;

  /** ISO timestamp when entity will be permanently deleted */
  scheduledDeletion?: string;

  /** Entity type (order, service, user, etc.) */
  entityType?: string;

  /** Entity ID */
  entityId?: string;

  /** Optional custom message */
  message?: string;
}

export function ArchivedBanner({
  archivedAt,
  archivedBy,
  reason,
  scheduledDeletion,
  entityType = 'entity',
  entityId,
  message,
}: ArchivedBannerProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown date';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formattedArchiveDate = formatDate(archivedAt);
  const formattedDeletionDate = formatDate(scheduledDeletion);
  const actorDisplay = archivedBy || 'Unknown user';

  const defaultMessage = `This ${entityType} has been archived and is scheduled for deletion.`;

  return (
    <div
      style={{
        backgroundColor: '#f3f4f6',
        borderLeft: '4px solid #9ca3af',
        padding: '12px 16px',
        marginBottom: '16px',
        borderRadius: '4px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
        {/* Icon */}
        <div
          style={{
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 3C5 2.44772 5.44772 2 6 2H14C14.5523 2 15 2.44772 15 3V4H17C17.5523 4 18 4.44772 18 5C18 5.55228 17.5523 6 17 6H16V16C16 17.1046 15.1046 18 14 18H6C4.89543 18 4 17.1046 4 16V6H3C2.44772 6 2 5.55228 2 5C2 4.44772 2.44772 4 3 4H5V3Z"
              stroke="#6b7280"
              strokeWidth="1.5"
              fill="none"
            />
            <path d="M8 8V14M12 8V14" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 600,
              color: '#374151',
              marginBottom: '4px',
              fontSize: '14px',
            }}
          >
            Archived {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </div>

          <div style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.5' }}>
            {message || defaultMessage}
          </div>

          {reason && (
            <div
              style={{
                color: '#6b7280',
                fontSize: '13px',
                marginTop: '6px',
                fontStyle: 'italic',
              }}
            >
              <span style={{ fontWeight: 500 }}>Reason:</span> {reason}
            </div>
          )}

          <div
            style={{
              color: '#4b5563',
              fontSize: '12px',
              marginTop: '8px',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <span style={{ fontWeight: 500 }}>Archived:</span>{' '}
              <span>{formattedArchiveDate}</span>
            </div>
            <div>
              <span style={{ fontWeight: 500 }}>By:</span>{' '}
              <span>{actorDisplay}</span>
            </div>
            {scheduledDeletion && (
              <div>
                <span style={{ fontWeight: 500 }}>Scheduled Deletion:</span>{' '}
                <span>{formattedDeletionDate}</span>
              </div>
            )}
            {entityId && (
              <div>
                <span style={{ fontWeight: 500 }}>ID:</span>{' '}
                <span style={{ fontFamily: 'monospace' }}>{entityId}</span>
              </div>
            )}
          </div>

          {scheduledDeletion && (
            <div
              style={{
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#e5e7eb',
                borderRadius: '3px',
                fontSize: '12px',
                color: '#374151',
              }}
            >
              <strong>Note:</strong> This {entityType} will be permanently deleted on{' '}
              {formattedDeletionDate} unless restored.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Part 2: Export ArchivedBanner

**File**: `packages/ui/src/index.ts`

Add export:
```tsx
export { ArchivedBanner } from './banners/ArchivedBanner';
export type { ArchivedBannerProps } from './banners/ArchivedBanner';
```

### Part 3: Update ActionModal to Render Archive Banner

**File**: `packages/ui/src/modals/ActionModal/ActionModal.tsx`

**Changes**:

1. **Import ArchivedBanner** (add to top):
```tsx
import { ArchivedBanner } from '../../banners/ArchivedBanner';
```

2. **Render banner after title** (add after line 118):
```tsx
<h3 id="action-modal-title" style={{
  marginTop: 0,
  marginBottom: '24px',
  fontSize: '18px',
  fontWeight: 600,
  color: '#111827'
}}>
  {title || `Actions for ${entityName}`}
</h3>

{/* NEW: Archive banner */}
{archiveMetadata && (
  <ArchivedBanner
    archivedAt={archiveMetadata.archivedAt}
    archivedBy={archiveMetadata.archivedBy}
    reason={archiveMetadata.reason}
    scheduledDeletion={archiveMetadata.scheduledDeletion}
    entityType="order"
    entityId={entity?.orderId}
  />
)}

<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
  {/* ... rest of component */}
```

### Part 4: Update OrderDetailsModal (Future Enhancement)

**File**: `packages/ui/src/modals/OrderDetailsModal/OrderDetailsModal.tsx`

**Add to interface** (after `isDeleted`):
```tsx
interface OrderDetailsModalProps {
  // ... existing props
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  isArchived?: boolean;        // NEW
  archivedAt?: string;         // NEW
  archivedBy?: string;         // NEW
  archiveReason?: string;      // NEW
  scheduledDeletion?: string;  // NEW
}
```

**Add import**:
```tsx
import { ArchivedBanner } from '../../banners/ArchivedBanner';
```

**Render banner** (after DeletedBanner section, around line 117):
```tsx
{/* Deleted Banner */}
{order.isDeleted && (
  <div style={{ padding: '0 16px', marginTop: '16px' }}>
    <DeletedBanner
      deletedAt={order.deletedAt}
      deletedBy={order.deletedBy}
      entityType="order"
      entityId={order.orderId}
    />
  </div>
)}

{/* NEW: Archived Banner */}
{!order.isDeleted && isArchived && (
  <div style={{ padding: '0 16px', marginTop: '16px' }}>
    <ArchivedBanner
      archivedAt={archivedAt}
      archivedBy={archivedBy}
      reason={archiveReason}
      scheduledDeletion={scheduledDeletion}
      entityType="order"
      entityId={order.orderId}
    />
  </div>
)}
```

**Note**: Part 4 is optional for now - archived orders currently go through ActionModal which will be fixed in Part 3.

## Files to Modify

1. **packages/ui/src/banners/ArchivedBanner.tsx** (NEW FILE)
   - Create component similar to DeletedBanner but grey color scheme
   - Display archive metadata with formatted dates

2. **packages/ui/src/index.ts**
   - Export ArchivedBanner and ArchivedBannerProps

3. **packages/ui/src/modals/ActionModal/ActionModal.tsx**
   - Import ArchivedBanner
   - Render banner when archiveMetadata prop is provided
   - Place between title and action buttons

4. **packages/ui/src/modals/OrderDetailsModal/OrderDetailsModal.tsx** (OPTIONAL)
   - Add archive props to interface
   - Import ArchivedBanner
   - Render when isArchived is true

## Testing Checklist

### Test 1: AdminHub Archive View
- [ ] Go to AdminHub → Archive tab → Orders
- [ ] Click "View" on an archived order
- [ ] ActionModal should show grey "Archived Order" banner
- [ ] Banner shows: Archived date, Archived by, Scheduled deletion
- [ ] Banner appears above action buttons

### Test 2: Recent Activity (Admin)
- [ ] Click on archived order in Recent Activity
- [ ] ActionModal opens with "View Details" button
- [ ] Click "View Details"
- [ ] OrderDetailsModal should show archive banner (if Part 4 implemented)

### Test 3: Recent Activity (Non-Admin Users)
- [ ] Go to CrewHub/ManagerHub/etc
- [ ] Click archived order in Recent Activity
- [ ] OrderActionModal should show archive banner (if we add support)
- [ ] Or falls back to OrderDetailsModal with banner

### Test 4: Archive Metadata Display
- [ ] Archive banner shows correct format:
  - "Archived Order" heading
  - "Archived: Oct 16, 2025, 03:45 PM"
  - "By: MGR-001 - Mario"
  - "Scheduled Deletion: Nov 15, 2025, 03:45 PM"
  - Note: "This order will be permanently deleted on... unless restored"

## Expected Outcome

**Before**:
- ❌ Archived orders show ActionModal with no archive info
- ❌ Users can't see when/why order was archived
- ❌ No visual indication that order is in archive state

**After**:
- ✅ Archived orders show grey banner at top of ActionModal
- ✅ Banner displays archived date, actor, and scheduled deletion
- ✅ Optional reason displayed if provided
- ✅ Clear visual distinction from active vs deleted vs archived orders

## Color Scheme Reference

**DeletedBanner** (Red - Permanent):
- Background: `#fee2e2` (light red)
- Border: `#dc2626` (red)
- Text: `#991b1b` / `#7f1d1d` (dark red shades)

**ArchivedBanner** (Grey - Temporary):
- Background: `#f3f4f6` (light grey)
- Border: `#9ca3af` (grey)
- Text: `#374151` / `#6b7280` (dark grey shades)

This creates clear visual distinction:
- Red = Deleted (permanent, cannot restore in most cases)
- Grey = Archived (temporary, can be restored within 30 days)

## Build Verification

After changes:
```bash
pnpm build
```

Should pass with no TypeScript errors.

## Notes

- ArchivedBanner follows same pattern as DeletedBanner for consistency
- Grey color scheme indicates "soft delete" / temporary state
- Archive metadata is already being passed from ArchiveSection.tsx (lines 470-475)
- ActionModal already has the formatDate helper function
- No hub changes needed - this is purely a UI component fix

## Success Criteria

✅ ArchivedBanner component created and exported
✅ ActionModal renders archive banner when archiveMetadata provided
✅ Grey color scheme distinguishes archived from deleted
✅ All metadata fields displayed (date, actor, reason, scheduled deletion)
✅ Build passes with no errors
✅ Archived orders show banner in all viewing contexts
