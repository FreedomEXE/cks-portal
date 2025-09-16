/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: CenterHub.tsx
 *
 * Description:
 * Center Hub orchestrator component
 *
 * Responsibilities:
 * - Orchestrate center role hub interface
 * - Manage tab navigation and content rendering
 *
 * Role in system:
 * - Primary interface for center users
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

export default function CenterHub() {
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

  // Mock activities for center
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 'act-1',
      message: 'New service scheduled for tomorrow at 9 AM',
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      type: 'info',
      metadata: { role: 'center', userId: 'CEN-001', title: 'Service Scheduled' }
    },
    {
      id: 'act-2',
      message: 'Crew member CRW-003 checked in',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      type: 'success',
      metadata: { role: 'crew', userId: 'CRW-003', title: 'Crew Check-in' }
    },
    {
      id: 'act-3',
      message: 'Equipment maintenance completed',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      type: 'success',
      metadata: { role: 'center', userId: 'CEN-001', title: 'Maintenance Complete' }
    },
    {
      id: 'act-4',
      message: 'Low inventory alert: Cleaning supplies',
      timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000), // 1.5 days ago
      type: 'warning',
      metadata: { role: 'center', userId: 'CEN-001', title: 'Inventory Alert' }
    }
  ]);

    const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/center/dashboard' },
    { id: 'profile', label: 'My Profile', path: '/center/profile' },
    { id: 'ecosystem', label: 'My Ecosystem', path: '/center/ecosystem' },
    { id: 'services', label: 'My Services', path: '/center/services' },
    { id: 'orders', label: 'Orders', path: '/center/orders' },
    { id: 'reports', label: 'Reports', path: '/center/reports' },
    { id: 'support', label: 'Support', path: '/center/support' }
  ];

  const handleLogout = () => {
    console.log('Center Hub logout');
    // Implement logout logic
  };

  // Center-specific overview cards (4 cards)
  const overviewCards = [
    { id: 'services', title: 'Active Services', dataKey: 'serviceCount', color: 'blue', subtitle: 'Services running' },
    { id: 'crew', title: 'Active Crew', dataKey: 'crewCount', color: 'orange', subtitle: 'Crew on site' },
    { id: 'orders', title: 'Pending Orders', dataKey: 'pendingOrders', color: 'red', subtitle: 'Orders to complete' },
    { id: 'status', title: 'Account Status', dataKey: 'accountStatus', color: 'green', subtitle: 'Current status' }
  ];

  // Mock data - replace with actual API data
  const overviewData = {
    serviceCount: 8,
    crewCount: 6,
    pendingOrders: 4,
    accountStatus: 'Active'
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <MyHubSection
        hubName="Center Hub"
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={setActiveTab}
        onLogout={handleLogout}
        userId="CEN-001"
        role="center"
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
                emptyMessage="No recent center activity"
              />
            </>
          ) : (
            <>
              <h2>Center Hub - {activeTab}</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}