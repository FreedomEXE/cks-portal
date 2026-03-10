# CKS Calendar System — Research & Implementation Document

**Status:** Architecture & Design Phase
**Owner:** Freedom_EXE
**Contributors:** Claude (CTO), GPT-4 (Review & Expansion)
**Created:** 2026-03-09
**Last Updated:** 2026-03-09

---

## 1. VISION

The calendar is not a feature — it is an **infrastructure layer**. It serves as the unified temporal lens across the entire CKS platform, connecting services, orders, crew schedules, deliveries, training, and every time-bound event in the system.

### Core Principles

1. **Events are created by source domains, not by the calendar.** Orders, services, training, and future scheduling domains remain the source of truth. The calendar owns the temporal read model, not the workflow itself.

2. **Ownership must be explicit.** Calendar rows are projections of source-domain state. Orders, services, deliveries, training, and future scheduling domains remain authoritative for creation, updates, cancellation, and completion.

3. **Reuse existing infrastructure first.** The calendar must plug into existing CKS primitives: PostgreSQL, raw SQL stores, `apiFetch`, SWR hooks, `PageWrapper`, `ModalProvider`/`ModalGateway`, activity logging, existing detail endpoints, and existing role scope resolution. No parallel state or access systems unless there is a hard blocker.

4. **Modular rendering.** One core calendar engine powers every view. The Calendar tab gets the broadest surface. A service modal gets a filtered slice. A crew profile gets that crew member's schedule. Same component family, different data scope.

5. **Identity-scoped through existing RBAC rules.** Every user sees calendar data relevant to their `cks_code` and role. Calendar visibility must follow the same ecosystem and participant rules already used by orders, services, reports, and hub scope endpoints.

6. **Data-first architecture.** All calendar events are stored in PostgreSQL with clean, normalized, queryable schemas. Every event is structured for future consumption by ATHENA. No throwaway data.

7. **Custom-built engine, optional external sync.** No third-party calendar service is the internal source of truth. External integrations (Google Calendar sync, iCal export, Outlook sync) are bolt-ons.

8. **Production-grade scheduling semantics.** The model must support planned time, actual execution time, recurrence exceptions, versioned updates, idempotent generation, and eventually delta sync / webhook-driven external synchronization.

---

## 2. WHERE THE CALENDAR LIVES IN THE APP

### Primary View: Dedicated Calendar Tab

The calendar should be a first-class tab in each relevant hub, not a hidden subsection of another feature. This is the cleanest integration path because hubs already use explicit tab definitions, and a dedicated Calendar tab avoids overloading the current Ecosystem experience.

**Phase 1 integration rule:** add `Calendar` as its own tab across the role hubs that need it. Do **not** replace the current `EcosystemTree`, and do not force calendar UX into the Ecosystem tab unless there is a clear product reason later.

For the mature version of the Calendar tab:

- **Day / Week / Month / Agenda** modes
- Events color-coded by domain (service, order, delivery, training, etc.)
- Click event → opens the existing relevant detail modal through the current modal system
- Filter controls: by domain, by entity, by status

### Secondary Surface: Optional Ecosystem Widget

The Ecosystem tab may still show a lightweight calendar widget later if it adds value, but this is secondary to the dedicated Calendar tab.

### Contextual Widgets: Surfaced Everywhere

The calendar also appears as **filtered, embedded widgets** in other areas of the app:

| Location | What It Shows | Scope Filter |
|---|---|---|
| **Service Modal** | Service visit timeline and related milestones | `source_id = SO-xxx` or `source_id = SRV-xxx` |
| **Crew Profile/Modal** | That crew member's full schedule | `participant includes CRW-xxx` |
| **Center Detail** | All events at that location | `center_id = CEN-xxx` |
| **Customer Modal** | Services/deliveries for that customer | `customer_id = CUS-xxx` |
| **Warehouse View** | Shipments, pickups, inventory events | `warehouse_id = WHS-xxx` |
| **Manager Dashboard** | Ecosystem-wide timeline | `manager_id = MGR-xxx` |
| **Contractor View** | Events across their assigned customers | `contractor_id = CON-xxx` |
| **Order Detail** | Timeline of order lifecycle events | `order_id = ORD-xxx` |

### Widget Modes

The calendar component should support multiple render modes:

1. **Agenda View** — Upcoming events list, grouped by day. This is the safest Phase 1 surface.
2. **Timeline/List** — Chronological event list for modals and detail panels.
3. **Mini Calendar** — Compact month picker with event indicators for dashboards and side panels.
4. **Full Calendar** — Month/week/day grid for the dedicated Calendar tab once the base integration is stable.

---

## 3. DATABASE SCHEMA (PROPOSED)

### 3.1 Core Table: `calendar_events`

This is the central event table. Every time-bound occurrence in the system creates a record here.

Important design rule: this table is a **temporal read model** fed by other domains. The calendar UI itself does not author events.

