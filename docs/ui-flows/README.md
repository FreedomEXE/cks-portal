# UI Flows Documentation

This directory contains all UI flow documentation and logic for the CKS Portal system.

## Structure

```
ui-flows/
├── admin/
│   └── ADMIN_FLOW.md           - User management and admin system
├── ecosystem/
│   └── ECOSYSTEM_FLOW.md       - Hierarchical network visualization
├── orders/
│   ├── ORDER_FLOW.md           - Complete order flow logic and status system
│   └── ORDER_IMPLEMENTATION.md - Technical implementation tracking
├── reports/
│   └── REPORTS_FLOW.md         - Reports and feedback system
└── README.md                   - This file
```

## Quick Links

### Admin System
- [Admin Flow Documentation](./admin/ADMIN_FLOW.md) - User creation, assignments, archive management

### Ecosystem Visualization
- [Ecosystem Flow Documentation](./ecosystem/ECOSYSTEM_FLOW.md) - Network hierarchy and role-based views

### Orders System
- [Order Flow Documentation](./orders/ORDER_FLOW.md) - Status logic, workflows, visual states
- [Implementation Plan](./orders/ORDER_IMPLEMENTATION.md) - Progress tracking, testing, known issues

### Reports & Feedback
- [Reports Flow Documentation](./reports/REPORTS_FLOW.md) - Issue tracking and communication system

## Documentation Standards

### Each flow should include:
1. **Overview** - High-level description
2. **Related Code Files** - Direct links to implementation
3. **Business Logic** - How it should work
4. **Visual Design** - Colors, animations, states
5. **Data Model** - Required fields and types
6. **Examples** - Concrete scenarios

### Implementation docs should track:
1. **Current Status** - What's done, in progress, pending
2. **Known Issues** - Bugs and blockers
3. **Testing Requirements** - Scenarios to validate
4. **Code Patterns** - How to implement

## Adding New Flows

When adding a new UI flow:
1. Create a new folder under `ui-flows/`
2. Add `FLOW.md` for the business logic
3. Add `IMPLEMENTATION.md` for technical tracking
4. Update this README with links

## Important Notes

- These are the SOURCE OF TRUTH for UI behavior
- Always update docs when changing flow logic
- Link to actual code files for easy navigation
- Keep implementation status current

---

*Last Updated: 2025-09-28*