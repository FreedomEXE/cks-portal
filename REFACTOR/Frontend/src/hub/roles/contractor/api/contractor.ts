/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * contractor.ts
 * 
 * Description: Contractor API layer with comprehensive endpoint coverage
 * Function: Provide type-safe API methods for all contractor operations
 * Importance: Critical - Central API interface for contractor business logic
 * Connects to: Backend contractor endpoints, type definitions, error handling
 * 
 * Notes: Production-ready API layer with proper error handling and TypeScript types.
 *        Covers all contractor business operations including orders, reports, and services.
 */

import type {
  ContractorProfile,
  AccountManager,
  BusinessMetric,
  ContractorService,
  CustomerSummary,
  EcosystemNode,
  ContractorOrder,
  OrderDetail,
  ContractorReport,
  ContractorFeedback,
  ReportDetail,
  ContractorActivity,
  SupportTicket,
  ContractorApiResponse,
  DashboardData
} from '../types/contractor';

const API_BASE = '/api/contractor';

/**
 * Contractor API fetch wrapper with error handling
 */
async function contractorApiFetch<T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ContractorApiResponse<T>> {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return {
      success: true,
      data: data.data || data,
      ...data
    };
  } catch (error) {
    console.error(`Contractor API Error [${endpoint}]:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Profile Management APIs
export const profileApi = {
  /**
   * Get contractor profile information
   */
  async getProfile(contractorId?: string): Promise<ContractorApiResponse<ContractorProfile>> {
    const params = contractorId ? `?code=${encodeURIComponent(contractorId)}` : '';
    return contractorApiFetch<ContractorProfile>(`/profile${params}`);
  },

  /**
   * Update contractor profile
   */
  async updateProfile(profile: Partial<ContractorProfile>): Promise<ContractorApiResponse<ContractorProfile>> {
    return contractorApiFetch<ContractorProfile>('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  },

  /**
   * Get account manager information
   */
  async getAccountManager(managerId: string): Promise<ContractorApiResponse<AccountManager>> {
    return contractorApiFetch<AccountManager>(`/account-manager/${encodeURIComponent(managerId)}`);
  }
};

// Dashboard APIs
export const dashboardApi = {
  /**
   * Get contractor dashboard data including metrics and recent activity
   */
  async getDashboardData(contractorId?: string): Promise<ContractorApiResponse<DashboardData>> {
    const params = contractorId ? `?code=${encodeURIComponent(contractorId)}` : '';
    return contractorApiFetch<DashboardData>(`/dashboard${params}`);
  },

  /**
   * Get business metrics
   */
  async getBusinessMetrics(contractorId?: string): Promise<ContractorApiResponse<BusinessMetric[]>> {
    const params = contractorId ? `?code=${encodeURIComponent(contractorId)}` : '';
    return contractorApiFetch<BusinessMetric[]>(`/metrics${params}`);
  },

  /**
   * Get customer summaries
   */
  async getCustomers(contractorId?: string, limit = 10): Promise<ContractorApiResponse<CustomerSummary[]>> {
    const params = new URLSearchParams();
    if (contractorId) params.set('code', contractorId);
    if (limit) params.set('limit', limit.toString());
    return contractorApiFetch<CustomerSummary[]>(`/customers?${params}`);
  },

  /**
   * Get recent activity
   */
  async getActivity(contractorId?: string, limit = 20): Promise<ContractorApiResponse<ContractorActivity[]>> {
    const params = new URLSearchParams();
    if (contractorId) params.set('code', contractorId);
    if (limit) params.set('limit', limit.toString());
    return contractorApiFetch<ContractorActivity[]>(`/activity?${params}`);
  },

  /**
   * Clear contractor activity history
   */
  async clearActivity(contractorId?: string): Promise<ContractorApiResponse<boolean>> {
    const params = contractorId ? `?code=${encodeURIComponent(contractorId)}` : '';
    return contractorApiFetch<boolean>(`/clear-activity${params}`, {
      method: 'POST',
    });
  }
};

// Service Management APIs
export const serviceApi = {
  /**
   * Get contractor's selected services
   */
  async getMyServices(contractorId?: string): Promise<ContractorApiResponse<{ selected: ContractorService[] }>> {
    const params = contractorId ? `?code=${encodeURIComponent(contractorId)}` : '';
    return contractorApiFetch<{ selected: ContractorService[] }>(`/my-services${params}`);
  },

  /**
   * Update selected services
   */
  async updateSelectedServices(
    services: string[], 
    contractorId?: string
  ): Promise<ContractorApiResponse<boolean>> {
    return contractorApiFetch<boolean>('/my-services', {
      method: 'POST',
      body: JSON.stringify({ 
        code: contractorId,
        services 
      }),
    });
  },

  /**
   * Update favorite services (max 3)
   */
  async updateFavoriteServices(
    favorites: string[], 
    contractorId?: string
  ): Promise<ContractorApiResponse<boolean>> {
    return contractorApiFetch<boolean>('/my-services/favorites', {
      method: 'PATCH',
      body: JSON.stringify({ 
        code: contractorId,
        favorites 
      }),
    });
  },

  /**
   * Browse available services from CKS catalog
   */
  async browseServices(
    category?: string, 
    search?: string
  ): Promise<ContractorApiResponse<ContractorService[]>> {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    return contractorApiFetch<ContractorService[]>(`/services/catalog?${params}`);
  }
};

// Ecosystem APIs
export const ecosystemApi = {
  /**
   * Get contractor's business ecosystem/network
   */
  async getEcosystem(contractorId?: string): Promise<ContractorApiResponse<EcosystemNode[]>> {
    const params = contractorId ? `?code=${encodeURIComponent(contractorId)}` : '';
    return contractorApiFetch<EcosystemNode[]>(`/ecosystem${params}`);
  },

  /**
   * Get network statistics
   */
  async getNetworkStats(contractorId?: string): Promise<ContractorApiResponse<{
    total_customers: number;
    total_centers: number;
    total_crew: number;
    active_relationships: number;
  }>> {
    const params = contractorId ? `?code=${encodeURIComponent(contractorId)}` : '';
    return contractorApiFetch(`/ecosystem/stats${params}`);
  }
};

// Order Management APIs
export const orderApi = {
  /**
   * Get orders by status bucket
   */
  async getOrders(
    bucket: 'pending' | 'approved' | 'archive' = 'pending'
  ): Promise<ContractorApiResponse<ContractorOrder[]>> {
    return contractorApiFetch<ContractorOrder[]>(`/requests?bucket=${bucket}`);
  },

  /**
   * Get detailed order information
   */
  async getOrderDetail(orderId: string): Promise<ContractorApiResponse<OrderDetail>> {
    return contractorApiFetch<OrderDetail>(`/orders/${encodeURIComponent(orderId)}`);
  },

  /**
   * Approve an order
   */
  async approveOrder(orderId: string, notes?: string): Promise<ContractorApiResponse<boolean>> {
    return contractorApiFetch<boolean>(`/requests/${encodeURIComponent(orderId)}/approve`, {
      method: 'POST',
      body: JSON.stringify({ note: notes || '' }),
    });
  },

  /**
   * Deny an order
   */
  async denyOrder(orderId: string, reason?: string): Promise<ContractorApiResponse<boolean>> {
    return contractorApiFetch<boolean>(`/requests/${encodeURIComponent(orderId)}/deny`, {
      method: 'POST',
      body: JSON.stringify({ note: reason || '' }),
    });
  },

  /**
   * Get order history
   */
  async getOrderHistory(
    contractorId?: string, 
    limit = 50
  ): Promise<ContractorApiResponse<ContractorOrder[]>> {
    const params = new URLSearchParams();
    if (contractorId) params.set('code', contractorId);
    if (limit) params.set('limit', limit.toString());
    return contractorApiFetch<ContractorOrder[]>(`/orders/history?${params}`);
  }
};

// Reports and Feedback APIs
export const reportsApi = {
  /**
   * Get reports with filtering
   */
  async getReports(
    limit = 50, 
    status?: string
  ): Promise<ContractorApiResponse<ContractorReport[]>> {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    if (status) params.set('status', status);
    return contractorApiFetch<ContractorReport[]>(`/reports?${params}`);
  },

  /**
   * Get feedback with filtering
   */
  async getFeedback(
    limit = 50, 
    kind?: string
  ): Promise<ContractorApiResponse<ContractorFeedback[]>> {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    if (kind) params.set('kind', kind);
    return contractorApiFetch<ContractorFeedback[]>(`/feedback?${params}`);
  },

  /**
   * Get detailed report information
   */
  async getReportDetail(reportId: string): Promise<ContractorApiResponse<ReportDetail>> {
    return contractorApiFetch<ReportDetail>(`/reports/${encodeURIComponent(reportId)}`);
  },

  /**
   * Get detailed feedback information
   */
  async getFeedbackDetail(feedbackId: string): Promise<ContractorApiResponse<ContractorFeedback>> {
    return contractorApiFetch<ContractorFeedback>(`/feedback/${encodeURIComponent(feedbackId)}`);
  },

  /**
   * Add comment to report
   */
  async addReportComment(
    reportId: string, 
    content: string
  ): Promise<ContractorApiResponse<boolean>> {
    return contractorApiFetch<boolean>(`/reports/${encodeURIComponent(reportId)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  /**
   * Update report status
   */
  async updateReportStatus(
    reportId: string, 
    status: string, 
    notes?: string
  ): Promise<ContractorApiResponse<boolean>> {
    return contractorApiFetch<boolean>(`/reports/${encodeURIComponent(reportId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }
};

// Support APIs
export const supportApi = {
  /**
   * Submit support ticket
   */
  async submitTicket(ticket: SupportTicket): Promise<ContractorApiResponse<{ ticket_id: string }>> {
    return contractorApiFetch<{ ticket_id: string }>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(ticket),
    });
  },

  /**
   * Get support tickets
   */
  async getTickets(
    contractorId?: string, 
    status?: string
  ): Promise<ContractorApiResponse<SupportTicket[]>> {
    const params = new URLSearchParams();
    if (contractorId) params.set('contractor_id', contractorId);
    if (status) params.set('status', status);
    return contractorApiFetch<SupportTicket[]>(`/support/tickets?${params}`);
  },

  /**
   * Get support resources
   */
  async getSupportResources(): Promise<ContractorApiResponse<{
    knowledge_base: Array<{ id: string; title: string; url: string }>;
    video_tutorials: Array<{ id: string; title: string; url: string }>;
    user_guides: Array<{ id: string; title: string; url: string }>;
  }>> {
    return contractorApiFetch('/support/resources');
  }
};

// Utility APIs
export const utilityApi = {
  /**
   * Get contractor capabilities/permissions
   */
  async getCapabilities(contractorId?: string): Promise<ContractorApiResponse<string[]>> {
    const params = contractorId ? `?code=${encodeURIComponent(contractorId)}` : '';
    return contractorApiFetch<string[]>(`/capabilities${params}`);
  },

  /**
   * Health check for contractor services
   */
  async healthCheck(): Promise<ContractorApiResponse<{ status: string; timestamp: string }>> {
    return contractorApiFetch('/health');
  },

  /**
   * Log contractor action for analytics
   */
  async logAction(
    action: string, 
    metadata?: Record<string, any>
  ): Promise<ContractorApiResponse<boolean>> {
    return contractorApiFetch<boolean>('/analytics/action', {
      method: 'POST',
      body: JSON.stringify({ action, metadata }),
    });
  }
};

// Export all API modules
export const contractorApi = {
  profile: profileApi,
  dashboard: dashboardApi,
  services: serviceApi,
  ecosystem: ecosystemApi,
  orders: orderApi,
  reports: reportsApi,
  support: supportApi,
  utility: utilityApi,
};

// All API modules are already exported individually above
// contractorApiFetch is imported from utils/contractorApi

// Default export
export default contractorApi;