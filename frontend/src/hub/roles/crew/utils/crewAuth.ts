/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * crewAuth.ts - Crew authentication utilities
 */

export function getCrewRole(user: any, headers?: Record<string, string | null | undefined>) {
  const raw = (user as any)?.publicMetadata?.role ?? (user as any)?.role ?? undefined;
  if (raw && typeof raw === 'string') {
    const role = raw.toLowerCase();
    if (role === 'crew') return role;
  }
  
  const hdr = (headers?.['x-user-role'] ?? headers?.['X-User-Role']) as string | undefined;
  if (hdr && String(hdr).toLowerCase() === 'crew') return 'crew';
  
  console.debug('[getCrewRole] Crew role not found', { raw, header: hdr });
  return null;
}

export function validateCrewRole(user: any): boolean {
  const role = getCrewRole(user);
  let isValidCrew = role === 'crew';

  if (!isValidCrew) {
    try {
      const fallback = (typeof sessionStorage !== 'undefined') ? (sessionStorage.getItem('me:lastRole') || sessionStorage.getItem('crew:lastRole')) : null;
      if ((fallback || '').toLowerCase() === 'crew') isValidCrew = true;
    } catch { /* ignore */ }
  }

  console.debug('[validateCrewRole]', { userId: user?.id, role, isValidCrew, metadata: user?.publicMetadata });
  return isValidCrew;
}

export function setCrewSession(code: string, name?: string) {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('crew:lastRole', 'crew');
      sessionStorage.setItem('crew:lastCode', code);
      if (name) sessionStorage.setItem('crew:lastName', name);
    }
  } catch (error) {
    console.warn('[setCrewSession] Failed to set session', error);
  }
}

export function getCrewSession() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      return {
        role: sessionStorage.getItem('crew:lastRole'),
        code: sessionStorage.getItem('crew:lastCode'),
        name: sessionStorage.getItem('crew:lastName')
      };
    }
  } catch (error) {
    console.warn('[getCrewSession] Failed to get session', error);
  }
  return { role: null, code: null, name: null };
}

export function clearCrewSession() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('crew:lastRole');
      sessionStorage.removeItem('crew:lastCode');
      sessionStorage.removeItem('crew:lastName');
    }
  } catch (error) {
    console.warn('[clearCrewSession] Failed to clear session', error);
  }
}