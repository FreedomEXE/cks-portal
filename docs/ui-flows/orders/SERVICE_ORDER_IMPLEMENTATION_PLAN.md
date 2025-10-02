# Organized Service Order Implementation Plan

## 1. Service Order ID Format & Transformation

### Service Order IDs
- **Format**: `CEN-XXX-ORD-SRV-XXX` (Service Order ID)
- **Example**: `CEN-001-ORD-SRV-042`

### Service IDs (After Approval)
- **Format**: `CEN-XXX-SRV-XXX` (Custom Service ID)
- **Example**: `CEN-001-SRV-042`
- **Trigger**: When manager accepts and builds the service
- **Storage**: `transformedId` field stores the service ID

---

## 2. Approval Workflow by Creator Role

### Center Creates Service Order
**Approval Chain**: Center → Customer → Contractor → Manager

**Workflow Visualization**:
```
Center (✓ created/green) → Customer (⏳ pending/yellow PULSING) → Contractor (⏳ pending/yellow NO PULSE) → Manager (⏳ pending/yellow NO PULSE)
```

**After Customer Accepts**:
```
Center (✓ created/green) → Customer (✓ accepted/green BIG BOX) → Contractor (⏳ pending/yellow PULSING) → Contractor (⏳ pending/yellow NO PULSE) → Manager (⏳ pending/yellow NO PULSE)
```

### Customer Creates Service Order
**Approval Chain**: Customer → Contractor → Manager

### Contractor Creates Service Order
**Approval Chain**: Contractor → Manager

### Key Pattern
- **Next Actor**: Yellow pulsing box (can Accept/Reject/View Details)
- **Future Actors**: Yellow no-pulse box, same size (View Details only)
- **Creator**: Can Cancel until next actor accepts
- **Past Actors**: Green boxes showing accepted status

---

## 3. Action Permissions by Stage

### Creator (Until Next Actor Accepts)
- ✅ Cancel
- ✅ View Details

### Next Actor (Yellow Pulsing)
- ✅ Accept
- ✅ Reject
- ✅ View Details

### Future Actors (Yellow No-Pulse)
- ✅ View Details only

### Past Actors (Green Accepted)
- ✅ View Details only

---

## 4. Rejection Handling

**When Any Actor Rejects**:
1. Their box changes to: `[User Role] (rejected/red)`
2. Order status → `rejected`
3. Order archived immediately
4. All other boxes remain unchanged (canonical state preserved)
5. No further actions available

**Example Rejection at Customer Stage**:
```
Center (✓ created/green) → Customer (✗ rejected/red) → Contractor (⏳ pending/yellow NO PULSE) → Manager (⏳ pending/yellow NO PULSE)
```

---

## 5. Manager Actions (Final Approval Stage)

### When Order Reaches Manager
**Available Actions**:
- ✅ **Accept** → Opens action menu
- ✅ **Reject** → Archives order as rejected
- ✅ **View Details**

### After Manager Accepts
**Manager Action Menu** (4 options):

1. **Add Training**
   - Status: Coming Soon
   - Action: Show toast "Coming soon"

2. **Add Procedure**
   - Status: Coming Soon
   - Action: Show toast "Coming soon"

3. **Add Crew** ⭐
   - Opens dropdown with all available crew from manager's ecosystem
   - Manager selects crew member(s)
   - Sends assignment request to selected crew
   - **Implementation**: Similar to existing crew assignment patterns

4. **Request Products**
   - Allows manager to create product order related to this service
   - **Implementation**: Opens product order modal, pre-links to service

---

## 6. Crew Assignment Flow

### Manager Sends Crew Assignment Request
1. Manager clicks "Add Crew"
2. Dropdown shows all crew from manager's ecosystem
3. Manager selects crew member
4. System sends assignment request to crew
5. Request appears in crew's Services section

### Crew Receives Assignment Request
**Crew Actions**:
- ✅ **Accept Assignment** → Crew added to service, service added to their Services section when it starts
- ✅ **Deny Assignment** → Nothing happens to order, manager must find someone else

**Important**:
- Crew denial does NOT reject/cancel the service order
- Service order remains open for manager to assign to different crew
- Only after crew accepts AND service officially starts does it appear in crew's Services section

---

## 7. Ecosystem Visibility (Like Product Orders)

**View-Only Access**: Anyone in the ecosystem can see service orders they're involved with

**Visibility Rules**:
- Creator sees: Full workflow with their actions
- Next Actor sees: Pending actions (Accept/Reject)
- Future Actors see: View Details only
- Past Actors see: View Details only
- Ecosystem members see: Read-only view based on involvement

**Implementation**: Use same `isDirectlyInvolved()` logic from product orders

---

## 8. Status Flow & Viewer Status

