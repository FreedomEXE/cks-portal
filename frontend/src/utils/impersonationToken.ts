/**
 * impersonationToken.ts
 *
 * Purpose:
 * - Minimal localStorage wrapper to manage the admin-only impersonation token.
 * - Token is added as 'x-impersonate-token' on requests so backend can resolve actor.
 *
 * Notes:
 * - Token lifetime is enforced server-side; client only stores/forgets it.
 */
// Prod impersonation token helpers (admin-only feature)
export function getImpersonationToken() {
  return window.localStorage.getItem('impersonation_token') || '';
}
export function setImpersonationToken(tok: string) {
  window.localStorage.setItem('impersonation_token', tok);
}
export function clearImpersonationToken() {
  window.localStorage.removeItem('impersonation_token');
}
