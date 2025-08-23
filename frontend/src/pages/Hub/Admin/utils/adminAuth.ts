/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * adminAuth.ts
 * 
 * Description: Admin-specific authentication and role validation utilities
 * Function: Validates admin roles, manages admin sessions, and handles Clerk auth
 * Importance: Critical - Security layer for Admin hub (system administrators)
 * Connects to: Clerk authentication, Admin hub components, sessionStorage
 * 
 * Notes: Admin-specific authentication for system administration.
 *        Includes admin verification and system access validation.
 *        Isolated from other hub authentication for security separation.
 *        Admin users manage all system data and user access.
 */

import type { User } from '@clerk/clerk-react';

export interface AdminSession {
  code: string;
  adminName: string;
  adminId: string;
  timestamp: number;
}

/**
 * Validate if user has admin role access
 */
export function validateAdminRole(user: User | null | undefined): boolean {
  if (!user) return false;
  
  const role = getAdminRole(user);
  return role === 'admin';
}

/**
 * Extract admin role from user metadata
 */
export function getAdminRole(user: User | null | undefined): string {
  if (!user) return '';
  
  // Check multiple sources for role information
  const publicMeta = user.publicMetadata as any;
  const privateMeta = user.privateMetadata as any;
  const unsafeMeta = user.unsafeMetadata as any;
  
  return (
    publicMeta?.role ||
    privateMeta?.role ||
    unsafeMeta?.role ||
    publicMeta?.hub_role ||
    privateMeta?.hub_role ||
    unsafeMeta?.hub_role ||
    ''
  ).toLowerCase();
}

/**
 * Set admin session data for navigation context
 */
export function setAdminSession(code: string, adminName: string, adminId: string): void {
  try {
    const session: AdminSession = {
      code,
      adminName,
      adminId,
      timestamp: Date.now()
    };
    
    sessionStorage.setItem('admin:session', JSON.stringify(session));
    sessionStorage.setItem('admin:lastCode', code);
    sessionStorage.setItem('admin:lastAdmin', adminName);
    sessionStorage.setItem('admin:adminId', adminId);
    
    // Set generic session for hub routing compatibility
    sessionStorage.setItem('me:lastRole', 'admin');
    sessionStorage.setItem('me:lastCode', code);
  } catch (error) {
    console.warn('[adminAuth] Failed to set session:', error);
  }
}

/**
 * Get admin session data
 */
export function getAdminSession(): AdminSession {
  try {
    const sessionData = sessionStorage.getItem('admin:session');
    if (sessionData) {
      const session = JSON.parse(sessionData) as AdminSession;
      
      // Check if session is not too old (24 hours)
      const isValid = Date.now() - session.timestamp < 24 * 60 * 60 * 1000;
      if (isValid) {
        return session;
      }
    }
    
    // Fallback to individual storage keys
    const code = sessionStorage.getItem('admin:lastCode') || '';
    const adminName = sessionStorage.getItem('admin:lastAdmin') || '';
    const adminId = sessionStorage.getItem('admin:adminId') || '';
    
    return { code, adminName, adminId, timestamp: 0 };
  } catch {
    return { code: '', adminName: '', adminId: '', timestamp: 0 };
  }
}

/**
 * Clear admin session data
 */
export function clearAdminSession(): void {
  try {
    sessionStorage.removeItem('admin:session');
    sessionStorage.removeItem('admin:lastCode');
    sessionStorage.removeItem('admin:lastAdmin');
    sessionStorage.removeItem('admin:adminId');
  } catch (error) {
    console.warn('[adminAuth] Failed to clear session:', error);
  }
}

/**
 * Check if admin has system management access
 */
export function hasAdminSystemAccess(user: User | null | undefined): boolean {
  if (!validateAdminRole(user)) return false;
  
  const publicMeta = user?.publicMetadata as any;
  const privateMeta = user?.privateMetadata as any;
  
  // Admin users have system access by default
  const systemAccess = publicMeta?.system_access || privateMeta?.system_access || true;
  const status = publicMeta?.admin_status || privateMeta?.admin_status || 'active';
  
  return systemAccess && status === 'active';
}

/**
 * Get admin operational information from user metadata
 */
export function getAdminOperationalInfo(user: User | null | undefined): {
  adminId: string;
  adminName: string;
  role: string;
  department: string;
} {
  if (!user) {
    return {
      adminId: '',
      adminName: '',
      role: '',
      department: ''
    };
  }
  
  const publicMeta = user.publicMetadata as any;
  const privateMeta = user.privateMetadata as any;
  
  return {
    adminId: publicMeta?.admin_id || privateMeta?.admin_id || '',
    adminName: publicMeta?.admin_name || privateMeta?.admin_name || user.fullName || '',
    role: publicMeta?.admin_role || privateMeta?.admin_role || 'System Administrator',
    department: publicMeta?.department || privateMeta?.department || 'IT Administration'
  };
}