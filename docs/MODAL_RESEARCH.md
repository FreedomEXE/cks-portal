# Modal Architecture Research

**Date:** 2025-10-21
**Purpose:** Research best practices for modal management in React to determine optimal architecture for CKS Portal
**Status:** In Progress - Gathering Context

---

## Current State of CKS Modal System

### What We Have Now
- **ModalProvider** - Context-based provider managing modal state
- **ModalGateway** - Universal component that routes to entity-specific modals
- **Entity Registry** - Maps entity types to adapters (order, report, service, feedback, etc.)
- **Entity Adapters** - Define actions, components, and prop mapping per entity type

### The Problem We Hit
**React Hooks Violation:**
- Adapters were calling `useEntityActions()` hook inside `buildActions()` function
- `buildActions()` was called from `useMemo()` in ModalGateway
- This creates nested hook calls: `useMemo` → `buildActions` → `useEntityActions` ❌
- React error: "Rendered more hooks than during the previous render"

### Proposed Fix (Before Research)
1. Make adapters pure - no hooks allowed
2. Adapters return `EntityActionDescriptor[]` (declarative specs)
3. ModalGateway calls `useEntityActions()` at top level
4. ModalGateway binds descriptors to handlers with actual onClick logic

---

## Research Questions

1. **Is our Context + Provider pattern standard?**
2. **How do others handle multiple modal types?**
3. **Is the adapter/registry pattern recommended?**
4. **Where should action logic live?**
5. **How do libraries like nice-modal-react solve this?**
6. **Are we on the right track or should we pivot?**

---

## External Research

### Web Search Results Summary

**Key Findings:**
- Context API + Provider is the most recommended pattern for centralized modals
- Custom hooks (useModal, useModalManager) are standard
- Modal registry/manager pattern is common for multiple types
- Performance: Consider Zustand or similar for avoiding re-renders
- Libraries: nice-modal-react (eBay), react-multi-modal exist

**Common Patterns:**
1. **Context + Provider** - Centralize modal state at app root
2. **Modal Manager/Root** - Single component renders all modal types
3. **Dynamic Registration** - Map modal names to components
4. **Custom Hooks** - Expose showModal/hideModal via useModal()

---

## Context From Reddit/Community

### Gemini's Opinion - Enterprise Modal Architecture

**Core Recommendation:**
- **Global modal state** via Redux/Zustand/Context API
- **Centralized `<ModalRenderer />`** at app root watching global state
- **Individual modal components** (LoginModal, ConfirmDeleteModal) are self-contained
- **Modal service** provides clean API: `modalService.open('LoginModal', { data })`

**Key Benefits:**
- Decoupled and scalable - add modals without modifying existing code
- Centralized control - focus, backdrop, history in one place
- Lazy loading - only fetch modal code when needed
- Easy debugging - single source of truth

**Role-Based Access Control (RBAC) Pattern:**
- Store user permissions in global state (NOT just roles)
- Use reusable `<Can permission="order:cancel">` component/hook
- Check **specific permissions**, not role names (more flexible)
- Keep modal components "dumb" - they check permissions via `<Can>`
- **Front-end checks are UX only** - back-end must enforce security

**Example:**
```tsx
<OrderModal>
  <h3>Order #12345</h3>
  <Can permission="order:edit">
    <form>...</form>
  </Can>
  <Can permission="order:cancel">
    <button>Cancel Order</button>
  </Can>
</OrderModal>
```

**Best Practices:**
- Avoid modal-on-modal (single modal at a time)
- Trap focus inside modal
- Multiple dismiss methods (X, Escape, backdrop)
- WAI-ARIA roles (`role="dialog"`, `aria-modal="true"`)
- Hide vs disable for missing permissions

---

### GPT-5's Assessment - Validation of Proposed Fix

**Agreement on Root Cause:**
✅ Hooks called inside adapter functions from useMemo violates React rules
✅ "Descriptors in adapters, bind in gateway" design fixes the fault line

**Validation of Proposed Approach:**
1. ✅ Move all hooks to top level of ModalGateway
2. ✅ Adapters expose pure `getActionDescriptors(context)` - no hooks
3. ✅ Gateway binds onClick with `handleAction(entityId, desc.key, payload)`
4. ✅ Force remount via `key={${entityType}:${entityId}}`

**Refinements Suggested:**
- **Confirm/prompt:** Use shared modal instead of window.confirm (consistency + telemetry)
- **Prop shaping:** Let ModalGateway supply `isOpen`, `onClose`, `role` (avoid duplication)
- **Action keys:** Define typed `EntityActionKey` union for safety
- **Success flow:** Add `closeOnSuccess?: boolean` to descriptors
- **Loading state:** Expose keyed `isLoading` map for button spinners
- **Permissions:** Keep `can()` pure and centralized
- **Report vs Feedback:** Use single 'report' entityType, infer label from `entityData.type`

