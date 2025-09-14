/**
 * File: index.ts
 *
 * Description: Central route registry - maps role codes to their configured routers
 * Function: Compose and export role routers for mounting in app
 * Importance: Single registry of all role-based API surfaces
 * Connects to: Role routers, role configs, main app mounting
 */
import { Router } from 'express';
/**
 * Role router registry
 * Maps role codes to their configured routers
 */
export declare const RoleRouters: {
    admin: any;
    manager: any;
};
/**
 * Get router for specific role
 */
export declare function getRoleRouter(roleCode: string): Router | null;
/**
 * Get list of available roles
 */
export declare function getAvailableRoles(): string[];
/**
 * Validate if role exists
 */
export declare function isValidRole(roleCode: string): boolean;
//# sourceMappingURL=index.d.ts.map