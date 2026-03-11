# CKS Schedule Workspace Refactor Spec

**Status:** Product + Architecture Refactor Spec  
**Owner:** Freedom_EXE  
**Context:** Supersedes the top-level UX framing of the current Calendar tab  
**Related:** `CALENDAR_SYSTEM_RESEARCH_AND_IMPLEMENTATION.md`  
**Created:** 2026-03-10

---

## 1. Executive Summary

CKS should stop treating this system as a `Calendar` and start treating it as a `Schedule`.

The current calendar implementation is a useful temporal read layer, but it is not the real product the business needs. The real need is an editable, scoped, operational scheduling workspace that replaces the manually assembled building and ecosystem schedule files currently being produced outside the app.

This refactor introduces a new product concept:

- `Schedule` is the top-level workspace
- `Calendar` becomes one navigation lens inside Schedule
- the user experience is based on **zooming in**, not opening outward into modals
- Admin and Manager users can create and edit schedule blocks
- all other users see only the schedule slices they are allowed to see
- the system must support export and print workflows that can replace the current manual PDF process

This is not a cosmetic rename. It is a change in product model.

---

## 2. Why This Refactor Exists

Today, full operational schedules are still being assembled manually in external files, such as [National Ecosystem Full Schedule.pdf](/c:/Users/User/Documents/GitHub/cks-portal/National%20Ecosystem%20Full%20Schedule.pdf).

That file makes three things obvious:

1. The business does not actually need a generic event calendar. It needs a structured schedule planner.
2. The real unit of planning is not only the service or order. It is the assigned work block, broken down by worker, area, time, and task.
3. The output must be human-usable at multiple levels:
   - ecosystem / portfolio
   - building / center
   - day
   - crew member
   - task block
   - printable handoff sheet

The current calendar implementation is good Phase 1 infrastructure, but it is too shallow to replace the manual scheduling process.

---

## 3. Product Reframe

### 3.1 New Product Name

The dedicated hub tab should be renamed from `Calendar` to `Schedule`.

### 3.2 What Schedule Is

Schedule is the operational planning workspace for the CKS ecosystem.

It combines:

- source-driven events from services, orders, deliveries, and future scheduling domains
- planned work blocks created or edited by Admin and Manager users
- crew and building assignment views
- task and procedure breakdowns inside each scheduled block
- exportable and printable schedule outputs

### 3.3 What Calendar Becomes

Calendar is one view mode inside Schedule.

It is a top-level time navigation tool, not the full product.

---

## 4. Core Product Principles

1. **Top-down first.** Users should be able to start broad and progressively zoom into the exact work being performed.
2. **Inline drill-in, not modal-first.** The main Schedule workspace should reveal more detail inside the page rather than ejecting the user into modal layers.
3. **Role-scoped by default.** Every schedule surface is constrained by the user's role and `cks_code`.
4. **Editable building blocks.** Admin and Manager users must be able to create, move, resize, assign, and update schedule blocks.
5. **Source-aware, not source-confused.** Orders and services remain important, but the Schedule layer must represent execution planning, not just source records.
6. **Print-ready by design.** The workspace must support outputs that can replace manual PDF schedule packs.
7. **Modular and polished.** The UI should feel like a serious scheduling product, not a styled list of events.

---

## 5. What The Existing PDF Tells Us

The schedule file structure is effectively:

`ecosystem -> building -> employee -> day -> time block -> task`

The file is not organized around abstract events. It is organized around operational work.

Each building page contains:

- building identity
- employee roster
- employee role and work schedule
- day-of-week plan
- area/zone
- time range
- task description
- optional recurring cadence notes

That means the app needs to support all of those layers as first-class schedule concepts.

---

## 6. Proposed Information Architecture

## 6.1 Top-Level Navigation

Rename the current hub tab to:

- `Schedule`

Inside that tab, users can switch between schedule lenses:

- `Calendar`
- `Agenda`
- `Day Plan`
- `Crew`
- `Buildings`
- `Print`

Phase 1 of the refactor does not need to ship all of these at once, but the architecture should assume them.

## 6.2 Zoom Hierarchy

The zoom model should work like this:

### Level 0: Scope View

User selects the schedule scope:

- Admin: all ecosystems or a selected ecosystem
- Manager: their ecosystem
- Contractor: their customers / buildings
- Customer: their buildings / service schedule
- Center: their building / location
- Crew: their own assigned schedule
- Warehouse: their delivery / logistics schedule

### Level 1: Range View

The user sees a broad time view:

- month
- week
- agenda

Purpose:

- spot density
- inspect staffing coverage
- find a target day

### Level 2: Day Plan

Selecting a day zooms into that day.

The day plan is the real operational surface.

It should show:

- building or center context
- crew lanes or assignment lanes
- work blocks on a time axis
- gaps
- overlaps
- unassigned work
- optional side rail with demand and issue queues

### Level 3: Work Block Detail

Selecting a work block zooms further into the block.

A work block should show:

- assigned person or crew
- linked source record
- building / area / zone
- start and end time
- workload status
- checklist / task stack
- notes, supplies, tools, special instructions

### Level 4: Task / Procedure Detail

If the block has procedures or tasks, the user can zoom into those.

This is where the system stops being "calendar-like" and becomes a true service management workspace.

Task/procedure detail may show:

- ordered sequence of work
- status of each task
- estimated duration
- dependencies
- assigned person
- notes, tools, supplies
- proof-of-work / reporting links

### Level 5: Source Context

At any level, the user may still need to open the underlying service/order/report context.

That should remain possible, but it should be secondary to the schedule drill-in.

The rule is:

- main interaction = inline zoom
- source modal = escape hatch / detail bridge

---

## 6.3 Scope Selector Model

The Schedule workspace should reuse the same positional visibility model as the existing Ecosystem view.

This is important: scope switching in Schedule should not be invented as a parallel system. It should mirror how users already understand the ecosystem hierarchy from their role.

### Required Behavior

The Schedule scope selector should cascade downward from the viewer's current position in the ecosystem:

- Admin sees:
  - Admin
  - Manager
  - Contractor
  - Customer
  - Center
  - Crew
- Manager sees:
  - Manager
  - Contractor
  - Customer
  - Center
  - Crew
- Contractor sees:
  - Contractor
  - Customer
  - Center
  - Crew
- Customer sees:
  - Customer
  - Center
  - Crew
- Center sees:
  - Center
  - Crew
- Crew sees:
  - Crew
  - Center
- Warehouse sees:
  - Warehouse
  - warehouse-linked delivery and center logistics scope only

### Admin Example

Admin should not stop at selecting only the top-level ecosystem manager.

Admin should be able to progressively narrow:

- all ecosystems
- specific manager ecosystem
- contractor within that ecosystem
- customer within that contractor
- center within that customer
- crew within that center

This should behave like a cascade, not a flat unrelated set of dropdowns.

### Crew Caveat

Crew users need one exception:

- they should still be able to view their own schedule
- they should also be able to view at the center level, because that is how the current ecosystem visibility model operates

This means crew scope controls must not be limited to only "me." They need access to the center-level schedule context they belong to.

### Product Rule

The schedule scope bar should be derived from the existing ecosystem graph and current role visibility.

It should not rely on hardcoded frontend-only assumptions about what a role can see.

### UX Shape

Recommended interaction:

- first selector = highest visible scope
- each next selector appears only after the previous level is chosen
- quick-jump search should exist as a shortcut for Admin and Manager users
- breadcrumb state reflects the path
- clearing any level resets the deeper levels below it

Example:

`All ecosystems -> MGR-001 -> CON-004 -> CUS-018 -> CEN-203 -> CRW-991`

