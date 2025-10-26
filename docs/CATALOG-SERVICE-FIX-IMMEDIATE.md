# CatalogService Modal Fix - Immediate Solution

## Root Cause Identified ✅

The tabs and sections are being filtered out by RBAC policies because they're not in the allowlists.

### Tab Policy Issue

**File:** `apps/frontend/src/policies/tabs.ts`

**Problem:** The `canSeeTab()` function (lines 22-135) has a whitelist of allowed tab IDs:
- ✅ 'details' - allowed (line 29)
- ✅ 'overview' - allowed (line 30)
- ❌ 'quick-actions' - **NOT IN WHITELIST**
- Default case (line 131-133): **returns false** for unknown tabs

**Result:** "quick-actions" tab is hidden

### Section Policy Issue

**File:** `apps/frontend/src/policies/sections.ts`

**Problem:** The `SectionId` type (lines 18-39) defines allowed section IDs:
- ✅ 'description' - allowed (line 32)
- ❌ 'service-info' - **NOT IN TYPE**
- ❌ 'additional-details' - **NOT IN TYPE**
- Default case (line 116-120): **returns false** for unknown sections

**Result:** Only "description" section shows, others hidden

---

## The Fix

### Option 1: Add to Policy Allowlists (Recommended)

**Why:** Keeps custom naming, maintains RBAC control

#### Step 1: Fix Tab Policy

**File:** `apps/frontend/src/policies/tabs.ts`

**Add after line 66 (after 'actions' case):**

```typescript
// ===== QUICK ACTIONS TAB =====
// Admin-only: Catalog service certification management
case 'quick-actions':
  return role === 'admin' && entityType === 'catalogService';
```

#### Step 2: Fix Section Policy - Type Definition

**File:** `apps/frontend/src/policies/sections.ts`

**Add to SectionId type (after line 33, after 'attachments'):**

```typescript
// Catalog Service sections
| 'service-info'
| 'additional-details'
| 'pricing'
```

#### Step 3: Fix Section Policy - Visibility Rules

**File:** `apps/frontend/src/policies/sections.ts`

**Add before the default case (around line 115):**

```typescript
// Catalog Service sections
case 'service-info':
case 'additional-details':
case 'pricing':
  return entityType === 'catalogService';
```

---

### Option 2: Change Adapter to Use Standard IDs

**Why:** Works immediately without policy changes

**Changes needed in:** `apps/frontend/src/config/entityRegistry.tsx`

**Change tab ID:**
```typescript
// Instead of:
{ id: 'quick-actions', label: 'Quick Actions' }

// Use:
{ id: 'actions', label: 'Quick Actions' }  // 'actions' is already allowed
```

**Change section IDs:**
```typescript
// Instead of:
{ id: 'service-info', ... }
{ id: 'additional-details', ... }

// Use:
{ id: 'description', ... }  // Already allowed
// Or create subsections within 'description'
```

**Cons:** Less semantic naming, may conflict with other uses of 'actions' tab

---

## Recommendation

**Use Option 1** - Add to policy allowlists

**Rationale:**
1. Preserves semantic naming ("quick-actions" is clear)
2. Maintains proper RBAC separation
3. Easy to add more catalog-specific tabs/sections later
4. Follows the architecture's intent (adapters define, policies control)

---

## Testing After Fix

1. Open SRV-001 in Admin Directory
2. Should see TWO tabs:
   - "Quick Actions" (admin only)
   - "Details"
3. Details tab should show THREE sections:
   - Service Info (ID, Name, Category, etc.)
   - Description (rich text)
   - Additional Details (Duration, Service Window, Crew)

Console should have:
- ❌ NO "[TabPolicy] Unknown tab" warnings
- ❌ NO "[Section Policy] Unknown section" warnings

---

## Exact Code Changes

### File 1: apps/frontend/src/policies/tabs.ts

**Insert at line 67 (after the 'actions' case):**

```typescript
    // ===== QUICK ACTIONS TAB =====
    // Catalog services: Admin-only certification management
    case 'quick-actions':
      return role === 'admin' && entityType === 'catalogService';
```

### File 2: apps/frontend/src/policies/sections.ts

**Change line 18-39 (SectionId type) - add after 'attachments':**

```typescript
  // Catalog service sections
  | 'service-info'
  | 'additional-details'
  | 'pricing'
```

**Insert at line 115 (before default case):**

```typescript
    // Catalog Service sections (everyone can see)
    case 'service-info':
    case 'additional-details':
    case 'pricing':
      return entityType === 'catalogService';
```

---

## GPT-5 Investigation Prompt

For a detailed investigation prompt to give GPT-5, see:
`docs/gpt5-investigation-prompt.md`

That document includes:
- Full system architecture explanation
- All relevant file paths and line numbers
- Comparison with working user adapters
- Investigation steps and questions
- Expected outputs and success criteria