```sql
CREATE TABLE calendar_events (
    event_id        TEXT PRIMARY KEY,           -- EVT-xxxxx (custom ID format)

    -- Event Classification
    event_type      TEXT NOT NULL,              -- 'service_visit' | 'delivery' | 'order_milestone' | 'training' | 'inspection' | 'crew_shift'
    event_category  TEXT,                       -- Higher-level grouping: 'service' | 'logistics' | 'operations' | 'training' | 'admin'
    title           TEXT NOT NULL,
    description     TEXT,

    -- Temporal Data
    planned_start_at TIMESTAMPTZ NOT NULL,
    planned_end_at   TIMESTAMPTZ,              -- NULL = point-in-time event (milestone)
    actual_start_at  TIMESTAMPTZ,
    actual_end_at    TIMESTAMPTZ,
    all_day         BOOLEAN DEFAULT FALSE,
    timezone        TEXT DEFAULT 'America/Toronto',

    -- Series / recurrence linkage
    template_id     TEXT,                       -- FK to recurrence template when event is generated from a series
    series_parent_id TEXT REFERENCES calendar_events(event_id),
    occurrence_index INTEGER,
    recurrence_id   TIMESTAMPTZ,                -- Original occurrence start for exception instances
    is_exception    BOOLEAN NOT NULL DEFAULT FALSE,

    -- Source Entity (what created this event)
    source_type     TEXT NOT NULL,              -- 'service_order' | 'service' | 'product_order' | 'delivery' | 'training' | 'system'
    source_id       TEXT,                       -- Originating entity ID (SO-xxx, SRV-xxx, PO-xxx, etc.)
    source_action   TEXT,                       -- Status/action that generated the event ('crew_assigned', 'awaiting_delivery', etc.)
    source_detail   TEXT,                       -- Optional sub-reference (line item, reminder type, note)
    generator_key   TEXT,                       -- Idempotency key for generator jobs / upserts
    source_version  TEXT,                       -- Owning domain version / status version when materialized
    source_hash     TEXT,                       -- Last materialized payload fingerprint

    -- Location
    center_id       TEXT REFERENCES centers(center_id),
    warehouse_id    TEXT REFERENCES warehouses(warehouse_id),
    location_name   TEXT,                      -- Freeform location if not a center/warehouse
    location_address TEXT,

    -- Status & Priority
    status          TEXT NOT NULL DEFAULT 'scheduled',  -- 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled' | 'overdue'
    priority        TEXT DEFAULT 'normal',              -- 'low' | 'normal' | 'high' | 'urgent'

    -- Visual
    color           TEXT,                       -- Hex color override (otherwise derived from event_type)
    icon            TEXT,                       -- Icon identifier

    -- Metadata
    metadata        JSONB DEFAULT '{}',         -- Flexible additional data (tools needed, notes, checklist items, etc.)
    tags            TEXT[] DEFAULT '{}',

    -- Audit
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      TEXT NOT NULL,              -- cks_code of creator
    created_by_role TEXT NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_by      TEXT,
    version         INTEGER NOT NULL DEFAULT 1, -- optimistic concurrency / sync version

    -- Archive (CKS standard)
    archived_at     TIMESTAMPTZ,
    archived_by     TEXT,
    archive_reason  TEXT,
    deletion_scheduled TIMESTAMPTZ,
    restored_at     TIMESTAMPTZ,
    restored_by     TEXT
);

CREATE INDEX idx_calendar_events_start_at ON calendar_events(planned_start_at);
CREATE INDEX idx_calendar_events_end_at ON calendar_events(planned_end_at);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);
CREATE INDEX idx_calendar_events_source ON calendar_events(source_type, source_id);
CREATE INDEX idx_calendar_events_center ON calendar_events(center_id);
CREATE INDEX idx_calendar_events_warehouse ON calendar_events(warehouse_id);
CREATE INDEX idx_calendar_events_generator_key ON calendar_events(generator_key);
CREATE INDEX idx_calendar_events_window ON calendar_events(planned_start_at, planned_end_at);
```

### 3.1A Production Hardening Requirements

For a production-grade calendar, the event table must support more than just rendering a grid:

- **Planned vs actual time:** scheduling quality depends on storing what was planned separately from when work actually started/ended.
- **Fast window queries:** Phase 1 uses a composite B-tree on `planned_start_at, planned_end_at`, which is sufficient for agenda and date-window reads.
- **Future overlap queries:** promote to `tstzrange` plus GiST later with an immutable wrapper or stored range implementation that is compatible with the target PostgreSQL environment.
- **Optional hard conflict prevention:** where double-booking must be prevented, PostgreSQL exclusion constraints can be applied to a resource identifier plus time range.
- **Optimistic concurrency:** `version` must increment on every write so internal projection updates and external sync can safely detect stale state.
- **Idempotent generation:** `generator_key` lets source-domain event generators rerun safely without duplicating rows.
- **Materialization tracking:** `source_version` / `source_hash` make it possible to know whether the calendar copy is stale relative to the source entity.

### 3.2 Participant Linking: `calendar_event_participants`

Every event can involve multiple entities. This supports fast lookup, notification targeting, and explicit projection scoping.

To maximize reuse, this table intentionally mirrors the naming convention already used by `order_participants`.

