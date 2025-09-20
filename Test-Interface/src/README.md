# CKS Test Interface

## Overview
The Test Interface is a development tool for testing and viewing the actual production hub components in isolation. It provides a clean environment to:
- Switch between all 7 role-based hubs (Admin, Manager, Contractor, Customer, Center, Crew, Warehouse)
- Navigate between different tabs within each hub
- Track component usage and dependencies
- View component catalogs and configurations

## Purpose
This is NOT a duplicate of production code. Instead, it:
- **Imports and displays the ACTUAL production hub components** from `../hubs/`
- Provides a testing harness to view different roles and states
- Tracks which components are being used by each hub/tab combination
- Helps developers understand the component architecture

## Structure
```
test-interface/
├── hooks/
│   └── useTabComponents.ts    # Tracks component usage per role/tab
├── index.html                 # HTML entry point
├── index.tsx                  # React entry point
├── README.md                  # This file
└── TestInterface.tsx          # Main test interface component
```

## Features
- **Role Switching**: Click role buttons to switch between different hub views
- **Tab Navigation**: Use dropdown on role buttons to select specific tabs
- **View Modes**:
  - Hub: Shows the actual production hub component
  - Catalog: Shows all available components with usage indicators
  - Config: Shows configuration details for the selected role

## Running the Test Interface
```bash
cd cks-portal-next/Frontend
npm run test:interface
```

The interface will be available at `http://localhost:3005` (or next available port)

## Key Concepts
- **No Code Duplication**: Uses actual production components
- **Real-time Component Detection**: Tracks what's actually imported/used
- **Tab Persistence**: Selected tab persists across view modes
- **Component Counting**: Shows how many instances of each component are used

## Development Notes
- The interface dynamically imports hub components using React.lazy()
- Component tracking is based on actual imports in hub files
- All production components remain in their original locations
- This is a VIEW-ONLY tool for testing and development

## Important
This test interface should remain lightweight. It should NOT:
- Duplicate production code
- Create stub components
- Hardcode component mappings
- Grow to the size of the actual application

Instead, it should simply import and display the real production components for testing purposes.