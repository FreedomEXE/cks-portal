/**
 * ActivityHistoryModal - Slide-out panel showing activity history
 *
 * Shows last 30 days of all activities including cleared ones.
 * Cleared activities are shown with reduced opacity.
 */

import React, { useState, useMemo } from 'react';
import Button from '../../buttons/Button';

export interface ActivityHistoryItem {
  id: string;
  message: string;
  timestamp: Date;
  type?: 'info' | 'success' | 'warning' | 'action';
  onClick?: () => void;
  metadata?: {
    role?: string;
    userId?: string;
    userName?: string;
    targetType?: string;
    [key: string]: any;
  };
  clearedAt?: string | null;
  clearedBy?: string | null;
}

export interface ActivityHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityHistoryItem[];
  isLoading?: boolean;
  error?: Error | null;
}

// Role-based color schemes (same as ActivityItem)
const roleColors: Record<string, { bg: string; text: string }> = {
  admin: { bg: '#f3f4f6', text: '#111827' },
  manager: { bg: '#eff6ff', text: '#1e40af' },
  contractor: { bg: '#ecfdf5', text: '#065f46' },
  customer: { bg: '#fef3c7', text: '#78350f' },
  center: { bg: '#fef2e8', text: '#7c2d12' },
  crew: { bg: '#fee2e2', text: '#991b1b' },
  warehouse: { bg: '#fae8ff', text: '#581c87' },
  system: { bg: '#e0e7ff', text: '#3730a3' },
  default: { bg: '#f9fafb', text: '#374151' },
};

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days > 0) {
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  } else if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  } else if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  } else {
    return 'Just now';
  }
}

export function ActivityHistoryModal({
  isOpen,
  onClose,
  activities,
  isLoading = false,
  error = null,
}: ActivityHistoryModalProps) {
  // Filter state
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');

  // Extract unique types and users
  const { activityTypes, users } = useMemo(() => {
    const types = new Set<string>();
    const userMap = new Map<string, string>();

    activities.forEach((activity) => {
      const targetType = activity.metadata?.targetType;
      if (targetType) {
        types.add(targetType);
      }

      const userId = activity.metadata?.userId;
      const userName = activity.metadata?.userName || userId;
      if (userId && userName) {
        userMap.set(userId, userName);
      }
    });

    return {
      activityTypes: Array.from(types).sort(),
      users: Array.from(userMap.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [activities]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (typeFilter !== 'all' && activity.metadata?.targetType !== typeFilter) {
        return false;
      }
      if (userFilter !== 'all' && activity.metadata?.userId !== userFilter) {
        return false;
      }
      return true;
    });
  }, [activities, typeFilter, userFilter]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
        }}
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '480px',
          maxWidth: '90vw',
          backgroundColor: '#ffffff',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInFromRight 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#111827' }}>
              Activity History
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
              Last 30 days
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px',
              color: '#6b7280',
              lineHeight: 1,
            }}
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Filters */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              fontSize: '13px',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Types</option>
            {activityTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          {users.length > 0 && (
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '13px',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Activity List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 24px',
          }}
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#6b7280' }}>
                Loading history...
              </div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#dc2626' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>
                Failed to load history
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                {error.message || 'Please try again'}
              </div>
            </div>
          ) : filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => {
              const colors = roleColors[activity.metadata?.role || 'default'] || roleColors.default;
              const isCleared = !!activity.clearedAt;
              const relativeTime = getRelativeTime(activity.timestamp);

              return (
                <div
                  key={activity.id}
                  style={{
                    padding: '14px 16px',
                    backgroundColor: colors.bg,
                    borderRadius: '6px',
                    marginBottom: '8px',
                    cursor: activity.onClick ? 'pointer' : 'default',
                    opacity: isCleared ? 0.5 : 1,
                    transition: 'opacity 0.2s, transform 0.2s',
                    position: 'relative',
                  }}
                  onClick={activity.onClick}
                  onMouseEnter={(e) => {
                    if (activity.onClick && !isCleared) {
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  {isCleared && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        fontSize: '11px',
                        color: colors.text,
                        opacity: 0.7,
                        fontWeight: 500,
                      }}
                    >
                      CLEARED
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: '13px',
                      color: colors.text,
                      lineHeight: 1.5,
                      marginRight: isCleared ? '60px' : '0',
                    }}
                  >
                    {activity.message}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: colors.text,
                      marginTop: '6px',
                      opacity: 0.85,
                    }}
                  >
                    {relativeTime}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>📋</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#6b7280' }}>
                No activity history
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                Activities from the last 30 days will appear here
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Animation Keyframes */}
      <style>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
