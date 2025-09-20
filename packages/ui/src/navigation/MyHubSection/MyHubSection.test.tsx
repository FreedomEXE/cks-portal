/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: MyHubSection.test.tsx
 *
 * Description:
 * Unit tests for MyHubSection component
 *
 * Responsibilities:
 * - Test component rendering and behavior
 * - Verify accessibility and user interactions
 *
 * Role in system:
 * - Used by Jest to ensure component quality
 *
 * Notes:
 * Covers edge cases and accessibility requirements
 */
/*───────────────────────────────────────────────*/
//  Manifested by Freedom_EXE
/*───────────────────────────────────────────────*/

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MyHubSection, TabConfig } from './MyHubSection';

const mockTabs: TabConfig[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'orders', label: 'Orders', badge: 5 },
  { id: 'settings', label: 'Settings', disabled: true },
];

const defaultProps = {
  tabs: mockTabs,
  activeTab: 'dashboard',
  onTabChange: jest.fn(),
  onLogout: jest.fn(),
};

describe('MyHubSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with basic props', () => {
    render(<MyHubSection {...defaultProps} />);

    expect(screen.getByText('CKS Portal')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders all tabs', () => {
    render(<MyHubSection {...defaultProps} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows badge for tabs that have badges', () => {
    render(<MyHubSection {...defaultProps} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onTabChange when a tab is clicked', () => {
    const onTabChange = jest.fn();
    render(<MyHubSection {...defaultProps} onTabChange={onTabChange} />);

    fireEvent.click(screen.getByText('Orders'));
    expect(onTabChange).toHaveBeenCalledWith('orders');
  });

  it('does not call onTabChange for disabled tabs', () => {
    const onTabChange = jest.fn();
    render(<MyHubSection {...defaultProps} onTabChange={onTabChange} />);

    fireEvent.click(screen.getByText('Settings'));
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it('calls onLogout when logout button is clicked', () => {
    const onLogout = jest.fn();
    render(<MyHubSection {...defaultProps} onLogout={onLogout} />);

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(onLogout).toHaveBeenCalled();
  });

  it('displays user information when provided', () => {
    render(
      <MyHubSection
        {...defaultProps}
        userName="John Doe"
        userRole="Administrator"
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });

  it('does not display user information when not provided', () => {
    render(<MyHubSection {...defaultProps} />);

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('applies active styles to the current tab', () => {
    render(<MyHubSection {...defaultProps} activeTab="orders" />);

    const activeTab = screen.getByText('Orders').closest('button');
    expect(activeTab).toHaveClass('border-blue-500', 'text-blue-600');
  });

  it('applies disabled styles to disabled tabs', () => {
    render(<MyHubSection {...defaultProps} />);

    const disabledTab = screen.getByText('Settings').closest('button');
    expect(disabledTab).toHaveAttribute('disabled');
    expect(disabledTab).toHaveClass('cursor-not-allowed', 'text-gray-300');
  });

  it('has proper accessibility attributes', () => {
    render(<MyHubSection {...defaultProps} />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');

    const activeTab = screen.getByText('Dashboard').closest('button');
    expect(activeTab).toHaveAttribute('aria-current', 'page');

    const logoutButton = screen.getByRole('button', { name: /sign out/i });
    expect(logoutButton).toHaveAttribute('aria-label', 'Sign out');
  });

  it('renders with custom className', () => {
    render(<MyHubSection {...defaultProps} className="custom-class" />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('custom-class');
  });

  it('renders icons when provided', () => {
    const tabsWithIcons: TabConfig[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <span data-testid="dashboard-icon">📊</span>,
      },
    ];

    render(
      <MyHubSection
        {...defaultProps}
        tabs={tabsWithIcons}
        activeTab="dashboard"
      />
    );

    expect(screen.getByTestId('dashboard-icon')).toBeInTheDocument();
  });
});