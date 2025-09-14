/**
 * File: mount.ts
 *
 * Description: Route mounting middleware - handles /api/:role/* routing
 * Function: Route requests to appropriate role routers with context
 * Importance: Central routing hub that enables hybrid architecture
 * Connects to: Role context, authentication, role routers
 */
import { Application } from 'express';
/**
 * Mount role-based routing to Express app
 */
export declare function mountRoleRoutes(app: Application): void;
//# sourceMappingURL=mount.d.ts.map