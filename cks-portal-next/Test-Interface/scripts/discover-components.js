#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Component discovery configuration
const componentDirs = [
  {
    path: '../../packages/ui/src',
    type: 'ui',
    recursive: true
  },
  {
    path: '../../packages/domain-widgets/src',
    type: 'domain',
    recursive: true
  },
  {
    path: '../../packages/domain-widgets',
    type: 'domain',
    recursive: false,
    pattern: '*.tsx'
  }
];

// Hub files to analyze for usage
const hubFiles = {
  admin: '../../Frontend/src/hubs/AdminHub.tsx',
  manager: '../../Frontend/src/hubs/ManagerHub.tsx',
  contractor: '../../Frontend/src/hubs/ContractorHub.tsx',
  customer: '../../Frontend/src/hubs/CustomerHub.tsx',
  center: '../../Frontend/src/hubs/CenterHub.tsx',
  crew: '../../Frontend/src/hubs/CrewHub.tsx',
  warehouse: '../../Frontend/src/hubs/WarehouseHub.tsx',
};

function discoverComponentsInDirectory(dirConfig) {
  const components = [];
  const fullPath = path.resolve(__dirname, dirConfig.path);

  if (!fs.existsSync(fullPath)) {
    console.warn(`Directory not found: ${fullPath}`);
    return components;
  }

  function scanDirectory(dir, baseDir = '') {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory() && dirConfig.recursive) {
        // Check if this is a component directory (has a .tsx file with same name or index.tsx)
        const componentFile = path.join(itemPath, `${item}.tsx`);
        const indexFile = path.join(itemPath, 'index.tsx');
        const indexTsFile = path.join(itemPath, 'index.ts');

        if (fs.existsSync(componentFile)) {
          components.push({
            name: item,
            path: path.relative(path.resolve(__dirname, '../..'), componentFile).replace(/\\/g, '/'),
            type: dirConfig.type,
            file: `${item}.tsx`
          });
        } else if (fs.existsSync(indexFile)) {
          // Check if index.tsx exports a component or just re-exports
          const indexContent = fs.readFileSync(indexFile, 'utf8');
          if (!indexContent.includes('export *') && !indexContent.includes('export {')) {
            components.push({
              name: item,
              path: path.relative(path.resolve(__dirname, '../..'), indexFile).replace(/\\/g, '/'),
              type: dirConfig.type,
              file: 'index.tsx'
            });
          }
        }

        // Recursively scan subdirectories
        scanDirectory(itemPath, path.join(baseDir, item));
      } else if (stat.isFile() && item.endsWith('.tsx')) {
        // Handle standalone .tsx files
        const fileName = item.replace('.tsx', '');

        // Skip index files, test files, and story files
        if (fileName === 'index' || fileName.includes('.test') || fileName.includes('.stories')) {
          continue;
        }

        // Check if this is a root-level component file (not in a folder)
        const parentDirName = path.basename(dir);
        const isRootLevel = dir === fullPath;

        if (isRootLevel || !components.some(c => c.name === fileName)) {
          components.push({
            name: fileName,
            path: path.relative(path.resolve(__dirname, '../..'), itemPath).replace(/\\/g, '/'),
            type: dirConfig.type,
            file: item
          });
        }
      }
    }
  }

  scanDirectory(fullPath);
  return components;
}

