# CKS Ecosystem UI Flow Documentation

## Overview
The CKS ecosystem visualization system provides hierarchical network views for all user types, displaying business relationships, network connections, and operational oversight capabilities.

## Related Code Files
- **Ecosystem Components**: `/apps/frontend/src/components/ecosystem/`
- **Hub Interfaces**: `/apps/frontend/src/hubs/`
- **Entity Types**: `/apps/backend/server/domains/profile/types.ts`

## Entity Types & ID Formats

### Manager (MGR)
- **ID Format**: `MGR-XXX` (e.g., `MGR-001`)
- **Purpose**: Territory oversight and business network management
- **Sees**: All contractors, customers, centers, crew in territory

### Contractor (CON)
- **ID Format**: `CON-XXX` (e.g., `CON-023`)
- **Purpose**: Service provider with customer and crew networks
- **Sees**: Own customers, centers, and crew assignments

### Customer (CUS)
- **ID Format**: `CUS-XXX` (e.g., `CUS-098`)
- **Purpose**: Service recipient
- **Sees**: Assigned centers and crew members

### Center (CEN/CTR)
- **ID Format**: `CEN-XXX` or `CTR-XXX` (e.g., `CEN-156`)
- **Purpose**: Service location
- **Sees**: Assigned crew members and customer relationships

### Crew (CRW)
- **ID Format**: `CRW-XXX` (e.g., `CRW-042`)
- **Purpose**: Service delivery team member
- **Sees**: Center assignment and team structure

### Warehouse (WRH)
- **ID Format**: `WRH-XXX` (e.g., `WRH-003`)
- **Purpose**: Inventory and logistics hub
- **Sees**: Service network and delivery relationships

## Hierarchical Display Principles

### Core Rules
1. **Self at Top**: Each role sees themselves as the root node
2. **Role-Based Visibility**: Users only see authorized network connections
3. **Interactive Expansion**: Click to expand/collapse tree branches
4. **Statistical Overview**: Entity counts at each level
5. **Consistent Styling**: Unified visual language across all roles

### Network Relationship Types
- **Management**: Direct oversight and control
- **Service**: Customer-provider relationships
- **Assignment**: Crew-to-center operational assignments
- **Coordination**: Inter-contractor collaboration

## Role-Based Views

### Manager View
```
MGR-001 (You)
├── CON-001 (12 customers, 3 centers, 15 crew)
│   ├── CUS-001
│   ├── CUS-002
│   └── ...
├── CON-002 (8 customers, 2 centers, 10 crew)
└── Statistics: 5 contractors, 45 customers, 12 centers, 52 crew
```

### Contractor View
```
CON-001 (You)
├── Customers (12)
│   ├── CUS-001 (2 centers, 5 crew)
│   └── CUS-002 (1 center, 3 crew)
├── Centers (3)
│   ├── CEN-001 (5 crew)
│   └── CEN-002 (4 crew)
└── Direct Crew (6)
```

### Customer View
```
CUS-001 (You)
├── Service Centers (2)
│   ├── CEN-001 (Downtown)
│   │   ├── CRW-001 (Team Lead)
│   │   └── CRW-002
│   └── CEN-002 (Uptown)
└── Statistics: 2 centers, 8 assigned crew
```

### Center View
```
CEN-001 (You - Downtown Location)
├── Assigned Crew (5)
│   ├── CRW-001 (Team Lead)
│   ├── CRW-002
│   └── ...
├── Customer Relationships (3)
│   ├── CUS-001
│   └── CUS-002
└── Statistics: 5 crew, 3 customers
```

### Crew View
```
CRW-001 (You)
├── Center Assignment: CEN-001 (Downtown)
├── Team Members (4)
│   ├── CRW-002
│   └── ...
└── Customer Assignments: CUS-001, CUS-002
```

### Warehouse View
```
WRH-001 (You)
├── Service Network
│   ├── CON-001 (Active deliveries: 3)
│   ├── CEN-001 (Pending orders: 5)
│   └── CEN-002 (Pending orders: 2)
└── Statistics: 12 active routes, 45 pending deliveries
```

## Visual Specifications

### Node Styling
```css
/* Root Node (Self) */
.node-self {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  padding: 12px 16px;
  border-radius: 8px;
}

/* Entity Nodes */
.node-entity {
  background: white;
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  border-radius: 6px;
}

/* Hover State */
.node-entity:hover {
  border-color: #6366f1;
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.1);
}

/* Collapsed Branch */
.branch-collapsed {
  opacity: 0.7;
}
```

### Color Scheme
- **Primary (Self)**: Purple gradient (#667eea → #764ba2)
- **Contractors**: Blue (#3b82f6)
- **Customers**: Green (#10b981)
- **Centers**: Orange (#f59e0b)
- **Crew**: Teal (#06b6d4)
- **Warehouse**: Gray (#6b7280)

### Tree Lines
- **Default**: 1px solid #e5e7eb
- **Active Branch**: 2px solid #6366f1
- **Hover**: Highlight entire branch path

## Interactive Features

### Expand/Collapse
- Click node to toggle children visibility
- Chevron icon indicates expandable nodes
- Smooth animation (200ms transition)
- Remember expansion state per session

### Node Actions
- **Click Entity ID**: Navigate to entity details
- **Hover**: Show tooltip with quick stats
- **Right-click**: Context menu (future)

### Search & Filter
- Search bar for finding entities
- Filter by entity type
- Filter by status (active/inactive)
- Highlight search matches in tree

## Data Structure

### Tree Node Interface
```typescript
interface EcosystemNode {
  id: string;
  type: 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse';
  name: string;
  stats?: {
    [key: string]: number;
  };
  children?: EcosystemNode[];
  expanded?: boolean;
  metadata?: {
    status: 'active' | 'inactive';
    lastActivity?: string;
    location?: string;
  };
}
```

### API Response Format
```typescript
interface EcosystemResponse {
  root: EcosystemNode;
  totalEntities: number;
  lastUpdated: string;
  permissions: string[];
}
```

## Performance Considerations

### Lazy Loading
- Load immediate children only
- Fetch deeper levels on demand
- Cache expanded branches
- Maximum depth limit: 5 levels

### Large Networks
- Virtualize tree rendering for 100+ nodes
- Paginate children (show first 20, then "Load more")
- Debounce search (300ms)
- Use web workers for filtering large datasets

## Accessibility

### Keyboard Navigation
- Tab: Navigate between nodes
- Enter/Space: Expand/collapse
- Arrow keys: Tree traversal
- Escape: Close tooltips

### Screen Readers
- Proper ARIA labels
- Announce expansion state
- Level indicators
- Relationship descriptions

## Future Enhancements

1. **Admin Role**: System-wide ecosystem administration
2. **Cross-Network View**: See relationships across contractors
3. **Time-based Views**: Historical network changes
4. **Export Features**: PDF/Excel network reports
5. **Mobile Optimization**: Touch-friendly tree navigation
6. **Real-time Updates**: WebSocket-based live changes
7. **Advanced Analytics**: Network health metrics

---

*Last Updated: 2025-09-28*
*Version: 2.0 - Consolidated from multiple sources*