/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * core/http/responses.ts
 *
 * Description: Small helpers for success payloads
 * Function: Provide consistent ok shapes for routes
 * Importance: Keeps domain routes minimal and uniform
 */

export type Ok<T = unknown> = { ok: true; data?: T };

export function ok<T = unknown>(data?: T): Ok<T> {
  return { ok: true, data };
}