This will make the Schedule workspace feel like a true operational extension of the Ecosystem system rather than a disconnected tool.

---

## 7. Primary UX Model

## 7.1 Main Workspace Structure

The Schedule tab should eventually look more like a dispatch board / planning workspace than a classic calendar page.

### Top Bar

The top bar should contain:

- scope switcher
- date / range focus
- view mode toggles
- search
- filter chips
- export / print actions
- test-data toggle where relevant for Admin

The current repeated "Calendar" headers and descriptive copy should not remain.

### Main Canvas

The central canvas changes depending on zoom level:

- month / week overview
- day plan with lanes
- block detail
- task detail

### Side Rails

The right or left rail can hold contextual tools such as:

- unassigned work
- upcoming deadlines
- selected block summary
- print preview panel
- staffing conflicts
- filters / legend

## 7.2 Interaction Pattern

The desired interaction model is:

1. start broad
2. click a day
3. zoom into that day
4. click a block
5. zoom into that block
6. if tasks exist, zoom into the tasks

This is the opposite of the rest of the app's modal-first pattern.

That is intentional.

---

## 8. Editable Building Blocks

The core scheduling primitive should be the **schedule block**.

A schedule block is a modular, interactive planning unit.

Examples:

- Lobby cleaning block
- Compactor maintenance block
- Delivery window block
- Amenity cleaning block
- Pool testing block
- Building walkthrough block
- Coverage / floater block
- Admin inspection block

Each block should support:

- title
- time range
- assignee
- building / area / zone
- linked source record if applicable
- task stack
- notes
- recurrence / template origin
- status
- color / visual identity

For Admin and Manager, blocks should be editable in-place.

Eventually this includes:

- create block
- drag to move
- resize duration
- duplicate block
- copy previous day
- convert to template
- assign or reassign crew
- split block
- merge adjacent blocks

---

## 9. Ownership Model

This refactor introduces an important distinction between three layers:

## 9.1 Demand Layer

These are source-domain objects that create the need for work:

- service orders
- services
- product orders
- deliveries
- inspections
- training

These remain authoritative for business workflow state.

## 9.2 Schedule Layer

This is the new planning layer.

It owns:

- schedule blocks
- assignments
- day plans
- recurring templates
- task stacks within scheduled work

This is where Admin and Manager users author operational plans.

## 9.3 Calendar/Event Projection Layer

This is still useful, but it becomes a read model and navigation lens over the Schedule layer plus source milestones.

In other words:

- source domains create demand
- schedule layer plans execution
- calendar view projects time-based navigation over both

This is the cleanest way to preserve the good parts of the current calendar architecture while enabling real schedule authoring.

---

## 10. Proposed Domain Model

The existing `calendar_events` tables should remain, but they are no longer enough by themselves.

The schedule system likely needs new first-class tables.

## 10.1 Core New Tables

### `schedule_blocks`

Represents planned work blocks.

Suggested fields:

- `block_id`
- `scope_type`
- `scope_id`
- `center_id`
- `building_name`
- `area_name`
- `start_at`
- `end_at`
- `timezone`
- `block_type`
- `title`
- `description`
- `status`
- `priority`
- `source_type`
- `source_id`
- `template_id`
- `recurrence_rule`
- `series_parent_id`
- `occurrence_index`
- `generator_key`
- `version`
- `created_by`
- `updated_by`
- `updated_at`
- `metadata`

Additional guidance:

- `timezone` should default to `America/Toronto`
- `priority` should align with the current calendar priority model
- `generator_key` should be unique for idempotent block generation
- `version` is required for optimistic concurrency in multi-user editing
- `updated_at` is required for active day-plan refresh and future real-time sync
- `series_parent_id` + `occurrence_index` distinguish recurring instances from manual one-off blocks

### `schedule_block_assignments`

Represents who is assigned to a block.

Suggested fields:

