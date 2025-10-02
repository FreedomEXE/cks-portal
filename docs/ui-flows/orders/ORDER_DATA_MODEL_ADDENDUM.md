# Order Data Model — Addendum (2025-09-29)

## 2025-10-01 — Availability, Cancellation Reason, Contacts

Product orders now capture a recurring availability window instead of a single expected delivery date. Data is stored in `orders.metadata`:

```
metadata: {
  availability: {
    tz: "America/New_York",
    days: ["mon","tue","wed","thu","fri"],
    window: { start: "09:00", end: "17:00" }
  }
}
```

When cancelling, we store the reason separately to preserve special instructions:

```
metadata: {
  cancellationReason: "short note from actor",
  cancelledBy: "center|warehouse|...",
  cancelledAt: "2025-10-01T17:23:00.000Z"
}
```

For operational visibility (e.g., warehouse), new orders persist minimal contact snapshots:

```
metadata: {
  contacts: {
    requestor: { name, address, phone, email },
    destination: { name, address, phone, email }
  }
}
```

These fields are additive and can be superseded by live profile lookups where authorized.
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

