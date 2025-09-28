SESSION WITH-Codex-2025-09-27-3
--------------------------------
Date: 2025-09-27
Agent: Codex

Changes since last commit
- apps/frontend/src/hubs/CenterHub.tsx: wired `useHubRoleScope`, fed scope data into `buildEcosystemTree`, and ensured the fallback root node carries a canonical `type`.
- apps/frontend/src/hubs/CrewHub.tsx: same scope wiring + fallback adjustments for crew hub.
- apps/frontend/src/hubs/CustomerHub.tsx: added `type: 'customer'` to the fallback ecosystem node for palette mapping.
- apps/frontend/src/shared/utils/ecosystem.ts: expanded role color map aliases, normalised child ordering, pushed role `type` metadata into every node, and introduced crew-specific root restructuring so centers render above the signed-in crew member.
- packages/domain-widgets/src/EcosystemTree.tsx: now consumes the new `type` metadata for color/highlight lookups, uses shared color map overrides, and bases badge counts on canonical role keys.

New/improved functionality
- Center, Crew, and Customer hubs display ecosystem trees using live scope data with correct role colours and highlight treatments.
- Crew hub tree now nests the signed-in crew member under their assigned center, matching UX expectations.

Summary of code changes
- Shared utility: normalised scope payload handling, added helper `toArray`, and reworked build logic for consistent tree metadata + colour mapping.
- Domain widget: updated `EcosystemTree` rendering pipeline to rely on canonical role keys for colours, highlights, and statistics, while accepting upstream overrides.
- Hub screens: hooked up `useHubRoleScope` where missing and passed the enriched tree data (with fallback metadata) to the widget.

Additional notes
- A Vite production build still fails in `apps/test-interface` because Rollup cannot resolve the `@cks/ui` import from the built `domain-widgets` package. Either add `@cks/ui` to the package’s dependencies or mark it as external in `build.rollupOptions` before shipping.

Suggested next steps
- Implement end-to-end flows (ordering, reports, other role-specific actions) now that scope visualisation is stable.
- Resolve the outstanding build configuration issue so CI/CD can emit production bundles reliably.
