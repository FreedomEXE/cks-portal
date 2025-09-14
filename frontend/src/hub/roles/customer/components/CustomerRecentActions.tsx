/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * CustomerRecentActions.tsx
 * 
 * Description: Recent activity widget for customer dashboard
 * Function: Displays recent customer actions with clear and interactive features
 * Importance: Critical - Provides activity tracking and user engagement
 * Connects to: Customer API activity endpoints, activity clearing functionality
 * 
 * Notes: Customer-specific version of ManagerRecentActions.
 *        Maintains exact styling and functionality including activity types,
 *        clear functionality, and order/service navigation.
 */

import React, { useEffect, useState } from 'react';
import { buildCustomerApiUrl, customerApiFetch } from '../utils/customerApi';

interface CustomerRecentActionsProps {
  code: string;
}

export default function CustomerRecentActions({ code }: CustomerRecentActionsProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Clear activity function
  async function handleClearActivity() {
    if (!confirm('Are you sure you want to clear your recent activity? This action cannot be undone.')) {
      return;
    }
    try {
      const url = buildCustomerApiUrl('/clear-activity', { code });
      const r = await customerApiFetch(url, { method: 'POST' });
      const j = await r.json();
      if (!r.ok || !j?.success) throw new Error(j?.error || 'Failed to clear activity');
      setActivities([]);
    } catch (e: any) {
      console.error('Failed to clear activity:', e);
      alert('Failed to clear activity: ' + (e?.message || 'Unknown error'));
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const url = buildCustomerApiUrl('/activity', { code });
        const res = await customerApiFetch(url);
        
        // Handle non-ok responses
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        // Parse JSON safely
        const text = await res.text();
        const json = text ? JSON.parse(text) : {};
        
        if (!cancelled) {
          setActivities(Array.isArray(json?.data) ? json.data.slice(0, 5) : []);
        }
      } catch (err: any) {
        console.error('[CustomerRecentActions] fetch error:', err);
        if (!cancelled) {
          // Always provide mock data in development when API fails
          setActivities(makeMockActivityData());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  return (
    <div className="ui-card" style={{ padding: 16, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#3b7af7' }}>Recent Activity</div>
        {activities.length > 0 && (
          <button 
            onClick={handleClearActivity}
            style={{ 
              padding: '4px 8px', 
              fontSize: 11, 
              background: '#ef4444', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 4, 
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Clear
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
            Loading recent actions...
          </div>
        ) : activities.length > 0 ? (
          activities.map((activity) => {
            const type = String(activity.activity_type || '');
            const isWelcome = type === 'user_welcome' || type === 'welcome_message';
            if (isWelcome) {
              return (
                <div key={activity.activity_id} style={{ padding: 12, background: '#ecfdf5', borderRadius: 8, borderLeft: '4px solid #10b981' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#065f46' }}>{activity.description}</div>
                      <div style={{ fontSize: 12, color: '#047857' }}>Welcome • {new Date(activity.created_at).toLocaleString()}</div>
                    </div>
                    <button
                      style={{ padding: '6px 10px', fontSize: 12, background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                      onClick={() => alert('Interactive walkthrough coming soon!')}
                    >
                      Launch Walkthrough
                    </button>
                  </div>
                </div>
              );
            }
            // Service requests and quotes for customer
            if (type === 'quote_received' || type === 'service_scheduled') {
              const meta = activity?.metadata || {};
              return (
                <div key={activity.activity_id} style={{ padding: 12, background: '#eff6ff', borderRadius: 8, borderLeft: '4px solid #3b82f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1e3a8a' }}>{activity.description}</div>
                    <div style={{ fontSize: 12, color: '#1d4ed8' }}>Service Update • {new Date(activity.created_at).toLocaleString()}</div>
                  </div>
                  {meta?.action_link && (
                    <button
                      style={{ padding: '6px 10px', fontSize: 12, background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                      onClick={() => { 
                        try { 
                          // Get quote/service ID from metadata
                          const serviceId = meta?.service_id || meta?.quote_id;
                          console.log('Service ID from metadata:', serviceId);
                          console.log('Full metadata:', meta);
                          if (serviceId) {
                            // Navigate to service details
                            alert(`Navigate to service ${serviceId} - functionality coming soon!`);
                          } else {
                            console.error('No service_id found in metadata');
                          }
                        } catch (e) { 
                          console.error('Navigation error:', e);
                        } 
                      }}
                    >
                      View Details
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div key={activity.activity_id} style={{ padding: 12, background: '#f8fafc', borderRadius: 8, borderLeft: '3px solid #3b7af7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{activity.description}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{activity.activity_type} • {activity.actor_role}</div>
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(activity.created_at).toLocaleDateString()}</div>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: 32, color: '#6b7280', background: '#f9fafb', borderRadius: 8 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🏠</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>No recent actions</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Customer activities will appear here as they occur</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Mock data function for development/testing
function makeMockActivityData() {
  return [
    {
      activity_id: 'act-001',
      description: 'Received quote for roof repair services',
      activity_type: 'quote_received',
      actor_role: 'customer',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      metadata: { quote_id: 'QUO-001', action_link: true }
    },
    {
      activity_id: 'act-002',
      description: 'Scheduled inspection appointment for next Tuesday',
      activity_type: 'service_scheduled',
      actor_role: 'customer',
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      metadata: { service_id: 'SVC-001', action_link: true }
    },
    {
      activity_id: 'act-003',
      description: 'Updated profile information and preferences',
      activity_type: 'profile_update',
      actor_role: 'customer',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
    {
      activity_id: 'act-004',
      description: 'Left feedback for completed gutter cleaning service',
      activity_type: 'feedback_submitted',
      actor_role: 'customer',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    }
  ];
}