/**
 * File: utils/http.ts
 *
 * Descriptio:
 *   Lightweight HTTP response helpers and async wrapper.
 * Functionality:
 *   ok() for 200 JSON, bad() for error JSON with custom status, safe() to wrap async handlers.
 * Importance:
 *   Reduces repetition and centralizes error propagation pattern.
 * Conections:
 *   Utilized by multiple route modules (entities, me, profiles) for uniform responses.
 * Notes:
 *   Extend with pagination helper or envelope standardization if needed.
 */
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import { Response, Request, NextFunction } from 'express';

export function ok(res: Response, data: any = []) {
  res.status(200).json(Array.isArray(data) ? data : { ...data });
}
export function bad(res: Response, message = 'Bad Request', code = 400) {
  res.status(code).json({ error: message });
}
export function safe(asyncHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => Promise.resolve(asyncHandler(req, res, next)).catch(next);
}
