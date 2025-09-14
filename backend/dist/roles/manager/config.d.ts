/**
 * File: config.ts
 *
 * Description: Manager role configuration - capabilities, features, and domain settings
 * Function: Define what domains and features are available to manager role
 * Importance: Single source of truth for manager role permissions and features
 * Connects to: Domain route factories, capability definitions, feature toggles
 */
import { CatalogRouteConfig } from '../../domains/catalog/types';
interface DashboardRouteConfig {
    capabilities: {
        view: string;
        manage: string;
    };
    features: {
        kpis: boolean;
        orders: boolean;
        activity: boolean;
        analytics: boolean;
        clearActivity: boolean;
    };
    scope: string;
    roleCode: string;
}
/**
 * Manager role configuration
 */
export declare const ManagerConfig: {
    /**
     * Role metadata
     */
    role: {
        code: string;
        name: string;
        description: string;
        scope: "ecosystem";
    };
    /**
     * Capabilities for manager role
     */
    capabilities: {
        dashboard: {
            view: string;
            manage: string;
        };
        profile: {
            view: string;
            update: string;
        };
        directory: {
            view: string;
            create: string;
            update: string;
            delete: string;
        };
        services: {
            view: string;
            create: string;
            update: string;
            approve: string;
        };
        orders: {
            view: string;
            create: string;
            update: string;
            approve: string;
            monitor: string;
        };
        reports: {
            view: string;
            create: string;
            export: string;
        };
        support: {
            view: string;
            create: string;
            update: string;
            resolve: string;
        };
        contractors: {
            view: string;
            create: string;
            update: string;
            approve: string;
        };
        customers: {
            view: string;
            monitor: string;
        };
        centers: {
            view: string;
            monitor: string;
        };
        crew: {
            view: string;
            monitor: string;
        };
        catalog: {
            view: string;
        };
    };
    /**
     * Domain configurations for route factories
     */
    domains: {
        dashboard: DashboardRouteConfig;
        profile: {
            capabilities: {
                view: string;
                update: string;
            };
            features: {
                basicInfo: boolean;
                contactInfo: boolean;
                preferences: boolean;
                security: boolean;
            };
            scope: string;
            roleCode: string;
        };
        directory: {
            capabilities: {
                view: string;
                create: string;
                update: string;
                delete: string;
            };
            features: {
                contractors: boolean;
                customers: boolean;
                centers: boolean;
                crew: boolean;
                search: boolean;
                filters: boolean;
                export: boolean;
            };
            scope: string;
            roleCode: string;
        };
        services: {
            capabilities: {
                view: string;
                create: string;
                update: string;
                approve: string;
            };
            features: {
                catalog: boolean;
                pricing: boolean;
                approval: boolean;
                templates: boolean;
            };
            scope: string;
            roleCode: string;
        };
        orders: {
            capabilities: {
                view: string;
                create: string;
                update: string;
                approve: string;
                monitor: string;
            };
            features: {
                listing: boolean;
                details: boolean;
                statusTracking: boolean;
                approval: boolean;
                analytics: boolean;
            };
            scope: string;
            roleCode: string;
        };
        reports: {
            capabilities: {
                view: string;
                create: string;
                export: string;
            };
            features: {
                performance: boolean;
                financial: boolean;
                operational: boolean;
                custom: boolean;
                scheduling: boolean;
            };
            scope: string;
            roleCode: string;
        };
        support: {
            capabilities: {
                view: string;
                create: string;
                update: string;
                resolve: string;
            };
            features: {
                tickets: boolean;
                knowledge: boolean;
                escalation: boolean;
                analytics: boolean;
            };
            scope: string;
            roleCode: string;
        };
        catalog: CatalogRouteConfig;
    };
    /**
     * Feature flags for manager role
     */
    features: {
        multiTenancy: boolean;
        realtimeNotifications: boolean;
        advancedReporting: boolean;
        dataExport: boolean;
        aiInsights: boolean;
        predictiveAnalytics: boolean;
        mobileSync: boolean;
        thirdPartyIntegrations: boolean;
        apiAccess: boolean;
        webhooks: boolean;
    };
    /**
     * UI customization for manager role
     */
    ui: {
        theme: string;
        layout: string;
        density: string;
        showAdvancedFilters: boolean;
        defaultPageSize: number;
        enableBulkActions: boolean;
    };
    /**
     * Rate limiting and quotas
     */
    limits: {
        apiCallsPerHour: number;
        exportSizeMB: number;
        concurrentSessions: number;
        dataRetentionDays: number;
    };
};
/**
 * Helper to get all capabilities as a flat array
 */
export declare function getManagerCapabilities(): string[];
/**
 * Check if manager has specific capability
 */
export declare function hasCapability(capability: string): boolean;
export {};
//# sourceMappingURL=config.d.ts.map