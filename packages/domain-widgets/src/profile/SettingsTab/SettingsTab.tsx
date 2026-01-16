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
  onUploadPhoto?: (file: File) => Promise<void> | void;
  preferences?: {
    hubTitle?: string;
    defaultLandingTab?: string;
    theme?: 'light' | 'dark' | 'system';
  };
  onSavePreferences?: (prefs: Partial<SettingsTabProps['preferences']>) => void;
  availableTabs?: Array<{ id: string; label: string }>;
  onSetTheme?: (t: 'light' | 'dark' | 'system') => void;
  passwordResetAvailable?: boolean;
  accessStatus?: 'active' | 'locked';
  accessTier?: string | null;
  accessSource?: 'direct' | 'cascade' | null;
  onRedeemAccessCode?: (code: string) => Promise<void> | void;
}

export function SettingsTab({
  primaryColor,
  onOpenAccountSecurity,
  onRequestPasswordReset,
  onUploadPhoto,
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
  onSetTheme,
  passwordResetAvailable = true,
  accessStatus = 'locked',
  accessTier,
  accessSource,
  onRedeemAccessCode,
}: SettingsTabProps) {
  const [hubTitle, setHubTitle] = useState(preferences?.hubTitle || '');
  const [defaultTab, setDefaultTab] = useState(preferences?.defaultLandingTab || 'dashboard');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(preferences?.theme || 'light');
  const [accessCode, setAccessCode] = useState('');
  const [accessMessage, setAccessMessage] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const statusLabel = accessStatus === 'active' ? 'Active' : 'Pending';
  const tierLabel =
    accessTier === 'standard' ? 'Free' : accessTier === 'premium' ? 'Premium' : accessTier;

  const previewHubName = useMemo(() => hubTitle.trim() || 'My Hub', [hubTitle]);

  type Section = 'personalization' | 'photo' | 'security' | 'access' | 'notifications' | 'accessibility';
  const [active, setActive] = useState<Section>('personalization');

  const NavItem = ({ id, label }: { id: Section; label: string }) => (
    <button
      onClick={() => setActive(id)}
      style={{
        textAlign: 'left',
        padding: '10px 12px',
        borderRadius: 8,
        background: active === id ? 'var(--card-muted)' : 'transparent',
        color: 'var(--text)',
        border: '1px solid var(--border)'
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
      {/* Left rail */}
      <aside style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>Settings</div>
        <NavItem id="personalization" label="Personalization" />
        <NavItem id="photo" label="Profile Photo" />
        <NavItem id="security" label="Account Security" />
        <NavItem id="access" label="Access Codes" />
        <NavItem id="notifications" label="Notifications" />
        <NavItem id="accessibility" label="Accessibility" />
      </aside>

      {/* Right content */}
      <div style={{ display: 'grid', gap: 16 }}>
        {active === 'personalization' && (
          <section className="ui-card">
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)', background: 'var(--card-muted)' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text)' }}>Personalization</h3>
            </div>
            <div style={{ padding: 16, display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Hub Title</label>
                <input
                  value={hubTitle}
                  onChange={(e) => setHubTitle(e.target.value)}
                  placeholder="e.g., Downtown Hub"
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--card-bg)', color: 'var(--text)' }}
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
                    style={{ padding: '8px 12px', background: 'var(--card-muted)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
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
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--card-bg)', color: 'var(--text)' }}
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
                    <input type="radio" name="theme" checked={theme === 'light'} onChange={() => { setTheme('light'); onSavePreferences?.({ theme: 'light' }); onSetTheme?.('light'); }} /> Light
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="radio" name="theme" checked={theme === 'dark'} onChange={() => { setTheme('dark'); onSavePreferences?.({ theme: 'dark' }); onSetTheme?.('dark'); }} /> Dark
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="radio" name="theme" checked={theme === 'system'} onChange={() => { setTheme('system'); onSavePreferences?.({ theme: 'system' }); onSetTheme?.('system'); }} /> System
                  </label>
                </div>
              </div>
            </div>
          </section>
        )}

        {active === 'photo' && (
          <section className="ui-card">
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)', background: 'var(--card-muted)' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text)' }}>Profile Photo</h3>
            </div>
            <div style={{ padding: 16 }}>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try { await onUploadPhoto?.(f); } catch {}
                  e.currentTarget.value = '';
                }}
              />
            </div>
          </section>
        )}

        {active === 'security' && (
          <section className="ui-card">
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)', background: 'var(--card-muted)' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text)' }}>Account Security</h3>
            </div>
            <div style={{ padding: 16, display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' }}>
              <button
                style={{ padding: '8px 12px', background: primaryColor, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                onClick={() => onOpenAccountSecurity?.()}
              >
                Manage Account (Clerk)
              </button>
              {passwordResetAvailable ? (
                <button
                  style={{ padding: '8px 12px', background: 'var(--card-muted)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
                  onClick={() => onRequestPasswordReset?.()}
                >
                  Send Password Reset Email
                </button>
              ) : (
                <span style={{ fontSize: 12, color: '#6b7280' }}>
                  Password is managed by your SSO provider.
                </span>
              )}
            </div>
          </section>
        )}

        {active === 'access' && (
          <section className="ui-card">
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)', background: 'var(--card-muted)' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text)' }}>Access Codes</h3>
            </div>
            <div style={{ padding: 16, display: 'grid', gap: 12 }}>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>
                Status:{' '}
                <strong style={{ color: accessStatus === 'active' ? '#22c55e' : '#f97316' }}>
                  {statusLabel}
                </strong>
                {tierLabel ? (
                  <span style={{ marginLeft: 8, color: '#6b7280', fontSize: 12 }}>
                    Tier: {tierLabel}
                    {accessSource ? ` (${accessSource})` : ''}
                  </span>
                ) : null}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                  Enter product code
                </label>
                <input
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value);
                    setAccessMessage(null);
                    setAccessError(null);
                  }}
                  placeholder="CKS-XXXX-XXXX-XXXX"
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--card-bg)', color: 'var(--text)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
                <button
                  style={{ padding: '8px 12px', background: primaryColor, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                  disabled={isRedeeming || !accessCode.trim() || !onRedeemAccessCode}
                  onClick={async () => {
                    if (!onRedeemAccessCode || !accessCode.trim()) {
                      return;
                    }
                    setIsRedeeming(true);
                    setAccessMessage(null);
                    setAccessError(null);
                    try {
                      await onRedeemAccessCode(accessCode.trim());
                      setAccessMessage('Access code applied. You can now place orders and submit reports.');
                      setAccessCode('');
                    } catch (error) {
                      const message = error instanceof Error ? error.message : 'Failed to redeem access code';
                      setAccessError(message);
                    } finally {
                      setIsRedeeming(false);
                    }
                  }}
                >
                  {isRedeeming ? 'Applying...' : 'Apply Code'}
                </button>
                {accessMessage ? <span style={{ fontSize: 12, color: '#16a34a' }}>{accessMessage}</span> : null}
                {accessError ? <span style={{ fontSize: 12, color: '#dc2626' }}>{accessError}</span> : null}
              </div>
            </div>
          </section>
        )}

        {active === 'notifications' && (
          <section className="ui-card">
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)', background: 'var(--card-muted)' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text)' }}>Notifications</h3>
            </div>
            <div style={{ padding: 16, color: 'var(--text)' }}>
              <p style={{ margin: 0, fontSize: 14 }}>Coming soon</p>
            </div>
          </section>
        )}

        {active === 'accessibility' && (
          <section className="ui-card">
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)', background: 'var(--card-muted)' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text)' }}>Accessibility</h3>
            </div>
            <div style={{ padding: 16, color: 'var(--text)' }}>
              <p style={{ margin: 0, fontSize: 14 }}>Coming soon</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default SettingsTab;