```sql
CREATE TABLE calendar_event_participants (
    id              SERIAL PRIMARY KEY,
    event_id        TEXT NOT NULL REFERENCES calendar_events(event_id) ON DELETE CASCADE,

    -- Who is involved
    participant_id  TEXT NOT NULL,              -- CKS code: MGR-001, CRW-045, etc.
    participant_role TEXT NOT NULL,             -- 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse' | 'admin'

    -- Their role in this event
    participation_type TEXT NOT NULL DEFAULT 'watcher', -- align with order_participants: 'creator' | 'destination' | 'actor' | 'watcher'

    -- Notification preferences
    notify          BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(event_id, participant_id, participant_role)
);

-- Index for fast scoping: "show me all events for CRW-045"
CREATE INDEX idx_cep_participant ON calendar_event_participants(participant_id, participant_role);
CREATE INDEX idx_cep_event ON calendar_event_participants(event_id);
```

### 3.3 Recurrence Templates (Optional, for recurring services)

Recurrence rules should live here, not be duplicated across every event instance. Generated event rows reference the template.

```sql
CREATE TABLE calendar_recurrence_templates (
    template_id     TEXT PRIMARY KEY,          -- RTPL-xxxxx

    -- What recurs
    source_type     TEXT NOT NULL,             -- 'service_order'
    source_id       TEXT NOT NULL,

    -- Recurrence definition
    rrule           TEXT NOT NULL,             -- iCal RRULE: 'FREQ=WEEKLY;BYDAY=MO,WE,FR'
    rdate           TIMESTAMPTZ[] DEFAULT '{}', -- explicit included occurrences
    exdate          TIMESTAMPTZ[] DEFAULT '{}', -- skipped occurrences / exceptions
    start_date      DATE NOT NULL,
    end_date        DATE,                      -- NULL = indefinite

    -- Template for generated events
    event_type      TEXT NOT NULL,
    title_template  TEXT NOT NULL,             -- 'Weekly Floor Cleaning - {{center_name}}'
    duration_minutes INTEGER,
    default_participants JSONB,                -- Array of {type, id, role}

    -- Status
    is_active       BOOLEAN DEFAULT TRUE,
    last_generated  TIMESTAMPTZ,              -- Last time events were auto-generated
    generate_ahead_days INTEGER DEFAULT 30,    -- How far ahead to pre-generate events

    -- Audit
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      TEXT NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    -- Archive
    archived_at     TIMESTAMPTZ,
    archived_by     TEXT,
    archive_reason  TEXT
);
```

**Decision:** `calendar_recurrence_templates` is the authoritative recurrence definition. `calendar_events` stores generated instances only.

**Production requirement:** recurrence support must be designed around RFC 5545 concepts, not just RRULE strings. That means supporting RRULE plus explicit included dates (`RDATE`), excluded dates (`EXDATE`), and exception instances (`RECURRENCE-ID` / overridden occurrences).

### 3.4 Google Calendar Sync (Future Bolt-On)

```sql
CREATE TABLE calendar_external_sync (
    id              SERIAL PRIMARY KEY,
    user_cks_code   TEXT NOT NULL,
    provider        TEXT NOT NULL DEFAULT 'google',  -- 'google' | 'outlook' | 'ical'

    -- OAuth tokens (encrypted)
    access_token    TEXT,
    refresh_token   TEXT,
    token_expires   TIMESTAMPTZ,

    -- Sync config
    sync_direction  TEXT DEFAULT 'push',       -- 'push' | 'pull' | 'bidirectional'
    external_calendar_id TEXT,                 -- Google calendar ID
    sync_token      TEXT,                      -- Google syncToken / provider incremental cursor
    delta_link      TEXT,                      -- Outlook/Microsoft Graph deltaLink
    last_synced     TIMESTAMPTZ,
    sync_enabled    BOOLEAN DEFAULT TRUE,
    full_sync_required BOOLEAN DEFAULT FALSE,

    -- Watch / webhook channel state
    channel_id      TEXT,
    channel_resource_id TEXT,
    channel_expires_at TIMESTAMPTZ,

    -- Audit
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Map internal events to external calendar events
CREATE TABLE calendar_external_event_map (
    id              SERIAL PRIMARY KEY,
    event_id        TEXT NOT NULL REFERENCES calendar_events(event_id),
    sync_id         INTEGER NOT NULL REFERENCES calendar_external_sync(id),
    external_event_id TEXT NOT NULL,           -- Google Calendar event ID
    external_etag   TEXT,
    external_sequence TEXT,
    last_synced     TIMESTAMPTZ DEFAULT NOW(),
    sync_status     TEXT DEFAULT 'synced',     -- 'synced' | 'pending' | 'conflict' | 'error'
    last_error      TEXT
);
```

### 3.5 Background Processing Model

Calendar generation and external sync should not rely solely on inline request/response writes.

- Source-domain mutations should emit calendar work items or call idempotent generator functions.
- A background worker should handle recurrence expansion, reminder generation, sync retries, and webhook channel renewal.
- External sync ingestion must tolerate dropped webhooks by periodically running incremental sync from the last stored cursor/token.

---

## 4. EVENT GENERATION — HOW EVENTS GET CREATED

All calendar events are generated by existing app actions and data changes. The calendar UI is read-only.

### 4.0 Ownership Rules

1. **The calendar does not create events.** There is no user-facing “new event” flow in the Calendar tab.
2. **All event rows are generated from source domains**: orders, services, deliveries, training, assignments, and future scheduling-capable modules.
3. **Derived events are not independently editable.** Calendar UI can expose drill-down and allowed source actions, but those actions must call the owning source domain and then refresh calendar state.
4. **Phase 1 granularity is conservative.** Until service procedures/tasks become first-class records instead of freeform metadata, the calendar should generate one `service_visit` event per service order / service execution window, not one event per task.
5. **Generator operations must be idempotent.** Replaying the same order/service transition must update the same calendar row rather than create duplicates.

