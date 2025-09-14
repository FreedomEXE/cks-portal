# Center Hub Skeleton Documentation

## Component Architecture

Structural overview of Center hub components and their relationships.

## Directory Structure

```
src/hub/roles/center/
├── api/
│   └── center.ts                 # API client functions
├── components/
│   └── CenterRecentActions.tsx   # Activity feed widget
├── hooks/
│   └── useCenterData.ts          # Data management hook
├── types/
│   └── center.d.ts               # TypeScript definitions
├── utils/
│   ├── centerApi.ts              # API utilities
│   └── centerAuth.ts             # Authentication utilities
└── docs/
    ├── README.md
    ├── UI.md
    ├── UEX.md
    ├── Skeleton.md
    ├── API.md
    ├── DataModel.md
    ├── Permissions.md
    ├── Testing.md
    └── Changelog.md
```

## Component Hierarchy

### Main Components

```
CenterHub
├── CenterHeader
│   ├── CenterInfo
│   └── QuickActions
├── CenterNavigation
│   ├── NavigationMenu
│   └── UserControls
├── CenterDashboard
│   ├── PerformanceOverview
│   ├── TerritoryMap
│   ├── CenterRecentActions
│   └── QuickStats
├── TerritoryManagement
│   ├── TerritoryList
│   ├── BoundaryEditor
│   └── AssignmentMatrix
├── ContractorManagement
│   ├── ContractorDirectory
│   ├── PerformanceReviews
│   └── TerritoryAssignments
└── ReportsSection
    ├── PerformanceReports
    ├── AnalyticsDashboard
    └── ExportTools
```

## Data Flow Architecture

### Hook Dependencies

```
useCenterData (Primary)
├── centerApi.buildCenterApiUrl()
├── centerApi.centerApiFetch()
├── centerAuth.validateCenterRole()
└── localStorage/sessionStorage

useTerritoryData
├── centerApi.getCenterTerritories()
└── useCenterData (for center context)

useContractorManagement
├── centerApi.getCenterContractors()
└── useCenterData (for center context)

usePerformanceMetrics
├── centerApi.getCenterMetrics()
└── useCenterData (for center context)
```

### API Integration Points

```
API Layer
├── center.ts
│   ├── getCenterProfile()
│   ├── getCenterTerritories()
│   ├── getCenterContractors()
│   ├── getCenterMetrics()
│   └── getCenterActivity()
└── centerApi.ts
    ├── buildCenterApiUrl()
    └── centerApiFetch()
```

## State Management

### Component State Structure

```typescript
// Center Data State
interface CenterDataState {
  loading: boolean;
  error: string | null;
  kind: string;
  data: Center | null;
  _source?: string;
}

// Territory State
interface TerritoryState {
  territories: Territory[];
  selectedTerritory: Territory | null;
  boundaryEdit: boolean;
  assignments: ContractorAssignment[];
}

// Performance State
interface PerformanceState {
  metrics: CenterMetrics | null;
  period: string;
  comparisonData: TerritoryMetrics[];
}
```

### Context Providers

```typescript
// Center Context
interface CenterContextValue {
  centerData: CenterDataState;
  refetchCenter: () => void;
  updateCenter: (data: Partial<Center>) => Promise<void>;
}

// Territory Context
interface TerritoryContextValue {
  territories: Territory[];
  selectedTerritory: Territory | null;
  selectTerritory: (territory: Territory) => void;
  updateTerritory: (id: string, data: Partial<Territory>) => Promise<void>;
}
```

## Component Props Interfaces

### Core Component Props

```typescript
interface CenterComponentProps {
  centerId: string;
  onError?: (error: string) => void;
  onSuccess?: (data: any) => void;
}

interface CenterRecentActionsProps {
  code?: string;
  onError?: (error: string) => void;
}

interface TerritoryMapProps {
  territories: Territory[];
  selectedTerritory?: Territory;
  onTerritorySelect: (territory: Territory) => void;
  editMode?: boolean;
}

interface PerformanceDashboardProps {
  centerId: string;
  period: string;
  onPeriodChange: (period: string) => void;
}
```

## Error Boundaries

### Error Handling Structure

```typescript
// Center Hub Error Boundary
class CenterErrorBoundary extends React.Component {
  // Catches errors in center components
  // Provides fallback UI for center operations
  // Logs errors for debugging
}

// API Error Handler
function handleCenterApiError(error: Error) {
  // Network error handling
  // Authentication error handling  
  // Data validation error handling
  // Fallback to demo data when appropriate
}
```

## Performance Optimizations

### Lazy Loading Strategy

```typescript
// Lazy loaded components
const TerritoryManagement = lazy(() => import('./TerritoryManagement'));
const ContractorManagement = lazy(() => import('./ContractorManagement'));
const ReportsSection = lazy(() => import('./ReportsSection'));

// Code splitting points
// - Territory map visualization
// - Advanced analytics/reports
// - Bulk contractor operations
```

### Memoization Points

```typescript
// Memoized selectors
const selectTerritoryMetrics = useMemo(() => {
  return territories.map(t => calculateMetrics(t));
}, [territories]);

// Memoized components
const MemoizedTerritoryMap = React.memo(TerritoryMap);
const MemoizedPerformanceChart = React.memo(PerformanceChart);
```

## Integration Points

### External System Connections

```
Center Hub
├── Backend API
│   ├── /api/center/* (Center operations)
│   ├── /api/territories/* (Territory management)
│   └── /api/contractors/* (Contractor data)
├── Authentication
│   ├── Clerk integration
│   └── Role validation
├── Map Services
│   ├── Geographic boundary data
│   └── Location services
└── Analytics
    ├── Performance tracking
    └── Usage metrics
```

## Testing Structure

### Test Organization

```
__tests__/
├── components/
│   └── CenterRecentActions.test.tsx
├── hooks/
│   └── useCenterData.test.ts
├── api/
│   └── center.test.ts
├── utils/
│   ├── centerApi.test.ts
│   └── centerAuth.test.ts
└── integration/
    └── center-workflow.test.tsx
```