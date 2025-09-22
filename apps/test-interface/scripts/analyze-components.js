#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hub files to analyze
const hubFiles = {
  admin: '../../frontend/src/hubs/AdminHub.tsx',
  manager: '../../frontend/src/hubs/ManagerHub.tsx',
  contractor: '../../frontend/src/hubs/ContractorHub.tsx',
  customer: '../../frontend/src/hubs/CustomerHub.tsx',
  center: '../../frontend/src/hubs/CenterHub.tsx',
  crew: '../../frontend/src/hubs/CrewHub.tsx',
  warehouse: '../../frontend/src/hubs/WarehouseHub.tsx',
};

// This will be populated dynamically from each hub file
const roleTabs = {};

function analyzeHubFile(filePath, role) {
  const fullPath = path.resolve(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${fullPath}`);
    return {};
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const tabComponents = {};

  // Extract tabs from the hub file
  const tabsRegex = /const\s+tabs\s*=\s*\[([\s\S]*?)\];/;
  const tabsMatch = content.match(tabsRegex);
  let tabs = [];

  if (tabsMatch) {
    // Parse the tabs array
    const tabsContent = tabsMatch[1];
    const tabItemRegex = /\{\s*id:\s*['"](\w+)['"]/g;
    let tabMatch;
    while ((tabMatch = tabItemRegex.exec(tabsContent)) !== null) {
      tabs.push(tabMatch[1]);
    }
  }

  // Store tabs for this role
  roleTabs[role] = tabs;

  // Initialize tab components
  tabs.forEach(tab => {
    tabComponents[tab] = {};
  });

  // Extract imports
  const imports = new Map();
  const importRegex = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const [, namedImports, defaultImport, importPath] = match;

    if (namedImports) {
      const components = namedImports.split(',').map(c => c.trim().split(' ')[0]);
      components.forEach(comp => {
        if (comp && comp[0] === comp[0].toUpperCase()) {
          imports.set(comp, importPath);
        }
      });
    } else if (defaultImport && defaultImport[0] === defaultImport[0].toUpperCase()) {
      imports.set(defaultImport, importPath);
    }
  }

  // Parse JSX to find tab-specific rendering
  // Look for conditional rendering based on activeTab
  const tabBlocks = {};

  // Find patterns like: activeTab === 'dashboard' ? ( ... ) :
  // Updated to capture larger blocks including nested content
  const tabConditionalRegex = /activeTab\s*===\s*['"](\w+)['"]\s*\?\s*\(([\s\S]*?)\)\s*:\s*activeTab/g;
  const simpleTabRegex = /activeTab\s*===\s*['"](\w+)['"]\s*\?\s*\(([\s\S]*?)\)\s*:/g;

  // Try the more complete pattern first
  let hasMatches = false;
  while ((match = tabConditionalRegex.exec(content)) !== null) {
    const [, tabName, tabContent] = match;
    if (!tabBlocks[tabName]) {
      tabBlocks[tabName] = '';
    }
    tabBlocks[tabName] += tabContent;
    hasMatches = true;
  }

  // Fall back to simpler pattern if needed
  if (!hasMatches) {
    while ((match = simpleTabRegex.exec(content)) !== null) {
      const [, tabName, tabContent] = match;
      if (!tabBlocks[tabName]) {
        tabBlocks[tabName] = '';
      }
      tabBlocks[tabName] += tabContent;
    }
  }

  // Also look for switch cases or if blocks
  const ifBlockRegex = /if\s*\(activeTab\s*===\s*['"](\w+)['"]\)\s*{([^}]+)}/g;

  while ((match = ifBlockRegex.exec(content)) !== null) {
    const [, tabName, tabContent] = match;
    if (!tabBlocks[tabName]) {
      tabBlocks[tabName] = '';
    }
    tabBlocks[tabName] += tabContent;
  }

  // For each tab, count component usage
  for (const [tabName, tabContent] of Object.entries(tabBlocks)) {
    const componentUsage = {};

    // Find JSX components in this tab's content
    const jsxRegex = /<([A-Z][A-Za-z0-9]*)\s*(?:[^>]*)?(?:\/)?>/g;
    let componentMatch;

    while ((componentMatch = jsxRegex.exec(tabContent)) !== null) {
      const componentName = componentMatch[1];

      // Skip React built-ins
      if (['Fragment', 'Suspense'].includes(componentName)) continue;

      // Check if it's from ui or domain packages
      const importPath = imports.get(componentName);
      if (importPath && (importPath.includes('packages/ui') || importPath.includes('packages/domain-widgets'))) {
        const type = importPath.includes('packages/ui') ? 'ui' : 'domain';

        if (!componentUsage[componentName]) {
          componentUsage[componentName] = {
            count: 0,
            type,
            path: importPath
          };
        }
        componentUsage[componentName].count++;
      }
    }

    // Special handling for OverviewSection - check for cards array
    if (tabName === 'dashboard' && componentUsage['OverviewSection']) {
      // Look for overviewCards array definition
      const cardsArrayRegex = /const\s+overviewCards\s*=\s*\[([\s\S]*?)\];/;
      const cardsMatch = content.match(cardsArrayRegex);
      if (cardsMatch) {
        // Count objects in the array (looking for { patterns)
        const cardCount = (cardsMatch[1].match(/\{/g) || []).length;
        if (cardCount > 0) {
          // Add OverviewCard as a detected component
          componentUsage['OverviewCard'] = {
            count: cardCount,
            type: 'ui',
            path: 'packages/ui/src/cards/OverviewCard'
          };
        }
      }
    }

    // Check for Button usage in child components
    // Look for specific button props being passed to components
    let buttonCount = 0;

    // Check for specific button callbacks in the tab content
    if (tabName === 'dashboard') {
      // RecentActivity has a clear button (onClear)
      if (tabContent.includes('onClear=')) {
        buttonCount++;
      }
      // Check if logout is visible in this tab (it's in MyHubSection which is global)
      buttonCount++; // For logout button in MyHubSection
    } else if (tabName === 'profile') {
      // ProfileInfoCard has update photo button
      if (tabContent.includes('onUpdatePhoto=')) {
        buttonCount++;
      }
      buttonCount++; // For logout button in MyHubSection (appears on all tabs)
    } else {
      // All other tabs have at least the logout button
      buttonCount = 1;
    }

    if (buttonCount > 0 && imports.has('Button')) {
      componentUsage['Button'] = {
        count: buttonCount,
        type: 'ui',
        path: imports.get('Button')
      };
    } else if (buttonCount > 0) {
      // Even if Button isn't directly imported, it's likely used in child components
      componentUsage['Button'] = {
        count: buttonCount,
        type: 'ui',
        path: 'packages/ui/src/Button'
      };
    }

    if (tabComponents[tabName]) {
      tabComponents[tabName] = componentUsage;
    }
  }

  // Special handling for components used across all tabs
  // Look for components outside conditional blocks (like MyHubSection, Scrollbar)
  const mainContent = content.replace(/activeTab\s*===\s*['"](\w+)['"]\s*\?\s*\(([\s\S]*?)\)\s*:/g, '');
  const globalComponents = {};

  const globalJsxRegex = /<([A-Z][A-Za-z0-9]*)\s*(?:[^>]*)?(?:\/)?>/g;

  while ((match = globalJsxRegex.exec(mainContent)) !== null) {
    const componentName = match[1];

    // Skip React built-ins and check for ui/domain components
    if (!['Fragment', 'Suspense', 'div', 'span'].includes(componentName)) {
      const importPath = imports.get(componentName);
      if (importPath && (importPath.includes('packages/ui') || importPath.includes('packages/domain-widgets'))) {
        const type = importPath.includes('packages/ui') ? 'ui' : 'domain';

        if (!globalComponents[componentName]) {
          globalComponents[componentName] = {
            count: 0,
            type,
            path: importPath
          };
        }
        globalComponents[componentName].count++;
      }
    }
  }

  // Add global components to all tabs
  for (const tab of tabs) {
    if (!tabComponents[tab]) {
      tabComponents[tab] = {};
    }

    // Merge global components
    for (const [compName, compData] of Object.entries(globalComponents)) {
      if (!tabComponents[tab][compName]) {
        tabComponents[tab][compName] = { ...compData };
      } else {
        tabComponents[tab][compName].count += compData.count;
      }
    }
  }

  // Also look for Button components specifically (they might be in child components)
  // Search for common button patterns
  const buttonPatterns = [
    /<Button\s+/g,
    /onClick=\{[^}]+\}/g  // Indicates clickable elements
  ];

  for (const tab of tabs) {
    const tabContentBlock = tabBlocks[tab] || '';

    // Count Button usage
    const buttonMatches = tabContentBlock.match(/<Button\s+/g);
    if (buttonMatches && imports.has('Button')) {
      const importPath = imports.get('Button');
      if (importPath && importPath.includes('packages/ui')) {
        if (!tabComponents[tab]['Button']) {
          tabComponents[tab]['Button'] = {
            count: 0,
            type: 'ui',
            path: importPath
          };
        }
        tabComponents[tab]['Button'].count += buttonMatches.length;
      }
    }
  }

  return tabComponents;
}

function determineComponentType(importPath) {
  if (importPath.includes('@cks/ui') || importPath.includes('packages/ui')) {
    return 'ui';
  }
  if (importPath.includes('@cks/domain-widgets') || importPath.includes('packages/domain-widgets')) {
    return 'domain';
  }
  return 'external';
}

// Main execution
console.log('Starting component analysis...\n');

const manifest = {};

// Analyze each role
for (const [role, hubFile] of Object.entries(hubFiles)) {
  console.log(`Analyzing ${role} hub...`);

  const tabComponents = analyzeHubFile(hubFile, role);
  manifest[role] = {
    tabs: tabComponents,
    tabDefinitions: roleTabs[role] || [] // Include the actual tab definitions
  };

  // Log summary for this role
  for (const [tab, components] of Object.entries(tabComponents)) {
    const componentCount = Object.keys(components).length;
    if (componentCount > 0) {
      const totalUsage = Object.values(components).reduce((sum, c) => sum + c.count, 0);
      console.log(`  ${tab}: ${componentCount} components, ${totalUsage} usages`);
    }
  }
}

// Write manifest to file
const outputPath = path.resolve(__dirname, '../src/component-manifest.json');
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

console.log(`\nComponent manifest generated at: ${outputPath}`);

// Display summary
console.log('\n=== Summary ===');
for (const [role, data] of Object.entries(manifest)) {
  console.log(`\n${role}:`);
  for (const [tab, components] of Object.entries(data.tabs)) {
    const componentCount = Object.keys(components).length;
    const totalUsage = Object.values(components).reduce((sum, c) => sum + c.count, 0);
    if (componentCount > 0) {
      console.log(`  ${tab}: ${componentCount} unique components, ${totalUsage} total usages`);
      // List the components
      for (const [comp, info] of Object.entries(components)) {
        console.log(`    - ${comp} (${info.count}x, ${info.type})`);
      }
    }
  }
}
