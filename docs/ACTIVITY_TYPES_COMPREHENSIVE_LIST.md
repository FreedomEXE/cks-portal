# Comprehensive Activity Types List - Admin View

## Overview
This document lists ALL activity types that Admin can see in Recent Activity feed, with UX specifications for each.

**Key Principles:**
- Keep code generic/flexible for future action types
- User stays in Recent Activity section (no tab navigation)
- Modals open contextually based on activity type and state
- DeletedBanner shows for hard-deleted items

---

## Activity Types by Category

### 📦 ORDER ACTIVITIES

| # | ACTION | DATA TYPE | WHO CAN PERFORM | ADMIN UEX (On Click) |
|---|--------|-----------|----------------|---------------------|
| 1 | `order_created` | Product/Service Order | Manager, Center, Customer, Crew, Contractor, Warehouse | Open Order Details Modal (read-only if not pending action) |
| 2 | `order_delivered` | Product/Service Order | Manager, Warehouse, Crew | Open Order Details Modal with delivery info |
| 3 | `order_accepted` | Product/Service Order | Manager, Warehouse, Crew | Open Order Details Modal |
| 4 | `order_rejected` | Product/Service Order | Manager, Warehouse, Crew | Open Order Details Modal with rejection reason |
| 5 | `order_cancelled` | Product/Service Order | Any role (creator or assignee) | Open Order Details Modal with cancellation info |
| 6 | `order_archived` | Product/Service Order | Admin, System (auto) | Open Order Actions Modal (see screenshot) |
| 7 | `order_hard_deleted` | Product/Service Order | Admin, System (auto) | Open Order Details Modal with DeletedBanner |
| 8 | `order_restored` | Product/Service Order | Admin | Open Order Details Modal |

---

### 👤 ENTITY CREATION ACTIVITIES

| # | ACTION | DATA TYPE | WHO CAN PERFORM | ADMIN UEX (On Click) |
|---|--------|-----------|----------------|---------------------|
| 9 | `manager_created` | Manager | Admin | Open Manager Profile Modal/Actions |
| 10 | `contractor_created` | Contractor | Admin | Open Contractor Profile Modal/Actions |
| 11 | `customer_created` | Customer | Admin | Open Customer Profile Modal/Actions |
| 12 | `center_created` | Center | Admin | Open Center Profile Modal/Actions |
| 13 | `crew_created` | Crew | Admin | Open Crew Profile Modal/Actions |
| 14 | `warehouse_created` | Warehouse | Admin | Open Warehouse Profile Modal/Actions |

---

### 🗄️ ENTITY ARCHIVING ACTIVITIES

| # | ACTION | DATA TYPE | WHO CAN PERFORM | ADMIN UEX (On Click) |
|---|--------|-----------|----------------|---------------------|
| 15 | `manager_archived` | Manager | Admin, System (auto) | Open Entity Actions Modal (View/Edit/Restore/Delete) |
| 16 | `contractor_archived` | Contractor | Admin, System (auto) | Open Entity Actions Modal |
| 17 | `customer_archived` | Customer | Admin, System (auto) | Open Entity Actions Modal |
| 18 | `center_archived` | Center | Admin, System (auto) | Open Entity Actions Modal |
| 19 | `crew_archived` | Crew | Admin, System (auto) | Open Entity Actions Modal |
| 20 | `warehouse_archived` | Warehouse | Admin, System (auto) | Open Entity Actions Modal |
| 21 | `service_archived` | Catalog Service | Admin, System (auto) | Open Service Actions Modal |
| 22 | `product_archived` | Product | Admin, System (auto) | Open Product Actions Modal |

---

### 🗑️ ENTITY DELETION ACTIVITIES

| # | ACTION | DATA TYPE | WHO CAN PERFORM | ADMIN UEX (On Click) |
|---|--------|-----------|----------------|---------------------|
| 23 | `manager_hard_deleted` | Manager | Admin, System (auto) | Open Profile Modal with DeletedBanner (read-only) |
| 24 | `contractor_hard_deleted` | Contractor | Admin, System (auto) | Open Profile Modal with DeletedBanner (read-only) |
| 25 | `customer_hard_deleted` | Customer | Admin, System (auto) | Open Profile Modal with DeletedBanner (read-only) |
| 26 | `center_hard_deleted` | Center | Admin, System (auto) | Open Profile Modal with DeletedBanner (read-only) |
| 27 | `crew_hard_deleted` | Crew | Admin, System (auto) | Open Profile Modal with DeletedBanner (read-only) |
| 28 | `warehouse_hard_deleted` | Warehouse | Admin, System (auto) | Open Profile Modal with DeletedBanner (read-only) |
| 29 | `service_hard_deleted` | Service | Admin, System (auto) | Open Service Modal with DeletedBanner (read-only) |
| 30 | `product_hard_deleted` | Product | Admin, System (auto) | Open Product Modal with DeletedBanner (read-only) |

