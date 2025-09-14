/*───────────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * roles.ts
 * 
 * Description: Role detection and validation utilities
 * Function: Determines user roles from modern ID prefixes
 * Importance: Critical - Ensures consistent role detection across the platform
 * Connects to: Used by authentication and profile endpoints
 * 
 * Notes: Uses modern ID format: prefix-number (e.g., con-000, ctr-001)
 */

export type UserRole = 'admin' | 'manager' | 'contractor' | 'customer' | 'center' | 'crew';

/**
 * Detect role from internal code using modern prefixes
 */
export function roleFromInternalCode(code: string): UserRole | null {
  if (!code) return null;
  
  const lowerCode = code.toLowerCase();
  
  // Check for specific codes
  if (lowerCode === 'admin-000') return 'admin';
  
  // Check prefixes
  if (lowerCode.startsWith('mgr-')) return 'manager';
  if (lowerCode.startsWith('con-')) return 'contractor';
  if (lowerCode.startsWith('cust-')) return 'customer';
  if (lowerCode.startsWith('ctr-')) return 'center';
  if (lowerCode.startsWith('crew-')) return 'crew';
  
  return null;
}

/**
 * Validate if a code matches expected format for a role
 */
export function isValidCode(code: string, role: UserRole): boolean {
  const lowerCode = code.toLowerCase();
  
  switch (role) {
    case 'admin':
      return lowerCode === 'admin-000';
    case 'manager':
      return /^mgr-\d{3}$/i.test(code);
    case 'contractor':
      return /^con-\d{3}$/i.test(code);
    case 'customer':
      return /^cust-\d{3}$/i.test(code);
    case 'center':
      return /^ctr-\d{3}$/i.test(code);
    case 'crew':
      return /^crew-\d{3}$/i.test(code);
    default:
      return false;
  }
}

/**
 * Get expected ID prefix for a role
 */
export function getPrefixForRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'admin';
    case 'manager':
      return 'mgr';
    case 'contractor':
      return 'con';
    case 'customer':
      return 'cust';
    case 'center':
      return 'ctr';
    case 'crew':
      return 'crew';
    default:
      return '';
  }
}