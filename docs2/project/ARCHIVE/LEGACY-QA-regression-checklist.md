# QA Regression Checklist — Profile Entry & My Profile

Date: 2025-08-15
Scope: Header User Widget, My Profile (tabs-only), Manager tabs

## Widget Visibility
- [ ] Non-admin routes show header User Widget (e.g., /hubs/crew, /me/profile)
- [ ] Admin hub root (/hubs/admin) hides the User Widget
- [ ] Admin sections (/admin/*) hide the User Widget

## My Profile Navigation
- [ ] From each Hub, header widget link navigates to /me/profile
- [ ] My Profile shows tabs-only layout (no large header card)
- [ ] Query params (role/kind, code) are preserved when deep-linking

## Manager Profile
- [ ] Manager role renders the Manager tabs with expected labels
- [ ] No data rows shown; headings-only skeletons where applicable

## Impersonation (when available)
- [ ] Banner appears during impersonation and persists across navigation
- [ ] Header widget respects impersonated subject and audit is recorded

## Accessibility
- [ ] Tabs have appropriate roles/labels; keyboard navigation works
- [ ] Header widget is reachable via keyboard and has descriptive labels
