# Delete/Archive Flow Implementation

## Overview
Complete implementation of soft delete, archive, restore, and hard delete functionality for the CKS Portal user management system.

## Database Schema Changes

### Migration: `20250924_add_archive_columns.sql`
Added archive support columns to all user tables:
- `archived_at` - Timestamp when entity was archived
- `archived_by` - User who performed the archive
- `archive_reason` - Optional reason for archiving
- `restored_at` - Timestamp of last restoration
- `restored_by` - User who restored the entity
- `deletion_scheduled` - Auto-purge date (30 days after archive)

### New Table: `archive_relationships`
Stores parent-child relationships before deletion for potential restoration:
- `entity_type` - Type of entity (manager, contractor, etc.)
- `entity_id` - ID of the archived entity
- `parent_type` - Type of parent entity
- `parent_id` - ID of parent entity
- `relationship_data` - Additional metadata (JSONB)

## Backend Implementation

### Archive Store (`apps/backend/server/domains/archive/store.ts`)

#### Key Functions:
- **`archiveEntity()`** - Soft deletes entity and unassigns children
- **`restoreEntity()`** - Restores entity to unassigned bucket
- **`hardDeleteEntity()`** - Permanently deletes with safety checks
- **`listArchivedEntities()`** - Lists all archived entities
- **`getArchivedRelationships()`** - Gets stored relationships

#### Process Flow:
1. Store relationships before archiving
2. Unassign all children (move to unassigned bucket)
3. Set archive fields on entity
4. Schedule for auto-deletion in 30 days

### API Routes (`apps/backend/server/domains/archive/routes.fastify.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/archive/list` | GET | List archived entities |
| `/api/archive/delete` | POST | Archive (soft delete) entity |
| `/api/archive/restore` | POST | Restore entity from archive |
| `/api/archive/relationships/:type/:id` | GET | Get stored relationships |
| `/api/archive/hard-delete` | DELETE | Permanently delete entity |
| `/api/archive/batch-delete` | POST | Batch archive operations |

## Frontend Integration

### AdminHub Directory View
- **Location**: `apps/frontend/src/hubs/AdminHub.tsx`
- **Feature**: View button → ActionModal → Delete Account option
- **Process**:
  1. Click View on any entity in directory
  2. Select "Delete Account" from modal
  3. Confirm archive action
  4. Entity moves to archive, children unassigned

### Archive Section
- **Location**: `packages/domain-widgets/src/admin/ArchiveSection.tsx`
- **Features**:
  - View archived entities by type (tabs)
  - Search and filter archived items
  - View button with options:
    - Restore to Unassigned
    - View Relationships
    - Permanently Delete
  - Shows scheduled deletion dates

## User Flow

### 1. Deleting an Entity
```
Directory → View → Delete Account → Confirm
   ↓
Entity archived (soft delete)
   ↓
Children moved to unassigned bucket
   ↓
Parent relationships unchanged
```

### 2. Restoring an Entity
```
Archive → View → Restore
   ↓
Entity moved to unassigned bucket
   ↓
Must manually reassign to parent
   ↓
Must manually assign children
```

### 3. Permanent Deletion
```
Archive → View → Permanently Delete
   ↓
Type "DELETE" to confirm
   ↓
Entity permanently removed
   ↓
Cannot be undone
```

## Relationship Handling

### Hierarchy:
```
Manager
  └── Contractor
      └── Customer
          └── Center
              └── Crew
```

### On Delete:
- **Children**: Automatically unassigned (moved to unassigned bucket)
- **Parent**: Relationship remains intact (no change)
- **Example**: Deleting a Customer:
  - Centers below become unassigned
  - Contractor above keeps their Manager

### On Restore:
- Entity goes to unassigned bucket
- Previous relationships stored but not auto-restored
- Manual reassignment required

## Safety Features

1. **Soft Delete by Default**
   - 30-day grace period
   - Can be restored anytime

2. **Confirmation Prompts**
   - Archive confirmation dialog
   - Hard delete requires typing "DELETE"

3. **Child Protection**
   - Children never deleted, only unassigned
   - Can be reassigned after parent deletion

4. **Relationship Tracking**
   - Stores relationships before deletion
   - Available for reference during restoration

5. **Audit Trail**
   - All actions logged to system_activity
   - Tracks who performed action and when

## API Client

### Location: `apps/frontend/src/shared/api/archive.ts`

```typescript
archiveAPI.archiveEntity(type, id, reason?)
archiveAPI.restoreEntity(type, id)
archiveAPI.hardDelete(type, id, reason)
archiveAPI.listArchived(type?, limit?)
archiveAPI.getRelationships(type, id)
archiveAPI.batchArchive(entities, reason?)
```

## Future Enhancements

1. **Automated Cleanup**
   - Cron job for scheduled deletions
   - Configurable retention periods

2. **Bulk Operations**
   - Select multiple entities
   - Batch archive/restore

3. **Relationship Restoration**
   - Auto-restore relationships option
   - Relationship conflict resolution

4. **Enhanced Audit**
   - Detailed change tracking
   - Restoration history

## Testing Checklist

- [ ] Delete user with no children
- [ ] Delete user with children (verify unassignment)
- [ ] Delete user with parent (verify parent unchanged)
- [ ] Restore archived user
- [ ] Permanently delete from archive
- [ ] View stored relationships
- [ ] Search archived entities
- [ ] Verify 30-day scheduling
- [ ] Test confirmation dialogs
- [ ] Verify activity logging# Delete/Archive Flow (Update 2025-11-02)

This update reflects recent changes to centralize and modularize archive/restore/delete across entities, and to tolerate legacy order ID formats.

- Orders now use the centralized archive system exclusively and open via the universal modal (ID-first) from Admin Directory.
- Legacy order IDs like …-PO-11 map to …-PO-011 during archive/restore/delete.
- Frontend actions (useEntityActions) invalidate directory + /archive/list caches and dispatch cks:archive:updated to ensure immediate UI refresh; modals auto-close on success via closeOnSuccess in adapters.
- Known gap: Central hardDelete must cascade delete dependent rows (e.g., order_items, service crew/training/procedures, and legacy product tables) before removing the primary row to avoid FK errors on existing archived data.

Next steps: Implement per-entity cascade cleanup inside hardDeleteEntity to fully resolve FK issues with historical data.
