/*----------------------------------------------- 
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: NavigationTabs.tsx
 *
 * Description:
 * Shared tab navigation bar for hubs. Pure UI + callbacks.
 *
 * Responsibilities:
 * - Render tabs with active state
 * - Invoke onTabChange on selection
 *
 * Role in system:
 * - Used by RoleHub and any hub surfaces needing a tab bar
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import React from 'react';

export interface Tab {
  key: string;
  label: string;
  icon?: string;
  requires?: string[];
}

export interface NavigationTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
  accentColor?: string; // retained for theme compatibility
  variant?: 'default' | 'compact';
}

export default function NavigationTabs({ tabs, activeTab, onTabChange, className, accentColor, variant = 'default' }: NavigationTabsProps) {
  return (
    <div className={className} style={{ display: 'flex', gap: variant === 'compact' ? 4 : 8, flexWrap: 'wrap' }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onTabChange(t.key)}
          style={{
            padding: variant === 'compact' ? '6px 12px' : '8px 16px',
            border: 'none',
            borderRadius: 6,
            background: activeTab === t.key ? (accentColor || '#111827') : '#f3f4f6',
            color: activeTab === t.key ? 'white' : '#374151',
            fontSize: variant === 'compact' ? 13 : 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === t.key ? `inset 0 -2px 0 0 ${accentColor || '#111827'}` : 'inset 0 -2px 0 0 transparent',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
