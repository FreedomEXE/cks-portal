# Component Architecture

Component architecture guidelines and patterns used in the CKS Portal.

## Overview

This document outlines the architectural patterns and component structure used throughout the CKS Portal application. Following these patterns ensures consistency, maintainability, and code reusability across the codebase.

---

## Modal System Architecture

### ModalRoot Component

**Location:** `packages/ui/src/modals/ModalRoot/`

The CKS Portal uses a centralized modal system based on the `ModalRoot` component. All modal dialogs throughout the application should use this wrapper to ensure consistent behavior and visual effects.

#### Key Features:

1. **Portal Rendering** - Modals render into `document.body` to escape z-index stacking contexts
2. **Animated Background** - Flickering grid animation provides visual polish
3. **Backdrop Blur** - Page content dims and blurs when modal is open
4. **Body Scroll Lock** - Prevents background scrolling via `modal-open` class
5. **Escape Key Handling** - Built-in keyboard accessibility
6. **Click-outside Dismissal** - Configurable backdrop click behavior
7. **Enter/Exit Animations** - Smooth fade transitions

#### Component Structure:

```
ModalRoot/
├── index.ts                    # Public exports
├── ModalRoot.tsx               # Main modal wrapper component
├── ModalRoot.module.css        # Styles (backdrop, layering, transitions)
└── PixelField.tsx              # Canvas-based animation system
```

### Usage Pattern

All modals follow this standard pattern:

```tsx
import { ModalRoot } from '@cks/ui';

interface MyModalProps {
  isOpen: boolean;
  onClose: () => void;
  // ...other props
}

export function MyModal({ isOpen, onClose, ...props }: MyModalProps) {
  if (!props.data) return null; // Guard against missing data

  return (
    <ModalRoot isOpen={isOpen} onClose={onClose}>
      <div className={styles.modal}>
        {/* Modal content here */}
      </div>
    </ModalRoot>
  );
}
```

### Modal Components Using ModalRoot:

All 11 modal components in the application use `ModalRoot`:

1. **ActionModal** - User/entity action menus
2. **AssignServiceModal** - Service assignment workflow
3. **CatalogServiceModal** - Service catalog selection
4. **CreateServiceModal** - New service creation form
5. **CrewSelectionModal** - Crew member assignment
6. **EditOrderModal** - Order editing interface
7. **OrderDetailsModal** - Product order details view
8. **ProductOrderModal** - Product ordering interface
9. **ServiceDetailsModal** - Service information display
10. **ServiceOrderModal** - Service-related orders
11. **ServiceViewModal** - Service details viewer

### Animation System (PixelField)

The `PixelField` component provides a subtle, professional animated background for modals:

#### Technical Implementation:

- **Canvas-based rendering** for smooth 60fps performance
- **Grid-based positioning** with independent particle animation
- **Probabilistic state machine** - Each square flickers independently
- **Float32Array** for efficient memory usage
- **Accessibility support** - Respects `prefers-reduced-motion`

#### Configurable Parameters:

```tsx
<PixelField
  active={state !== 'exiting'}
  squareSize={5}        // Size of each square in pixels
  gridGap={7}           // Gap between squares
  flickerChance={0.15}  // Probability of state change per second
  maxOpacity={0.5}      // Maximum square brightness
/>
```

#### Performance Characteristics:

- **~10,800 squares** on 1920×1080 screen
- **~2,000 active draws** per frame (15-25% visible)
- **<1ms render time** on modern hardware
- **Stops when inactive** to conserve CPU

---

## Component Patterns

### 1. Presentation vs Container Pattern

**Presentation Components** (in `packages/ui/`)
- Pure UI components
- Accept all data via props
- No direct API calls or business logic
- Highly reusable across applications

**Container Components** (in `apps/frontend/src/`)
- Handle data fetching and state management
- Contain business logic
- Compose presentation components
- Application-specific

### 2. Composition Pattern

Build complex UIs from simple, focused components:

```tsx
// Simple, focused components
<ModalRoot>
  <Modal>
    <ModalHeader />
    <ModalContent>
      <Section>
        <Field label="Name" value={data.name} />
        <Field label="Status" value={data.status} />
      </Section>
    </ModalContent>
    <ModalFooter>
      <Button onClick={onClose}>Close</Button>
    </ModalFooter>
  </Modal>
</ModalRoot>
```

### 3. Controlled Components

Form inputs and interactive elements are controlled by React state:

