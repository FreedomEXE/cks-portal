/**
 * File: utils/roles.ts
 *
 * Descriptio:
 *   Internal code → role mapping logic.
 * Functionality:
 *   Regex-based pattern matching to classify internal codes to role labels.
 * Importance:
 *   Central authority for deriving authorization role from alphanumeric codes.
 * Conections:
 *   Consumed by routes/me and potentially future auth middleware.
 * Notes:
 *   Expand mapping when new entity classes introduced (e.g., manager codes).
 */
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

export type InternalRole = 'admin' | 'crew' | 'contractor' | 'customer' | 'center' | null;

export function roleFromInternalCode(code = ''): InternalRole {
  if (code === '000-A') return 'admin';
  if (/-A$|^A/.test(code)) return 'crew';
  if (/-B$|^B/.test(code)) return 'contractor';
  if (/-C$|^C/.test(code)) return 'customer';
  if (/-D$|^D/.test(code)) return 'center';
  return null;
}
