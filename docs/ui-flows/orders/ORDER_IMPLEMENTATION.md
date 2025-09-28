# Order System Implementation Plan

## Overview
Technical implementation tracking for the CKS order system. This document tracks progress, known issues, and testing requirements.

## Related Documentation
- **Order Flow Logic**: `/docs/ui-flows/orders/ORDER_FLOW.md`
- **UI Component**: `/packages/ui/src/cards/OrderCard/OrderCard.tsx`

## Current Status (2025-09-28)

### ✅ Completed
- [x] Backend store rebuilt with transactional persistence
- [x] Order ID sequences created (`order_product_sequence`, `order_service_sequence`)
- [x] Helper functions added (normalizeStatus, viewerStatusFrom, formatMoney, toIso)
- [x] Order mapping enriched with approval stages and viewer status
- [x] Bootstrap scripts for database compatibility
- [x] Warehouse Hub actions wired (Accept, Deliver)
- [x] SWR cache refresh after mutations

### 🔧 In Progress
- [ ] TypeScript build error at store.ts:216 (status type mismatch)
- [ ] Participant persistence during create/action flows

### 📋 Pending
- [ ] Wire remaining hub actions (Customer, Contractor, Center, Crew, Manager)
- [ ] Replace alert/prompt with proper modals
- [ ] Validate catalog data and seeding
- [ ] Unit/integration tests

## Known Issues

### Critical
1. **Build Error**: Type mismatch at `apps/backend/server/domains/orders/store.ts:216`
   - Issue: Mixing `OrderStatus` with `ApprovalStage.status` types
   - Solution: Ensure correct type usage for each context

### Non-Critical
1. **Hub Actions**: Other hubs show console stubs instead of real actions
2. **UI Prompts**: Using browser prompts instead of styled modals
3. **Error Handling**: Need standardized error codes and messages

## Database Schema

### Tables
- `orders` - Main order records
- `order_items` - Line items for each order
- `order_participants` - Users involved in order workflow
- `catalog_items` - Product/service catalog

### Sequences
- `order_product_sequence` - Generates PRD### IDs
- `order_service_sequence` - Generates SRV### IDs

## API Endpoints

### Orders
- `GET /api/orders` - List orders for current user
- `POST /api/orders` - Create new order
- `GET /api/orders/:orderId` - Get specific order
- `POST /api/orders/:orderId/actions` - Apply action to order

### Hub-Specific
- `GET /hub/orders/:hubCode` - Get orders for hub role
- `POST /hub/orders` - Create order from hub
- `POST /hub/orders/:orderId/actions` - Apply hub action

## Testing Checklist

### Product Order Flow
- [ ] Create order as Crew
- [ ] View in Warehouse (shows Accept/Deny buttons)
- [ ] Accept order (buttons change to View Details)
- [ ] Verify workflow shows "accepted" while pulsing
- [ ] Mark as delivered
- [ ] Verify order moves to Archive tab
- [ ] Check all users see final state

### Service Order Flow
- [ ] Create order as Center
- [ ] View in Manager hub (shows Create Service button)
- [ ] Create Service action
- [ ] Verify transformation ID appears
- [ ] Verify order moves to Archive
- [ ] Check all roles see final state

### Edge Cases
- [ ] Reject order with long reason text
- [ ] Multiple simultaneous orders
- [ ] Cancel pending order as creator
- [ ] Attempt invalid actions (should fail gracefully)
- [ ] Search across tabs
- [ ] Tab count accuracy

## Implementation Steps

### Phase 1: Fix Current Issues ⚠️
1. Fix TypeScript build error
2. Ensure status types are correctly applied
3. Verify build passes: `pnpm build`

### Phase 2: Complete Backend
1. Implement participant persistence
2. Add validation for destinations and transformed IDs
3. Standardize error codes
4. Add audit logging if required

### Phase 3: Wire Frontend
1. Replace console stubs in all hubs
2. Implement proper modal dialogs
3. Add loading states and error handling
4. Ensure role-based button visibility

### Phase 4: Testing & Polish
1. Run through all test scenarios
2. Fix any discovered issues
3. Performance optimization
4. Documentation updates

## Code Patterns

### Creating an Order
```typescript
const order = await createHubOrder({
  orderType: 'product',
  title: 'Office Supplies',
  items: [...],
  destination: 'CTR-001'
});
```

### Applying an Action
```typescript
await applyHubOrderAction(orderId, {
  action: 'accept',
  reason: null
});
mutate(`/hub/orders/${hubCode}`); // Refresh cache
```

### Status Derivation
```typescript
// Viewer status based on role and next actor
const viewerStatus = viewerStatusFrom(
  order.status,
  order.nextActorRole,
  currentUserRole
);
```

## Environment Requirements

### Development
```bash
# Backend
PORT=4000 pnpm dev:backend

# Frontend
pnpm dev:frontend

# Build check
pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint
```

### Database
- PostgreSQL with migrations applied
- Catalog data seeded
- Sequences initialized

## Progress Tracking

### Sprint 1 (Current)
- Fix build errors ⚠️
- Complete backend persistence
- Wire Warehouse hub

### Sprint 2
- Wire remaining hubs
- Implement modals
- Add comprehensive tests

### Sprint 3
- Performance optimization
- Error handling improvements
- Documentation finalization

## Notes

- Always run `pnpm build` before committing
- Test with multiple user roles
- Ensure backward compatibility
- Follow TypeScript strict mode

---

*Last Updated: 2025-09-28*
*Version: 1.0*