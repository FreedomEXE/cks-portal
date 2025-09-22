# CKS Test Interface

## Overview

The CKS Test Interface is a development tool that provides real-time component discovery, usage tracking, and visual testing for the CKS Portal application. It automatically analyzes your codebase to detect which components are being used where, how many times, and provides a comprehensive testing environment for all role-based hubs.

## Key Features

### 🔍 Automatic Component Discovery
- **Zero Configuration**: Automatically discovers all components in `packages/ui` and `packages/domain-widgets`
- **Real Usage Detection**: Analyzes actual TypeScript/JSX files to find real component usage
- **No Manual Updates**: When you add/remove components, just run the analyzer

### 📊 Accurate Usage Tracking
- **Component Counting**: Shows exact usage count (e.g., "OverviewCard (6)")
- **Tab-Specific Tracking**: Knows which components are used in Dashboard vs Profile vs Settings
- **Role-Based Analysis**: Different roles use different components - we track them all

### 🎯 Dynamic Tab Detection
- **Reads Actual Code**: Extracts tabs directly from hub files (`const tabs = [...]`)
- **No Hardcoding**: Admin correctly shows "Directory, Create, Assign" not "My Profile, My Ecosystem"
- **Auto-Updates**: Change tabs in your hub, run analyzer, interface updates automatically

### 🎨 Multiple View Modes
- **Hub View**: See the actual hub component as users would
- **Catalog View**: Browse all available components with usage checkmarks
- **Config View**: View file paths and locations of used components

## Installation

```bash
cd cks-portal/apps/test-interface
npm install
```

## Usage

### 1. Update Component Detection

After making changes to hub files or components:

```bash
npm run analyze
```

This runs the build-time analyzer that:
- Scans all hub files (AdminHub.tsx, ManagerHub.tsx, etc.)
- Detects component imports and usage
- Counts component instances
- Extracts tab definitions
- Generates `component-manifest.json`

### 2. Start the Interface

```bash
npm run dev
```

Opens at http://localhost:3007 (or next available port)

### 3. Navigate and Test

1. **Select a Role**: Click on Admin, Manager, Contractor, etc.
2. **Choose a Tab**: Hover over role button, select from dropdown (Dashboard, Profile, etc.)
3. **Switch Views**:
   - Hub: See actual component
   - Catalog: Browse component library
   - Config: View file locations

## How It Works

### Build-Time Analysis

The analyzer (`scripts/analyze-components.js`) uses Node.js to:

1. **Read Hub Files**: Parses TypeScript files at build time
2. **Extract Tabs**: Uses regex to find `const tabs = [...]`
3. **Detect Components**: Finds JSX usage like `<OverviewSection />`
4. **Count Instances**: Recognizes arrays and counts items
5. **Generate Manifest**: Creates JSON with all findings

### Component Detection Strategies

#### Direct Detection
```jsx
<OverviewSection cards={overviewCards} />  // ✅ Detected
```

#### Array Counting
```javascript
const overviewCards = [
  { id: 'contractors', ... },  // Counts
  { id: 'customers', ... },     // all 6
  // ... 4 more                  // items
];
```

#### Indirect Detection
```jsx
// Detects buttons from callbacks
onClear={() => ...}        // = 1 Button
onUpdatePhoto={() => ...}  // = 1 Button
```

### Runtime Display

The interface (`src/TestInterface.tsx`) then:
1. Loads the generated manifest
2. Merges with discovered components
3. Filters by selected role/tab
4. Displays with counts and checkmarks

## Architecture

```
Test-Interface/
├── scripts/
│   └── analyze-components.js    # Build-time analyzer
├── src/
│   ├── TestInterface.tsx        # Main UI component
│   ├── hooks/
│   │   └── useTabComponents.ts  # Component discovery hook
│   ├── component-manifest.json  # Generated usage data
│   └── index.tsx                # Entry point
├── package.json                  # Scripts and dependencies
└── vite.config.ts               # Build configuration
```

