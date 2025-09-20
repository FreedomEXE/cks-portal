/*-----------------------------------------------
  Property of CKS  © 2025
-----------------------------------------------*/
/**
 * File: base.ts
 *
 * Description:
 * Base API configuration and utilities
 *
 * Responsibilities:
 * - Provide base API configuration
 * - Handle common API operations
 *
 * Role in system:
 * - Foundation for all API calls
 *
 * Notes:
 * Shared across all roles
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

export const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export async function fetchAPI<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export default { API_BASE_URL, fetchAPI };