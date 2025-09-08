/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * customerAuth.ts
 * 
 * Description: Customer-specific authentication and role validation utilities
 * Function: Validates customer roles, manages customer sessions, and handles Clerk auth
 * Importance: Critical - Security layer for Customer hub (center managers)
 * Connects to: Clerk authentication, Customer hub components, sessionStorage
 * 
 * Notes: Customer-specific authentication for center management through CKS services.
 *        Includes center manager verification and account validation.
 *        Isolated from other hub authentication for security separation.
 *        Customers are center managers working through contractor arrangements.
 */

import type { User } from '@clerk/clerk-react';

export interface CustomerSession {
  code: string;
  customerName: string;
  timestamp: number;
}

/**
 * Validate if user has customer role access
 */
export function validateCustomerRole(user: User | null | undefined): boolean {
  if (!user) return false;
  
  // Check for template customer users (cus-XXX format) - same logic as HubRoleRouter
  const username = user.username || '';
  if (/^cus-\d{3}$/i.test(username)) {
    return true;
  }
  
  const role = getCustomerRole(user);
  return role === 'customer';
}

/**
 * Extract customer role from user metadata
 */
export function getCustomerRole(user: User | null | undefined): string {
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
 * Set customer session data for navigation context
 */
export function setCustomerSession(code: string, customerName: string): void {
  try {
    const session: CustomerSession = {
      code,
      customerName,
      timestamp: Date.now()
    };
    
    sessionStorage.setItem('customer:session', JSON.stringify(session));
    sessionStorage.setItem('customer:lastCode', code);
    sessionStorage.setItem('customer:lastName', customerName);
    
    // Set generic session for hub routing compatibility
    sessionStorage.setItem('me:lastRole', 'customer');
    sessionStorage.setItem('me:lastCode', code);
  } catch (error) {
    console.warn('[customerAuth] Failed to set session:', error);
  }
}

/**
 * Get customer session data
 */
export function getCustomerSession(): CustomerSession {
  try {
    const sessionData = sessionStorage.getItem('customer:session');
    if (sessionData) {
      const session = JSON.parse(sessionData) as CustomerSession;
      
      // Check if session is not too old (24 hours)
      const isValid = Date.now() - session.timestamp < 24 * 60 * 60 * 1000;
      if (isValid) {
        return session;
      }
    }
    
    // Fallback to individual storage keys
    const code = sessionStorage.getItem('customer:lastCode') || '';
    const customerName = sessionStorage.getItem('customer:lastName') || '';
    
    return { code, customerName, timestamp: 0 };
  } catch {
    return { code: '', customerName: '', timestamp: 0 };
  }
}

/**
 * Clear customer session data
 */
export function clearCustomerSession(): void {
  try {
    sessionStorage.removeItem('customer:session');
    sessionStorage.removeItem('customer:lastCode');
    sessionStorage.removeItem('customer:lastName');
  } catch (error) {
    console.warn('[customerAuth] Failed to clear session:', error);
  }
}

/**
 * Check if customer has center management access
 */
export function hasCustomerCenterAccess(user: User | null | undefined): boolean {
  if (!validateCustomerRole(user)) return false;
  
  const publicMeta = user?.publicMetadata as any;
  const privateMeta = user?.privateMetadata as any;
  
  // Customers are center managers by default
  const centerAccess = publicMeta?.center_access || privateMeta?.center_access || true;
  const status = publicMeta?.account_status || privateMeta?.account_status || 'active';
  
  return centerAccess && status === 'active';
}

/**
 * Get customer business information from user metadata
 */
export function getCustomerBusinessInfo(user: User | null | undefined): {
  customerId: string;
  customerName: string;
  accountType: string;
} {
  if (!user) {
    return {
      customerId: '',
      customerName: '',
      accountType: ''
    };
  }
  
  const publicMeta = user.publicMetadata as any;
  const privateMeta = user.privateMetadata as any;
  
  return {
    customerId: publicMeta?.customer_id || privateMeta?.customer_id || '',
    customerName: publicMeta?.customer_name || privateMeta?.customer_name || '',
    accountType: publicMeta?.account_type || privateMeta?.account_type || 'Corporate'
  };
}