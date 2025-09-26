# Hub Dashboard Migration Tracker

## Scope
- Entry point: `apps/frontend/src/hubs/ManagerHub.tsx` dashboard tab
- Target: Replace `/admin/directory/*` dependencies with role-scoped data for manager sessions

## Current State (2025-09-26)
- `useHubProfile` in place for manager identity and metadata
- Dashboard overview + activity now sourced from role-scoped endpoints; services and orders still rely on directory APIs
- `useHubRoleScope` and `useHubActivities` power manager dashboard; `useHubOrders` pending adoption

## Workstream
1. **Dashboard Data**
   - [x] Align overview cards with role-scoped `/hub/scope/:cksCode` summary
   - [x] Source recent activity from hub-safe `/hub/activities/:cksCode` feed
   - [x] Confirm counts for contractors/customers/centers/crew via role scope summary payload
2. **Ecosystem Tree**
   - [x] Define hub endpoint to return manager role-scoped graph (contractors -> customers -> centers -> crew)
   - [x] Update tree composition to consume role-scoped data
3. **Services & Orders**
   - [ ] Swap to `useHubOrders` for manager-specific service/product orders
   - [ ] Determine hub services listing endpoint for `My Services`
4. **Shared Components / Docs**
   - [ ] Document Clerk metadata + hub endpoints (follow-up from previous session)

## Open Questions
- Role scope summary currently surfaces counts + pending orders; expand as additional cards evolve.
- Remaining manager sections (services/orders) depend on directory APIs until hub equivalents land.



