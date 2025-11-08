/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: ProfileInfoCard.tsx
 *
 * Description:
 * Main profile information card with tab navigation
 *
 * Responsibilities:
 * - Orchestrate profile tabs based on role
 * - Handle tab navigation
 * - Manage profile data display
 *
 * Role in system:
 * - Primary profile component for all roles except Admin
 *
 * Notes:
 * Manager and Warehouse have 3 tabs (Profile, History, Settings)
 * All other roles have 4 tabs (Profile, Account Manager, History, Settings)
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import React, { useState } from 'react';
import { NavigationTab, TabContainer } from '@cks/ui';

import { ProfileTab } from '../ProfileTab';
import { AccountManagerTab, type AccountManagerInfo } from '../AccountManagerTab';
import { TimelineTab } from '../TimelineTab';
import { SettingsTab } from '../SettingsTab';

export interface ProfileInfoCardProps {
  role: 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse';
  profileData: any;
  accountManager?: AccountManagerInfo | null;
  primaryColor: string;
  onUpdatePhoto?: () => void;
  onContactManager?: () => void;
  onScheduleMeeting?: () => void;
  /** When true, hides the internal tab navigation */
  hideTabs?: boolean;
  /** Optional list of enabled internal tabs; defaults to role-based */
  enabledTabs?: Array<'profile' | 'accountManager' | 'timeline' | 'settings'>;
  /** When true, removes card border and shadow */
  borderless?: boolean;
  /** Settings integrations */
  onOpenAccountSecurity?: () => void;
  onRequestPasswordReset?: () => void;
  userPreferences?: { hubTitle?: string; defaultLandingTab?: string; theme?: 'light'|'dark' };
  onSaveUserPreferences?: (prefs: Partial<ProfileInfoCardProps['userPreferences']>) => void;
  availableTabs?: Array<{ id: string; label: string }>;
}

export function ProfileInfoCard({
  role,
  profileData,
  accountManager,
  primaryColor,
  onUpdatePhoto,
  onContactManager,
  onScheduleMeeting,
  hideTabs = false,
  enabledTabs,
  borderless = false,
  onOpenAccountSecurity,
  onRequestPasswordReset,
  userPreferences,
  onSaveUserPreferences,
  availableTabs,
}: ProfileInfoCardProps) {
  const [activeTab, setActiveTab] = useState('profile');

  // Manager and Warehouse roles: Profile, Timeline, Settings
  // All other roles: Profile, Account Manager, Timeline, Settings
  const hasNoAccountManager = role === 'manager' || role === 'warehouse';
  const defaultTabs = hasNoAccountManager
    ? (['profile', 'timeline', 'settings'] as Array<'profile' | 'timeline' | 'settings'>)
    : (['profile', 'accountManager', 'timeline', 'settings'] as Array<'profile' | 'accountManager' | 'timeline' | 'settings'>);
  const tabs = (enabledTabs && enabledTabs.length ? enabledTabs : defaultTabs) as string[];

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'profile':
        return 'Profile';
      case 'accountManager':
        return 'Account Manager';
      case 'timeline':
        return 'History';
      case 'settings':
        return 'Settings';
      default:
        return tab;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ProfileTab
            role={role}
            profileData={profileData}
            primaryColor={primaryColor}
            onUpdatePhoto={onUpdatePhoto}
          />
        );
      case 'accountManager':
        return (
          <AccountManagerTab
            accountManager={accountManager || null}
            primaryColor={primaryColor}
            onContactManager={onContactManager}
            onScheduleMeeting={onScheduleMeeting}
          />
        );
      case 'timeline':
        return (
          <TimelineTab
            role={role}
            profileData={profileData}
            primaryColor={primaryColor}
          />
        );
      case 'settings':
        return (
          <SettingsTab
            primaryColor={primaryColor}
            onOpenAccountSecurity={onOpenAccountSecurity}
            onRequestPasswordReset={onRequestPasswordReset}
            onUpdatePhoto={onUpdatePhoto}
            preferences={userPreferences}
            onSavePreferences={onSaveUserPreferences}
            availableTabs={availableTabs}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div>

      {/* Tabs - Outside the card (optional) */}
      {!hideTabs && (
        <div style={{ marginBottom: 24 }}>
          <TabContainer variant="pills" spacing="normal">
            {tabs.map((tab) => (
              <NavigationTab
                key={tab}
                label={getTabLabel(tab)}
                isActive={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                variant="pills"
                activeColor={primaryColor}
              />
            ))}
          </TabContainer>
        </div>
      )}

      {/* Card Content */}
      <div
        className={borderless ? undefined : 'ui-card'}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: borderless ? 'none' : '1px solid #e5e7eb',
          padding: 24,
          boxShadow: borderless ? 'none' : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
        }}
      >
        {renderTabContent()}
      </div>
    </div>
  );
}

export default ProfileInfoCard;

