/*----------------------------------------------- 
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: SubNavigationTabs.tsx
 *
 * Description:
 * Shared sub-tab navigation for pages like MyProfile (Profile / Account Manager / Settings).
 *
 * Responsibilities:
 * - Render compact, secondary tab bar
 * - Notify parent via onTabChange
 *
 * Role in system:
 * - Used inside individual tabs (e.g., MyProfile) to switch sub-views
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import React from 'react';

export interface SubTab {
  key: string;
  label: string;
}

export interface SubNavigationTabsProps {
  tabs: SubTab[];
  active: string;
  onTabChange: (key: string) => void;
  className?: string;
}

export default function SubNavigationTabs({ tabs, active, onTabChange, className }: SubNavigationTabsProps) {
  return (
    <div className={className} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onTabChange(t.key)}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: '1px solid #e5e7eb',
            background: active === t.key ? '#10b981' : 'white',
            color: active === t.key ? 'white' : '#111827',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