```tsx
const [value, setValue] = useState('');

<input
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### 4. TypeScript Interfaces

All components have well-defined TypeScript interfaces:

```tsx
export interface ComponentProps {
  isOpen: boolean;
  onClose: () => void;
  data: DataType | null;
  // Optional props with defaults
  variant?: 'primary' | 'secondary';
}
```

---

## Loading System Architecture

**Location:** `apps/frontend/src/contexts/` and `apps/frontend/src/components/`

The CKS Portal uses a centralized loading animation system that provides consistent UX during data fetching operations.

### Components:

#### 1. LoadingContext
**File:** `apps/frontend/src/contexts/LoadingContext.tsx`

Global context that manages the visibility of the loading animation. Multiple components can trigger the loader simultaneously, and it only hides when all triggers have completed.

**API:**
```tsx
const { visible, start } = useLoading();

// Start loading - returns cleanup function
const endLoader = start();

// Stop loading when done
endLoader();
```

#### 2. HubLoadingContext
**File:** `apps/frontend/src/contexts/HubLoadingContext.tsx`

Hub-specific loading context that allows hubs to signal when their critical data has loaded and they're ready to display.

**Features:**
- Tracks hub loading state (`isHubLoading`)
- 15-second failsafe auto-reload if hub doesn't load
- Session storage prevents reload loops (max 1 reload per 60 seconds)

**API:**
```tsx
const { isHubLoading, setHubLoading } = useHubLoading();

// Signal hub is ready
setHubLoading(false);
```

#### 3. GlobalLoader Component
**File:** `apps/frontend/src/components/GlobalLoader.tsx`

Displays the animated portal icon during loading states.

**Features:**
- SVG path animation using `LogoLoader` component
- Full-screen overlay with backdrop blur
- Configurable via environment variables
- Automatically shown/hidden based on `LoadingContext`

**Environment Configuration:**
```env
VITE_LOADER_SVG=/portal-icon.svg    # Path to SVG logo
VITE_LOADER_COLOR=#111827           # Animation color (hex)
VITE_LOADER_SIZE=128                # Size in pixels
```

#### 4. LogoLoader Component
**File:** `apps/frontend/src/components/LogoLoader.tsx`

Animates SVG paths with stroke-dasharray technique for smooth drawing effect.

**Features:**
- Parses SVG paths and extracts viewBox
- Animates each path with configurable duration, delay, and stagger
- Uses Framer Motion for smooth animations
- Supports custom colors and stroke thickness

### Hub Loading Pattern

All hubs follow this consistent loading pattern:

```tsx
export default function RoleHub({ initialTab = 'dashboard' }: HubProps) {
  const { code } = useAuth();
  const normalizedCode = useMemo(() => normalizeId(code), [code]);
  const { setHubLoading } = useHubLoading();

  // Fetch critical data
  const { data: profile } = useHubProfile(normalizedCode);
  const { data: dashboard } = useHubDashboard(normalizedCode);

  // Signal when critical data is loaded
  useEffect(() => {
    const hasCriticalData = !!profile && !!dashboard;
    if (hasCriticalData) {
      console.log('[RoleHub] Critical data loaded, signaling ready');
      setHubLoading(false);
    }
  }, [profile, dashboard, setHubLoading]);

  // Additional hooks...

  // Don't render until critical data is available
  if (!profile || !dashboard) {
    console.log('[RoleHub] Waiting for critical data...');
    return null;
  }

  return (
    <div>
      <MyHubSection role="role" userId={normalizedCode} />
      {/* Hub content */}
    </div>
  );
}
```

**Critical Rules:**
1. **All hooks must be called before any early returns** (React Rules of Hooks)
2. **Signal loading complete** via `setHubLoading(false)` when critical data arrives
3. **Return null** if critical data is missing (hub renders hidden until ready)
4. **Critical data** = minimum data needed to render without placeholder values

### Loading Flow

```
User navigates to hub
    ↓
App.tsx wraps HubLoader in HubLoadingProvider
    ↓
isHubLoading = true (default)
    ↓
GlobalLoader displays portal icon animation
    ↓
Hub renders (visibility: hidden, position: absolute)
    ↓
Hub fetches critical data (profile + dashboard)
    ↓
Hub signals: setHubLoading(false)
    ↓
App.tsx hides loader (100ms delay for smooth transition)
    ↓
