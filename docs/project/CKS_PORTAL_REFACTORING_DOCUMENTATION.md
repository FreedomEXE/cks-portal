# CKS Portal Refactoring Project Documentation

*Property of CKS © 2025 - Manifested by Freedom*

## Project Overview

**Goal**: Complete refactoring of CKS Portal frontend from shared component architecture to fully independent, modular hub systems with total isolation for security and operational efficiency.

## Business Context

**CKS Business Model**:
- **Contractors** pay CKS for services
- **Contractors** have **Customers** who have **Centers**
- **CKS Managers** oversee operations and manage **CKS Crew**
- **CKS Crew** are field workers who perform tasks at Customer Centers
- **CKS Admin** creates and manages all data across the system

**Revenue Flow**: Contractors → CKS → Services delivered to Contractor's Customers/Centers via CKS Crew managed by CKS Managers

## Architecture Principles

### Complete Hub Independence
- Each hub has dedicated API endpoints (`/api/manager`, `/api/contractor`, `/api/customer`, `/api/center`, `/api/crew`, `/api/admin`)
- Hub-specific authentication and session management
- Zero shared dependencies between hubs
- Isolated utilities, hooks, and components per hub
- Role-specific backends to prevent cross-hub data access

### Security Focus
- Prevent hubs from accessing other hub data
- Role-based access control with Clerk authentication
- Hub-specific headers and authentication tokens
- Session isolation using hub-prefixed storage keys

### Technical Standards
- React with TypeScript and Vite build system
- React Router for client-side routing
- Clerk authentication with role-based metadata
- SessionStorage for role/code persistence
- **String concatenation for URL building** (NOT URL constructor for relative paths)
- Consolidated single-page components with tabbed sections
- Color-coded themes for visual differentiation

## Completed Hubs

### 1. Manager Hub ✅
- **Theme**: Blue (#3b82f6)
- **File**: `frontend/src/pages/Hub/Manager/Home.tsx` (400+ lines)
- **Sections**: Dashboard, Profile, Reports, Orders, News
- **Key Features**: 
  - Comprehensive business management dashboard
  - Fixed critical URL construction bug (string concat vs URL constructor)
  - Manager-specific API endpoints and authentication
- **Status**: Fully functional

### 2. Contractor Hub ✅  
- **Theme**: Green (#10b981)
- **File**: `frontend/src/pages/Hub/Contractor/Home.tsx` (500+ lines)
- **Sections**: Dashboard, Profile, Customers, Centers, Crew, Reports, Orders, Manager, Services
- **Key Features**:
  - Premium client business dashboard
  - Revenue features archived per partner request
  - Contractor-customer relationship management
- **Status**: Fully functional

### 3. Customer Hub ✅
- **Theme**: Yellow (#eab308) 
- **File**: `frontend/src/pages/Hub/Customer/Home.tsx`
- **Sections**: Dashboard, Profile, Centers, Services, Orders, Reports, Support
- **Key Features**:
  - Center management focus
  - Upsell buttons for requesting services/products from contractors
  - Customer-specific operational tools
- **Status**: Fully functional

### 4. Center Hub ✅
- **Theme**: Orange (#f97316)
- **File**: `frontend/src/pages/Hub/Center/Home.tsx` 
- **Sections**: Dashboard, Profile, Crew, Services, Schedules, Reports, Support
- **Key Features**:
  - Crew coordination and operational metrics
  - Center-specific crew management
  - Upsell functionality for service requests
- **Status**: Fully functional

### 5. Crew Hub ✅
- **Theme**: Red (#ef4444)
- **File**: `frontend/src/pages/Hub/Crew/Home.tsx`
- **Sections**: Dashboard, Profile, Schedule, Tasks, Timecard, Training, Center, Services
- **Key Features**:
  - Center-focused work design (crew works at centers)
  - Time tracking with live clock and clock in/out functionality
  - Field worker operational tools
  - Real-time updates every minute
- **Status**: Fully functional

## Hub Architecture Pattern

### Directory Structure
```
frontend/src/pages/Hub/[HubName]/
├── index.tsx          # Router with all routes pointing to Home
├── Home.tsx           # Consolidated single-page component (400-500+ lines)
├── utils/
│   ├── [hub]Auth.ts   # Hub-specific authentication
│   └── [hub]Api.ts    # Hub-specific API utilities
└── hooks/             # Hub-specific data hooks (if needed)
```

### Code Patterns

**Tabbed Section Navigation**:
```typescript
type HubSection = 'dashboard' | 'profile' | 'section3' | 'section4';
const [activeSection, setActiveSection] = useState<HubSection>('dashboard');
```

**URL Building (CRITICAL)**:
```typescript
// CORRECT - String concatenation for relative paths
export function buildHubApiUrl(path: string, params: Record<string, any> = {}) {
  let url = HUB_API_BASE + path; // String concatenation
  // Add query params...
  return url;
}
```

**Authentication Headers**:
```typescript
headers.set('x-hub-user-id', userId);
headers.set('x-hub-type', 'hubname');
```

## Key Technical Fixes

### 1. URL Construction Bug
- **Problem**: `new URL(API_BASE + path)` failed with "Invalid URL" 
- **Solution**: Use string concatenation `API_BASE + path` for relative API paths
- **Impact**: Fixed all API communication across hubs

### 2. Hub Independence
- **Problem**: Shared components causing cross-hub dependencies
- **Solution**: Consolidated everything into single Home.tsx per hub
- **Impact**: Complete isolation and easier maintenance

### 3. Authentication Isolation  
- **Problem**: Shared session storage causing role conflicts
- **Solution**: Hub-prefixed session keys (`manager:session`, `crew:session`, etc.)
- **Impact**: Secure role separation

## Pending Work

### 6. Admin Hub 🚧
- **Theme**: Black (#000000)
- **Sections**: Create, Manage, Assign, Directory, Warehouses, System
- **Special Requirements**:
  - Only non-template hub (creates data for all other hubs)
  - CKS Directory feature (inspired by original but improved)
  - User creation and management across all hub types
  - System administration and audit functions
  - Warehouses section for future warehouses hub
- **Status**: In development

## Files Cleaned Up (60+ files removed)
- Removed all legacy Manager hub files
- Deleted unused shared components  
- Eliminated duplicate routing files
- Cleaned up old index.ts conflicts
- Maintained hub functionality during cleanup

## Critical Notes for Future Development

1. **Never use URL constructor** for relative API paths - use string concatenation
2. **Each hub must remain completely independent** - no shared utilities
3. **Color themes are fixed** - don't change established hub colors
4. **Single Home.tsx pattern** - consolidate all hub functionality into one component
5. **Hub-specific APIs** - each hub communicates only with its dedicated backend
6. **Session isolation** - use hub-prefixed storage keys
7. **Upsell business model** - Customer and Center hubs can request services through contractors

## Next Steps
1. Complete Admin Hub with black theme and management features
2. Implement CKS Directory functionality  
3. Add Warehouses section for future expansion
4. Create system administration tools
5. Consider future Warehouses Hub development

## Success Metrics
- ✅ Complete hub independence achieved
- ✅ Security isolation implemented
- ✅ 5/6 hubs fully functional
- ✅ Business model requirements met
- ✅ Performance improved with consolidated components
- ✅ Maintenance simplified with single-file architecture

---

*This documentation serves as the complete guide for the CKS Portal refactoring project. All patterns and conventions established here should be followed for future hub development.*