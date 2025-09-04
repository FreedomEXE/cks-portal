# Warehouse Hub QA Checklist (MVP)

## Setup
- [ ] Backend running (`backend/server`): `/api` reachable
- [ ] Frontend running (`frontend`): Warehouse hub reachable via Clerk user with `WH-XXX`
- [ ] DB migrations applied: `node Database/migrations/run.js`
- [ ] Optional seeds loaded (inventory/orders) for demo

## Dashboard
- [ ] KPIs load without errors (values present)
- [ ] Recent Activity shows last 5 or an empty state

## Profile
- [ ] Profile displays `warehouse_id`, name, address, capacity/utilization
- [ ] Manager details shown when present
- [ ] Template `WH-000` shows placeholders without errors

## Inventory
- [ ] Inventory table lists products and supplies rows
- [ ] `is_low_stock` is computed and displayed when `quantity_available <= min_stock_level`
- [ ] Local search filters by `item_id` or `item_name`
- [ ] Adjust Inventory: guarded by permission (`WAREHOUSE_ADJUST`), returns updated row

## Orders
- [ ] Pending orders load with item counts
- [ ] Assign Order action requires `WAREHOUSE_ASSIGN` and persists `assigned_warehouse`
- [ ] Shipped/archive lists render appropriately

## Shipments
- [ ] Outbound and delivered shipments load with counts
- [ ] Create Shipment requires `WAREHOUSE_SHIP` and creates `shipment_items`
- [ ] Deliver Shipment decrements `inventory_items.quantity_on_hand` and logs activity

## Activity
- [ ] Activity feed lists stock_adjustment/ship events with timestamps
- [ ] Filters by type work (optional)

## Error Handling
- [ ] API returns `{ success: false, error, error_code }` on permission errors
- [ ] Frontend shows sane empty states and does not crash on missing data

---

Property of CKS © 2025 – Manifested by Freedom