### 4.1 Source Mapping Matrix (Current App Actions)

This is the authoritative Phase 1 mapping list. If an app action should affect the calendar, it must be explicitly mapped here and implemented at the source-domain write point.

| Source Domain | Existing App Action / Change | Current Code Location | Calendar Effect |
|---|---|---|---|
| Orders | `PATCH /api/orders/:orderId` updating `expectedDate` | `orders/store.ts:updateOrderFields` | Create/update delivery or service scheduling event if the order has a schedulable date |
| Orders | `accept` on service order leading to service creation | `orders/store.ts:applyOrderAction` | Create/update `service_visit` event with planned window from order metadata |
| Orders | `accept` on product order leading to `awaiting_delivery` | `orders/store.ts:applyOrderAction` | Create/update `delivery` event |
| Orders | `start-delivery` | `orders/store.ts:applyOrderAction` | Mark delivery event `in_progress` |
| Orders | `deliver` | `orders/store.ts:applyOrderAction` | Mark delivery event `completed` |
| Orders | `cancel` | `orders/store.ts:applyOrderAction` | Mark related calendar event `cancelled` |
| Orders | `reject` | `orders/store.ts:applyOrderAction` | Cancel/remove pending derived event if one exists |
| Orders | `complete` on service order | `orders/store.ts:applyOrderAction` | Mark related service/order milestone event completed if still used |
| Orders | `requestCrewAssignment` | `orders/store.ts:requestCrewAssignment` | No event yet unless schedule already exists; update event metadata with pending staffing state |
| Orders | `respondToCrewRequest` causing `crew_assigned` | `orders/store.ts:respondToCrewRequest` | Create/update `service_visit` event and attach accepted crew participants |
| Services | `start` | `services/service.ts:applyServiceAction` | Mark `service_visit` event `in_progress`, populate `actual_start_at` |
| Services | `complete` | `services/service.ts:applyServiceAction` | Mark `service_visit` event `completed`, populate `actual_end_at` |
| Services | `cancel` | `services/service.ts:applyServiceAction` | Mark `service_visit` event `cancelled` |
| Services | `verify` | `services/service.ts:applyServiceAction` | Optional audit metadata only; usually no separate event row |
| Services | `update-notes` | `services/service.ts:applyServiceAction` | No new event row; may update existing event metadata |
| Services | metadata update to `crew`, `procedures`, `training`, `tasks`, `notes` | `services/service.ts:updateServiceMetadata` | Update existing event metadata and participants only |
| Services | `addServiceCrewRequests` | `services/service.ts:addServiceCrewRequests` | Update staffing metadata on existing service event |
| Services | `respondToServiceCrewRequest` | `services/service.ts:respondToServiceCrewRequest` | Update participants on existing service event |
| Deliveries | delivery row status/date changes | future delivery domain / `deliveries` table | Create/update `delivery` events from canonical delivery records once that domain is active |
| Training | training row schedule/status changes | future training domain / `training` table | Create/update `training` or `inspection` events |
| Assignments | crew assigned to center | `assignments/store.ts:assignCrewToCenter` | No immediate calendar row in Phase 1; becomes relevant only when actual scheduled work exists |

### 4.2 Service Order / Service Event Rules

When service-related state changes in the current app:

| Source Change | Calendar Event Result |
|---|---|
| Service order gains a concrete planned window (`expectedDate`, `serviceStartDate`, start/end metadata) | Create or update one `service_visit` event |
| `crew_requested` | No new row; keep staffing state in event metadata if event exists |
| `crew_assigned` | Update participants on the `service_visit` event |
| `service_created` / service ID assigned | Link the event to concrete `service_id` and `order_id` |
| Service action `start` | Mark existing event `in_progress`, set `actual_start_at` |
| Service action `complete` | Mark existing event `completed`, set `actual_end_at` |
| Service action `cancel` | Mark existing event `cancelled` |

**Phase 1 decision:** procedures, training items, and tasks remain event metadata only. They do not each become their own calendar row yet because they currently live in `orders.metadata`.

### 4.3 Product Order / Delivery Event Rules

| Source Change | Calendar Event Result |
|---|---|
| `pending_warehouse` | No delivery event yet |
| `awaiting_delivery` | `delivery` event at destination center/warehouse |
| `expectedDate` update | Reschedule delivery event |
| `start-delivery` | Mark delivery event `in_progress` |
| `delivered` | Mark delivery event `completed` |
| `cancel` / `reject` | Mark delivery event `cancelled` |

### 4.4 Training / Inspection Event Rules

| Training Action | Calendar Event Created |
|---|---|
| Training scheduled | `training` event for crew member |
| Certification expiring | `inspection` event (auto-generated reminder) |

### 4.5 No Direct Calendar-Originated Writes

- No `Create Event` button in the Calendar tab
- No drag-to-create workflow in the calendar grid
- No direct reschedule/cancel actions in calendar unless they proxy into an existing source-domain action
- Any new domain that wants calendar presence must define its source mapping first

---

## 5. FRONTEND COMPONENT ARCHITECTURE

### 5.1 Component Hierarchy