### Canonical Status Values
- `pending` → Initial creation
- `pending_customer` → Awaiting customer approval (center-created orders)
- `pending_contractor` → Awaiting contractor approval
- `pending_manager` → Awaiting manager approval
- `manager_accepted` → Manager accepted, awaiting crew assignment
- `crew_requested` → Crew assignment requested
- `crew_assigned` → Crew accepted assignment
- `service_created` → Transformed to service (terminal state)
- `rejected` → Rejected by any actor (terminal state)
- `cancelled` → Cancelled by creator (terminal state)

### Viewer Status Mapping
- **Next Actor**: `pending` (yellow pulsing)
- **Creator (before next accepts)**: `in-progress` (blue)
- **Future Actors**: `in-progress` (blue, view-only)
- **Terminal States**: `completed`, `rejected`, `cancelled`

---

## 9. Implementation Lessons from Product Orders

### Apply These Fixes Proactively

1. **Status Normalization**
   - ✅ Add ALL possible status values to `normalizeOrderStatus()` in all 6 hub files IMMEDIATELY
   - ✅ Include: `pending_customer`, `pending_contractor`, `pending_manager`, `manager_accepted`, `crew_requested`, `crew_assigned`, `service_created`

2. **Archive Filtering**
   - ✅ Update archive filter to include `service_created` status from the start
   - ✅ Update archiveCount calculation to include all terminal states

3. **Policy Configuration**
   - ✅ Define complete ACTIONS_BY_STATUS for all roles before testing
   - ✅ Rebuild @cks/policies package after every policy change

4. **Canonical vs Viewer Status**
   - ✅ Clearly separate canonical status (business logic) from viewer status (display)
   - ✅ Document which is used where in code comments

5. **Package Rebuilds**
   - ✅ After changing @cks/policies: `pnpm --filter @cks/policies build`
   - ✅ After changing @cks/domain-widgets: `pnpm --filter @cks/domain-widgets build`
   - ✅ Always rebuild BEFORE testing

6. **Testing Strategy**
   - ✅ Test full approval chain for each creator role separately
   - ✅ Test rejection at each stage
   - ✅ Test cancellation at each stage
   - ✅ Verify cross-user visibility at each stage

---

## 10. Key Differences from Product Orders

| Aspect | Product Orders | Service Orders |
|--------|---------------|----------------|
| **Approval Chain** | Simpler (Creator → Warehouse/Manager) | Multi-stage (Center → Customer → Contractor → Manager) |
| **Terminal Action** | Mark Delivered → Archive | Create Service → Transform to Service ID |
| **ID Format** | `MGR-012-PO-050` | `CEN-001-ORD-SRV-042` → `CEN-001-SRV-042` |
| **Post-Approval** | Delivery workflow | Crew assignment workflow |
| **Rejection Impact** | Archives immediately | Archives immediately, preserves workflow state |
| **Crew Involvement** | None | Assignment request/accept flow |

---

## 11. Technical Implementation Checklist

### Backend Changes Needed

- [ ] Add service order statuses to policy (`pending_customer`, `pending_contractor`, `pending_manager`, etc.)
- [ ] Define ACTIONS_BY_STATUS for all roles at each service order status
- [ ] Implement approval chain logic based on creator role
- [ ] Add crew assignment request/response actions
- [ ] Implement service transformation logic (ORD-SRV-XXX → SRV-XXX)
- [ ] Add transformedId tracking

### Frontend Changes Needed

- [ ] Update all 6 hub files with complete status normalization
- [ ] Update OrdersSection archive filtering for service_created
- [ ] Implement multi-stage approval workflow visualization
- [ ] Add Manager action menu (Add Training, Add Procedure, Add Crew, Request Products)
- [ ] Build crew selection dropdown for manager
- [ ] Add crew assignment request UI in crew Services section
- [ ] Update archive to show transformedId for service_created orders

### Policy Package Updates

- [ ] Add service order approval chains
- [ ] Define actions for: customer, contractor, manager, crew at each stage
- [ ] Handle crew assignment request/response actions
- [ ] Rebuild package after changes

### Domain Widgets Updates

- [ ] Ensure OrdersSection handles service order types
- [ ] Support multi-stage workflow visualization
- [ ] Handle different approval chain lengths
- [ ] Rebuild package after changes

---

## 12. Questions to Clarify

1. **When does service officially "start"?**
   - Is it when crew accepts assignment?
   - Or when manager marks it as started?
   - Or based on scheduled date?

2. **Can manager assign multiple crew to one service?**
   - If yes, do all need to accept?
   - Or is it first-come-first-served?

3. **What happens to service order after transformation?**
   - Does it stay in archive?
   - Or move completely to Services section?

4. **Request Products action:**
   - Does this create a linked product order?
   - Should it auto-populate destination/requester?

---

*Created: 2025-10-02*
*Status: Ready for Implementation*
