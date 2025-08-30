/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * warehouseAuth.ts
 * 
 * Description: Warehouse hub authentication utilities
 * Function: Session management and user authentication for warehouse hub
 * Importance: Critical - Handles warehouse user sessions and auth state
 * Connects to: Warehouse hub components, localStorage, warehouse API
 * 
 * Notes: Manages warehouse user sessions with persistent storage.
 *        Follows same pattern as other hub auth utilities.
 *        Purple theme integration for warehouse-specific branding.
 */

export interface WarehouseSession {
  code: string;
  name: string;
  warehouse_id?: string;
  timestamp: number;
}

const WAREHOUSE_SESSION_KEY = 'cks_warehouse_session';
const SESSION_EXPIRY_HOURS = 8; // 8 hours for warehouse shifts

export function setWarehouseSession(code: string, name: string, warehouse_id?: string): void {
  const session: WarehouseSession = {
    code,
    name,
    warehouse_id,
    timestamp: Date.now()
  };
  localStorage.setItem(WAREHOUSE_SESSION_KEY, JSON.stringify(session));
}

export function getWarehouseSession(): WarehouseSession {
  try {
    const stored = localStorage.getItem(WAREHOUSE_SESSION_KEY);
    if (!stored) return { code: '', name: '', timestamp: 0 };
    
    const session: WarehouseSession = JSON.parse(stored);
    const isExpired = Date.now() - session.timestamp > (SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
    
    if (isExpired) {
      clearWarehouseSession();
      return { code: '', name: '', timestamp: 0 };
    }
    
    return session;
  } catch {
    return { code: '', name: '', timestamp: 0 };
  }
}

export function clearWarehouseSession(): void {
  localStorage.removeItem(WAREHOUSE_SESSION_KEY);
}

export function isWarehouseSessionValid(): boolean {
  const session = getWarehouseSession();
  return Boolean(session.code && session.name);
}