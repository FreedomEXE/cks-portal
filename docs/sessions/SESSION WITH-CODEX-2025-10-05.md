# Session With Codex — 2025-10-05

## Changes Made Since Last Commit

- Frontend (apps/frontend)
  - ManagerHub
    - Switched remaining service API calls to the shared `apiFetch` so Clerk auth headers are attached.
    - Hooked ServiceDetailsModal “Send Request” to a new service endpoint (`POST /api/services/:serviceId/crew-requests`).
    - Added success toasts for Start/Complete actions and ensured UI refresh via SWR `mutate`.
    - Active/History classification now prefers `metadata.serviceStatus` (created, in_progress, completed, cancelled) to decide lists.
  - CrewHub
    - Active Services rows show Accept/Reject buttons when the current crew has a pending invite for that service; calls `POST /api/services/:serviceId/crew-response` and refreshes the view.
  - Vite config
    - Allowed reading CSS/assets from `packages/ui/dist` so `@cks/ui/styles/globals.css` and `@cks/ui/assets/ui.css` resolve during dev.

- UI Package (packages/ui)
  - ServiceDetailsModal
    - “Request Crew” picker now renders only when a parent `onSendCrewRequest` handler is provided.

- Backend (apps/backend)
  - Services domain
    - Added `POST /api/services/:serviceId/crew-requests` (manager only) and `POST /api/services/:serviceId/crew-response` (crew only).
    - Implemented helpers in `domains/services/service.ts`:
      - `addServiceCrewRequests()` to append pending invites to `orders.metadata.crewRequests` and ensure participants.
      - `respondToServiceCrewRequest()` to accept/reject invites and update participants.
    - When applying service actions, we now persist `metadata.serviceStatus` for start/complete/cancel to drive UI.
  - Orders domain (restore prior behavior)
    - Reverted crew request/response to only operate pre‑creation (`manager_accepted/crew_requested/crew_assigned`).
    - Removed any special casing at `service_created` so service ORDERS remain completed/transformed.

## New Features Added

- Post‑creation crew request/response at the service level:
  - Managers can request additional crew on an existing service without altering the original service order status.
  - Crew can accept/reject service invites from their Active Services list.
- Success toasts for “Start Service” and “Complete Service.”

## Brief Summary of Code Changes

- ManagerHub: unified authed fetches; toast feedback; metadata‑based status rendering; service‑level crew requests.
- CrewHub: detect pending invite for current crew; add Accept/Reject actions per row; call service response endpoint; refresh lists.
- Backend services routes: added `crew-requests` and `crew-response` endpoints and corresponding store helpers.
- Backend orders store: restored original service‑order flow so post‑creation requests do not mutate order status.
- Vite config: allowed workspace + UI dist paths in `server.fs.allow`.

## Next Steps / Important Files

- Files to review:
  - `apps/backend/server/domains/services/routes.fastify.ts`
  - `apps/backend/server/domains/services/service.ts`
  - `apps/frontend/src/hubs/ManagerHub.tsx`
  - `apps/frontend/src/hubs/CrewHub.tsx`

- Next Steps
  - Add crew Accept/Reject inside a Service Details view (crew) for parity with row actions, if desired.
  - Consider an activity log entry on accept/reject for audit (manager visibility).
  - Optional: auto‑archive service orders immediately after `create-service` if that better matches your Orders UX.

## Current Roadblocks

- Cross‑hub classification still mixes order.status and service metadata. We shifted to `metadata.serviceStatus` where possible, but older lists still show legacy status in some places. Consolidation may be needed if you want fully consistent labels.

## Where We Are Toward MVP

- Service creation end‑to‑end is functional with: create‑service → manage service (crew/procedures/training) → start/complete → status reflected in UI.
- Post‑creation crew invites now supported without disturbing service orders.
- Visual feedback (toasts) in place for key service actions.

## Notes

- DB: you added `services.actual_start_time` and `services.actual_end_time` via Beekeeper; backend writes timestamps + metadata on Start/Complete.
- Docs updated to capture the new service‑level crew request/response endpoints and the preserved Orders behavior.

