/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * center.ts
 * 
 * Description: Center-specific API client for backend communication
 * Function: Provides center-specific API calls and data fetching
 * Importance: Critical - Primary API interface for Center hub
 * Connects to: Center backend endpoints, authentication, data hooks
 * 
 * Notes: Center-specific version of manager API client.
 *        Handles center operations, territory management, and regional oversight.
 *        Isolated from other role APIs for security and maintainability.
 */

import { buildCenterApiUrl, centerApiFetch } from '../utils/centerApi';

// Center profile management
export async function getCenterProfile(centerId: string) {
  const url = buildCenterApiUrl('/profile', { code: centerId });
  const response = await centerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch center profile: ${response.status}`);
  }
  
  return await response.json();
}

export async function updateCenterProfile(centerId: string, profileData: any) {
  const url = buildCenterApiUrl('/profile');
  const response = await centerApiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update center profile: ${response.status}`);
  }
  
  return await response.json();
}

// Territory and region management
export async function getCenterTerritories(centerId: string) {
  const url = buildCenterApiUrl('/territories', { code: centerId });
  const response = await centerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch territories: ${response.status}`);
  }
  
  return await response.json();
}

export async function updateTerritory(territoryId: string, territoryData: any) {
  const url = buildCenterApiUrl(`/territories/${territoryId}`);
  const response = await centerApiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(territoryData)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update territory: ${response.status}`);
  }
  
  return await response.json();
}

// Order and operation management
export async function getCenterOrders(centerId: string, filters: any = {}) {
  const url = buildCenterApiUrl('/orders', { code: centerId, ...filters });
  const response = await centerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch center orders: ${response.status}`);
  }
  
  return await response.json();
}

export async function getCenterMetrics(centerId: string, period: string = '30d') {
  const url = buildCenterApiUrl('/metrics', { code: centerId, period });
  const response = await centerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch center metrics: ${response.status}`);
  }
  
  return await response.json();
}

// Contractor and team management
export async function getCenterContractors(centerId: string, filters: any = {}) {
  const url = buildCenterApiUrl('/contractors', { code: centerId, ...filters });
  const response = await centerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch contractors: ${response.status}`);
  }
  
  return await response.json();
}

export async function assignContractor(centerId: string, assignmentData: any) {
  const url = buildCenterApiUrl('/contractors/assign');
  const response = await centerApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(assignmentData)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to assign contractor: ${response.status}`);
  }
  
  return await response.json();
}

// Customer and service management
export async function getCenterCustomers(centerId: string, filters: any = {}) {
  const url = buildCenterApiUrl('/customers', { code: centerId, ...filters });
  const response = await centerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch customers: ${response.status}`);
  }
  
  return await response.json();
}

export async function getCenterServices(centerId: string) {
  const url = buildCenterApiUrl('/services', { code: centerId });
  const response = await centerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch services: ${response.status}`);
  }
  
  return await response.json();
}

// Activity and communications
export async function getCenterActivity(centerId: string, limit: number = 5) {
  const url = buildCenterApiUrl('/activity', { code: centerId, limit });
  const response = await centerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch activity: ${response.status}`);
  }
  
  return await response.json();
}

export async function clearCenterActivity(centerId: string) {
  const url = buildCenterApiUrl('/clear-activity', { code: centerId });
  const response = await centerApiFetch(url, {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to clear activity: ${response.status}`);
  }
  
  return await response.json();
}

// Reports and analytics
export async function getCenterReports(centerId: string, reportType: string, period?: string) {
  const params = { code: centerId, type: reportType };
  if (period) params.period = period;
  
  const url = buildCenterApiUrl('/reports', params);
  const response = await centerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch reports: ${response.status}`);
  }
  
  return await response.json();
}

// Support and escalation
export async function createSupportTicket(centerId: string, ticketData: any) {
  const url = buildCenterApiUrl('/support/tickets');
  const response = await centerApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ticketData)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create support ticket: ${response.status}`);
  }
  
  return await response.json();
}