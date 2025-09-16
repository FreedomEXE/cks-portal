/*----------------------------------------------- 
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: SettingsPanel.tsx
 *
 * Description:
 * Shared base settings panel (generic). Roles can wrap/extend.
 *
 * Responsibilities:
 * - Render generic preferences: notifications, email updates, theme
 *
 * Role in system:
 * - Dropped into MyProfile's Settings sub-tab for roles that share layout
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import React, { useState } from 'react';

export interface Settings {
  notifications?: boolean;
  emailUpdates?: boolean;
  theme?: 'light' | 'dark' | 'system';
}

export interface SettingsPanelProps {
  settings?: Settings;
  onChange?: (settings: Settings) => void;
}

export default function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const [local, setLocal] = useState<Settings>({
    notifications: settings?.notifications ?? true,
    emailUpdates: settings?.emailUpdates ?? true,
    theme: settings?.theme ?? 'system',
  });

  const update = (patch: Partial<Settings>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange?.(next);
  };

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 520 }}>
      <div>
        <label style={label}>Notifications</label>
        <div>
          <input
            id="pref-notifications"
            type="checkbox"
            checked={!!local.notifications}
            onChange={(e) => update({ notifications: e.currentTarget.checked })}
          />{' '}
          <span style={note}>Enable in-app and push notifications</span>
        </div>
      </div>

      <div>
        <label style={label}>Email Updates</label>
        <div>
          <input
            id="pref-email"
            type="checkbox"
            checked={!!local.emailUpdates}
            onChange={(e) => update({ emailUpdates: e.currentTarget.checked })}
          />{' '}
          <span style={note}>Receive periodic email summaries</span>
        </div>
      </div>

      <div>
        <label style={label}>Theme</label>
        <div>
          <select
            value={local.theme}
            onChange={(e) => update({ theme: e.currentTarget.value as Settings['theme'] })}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>
    </div>
  );
}

const label: React.CSSProperties = { display: 'block', marginBottom: 6, fontWeight: 600, color: '#111827' };
const note: React.CSSProperties = { color: '#6b7280', fontSize: 14 };

