/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * contractorAuth.ts
 * 
 * Description: Contractor-specific authentication and role validation utilities
 * Function: Validates contractor roles, manages contractor sessions, and handles Clerk auth
 * Importance: Critical - Security layer for Contractor hub (premium clients)
 * Connects to: Clerk authentication, Contractor hub components, sessionStorage
 * 
 * Notes: Contractor-specific authentication for paying clients who purchase CKS services.
 *        Includes premium client verification and business account validation.
 *        Isolated from other hub authentication for security separation.
 *        Contractors are top-tier clients in the business hierarchy.
 */

import type { User } from '@clerk/clerk-react';

export interface ContractorSession {
  code: string;
  companyName: string;
  timestamp: number;
}

/**
 * Validate if user has contractor role access
 */
export function validateContractorRole(user: User | null | undefined): boolean {
  if (!user) return false;
  
  // Check for template contractor users (con-XXX format) - same logic as HubRoleRouter
  const username = user.username || '';
  if (/^con-\d{3}$/i.test(username)) {
    return true;
  }
  
  const role = getContractorRole(user);
  return role === 'contractor';
}

/**
 * Extract contractor role from user metadata
 */
export function getContractorRole(user: User | null | undefined): string {
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
 * Set contractor session data for navigation context
 */
export function setContractorSession(code: string, companyName: string): void {
  try {
    const session: ContractorSession = {
      code,
      companyName,
      timestamp: Date.now()
    };
    
    sessionStorage.setItem('contractor:session', JSON.stringify(session));
    sessionStorage.setItem('contractor:lastCode', code);
    sessionStorage.setItem('contractor:lastCompany', companyName);
    
    // Set generic session for hub routing compatibility
    sessionStorage.setItem('me:lastRole', 'contractor');
    sessionStorage.setItem('me:lastCode', code);
  } catch (error) {
    console.warn('[contractorAuth] Failed to set session:', error);
  }
}

/**
 * Get contractor session data
 */
export function getContractorSession(): ContractorSession {
  try {
    const sessionData = sessionStorage.getItem('contractor:session');
    if (sessionData) {
      const session = JSON.parse(sessionData) as ContractorSession;
      
      // Check if session is not too old (24 hours)
      const isValid = Date.now() - session.timestamp < 24 * 60 * 60 * 1000;
      if (isValid) {
        return session;
      }
    }
    
    // Fallback to individual storage keys
    const code = sessionStorage.getItem('contractor:lastCode') || '';
    const companyName = sessionStorage.getItem('contractor:lastCompany') || '';
    
    return { code, companyName, timestamp: 0 };
  } catch {
    return { code: '', companyName: '', timestamp: 0 };
  }
}

/**
 * Clear contractor session data
 */
export function clearContractorSession(): void {
  try {
    sessionStorage.removeItem('contractor:session');
    sessionStorage.removeItem('contractor:lastCode');
    sessionStorage.removeItem('contractor:lastCompany');
  } catch (error) {
    console.warn('[contractorAuth] Failed to clear session:', error);
  }
}

/**
 * Check if contractor has premium access
 */
export function hasContractorPremiumAccess(user: User | null | undefined): boolean {
  if (!validateContractorRole(user)) return false;
  
  const publicMeta = user?.publicMetadata as any;
  const privateMeta = user?.privateMetadata as any;
  
  // Contractors are premium by default since they pay for services
  const tier = publicMeta?.tier || privateMeta?.tier || 'premium';
  const status = publicMeta?.account_status || privateMeta?.account_status || 'active';
  
  return tier === 'premium' && status === 'active';
}

/**
 * Get contractor business information from user metadata
 */
export function getContractorBusinessInfo(user: User | null | undefined): {
  contractorId: string;
  companyName: string;
  businessLicense: string;
} {
  if (!user) {
    return {
      contractorId: '',
      companyName: '',
      businessLicense: ''
    };
  }
  
  const publicMeta = user.publicMetadata as any;
  const privateMeta = user.privateMetadata as any;
  
  return {
    contractorId: publicMeta?.contractor_id || privateMeta?.contractor_id || '',
    companyName: publicMeta?.company_name || privateMeta?.company_name || '',
    businessLicense: publicMeta?.business_license || privateMeta?.business_license || ''
  };
}