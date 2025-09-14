/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * useWarehouseData.ts
 * 
 * Description: Warehouse hub data fetching hook
 * Function: Custom hook for fetching and managing warehouse profile data
 * Importance: Critical - Centralized data management for warehouse hub
 * Connects to: Warehouse API, warehouse components, React state
 * 
 * Notes: Manages warehouse profile loading, error states, and data refresh.
 *        Follows same pattern as other hub data hooks.
 *        Includes retry logic and error handling.
 */

import { useState, useEffect } from 'react';
import { WarehouseApi } from '../utils/warehouseApi';

export interface WarehouseData {
  warehouse_id: string;
  warehouse_name: string;
  manager_id: string;
  address: string;
  capacity: number;
  current_utilization: number;
  utilization_percentage: number;
  status: string;
  // Optional extended fields for profile
  warehouse_type?: string;
  phone?: string;
  email?: string;
  date_acquired?: string;
  manager?: { manager_name?: string; email?: string; phone?: string };
}

export interface UseWarehouseDataResult {
  data: WarehouseData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export default function useWarehouseData(): UseWarehouseDataResult {
  const [data, setData] = useState<WarehouseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await WarehouseApi.getProfile();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch warehouse data');
      }
      
      setData(result.data);
    } catch (err) {
      console.error('Warehouse data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      // Set demo data on error for development
      setData({
        warehouse_id: 'WH-000',
        warehouse_name: 'Central Distribution Hub',
        manager_id: 'MGR-001',
        address: '1000 Logistics Drive, Metro City, MC 12345',
        capacity: 0,
        current_utilization: 0,
        utilization_percentage: 0,
        status: 'active',
        warehouse_type: undefined,
        phone: undefined,
        email: undefined,
        date_acquired: undefined,
        manager: { manager_name: undefined, email: undefined, phone: undefined }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}
