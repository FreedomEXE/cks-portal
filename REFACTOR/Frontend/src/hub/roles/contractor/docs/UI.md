# Contractor Hub - UI Design Guide

## Design Principles

### Visual Identity
- **Primary Color**: `#3b7af7` (CKS Blue)
- **Secondary Colors**: Success `#10b981`, Warning `#f59e0b`, Error `#ef4444`
- **Typography**: Inter font family, hierarchical sizing
- **Layout**: Card-based design with consistent spacing

### Contractor-Specific Theming
- **Icon Theme**: Tools and construction (🔨, 🏗️, 📋)
- **Color Accents**: Professional blue tones
- **Imagery**: Focus on craftsmanship and quality

## Component Library

### Core Components
- **ContractorRecentActions**: Activity feed with order-specific actions
- **OrderCard**: Individual order display with status indicators
- **ServiceCard**: Service offering management
- **PerformanceMetrics**: KPI visualization

### Layout Components
- **TabNavigation**: Consistent navigation across all tabs
- **ContentContainer**: Standardized content wrapper
- **ActionBar**: Quick action buttons
- **FilterPanel**: Search and filtering interface

## Responsive Design

### Breakpoints
- **Mobile**: < 768px - Single column, collapsible navigation
- **Tablet**: 768px - 1024px - Two column layout
- **Desktop**: > 1024px - Full multi-column layout

### Mobile Optimizations
- Touch-friendly button sizes (44px minimum)
- Swipe gestures for order management
- Collapsible sections for complex forms
- Bottom sheet modals for actions

## Accessibility

### WCAG 2.1 AA Compliance
- Color contrast ratios > 4.5:1
- Keyboard navigation support
- Screen reader optimization
- Focus indicators on all interactive elements

### Contractor-Specific Considerations
- Large text options for outdoor visibility
- High contrast mode for various lighting
- Voice input support for hands-free operation

## Animation & Interaction

### Micro-interactions
- Button hover states with scale transform
- Card elevation on hover
- Loading states with skeleton screens
- Success animations for completed actions

### Transitions
- Tab switching: 200ms ease-in-out
- Modal appearance: 300ms ease-out
- Data updates: Fade transition 150ms

## Data Visualization

### Charts & Metrics
- Performance trends: Line charts
- Order distribution: Pie charts
- Revenue tracking: Bar charts
- Status indicators: Progress rings

### Color Coding
- **Active Orders**: Blue `#3b7af7`
- **Completed**: Green `#10b981`
- **Pending**: Yellow `#f59e0b`
- **Issues**: Red `#ef4444`

---

*Design system aligned with CKS Portal standards*