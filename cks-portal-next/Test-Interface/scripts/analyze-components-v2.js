#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hub files to analyze
const hubFiles = {
  admin: '../../Frontend/src/hubs/AdminHub.tsx',
  manager: '../../Frontend/src/hubs/ManagerHub.tsx',
  contractor: '../../Frontend/src/hubs/ContractorHub.tsx',
  customer: '../../Frontend/src/hubs/CustomerHub.tsx',
  center: '../../Frontend/src/hubs/CenterHub.tsx',
  crew: '../../Frontend/src/hubs/CrewHub.tsx',
  warehouse: '../../Frontend/src/hubs/WarehouseHub.tsx',
};

function extractTabContent(content, tabName) {
  // Try to extract the specific tab's JSX content
  // Pattern 1: activeTab === 'tabname' ? ( ... ) :
  const pattern1 = new RegExp(
    `activeTab\\s*===\\s*['"]${tabName}['"]\\s*\\?\\s*\\(([\\s\\S]*?)\\)\\s*:\\s*(?:activeTab|\\()`,
    'g'
  );

  // Pattern 2: Simpler pattern for last tab
  const pattern2 = new RegExp(
    `activeTab\\s*===\\s*['"]${tabName}['"]\\s*\\?\\s*\\(([\\s\\S]*?)\\)\\s*:\\s*\\(`,
    'g'
  );

  // Pattern 3: For else blocks (default tab content)
  const pattern3 = new RegExp(
    `\\)\\s*:\\s*\\(([\\s\\S]*?)\\)\\s*\\}\\s*<\\/`,
    'g'
  );

  let match = pattern1.exec(content);
  if (match) {
    return match[1];
  }

  content = content.replace(pattern1, ''); // Remove already matched patterns
  match = pattern2.exec(content);
  if (match) {
    return match[1];
  }

  // Special case for dashboard (often the first/default tab)
  if (tabName === 'dashboard') {
    const dashboardPattern = /activeTab\s*===\s*['"]dashboard['"]\s*\?\s*\(([\s\S]*?)\)\s*:/;
    match = dashboardPattern.exec(content);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function countComponentsInJSX(jsx, componentName, excludePatterns = []) {
  if (!jsx) return 0;

  let count = 0;

  // Create a cleaned version of JSX that excludes certain patterns
  let cleanedJSX = jsx;

  // Remove render function definitions (these contain nested components we shouldn't count)
  cleanedJSX = cleanedJSX.replace(/render:\s*\([^)]*\)\s*=>\s*\([^)]*\)/g, '');
  cleanedJSX = cleanedJSX.replace(/render:\s*\([^)]*\)\s*=>\s*{[^}]*}/g, '');

  // Remove column definitions that might contain Button components
  cleanedJSX = cleanedJSX.replace(/columns:\s*\[[^\]]*\]/gs, '');

  // Remove data arrays that might contain JSX
  cleanedJSX = cleanedJSX.replace(/data:\s*\[[^\]]*\]/gs, '');

  // Count actual component usage
  const componentRegex = new RegExp(`<${componentName}(?:\\s|>|/)`, 'g');
  const matches = cleanedJSX.match(componentRegex);

  if (matches) {
    count = matches.length;
  }

  return count;
}