```
Existing Hub Screen
└── PageWrapper (existing)
    └── CalendarPanel
        ├── CalendarProvider (feature-local context; not a new app-wide provider)
        ├── CalendarAgenda (Phase 1)
        ├── CalendarTimeline (modal/tab embedding)
        ├── CalendarMini (dashboard widget)
        └── CalendarFull (Phase 3, primary in Calendar tab)

Supporting components
├── CalendarHeader
├── CalendarFilters
├── CalendarEventChip
├── CalendarDayGroup
└── CalendarEmptyState
```

**Integration rule:** do not build a separate calendar modal manager. Event clicks must reuse the existing `ModalProvider` / `ModalGateway` flow already used across the app.

### 5.2 Data Flow

```
CalendarProvider
  ├── useCalendarEvents(filters: CalendarFilter) → SWR hook
  │     → apps/frontend/src/shared/api/calendar.ts
  │     → apiFetch('/calendar/events?...')
  │
  ├── CalendarFilter {
  │     startDate: Date
  │     endDate: Date
  │     scopeType?: 'user' | 'center' | 'service' | 'crew' | 'order'
  │     scopeId?: string          // CKS code or entity ID
  │     eventTypes?: string[]     // Filter by event type
  │     statuses?: string[]       // Filter by status
  │     participantId?: string    // Filter by participant
  │   }
  │
  └── Actions:
        refreshWindow() → revalidate SWR key
        setFilters(next) → update local filter state
        openSourceEntity(event) → useModals().openById(event.openTargetId)
```

**Fetch/revalidation rules**

- Build calendar fetchers in `apps/frontend/src/shared/api/calendar.ts` using the existing `apiFetch` helper.
- Use SWR for cache/revalidation, consistent with current shared API hooks.
- The Calendar tab is read-only; revalidation happens after source-domain mutations elsewhere in the app.
- Reuse existing blocking/loading wrappers where a calendar action opens a modal or triggers a source-domain action via an existing modal.

### 5.3 Integration Pattern (Embedding in Modals/Tabs)

Any modal or tab can embed a calendar widget by providing a filter scope:

```tsx
// Inside a Service Modal
<CalendarAgenda
  scopeType="service"
  scopeId={service.serviceId}
  title="Service Schedule"
  showWindowSelector={false}
/>

// Inside a Crew Profile
<CalendarAgenda
  scopeType="crew"
  scopeId={crew.crew_id}
  title="Upcoming Assignments"
/>

// Inside Center Detail
<CalendarMini
  scopeType="center"
  scopeId={center.center_id}
  onDateSelect={(date) => openDayDetail(date)}
/>

// Calendar Tab — broad user view
<CalendarAgenda
  scopeType="user"
  scopeId={currentUser.cksCode}
/>
```

### 5.4 Reuse Map

- **App shell/layout:** reuse `PageWrapper` and current hub tab layout.
- **Navigation:** add Calendar as its own hub tab using the same tab pattern already used by dashboard/profile/ecosystem/services/orders/reports/support.
- **Network/home context:** preserve the existing `EcosystemTree`; any Ecosystem calendar view is optional and secondary.
- **Detail views:** event click opens the existing entity modal via `useModals().openById(...)`.
- **Entity fetching:** reuse existing detail endpoints already consumed by `ModalProvider` (`/orders/.../details`, `/services/.../details`, profile routes, catalog details).
- **Service embedding:** place a scoped service schedule widget inside the existing service modal rather than creating a separate service-calendar modal.
- **Activity/history:** reuse the current activity writer and history infrastructure rather than inventing calendar-specific audit logs.

---

## 6. API ENDPOINTS (PROPOSED)

### Backend Domain: `domains/calendar/`

Following existing CKS domain-driven structure:

