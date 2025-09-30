# Session with Codex - 2025-09-29

## Overview
Collaborative working session focused on orders, archive, inventory, and catalog behavior across Admin and Warehouse hubs. Fixed directory filtering, product archive flow, and status mapping; simplified catalog to show only in-stock items.

## Changes Since Last Commit
- Orders directory:
  - Populate Requested By using created_by/creator_id or derived from order_id.
  - Destination uses destination/center fallback (not assigned_warehouse).
  - TYPE shows One-Time (ongoing post-MVP).
- Archive system:
  - Added archive support for products via inventory_items (soft + hard delete).
  - Validated updates (rowCount checks) and improved error messages.
  - Switched product archive list and hard delete to inventory_items.
- Directory filtering:
  - Exclude archived rows for Services, Products, Orders, Reports, Feedback.
  - Products rows carry awId and source (products|catalog) for accurate actions.
- Catalog behavior:
  - Catalog products now require live, non-archived inventory with stock; hidden once inventory archived.
- Policy/build:
  - Fixed stray characters in @cks/policies to resolve TS build errors.
- Documentation:
  - Added progress updates to order docs and an addendum for archive/ongoing orders.
  - Added Warehouse-Scoped Catalog section to Post-MVP recommendations.

## New Features
- End-to-end product archive (Admin ? soft delete ? Archive ? hard delete), backed by inventory_items.
- Admin Directory Products now shows Actions (View; Delete disabled for catalog-only items).
- Catalog Products only shows items with live inventory (in-stock filter).

## Brief Summary of Code Changes
- Backend:
  - orders: improved directory mapping for requester/destination (apps/backend/server/domains/directory/store.ts:orders).
  - products: directory now sources inventory (inventory_items), adds awId/source (apps/backend/server/domains/directory/store.ts:products).
  - archive: product archive/restore/hard-delete use inventory_items; added padded ID matching, fallback to legacy products when needed (apps/backend/server/domains/archive/store.ts).
  - catalog: filter catalog_products to those with non-archived inventory and on-hand stock (apps/backend/server/domains/catalog/store.ts).
  - validators/types updated for nullable/customerId and product awId/source (apps/backend/server/domains/directory/validators.ts, types.ts).
  - migrations added for orders archive cols and inventory_items archive cols (database/migrations/20250929_add_archive_columns_orders.sql, 20250929b_add_archive_columns_inventory_items.sql).
- Frontend:
  - AdminHub orders: TYPE, Requested By, Destination mapping; products action column; delete uses awId; fixed TSX newlines (apps/frontend/src/hubs/AdminHub.tsx).
  - Directory API types updated for orders/products (apps/frontend/src/shared/api/directory.ts).
- Policies: removed stray chars from packages/policies/src/orderPolicy.ts.
- Docs: updated ORDER_FLOW/SYSTEM_DESIGN/IMPLEMENTATION; added ORDER_DATA_MODEL_ADDENDUM; updated POST_MVP_RECOMMENDATIONS.

## Next Steps
- Optional: optimistic removal from Directory after archive (UI) for snappier UX.
- Optional: badge in Products table to indicate Inventory vs Catalog source.
- Optional: add helper to flip catalog_products.is_active based on global inventory presence.
- Optional: per-warehouse catalog scoping (see Post-MVP recs).
- Replace viewerStatus in remaining hubs with policy lookups (actions/labels).

## Important Files
- apps/backend/server/domains/directory/store.ts
- apps/backend/server/domains/archive/store.ts
- apps/backend/server/domains/catalog/store.ts
- apps/frontend/src/hubs/AdminHub.tsx
- apps/frontend/src/shared/api/directory.ts
- packages/policies/src/orderPolicy.ts
- database/migrations/20250929_add_archive_columns_orders.sql
- database/migrations/20250929b_add_archive_columns_inventory_items.sql
- docs/ui-flows/orders/*, docs/POST_MVP_RECOMMENDATIONS.md

## Current Roadblocks
- None blocking the flows tested. Note: replacing rchived_entities view in Beekeeper may require explicit column aliasing; not required for current UI.

## MVP Progress
- Orders: accept/deliver flows; directory view corrected.
- Archive: soft + hard delete working for products; orders archived.
- Inventory: warehouse inventory reflects deletions.
- Catalog: now hides unstocked items.
- Overall: ~80–85% to MVP for these areas; remaining work is polish and cross-hub alignment.

## Notes
- Product archive operates on inventory_items; catalog remains the global source but is filtered by availability.
- Catalog scoping by warehouse added to Post-MVP plan; MVP assumes a single warehouse.

