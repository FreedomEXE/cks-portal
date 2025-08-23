/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * centerAuth.ts
 * 
 * Description: Center-specific authentication and role validation utilities
 * Function: Validates center roles, manages center sessions, and handles Clerk auth
 * Importance: Critical - Security layer for Center hub (crew coordinators)
 * Connects to: Clerk authentication, Center hub components, sessionStorage
 * 
 * Notes: Center-specific authentication for crew coordination through CKS services.
 *        Includes facility manager verification and operational validation.
 *        Isolated from other hub authentication for security separation.
 *        Centers coordinate crew operations and report to customer managers.
 */

import type { User } from '@clerk/clerk-react';

export interface CenterSession {
  code: string;
  centerName: string;
  timestamp: number;
}

/**
 * Validate if user has center role access
 */
export function validateCenterRole(user: User | null | undefined): boolean {
  if (!user) return false;
  
  const role = getCenterRole(user);
  return role === 'center';
}

/**
 * Extract center role from user metadata
 */
export function getCenterRole(user: User | null | undefined): string {
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
 * Set center session data for navigation context
 */
export function setCenterSession(code: string, centerName: string): void {
  try {
    const session: CenterSession = {
      code,
      centerName,
      timestamp: Date.now()
    };
    
    sessionStorage.setItem('center:session', JSON.stringify(session));
    sessionStorage.setItem('center:lastCode', code);
    sessionStorage.setItem('center:lastCenter', centerName);
    
    // Set generic session for hub routing compatibility
    sessionStorage.setItem('me:lastRole', 'center');
    sessionStorage.setItem('me:lastCode', code);
  } catch (error) {
    console.warn('[centerAuth] Failed to set session:', error);
  }
}

/**
 * Get center session data
 */
export function getCenterSession(): CenterSession {
  try {
    const sessionData = sessionStorage.getItem('center:session');
    if (sessionData) {
      const session = JSON.parse(sessionData) as CenterSession;
      
      // Check if session is not too old (24 hours)
      const isValid = Date.now() - session.timestamp < 24 * 60 * 60 * 1000;
      if (isValid) {
        return session;
      }
    }
    
    // Fallback to individual storage keys
    const code = sessionStorage.getItem('center:lastCode') || '';
    const centerName = sessionStorage.getItem('center:lastCenter') || '';
    
    return { code, centerName, timestamp: 0 };
  } catch {
    return { code: '', centerName: '', timestamp: 0 };
  }
}

/**
 * Clear center session data
 */
export function clearCenterSession(): void {
  try {
    sessionStorage.removeItem('center:session');
    sessionStorage.removeItem('center:lastCode');
    sessionStorage.removeItem('center:lastCenter');
  } catch (error) {
    console.warn('[centerAuth] Failed to clear session:', error);
  }
}

/**
 * Check if center has crew coordination access
 */
export function hasCenterCrewAccess(user: User | null | undefined): boolean {
  if (!validateCenterRole(user)) return false;
  
  const publicMeta = user?.publicMetadata as any;
  const privateMeta = user?.privateMetadata as any;
  
  // Centers are crew coordinators by default
  const crewAccess = publicMeta?.crew_access || privateMeta?.crew_access || true;
  const status = publicMeta?.center_status || privateMeta?.center_status || 'active';
  
  return crewAccess && status === 'active';
}

/**
 * Get center operational information from user metadata
 */
export function getCenterOperationalInfo(user: User | null | undefined): {
  centerId: string;
  centerName: string;
  locationType: string;
} {
  if (!user) {
    return {
      centerId: '',
      centerName: '',
      locationType: ''
    };
  }
  
  const publicMeta = user.publicMetadata as any;
  const privateMeta = user.privateMetadata as any;
  
  return {
    centerId: publicMeta?.center_id || privateMeta?.center_id || '',
    centerName: publicMeta?.center_name || privateMeta?.center_name || '',
    locationType: publicMeta?.location_type || privateMeta?.location_type || 'Commercial'
  };
}