## Component Manifest Structure

```json
{
  "admin": {
    "tabs": {
      "dashboard": {
        "OverviewCard": {
          "count": 4,
          "type": "ui",
          "path": "packages/ui/src/cards/OverviewCard"
        },
        "Button": {
          "count": 2,
          "type": "ui",
          "path": "packages/ui/src/Button"
        }
      }
    },
    "tabDefinitions": ["dashboard", "directory", "create", "assign", "archive", "support"]
  }
}
```

## Advanced Features

### Tab Persistence
- Selected tab persists across all view modes
- Switch from Hub to Catalog, tab selection remains

### Role-Based Highlighting
- Components used by current role/tab are highlighted
- Unused components shown dimmed in catalog

### Count Display
- Single use: Just checkmark ✅
- Multiple uses: Shows count "Button (2)"
- Arrays detected: "OverviewCard (6)"

## Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 3005-3007
# On Windows:
netstat -ano | findstr :3007
taskkill /PID <PID> /F

# On Mac/Linux:
lsof -i :3007
kill -9 <PID>
```

### Components Not Detected
1. Run `npm run analyze` to update detection
2. Check that components are actually imported in hub files
3. Verify component names match (case-sensitive)

### Wrong Tabs Showing
1. Ensure tabs are defined as `const tabs = [...]` in hub file
2. Run analyzer after changing tabs
3. Check manifest has correct `tabDefinitions`

### Stale Component Counts
- Always run `npm run analyze` after modifying hubs
- Manifest is generated, not hand-edited
- Check console for analyzer errors

## Limitations

### Current Limitations
1. **Detection Depth**: Only analyzes hub files, not nested component internals
2. **Dynamic Imports**: Can't detect lazy-loaded or conditional imports
3. **Runtime Components**: Can't detect components created at runtime
4. **Regex Parsing**: Less accurate than full AST parsing

### Planned Improvements
1. **AST Parsing**: Replace regex with TypeScript AST for better accuracy
2. **Recursive Analysis**: Analyze imported components recursively
3. **Runtime Tracking**: Add runtime component usage monitoring
4. **Visual Regression**: Screenshot comparison between changes
5. **Performance Metrics**: Track render times and re-renders

## Configuration

### Vite Config
```typescript
// vite.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@cks-hubs': path.resolve(__dirname, '../Frontend/src/hubs'),
    '@cks-packages': path.resolve(__dirname, '../../packages'),
    '@cks-frontend': path.resolve(__dirname, '../Frontend/src')
  }
}
```

### Analyzer Config
Currently configured in `scripts/analyze-components.js`:
- Hub file locations
- Tab extraction patterns
- Component detection regex
- Special handlers (arrays, buttons)

## Contributing

### Adding New Detection Patterns

In `analyze-components.js`:

```javascript
// Add new pattern for detecting custom components
const customPattern = /YourPattern/g;
if (customPattern.test(content)) {
  // Add to component usage
}
```

### Supporting New Component Types

1. Add glob pattern for new package location
2. Update type detection in `determineComponentType()`
3. Add to manifest structure if needed

## FAQ

### Why build-time analysis instead of runtime?
Browser JavaScript can't read local files. Build-time analysis with Node.js can read and parse TypeScript files directly.

### How are tabs detected?
The analyzer looks for `const tabs = [...]` pattern in each hub file and extracts the tab IDs.

### How are multiple instances counted?
- Arrays: Counts items in arrays like `overviewCards`
- Callbacks: Counts button-related callbacks
- JSX: Counts actual component usage in JSX

### Why is Test-Interface separate from Frontend?
Preparation for future server-side capabilities and better separation of concerns. Also allows for different build configurations.

### Can it detect all components?
Currently detects components directly used in hub files. Cannot see inside imported components without recursive analysis (planned feature).

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the session notes in `SESSION WITH CLAUDE-2025-09-17.md`
3. Ensure you've run `npm run analyze` after changes

---

*Test Interface - Making component discovery automatic and accurate*
