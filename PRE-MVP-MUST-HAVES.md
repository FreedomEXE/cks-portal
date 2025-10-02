# PRE-MVP MUST HAVES

Critical items that need to be completed before MVP launch. These are features/fixes that are essential for the system to function properly but can wait until after current work is complete.

---

## Recent Activity & Logging System

### Recent Activity Improvements
- [ ] **Cover all edge cases and actions**
  - [ ] Stock adjustments/inventory replenishment
  - [ ] Order status changes (accept, reject, start delivery, mark delivered, cancel)
  - [ ] User account changes (create, archive, status changes)
  - [ ] Service order lifecycle events
  - [ ] Assignment changes (contractor/crew assignments)
  - [ ] Any admin actions (directory updates, etc.)

### Activity/Audit Log System
- [ ] **Create comprehensive activity log table**
  - Purpose: Track ALL system actions for audit trail, analytics, invoicing
  - Fields needed:
    - Timestamp
    - Actor (user who performed action)
    - Action type (enum of all possible actions)
    - Entity type (order, inventory, user, etc.)
    - Entity ID
    - Before/After state (JSON)
    - Metadata (additional context)
    - IP address (optional)

- [ ] **Connect activity log to Recent Activity widget**
  - Recent Activity should query from this log
  - Filter by relevance to current user/role
  - Format appropriately for display

- [ ] **Future use cases to consider:**
  - Invoicing (track billable activities)
  - Analytics dashboards
  - Compliance/audit trails
  - Performance metrics
  - Customer reports

---

## Other Items
(Add items here as they come up)

---

## Notes
- Don't let these block current momentum
- Tackle during dedicated cleanup/polish phases
- Some may be done as we build related features
- Review this list weekly during standup/planning

---

*Last Updated: 2025-09-30*