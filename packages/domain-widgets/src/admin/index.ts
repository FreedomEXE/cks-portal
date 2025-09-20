/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: index.ts
 *
 * Description:
 * Export configuration for admin management components.
 *
 * Responsibilities:
 * - Export all admin components for easy importing
 * - Export types and utility functions
 * - Centralize admin module exports
 *
 * Role in system:
 * - Module entry point for admin functionality
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

// Component exports
export { default as AdminUsersSection } from './AdminUsersSection';
export { default as CreateUsersSection } from './CreateUsersSection';
export { default as AssignUsersSection } from './AssignUsersSection';
export { default as ArchiveSection } from './ArchiveSection';

// Type exports
export type {
  User,
  UserRole,
  UserStatus,
  AssignmentStatus,
  AssignmentRule,
  CreateUserForm,
  AssignmentOperation,
  ArchivedItem,
  ArchiveType
} from './types';

// Utility function exports
export {
  ASSIGNMENT_RULES,
  generateUserId,
  canAssignRole,
  getValidParentRoles,
  getRoleHierarchy
} from './types';