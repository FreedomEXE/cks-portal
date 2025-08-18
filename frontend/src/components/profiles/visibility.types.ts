/**
 * CKS Portal — Visibility Types (shared)
 *
 * Purpose: Share ViewerRole and common types across role visibility policies.
 * Change summary (Aug 2025): New shared types for profile visibility.
 */

export type ViewerRole =
  | "admin"
  | "manager"
  | "contractor"
  | "customer"
  | "crew"
  | "center"
  | "unknown";
