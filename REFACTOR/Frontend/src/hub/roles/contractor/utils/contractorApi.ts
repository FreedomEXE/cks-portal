/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * contractorApi.ts
 * 
 * Description: Contractor-specific API utilities and helpers
 * Function: Provide contractor API URL building and fetch utilities
 * Importance: Core utility for contractor API interactions
 * Connects to: Contractor API endpoints, authentication system
 * 
 * Notes: Contractor-specific version of API utilities with proper headers and error handling.
 */

/**
 * Build contractor API URL with query parameters
 */
export function buildContractorApiUrl(endpoint: string, params: Record<string, string | number> = {}): string {
  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api';
  const url = new URL(`${baseUrl}/contractor${endpoint}`, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });
  
  return url.toString();
}

/**
 * Contractor-specific fetch wrapper with authentication
 */
export async function contractorApiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const contractorHeaders: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-User-Role': 'contractor',
    'X-Hub-Context': 'contractor',
  };

  // Add contractor-specific authentication headers if available
  const contractorId = getContractorSessionId();
  if (contractorId) {
    contractorHeaders['X-Contractor-ID'] = contractorId;
    contractorHeaders['X-User-ID'] = contractorId;
  }

  const requestOptions: RequestInit = {
    credentials: 'include',
    headers: {
      ...contractorHeaders,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, requestOptions);
    
    // Log API calls for debugging (remove in production)
    if (import.meta.env.DEV) {
      console.debug(`[ContractorAPI] ${options.method || 'GET'} ${url}`, {
        status: response.status,
        ok: response.ok
      });
    }
    
    return response;
  } catch (error) {
    console.error(`[ContractorAPI] Network error for ${url}:`, error);
    throw error;
  }
}

/**
 * Get contractor session ID from storage or context
 */
function getContractorSessionId(): string | null {
  try {
    // Try session storage first
    if (typeof sessionStorage !== 'undefined') {
      const sessionId = sessionStorage.getItem('contractor:lastCode') || 
                       sessionStorage.getItem('contractor:id');
      if (sessionId) return sessionId;
    }
    
    // Try localStorage as fallback
    if (typeof localStorage !== 'undefined') {
      const localId = localStorage.getItem('contractor:id');
      if (localId) return localId;
    }
    
    // Try to extract from URL path (e.g., /CON-001/hub)
    const pathMatch = window.location.pathname.match(/\/(CON-\d+)\/hub/i);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1].toUpperCase();
    }
    
    return null;
  } catch (error) {
    console.warn('[ContractorAPI] Error getting session ID:', error);
    return null;
  }
}

/**
 * Handle API response with proper error extraction
 */
export async function handleContractorApiResponse<T = any>(response: Response): Promise<T> {
  try {
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.error || data.message || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return data.data || data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to parse API response');
  }
}

/**
 * Create contractor API request with standard options
 */
export function createContractorApiRequest(
  endpoint: string,
  options: RequestInit = {},
  params: Record<string, string | number> = {}
): Promise<Response> {
  const url = buildContractorApiUrl(endpoint, params);
  return contractorApiFetch(url, options);
}

/**
 * Contractor API error handler
 */
export function handleContractorApiError(error: Error, context?: string): void {
  const errorMessage = `[ContractorAPI${context ? ` - ${context}` : ''}] ${error.message}`;
  
  // Log error for debugging
  console.error(errorMessage, error);
  
  // Handle specific error types
  if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    // Handle authentication errors
    console.warn('[ContractorAPI] Authentication error - may need to re-login');
  } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
    // Handle permission errors
    console.warn('[ContractorAPI] Permission denied - insufficient contractor privileges');
  } else if (error.message.includes('500')) {
    // Handle server errors
    console.error('[ContractorAPI] Server error - please try again later');
  }
}

/**
 * Check if contractor API is available
 */
export async function checkContractorApiHealth(): Promise<boolean> {
  try {
    const response = await contractorApiFetch(buildContractorApiUrl('/health'));
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get contractor API base configuration
 */
export function getContractorApiConfig() {
  return {
    baseUrl: import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api',
    contractorPath: '/contractor',
    timeout: 30000, // 30 seconds
    retries: 3,
    retryDelay: 1000, // 1 second
  };
}