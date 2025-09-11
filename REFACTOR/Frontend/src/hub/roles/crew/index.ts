/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * index.ts
 * 
 * Description: Crew component registry with complete tab implementations
 * Function: Maps component names from config.v1.json to actual React components
 * Importance: Critical - Enables dynamic component resolution for role hub
 * Connects to: RoleHub.tsx, config.v1.json, all crew tab components
 * 
 * Notes: Complete implementation with all crew components.
 *        Each component maintains task management functionality.
 *        Type-safe exports with proper component interfaces.
 */

// Import all crew tab components
import Dashboard from './tabs/Dashboard';
import MyProfile from './tabs/MyProfile';
import MyServices from './tabs/MyServices';
import Ecosystem from './tabs/Ecosystem';

// Export all components for dynamic resolution
export const components = {
  Dashboard,
  MyProfile,
  MyServices,
  Ecosystem
} as const;

// Export utility components (to be added as needed)
export const utilityComponents = {
  // Will be added as crew-specific utilities are created
} as const;

// Type safety for component registry
export type CrewComponent = keyof typeof components;

// Default export for role configuration
export default {
  components,
  utilityComponents,
  role: 'crew',
  version: '1.0.0'
};