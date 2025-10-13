# View Modals Implementation Plan

## Current State

### Existing Modals
1. **ProductOrderModal** - Product order details (requestor, destination, line items, status)
2. **ServiceOrderModal** - Service order details (requestor, location, availability, status)
3. **OrderDetailsModal** - Generic fallback for orders
4. **ServiceViewModal** - Active service details (crew, procedures, training, products, actions)

### Modal Reuse Strategy
- ✅ Active Services → Use existing `ServiceViewModal`
- ✅ Pending/Completed Deliveries → Use existing `ProductOrderModal`
- 🆕 Product Catalog/Inventory → Need new `ProductCatalogModal`
- 🆕 Service Catalog ("My Services") → Need new `ServiceCatalogModal`
- 🆕 Service History → Need new `ServiceHistoryModal`

---

## MVP Implementation Plan

### Phase 1: Immediate (Current Sprint)
**Hook up existing modals to missing sections**

#### Warehouse Hub
- **Deliveries Tab - Pending Deliveries** ✅
  - Modal: `ProductOrderModal` (already exists)
  - Action: Add `onRowClick` handler (line 938)
  - Data: Use existing `orders` data

- **Deliveries Tab - Completed Deliveries** ✅
  - Modal: `ProductOrderModal` (already exists)
  - Action: Add `onRowClick` handler (line 985)
  - Data: Use existing `orders` data

### Phase 2: Create Catalog Modals (1-2 days)
**Simple read-only modals for catalog items**

#### New Modal: `ProductCatalogModal`
**Purpose:** Display product catalog information

**Props:**
```typescript
interface ProductCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    productId: string;
    name: string;
    description: string | null;
    category: string | null;
    unitOfMeasure: string | null;
    minimumOrderQuantity: number | null;
    leadTimeDays: number | null;
    status: string;
    metadata?: any;
  } | null;
}
```

**Sections:**
- Product Information (code, name, description, category)
- Ordering Details (unit, minimum order, lead time)
- Status Badge (active, discontinued, out of stock)
- Metadata (any additional product specs)

**Used In:**
- Warehouse Hub → Inventory Tab → Product Inventory
- Warehouse Hub → Inventory Tab → Archive
- Catalog → Products

---

#### New Modal: `ServiceCatalogModal`
**Purpose:** Display service catalog information

**Props:**
```typescript
interface ServiceCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    serviceId: string;
    name: string;
    description: string | null;
    category: string | null;
    estimatedDuration: string | null;
    requirements: string[] | null;
    status: string;
    metadata?: any;
  } | null;
  // Optional: show user-specific certification info
  userCertification?: {
    certified: boolean;
    certificationDate: string | null;
    expiryDate: string | null;
    trainingCompleted: boolean;
  } | null;
}
```