---

### 🔗 ASSIGNMENT ACTIVITIES

| # | ACTION | DATA TYPE | WHO CAN PERFORM | ADMIN UEX (On Click) |
|---|--------|-----------|----------------|---------------------|
| 31 | `contractor_assigned_to_manager` | Assignment | Admin | Open Manager Profile showing contractor assignments |
| 32 | `customer_assigned_to_contractor` | Assignment | Admin | Open Contractor Profile showing customer assignments |
| 33 | `crew_assigned_to_center` | Assignment | Admin | Open Center Profile showing crew assignments |
| 34 | `center_assigned_to_customer` | Assignment | Admin | Open Customer Profile showing center assignments |
| 35 | `warehouse_assigned_to_contractor` | Assignment | Admin | Open Contractor Profile showing warehouse assignments |

---

### 📝 REPORT & FEEDBACK ACTIVITIES

| # | ACTION | DATA TYPE | WHO CAN PERFORM | ADMIN UEX (On Click) |
|---|--------|-----------|----------------|---------------------|
| 36 | `report_created` | Report | Any role | Open Report Details Modal |
| 37 | `feedback_created` | Feedback | Any role | Open Feedback Details Modal |
| 38 | `report_archived` | Report | Admin, System (auto) | Open Report Actions Modal |
| 39 | `feedback_archived` | Feedback | Admin, System (auto) | Open Feedback Actions Modal |
| 40 | `report_hard_deleted` | Report | Admin, System (auto) | Open Report Modal with DeletedBanner (read-only) |
| 41 | `feedback_hard_deleted` | Feedback | Admin, System (auto) | Open Feedback Modal with DeletedBanner (read-only) |
| 42 | `report_acknowledged` | Report | Manager, Admin | Open Report Details Modal |
| 43 | `report_resolved` | Report | Manager, Admin | Open Report Details Modal with resolution info |

---

## Implementation Notes

### Generic Modal System

Instead of hardcoding specific activity types, use pattern matching:

```typescript
// Pattern-based routing
if (activityType.includes('_created')) {
  // Open entity in view mode
  openEntityModal(targetType, targetId, 'view');
}

if (activityType.includes('_archived')) {
  // Open actions modal (View/Edit/Restore/Delete)
  openActionsModal(targetType, targetId, 'archived');
}

if (activityType.includes('_hard_deleted')) {
  // Open read-only modal with DeletedBanner
  openEntityModal(targetType, targetId, 'deleted');
}

if (activityType.includes('_assigned')) {
  // Open relationship view
  openRelationshipModal(targetType, targetId, metadata);
}
```

### Future-Proofing

New activity types will automatically work with pattern matching:
- `order_modified` → Opens order modal
- `service_activated` → Opens service modal
- `warehouse_inventory_updated` → Opens warehouse modal
- `crew_training_completed` → Opens crew modal

### State Detection

Activity system should fetch entity state on click:
1. Click activity → Fetch entity with `includeDeleted=1`
2. Check entity state: `active` | `archived` | `deleted`
3. Open appropriate modal with correct props
4. Show DeletedBanner if `state === 'deleted'`

---

## Screenshots Referenced

- Order Actions Modal (Admin View): `docs/images/screenshots/ORDER ACTIONS MODAL(ADMIN VIEW).jpeg`

---

## Questions for Implementation

1. **Service Orders**: Do service orders need different modal than product orders?
2. **Assignment Details**: Should assignments open the assignee or the assigned entity?
3. **Report/Feedback**: Are these implemented yet? Need modal designs?
4. **Inventory Updates**: Should warehouse inventory changes create activities?
5. **Profile Updates**: Should entity profile updates create activities (e.g., "Manager MGR-001 updated profile")?

---

**Total Activity Types**: 43 (and growing)

**Pattern Categories**: 6
- Creation (`_created`)
- State Change (`_delivered`, `_accepted`, `_rejected`, `_cancelled`)
- Archival (`_archived`)
- Deletion (`_hard_deleted`)
- Restoration (`_restored`)
- Assignment (`_assigned`)
