import { useState, useEffect } from 'react';
import componentRegistry from '../component-registry.json';
import componentManifest from '../component-manifest.json';

export interface ComponentInfo {
  name: string;
  path: string;
  type: 'ui' | 'domain' | 'hub';
  file: string;
  usage: Record<string, {
    used: boolean;
    tabs: string[];
    count: number;
  }>;
  isUsed: boolean;
  usedInRoles: string[];
}

export function useComponentRegistry(selectedRole?: string, selectedTab?: string) {
  const [components, setComponents] = useState<ComponentInfo[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<ComponentInfo[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    used: 0,
    byType: {} as Record<string, number>
  });

  useEffect(() => {
    // Process component registry
    const processedComponents: ComponentInfo[] = componentRegistry.components.map(comp => {
      const usedInRoles = Object.keys(comp.usage);
      return {
        ...comp,
        isUsed: usedInRoles.length > 0,
        usedInRoles
      };
    });

    // Calculate stats
    const usedCount = processedComponents.filter(c => c.isUsed).length;
    const byType: Record<string, number> = {};

    processedComponents.forEach(comp => {
      byType[comp.type] = (byType[comp.type] || 0) + 1;
    });

    setComponents(processedComponents);
    setStats({
      total: processedComponents.length,
      used: usedCount,
      byType
    });

    // Filter components based on selection
    let filtered = processedComponents;

    if (selectedRole && selectedRole !== 'all') {
      filtered = filtered.filter(comp => {
        const roleUsage = comp.usage[selectedRole];
        if (!roleUsage) return false;

        if (selectedTab && selectedTab !== 'all') {
          return roleUsage.tabs.includes(selectedTab);
        }

        return true;
      });
    }

    setFilteredComponents(filtered);
  }, [selectedRole, selectedTab]);

  return {
    allComponents: components,
    filteredComponents,
    stats,
    registry: componentRegistry,
    manifest: componentManifest
  };
}