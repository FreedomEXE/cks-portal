# CKS Test Interface

A comprehensive testing sandbox for the CKS Portal Next frontend components and role hubs.

## Overview

The test interface provides a controlled environment for testing all role hubs, components, and configurations without affecting the production application. It runs on port 3005 to avoid conflicts with the main development server.

## Quick Start

```bash
# Navigate to the Frontend directory
cd cks-portal-next/Frontend

# Install dependencies if not already installed
npm install

# Start the test interface
npm run test:interface
```

The test interface will open automatically in your browser at `http://localhost:3005`.

## Features

### Role Hub Testing
- **Role Switching**: Toggle between all 7 roles (admin, manager, customer, contractor, center, crew, warehouse)
- **Permission Testing**: View and validate role-specific permissions
- **Component Validation**: Check that all role components load correctly
- **Configuration Loading**: Test role configurations from generated configs with fallbacks

### Debug Tools
- **🐛 Debug Info**: Shows current role, user ID, permissions count, and component validation status
- **⚙️ Config Details**: Displays role configuration including tabs and features
- **📦 Component Catalog**: Browse and test individual components in isolation

### Shared Components Testing
- **Import Validation**: Ensures shared components can be imported using path aliases
- **Component Gallery**: Visual testing of shared components with different variants
- **Isolation Mode**: Test components in full-screen isolation

## Interface Layout

### Header Bar
- **Role Selector**: Buttons for each role that switch the active test user
- **Debug Toggle**: Shows/hides debug information panel
- **Config Toggle**: Shows/hides configuration details panel
- **Catalog Toggle**: Switches to component catalog view

### Main Content Area
- **Role Hub**: The currently selected role's hub interface
- **Shared Components Test**: Examples of shared components loaded from `@shared/components/`
- **Component Catalog**: Browseable catalog of all registered components (when toggled)

### Status Footer
- **Current Role Info**: Active role, user ID, and permission count
- **Component Status**: Number of validated components and their status
- **Port Info**: Confirms running on port 3005

## File Structure

```
src/test-interface/
├── index.html              # HTML entry point
├── index.tsx               # React app entry point
├── HubTester.tsx           # Main test interface component
├── hub/
│   ├── RoleHub.tsx         # Test wrapper for production RoleHub
│   └── roleConfigLoader.ts # Role configuration and user data
├── catalog/
│   ├── CatalogContext.tsx  # Component catalog context
│   └── CatalogViewer.tsx   # Component browser interface
└── roles/                  # Test role configurations
    ├── admin/
    │   ├── index.ts        # Admin role components
    │   └── config.v1.json  # Admin role configuration
    ├── manager/
    ├── contractor/
    ├── customer/
    ├── center/
    ├── crew/
    └── warehouse/
```

## Configuration

### Vite Configuration
The test interface uses `vite.config.test.ts` with:
- **Port**: 3005 (configurable)
- **Path Aliases**: `@`, `@shared`, `@roles`, `@test`
- **Environment**: `VITE_TEST_INTERFACE=true`

### TypeScript Configuration
Path mapping is configured in `tsconfig.json`:
```json
{
  "paths": {
    "@/*": ["src/*"],
    "@shared/*": ["src/shared/*"],
    "@roles/*": ["src/roles/*"],
    "@test/*": ["src/test-interface/*"]
  }
}
```

## Testing Workflow

1. **Start the interface**: `npm run test:interface`
2. **Select a role**: Click role buttons in the header
3. **Verify components load**: Check the component validation status
4. **Test shared components**: Scroll down to see shared component examples
5. **Use debug tools**: Toggle debug info to see detailed information
6. **Browse catalog**: Use catalog mode to test individual components

## Development Integration

### Adding New Roles
1. Create role folder in `src/roles/` with production components
2. Add test configuration in `src/test-interface/roles/[role]/`
3. Update `testUsers` in `roleConfigLoader.ts` with role permissions

### Adding Shared Components
1. Create component in `src/shared/components/`
2. Import in `HubTester.tsx` to test loading
3. Components automatically available via `@shared` alias

### Connecting Production Components
The test interface will automatically use production components when available:
- Role components from `src/roles/[role]/`
- Shared components from `src/shared/`
- Hub components from `src/hub/`

## Troubleshooting

### Common Issues
- **Port conflicts**: Change port in `vite.config.test.ts`
- **Import errors**: Verify path aliases in `tsconfig.json`
- **Missing components**: Check console for loading errors
- **Config errors**: Verify JSON syntax in role configs

### Debug Information
Enable debug mode (🐛 button) to see:
- Current role and permissions
- Component validation results
- Configuration loading status
- Import resolution details

### Component Validation
The interface validates that all configured components exist:
- ✅ **OK**: Component exists and can be loaded
- ❌ **MISSING**: Component not found or import failed

## Production Integration

The test interface is designed to:
- **Not affect production**: Runs on separate port with isolated config
- **Test real components**: Uses production components when available
- **Validate configurations**: Ensures role configs work before deployment
- **Enable development**: Provides safe environment for component development

When production components are ready, they'll automatically be used by the test interface, making it easy to verify everything works together.