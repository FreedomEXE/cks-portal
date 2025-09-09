/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: manager.ts
 * 
 * Description: Typed fetch wrappers for /api/manager/* (one function per endpoint).
 * Function: Provide HTTP helpers returning typed results for Manager APIs.
 * Importance: Centralizes network calls for Manager frontend tabs.
 * Connects to: types/manager.d.ts, types/api.d.ts.
 */

import type { ApiResponse, ManagerKPI } from '../types';

const BASE_URL = '/api/manager';

export async function fetchDashboardKPIs(): Promise<ManagerKPI> {
  const response = await fetch(`${BASE_URL}/dashboard/kpis`);
  const result: ApiResponse<ManagerKPI> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch KPIs');
  }
  
  return result.data;
}
