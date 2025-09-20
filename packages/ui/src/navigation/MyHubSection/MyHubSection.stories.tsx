/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: MyHubSection.stories.tsx
 *
 * Description:
 * Storybook stories for MyHubSection component
 *
 * Responsibilities:
 * - Provide visual documentation and testing scenarios
 * - Demonstrate component variations and states
 *
 * Role in system:
 * - Used by Storybook for component development and documentation
 *
 * Notes:
 * Covers different role configurations and states
 */
/*───────────────────────────────────────────────*/
//  Manifested by Freedom_EXE
/*───────────────────────────────────────────────*/

import type { Meta, StoryObj } from '@storybook/react';
import { MyHubSection, TabConfig } from './MyHubSection';

const meta: Meta<typeof MyHubSection> = {
  title: 'Navigation/MyHubSection',
  component: MyHubSection,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    onTabChange: { action: 'tab-changed' },
    onLogout: { action: 'logout-clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const adminTabs: TabConfig[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'users', label: 'Users', badge: 5 },
  { id: 'system', label: 'System' },
  { id: 'audit', label: 'Audit Logs' },
];

const managerTabs: TabConfig[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'ecosystem', label: 'My Ecosystem' },
  { id: 'performance', label: 'Performance', badge: 'New' },
  { id: 'certification', label: 'Certification' },
];

const customerTabs: TabConfig[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'orders', label: 'Orders', badge: 3 },
  { id: 'services', label: 'Services' },
  { id: 'support', label: 'Support' },
  { id: 'profile', label: 'Profile' },
];

export const AdminHub: Story = {
  args: {
    tabs: adminTabs,
    activeTab: 'dashboard',
    userName: 'John Admin',
    userRole: 'System Administrator',
  },
};

export const ManagerHub: Story = {
  args: {
    tabs: managerTabs,
    activeTab: 'ecosystem',
    userName: 'Sarah Manager',
    userRole: 'Regional Manager',
  },
};

export const CustomerHub: Story = {
  args: {
    tabs: customerTabs,
    activeTab: 'orders',
    userName: 'Mike Customer',
    userRole: 'Customer',
  },
};

export const WithIcons: Story = {
  args: {
    tabs: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
        ),
      },
      {
        id: 'orders',
        label: 'Orders',
        badge: 5,
        icon: (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" />
          </svg>
        ),
      },
    ],
    activeTab: 'dashboard',
    userName: 'Test User',
    userRole: 'Customer',
  },
};

export const WithDisabledTab: Story = {
  args: {
    tabs: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'orders', label: 'Orders' },
      { id: 'premium', label: 'Premium Features', disabled: true },
    ],
    activeTab: 'dashboard',
    userName: 'Basic User',
    userRole: 'Customer',
  },
};

export const NoUserInfo: Story = {
  args: {
    tabs: customerTabs,
    activeTab: 'dashboard',
  },
};

export const MinimalTabs: Story = {
  args: {
    tabs: [
      { id: 'home', label: 'Home' },
      { id: 'profile', label: 'Profile' },
    ],
    activeTab: 'home',
    userName: 'Simple User',
  },
};