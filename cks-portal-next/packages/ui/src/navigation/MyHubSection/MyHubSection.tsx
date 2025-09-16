/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: MyHubSection.tsx
 *
 * Description:
 * Reusable navigation header component for all role hubs
 *
 * Responsibilities:
 * - Display hub name and welcome message
 * - Render navigation tabs with active state
 * - Handle logout functionality
 * - Apply role-based color theming
 *
 * Role in system:
 * - Used by all 7 hub orchestrators (Admin, Manager, Contractor, etc.)
 *
 * Notes:
 * Extracted from common pattern across all role hubs
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import React from 'react';

export interface Tab {
  id: string;
  label: string;
  path: string;
  icon?: string;
}

export interface MyHubSectionProps {
  hubName: string;
  tabs: Tab[];
  activeTab: string;
  onTabClick: (tabId: string) => void;
  onLogout: () => void;
  userId?: string;
  role?: string;
}

// Role-based color mapping
const roleColors: Record<string, { primary: string; accent: string }> = {
  admin: { primary: '#111827', accent: '#374151' },      // Black/Gray
  manager: { primary: '#3b82f6', accent: '#60a5fa' },    // Blue
  contractor: { primary: '#10b981', accent: '#34d399' }, // Green
  customer: { primary: '#eab308', accent: '#facc15' },   // Yellow
  center: { primary: '#f97316', accent: '#fb923c' },     // Orange
  crew: { primary: '#ef4444', accent: '#f87171' },       // Red
  warehouse: { primary: '#8b5cf6', accent: '#a78bfa' },  // Purple
};

export default function MyHubSection({
  hubName,
  tabs,
  activeTab,
  onTabClick,
  onLogout,
  userId,
  role = 'manager'
}: MyHubSectionProps) {
  const colors = roleColors[role.toLowerCase()] || roleColors.manager;

  return (
    <div style={{ padding: '16px 24px 24px 24px', background: '#f9fafb' }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 12,
        border: `3px solid ${colors.primary}`,
        padding: '20px 24px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
      }}>
        {/* Header Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12
        }}>
          <h1 style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 700,
            color: '#111827'
          }}>
            {hubName}
          </h1>

          <button
            onClick={onLogout}
            style={{
              padding: '8px 16px',
              background: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Log out
          </button>
        </div>

        {/* Welcome Message */}
        <div style={{
          fontSize: 14,
          color: '#6b7280',
          marginBottom: 16
        }}>
          Welcome to {hubName}
          {userId && (
            <span style={{ marginLeft: 8, fontSize: 12, color: '#9ca3af' }}>
              ({userId})
            </span>
          )}
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginTop: 16,
          flexWrap: 'wrap'
        }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabClick(tab.id)}
                style={{
                  padding: '8px 16px',
                  background: isActive ? colors.accent : '#f3f4f6',
                  color: isActive ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#f3f4f6';
                  }
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}