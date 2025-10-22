/**
 * Permissions System - Centralized Role-Based Access Control
 *
 * All "who can do what" logic lives here.
 * No permission checks scattered throughout components or modals.
 *
 * Usage:
 * ```ts
 * if (can('report', 'archive', 'admin', { state: 'active' })) {
 *   // Show archive button
 * }
 * ```
 */

import type { EntityType, EntityState, UserRole } from '../types/entities';

/**
 * Available actions across all entity types
 */
export type EntityActionType =
  // Admin actions
  | 'archive'
  | 'restore'
  | 'delete'
  | 'edit'
  // Order actions
  | 'accept'
  | 'reject'
  | 'cancel'
  | 'create_service'
  // Report/Feedback actions
  | 'acknowledge'
  | 'resolve'
  | 'close'
  // Service actions
  | 'start'
  | 'complete'
  | 'assign_crew'
  // Generic actions
  | 'view';

/**
 * Context for permission checking
 */
export interface PermissionContext {
  state: EntityState;
  entityData?: any;
  [key: string]: any;
}

/**
 * Check if a role can perform an action on an entity type
 *
 * @param entityType - The type of entity (order, report, service, etc.)
 * @param action - The action to perform
 * @param role - The user's role
 * @param context - Additional context (entity state, data, etc.)
 * @returns true if the action is permitted
 */
export function can(
  entityType: EntityType,
  action: EntityActionType,
  role: UserRole,
  context: PermissionContext
): boolean {
  const { state, entityData } = context;

  // ===== ADMIN PERMISSIONS =====
  if (role === 'admin') {
    return canAdmin(entityType, action, state, entityData);
  }

  // ===== USER PERMISSIONS =====
  // Manager, Contractor, Customer, Center, Crew, Warehouse
  return canUser(entityType, action, role, state, entityData);
}

/**
 * Admin permissions - Full CRUD + archive/restore/delete
 */
function canAdmin(
  entityType: EntityType,
  action: EntityActionType,
  state: EntityState,
  entityData?: any
): boolean {
  // Admin can always view
  if (action === 'view') return true;

  // State-based permissions
  switch (state) {
    case 'active':
      // Can edit, archive (soft delete)
      return ['edit', 'archive'].includes(action);

    case 'archived':
      // Can restore, permanently delete
      return ['restore', 'delete'].includes(action);

    case 'deleted':
      // Permanently deleted - no actions
      return false;

    default:
      return false;
  }
}

/**
 * User permissions - Limited to their role's workflow actions
 */
function canUser(
  entityType: EntityType,
  action: EntityActionType,
  role: UserRole,
  state: EntityState,
  entityData?: any
): boolean {
  // Users cannot archive or permanently delete
  if (['archive', 'delete', 'restore'].includes(action)) {
    return false;
  }

  // Users can only act on active entities
  if (state !== 'active') {
    return false;
  }

  // Entity-specific permissions
  switch (entityType) {
    case 'order':
      return canUserOrder(action, role, entityData);

    case 'report':
    case 'feedback':
      return canUserReport(action, role, entityData);

    case 'service':
      return canUserService(action, role, entityData);

    default:
      // View-only for other entity types
      return action === 'view';
  }
}

/**
 * User permissions for orders
 */
function canUserOrder(
  action: EntityActionType,
  role: UserRole,
  entityData?: any
): boolean {
  // All users can view orders
  if (action === 'view') return true;

  // Role-specific workflow actions
  switch (role) {
    case 'manager':
      // Managers can accept/reject orders, create services
      return ['accept', 'reject', 'create_service'].includes(action);

    case 'contractor':
      // Contractors can accept/reject service orders
      return ['accept', 'reject'].includes(action);

    case 'customer':
      // Customers can cancel their own orders
      // TODO: Check if order belongs to this customer via entityData
      return ['cancel'].includes(action);

    case 'warehouse':
      // Warehouses can accept/reject product orders
      return ['accept', 'reject'].includes(action);

    case 'crew':
      // Crew can view but not act on orders
      return action === 'view';

    default:
      return false;
  }
}

/**
 * User permissions for reports/feedback
 */
function canUserReport(
  action: EntityActionType,
  role: UserRole,
  entityData?: any
): boolean {
  // All users can view reports
  if (action === 'view') return true;

  // Check entity status
  const status = entityData?.status;

  switch (role) {
    case 'manager':
    case 'center':
    case 'contractor':
      // These roles can acknowledge and resolve reports
      if (action === 'acknowledge' && status === 'open') return true;
      if (action === 'resolve' && status === 'open') return true;
      if (action === 'close' && status === 'resolved') return true;
      return false;

    case 'customer':
      // Customers can only acknowledge feedback
      if (action === 'acknowledge' && status === 'open') return true;
      return false;

    default:
      return false;
  }
}

/**
 * User permissions for services
 */
function canUserService(
  action: EntityActionType,
  role: UserRole,
  entityData?: any
): boolean {
  // All users can view services
  if (action === 'view') return true;

  // Check service status
  const status = entityData?.status;

  switch (role) {
    case 'manager':
      // Managers can start, complete, assign crew
      if (action === 'start' && status === 'pending') return true;
      if (action === 'complete' && status === 'in_progress') return true;
      if (action === 'assign_crew') return true;
      return false;

    case 'crew':
      // Crew can complete services they're assigned to
      if (action === 'complete' && status === 'in_progress') return true;
      return false;

    default:
      return false;
  }
}

/**
 * Get all available actions for an entity given role and context
 *
 * This is used by the entity registry to build action lists.
 *
 * @param entityType - The type of entity
 * @param role - The user's role
 * @param context - Permission context
 * @returns Array of action types that are permitted
 */
export function getAvailableActions(
  entityType: EntityType,
  role: UserRole,
  context: PermissionContext
): EntityActionType[] {
  const allActions: EntityActionType[] = [
    'view',
    'edit',
    'archive',
    'restore',
    'delete',
    'accept',
    'reject',
    'cancel',
    'create_service',
    'acknowledge',
    'resolve',
    'close',
    'start',
    'complete',
    'assign_crew',
  ];

  return allActions.filter((action) =>
    can(entityType, action, role, context)
  );
}
