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
 * Manager has 2 tabs, all other roles have 3 tabs
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import React, { useState } from 'react';
import { NavigationTab } from '../../../../ui/src/navigation/NavigationTab';
import { TabContainer } from '../../../../ui/src/navigation/TabContainer';
import { ProfileTab } from '../ProfileTab';
import { AccountManagerTab, type AccountManagerInfo } from '../AccountManagerTab';
import { SettingsTab } from '../SettingsTab';

export interface ProfileInfoCardProps {
  role: 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse';
  profileData: any;
  accountManager?: AccountManagerInfo | null;
  primaryColor: string;
  onUpdatePhoto?: () => void;
  onContactManager?: () => void;
  onScheduleMeeting?: () => void;
}

export function ProfileInfoCard({
  role,
  profileData,
  accountManager,
  primaryColor,
  onUpdatePhoto,
  onContactManager,
  onScheduleMeeting
}: ProfileInfoCardProps) {
  const [activeTab, setActiveTab] = useState('profile');

  // Manager role has only Profile and Settings tabs
  // All other roles have Profile, Account Manager, and Settings tabs
  const isManager = role === 'manager';
  const tabs = isManager
    ? ['profile', 'settings']
    : ['profile', 'accountManager', 'settings'];

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'profile':
        return 'Profile';
      case 'accountManager':
        return 'Account Manager';
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
      case 'settings':
        return (
          <SettingsTab primaryColor={primaryColor} />
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Header */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#111827' }}>
        My Profile
      </h2>

      {/* Tabs - Outside the card */}
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

      {/* Card Content */}
      <div className="ui-card" style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        padding: 24,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}>
        {renderTabContent()}
      </div>
    </div>
  );
}

export default ProfileInfoCard;