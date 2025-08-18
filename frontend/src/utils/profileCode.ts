/**
 * profileCode.ts
 *
 * Utility for deriving unique profile codes from entity data (crew, contractor, customer, etc.).
 * Used for linking and referencing entities throughout the portal.
 */
// src/utils/profileCode.js
export function deriveCodeFrom(kind, data) {
  if (!data) return "";
  const k = (kind || "").toLowerCase();
  if (k === "crew") return data.crew_id || "";
  if (k === "contractor") return data.contractor_id || "";
  if (k === "customer") return data.customer_id || "";
  if (k === "center") return data.center_id || "";
  if (k === "manager") return data.manager_id || "";
  return "";
}

export function displayNameFrom(kind, data) {
  if (!data) return "";
  const k = (kind || "").toLowerCase();
  if (k === "crew") return data.name || data.crew_id || "";
  if (k === "manager") return data.name || data.manager_id || "";
  if (k === "contractor") return data.company_name || data.contractor_id || "";
  if (k === "customer") return data.company_name || data.customer_id || "";
  if (k === "center") return data.center_name || data.name || data.center_id || "";
  return "";
}