**Recommended POC Plan:**
1. Add types (EntityActionDescriptor, EntityAction, updated EntityAdapter)
2. Refactor reportAdapter: `buildActions` → `getActionDescriptors` (pure)
3. Update ModalGateway: call hooks at top, bind descriptors
4. Wire `openEntityModal(type, id, opts)` in ModalProvider
5. Update AdminHub to use `modals.openEntityModal('report', id)`
6. **Report-first POC**, then apply to orders/services

---

### Reddit Community Patterns

**Thread 1: Creating Reusable Modal**

**Headless UI Pattern:**
- Use headless components (Radix UI, HeadlessUI) as foundation
- Build custom layer on top: `MyApp → MyComponent → RadixUI`
- Headless = fully customizable but verbose

**Simple State Pattern:**
```tsx
// Pass props: show, mode, onClose
<Modal show={show} mode="create" onClose={() => setShow(false)} />

// Modal switches on mode: "create", "read", "update", "delete"
```

**Libraries Mentioned:**
- `react-modal-state` - declare modals and pass data easily
- HeadlessUI - great modal foundation

---

**Thread 2: Centralize Modals Across Pages (Next.js)**

**Top Community Recommendation:**
🏆 **nice-modal-react** by eBay (multiple mentions)
- 2+ years in production use
- "Can't imagine handling modals without it"
- Article: https://innovation.ebayinc.com/stories/rethink-modals-management-in-react/

**Common Patterns:**
1. **Context + ModalProvider** - wrap app, trigger from any component
2. **useModal hook** - `openModal(name, props)`, `closeModal(id)`
3. **Modal store** - array of open modals (supports stacking)
4. **ModalRenderer** - maps open modals and renders them
5. **Dynamic imports** - lazy load modals to reduce bundle size

**State Management Options:**
- React Context (most common)
- Jotai: `setShowModal({type: 'CONFIRMATION', data: {...}})`
- Just component state for simple cases

**Warnings:**
- "Learn React before Next.js" - component reusability is basic
- Don't centralize everything - simple confirm dialogs can be local
- Modal stacking can cause issues if not handled properly

**Example Pattern (joneath):**
```tsx
// useModal returns:
openModal(modalName: ModalName, props: ModalProps)
closeModal(modalId: string)

// modal-store:
- Array of currently open modals (infinite stacking)
- Registry mapping name → ModalComponent
- Dynamic imports for bundle optimization
- onClose callback for each modal

// ModalRenderer:
- Maps over open modals array
- Passes props to each
- Placed high up inside providers
```

---

**Thread 3: Best Pattern for Multiple Modals (30+ modals)**

**Original Pattern (Redux switch statement):**
```tsx
<Modal modalName={props.modalName}>
  switch(modalName) {
    case 'pricing': return <Pricing />
    case 'confirm': return <Confirm />
    // ... 30+ cases
  }
</Modal>
```

**Community Feedback:**

**Recommended: Portal Pattern**
- Use React Portal to render modals
- Open modal near component that handles logic
- Modal stays "dumb", parent handles input

**Recommended: Modal Service + Stack**
```tsx
modalService.openModal(<Pricing />)
modalService.openDialog(<ConfirmDialog onConfirm={...} />)

// Stack behavior:
- Push modals onto stack
- modalService.close() pops from stack
- Hide (don't remove) lower modals to keep state
```

**Recommended: Context API**
```tsx
<ModalContextConsumer>
  {({ modal, setModal }) =>
    modal && (
      <Modal onClose={() => setModal(null)} {...modal.props}>
        {modal.content}
      </Modal>
    )
  }
</ModalContextConsumer>
```

**Anti-Patterns Called Out:**
- ❌ "NOT EVERYTHING SHOULD BE A REDUX ACTION"
- ❌ Don't pre-define all modals in one giant switch
- ❌ No need for Redux just for modal state

**Alternative: Simple Local Pattern**
- Render modal next to its control
- Only needs `open` boolean and `onClose` callback
- No global state needed for simple cases

---

## Pattern Comparison Matrix

| Pattern | CKS Current | Gemini | GPT-5 | Reddit nice-modal | Reddit simple |
|---------|-------------|---------|-------|-------------------|---------------|
| **State Management** | Context | Context/Zustand | Context | Context | Local/Context |
| **Modal Registration** | Entity Registry | Modal Service | Entity Registry | Modal Registry | None (inline) |
| **Hook Location** | ❌ In adapters | ✅ Top level | ✅ Top level | ✅ Top level | ✅ Component level |
| **Action Building** | ❌ In useMemo | N/A | ✅ Pure descriptors | N/A | Props |
| **RBAC Support** | `can()` checks | `<Can>` component | `can()` pure fn | Not mentioned | Props |
| **Multiple Modals** | Single at a time | Single (recommended) | Single | Stack support | Single |
| **Lazy Loading** | No | Recommended | Not mentioned | Dynamic imports | Not needed |
| **Modal Stacking** | No | Avoid | Not mentioned | Supported | Not needed |

