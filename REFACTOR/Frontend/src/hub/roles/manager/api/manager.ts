/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * manager.ts
 * 
 * Description: Complete Manager API layer with typed endpoints and error handling
 * Function: Provides typed HTTP helpers for all Manager hub functionality
 * Importance: Critical - Centralizes all network calls with proper error handling
 * Connects to: Manager API endpoints, types, authentication, and validation
 * 
 * Notes: Production-ready API layer with comprehensive coverage.
 *        Includes proper error handling, type safety, and authentication.
 *        All endpoints needed for complete Manager hub functionality.
 */

import { buildManagerApiUrl, managerApiFetch } from '../utils/managerApi';
import type { ApiResponse } from '../../../shared/types/api';
import type { 
  ManagerKPI, 
  ManagerProfile, 
  ManagerService, 
  ManagerActivity, 
  EcosystemNode,
  ManagerRequest,
  ManagerRequestCounts,
  ManagerOrderDetail,
  ManagerReportListItem,
  ManagerFeedbackListItem,
  ManagerReportDetail,
  ManagerFeedbackDetail,
  ManagerReportTotals,
  ManagerFeedbackTotals,
  ManagerPreferences,
  NewsItem
} from '../types/manager';

/**
 * Dashboard API endpoints
 */
export async function fetchDashboardKPIs(managerId: string): Promise<ManagerKPI> {
  const url = buildManagerApiUrl('/dashboard', { code: managerId });
  const response = await managerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard KPIs: ${response.status}`);
  }
  
  const result = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch KPIs');
  }
  
  return result.data;
}

export async function fetchManagerActivity(managerId: string, limit = 5): Promise<ManagerActivity[]> {
  const url = buildManagerApiUrl('/activity', { code: managerId, limit });
  const response = await managerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch activity: ${response.status}`);
  }
  
  const result = await response.json();
  return Array.isArray(result?.data) ? result.data : [];
}

export async function clearManagerActivity(managerId: string): Promise<void> {
  const url = buildManagerApiUrl('/clear-activity', { code: managerId });
  const response = await managerApiFetch(url, { method: 'POST' });
  
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result?.error || 'Failed to clear activity');
  }
}

export async function fetchManagerNews(managerId: string, limit = 3): Promise<NewsItem[]> {
  const url = buildManagerApiUrl('/news', { code: managerId, limit });
  const response = await managerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch news: ${response.status}`);
  }
  
  const result = await response.json();
  return Array.isArray(result?.data) ? result.data : [];
}

/**
 * Profile API endpoints
 */
export async function fetchManagerProfile(managerId: string): Promise<ManagerProfile> {
  const url = buildManagerApiUrl('/profile', { code: managerId });
  const response = await managerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.status}`);
  }
  
  const result = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch profile');
  }
  
  return result.data;
}

export async function updateManagerProfile(managerId: string, profileData: Partial<ManagerProfile>): Promise<ManagerProfile> {
  const url = buildManagerApiUrl('/profile');
  const response = await managerApiFetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...profileData, manager_id: managerId })
  });
  
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result?.error || 'Failed to update profile');
  }
  
  const result = await response.json();
  return result.data;
}

export async function fetchManagerPreferences(managerId: string): Promise<ManagerPreferences> {
  const url = buildManagerApiUrl('/preferences', { manager_id: managerId });
  const response = await managerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch preferences: ${response.status}`);
  }
  
  const result = await response.json();
  return result.data || {
    notifications: {
      email_assignments: true,
      sms_alerts: true,
      weekly_reports: false
    },
    display: {
      refresh_rate: 60,
      timezone: 'America/New_York'
    }
  };
}

export async function updateManagerPreferences(managerId: string, preferences: ManagerPreferences): Promise<void> {
  const url = buildManagerApiUrl('/preferences');
  const response = await managerApiFetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...preferences, manager_id: managerId })
  });
  
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result?.error || 'Failed to update preferences');
  }
}

/**
 * Services API endpoints
 */
export async function fetchManagerServices(managerId: string): Promise<ManagerService[]> {
  const url = buildManagerApiUrl('/services', { manager_id: managerId });
  const response = await managerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch services: ${response.status}`);
  }
  
  const result = await response.json();
  return Array.isArray(result?.data) ? result.data : [];
}

export async function createManagerService(managerId: string, serviceData: Partial<ManagerService>): Promise<ManagerService> {
  const url = buildManagerApiUrl('/services');
  const response = await managerApiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...serviceData, manager_id: managerId })
  });
  
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result?.error || 'Failed to create service');
  }
  
  const result = await response.json();
  return result.data;
}

