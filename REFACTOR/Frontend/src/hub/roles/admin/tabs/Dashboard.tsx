import React from 'react';

type DashboardProps = {
  userId?: string;
  config?: { displayName?: string; theme?: { primaryColor?: string } };
  features?: Record<string, unknown>;
  api?: unknown;
};

export default function Dashboard({ userId = 'ADMIN', config }: DashboardProps) {
  const systemMetrics = [
    { title: 'Total Users', value: 2, color: '#3b82f6' },
    { title: 'Open Support Tickets', value: 0, color: '#f59e0b' },
    { title: 'High Priority', value: 0, color: '#ef4444' },
    { title: 'Days Online', value: 0, color: '#10b981' }
  ];

  const recentActivity = [
    {
      id: 1,
      message: 'Assigned CON-001 to MGR-001',
      timestamp: '2 hours ago'
    },
    {
      id: 2,
      message: 'New Manager Created: MGR-001 (Anna) — Welcome Message Sent',
      timestamp: '3 hours ago'
    },
    {
      id: 3,
      message: 'New Contractor Created: CON-001 (Network) — Welcome Message Sent',
      timestamp: '4 hours ago'
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 6 }}>
          {config?.displayName || 'Admin Hub'}
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>System Administrator ({userId})</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {systemMetrics.map((metric, index) => (
          <div key={index} className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{metric.title}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: metric.color, marginBottom: 2 }}>{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="ui-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', margin: 0 }}>Recent System Activity</h2>
          <button style={{ 
            backgroundColor: '#ef4444', 
            color: 'white', 
            padding: '6px 12px', 
            borderRadius: 6, 
            border: 'none',
            fontSize: 12,
            cursor: 'pointer'
          }}>
            Clear
          </button>
        </div>
        <div>
          {recentActivity.map((activity) => (
            <div key={activity.id} style={{ 
              padding: 12, 
              backgroundColor: '#f9fafb', 
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              marginBottom: 8
            }}>
              <p style={{ color: '#111827', fontSize: 14, margin: 0 }}>{activity.message}</p>
              <p style={{ color: '#6b7280', fontSize: 12, margin: '4px 0 0 0' }}>{activity.timestamp}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
