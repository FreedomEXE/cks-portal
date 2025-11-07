/**
 * Tab Visibility Policy - RBAC for Modal Tabs
 *
 * CENTRAL AUTHORITY for determining which tabs appear for which roles.
 * When you need to change "who sees what", edit THIS FILE.
 *
 * Philosophy:
 * - Tabs are defined by entity adapters (what tabs exist)
 * - This policy determines visibility (who can see them)
 * - Separation of concerns: adapters define structure, policy defines access
 */

import { TabId, TabVisibilityContext, UserRole, EntityType } from '../types/entities';

/**
 * Determines if a specific tab should be visible for a given context
 *
 * @param tabId - The tab identifier
 * @param context - Visibility context (role, lifecycle, entity data, etc.)
 * @returns true if tab should be visible, false otherwise
 */
export function canSeeTab(tabId: TabId, context: TabVisibilityContext): boolean {
  const { role, lifecycle, entityType, entityId, viewerId, hasActions } = context;

  // Universal tab visibility rules
  switch (tabId) {
    // ===== DETAILS TAB =====
    // Everyone can see details for all entities
    case 'details':
    case 'overview':
      return true;

    // ===== HISTORY TAB =====
    // User entities: only show history for your own profile (privacy)
    // Non-user entities: varies by type
    case 'history': {
      const userEntityTypes: EntityType[] = ['manager', 'contractor', 'customer', 'center', 'crew', 'warehouse'];

      // If it's a user entity, only show history if viewing your own profile
      if (userEntityTypes.includes(entityType)) {
        // Admin override: admins can see all user timelines
        if (role === 'admin') return true;

        console.log('[TabPolicy] History tab check:', {
          entityType,
          entityId,
          viewerId,
          match: entityId?.toUpperCase() === viewerId?.toUpperCase()
        });

        // If viewerId is not available, allow history (fallback to old behavior)
        if (!viewerId) {
          console.warn('[TabPolicy] viewerId not provided, showing history tab');
          return true;
        }

        return entityId?.toUpperCase() === viewerId?.toUpperCase();
      }

      // Catalog services: admin-only (not shown in public CKS catalog view)
      if (entityType === 'catalogService') {
        return role === 'admin';
      }

      // Products: admin-only history timeline
      if (entityType === 'product') {
        return role === 'admin';
      }

      // Other non-user entities (orders, services, reports): everyone can see history
      return true;
    }

    // ===== ACTIONS TAB =====
    // Visible if:
    // 1. There are actions available (hasActions)
    // 2. Entity is NOT deleted (tombstones are read-only)
    case 'actions':
      // For orders and services, always show the Actions tab to display workflow,
      // even when there are no actionable buttons (read-only timeline).
      // Hide only for deleted tombstones.
      if (lifecycle.state === 'deleted') return false;
      if (entityType === 'order' || entityType === 'service') return true;
      // Other entity types: require actions to show the tab
      return hasActions;

    // ===== QUICK ACTIONS TAB =====
    // Admin-only for catalog services and products (unified catalog view)
    case 'quick-actions': {
      const canSee = role === 'admin' && (entityType === 'catalogService' || entityType === 'product');
      console.log('[TabPolicy] quick-actions visibility check:', { role, entityType, canSee });
      return canSee;
    }

    // ===== CREW TAB =====
    // Service-specific: visible to admin, manager, contractor
    case 'crew':
      return (
        entityType === 'service' &&
        (role === 'admin' || role === 'manager' || role === 'contractor')
      );

    // ===== PRODUCTS TAB =====
    // Service-specific: visible to admin, manager, contractor
    case 'products':
      return (
        entityType === 'service' &&
        (role === 'admin' || role === 'manager' || role === 'contractor')
      );

    // ===== PROCEDURES TAB =====
    // Service-specific: visible to admin, manager, contractor, crew
    case 'procedures':
      return (
        entityType === 'service' &&
        (role === 'admin' || role === 'manager' || role === 'contractor' || role === 'crew')
      );

    // ===== TRAINING TAB =====
    // Service-specific: visible to admin, manager, contractor, crew
    case 'training':
      return (
        entityType === 'service' &&
        (role === 'admin' || role === 'manager' || role === 'contractor' || role === 'crew')
      );

    // ===== NOTES TAB =====
    // Service-specific: visible to admin, manager, contractor
    case 'notes':
      return (
        entityType === 'service' &&
        (role === 'admin' || role === 'manager' || role === 'contractor')
      );

    // ===== PARTICIPANTS TAB =====
    // Order-specific: visible to admin, manager
    case 'participants':
      return (
        entityType === 'order' &&
        (role === 'admin' || role === 'manager')
      );

    // ===== AUDIT TAB =====
    // Admin-only: detailed audit trail with sensitive info
    case 'audit':
      return role === 'admin';

    // ===== PROFILE TAB =====
    // User-specific: visible to all roles for user entities
    // Everyone can view user profiles (for their assignments and ecosystem)
    case 'profile':
      return (
        entityType === 'manager' || entityType === 'contractor' || entityType === 'customer' ||
        entityType === 'crew' || entityType === 'center' || entityType === 'warehouse'
      );

    // Default: hide unknown tabs
    default:
      console.warn(`[TabPolicy] Unknown tab "${tabId}" - defaulting to hidden`);
      return false;
  }
}

/**
 * Filter tabs based on visibility policy
 *
 * @param tabs - Array of tab descriptors
 * @param context - Visibility context
 * @returns Filtered array of visible tabs
 */
export function filterVisibleTabs<T extends { id: TabId }>(
  tabs: T[],
  context: TabVisibilityContext
): T[] {
  return tabs.filter(tab => canSeeTab(tab.id, context));
}

/**
 * Get default tab order for an entity type
 *
 * Orders can be customized per entity type.
 * Gateway uses this when no explicit order is provided.
 */
export function getDefaultTabOrder(entityType: EntityType): TabId[] {
  switch (entityType) {
    // Orders: Actions first (workflow-driven)
    case 'order':
      return ['actions', 'details', 'history', 'participants'];

    // Services: Overview first, then specialized tabs
    case 'service':
      return ['overview', 'history', 'crew', 'products', 'procedures', 'training', 'notes', 'actions'];

    // Reports: Details first
    case 'report':
    case 'feedback':
      return ['details', 'history', 'actions'];

    // Default: Details → History → Actions
    default:
      return ['details', 'history', 'actions'];
  }
}

/**
 * Role hierarchy helper
 *
 * Used for "at least" permission checks.
 * Example: isAtLeastManager('admin') => true
 */
export function isAtLeast(role: UserRole, minRole: UserRole): boolean {
  const hierarchy: UserRole[] = ['admin', 'manager', 'contractor', 'crew', 'customer'];
  const roleIndex = hierarchy.indexOf(role);
  const minIndex = hierarchy.indexOf(minRole);

  if (roleIndex === -1 || minIndex === -1) return false;
  return roleIndex <= minIndex;
}
