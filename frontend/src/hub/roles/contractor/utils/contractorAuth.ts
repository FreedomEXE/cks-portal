/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * contractorAuth.ts
 * 
 * Description: Contractor-specific authentication and role validation utilities
 * Function: Handle contractor role validation, session management, and permissions
 * Importance: Critical - Security layer for contractor hub access control
 * Connects to: Authentication system, contractor role validation, session storage
 * 
 * Notes: Contractor-specific version of authentication utilities with premium client handling.
 */

/**
 * Contractor-specific role extraction and validation
 */
export function getContractorRole(user: any, headers?: Record<string, string | null | undefined>): string | null {
  // Check user metadata for contractor role
  const raw = (user as any)?.publicMetadata?.role ?? (user as any)?.role ?? undefined;
  if (raw && typeof raw === 'string') {
    const role = raw.toLowerCase();
    // Only return role if it's contractor
    if (role === 'contractor') return role;
  }
  
  // Allow header fallback for contractor role only
  const headerRole = (headers?.['x-user-role'] ?? headers?.['X-User-Role']) as string | undefined;
  if (headerRole && String(headerRole).toLowerCase() === 'contractor') {
    return 'contractor';
  }
  
  console.debug('[getContractorRole] Contractor role not found', { raw, header: headerRole });
  return null;
}

/**
 * Validate that user has contractor role access
 */
export function validateContractorRole(user: any): boolean {
  const role = getContractorRole(user);
  let isValidContractor = role === 'contractor';

  // Dev/MVP fallback: allow session-mapped role
  if (!isValidContractor) {
    try {
      const fallback = (typeof sessionStorage !== 'undefined') ? 
        (sessionStorage.getItem('me:lastRole') || sessionStorage.getItem('contractor:lastRole')) : null;
      if ((fallback || '').toLowerCase() === 'contractor') {
        isValidContractor = true;
      }
    } catch { 
      // Ignore storage errors
    }
  }

  console.debug('[validateContractorRole]', {
    userId: user?.id,
    role,
    isValidContractor,
    metadata: user?.publicMetadata
  });

  return isValidContractor;
}

/**
 * Check if contractor has premium access
 */
export function hasContractorPremiumAccess(user: any): boolean {
  try {
    const metadata = user?.publicMetadata || {};
    
    // Check for premium subscription flags
    if (metadata.isPremium === true || metadata.subscription === 'premium') {
      return true;
    }
    
    // Check for contractor-specific premium indicators
    if (metadata.contractorTier === 'premium' || metadata.accountType === 'enterprise') {
      return true;
    }
    
    // All contractors are considered premium by default in MVP
    if (validateContractorRole(user)) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('[hasContractorPremiumAccess] Error checking premium access:', error);
    return false;
  }
}

/**
 * Contractor session management utilities
 */
export function setContractorSession(code: string, companyName?: string): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('contractor:lastRole', 'contractor');
      sessionStorage.setItem('contractor:lastCode', code);
      if (companyName) {
        sessionStorage.setItem('contractor:lastCompanyName', companyName);
      }
      
      // Set timestamp for session tracking
      sessionStorage.setItem('contractor:sessionTimestamp', new Date().toISOString());
    }
  } catch (error) {
    console.warn('[setContractorSession] Failed to set session:', error);
  }
}

export function getContractorSession(): {
  role: string | null;
  code: string | null;
  companyName: string | null;
  timestamp: string | null;
} {
  try {
    if (typeof sessionStorage !== 'undefined') {
      return {
        role: sessionStorage.getItem('contractor:lastRole'),
        code: sessionStorage.getItem('contractor:lastCode'),
        companyName: sessionStorage.getItem('contractor:lastCompanyName'),
        timestamp: sessionStorage.getItem('contractor:sessionTimestamp')
      };
    }
  } catch (error) {
    console.warn('[getContractorSession] Failed to get session:', error);
  }
  
  return { role: null, code: null, companyName: null, timestamp: null };
}

