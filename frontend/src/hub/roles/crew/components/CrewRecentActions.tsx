/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * CrewRecentActions.tsx
 * 
 * Description: Recent activities component for Crew hub
 * Function: Displays crew activity feed with job updates and team activities
 * Importance: Medium - Provides activity overview for crew operations
 * Connects to: Crew API, activity endpoints, job management
 * 
 * Notes: Crew-specific activity feed showing job assignments, completions,
 *        equipment updates, and team coordination activities.
 */

import React, { useState, useEffect } from 'react';
import { getCrewActivity, clearCrewActivity } from '../api/crew';

interface CrewRecentActionsProps {
  code?: string;
  onError?: (error: string) => void;
}

export default function CrewRecentActions({ code, onError }: CrewRecentActionsProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    if (!code) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await getCrewActivity(code, 5);
      const activityData = response?.data || response || [];
      setActivities(Array.isArray(activityData) ? activityData : []);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to fetch crew activities';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      
      // Fallback to mock data
      setActivities(makeCrewMockActivities(code || 'CRW-000'));
    } finally {
      setLoading(false);
    }
  };

  const handleClearActivity = async () => {
    if (!code) return;
    
    try {
      await clearCrewActivity(code);
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No recent activities</p>
          </div>
        ) : (
          activities.slice(0, 5).map((activity, index) => (
            <div key={activity.activity_id || index} className="border-l-4 border-green-400 pl-4 pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.description || 'Crew activity update'}
                  </p>
                  <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                    <span className="capitalize bg-green-100 text-green-800 px-2 py-1 rounded">
                      {activity.activity_type?.replace('_', ' ') || 'crew'}
                    </span>
                    {activity.job_id && (
                      <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        {activity.job_id}
                      </span>
                    )}
                    {activity.equipment_id && (
                      <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded">
                        {activity.equipment_id}
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
          <button className="text-sm text-green-600 hover:text-green-800 transition-colors">
            View all activities →
          </button>
        </div>
      )}
    </div>
  );
}

function makeCrewMockActivities(crewId: string) {
  const now = new Date();
  return [
    {
      activity_id: 'act-001',
      crew_id: crewId,
      activity_type: 'job_assignment',
      description: 'New job assigned: Emergency HVAC repair',
      actor_id: 'CON-001',
      job_id: 'JOB-567890',
      created_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      metadata: { priority: 'urgent', location: 'Downtown Office Complex' }
    },
    {
      activity_id: 'act-002', 
      crew_id: crewId,
      activity_type: 'job_completion',
      description: 'Plumbing repair completed successfully',
      actor_id: 'CON-002',
      job_id: 'JOB-567889',
      created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      metadata: { duration: '2.5 hours', customer_satisfaction: 4.8 }
    },
    {
      activity_id: 'act-003',
      crew_id: crewId,
      activity_type: 'equipment_assigned',
      description: 'Power drill assigned to crew member',
      actor_id: 'CON-003',
      equipment_id: 'EQP-123',
      created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      metadata: { equipment_type: 'tool', condition: 'excellent' }
    },
    {
      activity_id: 'act-004',
      crew_id: crewId,
      activity_type: 'member_added',
      description: 'New team member joined the crew',
      actor_id: 'MGR-001',
      created_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      metadata: { member_name: 'John Smith', role: 'technician' }
    }
  ];
}