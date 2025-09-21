# Warehouse Hub Spec (MVP)

## Purpose
Provide logistics and inventory operations for product/supply fulfillment. Surfaces KPIs, inventory, shipments, and order assignment for a specific warehouse.

## UI Scope (Frontend)
- Tabs: Dashboard, Profile, Inventory, Orders, Shipments, Support (self‑contained), Activity.
- Dashboard: KPI cards + recent activity (last 5).
- Profile: Warehouse details + manager summary.
- Inventory: Products and Supplies panels with local search; shows low‑stock flag.
- Orders: Pending vs Shipped vs Archive with quick filters and assignment action.
- Shipments: Inbound/Outbound, Pending/Delivered, archive view and basic filters.
- Activity: Chronological stock and shipment events.

Location: `frontend/src/pages/Hub/Warehouse/` (fully isolated hub)

## API Surface (Backend)
Base path: `/api/warehouse`.

- `GET /profile` → Warehouse info plus `manager` (best‑effort join)
- `GET /dashboard` → KPI cards for at‑a‑glance metrics
- `GET /inventory?category&low_stock&limit` → Items with `quantity_available` and `is_low_stock`
- `POST /inventory/adjust` (perm: `WAREHOUSE_ADJUST`) → `{ item_id, quantity_change, reason? }`
- `GET /orders?status=pending|shipped|all&limit` → Orders requiring warehouse fulfillment (products/supplies)
- `POST /orders/:id/assign` (perm: `WAREHOUSE_ASSIGN`) → Assigns order to this warehouse
- `GET /shipments?type=inbound|outbound&status&limit` → Shipment headers with item counts
- `POST /shipments` (perm: `WAREHOUSE_SHIP`) → Create outbound shipment for an order
- `PATCH /shipments/:id/deliver` (perm: `WAREHOUSE_SHIP`) → Mark delivered and decrement stock
- `GET /activity?type&limit` → Activity log rows (stock adjustments, receipts, picks, ships)

Headers:
- `x-user-id` or `x-warehouse-user-id` (e.g., `WH-001`)
- Optional `x-user-role: warehouse`

Response Envelope:
- `{ success: boolean, data: any, ...optional }`

## Permissions (RBAC)
Defined in `backend/server/src/auth/rbac.ts`:
- `WAREHOUSE_ASSIGN`: assign orders to a warehouse
- `WAREHOUSE_SHIP`: create shipments and mark as delivered
- `WAREHOUSE_ADJUST`: adjust inventory quantities

## Database Model (Key Tables)
- `warehouses(warehouse_id, warehouse_name, address, manager_id, capacity, current_utilization, ...)`
- `inventory_items(warehouse_id, item_id, item_type, sku, item_name, category, quantity_on_hand, quantity_reserved, quantity_available, min_stock_level, unit_cost, location_code, ...)`
- `warehouse_shipments(shipment_id, warehouse_id, shipment_type, tracking_number, carrier, status, shipment_date, expected_delivery_date, actual_delivery_date, ...)`
- `shipment_items(shipment_item_id, shipment_id, order_id, item_id, item_type, sku, item_name, quantity, unit_cost)`
- `warehouse_staff(staff_id, warehouse_id, staff_name, position, email, phone, shift_schedule, certifications[], status, hire_date)`
- `warehouse_activity_log(log_id, warehouse_id, activity_type, item_id, quantity_change, description, staff_id, shipment_id, activity_timestamp)`
- Orders integration: `orders.assigned_warehouse` with supporting indexes

Seed references:
- `Database/seeds/011_warehouse_sample.sql`
- `Database/migrations/003_warehouse_inventory.sql`

## Non‑Goals (MVP)
- No pricing logic beyond totals stored on orders
- No multi‑warehouse allocation logic
- No advanced wave/pick planning (future phase)

## Test Notes
- Ensure migrations applied: `node Database/migrations/run.js`
- Minimal smoke:
  - `GET /api/warehouse/profile` with `x-user-id: WH-000`
  - `GET /api/warehouse/inventory?limit=10`
  - `GET /api/warehouse/orders?status=pending`
  - `POST /api/warehouse/orders/<id>/assign` with `x-user-role: warehouse`
  - `POST /api/warehouse/shipments` (body `{ order_id }`)
  - `PATCH /api/warehouse/shipments/<id>/deliver`

---

Property of CKS © 2025 – Manifested by Freedom

