/*-----------------------------------------------
  Property of CKS  c 2025
-----------------------------------------------*/
/**
 * File: SettingsTab.tsx
 *
 * Description:
 * Settings and preferences UI for ProfileInfoCard
 */

import React, { useMemo, useState } from 'react';

export interface SettingsTabProps {
  primaryColor: string;
  onOpenAccountSecurity?: () => void;
  onRequestPasswordReset?: () => void;
  onUpdatePhoto?: () => void;
  preferences?: {
    hubTitle?: string;
    defaultLandingTab?: string;
    theme?: 'light' | 'dark';
  };
  onSavePreferences?: (prefs: Partial<SettingsTabProps['preferences']>) => void;
  availableTabs?: Array<{ id: string; label: string }>;
}

export function SettingsTab({
  primaryColor,
  onOpenAccountSecurity,
  onRequestPasswordReset,
  onUpdatePhoto,
  preferences,
  onSavePreferences,
  availableTabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'profile', label: 'My Profile' },
    { id: 'ecosystem', label: 'My Ecosystem' },
    { id: 'services', label: 'Services' },
    { id: 'orders', label: 'Orders' },
    { id: 'reports', label: 'Reports' },
    { id: 'support', label: 'Support' },
  ],
}: SettingsTabProps) {
  const [hubTitle, setHubTitle] = useState(preferences?.hubTitle || '');
  const [defaultTab, setDefaultTab] = useState(preferences?.defaultLandingTab || 'dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(preferences?.theme || 'light');

  const previewHubName = useMemo(() => hubTitle.trim() || 'My Hub', [hubTitle]);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Personalization */}
      <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <h3 style={{ margin: 0, fontSize: 16, color: '#111827' }}>Personalization</h3>
        </div>
        <div style={{ padding: 16, display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Hub Title</label>
            <input
              value={hubTitle}
              onChange={(e) => setHubTitle(e.target.value)}
              placeholder="e.g., Downtown Hub"
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}
            />
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Preview: Welcome to {previewHubName}!</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                style={{ padding: '8px 12px', background: primaryColor, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                onClick={() => onSavePreferences?.({ hubTitle: hubTitle.trim() || undefined })}
              >
                Save Title
              </button>
              <button
                style={{ padding: '8px 12px', background: '#f3f4f6', color: '#111827', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }}
                onClick={() => { setHubTitle(''); onSavePreferences?.({ hubTitle: undefined }); }}
              >
                Reset
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Default Landing Tab</label>
            <select
              value={defaultTab}
              onChange={(e) => { setDefaultTab(e.target.value); onSavePreferences?.({ defaultLandingTab: e.target.value }); }}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}
            >
              {availableTabs.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Theme</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="radio" name="theme" checked={theme === 'light'} onChange={() => { setTheme('light'); onSavePreferences?.({ theme: 'light' }); }} /> Light
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="radio" name="theme" checked={theme === 'dark'} onChange={() => { setTheme('dark'); onSavePreferences?.({ theme: 'dark' }); }} /> Dark
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Photo */}
      <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <h3 style={{ margin: 0, fontSize: 16, color: '#111827' }}>Profile Photo</h3>
        </div>
        <div style={{ padding: 16 }}>
          <button
            style={{ padding: '8px 12px', background: '#f3f4f6', color: '#111827', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }}
            onClick={() => onUpdatePhoto?.()}
          >
            Update Photo
          </button>
        </div>
      </section>

      {/* Account Security */}
      <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <h3 style={{ margin: 0, fontSize: 16, color: '#111827' }}>Account Security</h3>
        </div>
        <div style={{ padding: 16, display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
          <button
            style={{ padding: '8px 12px', background: primaryColor, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            onClick={() => onOpenAccountSecurity?.()}
          >
            Manage Account (Clerk)
          </button>
          <button
            style={{ padding: '8px 12px', background: '#f3f4f6', color: '#111827', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }}
            onClick={() => onRequestPasswordReset?.()}
          >
            Send Password Reset Email
          </button>
        </div>
      </section>
    </div>
  );
}

export default SettingsTab;

