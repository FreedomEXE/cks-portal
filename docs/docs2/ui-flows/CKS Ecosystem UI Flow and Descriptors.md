# CKS Ecosystem UI Flow and Descriptors

**Document Version:** 1.0
**Last Updated:** December 09, 2025
**Purpose:** Comprehensive specification for CKS ecosystem visualization system architecture, UI flows, and business logic

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Entity Types & Structure](#entity-types--structure)
3. [User Roles & Visibility](#user-roles--visibility)
4. [Ecosystem Hierarchy](#ecosystem-hierarchy)
5. [UI Layout & Functionality](#ui-layout--functionality)
6. [Entity ID Structure](#entity-id-structure)
7. [Cross-Role Ecosystem Views](#cross-role-ecosystem-views)
8. [Business Relationships](#business-relationships)
9. [Technical Implementation](#technical-implementation)
10. [Visual Specifications](#visual-specifications)

---

## System Overview

The CKS ecosystem visualization system provides hierarchical network views for six primary user types, displaying business relationships, network connections, and operational oversight capabilities:
- **Managers** - Territory-wide oversight, view entire business network under management
- **Contractors** - Business network view showing customers, service centers, and crew assignments
- **Customers** - Service network view showing assigned centers and crew members
- **Centers** - Operational view showing assigned crew members and customer relationships
- **Crews** - Limited view showing center assignment and team structure
- **Warehouses** - Operational view showing service network and delivery relationships

*Note: Admin role will be added in future iterations for system-wide ecosystem administration*

### Core Principles
1. **Hierarchical Display**: Each role sees themselves at the top, then their subordinates/relationships
2. **Role-Based Visibility**: Users see only network connections they're authorized to view
3. **Interactive Expansion**: Clickable tree structure for exploring network depth
4. **Statistical Overview**: Entity counts and relationship statistics at each level
5. **Consistent Styling**: Unified visual language across all role implementations

### Network Relationship Types
- **Management**: Direct oversight and operational control
- **Service**: Customer-provider relationships
- **Assignment**: Crew-to-center operational assignments
- **Coordination**: Inter-contractor collaboration and resource sharing

---

## Entity Types & Structure

### 1. Manager (MGR)
**Purpose:** Territory oversight and business network management
**ID Format:** `MGR-[XXX]`
**Examples:** `MGR-001`, `MGR-045`

**Key Fields:**
- `manager_id`: Unique identifier
- `name`: Manager name and title
- `territory`: Geographic or operational territory
- `stats`: { contractors, customers, centers, crew }
- `children`: Array of managed contractors

### 2. Contractor (CON)
**Purpose:** Service provider with customer and crew networks
**ID Format:** `CON-[XXX]`
**Examples:** `CON-001`, `CON-023`

**Key Fields:**
- `contractor_id`: Unique identifier
- `name`: Business name
- `type`: Service specialization
- `stats`: { customers, centers, crew }
- `children`: Array of customers and direct crew

### 3. Customer (CUS)
**Purpose:** Service recipient with center and crew assignments
**ID Format:** `CUS-[XXX]`
**Examples:** `CUS-001`, `CUS-098`

**Key Fields:**
- `customer_id`: Unique identifier
- `name`: Business or individual name
- `type`: Customer category
- `stats`: { centers, crew }
- `children`: Array of service centers

### 4. Center (CTR)
**Purpose:** Service location with assigned crew members
**ID Format:** `CEN-[XXX]`
**Examples:** `CEN-001`, `CEN-156`

**Key Fields:**
- `center_id`: Unique identifier
- `name`: Location name and address
- `type`: Facility type
- `stats`: { crew }
- `children`: Array of assigned crew members

### 5. Crew (CRW)
**Purpose:** Individual service personnel
**ID Format:** `CRW-[XXX]`
**Examples:** `CRW-001`, `CRW-234`

**Key Fields:**
- `crew_id`: Unique identifier
- `name`: Person name and role/specialization
- `type`: crew
- `stats`: null (leaf node)
- `children`: null (no subordinates)

---

## User Roles & Visibility

### Manager Ecosystem View
**Root Entity:** Manager (themselves)
**Can View:**
- Complete territory network: ✅
- All contractors under management: ✅
- All customers in territory: ✅
- All service centers: ✅
- All crew assignments: ✅

**Network Depth:** 5 levels (Manager → Contractor → Customer → Center → Crew)
**Auto-Expand:** Manager root level on load
**Statistical Overview:** Territory-wide counts at each level

### Contractor Ecosystem View
**Root Entity:** Contractor (themselves)
**Can View:**
- Own business network: ✅
- Direct customers: ✅
- Customer service centers: ✅
- Assigned crew members: ✅
- Cross-customer crew assignments: ✅

**Network Depth:** 4 levels (Contractor → Customer → Center → Crew)
**Auto-Expand:** Contractor root level on load
**Statistical Overview:** Business network counts

### Customer Ecosystem View
**Root Entity:** Customer (themselves)
**Can View:**
- Own service network: ✅
- Assigned service centers: ✅
- Center crew assignments: ✅

**Network Depth:** 3 levels (Customer → Center → Crew)
**Auto-Expand:** Customer root level on load
**Statistical Overview:** Service assignment counts

### Center Ecosystem View
**Root Entity:** Center (themselves)
**Can View:**
- Own operational network: ✅
- Assigned crew members: ✅
- Crew roles and specializations: ✅

**Network Depth:** 2 levels (Center → Crew)
**Auto-Expand:** Center root level on load
**Statistical Overview:** Crew assignment counts

### Crew Ecosystem View
**Root Entity:** Crew (themselves)
**Can View:**
- Own assignment information: ✅
- Center assignment: ✅
- Team structure (limited): ✅

**Network Depth:** 1-2 levels (Crew, possibly team members)
**Auto-Expand:** None (minimal hierarchy)
**Statistical Overview:** Personal assignment info

### Warehouse Ecosystem View
**Root Entity:** Warehouse (themselves)
**Can View:**
- Service network for deliveries: ✅
- Associated centers and locations: ✅
- Delivery route assignments: ✅

**Network Depth:** 3 levels (Warehouse → Customer/Center → Crew)
**Auto-Expand:** Warehouse root level on load
**Statistical Overview:** Operational network counts

---

## Ecosystem Hierarchy

### Business Network Structure
```
Manager (MGR-001)
├── Contractor (CON-001)
│   ├── Customer (CUS-001)
│   │   ├── Center (CTR-001)
│   │   │   ├── Crew (CRW-001)
│   │   │   └── Crew (CRW-002)
│   │   └── Center (CTR-002)
│   │       └── Crew (CRW-003)
│   └── Customer (CUS-002)
│       └── Center (CTR-003)
│           └── Crew (CRW-004)
├── Contractor (CON-002)
│   └── Customer (CUS-003)
│       └── Center (CTR-004)
│           ├── Crew (CRW-005)
│           └── Crew (CRW-006)
└── Contractor (CON-003)
    ├── Crew (CRW-007) [Direct Assignment]
    └── Crew (CRW-008) [Direct Assignment]
```

### Hierarchy Rules
1. **Managers** oversee multiple contractors within their territory
2. **Contractors** serve multiple customers and may have direct crew assignments
3. **Customers** have multiple service centers
4. **Centers** have multiple assigned crew members
5. **Crew** members are assigned to specific centers (leaf nodes)
6. **Warehouses** serve multiple customers and centers for deliveries

---

## UI Layout & Functionality

### Header Section
- **Title:** "Ecosystem" (consistent across all roles)
- **Subtitle:** Role-specific description
  - Manager: "Your Territory Overview"
  - Contractor: "Your Business Network Overview"
  - Customer: "Your Business Network Overview"
  - Center: "Your Facility Network Overview"
  - Crew: "Your Assignment Overview"

### Tree Structure Display
- **Expansion Controls:** Arrow indicators (▶ collapsed, ▼ expanded)
- **Entity Cards:** Consistent styling with badges and statistics
- **Indentation:** 20px per level for visual hierarchy
- **Hover Effects:** Subtle background change on expandable items

### Entity Card Components
1. **Expansion Arrow:** Left-aligned, 16px width
2. **Type Badge:** Colored background with 3-letter abbreviation
3. **Entity ID:** Bold, black text
4. **Entity Name:** Gray text with em-dash separator
5. **Statistics Badges:** Right-aligned counts (customers, centers, crew)

### Interactive Features
- **Click to Expand/Collapse:** Any card with children
- **Auto-Expand:** Root level entity on page load
- **Persistent State:** Expansion state maintained during session
- **Statistics Display:** Real-time counts at each level

### Footer Legend
- **Color Indicators:** Small squares showing type colors
- **Entity Types:** Manager, Contractor, Customer, Service Center, Crew Member
- **Consistent Positioning:** Bottom of card with gray background

---

## Entity ID Structure

### ID Format Standards
- **Consistent Pattern:** `[TYPE]-[NUMBER]`
- **Type Prefixes:** MGR, CON, CUS, CTR, CRW
- **Number Format:** Zero-padded 3-digit numbers
- **Examples:** MGR-001, CON-045, CUS-123, CTR-007, CRW-234

### ID Assignment Rules
1. **Sequential Assignment:** Numbers assigned in creation order
2. **No Reuse:** Deleted entities don't free up numbers
3. **Type-Specific Sequences:** Each entity type has independent numbering
4. **Visible in UI:** Always displayed prominently in entity cards

### ID Evolution
- **V1.0:** Current 3-digit format
- **Future:** May expand to 4+ digits as system scales
- **Consistency:** Format maintained across all role interfaces

---

## Cross-Role Ecosystem Views

### Manager → Contractor Navigation
- **Action:** Click contractor entity card
- **Result:** Navigate to contractor hub ecosystem view
- **Context:** Shows contractor's customer/crew network
- **Return Path:** Browser back or hub navigation

### Contractor → Customer Visibility
- **Access:** View customer service networks through expansion
- **Details:** Center assignments and crew allocations
- **Permissions:** Read-only view of customer operations
- **Limitations:** Cannot modify customer assignments

### Customer → Center Relationships
- **Display:** All service centers under customer control
- **Information:** Crew assignments, operational status
- **Interaction:** Expand to view individual crew members
- **Management:** Customer can see but not modify assignments

### Center → Crew Assignments
- **View:** Complete crew roster for the center
- **Details:** Individual names, roles, specializations
- **Hierarchy:** Final level in most ecosystem views
- **Status:** Active assignments and availability

---

## Business Relationships

### Management Relationships
- **Manager → Contractor:** Oversight and performance management
- **Contractor → Customer:** Service provider relationship
- **Customer → Center:** Location-based service agreements
- **Center → Crew:** Operational work assignments

### Service Relationships
- **Contractor → Crew:** Direct employment (some cases)
- **Customer → Crew:** Service recipient relationship
- **Center → Customer:** Location serves customer needs
- **Warehouse → Center:** Delivery and supply relationships

### Network Effects
1. **Multi-Path Connections:** Crew may serve multiple centers
2. **Cross-Contractor Relationships:** Shared resources and coordination
3. **Customer Portability:** Centers may serve multiple customers
4. **Geographic Clustering:** Network optimization for efficiency

---

## Technical Implementation

### Data Structure
```typescript
interface EcosystemNode {
  id: string;                    // Entity ID (MGR-001, CON-001, etc.)
  name: string;                  // Display name
  type: NodeType;                // Entity type
  stats?: {                      // Statistical counts
    contractors?: number;
    customers?: number;
    centers?: number;
    crew?: number;
  };
  children?: EcosystemNode[];    // Hierarchical children
}

type NodeType = 'manager' | 'contractor' | 'customer' | 'center' | 'crew';
```

### API Endpoints
- **GET /api/[role]/ecosystem** - Fetch role-specific ecosystem data
- **Response Format:** Array of EcosystemNode objects
- **Authentication:** Role-based access control
- **Caching:** Client-side for session duration

### State Management
```typescript
const [ecosystem, setEcosystem] = useState<EcosystemNode[]>([]);
const [expanded, setExpanded] = useState<Set<string>>(new Set());
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### Error Handling
- **API Failures:** Graceful fallback to mock data
- **Network Issues:** Retry logic and offline indicators
- **Data Validation:** Type checking and structure validation
- **User Feedback:** Clear error messages and recovery options

---

## Visual Specifications

### Color Scheme
```css
Manager:    #dbeafe (Light Blue)
Contractor: #dcfce7 (Light Green)
Customer:   #fef9c3 (Light Yellow)
Center:     #ffedd5 (Light Orange)
Crew:       #fee2e2 (Light Red)
```

### Typography
- **Entity ID:** Bold, 14px, #111827 (Dark Gray)
- **Entity Name:** Regular, 14px, #6b7280 (Medium Gray)
- **Type Badge:** Bold, 10px, uppercase, #111827
- **Statistics:** Regular, 11px, #111827

### Spacing
- **Card Padding:** 12px all sides
- **Card Margin:** 4px bottom
- **Indentation:** 20px per level
- **Gap Between Elements:** 8px
- **Border Radius:** 8px for cards, 6px for badges

### Interactive States
- **Default:** White background, #e5e7eb border
- **Hover:** #f9fafb background (expandable items only)
- **Expanded:** Maintains styling consistency
- **Loading:** Centered spinner with descriptive text

### Responsive Design
- **Minimum Width:** 320px (mobile)
- **Flexible Layout:** Adjusts to container width
- **Text Wrapping:** Entity names wrap on narrow screens
- **Statistics:** Stack vertically on small screens

### Accessibility
- **ARIA Labels:** Descriptive labels for screen readers
- **Keyboard Navigation:** Tab through expandable items
- **Focus Indicators:** Clear focus states for keyboard users
- **Color Contrast:** Meets WCAG 2.1 AA standards

---

## Business Rules

### Visibility Rules
1. **Hierarchical Access:** Users see only their network and below
2. **Role-Based Filtering:** Data filtered by user permissions
3. **Context Awareness:** Statistics reflect user's scope of access
4. **Real-Time Updates:** Ecosystem reflects current assignments

### Expansion Rules
1. **Auto-Expand Root:** User's own entity expanded on load
2. **Manual Expansion:** All other levels require user action
3. **Persistent State:** Expansion state maintained in session
4. **Performance Limits:** Deep trees may have expansion limits

### Statistical Accuracy
1. **Real-Time Counts:** Statistics update with network changes
2. **Scope-Appropriate:** Counts reflect user's visibility scope
3. **Hierarchical Totals:** Parent counts include all descendants
4. **Zero Handling:** Empty categories hidden from statistics

### Error Handling
1. **Graceful Degradation:** Mock data when API unavailable
2. **Partial Loading:** Display available data if some fails
3. **User Feedback:** Clear indicators for loading and errors
4. **Recovery Options:** Retry mechanisms for failed requests

---

## Future Enhancements

### Planned Features
1. **Search Functionality:** Filter ecosystem by entity name or type
2. **Export Options:** Download ecosystem structure as PDF/CSV
3. **Historical View:** See ecosystem changes over time
4. **Performance Metrics:** Integration with operational statistics
5. **Mobile App Integration:** Native mobile ecosystem viewing

### Technical Improvements
1. **Lazy Loading:** Load child nodes on demand for large networks
2. **Caching Strategy:** Intelligent caching for frequently accessed data
3. **Real-Time Updates:** WebSocket integration for live network changes
4. **Offline Support:** Local storage for basic ecosystem viewing

### User Experience Enhancements
1. **Quick Actions:** Context menus for common operations
2. **Detailed Views:** Modal overlays with detailed entity information
3. **Network Visualization:** Optional graph view for complex relationships
4. **Customization:** User preferences for default expansion levels

---

## Conclusion

The CKS Ecosystem visualization system provides a comprehensive, role-based view of business network relationships. Through consistent UI patterns, hierarchical data display, and role-appropriate visibility controls, users can effectively understand and navigate their operational ecosystem. The system supports both operational oversight and day-to-day workflow requirements while maintaining security and access control appropriate to each user role.

This specification serves as the foundation for implementation, testing, and future enhancements of the ecosystem visualization feature across all CKS hub interfaces.