- `assignment_id`
- `block_id`
- `participant_id`
- `participant_role`
- `assignment_type`
- `is_primary`
- `status`

### `schedule_block_tasks`

Represents tasks within a block.

Suggested fields:

- `task_id`
- `block_id`
- `sequence`
- `task_type`
- `catalog_item_code`
- `catalog_item_type`
- `title`
- `description`
- `area_name`
- `estimated_minutes`
- `status`
- `required_tools`
- `required_products`
- `metadata`

### Task ID Requirement

Tasks must be first-class CKS entities with their own human-readable IDs.

They should be tied to the scheduled service/work block they belong to, not just the center in the abstract.

Required starting model:

- task templates belong to the service definition / center-service template
- task instances belong to the scheduled block or service occurrence

Recommended task-instance pattern:

- `{blockId}-TSK-001`

Examples:

- `BLK-001-TSK-001`
- `CEN001-SRV001-BLK-003-TSK-002`

Exact formatting can be finalized with the broader ID system, but the architectural rule should not change:

- execution tasks are block-scoped / service-instance-scoped
- not center-scoped only

This matters because tasks are eventually the atomic execution unit for crew-facing mobile flows, audit history, exports, support, and operational completion.

This cannot remain a hidden row ID or an anonymous JSON item.

### Task Template vs Task Instance

The system should explicitly distinguish:

1. Task template
- attached to a service definition or center-service template
- reusable blueprint for work that should normally happen

2. Task instance
- attached to a scheduled block / actual service occurrence
- the specific task crew completes in the real world

This is the right model for mobile completion and schedule drill-in.

### Procedure ID Follow-On

Procedure IDs should also become first-class, but procedures do not need to be fully normalized in the first step of this schedule refactor.

Immediate priority:

- normalize task IDs first

Next layer:

- normalize procedure IDs once procedure authoring and reuse are formalized

### `schedule_templates`

Represents reusable schedule patterns.

Suggested fields:

- `template_id`
- `scope_type`
- `scope_id`
- `name`
- `rrule`
- `default_start_time`
- `default_duration_minutes`
- `default_assignees`
- `template_payload`

## 10.2 Relationship To Current Calendar Tables

Recommended rule:

- `schedule_blocks` become the authoritative execution-planning records
- `calendar_events` remain the unified rendered timeline/read model for schedule blocks and source milestones

Hard rule:

- schedule blocks should project into `calendar_events`
- projection key pattern should be `generator_key = 'block:{blockId}'`
- schedule blocks should not bypass the current calendar read path

This preserves the current agenda, summary, full-view, and RBAC infrastructure instead of duplicating it.

This lets the UI remain fast while still supporting serious scheduling workflows.

---

## 11. ID and Deep-Link Model

If Schedule becomes a zoomable workspace, event ID alone is not enough.

The app needs route/state that preserves where the user is inside the schedule hierarchy.

## 11.1 Route State Model

Examples:

- `/schedule?scope=manager:MGR-001&view=month&date=2026-03-01`
- `/schedule?scope=center:CEN-001&view=day&date=2026-03-10`
- `/schedule?scope=center:CEN-001&view=day&date=2026-03-10&block=BLK-001`
- `/schedule?scope=center:CEN-001&view=day&date=2026-03-10&block=BLK-001&task=TSK-004`

## 11.2 Important IDs

The schedule system should support deep-linkable identity for:

- scope
- date
- building / center
- lane / worker
- block
- task
- source entity

Task identity should be stable and human-readable.

Example:

- `BLK-001-TSK-001`

This gives the product stable zoom state and makes admin testing, QA review, and future ATHENA analysis much easier.

---

## 12. RBAC and Scoping

The schedule system must remain scoped by the same CKS identity and ecosystem rules already used elsewhere.

## 12.1 Visibility

### Admin

- can view all ecosystems
- can switch between ecosystems
- can cascade from ecosystem to manager, contractor, customer, center, and crew scopes using the same positional hierarchy as Ecosystem

