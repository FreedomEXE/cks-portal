/**
 * File: DirectoryTabs.tsx
 *
 * Description:
 *   Tab bar for Admin Directory sections.
 *
 * Functionality:
 *   Renders labeled buttons and reports active tab via onChange.
 *
 * Importance:
 *   Primary navigation within the Admin Directory.
 *
 * Connections:
 *   Consumed by DirectoryPage; exposes AdminDirectoryTabKey type.
 */

/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import React from 'react';

export type AdminDirectoryTabKey =
  | 'crew' | 'contractors' | 'customers' | 'centers' | 'services' | 'jobs' | 'supplies' | 'procedures' | 'training' | 'management' | 'warehouses' | 'orders' | 'reports';

export const adminDirectoryTabs: Array<{ key: AdminDirectoryTabKey; label: string }> = [
  { key: 'crew', label: 'Crew' },
  { key: 'contractors', label: 'Contractors' },
  { key: 'customers', label: 'Customers' },
  { key: 'centers', label: 'Centers' },
  { key: 'services', label: 'Services' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'supplies', label: 'Supplies' },
  { key: 'procedures', label: 'Procedures' },
  { key: 'training', label: 'Training' },
  { key: 'management', label: 'Management' },
  { key: 'warehouses', label: 'Warehouses' },
  { key: 'orders', label: 'Orders' },
  { key: 'reports', label: 'Reports' },
];

export default function DirectoryTabs({ active, onChange }: { active: AdminDirectoryTabKey; onChange: (k: AdminDirectoryTabKey) => void; }) {
  return (
    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom: 12 }}>
      {adminDirectoryTabs.map(t => (
        <button key={t.key}
          className={"ui-button"}
          style={{ padding: '8px 12px', borderRadius: 10, background: active === t.key ? '#eef2ff' : undefined, fontWeight: active === t.key ? 600 : 500 }}
          onClick={() => onChange(t.key)}
          aria-current={active === t.key ? 'page' : undefined}
        >{t.label}</button>
      ))}
    </div>
  );
}
