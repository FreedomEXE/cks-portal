# Order Data Model – Addendum (2025-09-29)

## Archive Support (Orders)

Orders now support soft delete, restore, and hard delete using archive fields on the base `orders` table. Admin Directory queries exclude archived rows; archived orders are visible via the Archive UI.

Fields on `orders` (additive):
- `archived_at TIMESTAMP`
- `archived_by VARCHAR(50)`
- `archive_reason TEXT`
- `deletion_scheduled TIMESTAMP`
- `restored_at TIMESTAMP`
- `restored_by VARCHAR(50)`

Related routes:
- `GET    /api/archive/list`
- `POST   /api/archive/delete` (soft delete)
- `POST   /api/archive/restore`
- `DELETE /api/archive/hard-delete`

Directory behavior:
- All Directory lists (Services, Products, Orders, Reports, Feedback) filter with `WHERE archived_at IS NULL`.

## Ongoing Orders (Post‑MVP Placeholder)

We will add a minimal recurring shape to orders to distinguish ongoing vs one‑time in listings, while deferring automation:

Planned fields on `orders`:
- `is_recurring BOOLEAN NOT NULL DEFAULT false`
- `recurrence TEXT CHECK (recurrence IN ('weekly','monthly'))` (optional)

UI/Policy:
- TYPE label: `is_recurring ? 'Ongoing' : 'One‑Time'`.
- Creation permissions: crew cannot set recurring; centers/customers/contractors/managers may.
- No automatic generation in MVP; follow‑up phase can clone on delivery or via scheduler.

## Notes
- These additions complement (do not replace) the main data model. Once the primary doc is re‑encoded to UTF‑8, this content can be merged inline under Archive Support and a new Ongoing Orders section.
