# Reports & Feedback System - E2E Testing Checklist

**Date**: October 10, 2025
**Tester**: _________________
**System Version**: MVP Pre-Release

---

## Role Permissions Summary

| Role | Can Create Reports | Can Create Feedback | Can Acknowledge | Can Resolve |
|------|-------------------|--------------------|--------------------|-------------|
| Customer | ✅ Yes | ✅ Yes | ✅ Yes (Related) | ❌ No |
| Center | ✅ Yes | ✅ Yes | ✅ Yes (Related) | ❌ No |
| Contractor | ✅ Yes | ✅ Yes | ✅ Yes (Related) | ❌ No |
| Manager | ❌ **NO** | ✅ Yes | ✅ Yes (All) | ✅ Yes (Service/Procedure) |
| Warehouse | ❌ **NO** | ✅ Yes | ✅ Yes (Orders) | ✅ Yes (Order Reports) |
| Crew | ❌ **NO** | ❌ **NO** | ✅ Yes (Related) | ❌ No |
| Admin | ❌ No | ❌ No | ✅ Yes (All) | ✅ Yes (All) |

---

## Testing Progress Summary (Oct 10, 2025)

### ✅ TESTED & WORKING (3 Flows):

1. **Product Order Report** (Warehouse-managed)
   - Report ID: `CEN-010-RPT-012`
   - Creator: Center (CEN-010)
   - Reason: Billing Issue
   - Status: ✅ PASS - Auto-close works correctly

2. **Service Report** (Manager-managed)
   - Report ID: `CUS-015-RPT-011`
   - Creator: Customer (CUS-015)
   - Reason: Crew Behavior
   - Status: ✅ PASS - Stakeholder filtering working

3. **Service Feedback** (Manager creates)
   - Feedback ID: `MGR-012-FBK-001`
   - Creator: Manager (MGR-012)
   - Reason: Excellent Quality (5★)
   - Status: ✅ PASS - Modal terminology fixed

### 🔧 CRITICAL FIXES APPLIED:

1. **Auto-Close Logic Fix** (repository.ts:411-420, 278-287)
   - Now filters `ackCount` to only count stakeholder acknowledgments
   - Non-stakeholders can acknowledge but don't trigger auto-close

2. **Modal Terminology Fix** (ReportDetailsModal.tsx:165, 282, 303, 344)
   - Feedback modals now show "Feedback" labels (not "Report")
   - Resolution section hidden for feedback

3. **Warehouse-Managed Service Detection (Oct 11, 2025)**
   - Services are considered warehouse‑managed when `services.managed_by` is:
     - the literal string `warehouse` (legacy), or
     - a specific warehouse ID starting with `WHS-` (e.g., `WHS-004`).
   - Verify “Managed By” shows Warehouse in ReportDetailsModal for such services.
   - Verify warehouse users can resolve service reports managed by `WHS-*`.

### ❌ STILL TO TEST:
- [ ] Order Feedback (Customer/Center/Contractor)
- [ ] Service Feedback (Customer/Center/Contractor - non-Manager)
- [ ] Procedure Reports/Feedback (Not ready yet - skip)
- [ ] Warehouse permissions (cannot create reports)
- [ ] Crew permissions (cannot create anything)
- [ ] Service report resolution as Warehouse on a `WHS-*` managed service

---

## Quick Smoke Test (5 Minutes)

**Purpose**: Verify basic functionality is working

- [ ] **Step 1**: Login as `MGR-012` (Manager)
- [ ] **Step 2**: Navigate to Reports tab
- [ ] **Step 3**: Create 1 Service Report
  - Type: Report
  - Report For: Service
  - Select Service: _(any)_
  - Reason: Quality Issue
  - Priority: High
  - Submit
- [ ] **Step 4**: Verify report appears in "Reports" tab
- [ ] **Step 5**: Create 1 Service Feedback
  - Type: Feedback
  - Feedback For: Service
  - Select Service: _(any)_
  - Reason: Excellent Quality
  - Rating: 5 stars
  - Submit
