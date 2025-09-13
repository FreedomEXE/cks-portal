/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: index.ts
 *
 * Description: Central route registry - maps role codes to their configured routers
 * Function: Compose and export role routers for mounting in app
 * Importance: Single registry of all role-based API surfaces
 * Connects to: Role routers, role configs, main app mounting
 */

import { Router } from 'express';

// Import role routers
import adminRouter from '../roles/admin/router';
import managerRouter from '../roles/manager/router';
// Import other role routers as they're implemented
// import contractorRouter from '../roles/contractor/router';
// import customerRouter from '../roles/customer/router';
// import centerRouter from '../roles/center/router';
// import crewRouter from '../roles/crew/router';
// import warehouseRouter from '../roles/warehouse/router';

/**
 * Role router registry
 * Maps role codes to their configured routers
 */
export const RoleRouters = {
  admin: adminRouter,
  manager: managerRouter,
  // contractor: contractorRouter,
  // customer: customerRouter,
  // center: centerRouter,
  // crew: crewRouter,
  // warehouse: warehouseRouter
};

/**
 * Get router for specific role
 */
export function getRoleRouter(roleCode: string): Router | null {
  const normalizedRole = roleCode.toLowerCase();
  return RoleRouters[normalizedRole as keyof typeof RoleRouters] || null;
}

/**
 * Get list of available roles
 */
export function getAvailableRoles(): string[] {
  return Object.keys(RoleRouters);
}

/**
 * Validate if role exists
 */
export function isValidRole(roleCode: string): boolean {
  return getAvailableRoles().includes(roleCode.toLowerCase());
}