export function clearContractorSession(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('contractor:lastRole');
      sessionStorage.removeItem('contractor:lastCode');
      sessionStorage.removeItem('contractor:lastCompanyName');
      sessionStorage.removeItem('contractor:sessionTimestamp');
    }
  } catch (error) {
    console.warn('[clearContractorSession] Failed to clear session:', error);
  }
}

/**
 * Check contractor permissions against required capabilities
 */
export function hasContractorPermission(
  user: any, 
  requiredPermission: string,
  userPermissions?: string[]
): boolean {
  try {
    // Admin override
    if (user?.publicMetadata?.role === 'admin') {
      return true;
    }
    
    // Must be valid contractor first
    if (!validateContractorRole(user)) {
      return false;
    }
    
    // Check explicit permissions list
    if (userPermissions && Array.isArray(userPermissions)) {
      return userPermissions.includes(requiredPermission);
    }
    
    // Check user metadata for permissions
    const permissions = user?.publicMetadata?.permissions || [];
    if (Array.isArray(permissions) && permissions.includes(requiredPermission)) {
      return true;
    }
    
    // Default contractor permissions
    const defaultPermissions = [
      'dashboard:view',
      'profile:view',
      'services:manage',
      'ecosystem:view',
      'orders:view',
      'orders:approve',
      'reports:view',
      'support:access'
    ];
    
    return defaultPermissions.includes(requiredPermission);
  } catch (error) {
    console.warn('[hasContractorPermission] Error checking permission:', error);
    return false;
  }
}

/**
 * Get contractor ID from various sources
 */
export function getContractorId(user?: any): string | null {
  try {
    // Try user metadata first
    if (user?.publicMetadata?.contractorId) {
      return user.publicMetadata.contractorId;
    }
    
    // Try session storage
    const session = getContractorSession();
    if (session.code) {
      return session.code;
    }
    
    // Try URL extraction
    const pathMatch = window.location.pathname.match(/\/(CON-\d+)\/hub/i);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1].toUpperCase();
    }
    
    // Try query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    if (codeParam && codeParam.match(/^CON-\d+$/i)) {
      return codeParam.toUpperCase();
    }
    
    return null;
  } catch (error) {
    console.warn('[getContractorId] Error getting contractor ID:', error);
    return null;
  }
}

/**
 * Validate contractor session and refresh if needed
 */
export async function validateContractorSession(user: any): Promise<boolean> {
  try {
    // Basic role validation
    if (!validateContractorRole(user)) {
      return false;
    }
    
    // Check session freshness
    const session = getContractorSession();
    if (session.timestamp) {
      const sessionTime = new Date(session.timestamp);
      const now = new Date();
      const hoursSinceSession = (now.getTime() - sessionTime.getTime()) / (1000 * 60 * 60);
      
      // Refresh session if older than 24 hours
      if (hoursSinceSession > 24) {
        const contractorId = getContractorId(user);
        if (contractorId) {
          setContractorSession(contractorId, session.companyName || undefined);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.warn('[validateContractorSession] Error validating session:', error);
    return false;
  }
}

/**
 * Check if contractor account is in good standing
 */
export function isContractorAccountActive(user: any): boolean {
  try {
    const metadata = user?.publicMetadata || {};
    
    // Check account status
    if (metadata.accountStatus === 'suspended' || metadata.accountStatus === 'terminated') {
      return false;
    }
    
    // Check payment status for premium features
    if (metadata.paymentStatus === 'overdue' || metadata.paymentStatus === 'failed') {
      console.warn('[isContractorAccountActive] Payment issues detected');
      // Still allow access but may limit features
    }
    
    // Default to active for valid contractors
    return validateContractorRole(user);
  } catch (error) {
    console.warn('[isContractorAccountActive] Error checking account status:', error);
    return false;
  }
}