function analyzeHubUsage(components) {
  const usage = {};

  for (const [role, hubFile] of Object.entries(hubFiles)) {
    const fullPath = path.resolve(__dirname, hubFile);

    if (!fs.existsSync(fullPath)) {
      console.warn(`Hub file not found: ${fullPath}`);
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    usage[role] = {};

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

    usage[role].tabs = tabs;
    usage[role].components = {};

    // Check which components are used
    for (const component of components) {
      const componentName = component.name;

      // Check for various import patterns
      const importPatterns = [
        `import ${componentName}`,
        `import.*{.*${componentName}.*}`,
        `<${componentName}`,
        `${componentName}>`,
      ];

      // Special case: Some components are sub-components of others
      // Mark them as used if their parent is used
      const parentChildMap = {
        'ProfileInfoCard': ['ProfileTab', 'AccountManagerTab', 'SettingsTab'],
        'RecentActivity': ['ActivityItem'],
        'OverviewSection': ['OverviewCard']
      };

      let isUsed = importPatterns.some(pattern => {
        const regex = new RegExp(pattern, 'g');
        return regex.test(content);
      });

      // Check if this is a child component of a used parent
      if (!isUsed) {
        for (const [parent, children] of Object.entries(parentChildMap)) {
          if (children.includes(componentName)) {
            // Check if parent is used
            const parentPatterns = [
              `import ${parent}`,
              `import.*{.*${parent}.*}`,
              `<${parent}`,
              `${parent}>`,
            ];
            isUsed = parentPatterns.some(pattern => {
              const regex = new RegExp(pattern, 'g');
              return regex.test(content);
            });
            if (isUsed) break;
          }
        }
      }

      if (isUsed) {
        // Try to determine which tabs use this component
        const tabUsage = [];
        for (const tab of tabs) {
          // Look for component usage within tab-specific rendering
          const tabPattern = new RegExp(`activeTab\\s*===\\s*['"]${tab}['"][\\s\\S]*?<${componentName}`, 'g');
          if (tabPattern.test(content)) {
            tabUsage.push(tab);
          }
        }

        usage[role].components[componentName] = {
          used: true,
          tabs: tabUsage.length > 0 ? tabUsage : tabs, // If can't determine specific tabs, assume all
          count: (content.match(new RegExp(`<${componentName}`, 'g')) || []).length
        };
      }
    }
  }

  return usage;
}

function main() {
  console.log('🔍 Discovering components...');

  // Discover all components
  let allComponents = [];
  for (const dirConfig of componentDirs) {
    const components = discoverComponentsInDirectory(dirConfig);
    allComponents = [...allComponents, ...components];
    console.log(`Found ${components.length} components in ${dirConfig.path}`);
  }

  // Remove duplicates (keep first occurrence)
  const uniqueComponents = [];
  const seen = new Set();
  for (const comp of allComponents) {
    if (!seen.has(comp.name)) {
      uniqueComponents.push(comp);
      seen.add(comp.name);
    }
  }

  console.log(`Total unique components: ${uniqueComponents.length}`);

  // Analyze hub usage
  console.log('📊 Analyzing hub usage...');
  const usage = analyzeHubUsage(uniqueComponents);

  // Create component registry
  const registry = {
    components: uniqueComponents.map(comp => ({
      ...comp,
      usage: {}
    })),
    hubs: usage,
    generated: new Date().toISOString()
  };

  // Add usage info to each component
  for (const comp of registry.components) {
    for (const [role, roleData] of Object.entries(usage)) {
      const compUsage = roleData.components[comp.name];
      if (compUsage) {
        comp.usage[role] = compUsage;
      }
    }
  }

  // Write component registry
  const outputPath = path.resolve(__dirname, '../src/component-registry.json');
  fs.writeFileSync(outputPath, JSON.stringify(registry, null, 2));

  console.log(`✅ Component registry written to ${outputPath}`);
  console.log('\nComponent Summary:');
  console.log('=================');

  // Print summary
  const usedComponents = registry.components.filter(c => Object.keys(c.usage).length > 0);
  console.log(`Total components: ${registry.components.length}`);
  console.log(`Used components: ${usedComponents.length}`);
  console.log(`Unused components: ${registry.components.length - usedComponents.length}`);

  console.log('\nComponents by type:');
  const byType = {};
  for (const comp of registry.components) {
    byType[comp.type] = (byType[comp.type] || 0) + 1;
  }
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count}`);
  }

  // List components not being detected
  console.log('\nComponents discovered:');
  for (const comp of registry.components) {
    const usageCount = Object.keys(comp.usage).length;
    const status = usageCount > 0 ? `✓ Used in ${usageCount} hubs` : '✗ Not detected in hubs';
    console.log(`  ${comp.name}: ${status}`);
  }
}

main();