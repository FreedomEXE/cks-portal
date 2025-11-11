# Session — Codex CLI — 2025-11-10 (3)

This session focused on unblocking auth/runtime crashes in Manager and Warehouse hubs, and finalizing the standardized layout pattern (wide hero + clamped content) so the UI reads consistently across monitors.

## Changes Since Last Commit

- Fixed TDZ/runtime crashes
  - ManagerHub: eliminated temporal dead zone by using `authCode` for all data hooks; resolve `userCode` only after profile loads. Mutate keys and preferences now use `authCode`.
  - WarehouseHub: same pattern as Manager — data hooks keyed by `normalizedCode` (auth code); resolve `userCode` after profile. ActivityFeed viewerId falls back to `normalizedCode`.
  - ContractorHub: removed remaining `contractorCode` references; now uses `userCode` consistently for ecosystem/root labels and display names.
  - Added missing `ProfileSkeleton` imports in all hubs that render it.

- Standardized layout
  - Baseline content clamp at `--page-max-width: 1440px`.
  - MyHubSection is a “wide hero”:
    - `--hero-max-width: calc(var(--page-max-width) + 240px)`; extends beyond content on large screens.
    - On ≤1440px viewports, hero uses a centered-bleed (100vw with negative margins) so it still appears wider than the clamped content.
    - Slight responsive headline sizing via `clamp()` to avoid the zoomed look on smaller monitors.
  - Slight base font-size reductions on smaller desktop widths to reduce perceived zoom without changing layout.

## New Features Added

- Full‑bleed hero pattern for MyHubSection (small/medium monitors) while content stays boxed.
- Layout variables for easy tuning: `--page-max-width`, `--hero-max-width`, `--page-gutter`, `--hero-gutter`.

## Summary of Code Changes

- Manager Hub
  - apps/frontend/src/hubs/ManagerHub.tsx: introduce `authCode`; move data hooks to use it; compute `userCode` after profile; align mutate keys and preference save to `authCode`.

- Warehouse Hub
  - apps/frontend/src/hubs/WarehouseHub.tsx: use `normalizedCode` (auth) for all fetch hooks; resolve `userCode` after profile; preference reads/writes keyed to `normalizedCode`; viewerId falls back to `normalizedCode`.

- Contractor Hub
  - apps/frontend/src/hubs/ContractorHub.tsx: replaced `contractorCode` with `userCode` in ecosystem and labels.

- Skeleton imports
  - apps/frontend/src/hubs/{Center,Contractor,Customer,Crew,Warehouse}Hub.tsx: add `import ProfileSkeleton`.

- Layout
  - apps/frontend/src/index.css: define layout vars; small-screen base font-size steps; gutters.
  - packages/ui/src/navigation/MyHubSection/MyHubSection.module.css: new module with centered‑bleed full‑width hero at ≤1440px.
  - packages/ui/src/navigation/MyHubSection/MyHubSection.tsx: use CSS module; hero headline uses `font-size: clamp(28px, 3.2vw, 40px)`.
  - packages/ui/src/layout/PageWrapper/PageWrapper.{ts,css}: keep content clamped to 1440 with side gutters; toolbar/header clamp enforced.

## Next Steps / Important Files

- Verify all role hubs after changes
  - Manager, Warehouse sign-in; switch tabs; watch console for errors.
  - Confirm hero looks wider than content on ~1280px and ~1024–1366px displays.
- Clean up
  - Remove `.bak` hub files to reduce search noise (on approval).
  - Consider migrating localStorage keys from per-`userCode` to per-auth code where helpful.
- Tests
  - Optional Playwright smoke: open each hub → My Profile; assert key elements render; take screenshots at 1440 and 1280 to track visual regressions.

## Current Roadblocks

- Potential old bundle cache on the host can mask/remit fixes. Ensure a fresh deploy is active when validating.
- Some typography on very small desktops may still feel dense; we can tune the font-size steps or hero `clamp()` further based on your screenshots.

## MVP Status

- Auth/runtime stability: major TDZ sources removed in Manager/Warehouse; hubs align on the `authCode → profile → userCode` pattern.
- UI standardization: wide hero + clamped content established; consistent experience across large and smaller monitors without full-app zoom hacks.
- Remaining polish: verify all hubs’ My Profile and Settings flows; optionally add e2e smoke.

## Docs Updated

- ComponentArchitecture.md — added a Layout & Page Structure section describing the hero/clamp pattern and variables.

---

## Handoff Prompt for Next Agent

“Validate that Manager and Warehouse hubs no longer crash on sign-in and that the MyHubSection hero is wider than content on ~1280px monitors. If any hub still throws a TDZ error, ensure its data hooks are keyed by auth code (not profile-derived userCode) and only resolve userCode after profile is available. Optionally remove .bak hub files. Key files: ManagerHub.tsx, WarehouseHub.tsx, ContractorHub.tsx, MyHubSection.module.css, index.css. Confirm layout variables `--page-max-width` and `--hero-max-width` deliver the intended look at 1440 and 1280.”

