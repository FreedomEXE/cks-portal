/**
 * File: routes.factory.ts
 *
 * Description: Dashboard route factory - creates role-specific dashboard routes
 * Function: Generate dashboard endpoints based on role capabilities and configuration
 * Importance: Single dashboard logic that adapts to different role requirements
 * Connects to: dashboard service, role configs, capability guards
 */
import { Router } from 'express';
/**
 * Configuration for dashboard route factory
 */
export interface DashboardRouteConfig {
    capabilities: {
        view: string;
        manage?: string;
    };
    features: {
        kpis: boolean;
        orders: boolean;
        activity: boolean;
        analytics: boolean;
        clearActivity?: boolean;
    };
    scope: 'global' | 'ecosystem' | 'entity';
    roleCode: string;
}
/**
 * Create dashboard router for specific role configuration
 */
export declare function createDashboardRouter(config: DashboardRouteConfig): Router;
//# sourceMappingURL=routes.factory.d.ts.map