/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * customer.ts
 * 
 * Description: Customer-specific API client for backend communication
 * Function: Provides customer-specific API calls and data fetching
 * Importance: Critical - Primary API interface for Customer hub
 * Connects to: Customer backend endpoints, authentication, data hooks
 * 
 * Notes: Customer-specific version of manager API client.
 *        Handles customer data fetching, order management, and profile updates.
 *        Isolated from other role APIs for security and maintainability.
 */

import { buildCustomerApiUrl, customerApiFetch } from '../utils/customerApi';

// Customer profile management
export async function getCustomerProfile(customerId: string) {
  const url = buildCustomerApiUrl('/profile', { code: customerId });
  const response = await customerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch customer profile: ${response.status}`);
  }
  
  return await response.json();
}

export async function updateCustomerProfile(customerId: string, profileData: any) {
  const url = buildCustomerApiUrl('/profile');
  const response = await customerApiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update customer profile: ${response.status}`);
  }
  
  return await response.json();
}

// Order management
export async function getCustomerOrders(customerId: string, filters: any = {}) {
  const url = buildCustomerApiUrl('/orders', { code: customerId, ...filters });
  const response = await customerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch customer orders: ${response.status}`);
  }
  
  return await response.json();
}

export async function createOrder(customerId: string, orderData: any) {
  const url = buildCustomerApiUrl('/orders');
  const response = await customerApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create order: ${response.status}`);
  }
  
  return await response.json();
}

export async function updateOrderStatus(orderId: string, status: string, notes?: string) {
  const url = buildCustomerApiUrl(`/orders/${orderId}/status`);
  const response = await customerApiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, notes })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update order status: ${response.status}`);
  }
  
  return await response.json();
}

// Service requests
export async function getAvailableServices(customerId: string, location?: string) {
  const params = { code: customerId };
  if (location) params.location = location;
  
  const url = buildCustomerApiUrl('/services', params);
  const response = await customerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch services: ${response.status}`);
  }
  
  return await response.json();
}

export async function requestServiceQuote(customerId: string, serviceRequest: any) {
  const url = buildCustomerApiUrl('/services/quote');
  const response = await customerApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(serviceRequest)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to request quote: ${response.status}`);
  }
  
  return await response.json();
}

// Activity and notifications
export async function getCustomerActivity(customerId: string, limit: number = 5) {
  const url = buildCustomerApiUrl('/activity', { code: customerId, limit });
  const response = await customerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch activity: ${response.status}`);
  }
  
  return await response.json();
}

export async function clearCustomerActivity(customerId: string) {
  const url = buildCustomerApiUrl('/clear-activity', { code: customerId });
  const response = await customerApiFetch(url, {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to clear activity: ${response.status}`);
  }
  
  return await response.json();
}

// Support and communication
export async function createSupportTicket(customerId: string, ticketData: any) {
  const url = buildCustomerApiUrl('/support/tickets');
  const response = await customerApiFetch(url, {
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

export async function getSupportTickets(customerId: string) {
  const url = buildCustomerApiUrl('/support/tickets', { code: customerId });
  const response = await customerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch support tickets: ${response.status}`);
  }
  
  return await response.json();
}

// Reports and analytics
export async function getCustomerReports(customerId: string, reportType: string, period?: string) {
  const params = { code: customerId, type: reportType };
  if (period) params.period = period;
  
  const url = buildCustomerApiUrl('/reports', params);
  const response = await customerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch reports: ${response.status}`);
  }
  
  return await response.json();
}

// Preferences and settings
export async function getCustomerPreferences(customerId: string) {
  const url = buildCustomerApiUrl('/preferences', { code: customerId });
  const response = await customerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch preferences: ${response.status}`);
  }
  
  return await response.json();
}

export async function updateCustomerPreferences(customerId: string, preferences: any) {
  const url = buildCustomerApiUrl('/preferences');
  const response = await customerApiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preferences)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update preferences: ${response.status}`);
  }
  
  return await response.json();
}