export async function updateManagerService(serviceId: string, serviceData: Partial<ManagerService>): Promise<ManagerService> {
  const url = buildManagerApiUrl(`/services/${serviceId}`);
  const response = await managerApiFetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(serviceData)
  });
  
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result?.error || 'Failed to update service');
  }
  
  const result = await response.json();
  return result.data;
}

/**
 * Ecosystem API endpoints
 */
export async function fetchManagerEcosystem(managerId: string): Promise<EcosystemNode[]> {
  const url = buildManagerApiUrl('/ecosystem', { code: managerId });
  const response = await managerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ecosystem: ${response.status}`);
  }
  
  const result = await response.json();
  return Array.isArray(result?.data) ? result.data : [];
}

/**
 * Orders/Requests API endpoints
 */
export async function fetchManagerRequests(
  managerId: string, 
  bucket: 'needs_scheduling' | 'in_progress' | 'archive' = 'needs_scheduling'
): Promise<{ requests: ManagerRequest[]; counts?: ManagerRequestCounts }> {
  const url = buildManagerApiUrl('/requests', { bucket, manager_id: managerId });
  const response = await managerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch requests: ${response.status}`);
  }
  
  const result = await response.json();
  return {
    requests: Array.isArray(result?.data) ? result.data : [],
    counts: result?.totals
  };
}

export async function fetchOrderDetail(orderId: string): Promise<ManagerOrderDetail> {
  const url = buildManagerApiUrl(`/orders/${orderId}`);
  const response = await managerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch order detail: ${response.status}`);
  }
  
  const result = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch order detail');
  }
  
  return result.data;
}

export async function scheduleRequest(requestData: {
  order_id: string;
  center_id: string;
  start: string;
  end: string;
}): Promise<void> {
  const url = buildManagerApiUrl(`/requests/${requestData.order_id}/schedule`);
  const response = await managerApiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  });
  
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result?.error || 'Failed to schedule request');
  }
}

/**
 * Reports API endpoints
 */
export async function fetchManagerReports(
  managerId: string,
  scope: 'center' | 'customer' = 'center',
  id?: string,
  limit = 25
): Promise<{ reports: ManagerReportListItem[]; totals?: ManagerReportTotals }> {
  const params: any = { scope, limit, manager_id: managerId };
  if (id) params.id = id;
  
  const url = buildManagerApiUrl('/reports', params);
  const response = await managerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch reports: ${response.status}`);
  }
  
  const result = await response.json();
  return {
    reports: Array.isArray(result?.data) ? result.data : [],
    totals: result?.totals
  };
}

export async function fetchManagerFeedback(
  managerId: string,
  scope: 'center' | 'customer' = 'center',
  id?: string,
  limit = 25
): Promise<{ feedback: ManagerFeedbackListItem[]; totals?: ManagerFeedbackTotals }> {
  const params: any = { scope, limit, manager_id: managerId };
  if (id) params.id = id;
  
  const url = buildManagerApiUrl('/feedback', params);
  const response = await managerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch feedback: ${response.status}`);
  }
  
  const result = await response.json();
  return {
    feedback: Array.isArray(result?.data) ? result.data : [],
    totals: result?.totals
  };
}

export async function fetchReportDetail(reportId: string): Promise<ManagerReportDetail> {
  const url = buildManagerApiUrl(`/reports/${reportId}`);
  const response = await managerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch report detail: ${response.status}`);
  }
  
  const result = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch report detail');
  }
  
  return result.data;
}

export async function updateReportStatus(
  reportId: string, 
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
): Promise<void> {
  const url = buildManagerApiUrl(`/reports/${reportId}/status`);
  const response = await managerApiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result?.error || 'Failed to update report status');
  }
}

export async function addReportComment(reportId: string, comment: string): Promise<void> {
  const url = buildManagerApiUrl(`/reports/${reportId}/comments`);
  const response = await managerApiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: comment })
  });
  
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result?.error || 'Failed to add comment');
  }
}

export async function fetchFeedbackDetail(feedbackId: string): Promise<ManagerFeedbackDetail> {
  const url = buildManagerApiUrl(`/feedback/${feedbackId}`);
  const response = await managerApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch feedback detail: ${response.status}`);
  }
  
  const result = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch feedback detail');
  }
  
  return result.data;
}

/**
 * Support API endpoints
 */
export async function fetchSupportTickets(managerId: string): Promise<any[]> {
  const url = '/api/support/tickets';
  const response = await fetch(url, { credentials: 'include' });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch support tickets: ${response.status}`);
  }
  
  const result = await response.json();
  return Array.isArray(result?.data) ? result.data : [];
}

export async function createSupportTicket(ticketData: {
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
}): Promise<any> {
  const url = '/api/support/tickets';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(ticketData)
  });
  
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result?.error || 'Failed to create support ticket');
  }
  
  const result = await response.json();
  return result.data;
}