**Sections:**
- Service Information (code, name, description, category)
- Service Details (duration, requirements)
- Status Badge (active, discontinued)
- Certification Info (if applicable - show user's cert status)
- Metadata (any additional service specs)

**Used In:**
- Crew Hub → Services Tab → My Services
- Warehouse Hub → Services Tab → My Services
- Contractor Hub → Services Tab → My Services
- Manager Hub → Services Tab → My Services
- Catalog → Services

---

#### New Modal: `ServiceHistoryModal`
**Purpose:** Display completed/cancelled service details (read-only historical view)

**Props:**
```typescript
interface ServiceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    serviceId: string;
    serviceName: string;
    centerId: string;
    centerName: string | null;
    type: 'one-time' | 'recurring';
    status: 'completed' | 'cancelled';
    startDate: string | null;
    endDate: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    cancellationReason: string | null;
    completionNotes: string | null;
    managedBy: string | null;
    crew: Array<{ code: string; name: string }>;
    procedures: string[];
    training: string[];
    productOrdersCount: number;
  } | null;
}
```

**Sections:**
- Service Summary (ID, name, type, status)
- Timeline (start date, end date, completion/cancellation date)
- Location (center info)
- Team (crew members who worked on it)
- Procedures & Training (what was used)
- Completion/Cancellation Details (notes, reason)
- Related Product Orders (count, link to view)

**Used In:**
- Crew Hub → Services Tab → Service History
- Center Hub → Services Tab → Service History
- Customer Hub → Services Tab → Service History
- Contractor Hub → Services Tab → Service History
- Manager Hub → Services Tab → Service History
- Warehouse Hub → Services Tab → Service History

---

### Phase 3: Wire Up Modals to Hub Sections (2-3 days)

#### Warehouse Hub

**Inventory Tab - Product Inventory**
```typescript
const [selectedProduct, setSelectedProduct] = useState<any>(null);

// In DataTable
onRowClick={(row) => {
  // Fetch full product details from catalog
  setSelectedProduct(row);
}}

// Render modal
<ProductCatalogModal
  isOpen={!!selectedProduct}
  onClose={() => setSelectedProduct(null)}
  product={selectedProduct}
/>
```

**Inventory Tab - Archive**
```typescript
// Same as Product Inventory, reuse ProductCatalogModal
```

**Services Tab - My Services**
```typescript
const [selectedService, setSelectedService] = useState<any>(null);

// In DataTable
onRowClick={(row) => {
  setSelectedService(row);
}}

// Render modal
<ServiceCatalogModal
  isOpen={!!selectedService}
  onClose={() => setSelectedService(null)}
  service={selectedService}
/>
```

**Services Tab - Active Services**
```typescript
// Already implemented - uses ServiceViewModal
// No changes needed ✅
```

**Services Tab - Service History**
```typescript
const [selectedHistoryService, setSelectedHistoryService] = useState<any>(null);

// In DataTable
onRowClick={(row) => {
  // Fetch full service history details
  setSelectedHistoryService(row);
}}

// Render modal
<ServiceHistoryModal
  isOpen={!!selectedHistoryService}
  onClose={() => setSelectedHistoryService(null)}
  service={selectedHistoryService}
/>
```

**Deliveries Tab - Pending/Completed**
```typescript
// Add onRowClick handlers (see Phase 1)
// Uses existing ProductOrderModal ✅
```

---

#### Crew Hub

**Services Tab - My Services**
```typescript
<ServiceCatalogModal
  isOpen={!!selectedService}
  onClose={() => setSelectedService(null)}
  service={selectedService}
  userCertification={{
    certified: true,
    certificationDate: '2024-01-15',
    expiryDate: '2026-01-15',
    trainingCompleted: true
  }}
/>
```

**Services Tab - Active Services**
```typescript
// Uses existing ServiceViewModal ✅
```

**Services Tab - Service History**
```typescript
<ServiceHistoryModal
  isOpen={!!selectedHistoryService}
  onClose={() => setSelectedHistoryService(null)}
  service={selectedHistoryService}
/>
```

---

#### Center Hub

**Services Tab - Active Services**
```typescript
// Uses existing ServiceViewModal ✅
```

**Services Tab - Service History**
```typescript
<ServiceHistoryModal
  isOpen={!!selectedHistoryService}
  onClose={() => setSelectedHistoryService(null)}
  service={selectedHistoryService}
/>
```

---

#### Customer Hub

**Services Tab - My Services → Change to "Active Services"**
```typescript
// CHANGE HEADER: "My Services" → "Active Services"
// Uses existing ServiceViewModal ✅
```

**Services Tab - Service History**
```typescript
<ServiceHistoryModal
  isOpen={!!selectedHistoryService}
  onClose={() => setSelectedHistoryService(null)}
  service={selectedHistoryService}
/>
```

---

#### Contractor Hub

**Services Tab - My Services**
```typescript
<ServiceCatalogModal
  isOpen={!!selectedService}
  onClose={() => setSelectedService(null)}
  service={selectedService}
/>
```

**Services Tab - Active Services**
```typescript
// Uses existing ServiceViewModal ✅
```

**Services Tab - Service History**
```typescript
<ServiceHistoryModal
  isOpen={!!selectedHistoryService}
  onClose={() => setSelectedHistoryService(null)}
  service={selectedHistoryService}
/>
```

---

#### Manager Hub

**Services Tab - My Services**
```typescript
<ServiceCatalogModal
  isOpen={!!selectedService}
  onClose={() => setSelectedService(null)}
  service={selectedService}
  userCertification={{
    certified: true,
    certificationDate: '2023-05-10',
    expiryDate: null, // Managers may not have expiry
    trainingCompleted: true
  }}
/>
```

**Services Tab - Active Services**
```typescript
// Already implemented - uses ServiceViewModal
// Has advanced editing capabilities ✅
```

**Services Tab - Service History**
```typescript
<ServiceHistoryModal
  isOpen={!!selectedHistoryService}
  onClose={() => setSelectedHistoryService(null)}
  service={selectedHistoryService}
/>
```

---

#### Catalog

**Products**
```typescript
<ProductCatalogModal
  isOpen={!!selectedProduct}
  onClose={() => setSelectedProduct(null)}
  product={selectedProduct}
/>
```

**Services**
```typescript
<ServiceCatalogModal
  isOpen={!!selectedService}
  onClose={() => setSelectedService(null)}
  service={selectedService}
/>
```

---

## Modal Summary

### Existing Modals (Reuse) ✅
| Modal | Used For | Hubs |
|-------|----------|------|
| `ServiceViewModal` | Active Services | All hubs (6) |
| `ProductOrderModal` | Pending/Completed Deliveries | Warehouse Hub |

### New Modals (Create) 🆕
| Modal | Used For | Hubs | Complexity |
|-------|----------|------|------------|
| `ProductCatalogModal` | Product Inventory, Archive, Catalog Products | Warehouse Hub, Catalog | Low |
| `ServiceCatalogModal` | My Services (catalog services) | Crew, Contractor, Manager, Warehouse Hubs, Catalog | Low |
| `ServiceHistoryModal` | Service History (completed/cancelled) | All hubs (6) | Medium |

**Total New Modals: 3**

---

## Implementation Effort Estimate

### Phase 1: Hook Up Existing Modals
**Effort:** 1-2 hours
- Add `onRowClick` handlers for pending/completed deliveries
- Test modal opens with correct data
- Fix Customer Hub "My Services" → "Active Services" header

### Phase 2: Create New Modals
**Effort:** 1-2 days

**ProductCatalogModal** - 3-4 hours
- Create modal structure
- Add product information sections
- Add status badge
- Test with catalog data

**ServiceCatalogModal** - 4-5 hours
- Create modal structure
- Add service information sections
- Add optional certification info
- Add status badge
- Test with catalog data

**ServiceHistoryModal** - 6-8 hours
- Create modal structure
- Add service summary, timeline, team sections
- Add completion/cancellation details
- Handle different statuses (completed vs cancelled)
- Test with historical service data

### Phase 3: Wire Up to All Hubs
**Effort:** 2-3 days
- Add state management to each hub
- Add onRowClick handlers to DataTables
- Fetch additional data if needed
- Render modals
- Test across all 6 hubs

**Total MVP Effort: 3-5 days**

---

## Technical Debt Considerations

### Current Approach: Separate Modals
**Pros:**
- ✅ Clear separation of concerns
- ✅ Type-safe props for each domain
- ✅ Easy to reason about
- ✅ Can ship MVP quickly

**Cons:**
- ⚠️ Duplicated UI patterns (header, footer, grids)
- ⚠️ Changes to common elements require editing multiple files
- ⚠️ ~70-80% code overlap between modals

### Post-MVP Refactor (Documented in POST_MVP_RECOMMENDATIONS.md #25)
**Component Composition Approach:**
```
packages/ui/src/
├── components/
│   ├── StatusBadge/          # Reusable status display
│   ├── DateDisplay/          # Standardized date formatting
│   ├── ContactInfoGrid/      # Contact info section
│   ├── ModalHeader/          # Standard modal header
│   └── ModalFooter/          # Standard modal footer
│
├── modals/
│   ├── ProductCatalogModal/   # Composes shared components
│   ├── ServiceCatalogModal/   # Composes shared components
│   ├── ServiceHistoryModal/   # Composes shared components
│   └── ... (existing modals)
```

**When to Refactor:**
- After MVP launch and stabilization
- When making the same change across 3+ modals frequently
- When adding 3+ more modals with similar structure
- During UX consistency pass (see POST_MVP #25)

---

## Testing Checklist

### Phase 1: Existing Modals
- [ ] Warehouse Hub - Pending Deliveries opens ProductOrderModal
- [ ] Warehouse Hub - Completed Deliveries opens ProductOrderModal
- [ ] Customer Hub - "My Services" renamed to "Active Services"
- [ ] Customer Hub - Active Services opens ServiceViewModal

### Phase 2: New Modals
- [ ] ProductCatalogModal displays product info correctly
- [ ] ServiceCatalogModal displays service info correctly
- [ ] ServiceCatalogModal shows certification info when provided
- [ ] ServiceHistoryModal displays completed service info
- [ ] ServiceHistoryModal displays cancelled service info

### Phase 3: Hub Integration
- [ ] Warehouse Hub - Product Inventory opens ProductCatalogModal
- [ ] Warehouse Hub - Archive opens ProductCatalogModal
- [ ] Warehouse Hub - My Services opens ServiceCatalogModal
- [ ] Warehouse Hub - Service History opens ServiceHistoryModal
- [ ] Crew Hub - My Services opens ServiceCatalogModal
- [ ] Crew Hub - Service History opens ServiceHistoryModal
- [ ] Center Hub - Service History opens ServiceHistoryModal
- [ ] Customer Hub - Service History opens ServiceHistoryModal
- [ ] Contractor Hub - My Services opens ServiceCatalogModal
- [ ] Contractor Hub - Service History opens ServiceHistoryModal
- [ ] Manager Hub - My Services opens ServiceCatalogModal
- [ ] Manager Hub - Service History opens ServiceHistoryModal
- [ ] Catalog - Products opens ProductCatalogModal
- [ ] Catalog - Services opens ServiceCatalogModal

**Total Test Cases: 21**

---

## Future Enhancements (Post-MVP)

### ProductCatalogModal
- Add "Order This Product" button (opens product order creation)
- Show inventory levels across all warehouses
- Show recent order history for this product
- Add product image gallery
- Show related products

### ServiceCatalogModal
- Add "Request Certification" button
- Show detailed training requirements
- Show crew certified to perform this service
- Add service video/documentation links
- Show average service completion time

### ServiceHistoryModal
- Add delivery photos/proof of completion
- Show service timeline visualization
- Add customer satisfaction rating
- Link to invoices/billing info
- Show crew performance metrics

### Deliveries (ProductOrderModal)
- Add GPS tracking integration (Uber-style)
- Add delivery signature capture
- Add delivery photos
- Show delivery route
- Add delivery notes/feedback

---

## Modal Reuse Matrix

| Section | Modal | Reuse Count |
|---------|-------|-------------|
| Active Services (all hubs) | ServiceViewModal | 6 |
| Service History (all hubs) | ServiceHistoryModal | 6 |
| My Services (crew, contractor, manager, warehouse) | ServiceCatalogModal | 4 |
| Product Inventory/Archive | ProductCatalogModal | 2 |
| Catalog Products | ProductCatalogModal | 1 |
| Catalog Services | ServiceCatalogModal | 1 |
| Pending/Completed Deliveries | ProductOrderModal | 2 |

**Most Reused:** ServiceViewModal (6x), ServiceHistoryModal (6x)
**Good Reuse:** ServiceCatalogModal (5x), ProductCatalogModal (3x), ProductOrderModal (2x)

---

## Decision: Keep Separate Modals for MVP ✅

**Reasoning:**
1. **Speed:** Can ship 3 new modals in 1-2 days vs 1 week for composition refactor
2. **Clarity:** Each modal has clear, type-safe props for its domain
3. **Safety:** No risk of breaking existing order modals during refactor
4. **Documented:** POST_MVP #25 already documents the refactor plan
5. **Reuse:** 5-6x reuse per modal justifies separate implementations

**Next Steps:**
1. Implement Phase 1 (hook up existing modals) - 1-2 hours
2. Implement Phase 2 (create 3 new modals) - 1-2 days
3. Implement Phase 3 (wire up to all hubs) - 2-3 days
4. Test all 21 integration points
5. Ship MVP
6. Schedule POST_MVP refactor for component composition

**Total MVP Timeline: 3-5 days**
