/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: useComponentDiscovery.ts
 *
 * Description:
 * Hook for automatic component discovery using Vite's import.meta.glob
 *
 * Responsibilities:
 * - Automatically discover all components in packages
 * - Track component locations and types
 * - Update when new components are added
 * - No manual registration required
 *
 * Role in system:
 * - Provides real-time component inventory for test interface
 *
 * Notes:
 * Uses Vite's glob imports for zero-maintenance discovery
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import { useState, useEffect } from 'react';

export interface ComponentInfo {
  name: string;
  location: string;
  type: 'hub' | 'ui' | 'domain' | 'feature';
  status: 'loaded' | 'pending' | 'error';
}

export function useComponentDiscovery(selectedRole: string) {
  const [components, setComponents] = useState<ComponentInfo[]>([]);
  const [componentCount, setComponentCount] = useState(0);

  useEffect(() => {
    const discovered: ComponentInfo[] = [];

    // Track already discovered component names to avoid duplicates
    const discoveredNames = new Set<string>();

    // Always add the current hub
    const hubName = `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}Hub`;
    discovered.push({
      name: hubName,
      location: `Frontend/src/hubs/${hubName}.tsx`,
      type: 'hub',
      status: 'loaded'
    });
    discoveredNames.add(hubName);

    // Discover UI components dynamically
    try {
      const uiModules = import.meta.glob('../../../../packages/ui/src/**/*.tsx', { eager: false });
      Object.keys(uiModules).forEach(path => {
        // Skip test files, stories, and index files
        if (path.includes('.test.') || path.includes('.stories.') || path.includes('/index.')) {
          return;
        }

        // Extract meaningful component name from the path
        const cleanPath = path.replace('../../../../packages/ui/src/', '');
        const parts = cleanPath.split('/');

        // Look for main component files (e.g., InfoCard/InfoCard.tsx or MyComponent.tsx)
        const fileName = parts[parts.length - 1].replace('.tsx', '');

        // Determine component name based on path structure
        let componentName = '';
        let componentPath = '';

        if (parts.length >= 2) {
          // Nested component (e.g., cards/InfoCard/InfoCard.tsx)
          const folderName = parts[parts.length - 2];
          if (fileName === folderName || fileName === 'index') {
            componentName = folderName;
            componentPath = cleanPath.substring(0, cleanPath.lastIndexOf('/'));
          } else if (parts.length === 2 && fileName !== 'index') {
            // Direct file in category folder (e.g., navigation/MyHubSection.tsx)
            componentName = fileName;
            componentPath = cleanPath.replace('.tsx', '');
          }
        } else if (parts.length === 1 && fileName !== 'index') {
          // Root level component
          componentName = fileName;
          componentPath = cleanPath.replace('.tsx', '');
        }

        // Add if we found a valid component and haven't seen it before
        if (componentName && !discoveredNames.has(componentName)) {
          discovered.push({
            name: componentName,
            location: `packages/ui/src/${componentPath}`,
            type: 'ui',
            status: 'loaded'
          });
          discoveredNames.add(componentName);
        }
      });
    } catch (e) {
      console.log('Dynamic UI discovery error:', e);
    }

    // Discover Domain Widget components dynamically
    try {
      const domainModules = import.meta.glob('../../../../packages/domain-widgets/src/**/*.tsx', { eager: false });
      console.log('[Component Discovery] Found domain module paths:', Object.keys(domainModules));
      Object.keys(domainModules).forEach(path => {
        // Skip test files, stories, and index files
        if (path.includes('.test.') || path.includes('.stories.') || path.includes('/index.')) {
          return;
        }

        // Extract meaningful component name from the path
        const cleanPath = path.replace('../../../../packages/domain-widgets/src/', '');
        const parts = cleanPath.split('/');

        // Look for main component files
        const fileName = parts[parts.length - 1].replace('.tsx', '');

        // Determine component name based on path structure
        let componentName = '';
        let componentPath = '';

        if (parts.length >= 2) {
          // Could be nested like activity/RecentActivity/RecentActivity.tsx
          const folderName = parts[parts.length - 2];
          if (fileName === folderName) {
            // This is the main component file
            componentName = folderName;
            componentPath = cleanPath.substring(0, cleanPath.lastIndexOf('/'));
          } else if (parts.length === 3 && parts[1] === folderName && fileName === folderName) {
            // Deep nesting like activity/RecentActivity/RecentActivity.tsx
            componentName = folderName;
            componentPath = cleanPath.substring(0, cleanPath.lastIndexOf('/'));
          } else if (parts.length === 1 || (parts.length === 2 && fileName !== 'index')) {
            // Simple structure like overview/OverviewSection.tsx or OverviewSection.tsx
            componentName = fileName;
            componentPath = cleanPath.replace('.tsx', '');
          }
        } else if (fileName !== 'index') {
          // Root level component
          componentName = fileName;
          componentPath = cleanPath.replace('.tsx', '');
        }

        // Add if we found a valid component and haven't seen it before
        if (componentName && !discoveredNames.has(componentName)) {
          console.log('[Component Discovery] Adding domain component:', componentName, 'at', componentPath);
          discovered.push({
            name: componentName,
            location: `packages/domain-widgets/src/${componentPath}`,
            type: 'domain',
            status: 'loaded'
          });
          discoveredNames.add(componentName);
        }
      });
    } catch (e) {
      console.log('Dynamic domain discovery error:', e);
    }

    // Discover Feature components for current role
    try {
      const featureModules = import.meta.glob('../../features/**/*.tsx', { eager: false });
      Object.keys(featureModules).forEach(path => {
        // Check if it's for the current role or shared
        if (path.includes(`/${selectedRole}/`) || path.includes('/shared/')) {
          if (path.includes('.test.') || path.includes('.stories.') || path.includes('/index.')) {
            return;
          }

          const cleanPath = path.replace('../../features/', '');
          const parts = cleanPath.split('/');
          const fileName = parts[parts.length - 1].replace('.tsx', '');

          if (fileName && !discoveredNames.has(fileName)) {
            discovered.push({
              name: fileName,
              location: `Frontend/src/features/${cleanPath}`,
              type: 'feature',
              status: 'loaded'
            });
            discoveredNames.add(fileName);
          }
        }
      });
    } catch (e) {
      console.log('Dynamic feature discovery error:', e);
    }

    console.log('[Component Discovery] Total discovered:', discovered.length, 'components');
    console.log('[Component Discovery] Components:', discovered.map(c => `${c.name} (${c.type})`).join(', '));

    setComponents(discovered);
    setComponentCount(discovered.length);
  }, [selectedRole]);

  return { components, componentCount };
}