```
domains/calendar/
  ├── routes.fastify.ts      — Route definitions
  ├── service.ts             — Business logic
  ├── store.ts               — Database queries
  ├── types.ts               — TypeScript types
  ├── validators.ts          — Zod schemas
  └── event-generators.ts    — Logic for auto-creating events from system actions
```

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/calendar/events` | Fetch events (with filters: date range, scope, type) |
| `GET` | `/api/calendar/events/:eventId` | Get single event detail |
| `GET` | `/api/calendar/agenda` | Agenda view (optimized: grouped by day, limited fields) |
| `GET` | `/api/calendar/availability` | Check crew/resource availability for a time range |
| `GET` | `/api/calendar/summary` | Lightweight counts for badges/widgets |

### Response Shape Requirements

Every event response should include enough information to integrate with the existing UI without duplicate fetching logic:

- `eventId`
- `sourceType`
- `sourceId`
- `openTargetId` — preferred target for `ModalProvider.openById(...)`
- `openTargetType` — optional explicit type for future use
- `status`
- `participantIds` / `participantRoles` as needed for rendering
- `updatedAt`

### Pagination, Delta, and Freshness

A serious calendar implementation cannot assume that every client will refetch a whole date window on every interaction.

- `GET /api/calendar/events` should support stable pagination for large windows.
- Add `GET /api/calendar/events/changes` or equivalent cursor-based delta endpoint for future clients that need incremental refresh.
- External sync must preserve provider cursors/tokens rather than relying on naive `updated_at > X` polling.

### Integration Rules

1. Calendar detail actions for derived events should call existing order/service endpoints, not duplicate that business logic under `/calendar`.
2. Calendar event chips should deep-link into existing modals, not bespoke calendar detail drawers.
3. The calendar domain may reuse shared scope helpers from `domains/scope/` to decide visibility instead of rebuilding ecosystem traversal logic.
4. Calendar writes are internal source-domain materialization concerns, not user-facing calendar API concerns.

### 6.1 Internal Calendar Service Interface

Public API is read-only, but the backend needs a reusable internal interface for source domains.

Proposed internal functions in `domains/calendar/service.ts`:

- `upsertOrderCalendarProjection(input)`
- `upsertServiceCalendarProjection(input)`
- `upsertDeliveryCalendarProjection(input)`
- `upsertTrainingCalendarProjection(input)`
- `cancelCalendarProjectionBySource(input)`
- `syncCalendarParticipants(input)`

These functions should be called directly from existing source-domain stores/services at write time or from idempotent background jobs.

---

## 7. ROLE-BASED ACCESS & VISIBILITY

Calendar events inherit CKS RBAC principles. Each role sees only what they should:

| Role | Calendar Scope | Calendar-Originated Writes? |
|---|---|---|
| **Admin** | All events system-wide | No, not from calendar UI |
| **Manager** | All events in their ecosystem (their contractors, customers, centers, crew, warehouses) | No, not from calendar UI |
| **Contractor** | Events involving their assigned customers/centers | No |
| **Customer** | Events at their centers, their orders | No |
| **Center** | Events at their specific location | No (views only) |
| **Crew** | Their own assignments and schedule | No (views their schedule only) |
| **Warehouse** | Delivery/logistics events at their warehouse | No |

Visibility is enforced at the **API level**, but the participant table is not enough by itself.

**Implementation rule:** reuse the existing ecosystem scope logic already applied to orders, services, reports, and activity feeds.

- For **derived events**, a user can see the event if and only if they can see the owning source entity under current CKS scope rules.
- `calendar_event_participants` is primarily a lookup and notification aid; it is not the sole RBAC authority for derived events.

The frontend never sees events the user should not access.

---

## 8. ATHENA DATA CONSIDERATIONS

All calendar data is structured for future LLM training:

### What ATHENA Can Learn From Calendar Data:
- **Service patterns** — Which services are most frequent? What's the typical duration vs. estimated?
- **Scheduling efficiency** — How often are events rescheduled? What causes delays?
- **Crew utilization** — How fully booked is each crew member? Gaps and overlaps?
- **Seasonal trends** — When do certain service types spike?
- **Completion rates** — Scheduled vs. completed vs. cancelled ratios
- **Time accuracy** — How accurate are estimated durations vs. actuals?

### Schema Design for ATHENA:
- All timestamps use `TIMESTAMPTZ` (timezone-aware)
- Status transitions are tracked (current status + activity_logs history)
- `metadata JSONB` allows flexible data capture without schema changes
- Participant table captures the full relationship graph
- Source linking (`source_type`, `source_id`) enables cross-domain analysis

---

## 9. IMPLEMENTATION PHASES (PROPOSED)

### Phase 1: Foundation
- [ ] Create database tables (`calendar_events`, `calendar_event_participants`)
- [ ] Add production-grade columns for planned vs actual time, `version`, and `generator_key`
- [ ] Add Phase 1 window indexing on (`planned_start_at`, `planned_end_at`); defer `tstzrange` + GiST until Postgres compatibility is finalized
- [ ] Create backend domain (`domains/calendar/`) with read endpoints + internal projection services
- [ ] Create `apps/frontend/src/shared/api/calendar.ts` using existing `apiFetch`
- [ ] Build `CalendarProvider` context and `useCalendarEvents` hook with SWR
- [ ] Build `CalendarAgenda` component (simplest view — list of events)
- [ ] Add a dedicated Calendar tab to each relevant hub
- [ ] Event click integration through the existing `ModalProvider`

### Phase 2: System Integration
- [ ] Event generators: auto-create calendar events from service order and service status changes
- [ ] Make event generators idempotent using stable generator/source keys
- [ ] Event generators: auto-create events from product order milestones
- [ ] Wire calendar projection calls into `applyOrderAction`, `updateOrderFields`, `requestCrewAssignment`, `respondToCrewRequest`
- [ ] Wire calendar projection calls into `applyServiceAction`, `updateServiceMetadata`, `addServiceCrewRequests`, `respondToServiceCrewRequest`
- [ ] Embed a scoped service schedule widget in the service modal
- [ ] Embed `CalendarAgenda` in Crew profile/modal
- [ ] Activity log integration (calendar actions → activity feed)

### Phase 3: Full Calendar Views
- [ ] Build `CalendarFull` component (month/week/day grid)
- [ ] Build `CalendarMini` component (compact picker)
- [ ] Expand the dedicated Calendar tab to full month/week/day views
- [ ] Optionally add a lightweight Ecosystem calendar widget or shortcut if product value is proven
- [ ] Embed `CalendarMini` in dashboard widgets
- [ ] Center and Warehouse calendar views

### Phase 4: Advanced Features
- [ ] Recurrence templates and auto-generation
- [ ] Crew availability checking
- [ ] Conflict detection (double-booking prevention)
- [ ] Drag-and-drop rescheduling (full calendar view)
- [ ] Notification system (upcoming events, overdue alerts)
- [ ] Recurrence exceptions (`RDATE`, `EXDATE`, overridden instances)
- [ ] Planned vs actual analytics and lateness tracking

### Phase 5: External Integration
- [ ] Google Calendar OAuth flow
- [ ] Push events to Google Calendar
- [ ] Pull external events (optional)
- [ ] Outlook/iCal export
- [ ] Incremental sync using provider sync tokens / delta links
- [ ] Webhook channel management and renewal
- [ ] Conflict handling based on provider versions / etags

---

## 10. DECISIONS & OPEN QUESTIONS

The following have now been clarified enough to guide implementation:

1. **Procedures/Tasks structure** — Today, service procedures, training, and tasks are stored in service/order metadata, not in dedicated relational tables. That means they are not yet stable enough to drive one-event-per-task generation.

2. **Event granularity** — **Decision:** Phase 1 uses one `service_visit` event per service order / service execution window. Procedures/tasks remain attached as metadata only. Revisit sub-events only after task normalization exists.

3. **Crew shift model** — **Open question:** crew availability and working hours are not yet modeled as a dedicated scheduling source. Availability checks should be treated as a later phase.

4. **Recurrence ownership** — **Decision:** recurrence definitions belong to the source workflow/template, not to individual event instances. Calendar stores generated instances only.

5. **Historical events** — **Recommended approach:** do not block launch on a full backfill. Start with forward-generation plus a bounded backfill for active items and a recent historical window after the first release is stable.

6. **Mobile considerations** — **Open question:** Agenda view is the default mobile-safe surface. Native push or dedicated mobile scheduling UX should wait until there is a confirmed mobile roadmap.

7. **Time zones** — **Decision for now:** default to `America/Toronto`, store everything in `TIMESTAMPTZ`, and keep the model future-safe for multi-timezone support.

8. **Event editing permissions** — **Decision:** there are no direct event editing APIs exposed to the Calendar tab. Event changes must happen through source-domain actions.
8. **Event editing permissions** — **Decision:** there are no direct event creation or editing flows in the Calendar tab. All event changes must happen through source-domain actions.

9. **Calendar placement** — **Decision:** the calendar should launch as its own dedicated tab. The Ecosystem tab remains intact, and any calendar widget there is optional and secondary.

10. **Reuse boundary** — **Decision:** implementation must reuse existing `apiFetch`, SWR patterns, `ModalProvider` / `ModalGateway`, existing detail endpoints, current activity logging, and current scope/RBAC logic wherever possible.

11. **Conflict semantics** — **Open question:** which resources are hard-booked versus soft-booked? For example, should crew overlap be blocked, warned, or allowed with manager override?

12. **Delta sync scope** — **Open question:** when external sync is added, will CKS track one provider calendar per user, per team, or per role-based operational calendar?

13. **Domain coverage** — **Decision:** any future feature that introduces scheduled or time-bound behavior must define its calendar projection mapping at design time. Calendar integration is not optional once a workflow depends on time.

---

## 11. TECHNICAL DEPENDENCIES

### Already Available in CKS:
- ✅ PostgreSQL with raw SQL queries (no ORM)
- ✅ SWR for data fetching
- ✅ Shared `apiFetch` client with mutation-driven activity refresh
- ✅ `date-fns` for date utilities
- ✅ Tailwind CSS for styling
- ✅ Framer Motion for animations
- ✅ `PageWrapper` and existing hub tab layouts
- ✅ Modal system (`ModalProvider` / `ModalGateway`) for event detail deep links
- ✅ Activity logging infrastructure
- ✅ RBAC policy system
- ✅ Existing scope resolution and ecosystem-aware visibility logic
- ✅ Custom ID generation

### May Need to Add:
- Calendar grid layout utilities (CSS Grid based — no external lib needed)
- Date range picker component (for filter controls)
- iCal RRULE parser (for recurrence — `rrule` npm package, small and well-maintained)
- PostgreSQL `btree_gist` extension if we enforce overlap constraints on specific resource identifiers

---

## 12. OPERATIONAL EXCELLENCE REQUIREMENTS

This is the difference between a working feature and a platform-grade system.

### 12.1 Observability

- Every generator run should emit structured logs with `source_type`, `source_id`, `generator_key`, outcome, and latency.
- Calendar sync jobs should track token age, retry count, last successful sync time, and last error.
- Add metrics for:
  - event generation success/failure
  - duplicate suppression via `generator_key`
  - calendar query latency by endpoint
  - conflict detection hits
  - recurrence expansion job latency
  - external sync drift / backlog

### 12.2 Rollout Strategy

- Ship behind a feature flag per role or per hub.
- Start read-only for derived events.
- Keep the Calendar tab read-only in the initial rollout.
- Defer full recurrence editing and external sync until the base scheduling model proves stable in production.

### 12.3 Migration / Backfill

- Migrations must be additive first.
- Backfill should be resumable and idempotent.
- Backfill should prioritize:
  - active service orders
  - active deliveries
  - near-future scheduled work
  - only then recent historical data needed for ATHENA

### 12.4 Testing Bar

- Unit tests for recurrence expansion, idempotent generation, and visibility filtering
- Integration tests for:
  - order/service transition → calendar row creation
  - event click → correct modal opens
  - stale `version` update rejection
  - manager / crew / customer visibility differences
- Timezone and DST tests
- Large-window query performance tests
- Sync replay tests for duplicate webhook delivery and dropped webhook recovery

### 12.5 Failure Modes

- Generator replay must not create duplicate events.
- External sync failure must not block source-domain writes.
- Projection write conflicts must fail loudly, not silently overwrite.
- Recurrence expansion must tolerate partial failure and resume safely.

---

## 13. IMPLEMENTATION BLUEPRINT

This section is the execution map for the current repo.

### 13.1 Backend Files To Add

Add a new backend domain:

```text
apps/backend/server/domains/calendar/
  ├── index.ts
  ├── routes.fastify.ts
  ├── service.ts
  ├── store.ts
  ├── types.ts
  ├── validators.ts
  └── projections.ts