### Manager

- sees their ecosystem schedule
- can cascade downward through contractor, customer, center, and crew scopes in their ecosystem
- can create and edit schedule blocks in their scope

### Contractor

- sees their operational scope only
- can cascade downward through customer, center, and crew where current ecosystem visibility allows
- initially read-only unless business rules explicitly allow contractor scheduling ownership

### Customer

- sees only customer-relevant schedule slices
- can cascade downward through center and crew where current ecosystem visibility allows
- typically read-only

### Center

- sees building-level schedule for that location
- can view center and crew-level scheduling beneath that center
- typically read-only unless center scheduling authority is intentionally introduced later

### Crew

- sees only assigned blocks and relevant daily work
- can also view the center-level schedule context they belong to
- does not see the whole ecosystem plan

### Warehouse

- sees delivery blocks where the assigned warehouse matches their warehouse code
- sees logistics-relevant schedule blocks at centers they supply
- does not cascade into customer or crew schedule views
- remains logistics-focused rather than becoming a general ecosystem planning role

## 12.2 Edit Permissions

For the first serious version:

- Admin: full schedule authoring
- Manager: full schedule authoring within owned ecosystem
- everyone else: read-only or limited acknowledgment/status flows

This aligns with the requirement that Manager/Admin users be able to create and edit blocks.

## 12.3 Derived Block Editing Rules

Source-derived schedule blocks should be editable only within schedule-owned boundaries.

Allowed schedule edits:

- reschedule start/end time
- reassign crew / participants
- update task/procedure status
- add operational notes relevant to execution

Disallowed direct schedule edits:

- changing source-domain business titles
- deleting the underlying service/delivery/order from Schedule
- editing source-owned business workflow fields

Rule:

- Schedule owns temporal and assignment state
- source domains own business workflow state

## 12.4 Task Visibility

Task visibility must inherit from the owning schedule block and existing center/ecosystem scope.

Examples:

- crew sees only tasks in their visible assigned schedule scope
- center sees center-level task planning
- admin and manager see all tasks within their visible schedule scope

Task visibility should not create a separate RBAC model from blocks and schedule scope.

---

## 13. Export and Print Requirements

The system must replace manual schedule file production.

That means export and print are not optional add-ons.

## 13.1 Export Modes

The system should support:

- PDF export
- print-friendly layouts
- CSV export for tabular schedule data

## 13.2 Print Pack Types

Minimum target outputs:

- ecosystem weekly schedule pack
- building / center daily schedule sheet
- crew member daily assignment sheet
- building staffing schedule by week
- task/checklist sheet for a selected block

## 13.3 Print Layout Goals

Printed output should mirror the strengths of the existing manual PDF process:

- clear building identity
- employee roster
- day segmentation
- time rows
- task descriptions
- clean pagination
- low visual clutter

## 13.4 Product Rule

The app is the source of truth. Export is an output, not the authoring environment.

## 13.5 Minimum Export Set

The minimum export set that should replace the manual process is:

1. Building weekly schedule
2. Crew daily assignment sheet
3. Ecosystem summary schedule

Priority order:

- building weekly schedule first
- crew daily assignment sheet second
- ecosystem summary third

Task IDs should appear in crew-facing and execution-focused exports where task completion and support traceability matter.

---

## 14. UX and Visual Direction

This should feel closer to a high-end scheduling / dispatch / resource planning product than a generic calendar widget.

## 14.1 Desired Feel

- dense but readable
- tactile blocks
- polished transitions between zoom levels
- modular panels
- serious operational software, not consumer calendar software

## 14.2 Visual Building Blocks

The UI should be assembled from modular schedule primitives:

- scope bar
- day rail
- lane header
- schedule block
- task chip
- overlap indicator
- unassigned queue card
- print preview pane
- export menu

## 14.3 Editing Feel

