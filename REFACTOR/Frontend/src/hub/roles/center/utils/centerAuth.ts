/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * centerAuth.ts - Center authentication utilities
 */

export function getCenterRole(user: any, headers?: Record<string, string | null | undefined>) {
  const raw = (user as any)?.publicMetadata?.role ?? (user as any)?.role ?? undefined;
  if (raw && typeof raw === 'string') {
    const role = raw.toLowerCase();
    if (role === 'center') return role;
  }
  
  const hdr = (headers?.['x-user-role'] ?? headers?.['X-User-Role']) as string | undefined;
  if (hdr && String(hdr).toLowerCase() === 'center') return 'center';
  
  console.debug('[getCenterRole] Center role not found', { raw, header: hdr });
  return null;
}

export function validateCenterRole(user: any): boolean {
  const role = getCenterRole(user);
  let isValidCenter = role === 'center';

  if (!isValidCenter) {
    try {
      const fallback = (typeof sessionStorage !== 'undefined') ? (sessionStorage.getItem('me:lastRole') || sessionStorage.getItem('center:lastRole')) : null;
      if ((fallback || '').toLowerCase() === 'center') isValidCenter = true;
    } catch { /* ignore */ }
  }

  console.debug('[validateCenterRole]', { userId: user?.id, role, isValidCenter, metadata: user?.publicMetadata });
  return isValidCenter;
}

export function setCenterSession(code: string, name?: string) {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('center:lastRole', 'center');
      sessionStorage.setItem('center:lastCode', code);
      if (name) sessionStorage.setItem('center:lastName', name);
    }
  } catch (error) {
    console.warn('[setCenterSession] Failed to set session', error);
  }
}

export function getCenterSession() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      return {
        role: sessionStorage.getItem('center:lastRole'),
        code: sessionStorage.getItem('center:lastCode'),
        name: sessionStorage.getItem('center:lastName')
      };
    }
  } catch (error) {
    console.warn('[getCenterSession] Failed to get session', error);
  }
  return { role: null, code: null, name: null };
}

export function clearCenterSession() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('center:lastRole');
      sessionStorage.removeItem('center:lastCode');
      sessionStorage.removeItem('center:lastName');
    }
  } catch (error) {
    console.warn('[clearCenterSession] Failed to clear session', error);
  }
}