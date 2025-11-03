# Product Order Flow Test Results - November 3, 2025

**Tester:** Freedom_EXE
**Date:** 2025-11-03
**Test Scope:** Complete product order flow (Crew create → Warehouse fulfill)
**Test Order IDs:** CRW-006-PO-123 (cancelled), CRW-006-PO-124 (new test)

---

## ✅ Confirmed Working

### 1. Crew Order Creation & Management
- ✅ Order creation successful
- ✅ Order appears in Crew's Orders section
- ✅ Modal opens with Details, History, and Quick Actions tabs
- ✅ "Cancel" action appears and works correctly
- ✅ Activity shows in Crew hub: "You created an order!"
- ✅ Activity personalized for creator

### 2. Admin Visibility
- ✅ Activity shows in Admin hub: "Created Product Order CRW-006-PO-124"
- ✅ Admin can archive/delete directly from activity feed
- ✅ Text formatting appropriate for admin view

### 3. Warehouse Order Visibility
- ✅ Order appears in Warehouse Orders section
- ✅ New ModalGateway-based modal opens
- ✅ Quick Actions tab shows "Accept/Reject" buttons
- ✅ "Accept" action works (order status changes)

---

## 🐛 Critical Issues

### Issue 1: Deleted Order Modal Shows Broken State
**Severity:** HIGH
**Current Behavior:**
- Admin deletes order from activity feed
- Opening modal after deletion shows missing/broken data
- No DeletedBanner component appears

**Expected Behavior:**
- Modal opens with DeletedBanner component
- Shows tombstone metadata (who deleted, when, why)
- Archive/restore options available for admin

**Root Cause (Suspected):**
- ID-first fetch doesn't fall back to tombstone/archived endpoint on 404
- Modal data loader not handling deleted entity state

**Files to Investigate:**
- `apps/frontend/src/shared/api/archive.ts` - Tombstone fallback logic
- `apps/backend/server/domains/archive/store.ts` - Archived entity endpoints
- `apps/frontend/src/components/ModalGateway.tsx` - Data loading and error handling
- `apps/frontend/src/shared/api/client.ts` - apiFetch 404 handling

**Related Screenshots:** (screenshots provided)

---

### Issue 2: Activity Feed → Modal Opens Empty for Non-Actor Viewers
**Severity:** HIGH
**Current Behavior:**
- Non-actor users (Center, Customer, Warehouse) click activity
- Modal opens with "No details available"
- Details and History tabs empty

**Expected Behavior:**
- Same data as when opening from Orders section
- Full Details and History tabs populated
- Quick Actions show workflow even if no actions for viewer

**Working Path:**
- Orders section → Click order → Modal opens with full data ✅

**Broken Path:**
- Activity feed → Click activity → Modal opens empty ❌

**Root Cause (Suspected):**
- ActivityFeed still routing to legacy modal path
- ModalGateway not merging extended fields on activity feed path
- Different data shape between paths

**Evidence:**
- Comment in `apps/frontend/src/components/ActivityFeed.tsx:124` mentions legacy modals
- Code: `// TODO: Migrate to universal modal system`

**Files to Investigate:**
- `apps/frontend/src/components/ActivityFeed.tsx:124` - Activity click handler
- `apps/frontend/src/components/ModalGateway.tsx` - Data merging logic
- Check if activity feed uses `modals.openById()` vs legacy modal state

---

### Issue 3: "Order Created" Activity Not Visible in Other User Hubs
**Severity:** HIGH
**Current Behavior:**
- Created order CRW-006-PO-124
- Activity DOES NOT appear in Center/Customer/Contractor/Warehouse/Manager hubs
- Only Crew (creator) and Admin see the creation activity
- Other users only see "Cancelled Order CRW-006-PO-123" (older order)

**Expected Behavior:**
- All stakeholders see "Created Product Order" activity
- Activity visible to:
  - Center (destination)
  - Customer (if involved)
  - Warehouse (assigned)
  - Manager (ecosystem oversight)

**Impact:**
- Users can't discover new orders via activity feed
- Must manually check Orders section

**Root Cause (Suspected):**
- Backend activity writer not recording activity for all stakeholders
- Scope rules not including stakeholders for "order_created" event
- Frontend filter is correct (already allows non-user creations per previous fix)

**Files to Investigate:**
- `apps/backend/server/domains/activity/writer.ts` - recordActivity function
- `apps/backend/server/domains/orders/store.ts` - Where order_created is recorded
- `apps/backend/server/domains/scope/store.ts` - Activity scope filtering
- Verify frontend: `apps/frontend/src/shared/activity/useFormattedActivities.ts:370` (should be fine)

**Key Question:**
- Does `recordActivity` for "order_created" include target roles or only creator?

---

### Issue 4: Activity Message Shows Order ID for Non-Actor Viewers
**Severity:** MEDIUM
**Current Behavior:**
- Non-actor viewers see: "Cancelled Product Order CRW-006-PO-123"
- Includes full order ID in activity text

