import React from 'react';
import { ActivityItem } from './ActivityItem';
import { Button } from '@cks/ui';

export interface Activity {
  id: string;
  message: string;
  timestamp: Date;
  type?: 'info' | 'success' | 'warning' | 'action';
  metadata?: {
    role?: string;
    userId?: string;
    [key: string]: any;
  };
}

interface RecentActivityProps {
  activities: Activity[];
  onClear: () => void;
  title?: string;
  maxHeight?: string;
  emptyMessage?: string;
}

export function RecentActivity({
  activities,
  onClear,
  title = 'Recent Activity',
  maxHeight = '400px',
  emptyMessage = 'No recent activity',
}: RecentActivityProps) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div
        className="ui-card"
        style={{
          padding: 16,
          position: 'relative',
        }}
      >
        {activities.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: 12,
            }}
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={onClear}
              style={{ backgroundColor: '#0f172a', borderColor: '#0f172a', color: 'white' }}
            >
              Clear
            </Button>
          </div>
        )}

        <div
          style={{
            maxHeight,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
        {activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              message={activity.message}
              timestamp={activity.timestamp}
              type={activity.type}
              role={activity.metadata?.role}
              title={activity.metadata?.title}
            />
          ))
        ) : (
          <div
            style={{
              padding: '48px 16px',
              textAlign: 'center',
              color: '#9ca3af',
            }}
          >
            <div
              style={{
                fontSize: 48,
                marginBottom: 12,
                opacity: 0.5,
              }}
            >
              📋
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#6b7280',
              }}
            >
              {emptyMessage}
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#9ca3af',
                marginTop: 4,
              }}
            >
              Activities will appear here as they occur
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