- [ ] **Step 6**: Verify feedback appears in "Feedback" tab
- [ ] **Step 7**: Login as `WHS-004` (Warehouse)
- [ ] **Step 8**: Navigate to Reports tab
- [ ] **Step 9**: Verify NO "Create" tab visible (or shows permission message)
- [ ] **Step 10**: Verify can VIEW reports in Reports/Feedback tabs
- [ ] **Step 11**: Login as a Customer account
- [ ] **Step 12**: Create 1 Order Report
  - Type: Report
  - Report For: Order
  - Select Order: _(any product order)_
  - Reason: Billing Issue
  - Priority: Medium
  - Submit
- [ ] **Step 13**: Verify order report created successfully

**Smoke Test Result**: ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________________________________

---

## Test Group 1: Product Order Reports (Managed by Warehouse)

**Scenario**: Customer/Center/Contractor reports issues with product orders

### Test Case 1A: Customer Reports Product Order Issue ✅

**Login**: Customer account `CUS-015`

**Steps**:
1. [✅] Navigate to Reports tab → Click "Create"
2. [✅] Select Type: **Report**
3. [✅] Select Report For: **Order**
4. [✅] Select Order: Product Order - 1 items (CEN-010-PO-071)
5. [✅] Select Reason: **Billing Issue**
6. [✅] Select Priority: **Medium**
7. [✅] Click Submit
8. [✅] Verify report appears in "Reports" tab with:
   - [✅] Correct category badge (Order)
   - [✅] Correct reason displayed
   - [✅] Correct priority badge (Medium)
   - [✅] Status: Open

**Report Created**: CEN-010-RPT-012

**Visibility Test Results**:
- [✅] CRW-006 (Crew) can view - YES | Can ACKNOWLEDGE - YES
- [✅] CUS-015 (Customer) can view - YES | Can ACKNOWLEDGE - YES (creator excluded ✓)
- [✅] CON-010 (Contractor) can view - YES | Can ACKNOWLEDGE - YES
- [✅] WHS-004 (Warehouse) can view - YES | Can ACKNOWLEDGE - YES | Can RESOLVE - YES
- [✅] MGR-012 (Manager) can view - YES | Can ACKNOWLEDGE - YES

**Expected Result**: Report created successfully, visible to customer and warehouse

**Result**: ✅ PASS | ⬜ FAIL
**Notes**:
**ALL FLOWS WORKING CORRECTLY (Oct 10, 2025)**:
1. ✅ Report appears immediately after creation (no refresh needed)
2. ✅ All stakeholders can acknowledge (creator excluded from count)
3. ✅ Warehouse can resolve product order reports
4. ✅ Auto-close works: Report marked "closed" when all parties acknowledge + warehouse resolves
5. ✅ Order-specific stakeholder counting working perfectly
6. ✅ Cache mutations functioning across all actions

---

## Test Group 2: Product Order Feedback

**Scenario**: Customer provides positive feedback on product orders

### Test Case 2A: Customer Feedback on Product Order ⬜

**Login**: Customer account

**Steps**:
1. [ ] Reports → "Create" tab
2. [ ] Select Type: **Feedback**
3. [ ] Select Feedback For: **Order**
4. [ ] Select Order: _(Any product order)_
5. [ ] Select Reason: **Smooth Process** or **Accurate Details**
6. [ ] Select Rating: **5 stars**
7. [ ] Click Submit
8. [ ] Verify feedback appears in "Feedback" tab with:
   - [ ] 5-star rating displayed
   - [ ] Correct category (Order)
   - [ ] Correct reason

**Result**: ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________________________________

---

## Test Group 3: Service Order Reports (Customer/Center/Contractor)

**Scenario**: Customer/Center/Contractor reports service issues (Manager manages/resolves)

### Test Case 3A: Customer Reports Service Issue ✅

**Login**: `CUS-015` (Customer)

**Steps**:
1. [✅] Reports → "Create"
2. [✅] Select Type: **Report**
3. [✅] Select Report For: **Service**
4. [✅] Select Service: CEN-010-SRV-001
5. [✅] Select Reason: **Crew Behavior**
6. [✅] Select Priority: **High**
7. [✅] Submit
8. [✅] Verify report created with:
   - [✅] High priority badge (red/orange)
   - [✅] Service category
   - [✅] Status: Open

**Report Created**: CUS-015-RPT-011

