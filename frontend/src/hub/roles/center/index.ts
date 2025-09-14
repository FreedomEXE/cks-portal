/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * index.ts
 * 
 * Description: Center component registry with complete tab implementations
 * Function: Maps component names from config.v1.json to actual React components
 * Importance: Critical - Enables dynamic component resolution for role hub
 * Connects to: RoleHub.tsx, config.v1.json, all center tab components
 * 
 * Notes: Complete implementation with all center components.
 *        Each component maintains facility operations functionality.
 *        Type-safe exports with proper component interfaces.
 */

// Import all center tab components
import Dashboard from './tabs/Dashboard';
import MyProfile from './tabs/MyProfile';
import MyServices from './tabs/MyServices';
import Ecosystem from './tabs/Ecosystem';
import Orders from './tabs/Orders';
import Reports from './tabs/Reports';
import Support from './tabs/Support';

// Export all components for dynamic resolution
export const components = {
  Dashboard,
  MyProfile,
  MyServices,
  Ecosystem,
  Orders,
  Reports,
  Support
} as const;

// Export utility components (to be added as needed)
export const utilityComponents = {
  // Will be added as center-specific utilities are created
} as const;

// Type safety for component registry
export type CenterComponent = keyof typeof components;

// Default export for role configuration
export default {
  components,
  utilityComponents,
  role: 'center',
  version: '1.0.0'
};