function analyzeHubFile(filePath, role) {
  const fullPath = path.resolve(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${fullPath}`);
    return {};
  }

  const content = fs.readFileSync(fullPath, 'utf8');

  // Extract tabs
  const tabsRegex = /const\s+tabs\s*=\s*\[([\s\S]*?)\];/;
  const tabsMatch = content.match(tabsRegex);
  const tabs = [];

  if (tabsMatch) {
    const tabsContent = tabsMatch[1];
    const tabItemRegex = /\{\s*id:\s*['"](\w+)['"]/g;
    let tabMatch;
    while ((tabMatch = tabItemRegex.exec(tabsContent)) !== null) {
      tabs.push(tabMatch[1]);
    }
  }

  // Extract imports to understand what components are available
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

  // Analyze each tab
  const tabComponents = {};

  for (const tabName of tabs) {
    const tabContent = extractTabContent(content, tabName);
    const components = {};

    if (tabContent) {
      // Count each imported component in this tab's content
      for (const [compName, importPath] of imports) {
        // Skip non-component imports
        if (!importPath.includes('packages/ui') && !importPath.includes('packages/domain-widgets')) {
          continue;
        }

        const count = countComponentsInJSX(tabContent, compName);

        if (count > 0) {
          components[compName] = {
            count,
            type: importPath.includes('packages/ui') ? 'ui' : 'domain',
            path: importPath
          };
        }
      }

      // Special case: Check for NavigationTab and TabContainer in specific tabs
      if (tabName === 'directory' || tabName === 'services') {
        // These tabs typically have NavigationTab for sub-navigation
        if (tabContent.includes('<NavigationTab')) {
          const navTabCount = (tabContent.match(/<NavigationTab/g) || []).length;
          if (navTabCount > 0 && imports.has('NavigationTab')) {
            components['NavigationTab'] = {
              count: navTabCount,
              type: 'ui',
              path: imports.get('NavigationTab')
            };
          }
        }

        if (tabContent.includes('<TabContainer')) {
          const tabContainerCount = (tabContent.match(/<TabContainer/g) || []).length;
          if (tabContainerCount > 0 && imports.has('TabContainer')) {
            components['TabContainer'] = {
              count: tabContainerCount,
              type: 'ui',
              path: imports.get('TabContainer')
            };
          }
        }
      }

      // Special handling for DataTable - don't count buttons inside it
      if (tabContent.includes('<DataTable')) {
        // Remove DataTable configurations before counting buttons
        let cleanedContent = tabContent;

        // Remove columns prop content (which contains Button renders)
        cleanedContent = cleanedContent.replace(/columns=\{[\s\S]*?\}\]/g, 'columns={[]}');

        // Now count buttons in the cleaned content
        if (imports.has('Button')) {
          const buttonCount = countComponentsInJSX(cleanedContent, 'Button');
          if (buttonCount > 0) {
            components['Button'] = {
              count: buttonCount,
              type: 'ui',
              path: imports.get('Button')
            };
          }
        }
      } else {
        // Normal button counting for non-DataTable tabs
        if (imports.has('Button')) {
          const buttonCount = countComponentsInJSX(tabContent, 'Button');
          if (buttonCount > 0) {
            components['Button'] = {
              count: buttonCount,
              type: 'ui',
              path: imports.get('Button')
            };
          }
        }
      }
    }

    tabComponents[tabName] = components;
  }

  // Handle components that appear outside tab conditionals (like MyHubSection, Scrollbar)
  // These appear once per hub, not per tab
  const globalComponents = ['MyHubSection', 'Scrollbar'];

  for (const compName of globalComponents) {
    if (imports.has(compName)) {
      const regex = new RegExp(`<${compName}`, 'g');
      const matches = content.match(regex);

      if (matches && matches.length > 0) {
        // Add to dashboard tab (or first tab) since they're always visible
        const firstTab = tabs[0] || 'dashboard';
        if (!tabComponents[firstTab]) {
          tabComponents[firstTab] = {};
        }

        tabComponents[firstTab][compName] = {
          count: matches.length,
          type: imports.get(compName).includes('packages/ui') ? 'ui' : 'domain',
          path: imports.get(compName)
        };
      }
    }
  }

  return {
    tabs,
    tabComponents
  };
}

function main() {
  console.log('🔍 Analyzing component usage in hubs (v2)...');

  const manifest = {};

  for (const [role, hubFile] of Object.entries(hubFiles)) {
    console.log(`Analyzing ${role} hub...`);
    const analysis = analyzeHubFile(hubFile, role);

    manifest[role] = {
      tabDefinitions: analysis.tabs,
      tabs: analysis.tabComponents
    };
  }

  // Write the manifest
  const outputPath = path.resolve(__dirname, '../src/component-manifest-v2.json');
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

  console.log(`✅ Component manifest v2 written to ${outputPath}`);

  // Print summary
  console.log('\nSummary:');
  for (const [role, data] of Object.entries(manifest)) {
    console.log(`\n${role}:`);
    for (const [tab, components] of Object.entries(data.tabs)) {
      const componentCount = Object.keys(components).length;
      const totalUsage = Object.values(components).reduce((sum, comp) => sum + comp.count, 0);
      console.log(`  ${tab}: ${componentCount} components, ${totalUsage} total usages`);
    }
  }
}

main();