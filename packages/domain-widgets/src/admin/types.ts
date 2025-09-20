/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: types.ts
 *
 * Description:
 * Admin-specific types for user management, assignments, and archive functionality.
 *
 * Responsibilities:
 * - Define unified User interface that maps to existing role profiles
 * - Define assignment rules and hierarchy structures
 * - Define archive and soft delete functionality
 *
 * Role in system:
 * - Central type definitions for admin functionality
 *
 * Notes:
 * - Maps to existing ManagerProfile, ContractorProfile, etc.
 * - Supports auto-generation of user IDs
 * - Enforces smart assignment rules
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

export type UserRole = 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse';

export type UserStatus = 'active' | 'inactive' | 'unassigned' | 'archived';

export type AssignmentStatus = 'assigned' | 'unassigned' | 'pending';

// Unified User interface that maps to all existing role profiles
export interface User {
  id: string; // Auto-generated: MNG-001, CON-001, CUS-001, CTR-001, CRW-001, WHS-001
  role: UserRole;
  status: UserStatus;
  assignmentStatus: AssignmentStatus;
  assignedTo?: string; // ID of parent user in hierarchy
  assignedToRole?: UserRole; // Role of parent user

  // Profile information (maps to existing profile structures)
  name?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;

  // System fields
  createdDate: string; // Auto-populated on creation
  startDate: string; // Same as createdDate for new users
  lastUpdated: string;
  createdBy: string; // Admin ID who created this user

  // Assignment tracking
  children?: string[]; // IDs of users assigned to this user
  childrenRoles?: UserRole[]; // Roles of assigned children
}

// Assignment rules for smart assignment system
export interface AssignmentRule {
  childRole: UserRole;
  parentRole: UserRole;
  description: string;
}

export const ASSIGNMENT_RULES: AssignmentRule[] = [
  { childRole: 'contractor', parentRole: 'manager', description: 'Contractors assign to Managers' },
  { childRole: 'customer', parentRole: 'contractor', description: 'Customers assign to Contractors' },
  { childRole: 'center', parentRole: 'customer', description: 'Centers assign to Customers' },
  { childRole: 'crew', parentRole: 'center', description: 'Crew assign to Centers' },
  { childRole: 'warehouse', parentRole: 'manager', description: 'Warehouses assign to Managers' }
];

// For Create Section - form data structure
export interface CreateUserForm {
  role: UserRole;
  name?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
}

// For Assign Section - assignment operation
export interface AssignmentOperation {
  userId: string;
  targetUserId: string;
  targetRole: UserRole;
  timestamp: string;
  performedBy: string; // Admin ID
}

// For Archive Section - archived item structure
export interface ArchivedItem {
  id: string;
  originalId: string;
  type: 'user' | 'service' | 'product' | 'order' | 'report';
  name: string;
  role?: UserRole; // For user archives
  archivedDate: string;
  archivedBy: string; // Admin ID
  reason?: string;
  canRestore: boolean;
  originalData: any; // Original object data for restoration
}

export type ArchiveType = 'users' | 'services' | 'products' | 'orders' | 'reports';

// User ID generation helpers
export function generateUserId(role: UserRole, existingUsers: User[]): string {
  const prefixes = {
    manager: 'MNG',
    contractor: 'CON',
    customer: 'CUS',
    center: 'CTR',
    crew: 'CRW',
    warehouse: 'WHS'
  };

  const prefix = prefixes[role];
  const existingIds = existingUsers
    .filter(user => user.role === role)
    .map(user => parseInt(user.id.split('-')[1]))
    .filter(num => !isNaN(num));

  const nextNumber = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
}

// Assignment validation
export function canAssignRole(childRole: UserRole, parentRole: UserRole): boolean {
  return ASSIGNMENT_RULES.some(rule =>
    rule.childRole === childRole && rule.parentRole === parentRole
  );
}

// Get valid parent roles for a given child role
export function getValidParentRoles(childRole: UserRole): UserRole[] {
  return ASSIGNMENT_RULES
    .filter(rule => rule.childRole === childRole)
    .map(rule => rule.parentRole);
}

// Get role hierarchy path
export function getRoleHierarchy(): Record<UserRole, UserRole[]> {
  return {
    manager: [], // Top level - no parents
    contractor: ['manager'],
    customer: ['contractor'],
    center: ['customer'],
    crew: ['center'],
    warehouse: ['manager']
  };
}