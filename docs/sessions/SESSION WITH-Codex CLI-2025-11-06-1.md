# Session Log - Codex CLI - 2025-11-06 (1)

Summary
- Goal: Fix service modal Overview fields, correct History to transformed service ID, and replace Assign Crew prompt with a dropdown selector. Verify manager-managed vs warehouse-managed flows.

Changes Implemented
- A) Service Overview fields
  - apps/frontend/src/config/entityRegistry.tsx: Overview now reads name/type/status from `entityData.metadata` with graceful fallbacks.
  - apps/frontend/src/config/entityRegistry.tsx: Header “Name” and “Type” also read from metadata/title to avoid dashes.

- B) Service History wired to transformed ID
  - apps/backend/server/domains/orders/store.ts: On service creation (explicit or auto on accept), emit `service_created` activity with `targetType='service'` and `targetId=<transformedId>` (e.g., `CEN-010-SRV-001`).
  - Verified: apps/backend/server/domains/services/service.ts emits `service_*` activities with `targetType='service'` and `targetId=<serviceId>`.
  - apps/frontend/src/config/entityRegistry.tsx: HistoryTab already uses `entityId=entityData.serviceId` and `entityType='service'` through adapter context.
  - apps/frontend/src/components/ModalGateway.tsx: EntityModalView is called with `entityType='service'` and `entityId=<transformedId>`.

- C) Assign Crew modal (manager-managed only)
  - Added apps/frontend/src/components/modals/AssignCrewModal/AssignCrewModal.tsx: searchable list + multi-select chips, optional message, sends to `POST /services/:serviceId/crew-requests`.
  - apps/frontend/src/components/ModalGateway.tsx: Intercepts the `assign_crew` action for services to open AssignCrewModal instead of prompt; keeps modal open and refreshes caches.
  - apps/frontend/src/config/entityRegistry.tsx: Removed the old prompt on `assign_crew`; still hidden for warehouse-managed services.

Verification Notes
- Overview tab for `CEN-010-SRV-001` shows correct Service Name/Type/Status (not dashes).
- History tab for `CEN-010-SRV-001` loads lifecycle for the transformed service (not catalog `SRV-001`). New `service_created` activity appears with the transformed ID.
- Managers see Assign Crew dialog in Quick Actions (not shown for warehouse-managed services). Sending a request refreshes the service view and activities without closing the modal.

Quick Test Plan
1) Overview
   - Open service modal for `CEN-010-SRV-001`.
   - Confirm Overview shows Service Name/Type/Status with values from metadata.

2) History
   - Open same service; go to History tab.
   - Confirm entries show `service_created` (and subsequent `service_*`) against `CEN-010-SRV-001`.

3) Assign Crew (manager-managed only)
   - As a manager, open a manager-managed service.
   - Click Quick Actions → Assign Crew.
   - Search/select 1–2 crew; add optional message; Send.
   - Confirm toast, no close; Overview/crew info and History update in place.

4) Flow parity
   - Manager-managed: Accept → Create Service → Assign Crew → Crew accepts → Start → Complete. Confirm Quick Actions + History consistent from both Activity and Services list.
- Warehouse-managed: Accept/Reject + Create Service available for warehouse; Assign Crew hidden for manager.
- Creator Cancel visible only while pending, disappears after accept/reject.

Files Touched
- Frontend
  - apps/frontend/src/config/entityRegistry.tsx
  - apps/frontend/src/components/ModalGateway.tsx
  - apps/frontend/src/components/modals/AssignCrewModal/AssignCrewModal.tsx (new)
- Backend
  - apps/backend/server/domains/orders/store.ts

Notes
- Kept changes minimal and aligned with existing patterns.
- Assign Crew modal uses role scope to list manager’s crew (useHubRoleScope). It refreshes `/services` and activities caches and stays open.

Follow-up Updates (same day)
- Service History display
  - packages/ui/src/tabs/HistoryTab.tsx: Now prefers the scoped service ID (e.g., CEN-010-SRV-001) when an unscoped SRV-### token is present in descriptions. Prevents catalog SRV-001 from appearing in active-service timelines.
- Manager Quick Actions and tabs
  - apps/frontend/src/config/entityRegistry.tsx: Quick Actions are manager-only and limited to Start Service (created/pending) and Cancel Service (created/in_progress). Added Assignments tab (manager-managed only) for crew selection; warehouse-managed services hide Assignments.
  - apps/frontend/src/components/tabs/ServiceAssignmentsTab/ServiceAssignmentsTab.tsx: New inline selector (search + multi-select + message) using manager scope crew list; submits to POST /services/:serviceId/crew-requests and refreshes caches.
  - Removed the separate AssignCrew modal and the onClick intercept. Actions now execute directly.
- Active Services tables cleanup
  - Removed “ACTIONS” button column from Center/Customer/Contractor/Crew/Warehouse hubs; rows open the service modal to view.
- Activity notifications for crew requests/acceptance
  - apps/backend/server/domains/services/service.ts: When requesting crew, also record per-crew activities (targetType='crew') with activityType 'service_crew_requested'. When a crew accepts, record 'crew_assigned_to_service' on the service target.
  - apps/frontend/src/shared/activity/useFormattedActivities.ts: Personalized copy for the above activities (crew sees “You’ve been requested…”, manager sees “You requested…”, acceptance shows “You have been assigned…” or “Crew assigned…” for others).
- Manager activity scope (visibility)
  - apps/backend/server/domains/scope/store.ts: Manager feeds now include their own crew-request events; Crew feeds include crew-request events directed at them.

Outstanding / Next Steps
- Manager feed now includes Active Service Created when managerId matches (service_created filtered into manager scope).
- Added placeholder tabs for Procedures and Training (manager-managed only) to complete the service management surface.
- Quick Actions derive status from metadata.serviceStatus (Start for created/pending; Cancel for created/in_progress).
- Quick Actions show Restore for managers when viewing an archived service.
- Added Products tab (manager): opens `/catalog?mode=products&serviceId=<activeServiceId>`.
- CKSCatalog: auto-opens cart and preselects service when `serviceId` is in query; attaches product orders to that service via metadata.serviceId.
- Procedures/Training tabs now accept file uploads (<=1MB stored inline in service metadata for MVP); data persists via PATCH `/api/services/:id` (updateServiceMetadata).
- Tasks tab (manager): Parses CSV procedure files into tasks, displays + assigns selected tasks to crew; persists to `metadata.tasks` via PATCH `/api/services/:id`. Crew task visibility to follow in Crew Hub.
