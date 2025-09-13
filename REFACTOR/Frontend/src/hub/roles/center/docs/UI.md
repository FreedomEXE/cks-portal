# Center Hub UI Documentation

## Overview

User interface specifications for the Center hub, focusing on regional operations management, territory oversight, and multi-location coordination.

## Layout Structure

### Dashboard Layout
```
┌─────────────────────────────────────────────────┐
│ Header: Center Operations | [CEN-XXX]           │
├─────────────────────────────────────────────────┤
│ Sidebar Navigation                              │
│ - Dashboard                                     │
│ - Territories                                   │
│ - Contractors                                   │
│ - Customers                                     │
│ - Orders                                        │
│ - Reports                                       │
│ - Support                                       │
└─────────────────────────────────────────────────┘
```

### Main Content Areas

#### Dashboard Overview
- **Territory Map**: Interactive map showing all managed territories
- **Performance Metrics**: Key operational indicators
- **Activity Feed**: Recent center activities and updates
- **Quick Actions**: Territory assignments, contractor management

#### Territory Management
- **Territory List**: All territories with status indicators
- **Boundary Editor**: Geographic boundary configuration
- **Performance Dashboard**: Territory-specific metrics
- **Assignment Interface**: Contractor-territory assignments

## Component Specifications

### CenterRecentActions
- **Purpose**: Activity feed for center operations
- **Data**: Territory updates, contractor assignments, performance reviews
- **Actions**: Clear activities, view details
- **Styling**: Blue accent colors, territory-focused icons

### Territory Map
- **Interactive Elements**: Clickable territories, boundary editing
- **Data Visualization**: Contractor density, performance heatmaps
- **Controls**: Zoom, filter, territory selection

### Performance Dashboard
- **Metrics Display**: Cards for key performance indicators
- **Time Controls**: Period selection (daily, weekly, monthly)
- **Comparative Views**: Territory comparison, trend analysis

## Design System

### Color Palette
- **Primary**: Blue (#3B82F6) - Territory management
- **Secondary**: Green (#10B981) - Performance positive
- **Warning**: Orange (#F59E0B) - Attention needed
- **Error**: Red (#EF4444) - Critical issues

### Typography
- **Headers**: Inter, 24px bold for page titles
- **Subheaders**: Inter, 18px semibold for sections
- **Body**: Inter, 14px regular for content
- **Labels**: Inter, 12px medium for form labels

### Spacing
- **Container Padding**: 24px
- **Component Spacing**: 16px between major components
- **Element Spacing**: 8px between related elements

## Responsive Behavior

### Desktop (1200px+)
- Full sidebar navigation
- Multi-column territory grid
- Expanded map view

### Tablet (768px - 1199px)
- Collapsible sidebar
- Two-column territory grid
- Compact map controls

### Mobile (< 768px)
- Bottom navigation
- Single-column layout
- Simplified map interactions

## Accessibility

- **Keyboard Navigation**: Tab order through all interactive elements
- **Screen Readers**: ARIA labels for map regions and data visualizations
- **Color Contrast**: WCAG AA compliance for all text
- **Focus Indicators**: Clear visual focus states

## Interactive Elements

### Territory Selection
- **Hover States**: Highlight with blue border
- **Active States**: Blue background with white text
- **Selection**: Multi-select with checkboxes

### Map Controls
- **Zoom Buttons**: + / - controls
- **Reset View**: Return to default zoom/center
- **Layer Toggle**: Show/hide different data layers

### Action Buttons
- **Primary Actions**: Blue background, white text
- **Secondary Actions**: White background, blue border
- **Destructive Actions**: Red background, white text