**Expected Behavior:**
- Non-actor, non-admin viewers see: "Cancelled Product Order" (no ID)
- Admin still sees full ID
- Creator sees personalized "You cancelled an order"

**Rationale:**
- Order IDs are internal system identifiers
- Clutter the activity feed
- Not useful to external stakeholders in activity text (they see it in the card)

**Files to Investigate:**
- `apps/frontend/src/shared/activity/useFormattedActivities.ts:370` - Message formatting
- Check `mapHubItemToActivity` source for where labels are generated

**Fix Pattern:**
```typescript
// Pseudo-code
if (isAdmin || isCreator) {
  return `Cancelled Product Order ${orderId}`;
} else {
  return `Cancelled Product Order`;
}
```

---

### Issue 5: Warehouse Pending Deliveries Actions Don't Work
**Severity:** HIGH
**Current Behavior:**
- "Pending Deliveries" section shows orders with in-row action buttons
- "Start Delivery" and "Cancel" buttons do nothing (no response)
- Buttons are in the table row, not in modal

**Expected Behavior:**
- Click row → Opens modal via ModalGateway
- Actions appear in Quick Actions tab of modal
- No buttons in table row (or only "View" button)

**Root Cause (Suspected):**
- Deliveries table not migrated to new modal system
- Still using old action handler pattern
- Not wired to `useEntityActions` hook

**Files to Investigate:**
- Warehouse Deliveries page component (find in Warehouse hub)
- `apps/frontend/src/hooks/useEntityActions.ts` - Should handle actions
- `apps/frontend/src/config/entityRegistry.tsx:329` - Order action descriptors
- Compare with working Orders section implementation

**Migration Needed:**
- Row click → `modals.openById(orderId)`
- Remove in-row action buttons
- Let ModalGateway + useEntityActions handle actions

---

### Issue 6: Activity Feed Interaction Gap for Non-Crew Roles
**Severity:** MEDIUM
**Current Behavior:**
- Warehouse sees order in Orders section (can interact) ✅
- Warehouse CANNOT interact via activity feed ❌
- Same for Center, Customer, Manager, etc.

**Expected Behavior:**
- Click activity → Modal opens with full data
- Quick Actions available if user has permissions
- Workflow section visible even if no actions

**Current Workaround:**
- Users must navigate to Orders section

**Related To:**
- Issue #2 (Activity → Modal opens empty)
- Issue #3 (Activities not showing for stakeholders)

---

## 🎨 UX/Polish Issues

### Issue 7: Janky Tab Loading in Modals
**Severity:** LOW
**Current Behavior:**
- Modal shell appears
- Beat of delay (~200-500ms)
- Tabs/sections pop in

**Expected Behavior:**
- Smooth open with skeleton loaders
- OR delay modal open until data ready

**Impact:**
- Feels unpolished
- "Flickering" effect

**Files to Investigate:**
- `apps/frontend/src/components/ModalGateway.tsx` - Loading states
- Modal shell components - Add skeleton components

**Fix Options:**
1. Add skeleton loaders to tabs while data loads
2. Delay modal open until initial data fetch complete
3. Prefetch data on hover (advanced)

---

### Issue 8: Approval Workflow Not Visible to Non-Actor Viewers
**Severity:** MEDIUM
**Current Behavior:**
- Non-actor users open modal from Orders section
- Can see Details and History
- Quick Actions tab shows workflow but often empty

**Expected Behavior:**
- Always show approval workflow section
- Display: "Pending Warehouse Approval" or similar status
- Show "No actions available for your role" if applicable
- OR show next expected action ("Waiting for Warehouse to accept")

**Rationale:**
- Transparency in order lifecycle
- Users can track order progress
- Understand who needs to act next

**Files to Investigate:**
- `apps/frontend/src/config/entityRegistry.tsx:329` - Order adapter workflow section
- ModalGateway section rendering logic

---

## 🏗️ Underlying Technical Debt

### Debt 1: ActivityFeed Still References Legacy Modal Paths
**Evidence:**
- `apps/frontend/src/components/ActivityFeed.tsx:124`
- Comments mention OrderActionModal/OrderDetailsModal
- TODO: Migrate to universal modal system

**Impact:**
- Inconsistent behavior between entry points
- Duplicate code paths
- Harder to maintain

**Solution:**
- Always use `modals.openById(entityType, entityId)`
- Remove legacy modal branches
- Single code path for all entity opens

---

### Debt 2: AdminHub Includes ActionModal Remnants
**Evidence:**
- `apps/frontend/src/hubs/AdminHub.tsx:1441`
- References in `apps/frontend/src/shared/utils/adminActivityRouter.ts:98`

**Impact:**
- Admin may have different behavior than other roles
- Risk of regressions

**Solution:**
- Migrate Admin to same ModalGateway path
- Remove old ActionModal imports/usage

---

## 🎯 Prioritized Fix Order

