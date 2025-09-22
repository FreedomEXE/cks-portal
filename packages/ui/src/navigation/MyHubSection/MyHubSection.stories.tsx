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
import MyHubSection, { Tab as TabConfig } from './MyHubSection';

const meta: Meta<typeof MyHubSection> = {
  title: 'Navigation/MyHubSection',
  component: MyHubSection,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    onTabClick: { action: 'tab-clicked' },
    onLogout: { action: 'logout-clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const adminTabs: TabConfig[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
  { id: 'users', label: 'Users', path: '/admin/users' },
  { id: 'system', label: 'System', path: '/admin/system' },
  { id: 'audit', label: 'Audit Logs', path: '/admin/audit' },
];

const managerTabs: TabConfig[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/manager/dashboard' },
  { id: 'ecosystem', label: 'My Ecosystem', path: '/manager/ecosystem' },
  { id: 'performance', label: 'Performance', path: '/manager/performance' },
  { id: 'certification', label: 'Certification', path: '/manager/certification' },
];

const customerTabs: TabConfig[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/customer/dashboard' },
  { id: 'orders', label: 'Orders', path: '/customer/orders' },
  { id: 'services', label: 'Services', path: '/customer/services' },
  { id: 'support', label: 'Support', path: '/customer/support' },
  { id: 'profile', label: 'Profile', path: '/customer/profile' },
];

export const AdminHub: Story = {
  args: {
    hubName: 'Admin Hub',
    tabs: adminTabs,
    activeTab: 'dashboard',
    userId: 'John Admin',
    role: 'admin',
  },
};

export const ManagerHub: Story = {
  args: {
    hubName: 'Manager Hub',
    tabs: managerTabs,
    activeTab: 'ecosystem',
    userId: 'Sarah Manager',
    role: 'manager',
  },
};

export const CustomerHub: Story = {
  args: {
    hubName: 'Customer Hub',
    tabs: customerTabs,
    activeTab: 'orders',
    userId: 'Mike Customer',
    role: 'customer',
  },
};

export const WithIcons: Story = {
  args: {
    hubName: 'Icon Hub',
    tabs: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: '📊',
      },
      {
        id: 'orders',
        label: 'Orders',
        path: '/orders',
        icon: '📦',
      },
    ],
    activeTab: 'dashboard',
    userId: 'Test User',
    role: 'customer',
  },
};

export const WithDisabledTab: Story = {
  args: {
    hubName: 'Basic Hub',
    tabs: [
      { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
      { id: 'orders', label: 'Orders', path: '/orders' },
      { id: 'premium', label: 'Premium Features', path: '/premium' },
    ],
    activeTab: 'dashboard',
    userId: 'Basic User',
    role: 'customer',
  },
};

export const NoUserInfo: Story = {
  args: {
    hubName: 'Anonymous Hub',
    tabs: customerTabs,
    activeTab: 'dashboard',
  },
};

export const MinimalTabs: Story = {
  args: {
    hubName: 'Simple Hub',
    tabs: [
      { id: 'home', label: 'Home', path: '/home' },
      { id: 'profile', label: 'Profile', path: '/profile' },
    ],
    activeTab: 'home',
    userId: 'Simple User',
    role: 'customer',
  },
};