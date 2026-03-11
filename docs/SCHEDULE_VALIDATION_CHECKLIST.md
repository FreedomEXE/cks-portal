/*-----------------------------------------------
  Property of CKS  (c) 2026
-----------------------------------------------*/
/**
 * File: SCHEDULE_VALIDATION_CHECKLIST.md
 *
 * Description:
 * Team validation checklist for the Schedule workspace and first print/export set.
 *
 * Responsibilities:
 * - Align Schedule output against Santiago's manual workflow
 * - Capture UX, data, RBAC, and print gaps in a structured way
 *
 * Role in system:
 * - Used before additional Schedule polish or expansion work ships
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

# Schedule Validation Checklist

## Purpose

Use this checklist to validate the current `Schedule` implementation against:

- the real operational workflow
- Santiago's current manual schedule files
- the expected role-scoped experience for Admin, Manager, Center, Crew, and related users

This is not a bug bash only. It is a product validation pass. The goal is to answer:

1. Does the live Schedule workspace reflect how the business actually plans work?
2. Do the exported outputs replace the current manual files well enough to keep moving?
3. What polish, missing fields, or missing surfaces are required before the next build wave?

## Validation Scope

Current in-scope surfaces:

- `Schedule` main workspace
- `Day Plan -> Block Detail -> Task Detail` zoom flow
- cascading scope selector behavior
- crew daily export
- building weekly export
- ecosystem summary export

Current out-of-scope items:

- true Procedure domain
- training integration
- mobile task completion flow
- PDF-specific generation libraries
- drag/drop planning polish

## Participants

Recommended reviewers:

- 1 Admin
- 1 Manager
- 1 Center user
- 1 Crew user
- 1 operational reviewer who understands Santiago's manual files

## Test Data

Run validation against:

- one real non-TEST ecosystem with representative data
- the TEST ecosystem with dense fixture data

Minimum data conditions:

- at least 1 building/site with multiple blocks on the same day
- at least 1 crew member with multiple tasks in a day
- at least 1 unassigned block
- at least 1 cancelled block
- at least 1 completed block
- at least 1 building with multiple crew assigned across the week
- at least 1 multi-crew block if possible

Preparation commands:

- run backend migrations:
  - `pnpm --dir apps/backend migrate`
- seed dense source-driven TEST fixtures:
  - `pnpm --dir apps/backend seed:calendar-test-fixtures`
- seed dense authored Schedule fixtures:
  - `pnpm --dir apps/backend seed:schedule-test-fixtures`
- or run the full TEST review seed in one shot:
  - `pnpm --dir apps/backend seed:schedule-review-fixtures`

## Review Format

For every issue found, log:

- surface
- role
- scope
- exact date
- expected result
- actual result
- severity: `blocking`, `important`, `polish`
- screenshot if visual

## Part 1: Workspace Validation

### 1. Tab Naming And Positioning

- [ ] Every hub shows `Schedule` instead of `Calendar`
- [ ] The tab feels like a first-class workspace, not a leftover calendar view
- [ ] The top control area feels concise and operational, not promotional

### 2. Scope Selector Behavior

Validate against the Ecosystem mental model.

- [ ] Admin can switch ecosystem scope top-down
- [ ] Admin can drill below ecosystem manager into lower levels
- [ ] Manager can drill down through their accessible hierarchy
- [ ] Contractor can drill through their allowed downstream hierarchy
- [ ] Customer can drill through their allowed downstream hierarchy
- [ ] Center can drill to crew
- [ ] Crew can access both personal and center context
- [ ] Warehouse view remains limited and logistics-scoped
- [ ] URL stays in sync when scope changes
- [ ] Refresh preserves the selected scope state

Questions to answer:

- [ ] Does the scope selector feel as intuitive as the Ecosystem selector?
- [ ] Are any levels missing?
- [ ] Does the hierarchy need search or faster jump actions?

### 3. Role-Based Visibility

Validate that each role sees only what they should.

- [ ] Admin sees full allowed scope
- [ ] Manager sees only their ecosystem chain
- [ ] Contractor cannot see outside their downstream chain
- [ ] Customer cannot see outside their downstream chain
- [ ] Center only sees center and crew-relevant work
- [ ] Crew only sees crew/center-relevant work
- [ ] TEST data never leaks into real ecosystem views unintentionally
- [ ] TEST data appears only when intentionally selected or when using TEST users

### 4. Zoom Model

Validate the core UX principle: zoom in, do not eject.

- [ ] Day view feels like the true anchor workspace
- [ ] Selecting a block feels like drilling in, not opening a detached inspector
- [ ] Selecting a task feels like drilling in further, not opening a separate tool
- [ ] Back behavior is clear and predictable
- [ ] Clearing `task` returns to block detail
- [ ] Clearing `block` returns to day plan
- [ ] Breadcrumbs preserve orientation
- [ ] Users do not feel lost when drilling in deeply

Questions to answer:

- [ ] Does the day -> block -> task hierarchy feel correct?
- [ ] Is any missing intermediate layer needed?
- [ ] Does any level need more context preserved on screen?

### 5. Day Plan Layout

Compare this directly to real planning behavior.

- [ ] Building/site grouping feels correct as the top level
- [ ] Worker/crew lanes under each building feel correct
- [ ] Unassigned work is clearly visible
- [ ] Dense days remain readable
- [ ] Light days do not feel empty or broken
- [ ] Time ordering is obvious
- [ ] Status badges are easy to scan
- [ ] Area/location context is sufficient on every block

Questions to answer:

- [ ] Does the building -> worker default match how managers actually think?
- [ ] Are any labels missing to make the layout operationally usable?
- [ ] Are blocks too visually heavy or too visually light?

### 6. Block Detail

- [ ] Block detail preserves enough context from the day plan
- [ ] The selected block feels clearly active
- [ ] The task category grouping makes sense
- [ ] Source-derived restrictions are understandable
- [ ] Managers/Admin can understand what can and cannot be edited
- [ ] The block editor feels stable and trustworthy
- [ ] Revalidation does not wipe in-progress edits unexpectedly

### 7. Task Detail

- [ ] Task detail shows enough execution context
- [ ] Task title, area, duration, category, and status are clear
- [ ] Related task navigation is useful
- [ ] Task detail feels like the right precursor to mobile task completion
- [ ] Users can imagine following this flow in the field

Questions to answer:

- [ ] What fields are missing for real crew execution?
- [ ] Are any fields present but low-value?
- [ ] Does the task detail need checklist-like presentation later?

## Part 2: Authoring Validation

### 8. Block Creation

- [ ] Admin can create a block successfully
- [ ] Manager can create a block successfully
- [ ] Other roles cannot author blocks
- [ ] Created blocks appear in the correct building/day/lane
- [ ] Center and crew assignment choices feel understandable

### 9. Block Editing

- [ ] Admin can edit authored blocks
- [ ] Manager can edit authored blocks
- [ ] Source-derived blocks enforce constrained editing correctly
- [ ] Timing changes persist correctly
- [ ] Crew reassignment persists correctly
- [ ] Status changes persist correctly
- [ ] Task stack edits persist correctly
- [ ] Version conflict messaging is understandable if triggered

### 10. Task Editing

- [ ] Authored task titles save correctly
- [ ] Task notes save correctly
- [ ] Task status saves correctly
- [ ] Task timing/duration fields save correctly
- [ ] Task category grouping survives save/reload
- [ ] Resource/tool lists display correctly when present

## Part 3: Export Validation

### 11. Crew Daily Assignment Sheet

Compare directly against the real crew-facing need.

- [ ] Export action appears only in crew-scoped contexts
- [ ] Output opens in a print-friendly browser view
- [ ] Crew label/name is correct
- [ ] Date is correct
- [ ] Blocks are in time order
- [ ] Tasks are in sequence order
- [ ] Building, area, center, time range, and task status are present
- [ ] Tools/products display correctly when present
- [ ] Empty values collapse cleanly instead of leaving broken gaps
- [ ] Print to PDF from browser produces a usable file

Questions to answer:

- [ ] Would a crew member actually use this as their day sheet?
- [ ] What is missing versus the current manual handoff?

### 12. Building Weekly Schedule

Compare directly against Santiago's building schedule file.

- [ ] Weekly export action appears on each building section
- [ ] The exported week matches the in-app week being viewed
- [ ] Empty days still appear when useful
- [ ] Lanes are readable and correctly labeled
- [ ] Unassigned work is clearly separated
- [ ] Dense buildings remain printable
- [ ] Tasks under each block are sufficient for operational context

Questions to answer:

- [ ] Does this replace Santiago's building-level weekly file?
- [ ] What labels/order/grouping differ from the manual file?
- [ ] Does it need stronger area/room emphasis?

### 13. Ecosystem Summary Schedule

- [ ] Export summary action appears for Admin/Manager only
- [ ] Summary counts feel trustworthy
- [ ] Status breakdown is useful
- [ ] Building table is useful
- [ ] Crew table is useful
- [ ] The document stays compact enough to print/read easily
- [ ] Reviewers understand that crew subtotals are responsibility-counted and may exceed unique building totals on multi-crew blocks

Questions to answer:

- [ ] Is this enough to replace Santiago's overview sheet?
- [ ] Are there any must-have KPI rows missing?

## Part 4: Manual Workflow Comparison

For each of Santiago's current manual files, answer:

- [ ] Which live export corresponds to it?
- [ ] What information is still missing?
- [ ] What information is present but unnecessary?
- [ ] What ordering/grouping needs to change?
- [ ] What print layout changes are required?

Explicit comparison targets:

- [ ] building/site grouping
- [ ] employee/crew grouping
- [ ] time block ordering
- [ ] room/area display
- [ ] task wording
- [ ] status visibility
- [ ] weekly readability
- [ ] print legibility

## Part 5: Team Decision Log

At the end of the review, record:

### Keep As-Is

- [ ] Which parts are already good enough to lock

### Needs Polish

- [ ] Visual issues
- [ ] Copy/labeling issues
- [ ] Print layout issues
- [ ] Missing fields

### Needs Logic Changes

- [ ] Scope logic changes
- [ ] Grouping/order changes
- [ ] Data-model changes
- [ ] Authoring permission changes

### Needs New Surfaces

- [ ] Additional places where Schedule should appear in the app
- [ ] Additional embedded widgets required
- [ ] Mobile-specific needs discovered during review

## Exit Criteria

The validation pass is complete when:

- [ ] all major roles have reviewed their scoped experience
- [ ] all three exports have been compared against manual workflow
- [ ] every gap is categorized as `blocking`, `important`, or `polish`
- [ ] the team can clearly name the next Schedule polish batch

## Recommended Output From The Review

Produce one review summary with:

1. top 5 blocking gaps
2. top 10 important changes
3. top polish improvements
4. screenshots of any layout failures
5. explicit decision on whether Schedule is ready for wider internal testing
