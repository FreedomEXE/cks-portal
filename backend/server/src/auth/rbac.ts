/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import type { Request, Response, NextFunction } from 'express';

export type Role = 'admin' | 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse' | 'unknown';

// Minimal permission set for MVP-critical flows
export const PERMISSIONS = {
  CONTRACTOR_APPROVE: ['contractor'] as const,
  MANAGER_SCHEDULE: ['manager'] as const,
  ADMIN_CATALOG_WRITE: ['admin'] as const,
  CUSTOMER_CREATE_REQUEST: ['customer'] as const,
  CENTER_CREATE_REQUEST: ['center'] as const,
  REPORT_CREATE: ['center','customer'] as const,
  FEEDBACK_CREATE: ['center','customer'] as const,
  REPORT_COMMENT: ['manager','center','customer','contractor'] as const,
  REPORT_STATUS: ['manager'] as const,
  WAREHOUSE_ASSIGN: ['warehouse','admin'] as const,
  WAREHOUSE_SHIP: ['warehouse','admin'] as const,
  WAREHOUSE_ADJUST: ['warehouse','admin'] as const,
} as const;
export type Permission = keyof typeof PERMISSIONS;

export function roleHas(role: Role, action: Permission): boolean {
  const allowed = PERMISSIONS[action] as readonly Role[];
  return allowed.includes(role);
}

// Lightweight role detection from headers; keeps hub isolation (no shared state)
export function getRoleFromHeaders(req: Request): Role {
  const hdr = (req.headers['x-user-role'] || req.headers['X-User-Role']) as string | undefined;
  if (hdr) {
    const r = String(hdr).toLowerCase();
    if (['admin','manager','contractor','customer','center','crew','warehouse'].includes(r)) return r as Role;
  }
  const uid = String((req.headers['x-user-id'] || '').toString()).toUpperCase();
  if (!uid) return 'unknown';
  if (uid.startsWith('ADM-')) return 'admin';
  if (uid.startsWith('MGR-')) return 'manager';
  if (uid.startsWith('CON-')) return 'contractor';
  if (uid.startsWith('CUS-')) return 'customer';
  if (uid.startsWith('CEN-') || uid.startsWith('CTR-')) return 'center';
  if (uid.startsWith('CRW-')) return 'crew';
  if (uid.startsWith('WH-')) return 'warehouse';
  return 'unknown';
}

export function requirePermission(action: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = getRoleFromHeaders(req);
    if (roleHas(role, action)) return next();
    return res.status(403).json({ success: false, error: 'Forbidden', error_code: 'forbidden' });
  };
}
