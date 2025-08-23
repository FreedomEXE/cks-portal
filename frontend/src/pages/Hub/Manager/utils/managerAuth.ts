/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * managerAuth.ts
 * 
 * Description: Manager-specific authentication and role validation utilities
 * Function: Validates manager access permissions and handles role checking
 * Importance: Critical - Security layer for Manager hub access control
 * Connects to: Clerk authentication, Manager role validation, session management
 * 
 * Notes: Manager-specific version of getRole with additional security checks.
 *        Ensures only authenticated managers can access Manager hub.
 *        Handles manager role persistence in sessionStorage.
 */

// Manager-specific role extraction and validation
export function getManagerRole(user: any, headers?: Record<string, string | null | undefined>) {
  const raw = (user as any)?.publicMetadata?.role ?? (user as any)?.role ?? undefined;
  if (raw && typeof raw === 'string') {
    const role = raw.toLowerCase();
    // Only return role if it's manager
    if (role === 'manager') return role;
  }
  
  // Allow header fallback for manager role only
  const hdr = (headers?.['x-user-role'] ?? headers?.['X-User-Role']) as string | undefined;
  if (hdr && String(hdr).toLowerCase() === 'manager') {
    return 'manager';
  }
  
  console.debug('[getManagerRole] Manager role not found', { raw, header: hdr });
  return null;
}

// Validate that user has manager role access
export function validateManagerRole(user: any): boolean {
  const role = getManagerRole(user);
  const isValidManager = role === 'manager';
  
  console.debug('[validateManagerRole]', { 
    userId: user?.id, 
    role, 
    isValidManager,
    metadata: user?.publicMetadata 
  });
  
  return isValidManager;
}

// Manager session management utilities
export function setManagerSession(code: string, name?: string) {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('manager:lastRole', 'manager');
      sessionStorage.setItem('manager:lastCode', code);
      if (name) sessionStorage.setItem('manager:lastName', name);
    }
  } catch (error) {
    console.warn('[setManagerSession] Failed to set session', error);
  }
}

export function getManagerSession() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      return {
        role: sessionStorage.getItem('manager:lastRole'),
        code: sessionStorage.getItem('manager:lastCode'),
        name: sessionStorage.getItem('manager:lastName')
      };
    }
  } catch (error) {
    console.warn('[getManagerSession] Failed to get session', error);
  }
  
  return { role: null, code: null, name: null };
}

export function clearManagerSession() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('manager:lastRole');
      sessionStorage.removeItem('manager:lastCode');
      sessionStorage.removeItem('manager:lastName');
    }
  } catch (error) {
    console.warn('[clearManagerSession] Failed to clear session', error);
  }
}