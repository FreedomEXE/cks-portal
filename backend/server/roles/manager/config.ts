/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: config.ts
 *
 * Description: Manager role configuration - capabilities, features, and domain settings
 * Function: Define what domains and features are available to manager role
 * Importance: Single source of truth for manager role permissions and features
 * Connects to: Domain route factories, capability definitions, feature toggles
 */

import { DashboardRouteConfig } from '../../domains/dashboard/routes.factory';
import { CatalogRouteConfig } from '../../domains/catalog/types';

/**
 * Manager role configuration
 */
export const ManagerConfig = {
  /**
   * Role metadata
   */
  role: {
    code: 'manager',
    name: 'Manager',
    description: 'CKS Network Manager - oversees contractor ecosystems',
    scope: 'ecosystem' as const
  },

  /**
   * Capabilities for manager role
   */
  capabilities: {
    // Dashboard permissions
    dashboard: {
      view: 'dashboard:view',
      manage: 'dashboard:manage'
    },

    // Profile permissions
    profile: {
      view: 'profile:view',
      update: 'profile:update'
    },

    // Directory/ecosystem permissions
    directory: {
      view: 'directory:view',
      create: 'directory:create',
      update: 'directory:update',
      delete: 'directory:delete'
    },

    // Services management
    services: {
      view: 'services:view',
      create: 'services:create',
      update: 'services:update',
      approve: 'services:approve'
    },

    // Orders oversight
    orders: {
      view: 'orders:view',
      create: 'orders:create',
      update: 'orders:update',
      approve: 'orders:approve',
      monitor: 'orders:monitor'
    },

    // Reports and analytics
    reports: {
      view: 'reports:view',
      create: 'reports:create',
      export: 'reports:export'
    },

    // Support management
    support: {
      view: 'support:view',
      create: 'support:create',
      update: 'support:update',
      resolve: 'support:resolve'
    },

    // Contractor management
    contractors: {
      view: 'contractors:view',
      create: 'contractors:create',
      update: 'contractors:update',
      approve: 'contractors:approve'
    },

    // Customer oversight
    customers: {
      view: 'customers:view',
      monitor: 'customers:monitor'
    },

    // Center monitoring
    centers: {
      view: 'centers:view',
      monitor: 'centers:monitor'
    },

    // Crew oversight
    crew: {
      view: 'crew:view',
      monitor: 'crew:monitor'
    },

    // Catalog access
    catalog: {
      view: 'catalog:view'
    }
  },

  /**
   * Domain configurations for route factories
   */
  domains: {
    dashboard: {
      capabilities: {
        view: 'dashboard:view',
        manage: 'dashboard:manage'
      },
      features: {
        kpis: true,
        orders: true,
        activity: true,
        analytics: true,
        clearActivity: true
      },
      scope: 'ecosystem',
      roleCode: 'manager'
    } as DashboardRouteConfig,

    profile: {
      capabilities: {
        view: 'profile:view',
        update: 'profile:update'
      },
      features: {
        basicInfo: true,
        contactInfo: true,
        preferences: true,
        security: true
      },
      scope: 'entity',
      roleCode: 'manager'
    },

    directory: {
      capabilities: {
        view: 'directory:view',
        create: 'directory:create',
        update: 'directory:update',
        delete: 'directory:delete'
      },
      features: {
        contractors: true,
        customers: true,
        centers: true,
        crew: true,
        search: true,
        filters: true,
        export: true
      },
      scope: 'ecosystem',
      roleCode: 'manager'
    },

    services: {
      capabilities: {
        view: 'services:view',
        create: 'services:create',
        update: 'services:update',
        approve: 'services:approve'
      },
      features: {
        catalog: true,
        pricing: true,
        approval: true,
        templates: true
      },
      scope: 'ecosystem',
      roleCode: 'manager'
    },

    orders: {
      capabilities: {
        view: 'orders:view',
        create: 'orders:create',
        update: 'orders:update',
        approve: 'orders:approve',
        monitor: 'orders:monitor'
      },
      features: {
        listing: true,
        details: true,
        statusTracking: true,
        approval: true,
        analytics: true
      },
      scope: 'ecosystem',
      roleCode: 'manager'
    },

    reports: {
      capabilities: {
        view: 'reports:view',
        create: 'reports:create',
        export: 'reports:export'
      },
      features: {
        performance: true,
        financial: true,
        operational: true,
        custom: true,
        scheduling: true
      },
      scope: 'ecosystem',
      roleCode: 'manager'
    },

    support: {
      capabilities: {
        view: 'support:view',
        create: 'support:create',
        update: 'support:update',
        resolve: 'support:resolve'
      },
      features: {
        tickets: true,
        knowledge: true,
        escalation: true,
        analytics: true
      },
      scope: 'ecosystem',
      roleCode: 'manager'
    },

    catalog: {
      capabilities: {
        view: 'catalog:view'
      },
      features: {
        browse: true,
        search: true,
        categories: true,
        myServices: false // Managers don't manage contractor services
      }
    } as CatalogRouteConfig
  },

  /**
   * Feature flags for manager role
   */
  features: {
    // Core features
    multiTenancy: true,
    realtimeNotifications: true,
    advancedReporting: true,
    dataExport: true,

    // Experimental features
    aiInsights: false,
    predictiveAnalytics: false,
    mobileSync: true,

    // Integration features
    thirdPartyIntegrations: true,
    apiAccess: true,
    webhooks: true
  },

  /**
   * UI customization for manager role
   */
  ui: {
    theme: 'professional',
    layout: 'sidebar',
    density: 'comfortable',
    showAdvancedFilters: true,
    defaultPageSize: 20,
    enableBulkActions: true
  },

  /**
   * Rate limiting and quotas
   */
  limits: {
    apiCallsPerHour: 1000,
    exportSizeMB: 100,
    concurrentSessions: 5,
    dataRetentionDays: 365
  }
};

/**
 * Helper to get all capabilities as a flat array
 */
export function getManagerCapabilities(): string[] {
  const caps: string[] = [];

  function extractCaps(obj: any) {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        caps.push(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        extractCaps(obj[key]);
      }
    }
  }

  extractCaps(ManagerConfig.capabilities);
  return [...new Set(caps)]; // Remove duplicates
}

/**
 * Check if manager has specific capability
 */
export function hasCapability(capability: string): boolean {
  return getManagerCapabilities().includes(capability);
}