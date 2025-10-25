# Session With CODEX — 2025-10-25

Status: Committing current work and documenting changes. Note: Only partial manual testing completed (orders/products happy path). Broader flows not yet verified.

## Changes Since Last Commit

- Universal Modal UX and stability
  - Added Quick Actions tab back for user modals and standardized tab order: Profile, Quick Actions, History.
  - Reused shared `ProfileInfoCard` in user Profile tab and extended it with `hideTabs`, `enabledTabs`, and `borderless` props to match modal styling and remove nested tab chrome.
  - Fixed tab “snap-back” by changing BaseViewModal tab init logic to initialize only once and preserve the active tab across re-renders.
  - History timeline now explicitly sorts newest → oldest; optional preloaded events path supported.

- Activity visibility and endpoints
  - Activity history endpoint enhanced to include metadata-based assignment events for parent entities (e.g., `contractor_assigned_to_manager` for managers, etc.).
  - Admin directory activities hardened (transform resilience, per-user dismissals retained).

- ID-first modal flow (foundation)
  - Verified `openById` feature flag path and parsing; ensured subtype mapping for user IDs is respected by modal registry.
  - Ensured ModalProvider’s open-by-id flow passes fresh data to modals where implemented (orders/reports/services retain existing hooks; users handled via provided options data in current build).

## New/Updated Files (Highlights)

- apps/frontend/src/config/entityRegistry.tsx
  - User adapter: restored Quick Actions tab; switched Profile tab to `ProfileInfoCard`; tab order standardized.

- packages/domain-widgets/src/profile/ProfileInfoCard/ProfileInfoCard.tsx
  - Added `hideTabs`, `enabledTabs`, `borderless` to support borderless, single-tab rendering within the universal modal.

- packages/ui/src/modals/BaseViewModal/BaseViewModal.tsx
  - Guarded tab initialization to prevent active tab resets on tab list churn.

- packages/ui/src/tabs/HistoryTab.tsx
  - Sort events descending by timestamp; use provided events when supplied, otherwise fetch.

- apps/backend/server/domains/activity/routes.fastify.ts
  - Entity history endpoint updated to include related assignment events via metadata filters for user roles.

- apps/frontend/src/components/ActivityFeed.tsx
  - Ensured ID-first modal openings and removed reliance on stale directory state paths in the user flow.

Note: Many files have touchpoints due to cross-package coordination (UI widgets, domain widgets, frontend adapters). See `git diff --name-only` for the comprehensive list.

## New Features

- User modals now render consistent Profile/Quick Actions/History tabs, using shared components and a borderless profile card presentation.
- Timeline UX improvements: newest-first, consistent badge formatting; “By:” formatting now shows `Admin` for admin actions and the actor ID for other roles.
- Activity history includes metadata-based assignment visibility for user parents (e.g., managers see child contractor assignments).

## Brief Summary of Code Changes

- Replaced bespoke profile rendering with shared `ProfileInfoCard` in user modals; added presentational props to avoid nested tabs and card borders.
- Fixed BaseViewModal’s tab initialization race that caused active tab jitter.
- Standardized HistoryTab behavior and data flow (descending sort, preloaded vs fetch).
- Expanded backend activity history logic to include assignment events via metadata joins, aligning user roles.

## Next Steps

1. Backend (scope visibility):
   - Crew hub: add explicit include for `crew_assigned_to_center` using `metadata->>'crewId'` (mirrors other roles).
   - Remove creation-event exclusions in hub scope queries so users can see in-ecosystem `*_created` events (still scoped by idArray and dismissals; archive/delete remain admin-only).

2. Frontend (hub wiring):
   - Render Recent Activity in all 6 non-admin hubs using `useHubActivities(cksCode)` and map to ActivityFeed’s shape; ensure ActivityFeed uses `openById` (fresh fetch) for clicks.

3. ID-first unification:
   - Make user modal opens unconditional through `openById` (Directory/Activity/Search) and remove any remaining enrichment paths.
   - Plan migration for orders/reports/services to ID-first and retire their per-entity hooks when ready.

4. Testing:
   - Beyond orders/products path: verify user modals for all roles, archived/deleted edge cases (tombstone), and permission scoping in hub activities.

## Current Roadblocks / Risks

- Hub feeds currently not rendered in all roles; without wiring, users cannot see their own creation/assignment events despite backend support.
- Crew role currently misses explicit metadata include for assignments (pending change described above).
- Limited regression coverage: only orders/products were re-verified; other flows may need smoke tests to ensure no tab/jitter regressions or data mismatches.

## MVP Status

- Universal modal foundation is solid; user modals standardized with shared components and tab UX stabilized.
- Activity history coverage improved, but hub-facing activity feeds must be lit up to validate end-to-end for each role.
- ID-first path is working for current flows; broader migration (orders/reports/services) remains for full parity.

## Important References

- Frontend
  - `apps/frontend/src/config/entityRegistry.tsx`
  - `apps/frontend/src/components/ModalGateway.tsx`
  - `apps/frontend/src/components/ActivityFeed.tsx`
  - `packages/ui/src/modals/BaseViewModal/BaseViewModal.tsx`
  - `packages/ui/src/tabs/HistoryTab.tsx`
  - `packages/domain-widgets/src/profile/ProfileInfoCard/ProfileInfoCard.tsx`

- Backend
  - `apps/backend/server/domains/activity/routes.fastify.ts`
  - `apps/backend/server/domains/scope/store.ts` (planned crew creation visibility + creation-event inclusion updates)

---

If you want this session doc augmented with screenshots or diff snippets, say the word and I’ll add them.

