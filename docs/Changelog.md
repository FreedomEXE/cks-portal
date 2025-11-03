# Changelog

Change history

## Overview

To be documented.
## 2025-11-02 - Archive/Delete Modularization + Order ID Normalization
- Backend: Added legacy order ID normalization in central archive (store.ts) so CRW-006-PO-11 style IDs resolve to CRW-006-PO-011 for archive/restore/hard-delete; applied throughout to use effective ID for snapshot/activity/delete/relationship cleanup.
- Frontend: Orders in Admin Directory now open the universal modal/actions (ID-first), enabling consistent archive/restore/delete and auto-close.
- Frontend: useEntityActions now consistently invalidates directory + /archive/list caches and dispatches cks:archive:updated across orders/services/products/users/reports/feedback.
- Note: Some existing archived data may still fail hard-delete due to FK constraints; central hardDelete will need dependent-row cleanup (orders: order_items/participants; services: crew/training/procedures; products: legacy products table).
