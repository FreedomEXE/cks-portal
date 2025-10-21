import React from 'react';

interface ActivityItemProps {
  message: string;
  timestamp: Date;
  type?: 'info' | 'success' | 'warning' | 'action';
  role?: string; // Role that generated this activity
  title?: string; // Optional title for the activity
  onClick?: () => void; // Optional click handler for activity routing
  onClear?: () => void; // Optional clear handler for individual activity
}

// Role-based color schemes
const roleColors: Record<string, { bg: string; text: string }> = {
  admin: {
    bg: '#f3f4f6',      // Light gray
    text: '#111827',     // Black
  },
  manager: {
    bg: '#eff6ff',      // Light blue
    text: '#1e40af',     // Dark blue
  },
  contractor: {
    bg: '#ecfdf5',      // Light green
    text: '#065f46',     // Dark green
  },
  customer: {
    bg: '#fef3c7',      // Light yellow
    text: '#78350f',     // Dark yellow/brown
  },
  center: {
    bg: '#fef2e8',      // Light orange
    text: '#7c2d12',     // Dark orange
  },
  crew: {
    bg: '#fee2e2',      // Light red
    text: '#991b1b',     // Dark red
  },
  warehouse: {
    bg: '#fae8ff',      // Light purple
    text: '#581c87',     // Dark purple
  },
  system: {
    bg: '#e0e7ff',      // Light indigo
    text: '#3730a3',     // Dark indigo
  },
  default: {
    bg: '#f9fafb',      // Light gray
    text: '#374151',     // Dark gray
  },
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

export function ActivityItem({
  message,
  timestamp,
  type = 'info',
  role = 'default',
  title,
  onClick,
  onClear
}: ActivityItemProps) {
  const colors = roleColors[role] || roleColors.default;
  const relativeTime = getRelativeTime(timestamp);
  const formattedTime = timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const isClickable = !!onClick;

  return (
    <div
      style={{
        padding: '14px 16px',
        paddingRight: onClear ? '48px' : '16px',
        backgroundColor: colors.bg,
        borderRadius: '6px',
        marginBottom: '8px',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: isClickable ? 'pointer' : 'default',
        position: 'relative',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (isClickable) {
          e.currentTarget.style.transform = 'translateX(4px)';
          e.currentTarget.style.boxShadow = '0 2px 4px 0 rgba(0, 0, 0, 0.15)';
        } else {
          e.currentTarget.style.transform = 'translateX(2px)';
          e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {onClear && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          style={{
            position: 'absolute',
            top: '50%',
            right: '20px',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.25,
            transition: 'opacity 0.2s, background 0.2s',
            fontSize: '14px',
            lineHeight: 1,
            color: '#6b7280',
            fontWeight: 400,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.6';
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.25';
            e.currentTarget.style.background = 'transparent';
          }}
          title="Clear this activity"
        >
          ✕
        </button>
      )}
      {title && (
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: colors.text,
            marginBottom: 4,
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {title}
        </div>
      )}
      <div
        style={{
          fontSize: 13,
          color: colors.text,
          lineHeight: 1.5,
          opacity: 1,
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
        }}
      >
        {message}
      </div>
      <div
        style={{
          fontSize: 12,
          color: colors.text,
          marginTop: 6,
          opacity: 0.85,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span>{relativeTime}</span>
        <span style={{ fontSize: 10 }}>•</span>
        <span>{formattedTime}</span>
      </div>
    </div>
  );
}
