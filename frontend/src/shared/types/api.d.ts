/*-----------------------------------------------
  Property of CKS  © 2025
-----------------------------------------------*/
/**
 * File: api.d.ts
 *
 * Description:
 * Type definitions for API responses and requests
 *
 * Responsibilities:
 * - Define API type contracts
 * - Ensure type safety for API operations
 *
 * Role in system:
 * - Type safety for all API interactions
 *
 * Notes:
 * Shared type definitions across all roles
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface User {
  id: string;
  role: 'admin' | 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse';
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Activity {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'action';
  message: string;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: Date;
  userId: string;
}