Block editing should eventually feel like manipulating planning blocks on a board:

- direct
- spatial
- obvious
- reversible

---

## 15. Proposed Frontend Architecture

Suggested feature structure:

```text
apps/frontend/src/features/schedule/
  ├── ScheduleProvider.tsx
  ├── ScheduleTab.tsx
  ├── ScheduleScopeBar.tsx
  ├── ScheduleCalendarView.tsx
  ├── ScheduleDayPlan.tsx
  ├── ScheduleLane.tsx
  ├── ScheduleBlockCard.tsx
  ├── ScheduleTaskStack.tsx
  ├── ScheduleDetailPanel.tsx
  ├── SchedulePrintPreview.tsx
  └── useScheduleZoomState.ts
```

Recommended state model:

- scope
- view mode
- focused date
- selected lane
- selected block
- selected task
- filter set
- print/export mode

This should remain feature-local, not global.

Route/query state should be encoded from the start for:

- `scope`
- `view`
- `date`

Then expanded later with:

- `block`
- `task`

---

## 16. Proposed Backend Architecture

Suggested new backend domain:

```text
apps/backend/server/domains/schedule/
  ├── index.ts
  ├── routes.fastify.ts
  ├── service.ts
  ├── store.ts
  ├── types.ts
  ├── validators.ts
  ├── templates.ts
  └── exports.ts
```

Responsibilities:

- read schedule views
- create/update/delete schedule blocks
- assign workers
- attach tasks
- generate print/export payloads
- materialize calendar projections from schedule blocks

Concurrency requirement:

- `schedule_blocks` updates must use optimistic concurrency (`version`)
- update pattern should be equivalent to `UPDATE ... WHERE version = $expected`
- this must be part of the first schema version, not a retrofit

ID requirement:

- schedule tasks must use first-class generated CKS task IDs
- ID generation must support both production and TEST task variants
- task ID generation should plug into the existing custom ID system
- task instances should be generated relative to the owning block / service occurrence, not only the center

---

## 16.1 Admin Directory and ID-System Implications

Introducing first-class task IDs is not only a schedule-domain change.

It also affects the broader admin and identity architecture.

### Required Follow-On Work

1. Add `TSK` as a first-class CKS ID family in the custom ID system
2. Define TEST task IDs that align with the current TEST identity conventions
3. Add task records to the Admin directory model so they can be searched, inspected, and eventually managed
4. Ensure task IDs can participate in:
   - search
   - deep links
   - exports
   - activity/audit history
   - mobile crew task completion

### Initial Pattern

Recommended production direction:

- task templates:
  - service-scoped / center-service-scoped
- task instances:
  - block-scoped / service-occurrence-scoped

Recommended task-instance example:

- `BLK-001-TSK-001`

Recommended TEST pattern:

- `{testBlockId}-TSK-001`
  - or equivalent pattern once aligned with the broader custom ID rules and TEST block ID conventions

This must be reviewed against the global CKS ID system before implementation, but the Schedule spec should reserve for it now.

### Why This Matters

Crew mobile execution will eventually depend on task IDs as the atomic work item.

Without stable first-class task IDs:

- task completion becomes brittle
- support and QA lose precision
- exports lose operational usefulness
- activity and ATHENA lineage are weaker
- admin data management becomes inconsistent

So this is foundational, not optional cleanup.

---

## 17. Relationship To Existing Calendar Work

The existing calendar implementation should not be thrown away.

It should be repurposed.

### Keep

- RBAC and scope-aware event reads
- test data isolation
- summary counts
- date-window querying
- admin ecosystem switching
- agenda and full timeline foundations

### Change

- rename the user-facing product from `Calendar` to `Schedule`
- stop centering the UX around generic event lists
- introduce first-class schedule blocks and tasks
- make the main interaction inline drill-in instead of modal-first
- keep `calendar_events` as the unified rendering layer by projecting schedule blocks into it

