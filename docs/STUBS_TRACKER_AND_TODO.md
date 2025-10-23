# Stubs Tracker and TODOs

Purpose: keep a single, lightweight list of stubbed modules, their intent, and when to wire them in as we complete the ID‑first modal rollout.

## Guiding Principles
- ID‑first: callers pass only an ID; resolver + RBAC + UI handle the rest.
- Single sources of truth: avoid duplicate logic; prefer thin re‑exports until post‑MVP refactors.
- Feature‑flag rollouts for any cross‑cutting additions (telemetry, caching, etc.).

## Immediate (Phase 2–3)
- `apps/frontend/src/contexts/ModalProvider.tsx` — use `openById()` at call sites (ActivityFeed, AdminHub) behind `ID_FIRST_MODALS`.
- `apps/frontend/src/hooks/useServiceDetails.ts` — Phase 3 FRONTEND: DONE (on‑demand fetch).
- Backend: ADD `/services/:serviceId/details` endpoint (mirrors `/reports/:id/details`).
- Optional thin facades (no new logic):
  - `auth/src/utils/customIdParser.ts` — re‑export `parseEntityId`, `extractScope`, `isValidId` from `apps/frontend/src/shared/utils/parseEntityId` to provide a stable import path.
  - `auth/src/hooks/useCustomId.ts` — tiny wrapper around `parseEntityId` if desired; otherwise keep stubbed.

### Cleanup tasks after bake
- Remove legacy fallback branches that reference old wrappers:
  - `apps/frontend/src/components/ActivityFeed.tsx` — delete `openReportModal(...)` branch once ID_FIRST_MODALS is stable.
  - `apps/frontend/src/hubs/AdminHub.tsx` — delete `openReportModal(...)` branches for reports/feedback rows.
- Fix local type hole: add optional `onRowClick?: (row: any) => void` to the `DirectorySectionConfig` type used in AdminHub to remove pre‑existing TS warnings.

## Post‑MVP (Backlog)

### Identity / Roles (Auth package)
- `auth/src/utils/customIdParser.ts` — promote to shared “core-ids” module once ID‑first is everywhere.
- `auth/src/utils/roleExtractor.ts` — parse/normalize role from tokens/headers; pair with server `roleResolver`.
- `auth/src/utils/tokenValidator.ts` — client‑side guard helpers for dev-mode/testing; production validation remains server‑side.

### Telemetry & Logging
- `apps/gateway/src/telemetry.ts` — implement typed event API behind a flag:
  - Events: `modal_open`, `modal_action`, `action_result`.
  - Fields: `entityType`, `id`, `scope`, `role`, `actionKey`, `result`, `error`, `durationMs`.
  - Start with console sink or `/telemetry` endpoint; expand later.
- Server telemetry stubs (see server/core below) — wire basics after UI events stabilize.

### Backend Core (Fastify server)
- Auth/roles:
  - `apps/backend/server/core/auth/customIdExtractor.ts` — decode IDs from paths/claims for auditing.
  - `apps/backend/server/core/config/roleResolver.ts` — map CKS roles to capabilities.
  - `apps/backend/server/core/fastify/roleGuard.ts`, `requireCaps.ts`, `auth.ts` — consolidate RBAC guards.
- Config/flags:
  - `apps/backend/server/core/config/featureFlags.ts`, `versions.ts` — runtime flags, API versioning gates.
- HTTP helpers:
  - `apps/backend/server/core/http/errors.ts`, `responses.ts` — consistent error shapes and success envelopes.
- Logging/telemetry:
  - `apps/backend/server/core/logging/logger.ts`, `audit.ts` — request logging + audit records for sensitive actions.
  - `apps/backend/server/core/telemetry/metrics.ts`, `tracing.ts` — minimal metrics/traces behind a flag.
- Events & async:
  - `apps/backend/server/core/events/bus.ts`, `outbox.ts` — domain events/outbox pattern for side‑effects.
- Caching:
  - `apps/backend/server/core/cache/redis.ts`, `warmers.ts` — add read‑through caches where endpoints are hot (e.g., list endpoints).
- Workers:
  - `apps/backend/server/core/workers/index.ts` — background jobs (archive cleanup, hard‑delete sweeps).

### Shared Packages
- `shared/constants/rolePrefix.ts` — map `CON/MGR/CEN/...` to roles; used by ID parsing/extraction.
- `shared/types/customId.d.ts` — formalize ID grammar/types once parser is promoted to shared.
- `shared/utils/codegen/generate-contracts.ts` — generate OpenAPI/TS contracts post‑MVP.

### Tooling & Scripts
- `scripts/devctl.js` — developer utility (scaffold, flag toggles, quick auth context setters).

## Notes & Cross‑References
- ID‑first plan: `docs/ID_FIRST_ARCHITECTURE_PLAN.md` (phases, acceptance criteria).
- Feature flags: `apps/frontend/src/config/featureFlags.ts` (`ID_FIRST_MODALS`, `SERVICE_DETAIL_FETCH`).

## Decision: Phase 2
- Proceed with Phase 2 under `ID_FIRST_MODALS`:
  - Migrate `ActivityFeed` and `AdminHub` call sites to `modals.openById(id)`.
  - Keep wrappers for other hubs until verified.
  - No visual changes; only the modal open path.
