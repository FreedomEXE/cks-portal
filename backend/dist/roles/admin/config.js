"use strict";
/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminConfig = void 0;
exports.getAdminCapabilities = getAdminCapabilities;
exports.hasCapability = hasCapability;
/**
 * Admin role configuration
 */
exports.AdminConfig = {
    /**
     * Role metadata
     */
    role: {
        code: 'admin',
        name: 'System Administrator',
        description: 'CKS System Administrator - global system oversight and management',
        scope: 'global'
    },
    /**
     * Capabilities for admin role (comprehensive system access)
     */
    capabilities: {
        // Dashboard permissions
        dashboard: {
            view: 'dashboard:view',
            manage: 'dashboard:manage',
            admin: 'dashboard:admin'
        },
        // Profile permissions
        profile: {
            view: 'profile:view',
            update: 'profile:update',
            admin: 'profile:admin'
        },
        // Directory/user management permissions
        directory: {
            view: 'directory:view',
            create: 'directory:create',
            update: 'directory:update',
            delete: 'directory:delete',
            archive: 'directory:archive',
            admin: 'directory:admin'
        },
        // User creation and management
        users: {
            view: 'users:view',
            create: 'users:create',
            update: 'users:update',
            delete: 'users:delete',
            archive: 'users:archive',
            impersonate: 'users:impersonate'
        },
        // Services management
        services: {
            view: 'services:view',
            create: 'services:create',
            update: 'services:update',
            delete: 'services:delete',
            approve: 'services:approve',
            admin: 'services:admin'
        },
        // Orders oversight
        orders: {
            view: 'orders:view',
            create: 'orders:create',
            update: 'orders:update',
            delete: 'orders:delete',
            approve: 'orders:approve',
            monitor: 'orders:monitor',
            admin: 'orders:admin'
        },
        // Reports and analytics
        reports: {
            view: 'reports:view',
            create: 'reports:create',
            update: 'reports:update',
            delete: 'reports:delete',
            export: 'reports:export',
            admin: 'reports:admin'
        },
        // Support management
        support: {
            view: 'support:view',
            create: 'support:create',
            update: 'support:update',
            delete: 'support:delete',
            resolve: 'support:resolve',
            admin: 'support:admin'
        },
        // Assignment system
        assignments: {
            view: 'assignments:view',
            create: 'assignments:create',
            update: 'assignments:update',
            delete: 'assignments:delete',
            approve: 'assignments:approve',
            admin: 'assignments:admin'
        },
        // Archive management
        archive: {
            view: 'archive:view',
            restore: 'archive:restore',
            purge: 'archive:purge',
            admin: 'archive:admin'
        },
        // System administration
        system: {
            config: 'system:config',
            maintenance: 'system:maintenance',
            backup: 'system:backup',
            audit: 'system:audit',
            monitoring: 'system:monitoring'
        },
        // Role and permission management
        permissions: {
            view: 'permissions:view',
            create: 'permissions:create',
            update: 'permissions:update',
            delete: 'permissions:delete',
            assign: 'permissions:assign'
        },
        // All entity types
        contractors: {
            view: 'contractors:view',
            create: 'contractors:create',
            update: 'contractors:update',
            delete: 'contractors:delete',
            approve: 'contractors:approve',
            admin: 'contractors:admin'
        },
        customers: {
            view: 'customers:view',
            create: 'customers:create',
            update: 'customers:update',
            delete: 'customers:delete',
            admin: 'customers:admin'
        },
        centers: {
            view: 'centers:view',
            create: 'centers:create',
            update: 'centers:update',
            delete: 'centers:delete',
            admin: 'centers:admin'
        },
        crew: {
            view: 'crew:view',
            create: 'crew:create',
            update: 'crew:update',
            delete: 'crew:delete',
            admin: 'crew:admin'
        },
        warehouses: {
            view: 'warehouses:view',
            create: 'warehouses:create',
            update: 'warehouses:update',
            delete: 'warehouses:delete',
            admin: 'warehouses:admin'
        },
        managers: {
            view: 'managers:view',
            create: 'managers:create',
            update: 'managers:update',
            delete: 'managers:delete',
            admin: 'managers:admin'
        },
        // Catalog management
        catalog: {
            view: 'catalog:view',
            create: 'catalog:create',
            update: 'catalog:update',
            delete: 'catalog:delete',
            admin: 'catalog:admin'
        }
    },
    /**
     * Domain configurations for route factories
     */
    domains: {
        dashboard: {
            capabilities: {
                view: 'dashboard:view',
                manage: 'dashboard:admin'
            },
            features: {
                kpis: true,
                orders: true,
                activity: true,
                analytics: true,
                clearActivity: true
            },
            scope: 'global',
            roleCode: 'admin'
        },
        profile: {
            capabilities: {
                view: 'profile:view',
                update: 'profile:update',
                admin: 'profile:admin'
            },
            features: {
                basicInfo: true,
                contactInfo: true,
                preferences: true,
                security: true,
                systemSettings: true
            },
            scope: 'global',
            roleCode: 'admin'
        },
        directory: {
            capabilities: {
                view: 'directory:view',
                create: 'directory:create',
                update: 'directory:update',
                delete: 'directory:delete',
                admin: 'directory:admin'
            },
            features: {
                contractors: true,
                customers: true,
                centers: true,
                crew: true,
                warehouses: true,
                managers: true,
                search: true,
                filters: true,
                export: true,
                import: true,
                bulkActions: true
            },
            scope: 'global',
            roleCode: 'admin'
        },
        create: {
            capabilities: {
                view: 'users:view',
                create: 'users:create',
                update: 'users:update',
                delete: 'users:delete'
            },
            features: {
                users: true,
                roles: true,
                permissions: true,
                templates: true,
                bulkCreate: true,
                import: true
            },
            scope: 'global',
            roleCode: 'admin'
        },
        assign: {
            capabilities: {
                view: 'assignments:view',
                create: 'assignments:create',
                update: 'assignments:update',
                delete: 'assignments:delete',
                admin: 'assignments:admin'
            },
            features: {
                smartAssignment: true,
                bulkAssignment: true,
                automation: true,
                rules: true,
                analytics: true
            },
            scope: 'global',
            roleCode: 'admin'
        },
        archive: {
            capabilities: {
                view: 'archive:view',
                restore: 'archive:restore',
                purge: 'archive:purge',
                admin: 'archive:admin'
            },
            features: {
                browse: true,
                search: true,
                restore: true,
                purge: true,
                analytics: true
            },
            scope: 'global',
            roleCode: 'admin'
        },
        support: {
            capabilities: {
                view: 'support:view',
                create: 'support:create',
                update: 'support:update',
                delete: 'support:delete',
                resolve: 'support:resolve',
                admin: 'support:admin'
            },
            features: {
                tickets: true,
                knowledge: true,
                escalation: true,
                analytics: true,
                automation: true,
                sla: true
            },
            scope: 'global',
            roleCode: 'admin'
        },
        catalog: {
            capabilities: {
                view: 'catalog:view',
                admin: 'catalog:admin'
            },
            features: {
                browse: true,
                search: true,
                categories: true,
                myServices: false // Admin doesn't need contractor-specific features
            }
        }
    },
    /**
     * Feature flags for admin role (all enabled)
     */
    features: {
        // Core features
        multiTenancy: true,
        realtimeNotifications: true,
        advancedReporting: true,
        dataExport: true,
        dataImport: true,
        bulkOperations: true,
        // Admin-specific features
        systemMonitoring: true,
        auditTrails: true,
        configManagement: true,
        backupRestore: true,
        userImpersonation: true,
        maintenanceMode: true,
        // Experimental features
        aiInsights: true,
        predictiveAnalytics: true,
        mobileSync: true,
        advancedSecurity: true,
        // Integration features
        thirdPartyIntegrations: true,
        apiAccess: true,
        webhooks: true,
        sso: true,
        ldap: true
    },
    /**
     * UI customization for admin role
     */
    ui: {
        theme: 'admin',
        layout: 'sidebar',
        density: 'compact',
        showAdvancedFilters: true,
        showSystemInfo: true,
        defaultPageSize: 50,
        enableBulkActions: true,
        showDebugInfo: true
    },
    /**
     * Rate limiting and quotas (higher limits for admin)
     */
    limits: {
        apiCallsPerHour: 10000,
        exportSizeMB: 1000,
        concurrentSessions: 10,
        dataRetentionDays: 2555, // 7 years
        bulkOperationSize: 1000
    }
};
/**
 * Helper to get all admin capabilities as a flat array
 */
function getAdminCapabilities() {
    const caps = [];
    function extractCaps(obj) {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                caps.push(obj[key]);
            }
            else if (typeof obj[key] === 'object' && obj[key] !== null) {
                extractCaps(obj[key]);
            }
        }
    }
    extractCaps(exports.AdminConfig.capabilities);
    return [...new Set(caps)]; // Remove duplicates
}
/**
 * Check if admin has specific capability (should always be true)
 */
function hasCapability(capability) {
    return getAdminCapabilities().includes(capability);
}
//# sourceMappingURL=config.js.map