### Outcome

Calendar becomes a subsystem inside Schedule.

---

## 18. Phased Refactor Plan

## Phase 1: Product Reframe

- rename `Calendar` tab to `Schedule`
- keep the current calendar implementation intact internally while `Schedule` becomes the user-facing shell
- preserve current date views
- formalize zoom hierarchy in UI state
- make the header and navigation schedule-oriented
- encode `scope`, `view`, and `date` in query params from the first Schedule version

## Phase 2: Day Plan Workspace

- add `Day Plan` as the primary zoom target
- introduce lanes by `building -> worker` as the default
- keep source event click-through, but make day drill-in the dominant interaction
- add scope cascade plus quick-jump search for admin/manager users

## Phase 3: Schedule Blocks

- create editable schedule blocks
- allow Admin/Manager authoring
- support assignment and movement of blocks
- project blocks into `calendar_events` via `generator_key = 'block:{blockId}'`
- begin introducing first-class task IDs for normalized block task stacks

## Phase 4: Task / Procedure Layers

- add task stacks inside blocks
- support inline drill-in to procedures and tasks
- begin replacing manual task breakdown documents
- prefer right-side detail panel on desktop and stacked center detail on mobile
- formalize task ID generation and crew mobile task completion against those IDs

## Phase 5: Export + Print

- add print preview and PDF export
- ship building/day/crew schedule outputs
- validate against the current manual PDF process

## Phase 6: Advanced Planning

- recurrence templates
- conflict detection
- workload balancing
- coverage gaps
- drag/resize interactions
- deeper analytics and ATHENA support

---

## 18.1 One-Shot Delivery Program

If CKS chooses to execute this as one coordinated refactor instead of many disconnected changes, the work should be delivered as a single program with tightly ordered slices.

The goal of the one-shot plan is:

- rename the product cleanly
- introduce the schedule domain once
- avoid parallel temporary architectures
- ship a usable Schedule workspace that already reflects the real product model

### Program Slice 1: Naming, Shell, and Scope

- rename the hub tab from `Calendar` to `Schedule`
- create `ScheduleTab` as the new shell that composes existing calendar views initially
- preserve current date-based views as the first Schedule lens
- implement the ecosystem-style cascading scope bar
- add quick-jump search for Admin and Manager
- encode `scope`, `view`, and `date` in query params

### Program Slice 2: Schedule Domain Foundation

- add `domains/schedule/` on the backend
- add `schedule_blocks`
- add `schedule_block_assignments`
- add `schedule_block_tasks`
- add `schedule_templates`
- include `version`, `updated_at`, recurrence, series, and generator fields from day one
- formalize `schedule_blocks -> calendar_events` projection using `generator_key = 'block:{blockId}'`

### Program Slice 3: ID System Expansion

- define `TSK` in the custom ID system
- decide final block ID format if not already reserved
- define task template vs task instance identity rules
- define TEST variants for block/task identity
- update admin directory and search assumptions to recognize task IDs

### Program Slice 4: Day Plan Workspace

- add `Day Plan` as the real operational view
- default grouping should be `building -> worker`
- render lanes, gaps, overlaps, and unassigned work
- support drill-in from month/week/agenda into day plan
- preserve source modal opening as a secondary action only

### Program Slice 5: Editable Blocks

- allow Admin/Manager to create schedule blocks
- allow move / resize / assign / duplicate / split / merge flows as the first editing set
- constrain edits for source-derived blocks to temporal and assignment state only
- support block creation from templates and manual block creation

### Program Slice 6: Task Stack Normalization

- support service-scoped task templates
- materialize block-scoped task instances when a schedule block or service occurrence is created
- give each task instance a first-class task ID
- support drill-in from block -> task
- prepare for mobile crew completion using task instance IDs

### Program Slice 7: Print and Export Replacement

- ship building weekly schedule export first
- ship crew daily assignment sheet second
- ship ecosystem summary third
- ensure printed output can replace the current manual PDF workflow