**Visibility & Acknowledgment Test Results**:
- [✅] CEN-010 (Center) can view - YES | Can ACKNOWLEDGE - YES
- [✅] CON-010 (Contractor) can view - YES | Can ACKNOWLEDGE - YES
- [✅] CRW-006 (Crew) can view - YES | Can ACKNOWLEDGE - YES (but doesn't count toward stakeholders)
- [✅] MGR-012 (Manager) can view - YES | Can ACKNOWLEDGE - YES | Can RESOLVE - YES
- [✅] WHS-004 (Warehouse) - NOT involved (service report, not order)

**Auto-Close Test**:
- [✅] Manager resolved report
- [✅] All stakeholders (CEN-010, CON-010, MGR-012, excluding creator CUS-015) acknowledged
- [✅] Report auto-closed to "closed" status ONLY after all stakeholders acknowledged
- [✅] Non-stakeholder acknowledgments (CRW-006) correctly ignored in count

**Result**: ✅ PASS | ⬜ FAIL
**Notes**:
**ALL FLOWS WORKING CORRECTLY (Oct 10, 2025 - After Fix)**:
1. ✅ Service reports correctly identify stakeholders from order (manager, customer, contractor, crew - NO warehouse)
2. ✅ Only stakeholder acknowledgments count toward auto-close threshold
3. ✅ Auto-close works correctly: All stakeholders acknowledge + manager resolves = closed
4. ✅ Non-stakeholders can acknowledge but don't affect auto-close logic
5. ✅ FIX APPLIED: ackCount now filters to stakeholders only (repository.ts:411-420, 278-287)

---

## Test Group 4: Service Feedback (Manager)

**Scenario**: Manager provides positive feedback on services

### Test Case 4A: Manager Service Feedback ✅

**Login**: `MGR-012` (Manager)

**Steps**:
1. [✅] Reports → "Create"
2. [✅] Select Type: **Feedback**
3. [✅] Select Feedback For: **Service**
4. [✅] Select Service: CEN-010-SRV-002
5. [✅] Select Reason: **Excellent Quality**
6. [✅] Select Rating: **5 stars**
7. [✅] Submit
8. [✅] Verify feedback appears with 5-star rating

**Feedback Created**: MGR-012-FBK-001

**Visibility Test Results**:
- [✅] CEN-010 (Center) can view - YES | Can ACKNOWLEDGE - YES
- [✅] CON-010 (Contractor) can view - YES | Can ACKNOWLEDGE - YES
- [✅] CRW-006 (Crew) can view - YES | Can ACKNOWLEDGE - YES
- [✅] CUS-015 (Customer) can view - YES | Can ACKNOWLEDGE - YES
- [✅] WHS-004 (Warehouse) - NOT required to acknowledge (service feedback)

**Auto-Close Test**:
- [✅] All ecosystem stakeholders acknowledged (excluding warehouse)
- [✅] Feedback auto-closed to "closed" status
- [✅] No resolution required (feedback doesn't need resolution)

**Modal Display Test**:
- [✅] Modal shows "Feedback Summary" (not "Report Summary")
- [✅] Modal shows "Feedback Lifecycle" (not "Report Lifecycle")
- [✅] Modal does NOT show "Resolution Status" section (correct for feedback)
- [✅] Modal shows "Feedback closed" text (context-aware)

**Result**: ✅ PASS | ⬜ FAIL
**Notes**:
**ALL FLOWS WORKING CORRECTLY (Oct 10, 2025)**:
1. ✅ Feedback created successfully with 5-star rating
2. ✅ All ecosystem members can acknowledge
3. ✅ Auto-closed when all stakeholders acknowledged (no resolution needed)
4. ✅ Modal correctly uses "Feedback" terminology throughout
5. ✅ FIX APPLIED: Modal context-aware for feedback vs reports (ReportDetailsModal.tsx:165, 282, 303, 344)

---

## Test Group 5: Service Reports (Created by Center)

**Scenario**: Center reports service issues (warehouse manages but doesn't create)

### Test Case 5A: Center Reports Service Issue ⬜

**Login**: Center account (e.g., `CTR-XXX`)

**Steps**:
1. [ ] Reports → "Create"
2. [ ] Select Type: **Report**
3. [ ] Select Report For: **Service**
4. [ ] Select Service: _(Choose one)_
5. [ ] Select Reason: **Safety Concern** or **Timing Problem**
6. [ ] Select Priority: **High**
7. [ ] Submit
8. [ ] Verify report created
9. [ ] **Optional**: Login as `WHS-004` to verify warehouse can VIEW this report

**Result**: ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________________________________

---

## Test Group 6: Service Feedback (from Contractor)

**Scenario**: Contractor provides service feedback

### Test Case 6A: Contractor Service Feedback ⬜

**Login**: Contractor account (e.g., `CTR-009`)

**Steps**:
1. [ ] Reports → "Create"
2. [ ] Verify Type is set to **Feedback** (contractors typically cannot create reports)
3. [ ] Select Feedback For: **Service**
4. [ ] Select Service: _(Any service)_
5. [ ] Select Reason: **Great Communication**
6. [ ] Select Rating: **4 stars**
7. [ ] Submit
8. [ ] Verify feedback created with 4-star rating

**Result**: ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________________________________

---

## Test Group 7: Complete Flow - All Categories

**Scenario**: Single user creates all report/feedback types efficiently

### Test Case 7A: Manager Creates All Report Types ⬜

**Login**: `MGR-012` (Manager)

**Part 1 - Create 3 Reports**:
1. [ ] Service Report
   - [ ] Report For: Service
   - [ ] Reason: Quality Issue
   - [ ] Priority: High
   - [ ] Submit & verify

2. [ ] Order Report
   - [ ] Report For: Order
   - [ ] Reason: Billing Issue
   - [ ] Priority: Medium
   - [ ] Submit & verify

3. [ ] Procedure Report
   - [ ] Report For: Procedure
   - [ ] Reason: Unclear Instructions
   - [ ] Priority: Low
   - [ ] Submit & verify

**Part 2 - Create 3 Feedbacks**:
4. [ ] Service Feedback
   - [ ] Feedback For: Service
   - [ ] Reason: Excellent Quality
   - [ ] Rating: 5★
   - [ ] Submit & verify

5. [ ] Order Feedback
   - [ ] Feedback For: Order
   - [ ] Reason: Accurate Details
   - [ ] Rating: 4★
   - [ ] Submit & verify

6. [ ] Procedure Feedback
   - [ ] Feedback For: Procedure
   - [ ] Reason: Easy to Follow
   - [ ] Rating: 5★
   - [ ] Submit & verify

**Part 3 - Verification**:
7. [ ] Navigate to "Reports" tab
8. [ ] Verify all 3 reports appear (Service, Order, Procedure)
9. [ ] Navigate to "Feedback" tab
10. [ ] Verify all 3 feedbacks appear with correct ratings

**Result**: ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________________________________

---

## Test Group 8: Warehouse VIEW-ONLY Verification

**Scenario**: Confirm warehouse cannot create, but can view/manage

### Test Case 8A: Verify Warehouse Cannot Create ⬜

**Login**: `WHS-004` (Warehouse)

**Steps**:
1. [ ] Navigate to Reports section
2. [ ] Check tabs available
3. [ ] Verify one of the following:
   - [ ] No "Create" tab visible at all, OR
   - [ ] "Create" tab exists but shows permission denied message
4. [ ] Navigate to "Reports" tab
5. [ ] Verify can VIEW reports about:
   - [ ] Product orders (managed by warehouse)
   - [ ] Services (warehouse manages)
6. [ ] Navigate to "Feedback" tab
7. [ ] Verify can VIEW feedback

**Result**: ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________________________________

### Test Case 8B: Warehouse Can Acknowledge/Resolve ⬜

**Login**: `WHS-004` (Warehouse)

**Prerequisites**: At least one report exists (from previous tests)

**Steps**:
1. [ ] Navigate to Reports tab
2. [ ] Click on a report card (related to product order or service)
3. [ ] Verify "Acknowledge" button is visible and enabled
4. [ ] Click "Acknowledge"
5. [ ] Verify status changes to "Acknowledged"
6. [ ] Click "Resolve" button
7. [ ] Enter resolution notes (e.g., "Fixed inventory discrepancy")
8. [ ] Enter action taken (e.g., "Updated order records")
9. [ ] Submit resolution
10. [ ] Verify:
    - [ ] Status changes to "Resolved"
    - [ ] Resolution details display correctly
    - [ ] Report moves to "Archive" tab

**Result**: ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________________________________

---

## Test Group 9: Resolution Flow (Manager)

**Scenario**: Manager can acknowledge and resolve any report

### Test Case 9A: Manager Resolves Any Report ⬜

**Login**: `MGR-012` (Manager)

**Prerequisites**: Use reports created in previous tests

**Steps**:
1. [ ] Navigate to Reports tab
2. [ ] Select any open report
3. [ ] Click "Acknowledge" button
4. [ ] Verify status changes to "Acknowledged"
5. [ ] Click "Resolve" button
6. [ ] Add resolution notes (e.g., "Addressed crew scheduling conflict")
7. [ ] Add action taken (e.g., "Re-assigned crew member")
8. [ ] Submit resolution
9. [ ] Verify:
    - [ ] Status → "Resolved"
    - [ ] Report moves to "Archive" tab
    - [ ] Resolution details visible in report card

**Result**: ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________________________________

---

## Test Group 10: Data Validation & Edge Cases

**Scenario**: Test form validation and error handling

### Test Case 10A: Incomplete Submission Validation ⬜

**Login**: Any role with create permission (e.g., `MGR-012`)

**Steps**:
1. [ ] Reports → "Create"
2. [ ] Attempt to submit with NO selections
   - [ ] Verify error message or submit button disabled
3. [ ] Select Report For: Service
   - [ ] Leave entity unselected
   - [ ] Verify cannot submit (button disabled or error shown)
4. [ ] Select Service entity
   - [ ] Leave reason unselected
   - [ ] Verify cannot submit
5. [ ] Select Reason
   - [ ] Leave priority unselected (for reports)
   - [ ] Verify cannot submit
6. [ ] Complete all fields
   - [ ] Verify submit button becomes enabled
   - [ ] Submit successfully

**Result**: ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________________________________

### Test Case 10B: Dropdown Population ⬜

**Login**: `MGR-012` (Manager)

**Steps**:
1. [ ] Reports → "Create"
2. [ ] Select Report For: **Service**
   - [ ] Verify "Select Service" dropdown populates with services
   - [ ] Verify services show name/ID in format: "Name (SRV-XXX)"
3. [ ] Change to Report For: **Order**
   - [ ] Verify "Select Order" dropdown populates with orders
   - [ ] Verify orders show format: "Order Name (ORD-XXX)"
4. [ ] Change to Report For: **Procedure**
   - [ ] Verify dropdown shows options OR shows "Coming soon" message
5. [ ] For each category, verify reason dropdown changes:
   - [ ] Service reasons: Quality Issue, Incomplete Work, Crew Behavior, etc.
   - [ ] Order reasons: Billing Issue, Incorrect Details, Delayed Processing, etc.
   - [ ] Procedure reasons: Unclear Instructions, Process Inefficiency, etc.

**Result**: ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________________________________

### Test Case 10C: Contractor Role Permissions ⬜

**Login**: Contractor account (e.g., `CTR-009`)

**Steps**:
1. [ ] Navigate to Reports → "Create"
2. [ ] Verify Type selector behavior:
   - [ ] "Report" option is disabled/hidden OR
   - [ ] Only "Feedback" option is available
3. [ ] Verify can only create Feedback
4. [ ] Create a feedback successfully
5. [ ] Verify feedback appears in "Feedback" tab

**Result**: ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________________________________

---

## Test Group 11: Cross-Role Visibility

**Scenario**: Verify reports are visible to correct roles

### Test Case 11A: Customer Report Visibility ⬜

**Part 1 - Create as Customer**:
1. [ ] Login as Customer
2. [ ] Create an Order Report (Billing Issue, Medium priority)
3. [ ] Note the report ID: ______________

**Part 2 - Verify Manager Can See It**:
4. [ ] Login as `MGR-012` (Manager)
5. [ ] Navigate to Reports tab
6. [ ] Verify the customer's report is visible
7. [ ] Verify can acknowledge/resolve it

**Part 3 - Verify Warehouse Can See It**:
8. [ ] Login as `WHS-004` (Warehouse)
9. [ ] Navigate to Reports tab
10. [ ] Verify the order report is visible (warehouse manages orders)
11. [ ] Verify can acknowledge/resolve it

**Result**: ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________________________________

---

## Test Group 12: Archive Functionality

**Scenario**: Verify resolved reports move to archive

### Test Case 12A: Archive Tab Verification ⬜

**Login**: `MGR-012` (Manager)

**Steps**:
1. [ ] Navigate to Reports section
2. [ ] Verify tabs include: Reports, Feedback, Create, **Archive**
3. [ ] Click "Archive" tab
4. [ ] Verify shows only resolved/closed reports and feedback
5. [ ] Verify active (open) reports are NOT in archive
6. [ ] Click on an archived item
7. [ ] Verify resolution details are visible:
   - [ ] Resolution notes
   - [ ] Action taken
   - [ ] Resolved by (name/role)
   - [ ] Resolved date/time

**Result**: ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________________________________

---

## Test Group 13: Search & Filter

**Scenario**: Test search functionality in reports/feedback tabs

### Test Case 13A: Search Reports ⬜

**Login**: `MGR-012` (Manager)

**Prerequisites**: Multiple reports created with different reasons/categories

**Steps**:
1. [ ] Navigate to "Reports" tab
2. [ ] Use search box to search for a specific:
   - [ ] Report ID (e.g., "RPT-001")
   - [ ] Category (e.g., "Service")
   - [ ] Reason (e.g., "Quality Issue")
3. [ ] Verify search filters results correctly
4. [ ] Clear search
5. [ ] Verify all reports reappear

**Result**: ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________________________________

---

## Summary

### Test Results Overview

| Test Group | Total Tests | Passed | Failed | Skipped |
|------------|-------------|--------|--------|---------|
| Smoke Test | 1 | ⬜ | ⬜ | ⬜ |
| Product Order Reports | 1 | ⬜ | ⬜ | ⬜ |
| Product Order Feedback | 1 | ⬜ | ⬜ | ⬜ |
| Service Reports (Manager) | 1 | ⬜ | ⬜ | ⬜ |
| Service Feedback (Manager) | 1 | ⬜ | ⬜ | ⬜ |
| Service Reports (Center) | 1 | ⬜ | ⬜ | ⬜ |
| Service Feedback (Contractor) | 1 | ⬜ | ⬜ | ⬜ |
| All Categories (Manager) | 1 | ⬜ | ⬜ | ⬜ |
| Warehouse Verification | 2 | ⬜ | ⬜ | ⬜ |
| Resolution Flow (Manager) | 1 | ⬜ | ⬜ | ⬜ |
| Validation & Edge Cases | 3 | ⬜ | ⬜ | ⬜ |
| Cross-Role Visibility | 1 | ⬜ | ⬜ | ⬜ |
| Archive Functionality | 1 | ⬜ | ⬜ | ⬜ |
| Search & Filter | 1 | ⬜ | ⬜ | ⬜ |
| **TOTAL** | **16** | **__** | **__** | **__** |

### Critical Issues Found (October 10, 2025 - Session 2 Fixes)

**RESOLVED**:
1. ✅ Backend 500 errors causing "Failed to acknowledge" toasts (Fixed: corrected SQL column names)
2. ✅ Reports not auto-closing despite all acknowledgments (Fixed: order-specific stakeholder counting)
3. ✅ Reports not appearing after creation without manual refresh (Fixed: added cache mutation to hubs)

**NEW TEST CASES NEEDED**:
1. [ ] Verify reports auto-close when all ORDER PARTICIPANTS acknowledge (not ecosystem-wide)
2. [ ] Verify creator is excluded from acknowledgment count
3. [ ] Verify cache updates immediately after report creation (no manual refresh needed)
4. [ ] Verify no 500 errors in backend logs when acknowledging/resolving
5. [ ] Test with orders having NULL contractor_id or crew_id (edge case)

### Non-Critical Issues

1. _______________________________________________________________
2. _______________________________________________________________
3. _______________________________________________________________

### Overall Status

⬜ **READY FOR PRODUCTION**
⬜ **MINOR FIXES NEEDED**
⬜ **MAJOR FIXES REQUIRED**
⬜ **BLOCKED - CANNOT PROCEED**

### Tester Sign-Off

**Name**: _________________
**Date**: _________________
**Signature**: _________________

---

**End of Test Checklist**
