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

    // Always add the current hub
    discovered.push({
      name: `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}Hub`,
      location: `Frontend/src/hubs/${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}Hub.tsx`,
      type: 'hub',
      status: 'loaded'
    });

    // Known components (fallback if glob doesn't work)
    const knownComponents = [
      { name: 'MyHubSection', location: 'packages/ui/src/navigation/MyHubSection', type: 'ui' as const },
      { name: 'InfoCard', location: 'packages/ui/src/cards/InfoCard', type: 'ui' as const },
      { name: 'OverviewSection', location: 'packages/domain-widgets/src/overview', type: 'domain' as const },
    ];

    // Add known components
    knownComponents.forEach(comp => {
      discovered.push({
        ...comp,
        status: 'loaded'
      });
    });

    // Try to discover more UI components dynamically
    try {
      const uiModules = import.meta.glob('../../../../packages/ui/src/**/*.tsx', { eager: false });
      Object.keys(uiModules).forEach(path => {
        // Extract component name from path
        const parts = path.split('/');
        const componentFolder = parts[parts.length - 2];
        const fileName = parts[parts.length - 1];

        // Skip test files, stories, and index files
        if (!fileName.includes('.test.') &&
            !fileName.includes('.stories.') &&
            !fileName.includes('index.') &&
            fileName.endsWith('.tsx')) {

          const componentName = fileName.replace('.tsx', '');
          // Only add if it's a main component file and not already in known components
          if ((componentName === componentFolder || fileName === `${componentFolder}.tsx`) &&
              !knownComponents.some(kc => kc.name === componentFolder)) {
            discovered.push({
              name: componentFolder,
              location: `packages/ui/src${path.split('packages/ui/src')[1] || ''}`,
              type: 'ui',
              status: 'loaded'
            });
          }
        }
      });
    } catch (e) {
      console.log('Dynamic UI discovery not available, using known components');
    }

    // Try to discover Domain Widget components dynamically
    try {
      const domainModules = import.meta.glob('../../../../packages/domain-widgets/src/**/*.tsx', { eager: false });
      Object.keys(domainModules).forEach(path => {
        const parts = path.split('/');
        const componentFolder = parts[parts.length - 2];
        const fileName = parts[parts.length - 1];

        if (!fileName.includes('.test.') &&
            !fileName.includes('.stories.') &&
            !fileName.includes('index.') &&
            fileName.endsWith('.tsx')) {

          const componentName = fileName.replace('.tsx', '');
          if ((componentName === componentFolder || fileName === `${componentFolder}.tsx`) &&
              !knownComponents.some(kc => kc.name === componentFolder)) {
            discovered.push({
              name: componentFolder,
              location: `packages/domain-widgets/src${path.split('packages/domain-widgets/src')[1] || ''}`,
              type: 'domain',
              status: 'loaded'
            });
          }
        }
      });
    } catch (e) {
      console.log('Dynamic domain discovery not available, using known components');
    }

    // Try to discover Feature components for current role
    try {
      const featureModules = import.meta.glob('../../features/**/*.tsx', { eager: false });
      Object.keys(featureModules).forEach(path => {
        // Check if it's for the current role or shared
        if (path.includes(`/${selectedRole}/`) || path.includes('/shared/')) {
          const parts = path.split('/');
          const fileName = parts[parts.length - 1];

          if (!fileName.includes('.test.') &&
              !fileName.includes('.stories.') &&
              !fileName.includes('index.') &&
              fileName.endsWith('.tsx')) {

            const componentName = fileName.replace('.tsx', '');
            discovered.push({
              name: componentName,
              location: `Frontend/src/features${path.split('../features')[1] || ''}`,
              type: 'feature',
              status: 'loaded'
            });
          }
        }
      });
    } catch (e) {
      console.log('Dynamic feature discovery not available');
    }

    // Remove duplicates based on name
    const uniqueComponents = discovered.filter((component, index, self) =>
      index === self.findIndex((c) => c.name === component.name)
    );

    setComponents(uniqueComponents);
    setComponentCount(uniqueComponents.length);
  }, [selectedRole]);

  return { components, componentCount };
}