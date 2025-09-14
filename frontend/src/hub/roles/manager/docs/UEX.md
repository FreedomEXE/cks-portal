<!--
───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────

File: UEX.md

Description: User flows/feel (first-run tour, empty states, loading). for Manager Users
Function: Describe experiential aspects of Manager UI.
Importance: Drives coherent, empathetic user experience.
Connects to: UI.md, Skeleton.md, tab components.
-->

# Manager Hub – UEX (Current State Snapshot)
_Last updated: 2025-09-10_

## Flow Covered (from video)
- **Admin creates Manager** → success feedback
- **Admin links Manager to Contractor** → confirmation visible on profile
- **Manager logs in** → lands on Dashboard → navigates to **Contractors** and sees linked contractor

## Onboarding & Guidance
- After creation: success toast + clear affordance to “Link Contractor”
- Manager first login: minimal guidance; next‑step is implied (check Contractors)

## Navigation Behavior
- Linear/guided sequence works without dead ends
- Back/return via app shell (sidebar) appears consistent

## Feedback & States
- Success: toast/banner on create/link
- Loading: default spinner during fetch
- Empty: Dashboard appears sparse; Contractors tab is meaningful once linked

## Error Handling (observed/assumed)
- Form validation present; error copy style not finalized
- Retry path via re‑submit; no intrusive modals seen

## Accessibility & Performance
- Labels on form fields appear present
- Keyboard nav likely follows default order; focus ring visible
- Debounced search recommended for contractor link dialog (future)
- Skeletons recommended for Manager detail/table (future)

## Gaps / TODO (UEX)
- First‑time Manager welcome and “next steps” micro‑copy
- Friendly empty states across tabs (with CTAs)
- Consistent error tone and inline help
- Notification rules (toast vs email invite)
- Accessibility acceptance criteria (WCAG targets)


