import React from 'react';

export default function AdminRecentActions() {
  const recentActions = [
    {
      id: 1,
      user: 'System',
      action: 'Created new user account for John Smith',
      timestamp: '2025-09-12 23:45:00',
      type: 'user_creation'
    },
    {
      id: 2,
      user: 'Admin',
      action: 'Updated system configuration',
      timestamp: '2025-09-12 23:30:00',
      type: 'system_update'
    },
    {
      id: 3,
      user: 'System',
      action: 'Backup completed successfully',
      timestamp: '2025-09-12 23:00:00',
      type: 'system_backup'
    }
  ];

  return (
    <div className="ui-card" style={{ padding: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>
        Recent System Activity
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {recentActions.map((action) => (
          <div
            key={action.id}
            style={{
              padding: 12,
              backgroundColor: '#f9fafb',
              borderRadius: 8,
              border: '1px solid #e5e7eb'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 4 }}>
              <span style={{ color: '#111827', fontSize: 14, fontWeight: 500 }}>
                {action.user}
              </span>
              <span style={{ color: '#6b7280', fontSize: 12 }}>
                {action.timestamp}
              </span>
            </div>
            <div style={{ color: '#374151', fontSize: 14 }}>
              {action.action}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