Hub becomes visible (visibility: visible, position: relative)
```

### Failsafe Mechanism

If a hub doesn't signal completion within 15 seconds:

1. Check `sessionStorage` for recent reload
2. If no recent reload → reload page once
3. If already reloaded → give up, show hub anyway
4. Session key: `cks_hub_auto_reload`
5. Prevents infinite reload loops

### Catalog Loading

The catalog uses `LoadingContext` directly:

```tsx
const { start } = useLoading();
const { data, isLoading } = useCatalogItems(params);

useEffect(() => {
  let endLoader: (() => void) | null = null;

  if (isLoading) {
    endLoader = start();
  }

  return () => {
    if (endLoader) {
      endLoader();
    }
  };
}, [isLoading, start]);
```

### Visual Design

- **Animation:** Portal icon SVG paths draw in sequence
- **Duration:** ~1.1 seconds per cycle
- **Stagger:** 0.25s delay between paths
- **Background:** White with 65% opacity + backdrop blur
- **Z-index:** 1000 (above all content)
- **No text:** Clean, minimal animation only

---

## Hub Architecture

**Location:** `apps/frontend/src/hubs/`

Hub components serve as role-specific dashboards with shared patterns:

### Hub Types:
- **AdminHub** - System administration
- **ManagerHub** - Service and crew management
- **CenterHub** - Center operations
- **ContractorHub** - Contractor workflows
- **CrewHub** - Crew member views
- **CustomerHub** - Customer portal
- **WarehouseHub** - Inventory management

### Common Hub Pattern:

Each hub follows this structure:

```tsx
export function RoleHub() {
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  const [selectedData, setSelectedData] = useState<Data | null>(null);

  return (
    <div className={styles.hub}>
      {/* Navigation */}
      <HubNav />

      {/* Main content area */}
      <HubContent>
        {/* Data tables/lists */}
        <DataTable onViewDetails={(item) => {
          setSelectedData(item);
          setActiveModal('details');
        }} />
      </HubContent>

      {/* Modals */}
      <DetailsModal
        isOpen={activeModal === 'details'}
        onClose={() => setActiveModal(null)}
        data={selectedData}
      />
    </div>
  );
}
```

---

## Styling Approach

### CSS Modules

All components use CSS Modules for scoped styling:

```tsx
// Component.module.css
import styles from './Component.module.css';

<div className={styles.container}>
  <h2 className={styles.title}>Title</h2>
</div>
```

### Global Styles

`packages/ui/src/styles/globals.css` contains:
- CSS reset/normalization
- Design tokens (colors, spacing, typography)
- Global utility classes
- Modal-specific global effects (body transform)

### Motion Design

Animations respect user preferences:

```css
body.modal-open #root {
  transform: scale(0.985);
  filter: saturate(0.95);
  transition: transform 0.3s ease-out, filter 0.3s ease-out;
}

@media (prefers-reduced-motion: reduce) {
  body.modal-open #root {
    transform: none;
    transition: none;
  }
}
```

---

## Package Structure

```
packages/
└── ui/
    ├── src/
    │   ├── buttons/         # Button components
    │   ├── modals/          # Modal components
    │   │   └── ModalRoot/   # Centralized modal system
    │   ├── styles/          # Global styles
    │   └── index.ts         # Public exports
    └── package.json
```

---

## Best Practices

### 1. Component Organization

- One component per file
- Co-locate styles (`.module.css`) with component
- Export component as default
- Export types/interfaces as named exports

### 2. Props Design

- Use descriptive prop names
- Provide TypeScript types for all props
- Document complex props with JSDoc comments
- Use callback props for actions (`onClose`, `onSubmit`)

### 3. State Management

- Keep state as local as possible
- Lift state only when necessary
- Use controlled components for forms
- Avoid prop drilling with composition

### 4. Accessibility

- Always include ARIA labels for icons/buttons
- Support keyboard navigation
- Respect `prefers-reduced-motion`
- Ensure sufficient color contrast

### 5. Performance

- Use React.memo for expensive renders
- Lazy load modals that aren't frequently used
- Optimize animations to maintain 60fps
- Use `useCallback` for stable function references

---

## Future Considerations

### Planned Improvements:

1. **Component Documentation** - Add Storybook for component library
2. **Theme System** - Implement dark mode support
3. **Testing Strategy** - Component unit tests with Jest/React Testing Library
4. **Design Tokens** - Centralize all design values (colors, spacing, typography)
5. **Icon System** - Standardized icon component library

---

## Related Documentation

- [Architecture Overview](./Architecture.md)
- [API Surface Documentation](./API_Surface.md)
- [Session Notes](./sessions/)

---

**Last Updated:** October 10, 2025
**Maintained By:** Development Team
