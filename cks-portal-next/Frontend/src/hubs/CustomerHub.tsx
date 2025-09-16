/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: CustomerHub.tsx
 *
 * Description:
 * Customer Hub orchestrator component
 *
 * Responsibilities:
 * - Orchestrate customer role hub interface
 * - Manage tab navigation and content rendering
 *
 * Role in system:
 * - Primary interface for customer users
 *
 * Notes:
 * Uses MyHubSection for navigation
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import React, { useState, useEffect } from 'react';
import MyHubSection from '../../../packages/ui/src/navigation/MyHubSection';
import OverviewSection from '../../../packages/domain-widgets/src/overview';
import { RecentActivity, type Activity } from '../../../packages/domain-widgets/src/activity';

export default function CustomerHub() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Add scrollbar styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .hub-content-scroll::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .hub-content-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .hub-content-scroll::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }
      .hub-content-scroll::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Mock activities for customer
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 'act-1',
      message: 'Service request SR-2024-003 submitted',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      type: 'info',
      metadata: { role: 'customer', userId: 'CUS-001', title: 'Request Submitted' }
    },
    {
      id: 'act-2',
      message: 'Service completed at Center CTR-002',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      type: 'success',
      metadata: { role: 'customer', userId: 'CUS-001', title: 'Service Complete' }
    },
    {
      id: 'act-3',
      message: 'Invoice payment received for INV-2024-077',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      type: 'success',
      metadata: { role: 'customer', userId: 'CUS-001', title: 'Payment Received' }
    },
    {
      id: 'act-4',
      message: 'New crew member assigned to your service',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      type: 'info',
      metadata: { role: 'customer', userId: 'CUS-001', title: 'Team Assignment' }
    }
  ]);

    const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/customer/dashboard' },
    { id: 'profile', label: 'My Profile', path: '/customer/profile' },
    { id: 'ecosystem', label: 'My Ecosystem', path: '/customer/ecosystem' },
    { id: 'services', label: 'My Services', path: '/customer/services' },
    { id: 'orders', label: 'Orders', path: '/customer/orders' },
    { id: 'reports', label: 'Reports', path: '/customer/reports' },
    { id: 'support', label: 'Support', path: '/customer/support' }
  ];

  const handleLogout = () => {
    console.log('Customer Hub logout');
    // Implement logout logic
  };

  // Customer-specific overview cards (5 cards)
  const overviewCards = [
    { id: 'services', title: 'Active Services', dataKey: 'serviceCount', color: 'blue', subtitle: 'Services in progress' },
    { id: 'centers', title: 'Active Centers', dataKey: 'centerCount', color: 'yellow', subtitle: 'Centers managed' },
    { id: 'crew', title: 'Active Crew', dataKey: 'crewCount', color: 'orange', subtitle: 'Crew assigned' },
    { id: 'requests', title: 'Pending Requests', dataKey: 'pendingRequests', color: 'red', subtitle: 'Awaiting response' },
    { id: 'status', title: 'Account Status', dataKey: 'accountStatus', color: 'green', subtitle: 'Current status' }
  ];

  // Mock data - replace with actual API data
  const overviewData = {
    serviceCount: 12,
    centerCount: 5,
    crewCount: 8,
    pendingRequests: 3,
    accountStatus: 'Active'
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <MyHubSection
        hubName="Customer Hub"
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={setActiveTab}
        onLogout={handleLogout}
        userId="CUS-001"
        role="customer"
      />

      {/* Content Area */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px',
        scrollbarWidth: 'thin',
        scrollbarColor: '#94a3b8 transparent'
      }} className="hub-content-scroll">
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {activeTab === 'dashboard' ? (
            <>
              <OverviewSection
                cards={overviewCards}
                data={overviewData}
                title="Overview"
              />
              <RecentActivity
                activities={activities}
                onClear={() => setActivities([])}
                title="Recent Activity"
                emptyMessage="No recent customer activity"
              />
            </>
          ) : (
            <>
              <h2>Customer Hub - {activeTab}</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}