### Phase 1: Critical Data Issues (Must Fix)
1. **Issue #3** - Order created activity not showing to stakeholders
   - Backend: Update activity writer to include stakeholders
   - Impact: Blocks discovery of new orders

2. **Issue #2** - Activity → Modal opens empty
   - Frontend: Fix ActivityFeed routing and ModalGateway data merge
   - Impact: Blocks interaction from activity feed

3. **Issue #5** - Warehouse deliveries actions don't work
   - Frontend: Migrate deliveries table to modal system
   - Impact: Blocks warehouse fulfillment workflow

### Phase 2: Polish & UX (Should Fix)
4. **Issue #1** - Deleted order modal broken
   - Frontend/Backend: Implement tombstone fallback
   - Impact: Admin can't review deleted orders

5. **Issue #4** - Activity message shows order ID
   - Frontend: Personalize activity messages
   - Impact: Visual clutter in activity feed

6. **Issue #8** - Approval workflow not visible
   - Frontend: Always show workflow section
   - Impact: Transparency and user understanding

### Phase 3: Nice to Have
7. **Issue #7** - Janky tab loading
   - Frontend: Add skeleton loaders
   - Impact: Polish and perceived performance

8. **Debt #1 & #2** - Legacy modal cleanup
   - Frontend: Remove old modal code
   - Impact: Code maintainability

---

## 📋 Validation Checklist (After Fixes)

### Test Scenario 1: Crew Creates Order
- [ ] Activity appears in Crew hub: "You created an order!"
- [ ] Activity appears in Center hub: "Created Product Order"
- [ ] Activity appears in Warehouse hub: "Created Product Order"
- [ ] Activity appears in Admin hub: "Created Product Order CRW-006-PO-XXX"
- [ ] Activity message does NOT show order ID for non-admin stakeholders

### Test Scenario 2: Activity Feed → Modal
- [ ] Crew clicks activity → Modal opens with full Details/History
- [ ] Center clicks activity → Modal opens with full Details/History
- [ ] Warehouse clicks activity → Modal opens with full Details/History
- [ ] Admin clicks activity → Modal opens with full Details/History
- [ ] All paths show same data as Orders section path

### Test Scenario 3: Warehouse Fulfillment
- [ ] Warehouse sees order in activity feed
- [ ] Warehouse clicks activity → Modal opens with Quick Actions
- [ ] "Accept" and "Reject" buttons work from modal
- [ ] Deliveries table removed in-row buttons
- [ ] Deliveries table click opens modal

### Test Scenario 4: Deleted Order
- [ ] Admin deletes order
- [ ] Admin clicks deleted order activity → Modal opens with DeletedBanner
- [ ] DeletedBanner shows: who deleted, when, reason
- [ ] Details/History still accessible (read-only)
- [ ] Restore option available for admin

### Test Scenario 5: Approval Workflow
- [ ] Non-actor users see workflow section in modal
- [ ] Workflow shows current status and next expected action
- [ ] Users without actions see "No actions available" message or workflow status

---

## 🔍 Files Requiring Changes (Summary)

### Backend
- `apps/backend/server/domains/activity/writer.ts` - Include stakeholders in order_created
- `apps/backend/server/domains/orders/store.ts` - Verify activity recording
- `apps/backend/server/domains/scope/store.ts` - Activity scope rules
- `apps/backend/server/domains/archive/store.ts` - Tombstone endpoints

### Frontend
- `apps/frontend/src/components/ActivityFeed.tsx:124` - Remove legacy modal paths
- `apps/frontend/src/components/ModalGateway.tsx` - Fix data merging, add tombstone fallback
- `apps/frontend/src/shared/activity/useFormattedActivities.ts:370` - Personalize messages
- `apps/frontend/src/config/entityRegistry.tsx:329` - Always show workflow section
- `apps/frontend/src/hubs/WarehouseHub.tsx` - Migrate deliveries table
- `apps/frontend/src/hooks/useEntityActions.ts` - Verify hook handles all cases
- `apps/frontend/src/shared/api/archive.ts` - Tombstone fallback
- `apps/frontend/src/shared/api/client.ts` - 404 handling for deleted entities

---

## 📸 Screenshots Reference

1. Crew order creation with Quick Actions working
2. Activity showing in Crew hub
3. Deleted order modal showing broken state (Issue #1)
4. Empty modal from activity feed (Issue #2)
5. Warehouse pending deliveries with broken buttons (Issue #5)

---

## Notes

- **Good Foundation:** The Quick Actions fix is working for the happy path
- **Main Gap:** Activity visibility and routing inconsistencies
- **Pattern Established:** Once fixed for orders, same pattern applies to services/reports/feedback
- **Test Coverage:** User provided comprehensive real-world testing across multiple roles

---

**Next Steps:**
1. Review this document with Claude Code
2. Prioritize fixes (recommend Phase 1 first)
3. Create focused implementation plan for each issue
4. Test after each fix to prevent regressions

**Session Context:** This follows the Reports/Feedback ownership fix session from earlier today.
