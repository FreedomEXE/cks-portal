# CKS COLOR CODES

## Official Color Coding System for CKS Portal

This document defines the standardized color codes for all entity types and data types throughout the CKS Portal application. These colors should be used consistently across all hubs, components, and UI elements.

## Entity Type Colors

### User Roles
| Entity Type | Color Name | Hex Code | RGB | Usage |
|------------|------------|----------|-----|--------|
| **Admin** | Black/Gray | #111827 / #374151 | 17,24,39 / 55,65,81 | Admin hub, admin-related UI elements |
| **Manager** | Blue | #3b82f6 / #60a5fa | 59,130,246 / 96,165,250 | Manager hub, manager cards and badges |
| **Contractor** | Green | #10b981 / #34d399 | 16,185,129 / 52,211,153 | Contractor hub, contractor-related elements |
| **Customer** | Yellow | #eab308 / #facc15 | 234,179,8 / 250,204,21 | Customer hub, customer cards |
| **Center** | Orange | #f97316 / #fb923c | 249,115,22 / 251,146,60 | Center hub, center-related UI |
| **Crew** | Red | #ef4444 / #f87171 | 239,68,68 / 248,113,113 | Crew hub, crew member elements |
| **Warehouse** | Purple | #8b5cf6 / #a78bfa | 139,92,246 / 167,139,250 | Warehouse hub, warehouse cards |

### Data Types
| Data Type | Color Name | Hex Code | RGB | Usage |
|-----------|------------|----------|-----|--------|
| **Services** | Teal | #14b8a6 | 20,184,166 | Service-related cards and badges |
| **Orders** | Indigo | #6366f1 | 99,102,241 | Order listings and status |
| **Products** | Magenta | #d946ef | 217,70,239 | Product cards and inventory |
| **Training & Procedures** | Pink | #ec4899 | 236,72,153 | Training modules and procedure docs |
| **Reports & Feedback** | Brown | #92400e | 146,64,14 | Reports section and feedback items |

## Status Colors

### General Status Indicators
| Status | Background | Foreground | Usage |
|--------|------------|------------|--------|
| **Active/Available/Operational** | #dcfce7 | #16a34a | Active items, operational status |
| **Pending/In Progress/Processing** | #fef3c7 | #d97706 | Items awaiting action |
| **Suspended/Archived/Inactive** | #fee2e2 | #dc2626 | Disabled or archived items |
| **Unassigned** | #e0f2fe | #0369a1 | Unassigned entities |
| **Unknown** | #e2e8f0 | #475569 | Unknown or undefined status |

## UI Element Colors

### Buttons and Actions
| Element | Color | Hex Code | Usage |
|---------|-------|----------|--------|
| **Refresh Button** | Black | #0f172a | Archive refresh button |
| **Primary Actions** | Role-specific | See role colors | Based on current hub context |
| **Danger Actions** | Red | #dc2626 | Delete, archive, remove actions |
| **Success Actions** | Green | #16a34a | Save, confirm, approve actions |

## Implementation Notes

### Color Usage Guidelines
1. **Primary colors** (first hex code) are used for main UI elements
2. **Accent colors** (second hex code where provided) are used for hover states and highlights
3. **Always use the exact hex codes** specified to maintain consistency
4. **Status colors** should use both background and foreground colors as specified

### Component-Specific Applications

#### Navigation Tabs
- Active tab background uses the role/entity accent color
- Inactive tabs use neutral gray (#f3f4f6)

#### Overview Cards
- Card accents use the appropriate entity or data type color
- Status cards use the corresponding role color

#### Data Tables
- Clickable IDs use the primary color of the entity type
- Status badges use the status color palette

## Color Mapping by Hub

### Admin Hub
- Primary: #111827 (Black)
- Accent: #374151 (Gray)

### Manager Hub
- Primary: #3b82f6 (Blue)
- Cards reference: Contractors (green), Customers (yellow), Centers (orange), Crew (red), Orders (indigo)

### Contractor Hub
- Primary: #10b981 (Green)
- All accent elements use green theme

### Customer Hub
- Primary: #eab308 (Yellow)
- Cards reference: Services (teal), Centers (orange), Crew (red)

### Center Hub
- Primary: #f97316 (Orange)
- Cards reference: Crew (red), Services (teal)

### Crew Hub
- Primary: #ef4444 (Red)
- Cards reference: Services (teal), Tasks (red), Hours (red)

### Warehouse Hub
- Primary: #8b5cf6 (Purple)
- Cards reference: Inventory (purple), Orders (indigo), Products (magenta)

## Maintenance Notes

**Last Updated**: 2025-09-24
**Version**: 1.0.0

This color system was standardized to ensure consistent visual hierarchy and improve user experience across the CKS Portal application. Any changes to these colors should be applied globally across all affected components.