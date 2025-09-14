/**
 * File: routes.factory.ts
 *
 * Description: Catalog domain route factory
 * Function: Creates role-specific catalog routers with configuration
 * Importance: Enables role-based catalog features while sharing logic
 * Connects to: Role configurations, catalog service, auth middleware
 */
import { Router } from 'express';
import { CatalogRouteConfig } from './types';
export declare function createCatalogRouter(config: CatalogRouteConfig): Router;
//# sourceMappingURL=routes.factory.d.ts.map