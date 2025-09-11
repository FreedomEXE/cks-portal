/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * index.ts
 * 
 * Description: Warehouse component registry with complete tab implementations
 * Function: Maps component names from config.v1.json to actual React components
 * Importance: Critical - Enables dynamic component resolution for role hub
 * Connects to: RoleHub.tsx, config.v1.json, all warehouse tab components
 * 
 * Notes: Complete implementation with all warehouse components.
 *        Each component maintains inventory management functionality.
 *        Type-safe exports with proper component interfaces.
 */

// Import all warehouse tab components
import Dashboard from './tabs/Dashboard';
import MyProfile from './tabs/MyProfile';
import Inventory from './tabs/Inventory';
import Orders from './tabs/Orders';

// Export all components for dynamic resolution
export const components = {
  Dashboard,
  MyProfile,
  Inventory,
  Orders
} as const;

// Export utility components (to be added as needed)
export const utilityComponents = {
  // Will be added as warehouse-specific utilities are created
} as const;

// Type safety for component registry
export type WarehouseComponent = keyof typeof components;

// Default export for role configuration
export default {
  components,
  utilityComponents,
  role: 'warehouse',
  version: '1.0.0'
};