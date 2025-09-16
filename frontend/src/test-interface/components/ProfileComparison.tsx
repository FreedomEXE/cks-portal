/*----------------------------------------------- 
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: ProfileComparison.tsx
 *
 * Description:
 * Side-by-side view of original MyProfile (contractor) vs shared ProfileSection.
 *
 * Responsibilities:
 * - Visual verification of extraction without changing behavior
 *
 * Role in system:
 * - Test-only component for refactor validation
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import React, { useState } from 'react';
import MyProfile from '../../hub/roles/contractor/tabs/MyProfile';
import ProfileSection from '../../shared/components/ProfileSection';
import NavigationTabs from '../../shared/components/NavigationTabs';
import SubNavigationTabs from '../../shared/components/SubNavigationTabs';
import contractorConfig from '../../hub/roles/contractor/config.v1.json';
import AccountManagerPanel from '../../shared/components/AccountManagerPanel';
import SettingsPanel from '../../shared/components/SettingsPanel';

export default function ProfileComparison() {
  const mockConfig = {};
  const mockFeatures = {} as Record<string, unknown>;
  const mockApi = {} as Record<string, unknown>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      {/* A. Original MyProfile with its sub-tabs */}
      <div>
        <h3 style={{ margin: '8px 0' }}>A) Original MyProfile (sub-tabs)</h3>
        <div className="ui-card" style={{ padding: 16 }}>
          <MyProfile userId="CON-001" config={mockConfig} features={mockFeatures} api={mockApi} />
        </div>
      </div>

      {/* B + C. Shared SubNavigationTabs + nested card content */}
      <div>
        <h3 style={{ margin: '8px 0' }}>B/C) Shared SubNavigation + ProfileSection</h3>
        <div className="ui-card" style={{ padding: 16 }}>
          <RefactoredMyProfileDemo />
        </div>
      </div>

      {/* Main NavigationTabs comparison for parity checks */}
      <div style={{ gridColumn: '1 / span 2' }}>
        <TabsComparison />
      </div>
    </div>
  );
}

function RefactoredMyProfileDemo() {
  const [active, setActive] = useState<'profile' | 'account' | 'settings'>('profile');
  
  const user = {
    name: 'John Smith, CEO',
    companyName: 'Premium Contractor LLC',
    email: 'contact@premiumcontractor.com',
    phone: '(555) 123-4567',
    website: 'www.premiumcontractor.com',
  };
  const manager = { manager_id: 'MGR-001', name: 'Sarah Johnson', email: 'sarah.johnson@cks.com', phone: '(555) 987-6543', territory: 'Northeast Region', role: 'Senior Account Manager' };

  return (
    <div>
      {/* Outer section header to match left */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Company Profile</h2>

      {/* Sub-tabs */}
      <SubNavigationTabs
        tabs={[
          { key: 'profile', label: 'Profile' },
          { key: 'account', label: 'Account Manager' },
          { key: 'settings', label: 'Settings' },
        ]}
        active={active}
        onTabChange={(k) => setActive(k as any)}
      />

      {/* Nested card content */}
      <div className="ui-card" style={{ padding: 24 }}>
        {active === 'profile' && (
          <ProfileSection user={user} customId="CON-001" role="contractor" />
        )}
        {active === 'account' && (
          <AccountManagerPanel
            manager={manager}
            title="CKS Account Manager"
            onContact={() => {}}
            onSchedule={() => {}}
          />
        )}
        {active === 'settings' && (
          <SettingsPanel settings={{ notifications: true, emailUpdates: true, theme: 'system' }} />
        )}
      </div>
    </div>
  );
}

// Legacy tab bar (copied styling from RoleHub before extraction)
function LegacyTabs({
  tabs,
  active,
  onChange,
  accentColor,
}: {
  tabs: Array<{ id: string; label: string; icon?: string; requires?: string[] }>;
  active: string;
  onChange: (id: string) => void;
  accentColor: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: 6,
            background: active === tab.id ? accentColor : '#f3f4f6',
            color: active === tab.id ? 'white' : '#374151',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: active === tab.id ? `inset 0 -2px 0 0 ${accentColor}` : 'inset 0 -2px 0 0 transparent',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function TabsComparison() {
  const accent: string = (contractorConfig as any).theme?.accentColor || (contractorConfig as any).theme?.primaryColor || '#111827';
  const tabs = (contractorConfig as any).tabs as Array<{ id: string; label: string; icon?: string; requires?: string[] }>;
  const mapped = tabs.map((t) => ({ key: t.id, label: t.label, icon: t.icon, requires: t.requires }));
  const [active, setActive] = useState<string>(tabs.find((t) => (t as any).default)?.id || tabs[0]?.id || '');

  return (
    <div style={{ gridColumn: '1 / span 2' }}>
      <h3 style={{ margin: '8px 0' }}>Navigation Tabs Comparison</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="ui-card" style={{ padding: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Original Tab Bar</div>
          <LegacyTabs tabs={tabs} active={active} onChange={setActive} accentColor={accent} />
        </div>
        <div className="ui-card" style={{ padding: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Shared NavigationTabs</div>
          <NavigationTabs tabs={mapped} activeTab={active} onTabChange={setActive} accentColor={accent} />
        </div>
      </div>
    </div>
  );
}
