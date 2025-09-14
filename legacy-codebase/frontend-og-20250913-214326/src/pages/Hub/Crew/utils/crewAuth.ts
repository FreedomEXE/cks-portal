/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * crewAuth.ts
 * 
 * Description: Crew-specific authentication and role validation utilities
 * Function: Validates crew roles, manages crew sessions, and handles Clerk auth
 * Importance: Critical - Security layer for Crew hub (field workers)
 * Connects to: Clerk authentication, Crew hub components, sessionStorage
 * 
 * Notes: Crew-specific authentication for operational tasks through CKS services.
 *        Includes crew member verification and center assignment validation.
 *        Isolated from other hub authentication for security separation.
 *        Crew members perform tasks and report to center coordinators.
 */

import type { User } from '@clerk/clerk-react';

export interface CrewSession {
  code: string;
  crewName: string;
  centerId: string;
  timestamp: number;
}

/**
 * Validate if user has crew role access
 */
export function validateCrewRole(user: User | null | undefined): boolean {
  if (!user) return false;
  
  // Check for template crew users (crw-XXX format) - same logic as HubRoleRouter
  const username = user.username || '';
  if (/^crw-\d{3}$/i.test(username)) {
    return true;
  }
  
  const role = getCrewRole(user);
  return role === 'crew';
}

/**
 * Extract crew role from user metadata
 */
export function getCrewRole(user: User | null | undefined): string {
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
 * Set crew session data for navigation context
 */
export function setCrewSession(code: string, crewName: string, centerId: string): void {
  try {
    const session: CrewSession = {
      code,
      crewName,
      centerId,
      timestamp: Date.now()
    };
    
    sessionStorage.setItem('crew:session', JSON.stringify(session));
    sessionStorage.setItem('crew:lastCode', code);
    sessionStorage.setItem('crew:lastCrew', crewName);
    sessionStorage.setItem('crew:centerId', centerId);
    
    // Set generic session for hub routing compatibility
    sessionStorage.setItem('me:lastRole', 'crew');
    sessionStorage.setItem('me:lastCode', code);
  } catch (error) {
    console.warn('[crewAuth] Failed to set session:', error);
  }
}

/**
 * Get crew session data
 */
export function getCrewSession(): CrewSession {
  try {
    const sessionData = sessionStorage.getItem('crew:session');
    if (sessionData) {
      const session = JSON.parse(sessionData) as CrewSession;
      
      // Check if session is not too old (24 hours)
      const isValid = Date.now() - session.timestamp < 24 * 60 * 60 * 1000;
      if (isValid) {
        return session;
      }
    }
    
    // Fallback to individual storage keys
    const code = sessionStorage.getItem('crew:lastCode') || '';
    const crewName = sessionStorage.getItem('crew:lastCrew') || '';
    const centerId = sessionStorage.getItem('crew:centerId') || '';
    
    return { code, crewName, centerId, timestamp: 0 };
  } catch {
    return { code: '', crewName: '', centerId: '', timestamp: 0 };
  }
}

/**
 * Clear crew session data
 */
export function clearCrewSession(): void {
  try {
    sessionStorage.removeItem('crew:session');
    sessionStorage.removeItem('crew:lastCode');
    sessionStorage.removeItem('crew:lastCrew');
    sessionStorage.removeItem('crew:centerId');
  } catch (error) {
    console.warn('[crewAuth] Failed to clear session:', error);
  }
}

/**
 * Check if crew has operational task access
 */
export function hasCrewTaskAccess(user: User | null | undefined): boolean {
  if (!validateCrewRole(user)) return false;
  
  const publicMeta = user?.publicMetadata as any;
  const privateMeta = user?.privateMetadata as any;
  
  // Crew members have task access by default
  const taskAccess = publicMeta?.task_access || privateMeta?.task_access || true;
  const status = publicMeta?.crew_status || privateMeta?.crew_status || 'active';
  
  return taskAccess && status === 'active';
}

/**
 * Get crew operational information from user metadata
 */
export function getCrewOperationalInfo(user: User | null | undefined): {
  crewId: string;
  crewName: string;
  role: string;
  centerId: string;
} {
  if (!user) {
    return {
      crewId: '',
      crewName: '',
      role: '',
      centerId: ''
    };
  }
  
  const publicMeta = user.publicMetadata as any;
  const privateMeta = user.privateMetadata as any;
  
  return {
    crewId: publicMeta?.crew_id || privateMeta?.crew_id || '',
    crewName: publicMeta?.crew_name || privateMeta?.crew_name || '',
    role: publicMeta?.crew_role || privateMeta?.crew_role || 'Crew Member',
    centerId: publicMeta?.center_id || privateMeta?.center_id || ''
  };
}