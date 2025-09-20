/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: OverviewCard.tsx
 *
 * Description:
 * Reusable metric/overview card component
 *
 * Responsibilities:
 * - Display title, value, and subtitle in card format
 * - Support different color themes for values
 * - Handle click interactions with hover states
 * - Show loading skeleton when data is fetching
 *
 * Role in system:
 * - Used in overview sections across all role hubs
 *
 * Notes:
 * Matches the design from manager overview example
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import React from 'react';

export interface OverviewCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  onClick?: () => void;
  loading?: boolean;
}

const colorMap: Record<string, string> = {
  blue: '#3b82f6',
  green: '#10b981',
  purple: '#8b5cf6',
  orange: '#f97316',
  red: '#ef4444',
  yellow: '#eab308',
  gray: '#6b7280',
  black: '#111827'
};

export default function OverviewCard({
  title,
  value,
  subtitle,
  color = 'blue',
  onClick,
  loading = false
}: OverviewCardProps) {
  const displayColor = colorMap[color] || color;

  if (loading) {
    return (
      <div className="ui-card" style={{
        padding: 16,
        textAlign: 'center'
      }}>
        <div style={{
          background: '#f3f4f6',
          height: 12,
          width: '60%',
          borderRadius: 4,
          marginBottom: 8,
          margin: '0 auto 8px',
          animation: 'pulse 2s infinite'
        }} />
        <div style={{
          background: '#f3f4f6',
          height: 32,
          width: '40%',
          borderRadius: 4,
          marginBottom: 4,
          margin: '0 auto 4px',
          animation: 'pulse 2s infinite'
        }} />
        <div style={{
          background: '#f3f4f6',
          height: 12,
          width: '80%',
          borderRadius: 4,
          margin: '0 auto',
          animation: 'pulse 2s infinite'
        }} />
      </div>
    );
  }

  return (
    <div
      className="ui-card"
      onClick={onClick}
      style={{
        padding: 16,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)';
        e.currentTarget.style.background = '#fafafa';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.background = '';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
      }}
    >
      <div style={{
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4
      }}>
        {title}
      </div>

      <div style={{
        fontSize: 32,
        fontWeight: 700,
        color: displayColor
      }}>
        {value}
      </div>
    </div>
  );
}