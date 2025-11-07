# SESSION WITH-Codex CLI — 2025-11-07

Status: Completed major wiring for Service Management (crew + warehouse), Reports/Feedback, and universal modal usage. Ready for flows review and activity polish.

## Highlights
- Crew “My Tasks” moved into the Service modal with a dedicated crew tab; overview card shows due‑today count and opens a tasks‑only view.
- Activities: crew invites, acceptance, assignment, unassignment, task completion — all emitted, categorized, and visible to correct roles.
- Quick Actions for services: Start/Cancel/Complete rendered by role and serviceManagedBy; warehouse‑managed services controlled by Warehouse, managers view‑only.
- Assignments tab (manager): shows current assigned crew with Unassign; invites show success toast and refresh feeds.
- Reports/Feedback: wired to universal ID‑first modal; acknowledge/resolve/archive/restore/delete actions with toasts and feed/list revalidation.

## Frontend Changes

Universal Modal + Context
- apps/frontend/src/components/ModalGateway.tsx
  - Passes `options.context` into tab building as `openContext`.
- apps/frontend/src/types/entities.ts
  - TabVisibilityContext now includes `openContext`.

Service Modal (crew tasks & procedures)
- apps/frontend/src/components/tabs/ServiceCrewTasksTab/ServiceCrewTasksTab.tsx
  - Checklist for tasks assigned to the viewer; persists `completedAt/completedBy`; revalidates services/orders/activities caches.
- apps/frontend/src/components/tabs/ServiceProceduresTab/ServiceProceduresViewerTab.tsx
  - Read‑only procedures list for crew.
- apps/frontend/src/config/entityRegistry.tsx
  - Crew tabs: “My Tasks” always; “Procedures” when not opened with `{ context: { focus: 'crew-tasks' } }`.
  - Service header now shows “Assigned Crew” universally.
  - Lifecycle Quick Actions by manager/warehouse based on `metadata.serviceManagedBy`.

Crew Hub
- apps/frontend/src/hubs/CrewHub.tsx
  - Dashboard “My Tasks” counts due‑today tasks and opens the service modal with `{ focus: 'crew-tasks' }`.
  - Fixed hooks order error by memoizing dashboard cards at top level.
  - Revalidates activities after responding to an invite.

Assignments (manager)
- apps/frontend/src/components/tabs/ServiceAssignmentsTab/ServiceAssignmentsTab.tsx
  - Success toast on invite; revalidate services/activities/serviceId and manager activities key.
  - Shows currently assigned crew; Unassign button updates `metadata.crew`, revalidates, and shows toast.
- apps/frontend/src/config/entityRegistry.tsx
  - Passes `assigned` crew to Assignments tab.

Warehouse Hub
- apps/frontend/src/hubs/WarehouseHub.tsx
  - Orders wired to universal actions; report/feedback submission limited to feedback; opens report modal via `onReportClick`.

Reports/Feedback (all hubs)
- apps/frontend/src/hooks/useReportDetails.ts
  - On‑demand details loader used by ModalGateway.
- apps/frontend/src/hooks/useEntityActions.ts
  - `handleReportAction()` acknowledges/resolves with toasts and SWR cache refresh.
- apps/frontend/src/config/entityRegistry.tsx
  - `reportAdapter` for Details/History/Quick Actions across report/feedback.
- packages/domain-widgets/src/reports/ReportsSection.tsx
  - Emits `onReportClick` to open ID‑first modal; uses callbacks for submit/ack/resolve.
- Hubs wiring to ReportsSection with `onReportClick` and submit/ack/resolve handlers:
  - apps/frontend/src/hubs/ManagerHub.tsx
  - apps/frontend/src/hubs/ContractorHub.tsx
  - apps/frontend/src/hubs/CustomerHub.tsx
  - apps/frontend/src/hubs/CenterHub.tsx
  - apps/frontend/src/hubs/WarehouseHub.tsx

## Backend Changes

Service Domain
- apps/backend/server/domains/services/service.ts
  - respondToServiceCrewRequest: records `service_crew_response` and `crew_assigned_to_service` with `managerId` when applicable.
  - updateServiceMetadata: logs `service_tasks_updated`; detects task completion → emits `service_task_completed`.
  - Unassign flow: logs `crew_unassigned_from_service` with `crewId`, `managerId`, `serviceId`.

Activities Visibility & Categories
- apps/backend/server/domains/scope/store.ts
  - Categories: `service_task_completed`=success; `service_crew_requested`, `service_crew_response`, `crew_assigned_to_service`=action; `crew_unassigned_from_service`=warning.
  - Manager feed shows own crew requests and assignment acceptances; crew feed shows invites, acceptances, unassignments.

Reports/Feedback Domain
- apps/backend/server/domains/reports/routes.fastify.ts
  - Details endpoint used by ModalGateway.
  - Create report/feedback → emits `report_created`/`feedback_created`.
  - Acknowledge/Resolve endpoints → emit `report_acknowledged`/`feedback_acknowledged` and `report_resolved`.
  - Category‑based resolution permissions (warehouse for order & warehouse‑managed service; manager otherwise).

## How To Test (Quick)
1) Manager → Service modal → Assignments
   - Invite crew: success toast; manager feed shows `service_crew_requested`.
2) Crew → Orders → Accept invite
   - Crew feed shows acceptance; manager feed shows `crew_assigned_to_service`.
3) Open Service modal (any role)
   - Header shows “Assigned Crew”.
4) Crew → Service modal → My Tasks
   - Check off a task; `service_task_completed` emitted; timestamp saved.
5) Manager → Assignments → Unassign crew
   - Toast; `crew_unassigned_from_service` recorded; header updates.
6) Service lifecycle
   - Manager‑managed: Manager sees Start/Cancel (pending) or Complete/Cancel (in_progress).
   - Warehouse‑managed: Warehouse sees lifecycle buttons; manager view‑only.
7) Reports/Feedback (any hub)
   - Submit structured report/feedback; modal opens from list; Acknowledge/Resolve with toasts; feeds update.

## Next
- Light polish: badges (Managed By, due‑today count), list chips for report/feedback status.
- QA sweep on activities text/targets.
- Hand‑off for warehouse flows review.

---

## Quick Prompt For Next Chat

Paste this into a new chat to continue:

We’re in cks-portal continuing MVP wrap‑up.

Context highlights:
- Universal modal is ID‑first across Orders/Services/Reports/Feedback. Use `modals.openById(<ID>)`.
- Service Management:
  - Crew “My Tasks” is a tab in Service modal; overview card shows due‑today count and opens tasks‑only view (`options.context.focus='crew-tasks'`).
  - Activities: `service_crew_requested`, `service_crew_response`, `crew_assigned_to_service`, `crew_unassigned_from_service`, `service_task_completed`.
  - Quick Actions: Start/Cancel/Complete; owner is manager or warehouse per `metadata.serviceManagedBy`.
  - Assignments tab (manager): invite + unassign with toasts; header shows “Assigned Crew”.
- Reports/Feedback:
  - Lists open modals by ID; actions (acknowledge/resolve/archive/restore/delete) with toasts; activities wired.

Please pick up with:
1) Small polish pass (badges for Managed By and due‑today, status chips in reports/feedback lists).
2) QA flows for activities visibility and messages.
3) Prepare a short “MVP test plan” checklist for Services (manager/warehouse), Reports, Feedback.

