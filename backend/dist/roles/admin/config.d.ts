/**
 * File: config.ts
 *
 * Description: Admin role configuration - global system capabilities and features
 * Function: Define admin role permissions spanning all domains and entities
 * Importance: Highest privilege configuration with system-wide access
 * Connects to: All domain route factories, global capability definitions
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
 * Admin role configuration
 */
export declare const AdminConfig: {
    /**
     * Role metadata
     */
    role: {
        code: string;
        name: string;
        description: string;
        scope: "global";
    };
    /**
     * Capabilities for admin role (comprehensive system access)
     */
    capabilities: {
        dashboard: {
            view: string;
            manage: string;
            admin: string;
        };
        profile: {
            view: string;
            update: string;
            admin: string;
        };
        directory: {
            view: string;
            create: string;
            update: string;
            delete: string;
            archive: string;
            admin: string;
        };
        users: {
            view: string;
            create: string;
            update: string;
            delete: string;
            archive: string;
            impersonate: string;
        };
        services: {
            view: string;
            create: string;
            update: string;
            delete: string;
            approve: string;
            admin: string;
        };
        orders: {
            view: string;
            create: string;
            update: string;
            delete: string;
            approve: string;
            monitor: string;
            admin: string;
        };
        reports: {
            view: string;
            create: string;
            update: string;
            delete: string;
            export: string;
            admin: string;
        };
        support: {
            view: string;
            create: string;
            update: string;
            delete: string;
            resolve: string;
            admin: string;
        };
        assignments: {
            view: string;
            create: string;
            update: string;
            delete: string;
            approve: string;
            admin: string;
        };
        archive: {
            view: string;
            restore: string;
            purge: string;
            admin: string;
        };
        system: {
            config: string;
            maintenance: string;
            backup: string;
            audit: string;
            monitoring: string;
        };
        permissions: {
            view: string;
            create: string;
            update: string;
            delete: string;
            assign: string;
        };
        contractors: {
            view: string;
            create: string;
            update: string;
            delete: string;
            approve: string;
            admin: string;
        };
        customers: {
            view: string;
            create: string;
            update: string;
            delete: string;
            admin: string;
        };
        centers: {
            view: string;
            create: string;
            update: string;
            delete: string;
            admin: string;
        };
        crew: {
            view: string;
            create: string;
            update: string;
            delete: string;
            admin: string;
        };
        warehouses: {
            view: string;
            create: string;
            update: string;
            delete: string;
            admin: string;
        };
        managers: {
            view: string;
            create: string;
            update: string;
            delete: string;
            admin: string;
        };
        catalog: {
            view: string;
            create: string;
            update: string;
            delete: string;
            admin: string;
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
                admin: string;
            };
            features: {
                basicInfo: boolean;
                contactInfo: boolean;
                preferences: boolean;
                security: boolean;
                systemSettings: boolean;
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
                admin: string;
            };
            features: {
                contractors: boolean;
                customers: boolean;
                centers: boolean;
                crew: boolean;
                warehouses: boolean;
                managers: boolean;
                search: boolean;
                filters: boolean;
                export: boolean;
                import: boolean;
                bulkActions: boolean;
            };
            scope: string;
            roleCode: string;
        };
        create: {
            capabilities: {
                view: string;
                create: string;
                update: string;
                delete: string;
            };
            features: {
                users: boolean;
                roles: boolean;
                permissions: boolean;
                templates: boolean;
                bulkCreate: boolean;
                import: boolean;
            };
            scope: string;
            roleCode: string;
        };
        assign: {
            capabilities: {
                view: string;
                create: string;
                update: string;
                delete: string;
                admin: string;
            };
            features: {
                smartAssignment: boolean;
                bulkAssignment: boolean;
                automation: boolean;
                rules: boolean;
                analytics: boolean;
            };
            scope: string;
            roleCode: string;
        };
        archive: {
            capabilities: {
                view: string;
                restore: string;
                purge: string;
                admin: string;
            };
            features: {
                browse: boolean;
                search: boolean;
                restore: boolean;
                purge: boolean;
                analytics: boolean;
            };
            scope: string;
            roleCode: string;
        };
        support: {
            capabilities: {
                view: string;
                create: string;
                update: string;
                delete: string;
                resolve: string;
                admin: string;
            };
            features: {
                tickets: boolean;
                knowledge: boolean;
                escalation: boolean;
                analytics: boolean;
                automation: boolean;
                sla: boolean;
            };
            scope: string;
            roleCode: string;
        };
        catalog: CatalogRouteConfig;
    };
    /**
     * Feature flags for admin role (all enabled)
     */
    features: {
        multiTenancy: boolean;
        realtimeNotifications: boolean;
        advancedReporting: boolean;
        dataExport: boolean;
        dataImport: boolean;
        bulkOperations: boolean;
        systemMonitoring: boolean;
        auditTrails: boolean;
        configManagement: boolean;
        backupRestore: boolean;
        userImpersonation: boolean;
        maintenanceMode: boolean;
        aiInsights: boolean;
        predictiveAnalytics: boolean;
        mobileSync: boolean;
        advancedSecurity: boolean;
        thirdPartyIntegrations: boolean;
        apiAccess: boolean;
        webhooks: boolean;
        sso: boolean;
        ldap: boolean;
    };
    /**
     * UI customization for admin role
     */
    ui: {
        theme: string;
        layout: string;
        density: string;
        showAdvancedFilters: boolean;
        showSystemInfo: boolean;
        defaultPageSize: number;
        enableBulkActions: boolean;
        showDebugInfo: boolean;
    };
    /**
     * Rate limiting and quotas (higher limits for admin)
     */
    limits: {
        apiCallsPerHour: number;
        exportSizeMB: number;
        concurrentSessions: number;
        dataRetentionDays: number;
        bulkOperationSize: number;
    };
};
/**
 * Helper to get all admin capabilities as a flat array
 */
export declare function getAdminCapabilities(): string[];
/**
 * Check if admin has specific capability (should always be true)
 */
export declare function hasCapability(capability: string): boolean;
export {};
//# sourceMappingURL=config.d.ts.map