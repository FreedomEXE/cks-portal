/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * warehouseAuth.ts - Warehouse authentication utilities
 */

export function getWarehouseRole(user: any, headers?: Record<string, string | null | undefined>) {
  const raw = (user as any)?.publicMetadata?.role ?? (user as any)?.role ?? undefined;
  if (raw && typeof raw === 'string') {
    const role = raw.toLowerCase();
    if (role === 'warehouse') return role;
  }
  
  const hdr = (headers?.['x-user-role'] ?? headers?.['X-User-Role']) as string | undefined;
  if (hdr && String(hdr).toLowerCase() === 'warehouse') return 'warehouse';
  
  console.debug('[getWarehouseRole] Warehouse role not found', { raw, header: hdr });
  return null;
}

export function validateWarehouseRole(user: any): boolean {
  const role = getWarehouseRole(user);
  let isValidWarehouse = role === 'warehouse';

  if (!isValidWarehouse) {
    try {
      const fallback = (typeof sessionStorage !== 'undefined') ? (sessionStorage.getItem('me:lastRole') || sessionStorage.getItem('warehouse:lastRole')) : null;
      if ((fallback || '').toLowerCase() === 'warehouse') isValidWarehouse = true;
    } catch { /* ignore */ }
  }

  console.debug('[validateWarehouseRole]', { userId: user?.id, role, isValidWarehouse, metadata: user?.publicMetadata });
  return isValidWarehouse;
}

export function setWarehouseSession(code: string, name?: string) {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('warehouse:lastRole', 'warehouse');
      sessionStorage.setItem('warehouse:lastCode', code);
      if (name) sessionStorage.setItem('warehouse:lastName', name);
    }
  } catch (error) {
    console.warn('[setWarehouseSession] Failed to set session', error);
  }
}

export function getWarehouseSession() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      return {
        role: sessionStorage.getItem('warehouse:lastRole'),
        code: sessionStorage.getItem('warehouse:lastCode'),
        name: sessionStorage.getItem('warehouse:lastName')
      };
    }
  } catch (error) {
    console.warn('[getWarehouseSession] Failed to get session', error);
  }
  return { role: null, code: null, name: null };
}

export function clearWarehouseSession() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('warehouse:lastRole');
      sessionStorage.removeItem('warehouse:lastCode');
      sessionStorage.removeItem('warehouse:lastName');
    }
  } catch (error) {
    console.warn('[clearWarehouseSession] Failed to clear session', error);
  }
}