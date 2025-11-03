# Response to GPT-5: Proceed with Documentation

## Instruction

**Yes, proceed with creating `docs/architecture/activity-feed-system.md` now.**

You have sufficient information to create comprehensive documentation. Address the uncertainties as follows:

### 1. UI Color Tokens
The color tokens are defined in `packages/domain-widgets/src/activity/RecentActivity/ActivityItem.tsx:14-51`:

```typescript
const roleColors: Record<string, { bg: string; text: string }> = {
  admin: { bg: '#f3f4f6', text: '#111827' },      // Light gray / Black
  manager: { bg: '#eff6ff', text: '#1e40af' },    // Light blue / Dark blue
  contractor: { bg: '#ecfdf5', text: '#065f46' }, // Light green / Dark green
  customer: { bg: '#fef3c7', text: '#78350f' },   // Light yellow / Dark yellow/brown
  center: { bg: '#fef2e8', text: '#7c2d12' },     // Light orange / Dark orange
  crew: { bg: '#fee2e2', text: '#991b1b' },       // Light red / Dark red
  warehouse: { bg: '#fae8ff', text: '#581c87' },  // Light purple / Dark purple
  system: { bg: '#e0e7ff', text: '#3730a3' },     // Light indigo / Dark indigo
  default: { bg: '#f9fafb', text: '#374151' },    // Light gray / Dark gray
};
```

The `actorRole` determines which color scheme is applied to the activity card background and text.

### 2. Additional Activity Writers

Check these files for more `recordActivity` examples:
- `apps/backend/server/domains/orders/store.ts` - order_created, order_delivered, etc.
- `apps/backend/server/domains/catalog/routes.fastify.ts` - catalog_service_certified, catalog_service_decertified
- `apps/backend/server/domains/archive/store.ts` - *_archived, *_deleted, *_restored activities
- `apps/backend/server/domains/assignments/store.ts` - assignment activities
- `apps/backend/server/domains/inventory/store.ts` - product_inventory_adjusted
- `apps/backend/server/domains/provisioning/store.ts` - creation activities (manager_created, contractor_created, etc.)

### 3. Key Points to Include in Documentation

1. **Activity descriptions should NOT include IDs** - The CTO specifically stated IDs don't need to be in messages because actor information shows who performed the action

2. **Role-based color coding creates visual association** - The colored card background indicates the actor's role without needing to explicitly prefix the description with "Admin" or "Crew"

3. **Personalization is viewer-based** - Same activity shows different descriptions to different viewers (e.g., "Certified you for SRV-001" vs "Certified MGR-012 for SRV-001")

4. **Current personalization is limited** - Only certifications, catalog/product creations, and inventory adjustments are personalized. Consider whether order_created and other activities should be personalized too.

### 4. Documentation Structure

Follow the structure outlined in the original prompt:

1. **System Overview** - Architecture and lifecycle
2. **Activity Creation** - Format, fields, best practices
3. **Personalization Rules** - What gets personalized and how
4. **Role-Based Visibility** - Matrix of who sees what
5. **Frontend Display** - Color coding, card structure, routing
6. **Adding New Activity Types** - Step-by-step guide
7. **Examples & Patterns** - Real-world examples with code

### 5. Priority

Focus on creating a **reference document** that prevents future sessions from needing to re-explain:
- How activities are structured
- Where personalization happens
- Why color coding is used instead of text prefixes
- How to add new activity types consistently

## Proceed

Create the documentation now. Don't worry about being 100% complete - we can iterate and add more details in future sessions. The goal is to capture the core architecture and patterns so this knowledge isn't lost.
