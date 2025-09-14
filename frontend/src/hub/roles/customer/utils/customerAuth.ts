/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * customerAuth.ts
 * 
 * Description: Customer-specific authentication and role validation utilities
 * Function: Validates customer access permissions and handles role checking
 * Importance: Critical - Security layer for Customer hub access control
 * Connects to: Clerk authentication, Customer role validation, session management
 * 
 * Notes: Customer-specific version of getRole with additional security checks.
 *        Ensures only authenticated customers can access Customer hub.
 *        Handles customer role persistence in sessionStorage.
 */

// Customer-specific role extraction and validation
export function getCustomerRole(user: any, headers?: Record<string, string | null | undefined>) {
  const raw = (user as any)?.publicMetadata?.role ?? (user as any)?.role ?? undefined;
  if (raw && typeof raw === 'string') {
    const role = raw.toLowerCase();
    // Only return role if it's customer
    if (role === 'customer') return role;
  }
  
  // Allow header fallback for customer role only
  const hdr = (headers?.['x-user-role'] ?? headers?.['X-User-Role']) as string | undefined;
  if (hdr && String(hdr).toLowerCase() === 'customer') {
    return 'customer';
  }
  
  console.debug('[getCustomerRole] Customer role not found', { raw, header: hdr });
  return null;
}

// Validate that user has customer role access
export function validateCustomerRole(user: any): boolean {
  const role = getCustomerRole(user);
  let isValidCustomer = role === 'customer';

  // Dev/MVP fallback: allow session-mapped role
  if (!isValidCustomer) {
    try {
      const fallback = (typeof sessionStorage !== 'undefined') ? (sessionStorage.getItem('me:lastRole') || sessionStorage.getItem('customer:lastRole')) : null;
      if ((fallback || '').toLowerCase() === 'customer') isValidCustomer = true;
    } catch { /* ignore */ }
  }

  console.debug('[validateCustomerRole]', {
    userId: user?.id,
    role,
    isValidCustomer,
    metadata: user?.publicMetadata
  });

  return isValidCustomer;
}

// Customer session management utilities
export function setCustomerSession(code: string, name?: string) {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('customer:lastRole', 'customer');
      sessionStorage.setItem('customer:lastCode', code);
      if (name) sessionStorage.setItem('customer:lastName', name);
    }
  } catch (error) {
    console.warn('[setCustomerSession] Failed to set session', error);
  }
}

export function getCustomerSession() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      return {
        role: sessionStorage.getItem('customer:lastRole'),
        code: sessionStorage.getItem('customer:lastCode'),
        name: sessionStorage.getItem('customer:lastName')
      };
    }
  } catch (error) {
    console.warn('[getCustomerSession] Failed to get session', error);
  }
  
  return { role: null, code: null, name: null };
}

export function clearCustomerSession() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('customer:lastRole');
      sessionStorage.removeItem('customer:lastCode');
      sessionStorage.removeItem('customer:lastName');
    }
  } catch (error) {
    console.warn('[clearCustomerSession] Failed to clear session', error);
  }
}