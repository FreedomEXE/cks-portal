/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * CenterRecentActions.tsx
 * 
 * Description: Recent activities component for Center hub
 * Function: Displays center activity feed with territory and operational updates
 * Importance: Medium - Provides activity overview for center operations
 * Connects to: Center API, activity endpoints, territory management
 * 
 * Notes: Center-specific activity feed showing territory updates, contractor assignments,
 *        and regional operational activities. Includes clear activity functionality.
 */

import React, { useState, useEffect } from 'react';
import { getCenterActivity, clearCenterActivity } from '../api/center';

interface CenterRecentActionsProps {
  code?: string;
  onError?: (error: string) => void;
}

export default function CenterRecentActions({ code, onError }: CenterRecentActionsProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    if (!code) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await getCenterActivity(code, 5);
      const activityData = response?.data || response || [];
      setActivities(Array.isArray(activityData) ? activityData : []);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to fetch center activities';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      
      // Fallback to mock data
      setActivities(makeCenterMockActivities(code || 'CEN-000'));
    } finally {
      setLoading(false);
    }
  };

  const handleClearActivity = async () => {
    if (!code) return;
    
    try {
      await clearCenterActivity(code);
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No recent activities</p>
          </div>
        ) : (
          activities.slice(0, 5).map((activity, index) => (
            <div key={activity.activity_id || index} className="border-l-4 border-blue-400 pl-4 pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.description || 'Center activity update'}
                  </p>
                  <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                    <span className="capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {activity.activity_type?.replace('_', ' ') || 'system'}
                    </span>
                    {activity.territory_id && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {activity.territory_id}
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
          <button className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
            View all activities →
          </button>
        </div>
      )}
    </div>
  );
}

function makeCenterMockActivities(centerId: string) {
  const now = new Date();
  return [
    {
      activity_id: 'act-001',
      center_id: centerId,
      activity_type: 'territory_update',
      description: 'Territory boundaries updated for North District',
      actor_role: 'center',
      territory_id: 'TER-001',
      created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      metadata: { action: 'boundary_update' }
    },
    {
      activity_id: 'act-002', 
      center_id: centerId,
      activity_type: 'contractor_assigned',
      description: 'New contractor assigned to South Territory',
      actor_role: 'center',
      territory_id: 'TER-002',
      contractor_id: 'CON-123',
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      metadata: { action: 'assignment' }
    },
    {
      activity_id: 'act-003',
      center_id: centerId,
      activity_type: 'performance_review',
      description: 'Monthly performance metrics updated',
      actor_role: 'center',
      created_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      metadata: { period: 'monthly' }
    }
  ];
}