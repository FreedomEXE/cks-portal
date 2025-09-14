/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * index.ts
 * 
 * Description: Admin component registry with complete tab implementations
 * Function: Maps component names from config.v1.json to actual React components
 * Importance: Critical - Enables dynamic component resolution for admin hub
 * Connects to: RoleHub.tsx, config.v1.json, all admin tab components
 * 
 * Notes: Complete implementation with all admin components.
 *        Each component maintains system administration functionality.
 *        Type-safe exports with proper component interfaces.
 */

// Import all admin tab components
import Dashboard from './tabs/Dashboard';
import Directory from './tabs/Directory';
import Create from './tabs/Create';
import Assign from './tabs/Assign';
import Archive from './tabs/Archive';
import Support from './tabs/Support';
import Profile from './tabs/Profile';

// Import utility components
import AdminRecentActions from './components/AdminRecentActions';

// Export all components for dynamic resolution
export const components = {
  Dashboard,
  Directory,
  Create,
  Assign,
  Archive,
  Support,
  Profile
} as const;

// Export utility components
export const utilityComponents = {
  AdminRecentActions
} as const;

// Note: API functions, hooks, utilities, and types will be added when backend integration begins

// Type safety for component registry
export type AdminComponent = keyof typeof components;

// Default export for role configuration
export default {
  components,
  utilityComponents,
  role: 'admin',
  version: '1.0.0'
};