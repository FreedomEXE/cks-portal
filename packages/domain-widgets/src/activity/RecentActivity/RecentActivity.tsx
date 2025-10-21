import React, { useState, useMemo } from 'react';
import { ActivityItem } from './ActivityItem';
import { Button } from '@cks/ui';

export interface Activity {
  id: string;
  message: string;
  timestamp: Date;
  type?: 'info' | 'success' | 'warning' | 'action';
  onClick?: () => void;
  onClear?: () => void;
  metadata?: {
    role?: string;
    userId?: string;
    userName?: string;
    targetType?: string; // 'order', 'service', 'report', 'feedback', etc.
    [key: string]: any;
  };
}

interface RecentActivityProps {
  activities: Activity[];
  title?: string;
  maxHeight?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  error?: Error | null;
}

export function RecentActivity({
  activities,
  title = 'Recent Activity',
  maxHeight = '400px',
  emptyMessage = 'No recent activity',
  isLoading = false,
  error = null,
}: RecentActivityProps) {
  // Filter state
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [isFilterHover, setIsFilterHover] = useState<boolean>(false);

  // Extract unique types and users from activities
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
      // Search filter (by ID or name in message)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const messageMatch = activity.message.toLowerCase().includes(query);
        const idMatch = activity.id.toLowerCase().includes(query);
        const userNameMatch = activity.metadata?.userName?.toLowerCase().includes(query);

        if (!messageMatch && !idMatch && !userNameMatch) {
          return false;
        }
      }

      // Filter by type
      if (typeFilter !== 'all') {
        const targetType = activity.metadata?.targetType;
        if (targetType !== typeFilter) {
          return false;
        }
      }

      // Filter by user
      if (userFilter !== 'all') {
        const userId = activity.metadata?.userId;
        if (userId !== userFilter) {
          return false;
        }
      }

      return true;
    });
  }, [activities, typeFilter, userFilter, searchQuery]);

  return (
    <div style={{ marginBottom: 32 }}>
      <div
        className="ui-card"
        style={{
          padding: 16,
          position: 'relative',
        }}
      >
        {/* Minimal Filter Control - Hidden until hover/click */}
        {activities.length > 0 && (
          <div style={{ position: 'relative', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Filter icon button on LEFT */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              style={{
                background: isFilterOpen ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                border: '1px solid',
                borderColor: isFilterOpen ? '#d1d5db' : 'transparent',
                cursor: 'pointer',
                padding: '8px 14px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: isFilterOpen ? 1 : 0.5,
                transition: 'all 0.2s',
                fontSize: '13px',
                color: '#374151',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                setIsFilterHover(true);
                if (!isFilterOpen) {
                  e.currentTarget.style.opacity = '0.8';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }
              }}
              onMouseLeave={(e) => {
                setIsFilterHover(false);
                if (!isFilterOpen) {
                  e.currentTarget.style.opacity = '0.5';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
              title="Customize your view"
            >
              <span style={{ fontSize: '16px', display: 'inline-block', transition: 'transform 0.5s ease', transform: isFilterHover ? 'rotate(180deg)' : 'none' }}>⚙</span>
              <span style={{ fontSize: '13px', display: (isFilterHover || isFilterOpen) ? 'inline' : 'none' }}>Customize View</span>
            </button>

            {/* Expandable filter panel */}
            {isFilterOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 44,
                  left: 0,
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  padding: 12,
                  zIndex: 10,
                  minWidth: 280,
                }}
              >
                <div style={{ marginBottom: 10, fontSize: 12, fontWeight: 600, color: '#374151' }}>
                  Customize Your View
                </div>

                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Search by ID or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '13px',
                    marginBottom: 10,
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                />

                {/* Type Filter */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase' }}>
                    Filter by Type
                  </div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
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
                </div>

                {/* User Filter */}
                {users.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase' }}>
                      Filter by User
                    </div>
                    <select
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '6px',
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
                  </div>
                )}

                {/* End of minimal filter content */}
              </div>
            )}
          </div>
        )}

        <div
          style={{
            maxHeight,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
        {isLoading ? (
          <div
            style={{
              padding: '48px 16px',
              textAlign: 'center',
              color: '#9ca3af',
            }}
          >
            <div
              style={{
                fontSize: 32,
                marginBottom: 12,
                opacity: 0.5,
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            >
              ⏳
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#6b7280',
              }}
            >
              Loading recent activity...
            </div>
          </div>
        ) : error ? (
          <div
            style={{
              padding: '48px 16px',
              textAlign: 'center',
              color: '#9ca3af',
            }}
          >
            <div
              style={{
                fontSize: 32,
                marginBottom: 12,
                opacity: 0.5,
              }}
            >
              ⚠️
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#dc2626',
              }}
            >
              Failed to load activity feed
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#9ca3af',
                marginTop: 4,
              }}
            >
              {error.message || 'Please try again later'}
            </div>
          </div>
        ) : filteredActivities.length > 0 ? (
          filteredActivities.map((activity) => (
            <ActivityItem
              key={activity.id}
              message={activity.message}
              timestamp={activity.timestamp}
              type={activity.type}
              role={activity.metadata?.role}
              title={activity.metadata?.title}
              onClick={activity.onClick}
              onClear={activity.onClear}
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
