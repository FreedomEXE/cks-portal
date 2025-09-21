# ADR 0001: Single Profile Entry Point via Header User Widget

- Status: Accepted
- Date: 2025-08-15

## Context

We had multiple entry points to “My Profile”: a header user button and in-page buttons across each Hub. This caused duplication and inconsistent navigation. Additionally, the My Profile screen displayed a large header card that duplicated information and distracted from the tabbed content. Admin routes should not surface personal profile UI.

## Decision

1. Adopt a single, global entry point to My Profile using the compact header User Widget, linking to `/me/profile` with role/code context.
2. Suppress the header widget on Admin routes and on the Admin hub root.
3. Remove in-page “My Profile” buttons from role hubs to avoid duplication.
4. Standardize My Profile to show only tabs and table headings (no large header card). Each role presenter supports `showHeader` (default true); `/me/profile` passes `showHeader={false}`.
5. Implement Manager profile presenter and central tab config (headings only) aligned to MGR‑001 CSVs to match other roles.

## Consequences

Pros:
- Clear, consistent navigation; fewer duplicate UI elements.
- Cleaner My Profile layout focused on tabbed content.
- Easier to maintain profile entry logic in one place.

Cons:
- Admin has no visible profile entry point by design; requires clarity in docs/testing.
- Requires additional tests to ensure suppression logic and deep links work.

## Alternatives Considered

- Keep hub-level “My Profile” buttons alongside the header widget → rejected due to duplication and confusion.
- Always show the header widget, including Admin → rejected; Admin should remain focused on admin views.

## Implementation Notes

- Header widget mounted in `Page` right slot; hidden on Admin routes and Admin hub.
- Hubs removed “My Profile” buttons.
- Role profile presenters accept `showHeader`; `/me/profile` disables the header card.
- Manager profile added with `managerTabs.config` (headings only).

## Follow-ups

- Add routing/unit tests for widget visibility, `/me/profile` rendering without header, and tab presence.
- Improve accessibility (ARIA roles/labels; keyboard navigation for widget and tabs).
- Document impersonation banner interactions with the widget and audit logging.