### Program Slice 8: Hardening and Rollout

- add optimistic concurrency protections
- add active-day refresh strategy
- validate role scoping against real ecosystems and TEST ecosystem
- validate export fidelity against Santiago’s current files
- roll out behind role-based flags if needed

### Definition Of Success For The One-Shot Program

The one-shot refactor is successful when:

1. users see `Schedule`, not `Calendar`, as the product
2. scope selection mirrors Ecosystem hierarchy
3. day drill-in becomes the main operational experience
4. Admin and Manager can author schedule blocks
5. task instances have stable first-class IDs
6. crew/mobile execution can target task instances cleanly
7. schedule blocks render through the unified calendar read model
8. CKS can export schedule outputs that replace the manual PDF process

---

## 19. Open Questions For Claude Review

1. Is there any reason not to formalize `schedule_blocks -> calendar_events` projection as a hard rule now?
2. Are the recurrence, series, and concurrency fields on `schedule_blocks` sufficient for future recurring block operations?
3. Is `building -> worker` the correct default day-plan grouping, with worker-first only as a secondary view?
4. Is the scope selector model correct as cascade primary plus quick-jump search secondary?
5. Should contractors ever get schedule editing rights, or should authoring remain strictly Admin/Manager for the foreseeable roadmap?
6. Are the constrained editing boundaries for source-derived blocks correct?
7. Is one unified `schedule_blocks` table still the right decision?
8. Is the desktop/mobile drill-in split correct: right-side detail on desktop, stacked center view on mobile?
9. Is the three-output minimum export set enough to replace Santiago's manual files operationally?
10. Should `scope`, `view`, and `date` be mandatory query params from the first Schedule version?
11. Is the warehouse scope now concrete enough for implementation?
12. Is the block-scoped/service-occurrence-scoped task ID direction correct, rather than center-scoped task IDs?
13. Should task records become visible in the Admin directory from the first normalized task implementation, or only once task authoring is fully shipped?

---

## 20. External Reference Direction

These references are useful for interaction and product framing, not for copying literally:

- Microsoft Planner Schedule View  
  `https://support.microsoft.com/en-us/office/use-schedule-view-in-planner-6f0cbfc8-3c7a-4f5a-8cb6-a18bfec221b7`
- Microsoft Dynamics 365 Schedule Board  
  `https://learn.microsoft.com/en-us/dynamics365/field-service/use-schedule-board`
- shadcn/ui Calendar  
  `https://ui.shadcn.com/docs/components/calendar`
- Clockify resource scheduling overview  
  `https://clockify.me/resource-management-software`
- Ganttic resource planning / scheduling positioning  
  `https://www.ganttic.com/resource-planning`

These references should inform:

- dispatch-board density
- lane-based planning
- schedule editing affordances
- print/export expectations
- modular control surfaces

---

## 20.1 Architectural Risk To Track

Editable schedule blocks introduce real multi-user concurrency risk.

Example:

- two managers open the same day plan
- both move or resize the same block
- one user silently overwrites the other

Minimum mitigation from day one:

- `version` on `schedule_blocks`
- optimistic concurrency checks on update
- `updated_at` tracking

Near-term operational mitigation:

- short-interval refresh or polling for active day-plan views

Later enhancement:

- WebSocket or SSE push for in-scope block changes

This does not need to ship in Phase 1 or Phase 2, but the schema must support it immediately.

---

## 21. Bottom Line

CKS should evolve from a read-only calendar tab into a full `Schedule` workspace.

The real opportunity is not "showing events better." It is replacing manual operational scheduling with a polished, scoped, editable, printable planning system for contracting businesses.

The right mental model is:

- `Calendar` is a lens
- `Schedule` is the product
- `Blocks` are the planning primitive
- `Zoom` is the interaction model
- `Print/export` is a first-class outcome