---

## Analysis & Recommendations

### What We're Doing RIGHT ✅

1. **Context + Provider Pattern** - Industry standard, validated by all sources
2. **Centralized State** - Single source of truth for modal management
3. **Entity Registry** - Similar to modal registry pattern in nice-modal-react
4. **Custom Hook (useEntityActions)** - Standard pattern
5. **RBAC with `can()`** - Pure permission checks (Gemini's recommendation)

### What We Need to FIX 🔧

1. **Hooks Violation** - CRITICAL: Move hooks to ModalGateway top level
2. **Pure Adapters** - Make `getActionDescriptors` completely pure (GPT-5 validated)
3. **Descriptor Binding** - Gateway binds specs to handlers (our proposed fix)

### Where We DIVERGE from Common Patterns 🤔

1. **No Modal Service API** - We use `openEntityModal(type, id)` instead of `modalService.open(name, props)`
   - **Pro:** Type-safe, entity-centric
   - **Con:** Less flexible for non-entity modals

2. **Entity-Specific vs Generic** - We route by entityType instead of arbitrary components
   - **Pro:** Enforces consistency for business entities
   - **Con:** Harder to add one-off modals (e.g., "Welcome Tour")

3. **No Lazy Loading** - All modal code loads upfront
   - **Impact:** Larger initial bundle
   - **Fix:** Easy to add dynamic imports later

4. **Adapter Pattern** - Unique to us, not seen in community
   - **Pro:** Clean separation of concerns, testable
   - **Con:** Added complexity vs simple component passing

### CKS-Specific Requirements ⭐

**Our app is different from typical SaaS because:**

1. **Heavy RBAC** - 7 role types, complex permissions
   - ✅ Gemini's `<Can>` pattern is PERFECT for this
   - ✅ Our `can()` helper already aligned

2. **Consistent Business Entities** - All modals are for structured data (orders, reports, services)
   - ✅ Entity registry makes sense (not arbitrary modals)
   - ✅ Type safety is valuable

3. **Action-Heavy Modals** - Not just display, lots of mutations
   - ✅ `useEntityActions` centralization is good
   - ✅ Descriptor pattern keeps logic testable

4. **Audit Trail** - Need to track who did what
   - ✅ Centralized action handler helps
   - 💡 Could add telemetry to ModalGateway binding

### Recommended Hybrid Approach 🎯

**Keep our architecture, fix the fault line:**

1. **Phase 1: Fix Hooks Violation** (IMMEDIATE)
   - Pure `getActionDescriptors()` in adapters
   - All hooks in ModalGateway top level
   - Bind descriptors to handlers in gateway
   - Add `key={${entityType}:${entityId}}`

2. **Phase 2: Add Refinements** (SHORT TERM)
   - Typed `EntityActionKey` union
   - `closeOnSuccess` in descriptors
   - Loading state per action
   - Replace window.confirm with ConfirmModal

3. **Phase 3: Optimize** (FUTURE)
   - Lazy load modal components
   - Add telemetry/audit trail
   - Consider Zustand if re-renders become issue

4. **Phase 4: Hybrid Registry** (IF NEEDED)
   - Keep entity registry for business modals
   - Add `modalService.open()` for one-offs (Welcome, Tour, etc.)
   - Both can coexist

**Why NOT switch to nice-modal-react:**
- Our entity-centric pattern fits CKS domain better
- RBAC integration already built
- Migration would be risky mid-implementation
- We can adopt their ideas (lazy loading, stacking) incrementally

---

## Decision

### ✅ PROCEED WITH PROPOSED FIX

**Rationale:**
1. **Industry-validated pattern** - Context + Provider matches all sources
2. **Unique requirements justify custom solution** - Heavy RBAC, business entities
3. **Fix is surgical** - Pure adapters solves hooks violation
4. **Incremental improvement path** - Can adopt nice-modal ideas later
5. **GPT-5 validated approach** - Confirms our proposed fix is correct

**Implementation:**
- Follow GPT-5's POC plan (reports first)
- Use descriptor pattern exactly as proposed
- Add refinements from GPT-5's suggestions
- Document pattern for future devs

**Success Criteria:**
- ✅ No hooks violations
- ✅ Report modals open from AdminHub directory
- ✅ Archive/restore/delete work
- ✅ Activity feed shows all items
- ✅ Type-safe, testable, maintainable

---

## References

- **Gemini Analysis:** `docs/GEMINI'S OPINION.txt`
- **GPT-5 Assessment:** `docs/GPT5'S ASSESSMENT.txt`
- **Reddit Research:** `docs/reddit research on modals.txt`
- **nice-modal-react:** https://github.com/eBay/nice-modal-react
- **eBay Article:** https://innovation.ebayinc.com/stories/rethink-modals-management-in-react/
- **HeadlessUI:** https://headlessui.com/react/dialog
