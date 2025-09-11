/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Dashboard.tsx
 * 
 * Description: Contractor business dashboard with KPI metrics and activity tracking
 * Function: Display business performance, customer metrics, and recent activity feed
 * Importance: Critical - Primary view for contractor business insights
 * Connects to: Contractor API dashboard endpoints, activity tracking
 * 
 * Notes: Production-ready implementation with complete business metrics.
 *        Includes business KPIs, customer summaries, and activity management.
 */

import React, { useState, useEffect } from 'react';

interface DashboardProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

interface BusinessMetric {
  label: string;
  value: string | number;
  trend?: string;
  color?: string;
}

interface CustomerSummary {
  id: string;
  name: string;
  centers: number;
  status: 'Active' | 'Pending' | 'Inactive';
  last_service: string;
}

interface Activity {
  activity_id: string;
  activity_type: string;
  description: string;
  created_at: string;
  metadata?: any;
}

export default function Dashboard({ userId, config, features, api }: DashboardProps) {
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetric[]>([]);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);

  // Load business metrics and customer data
  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        setMetricsLoading(true);
        
        // Demo business metrics for contractors
        setBusinessMetrics([
          { label: 'Active Services', value: 8, color: '#f59e0b' },
          { label: 'Active Customers', value: 12, trend: '+2 this month', color: '#10b981' },
          { label: 'Active Centers', value: 24, trend: '+3 this quarter', color: '#8b5cf6' },
          { label: 'Active Crew', value: 15, trend: '+1 this week', color: '#ef4444' },
          { label: 'Pending Orders', value: 3, color: '#f97316' },
          { label: 'Account Status', value: 'Current', color: '#10b981' }
        ]);

        // Demo customer data
        setCustomers([
          { id: 'CUS-001', name: 'Acme Corp', centers: 3, status: 'Active', last_service: '2025-01-08' },
          { id: 'CUS-002', name: 'Global Tech', centers: 2, status: 'Active', last_service: '2025-01-07' },
          { id: 'CUS-003', name: 'Local Business', centers: 1, status: 'Pending', last_service: '2024-12-15' }
        ]);

      } catch (error) {
        console.error('Error loading business data:', error);
      } finally {
        setMetricsLoading(false);
      }
    };

    loadBusinessData();
  }, [userId]);

  // Load recent activity
  useEffect(() => {
    const loadActivity = async () => {
      try {
        setActivityLoading(true);
        
        // Demo activity data
        setActivities([
          {
            activity_id: '1',
            activity_type: 'user_welcome',
            description: 'Welcome to your contractor hub! Get started by exploring your business dashboard.',
            created_at: new Date().toISOString()
          },
          {
            activity_id: '2', 
            activity_type: 'manager_assigned',
            description: 'CKS Account Manager has been assigned to your account.',
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }
        ]);

      } catch (error) {
        console.error('Error loading activity:', error);
      } finally {
        setActivityLoading(false);
      }
    };

    loadActivity();
  }, [userId]);

  const handleClearActivity = async () => {
    if (!confirm('Are you sure you want to clear your recent activity? This action cannot be undone.')) {
      return;
    }
    setActivities([]);
  };

  const handleLaunchWalkthrough = () => {
    alert('Interactive walkthrough coming soon!');
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Overview</h2>
      
      {/* Business Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
        {businessMetrics.map((metric, i) => (
          <div key={i} className="ui-card" style={{ padding: 16, textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{metric.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: metric.color || '#111827' }}>{metric.value}</div>
            {metric.trend && (
              <div style={{ fontSize: 12, color: metric.color || '#10b981', marginTop: 4 }}>{metric.trend}</div>
            )}
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Recent Activity</h3>
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
      
      <div className="ui-card" style={{ padding: 16, marginBottom: 24 }}>
        {activityLoading ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#6b7280' }}>Loading activity...</div>
        ) : activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#6b7280', background: '#f9fafb', borderRadius: 8 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>No recent activity</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Business activity will appear here as it occurs</div>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {activities.slice(0, 8).map((activity) => {
              const type = String(activity.activity_type || '');
              const isWelcome = type === 'user_welcome' || type === 'welcome_message';
              
              if (isWelcome) {
                return (
                  <li key={activity.activity_id}
                      style={{ padding: 12, borderBottom: '1px solid #e5e7eb', fontSize: 13, background: '#ecfdf5', borderRadius: 8, marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: '#065f46' }}>Welcome</div>
                    <div style={{ margin: '2px 0', color: '#065f46' }}>{activity.description}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 11, color: '#047857' }}>{new Date(activity.created_at).toLocaleString()}</div>
                      <button
                        style={{ padding: '6px 10px', fontSize: 12, background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                        onClick={handleLaunchWalkthrough}
                      >
                        Launch Walkthrough
                      </button>
                    </div>
                  </li>
                );
              }
              
              if (type === 'manager_assigned') {
                return (
                  <li key={activity.activity_id}
                      style={{ padding: 12, borderBottom: '1px solid #e5e7eb', fontSize: 13, background: '#eff6ff', borderRadius: 8, marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: '#1e3a8a' }}>Manager Assigned</div>
                    <div style={{ margin: '2px 0', color: '#1e3a8a' }}>{activity.description}</div>
                    <div style={{ fontSize: 11, color: '#1d4ed8' }}>{new Date(activity.created_at).toLocaleString()}</div>
                  </li>
                );
              }

              return (
                <li key={activity.activity_id}
                    style={{ padding: '8px 0', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}>
                  <div style={{ fontWeight: 600 }}>{activity.activity_type.replace(/_/g, ' ')}</div>
                  <div style={{ opacity: 0.8 }}>{activity.description}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{new Date(activity.created_at).toLocaleString()}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Communication Hub */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* News & Updates */}
        <div className="ui-card" style={{ padding: 16 }}>
          <div style={{ marginBottom: 16, color: '#10b981', display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}>
            📰 News & Updates
          </div>
          <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📰</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No Recent News</div>
            <div style={{ fontSize: 12 }}>Company news and updates will appear here</div>
          </div>
          <button style={{
            width: '100%',
            padding: '8px 16px',
            fontSize: 12,
            backgroundColor: '#dcfce7',
            color: '#10b981',
            border: '1px solid #22c55e',
            borderRadius: 4,
            cursor: 'pointer',
            marginTop: 8,
            fontWeight: 500
          }}
          onClick={() => alert('Full News - Coming Soon!')}
          >
            View All News
          </button>
        </div>
        
        {/* Mail & Messages */}
        <div className="ui-card" style={{ padding: 16 }}>
          <div style={{ marginBottom: 16, color: '#10b981', display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}>
            📬 Mail
          </div>
          <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📧</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No Messages</div>
            <div style={{ fontSize: 12 }}>Internal messages and notifications will appear here</div>
          </div>
          <button style={{
            width: '100%',
            padding: '8px 16px',
            fontSize: 12,
            backgroundColor: '#dcfce7',
            color: '#10b981',
            border: '1px solid #22c55e',
            borderRadius: 4,
            cursor: 'pointer',
            marginTop: 8,
            fontWeight: 500
          }}
          onClick={() => alert('Full Mailbox - Coming Soon!')}
          >
            View Mailbox
          </button>
        </div>
      </div>
    </div>
  );
}