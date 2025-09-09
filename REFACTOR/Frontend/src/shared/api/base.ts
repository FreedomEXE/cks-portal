/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: base.ts
 * 
 * Description: Shared API utilities for cross-role usage.
 * Function: Provide helpers for fetch, error handling, and headers.
 * Importance: Reduces duplication across role-specific API clients.
 * Connects to: hub/roles/*/api/*, shared/types/api.d.ts.
 */

export async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

