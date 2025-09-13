/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * WarehouseRecentActions.tsx
 * 
 * Description: Recent activities component for Warehouse hub
 * Function: Displays warehouse activity feed with inventory and order updates
 * Importance: Medium - Provides activity overview for warehouse operations
 * Connects to: Warehouse API, activity endpoints, inventory management
 * 
 * Notes: Warehouse-specific activity feed showing inventory movements, order fulfillment,
 *        equipment updates, and operational activities.
 */

import React, { useState, useEffect } from 'react';
import { getWarehouseActivity, clearWarehouseActivity } from '../api/warehouse';

interface WarehouseRecentActionsProps {
  code?: string;
  onError?: (error: string) => void;
}

export default function WarehouseRecentActions({ code, onError }: WarehouseRecentActionsProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    if (!code) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await getWarehouseActivity(code, 5);
      const activityData = response?.data || response || [];
      setActivities(Array.isArray(activityData) ? activityData : []);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to fetch warehouse activities';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      
      // Fallback to mock data
      setActivities(makeWarehouseMockActivities(code || 'WHS-000'));
    } finally {
      setLoading(false);
    }
  };

  const handleClearActivity = async () => {
    if (!code) return;
    
    try {
      await clearWarehouseActivity(code);
      setActivities([]);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to clear activities';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [code]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
        {activities.length > 0 && (
          <button
            onClick={handleClearActivity}
            className="text-sm text-red-600 hover:text-red-800 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No recent activities</p>
          </div>
        ) : (
          activities.slice(0, 5).map((activity, index) => (
            <div key={activity.activity_id || index} className="border-l-4 border-purple-400 pl-4 pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.description || 'Warehouse activity update'}
                  </p>
                  <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                    <span className="capitalize bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {activity.activity_type?.replace('_', ' ') || 'warehouse'}
                    </span>
                    {activity.order_id && (
                      <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        {activity.order_id}
                      </span>
                    )}
                    {activity.item_id && (
                      <span className="bg-green-100 text-green-600 px-2 py-1 rounded">
                        {activity.item_id}
                      </span>
                    )}
                    {activity.zone_id && (
                      <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded">
                        {activity.zone_id}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                  {activity.created_at ? new Date(activity.created_at).toLocaleTimeString() : 'now'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {activities.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button className="text-sm text-purple-600 hover:text-purple-800 transition-colors">
            View all activities →
          </button>
        </div>
      )}
    </div>
  );
}

function makeWarehouseMockActivities(warehouseId: string) {
  const now = new Date();
  return [
    {
      activity_id: 'act-001',
      warehouse_id: warehouseId,
      activity_type: 'order_picked',
      description: 'Order ORD-567890 picked and ready for packing',
      user_id: 'USR-001',
      order_id: 'ORD-567890',
      created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      metadata: { items_picked: 12, pick_time: '1.2 hours' }
    },
    {
      activity_id: 'act-002', 
      warehouse_id: warehouseId,
      activity_type: 'inventory_received',
      description: 'New inventory received: 250 units of SKU-12345',
      user_id: 'USR-002',
      item_id: 'SKU-12345',
      zone_id: 'ZONE-A',
      created_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
      metadata: { quantity: 250, supplier: 'ACME Corp' }
    },
    {
      activity_id: 'act-003',
      warehouse_id: warehouseId,
      activity_type: 'order_shipped',
      description: 'Order ORD-567889 shipped via Express',
      user_id: 'USR-003',
      order_id: 'ORD-567889',
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      metadata: { tracking: 'TRK123456789', carrier: 'Express Shipping' }
    },
    {
      activity_id: 'act-004',
      warehouse_id: warehouseId,
      activity_type: 'equipment_maintenance',
      description: 'Forklift FLT-001 completed scheduled maintenance',
      user_id: 'USR-004',
      equipment_id: 'FLT-001',
      created_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      metadata: { maintenance_type: 'routine', duration: '2 hours' }
    },
    {
      activity_id: 'act-005',
      warehouse_id: warehouseId,
      activity_type: 'zone_reorganized',
      description: 'Zone B reorganized for improved efficiency',
      user_id: 'USR-005',
      zone_id: 'ZONE-B',
      created_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      metadata: { improvement: '15% space efficiency gain' }
    }
  ];
}