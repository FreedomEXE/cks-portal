import { FastifyPluginCallback } from 'fastify';
export interface DashboardRouteConfig {
    capabilities?: any;
    features?: any;
    scope?: 'global' | 'ecosystem' | 'entity';
    roleCode?: string;
}
export declare const createDashboardFastifyPlugin: (_config?: DashboardRouteConfig) => FastifyPluginCallback;
//# sourceMappingURL=routes.fastify.d.ts.map