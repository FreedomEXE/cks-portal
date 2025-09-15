/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * core/http/errors.ts
 *
 * Description: Small helpers for shaping error responses
 * Function: Create consistent error payloads without Express types
 * Importance: Unified error surface across routes
 * Connects to: Domain routes, responses helper
 */

export type HttpErrorShape = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function badRequest(message: string, details?: unknown): HttpErrorShape {
  return { ok: false, error: { code: "BAD_REQUEST", message, details } };
}

export function notFound(message: string, details?: unknown): HttpErrorShape {
  return { ok: false, error: { code: "NOT_FOUND", message, details } };
}

export function forbidden(message: string, details?: unknown): HttpErrorShape {
  return { ok: false, error: { code: "FORBIDDEN", message, details } };
}

export function internal(message = "Internal server error", details?: unknown): HttpErrorShape {
  return { ok: false, error: { code: "INTERNAL", message, details } };
}

