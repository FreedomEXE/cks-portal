
/**
 * impersonate.ts
 *
 * Utility functions for admin impersonation of other users and role derivation from codes.
 * Used for development, testing, and admin features.
 */
// src/utils/impersonate.js
const CODE_RE = /^(000-A|MGR-\d{3}|\d{3}-[ABCD])$/i;

export function isValidImpersonationCode(code: string): boolean {
  return CODE_RE.test(String(code || ""));
}

export function getImpersonateCode() {
  try {
    const raw = localStorage.getItem("cks_impersonate_code") || "";
    const c = String(raw || "").toUpperCase().trim();
    if (!isValidImpersonationCode(c)) {
      // Clear bad values to avoid leaking paths like "/hubs/admin" as codes
      localStorage.removeItem("cks_impersonate_code");
      return "";
    }
    return c;
  } catch { return ""; }
}

export function setImpersonateCode(code: string) {
  try {
    const c = String(code || "").toUpperCase().trim();
    if (isValidImpersonationCode(c)) localStorage.setItem("cks_impersonate_code", c);
    else localStorage.removeItem("cks_impersonate_code");
    window.dispatchEvent(new Event("cks-impersonation-changed"));
  } catch {}
}

export function deriveRoleFromCode(code: string) {
  const c = String(code || "").toUpperCase();
  if (c === "000-A") return "admin";
  if (/^MGR-\d{3}$/.test(c)) return "manager";
  if (/-A$/.test(c)) return "crew";
  if (/-B$/.test(c)) return "contractor";
  if (/-C$/.test(c)) return "customer";
  if (/-D$/.test(c)) return "center";
  return null;
}
