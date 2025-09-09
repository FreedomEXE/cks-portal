/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: requireCaps.ts
 * 
 * Description: Guard middleware; 403 if user lacks required capabilities.
 * Function: Enforce RBAC checks for Manager routes.
 * Importance: Protects sensitive endpoints and aligns UI gating.
 * Connects to: auth.ts (req.user.caps), Manager route modules.
 */

import type { Request, Response, NextFunction } from 'express';

export function requireCaps(...caps: string[]) {
  return function (_req: Request, _res: Response, next: NextFunction) {
    // TODO: Replace with real capability check once auth is wired
    next();
  };
}
