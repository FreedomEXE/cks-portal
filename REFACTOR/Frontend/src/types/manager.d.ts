/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: manager.d.ts
 * 
 * Description: DTOs for Manager (e.g., ManagerProfile, ManagerOrder, ManagerKPI).
 * Function: Declare types consumed by Manager frontend and API.
 * Importance: Ensures type safety and shared contracts.
 * Connects to: api/manager.ts, Manager tabs.
 */

export interface ManagerKPI {
  contractors: number;
  customers: number;
  centers: number;
  crew: number;
}
