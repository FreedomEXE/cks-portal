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
  onUploadPhoto?: (file: File) => Promise<void> | void;
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
  userPreferences?: { hubTitle?: string; defaultLandingTab?: string; theme?: 'light'|'dark'|'system' };
  onSaveUserPreferences?: (prefs: Partial<ProfileInfoCardProps['userPreferences']>) => void;
  availableTabs?: Array<{ id: string; label: string }>;
  /** Theme control from frontend (wired to ThemeProvider) */
  onSetTheme?: (t: 'light' | 'dark' | 'system') => void;
  /** Whether password reset is available (e.g., not SSO-only) */
  passwordResetAvailable?: boolean;
  accessStatus?: 'active' | 'locked';
  accessTier?: string | null;
  accessSource?: 'direct' | 'cascade' | null;
  onRedeemAccessCode?: (code: string) => Promise<void> | void;
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
  onUploadPhoto,
  onSetTheme,
  passwordResetAvailable = true,
  accessStatus,
  accessTier,
  accessSource,
  onRedeemAccessCode,
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
            onUploadPhoto={onUploadPhoto}
            preferences={userPreferences}
            onSavePreferences={onSaveUserPreferences}
            availableTabs={availableTabs}
            onSetTheme={onSetTheme}
            passwordResetAvailable={passwordResetAvailable}
            accessStatus={accessStatus}
            accessTier={accessTier}
            accessSource={accessSource}
            onRedeemAccessCode={onRedeemAccessCode}
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
      <div className={borderless ? undefined : 'ui-card'} style={{ padding: 24 }}>
        {renderTabContent()}
      </div>
    </div>
  );
}

export default ProfileInfoCard;

