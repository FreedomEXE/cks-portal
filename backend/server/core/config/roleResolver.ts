/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * core/config/roleResolver.ts
 *
 * Description: Minimal role → prefix mapping and helpers
 * Function: Expose route prefixes used by Fastify registrar
 * Importance: Keeps FE/BE role prefixes aligned
 */

export type RoleCode = 'admin' | 'manager' | 'customer' | 'contractor' | 'center' | 'crew' | 'warehouse';

export const rolePrefixes: Record<RoleCode, string> = {
  admin: "/api/admin",
  manager: "/api/manager",
  customer: "/api/customer",
  contractor: "/api/contractor",
  center: "/api/center",
  crew: "/api/crew",
  warehouse: "/api/warehouse",
};

export function isValidRole(role: string): role is RoleCode {
  return (Object.keys(rolePrefixes) as RoleCode[]).includes(role as RoleCode);
}

export function getPrefix(role: string): string | null {
  return isValidRole(role) ? rolePrefixes[role] : null;
}
