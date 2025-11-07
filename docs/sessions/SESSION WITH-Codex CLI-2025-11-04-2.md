# Session Log - Codex CLI - 2025-11-04 (2)

Summary
- Goal: Prepare the Service Orders → Active Service workflow for your test (center creates service order → approvals → manager accepts → invites crew → starts/finishes service) by ensuring universal modal flow and fixing action mappings.
- Result: Added missing service creation mapping, kept the order modal open for Create Service, expanded cache refresh and activity copy for service lifecycle, and wired Assign Crew and crew Accept/Reject into the universal modal.

Changes Since Last Commit
- apps/frontend/src/hooks/useEntityActions.ts
  - Map `create_service` → backend `create-service` (fixes transform action).
  - After order actions, refresh orders + activities; after `create-service`, also refresh services caches (by key patterns and new serviceId when available).
  - Implemented `assign_crew` action: prompts for crew codes + optional message, calls `requestServiceCrew`, refreshes caches, and shows toast.
  - Added crew modal actions for service invites: `accept` and `reject` call `respondToServiceCrew`, refresh caches, and show toasts.
  - Removed duplicate switch case for `assign_crew` to fix Vite duplicate-case warning.
- apps/frontend/src/config/entityRegistry.tsx
  - For backend-provided `availableActions`, keep the modal open for “Create Service” (`closeOnSuccess: false`).
  - Manager fallback descriptors for Service Orders:
    - `Accept`/`Reject` when status is `pending_manager`.
    - `Create Service` when not transformed and status is one of: `manager_accepted`, `crew_assigned`, `crew_requested`.
  - Service modal now shows crew `Accept Invite` / `Decline Invite` when viewer has a pending request (metadata.crewRequests contains a pending entry for viewer).
  - Order modal now shows crew `Accept Invite` / `Decline Invite` at `crew_requested` (pre-creation) when viewer has a pending invite; request is routed via order-specific endpoint.
  - Added warehouse-managed service order handling: Warehouse can Accept/Reject at `pending_warehouse` and Create Service at `warehouse_accepted`. Manager `Assign Crew` hidden for warehouse-managed services.
  - Renamed service tab label from "Actions" to "Quick Actions" for consistency with orders and loading skeleton.
  - Ensured creator Cancel appears in Quick Actions while status is pending (mirrors Orders section logic). When the next actor accepts/rejects, Cancel disappears as status changes.
  - Order modal (crew) now shows `Accept Invite` / `Decline Invite` for service orders at `crew_requested` when the viewer has a pending invite (payload marks crewResponse=true).
- apps/frontend/src/shared/activity/useFormattedActivities.ts
  - Added friendly, role-aware messages for `service_created`, `service_started`, `service_completed`.
  - Fixed `order_created` copy to say “Created Service Order” for service orders (and “Product Order” for product orders); actor sees “You created a … order!”.
- apps/frontend/src/shared/api/hub.ts
  - Added `requestServiceCrew(serviceId, crewCodes[], message?)` and `respondToServiceCrew(serviceId, accept)` client helpers.
 - apps/frontend/src/components/ModalGateway.tsx
   - Added skeleton loading for the universal modal: while data loads, render placeholder tabs (Details/History/Quick Actions) with lightweight gray bars to avoid the “jagged” open.

No Backend Code Changes (verified paths)
- Existing service endpoints handle crew requests and responses; orders domain handles transform.

Brief Summary of Code Changes
- Fixed mismatched action IDs between frontend adapter labels and backend expectations.
- Ensured the order modal remains open for service transform so the manager can continue the workflow.
- Ensured caches for services also refresh when a service is created from an order.
- Added Assign Crew (manager) and Accept/Reject (crew) actions to the universal modal for services.
- Improved activity text mapping for service lifecycle events to match product delivery parity.

Next Steps / Important Files
- Manager Flow (implement/verify end-to-end):
  1) Order modal (service order) → `Accept` (if pending_manager) → `Create Service` (transform)
     - Files: apps/backend/server/domains/orders/store.ts; apps/frontend/src/config/entityRegistry.tsx
  2) Service modal → `Assign Crew` (invite/assignment)
     - Prompt-based request wired; crew Accept/Reject wired in the modal; next iteration can add selector UI for invites.
  3) Service modal → `Start Service` (pending → in_progress), `Complete Service` (in_progress → completed)
     - Files: apps/frontend/src/config/entityRegistry.tsx; apps/frontend/src/hooks/useEntityActions.ts
  4) Activities & copy for all above steps (viewer-personalized); confirm visibility
     - Files: apps/backend/server/domains/activity/writer.ts; apps/backend/server/domains/scope/store.ts; apps/frontend/src/shared/activity/useFormattedActivities.ts
- Modal data plumb for services: confirm `useServiceDetails` provides all fields the adapter needs.

Current Roadblocks / Risks
- If backend `availableActions` for service orders are absent or mis-labeled, fallback descriptors are needed for manager; covered in adapter.
- Status enums for services (pending/in_progress/completed) must match adapter checks; normalize if needed.

MVP Progress
- Product delivery E2E: COMPLETE.
- Service Orders + Active Services: IN PROGRESS. Mapping and modal behavior readied; manager + crew actions now present; final verification next.

Testing Notes
- “Create Service” no longer fails due to ID mismatch; order modal remains open and refreshes.
- Managers can Assign Crew from the service modal; crew can Accept/Reject from the same modal.
- Activities for service lifecycle render with improved messages when emitted by backend.
