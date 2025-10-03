# Services E2E – Implementation Plan (Current Sprint)

This document tracks the implementation status to deliver the service order flow end‑to‑end, including manager post‑accept actions, correct service IDs, and lifecycle actions.

## Goals (P0 – This Pass)

- Manager Accept leads to post‑accept actions (no auto‑transform):
  - Create Service
  - Add Crew (UI helper)
  - Add Procedure (UI helper)
  - Add Training (UI helper)
- Create Service generates per‑center service IDs: `<CENTER>-SRV-###` (e.g., `CEN-010-SRV-001`).
- Create Service does NOT set actual start/end times; those come later when work starts/completes.
- Orders move to Archive (`service_created`) and Services show in “My Services”.

## Done

- Backend: create‑service now generates `transformedId` as `<center>-SRV-###` by scanning existing IDs per center and incrementing.
- Backend: Accept/Reject wiring for customer/contractor/manager corrected; actions validated against canonical status (no overrides).
- Frontend: Manager actions wired (Accept, Reject, Cancel) with reason prompts and refresh.
- Frontend: Post‑accept menu shows (Add Crew / Add Procedure / Add Training) even if policy doesn’t enumerate them (UI helpers) and ‘Create Service’ shows via policy at `manager_accepted`.
- Frontend: CreateServiceModal relaxed (start/end optional, notes optional). Start/end will be captured later.
- Frontend: OrdersSection hides Accept/Reject unless viewer is the pending actor.

## Next (P1)

1) Service Lifecycle Actions
   - `start-service`: sets `services.actual_start_time` and marks status `in_progress`.
   - `complete-service`: sets `services.actual_end_time` and marks status `completed`.
   - Policy rules for start/complete (manager or assigned crew).

2) Service Details Modal (UI)
   - New `ServiceDetailsModal` in `@cks/ui`.
   - Shows service info, assigned crew, procedures, training.
   - Manager edit controls: add/remove crew, add procedures/training.
   - Crew view‑only.

3) Crew Assignment (MVP)
   - Reuse order crew request flow (pending → crew_requested → crew_assigned).
   - On acceptance, persist assignment into service (metadata or `service_assignments`).

4) Data Modeling (MVP → P2)
   - Introduce `service_counters(center_id, last_num)` for ID generation (replace MAX() scan).
   - Normalize `service_assignments`, `service_procedures`, `service_training`.

## Acceptance Criteria

- Manager Accept at `pending_manager` shows post‑accept menu and no longer shows Accept.
- Create Service generates `CEN-XXX-SRV-###` and archives the order as `service_created`.
- My Services shows the SRV id; SO ids do not appear.
- (P1) Manager (or crew) can Start Service and Complete Service; Start/End timestamps recorded accordingly.

## Notes

- Approvals trail is stored in `orders.metadata.approvals` for accurate workflow visuals.
- Canonical status from DB remains authoritative for policy and allowed actions.

