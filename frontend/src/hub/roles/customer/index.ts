/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * index.ts
 * 
 * Description: Customer component registry with complete tab implementations
 * Function: Maps component names from config.v1.json to actual React components
 * Importance: Critical - Enables dynamic component resolution for role hub
 * Connects to: RoleHub.tsx, config.v1.json, all customer tab components
 * 
 * Notes: Complete customer hub implementation with center management focus.
 *        Each component maintains customer business functionality with modern structure.
 *        Type-safe exports with proper component interfaces and business logic.
 */

// Import all customer tab components
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

// Export utility components (none currently for customer)
export const utilityComponents = {
  // Future customer-specific utility components can be added here
} as const;

// Note: API functions, hooks, utilities, and types will be added when backend integration begins

// Type safety for component registry
export type CustomerComponent = keyof typeof components;

// Default export for role configuration
export default {
  components,
  utilityComponents,
  role: 'customer',
  version: '1.0.0'
};