```

Responsibilities:

- `routes.fastify.ts`
  - read-only endpoints: `GET /api/calendar/events`, `GET /api/calendar/events/:eventId`, `GET /api/calendar/agenda`, `GET /api/calendar/summary`
- `service.ts`
  - orchestration for read APIs
  - shared projection upsert/cancel helpers used by source domains
- `store.ts`
  - raw SQL window queries, agenda queries, participant joins, source-based upserts
- `projections.ts`
  - narrow source-specific helper functions:
    - `upsertOrderProjection`
    - `upsertServiceProjection`
    - `upsertDeliveryProjection`
    - `upsertTrainingProjection`
    - `cancelProjectionBySource`

### 13.2 Backend Files To Modify

- `apps/backend/server/index.ts`
  - register the new calendar routes
- `apps/backend/server/domains/orders/store.ts`
  - call calendar projection helpers from:
    - `applyOrderAction`
    - `updateOrderFields`
    - `requestCrewAssignment`
    - `respondToCrewRequest`
- `apps/backend/server/domains/services/service.ts`
  - call calendar projection helpers from:
    - `applyServiceAction`
    - `updateServiceMetadata`
    - `addServiceCrewRequests`
    - `respondToServiceCrewRequest`
- `apps/backend/server/domains/deliveries/*`
  - when the delivery domain becomes active, add the same projection calls there rather than relying on order-only logic

### 13.3 Frontend Files To Add

```text
apps/frontend/src/shared/api/calendar.ts
apps/frontend/src/features/calendar/
  ├── CalendarProvider.tsx
  ├── CalendarAgenda.tsx
  └── CalendarTab.tsx
```

### 13.4 Frontend Files To Modify

- Hub tabs:
  - `apps/frontend/src/hubs/ManagerHub.tsx`
  - `apps/frontend/src/hubs/CrewHub.tsx`
  - `apps/frontend/src/hubs/CustomerHub.tsx`
  - `apps/frontend/src/hubs/ContractorHub.tsx`
  - `apps/frontend/src/hubs/CenterHub.tsx`
  - `apps/frontend/src/hubs/WarehouseHub.tsx`
  - `apps/frontend/src/hubs/AdminHub.tsx`
- Existing service modal integration:
  - reuse the existing service entity modal adapter in `apps/frontend/src/config/entityRegistry.tsx`
  - embed a scoped schedule tab rather than introducing a new modal
- Existing modal navigation:
  - keep using `apps/frontend/src/contexts/ModalProvider.tsx`

### 13.5 Database Work

Planned migrations:

- create `calendar_events`
- create `calendar_event_participants`
- create `calendar_recurrence_templates`
- create external sync tables
- add Phase 1 B-tree indexes now and defer optional GiST / `btree_gist` support until the target PostgreSQL strategy is finalized

Backfill jobs:

- build an idempotent script that reads existing active orders/services and materializes calendar rows
- do not backfill via the UI

### 13.6 Implementation Order

1. Add schema + indexes.
2. Add read-only calendar domain and register routes.
3. Add projection helpers with idempotent upsert semantics.
4. Wire projection calls into order and service write paths.
5. Add `shared/api/calendar.ts` and `CalendarAgenda` first.
6. Add a new Calendar tab to one role hub behind a feature flag, then propagate to the rest.
7. Embed timeline widgets into service/crew surfaces.
8. Expand to `CalendarFull`, recurrence, and sync only after the projection model is stable.

### 13.7 Definition Of Done For Phase 1

- Calendar tab exists and is read-only.
- Events shown in the tab are produced only by existing source-domain actions.
- Service and order actions update calendar state correctly.
- Event click opens the correct existing modal.
- No duplicate event rows are created when source actions are replayed.
- RBAC visibility matches the source entity visibility model.

---

## 14. RELATED EXISTING DOCS

- `SERVICES_SYSTEM_DESIGN.md` — Current services architecture
- `SERVICES_VIEW_SYSTEM_DESIGN.md` — Service view patterns
- `MODAL_ARCHITECTURE_IMPLEMENTATION.md` — Modal system (calendar events will open via modals)
- `ENTITY_MODAL_ARCHITECTURE.md` — Entity detail modals
- `ACTIVITY_FEED_MODULAR_ARCHITECTURE.md` — Activity feed (calendar events generate activity entries)

---

*This document is a living spec. GPT-4 and other contributors should add to Sections 10 (Open Questions) and expand any section that needs more detail. Diagrams and wireframes to follow.*
