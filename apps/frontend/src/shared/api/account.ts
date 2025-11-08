import { apiFetch, type ApiResponse } from './client';

export interface PasswordResetRequest {
  userId: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

/**
 * Requests a password reset email for the authenticated user
 * @param userId - The Clerk user ID
 * @returns Promise with success status
 */
export async function requestPasswordReset(userId: string): Promise<PasswordResetResponse> {
  const response = await apiFetch<ApiResponse<PasswordResetResponse>>('/account/request-password-reset', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });

  return response.data;
}
