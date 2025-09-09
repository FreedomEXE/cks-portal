/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: api.d.ts
 * 
 * Description: Shared API envelope/types ({ ok, data, error }, pagination cursors).
 * Function: Provide common API result and pagination types.
 * Importance: Aligns API consumers on response shapes.
 * Connects to: api/* modules and consuming components.
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
