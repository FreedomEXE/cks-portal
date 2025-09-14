# Contractor Hub - Skeleton Structure

## Component Architecture

### Page Skeleton
```
ContractorHub
├── Navigation
│   ├── Dashboard
│   ├── MyProfile  
│   ├── MyServices
│   ├── Orders
│   ├── Reports
│   └── Support
├── Content Area
│   ├── Tab Content
│   ├── Loading States
│   └── Error Boundaries
└── Common Elements
    ├── Header
    ├── Footer
    └── Modals
```

### File Structure
```
contractor/
├── config.v1.json                     # Hub configuration
├── index.ts                          # Export barrel
├── api/
│   └── contractor.ts                  # API client
├── types/
│   └── contractor.d.ts               # TypeScript definitions
├── components/
│   └── ContractorRecentActions.tsx   # Recent activity widget
├── hooks/
│   └── useContractorData.ts          # Data management hook
├── utils/
│   ├── contractorApi.ts              # API utilities
│   └── contractorAuth.ts             # Authentication utilities
├── tabs/
│   ├── Dashboard.tsx                 # Main dashboard
│   ├── MyProfile.tsx                # Profile management
│   ├── MyServices.tsx               # Service offerings
│   ├── Orders.tsx                   # Order management
│   ├── Reports.tsx                  # Analytics & reports
│   └── Support.tsx                  # Help & support
└── docs/
    ├── README.md                    # Overview documentation
    ├── UI.md                        # Design guidelines
    ├── UEX.md                       # User experience guide
    ├── Skeleton.md                  # This file
    ├── API.md                       # API documentation
    ├── DataModel.md                 # Data structure guide
    ├── Permissions.md               # Security & access control
    ├── Testing.md                   # Testing guidelines
    └── Changelog.md                 # Version history
```

## Data Flow Architecture

### State Management
```
useContractorData (Primary Hook)
├── Authentication State
├── Profile Data
├── Orders Data
├── Performance Metrics
└── Error Handling
```

### API Integration
```
contractorApi.ts
├── buildContractorApiUrl()
├── contractorApiFetch()
├── Authentication Headers
└── Error Handling
```

### Component Hierarchy
```
Dashboard
├── ContractorRecentActions
├── PerformanceOverview
├── QuickActions
└── UrgentItems

Orders
├── OrdersList
├── OrderFilters  
├── OrderDetails
└── OrderActions

MyServices
├── ServicesCatalog
├── ServiceEditor
├── PricingManager
└── AvailabilityCalendar
```

## Routing Structure

### URL Patterns
- `/CON-XXX/hub` - Dashboard
- `/CON-XXX/hub?tab=profile` - MyProfile
- `/CON-XXX/hub?tab=services` - MyServices  
- `/CON-XXX/hub?tab=orders` - Orders
- `/CON-XXX/hub?tab=reports` - Reports
- `/CON-XXX/hub?tab=support` - Support

### Navigation State
```typescript
interface NavigationState {
  activeTab: string;
  contractorId: string;
  breadcrumbs: string[];
  history: string[];
}
```

## Loading States

### Skeleton Screens
- Dashboard cards with animated placeholders
- Order list with item skeletons
- Profile form with field placeholders
- Chart areas with loading animations

### Progressive Loading
1. Navigation shell loads first
2. Critical data (profile, urgent orders)
3. Secondary data (metrics, history)
4. Auxiliary data (reports, support content)

## Error Boundaries

### Error Handling Hierarchy
```
Hub Level
├── Authentication Errors
├── Authorization Errors
└── Network Errors

Tab Level
├── Data Loading Errors
├── Validation Errors
└── API Errors

Component Level
├── Render Errors
├── State Errors
└── User Input Errors
```

### Fallback Strategies
- Mock data for development
- Cached data for offline
- Graceful degradation for partial failures
- User-friendly error messages

---

*Contractor hub architecture following CKS Portal standards*