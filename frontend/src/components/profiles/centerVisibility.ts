/**
 * CKS Portal — Center Profile Visibility Policy (initial stub)
 *
 * Purpose: Centralize which fields are visible for a Center profile, per viewer role/relationship.
 * Used by CenterProfile and CenterHub.
 *
 * Change summary (Aug 2025): New policy stub with conservative defaults.
 */

import type { ViewerRole } from "./visibility.types";

export type VisibilityInput = {
  viewerRole: ViewerRole;
  viewerCode?: string | null;
  subjectCode: string; // center code
  relationship?: "assigned-manager" | "serving-contractor" | "own-center" | "customer-owner" | "serving-crew" | "none";
};

export type VisibilityResult = {
  readOnly: boolean;
  allowed: Set<string>; // allowed field keys
};

// Minimal sets for now; expand as rules firm up
const PUBLIC_FIELDS = new Set([
  "center-id",
  "name",
  "address",
  "phone",
  "email",
  "website",
  "socials",
  "status",
]);

const PARTNER_FIELDS = new Set([
  ...PUBLIC_FIELDS,
  "contractor-id",
  "customer-id",
  "service-start-date",
  "services-active",
  "service-frequency",
]);

const INTERNAL_FIELDS = new Set([
  ...PARTNER_FIELDS,
  "manager-id",
  "supervisor-id",
  "notes", // treat as sensitive; include only for owner/admin for now
]);

export function getCenterVisibility(input: VisibilityInput): VisibilityResult {
  const { viewerRole, relationship } = input;

  // Owner (center viewing itself) → full fields, editable
  if (viewerRole === "center" && relationship === "own-center") {
    return { readOnly: false, allowed: new Set(INTERNAL_FIELDS) };
  }

  // Admin → full fields, read-only in generic profile contexts
  if (viewerRole === "admin") {
    return { readOnly: true, allowed: new Set(INTERNAL_FIELDS) };
  }

  // Manager assigned to the center → partner-level + manager ids (read-only)
  if (viewerRole === "manager" && relationship === "assigned-manager") {
    const allowed = new Set(PARTNER_FIELDS);
    allowed.add("manager-id");
    return { readOnly: true, allowed };
  }

  // Contractor serving the center → partner-level (read-only)
  if (viewerRole === "contractor" && relationship === "serving-contractor") {
    return { readOnly: true, allowed: new Set(PARTNER_FIELDS) };
  }

  // Customer owning the center → partner-level (read-only)
  if (viewerRole === "customer" && relationship === "customer-owner") {
    return { readOnly: true, allowed: new Set(PARTNER_FIELDS) };
  }

  // Crew serving the center → minimal public + assigned hints later
  if (viewerRole === "crew" && relationship === "serving-crew") {
    return { readOnly: true, allowed: new Set(PUBLIC_FIELDS) };
  }

  // Unknown or no relationship → public only
  return { readOnly: true, allowed: new Set(PUBLIC_FIELDS) };
}
