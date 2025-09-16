/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: AdminHub.tsx
 *
 * Description:
 * AdminHub.tsx implementation
 *
 * Responsibilities:
 * - Provide AdminHub.tsx functionality
 *
 * Role in system:
 * - Used by CKS Portal system
 *
 * Notes:
 * To be implemented
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import React, { useState, useEffect } from 'react';
import MyHubSection from '../../../packages/ui/src/navigation/MyHubSection';
import OverviewSection from '../../../packages/domain-widgets/src/overview';
import { RecentActivity, type Activity } from '../../../packages/domain-widgets/src/activity';

export default function AdminHub() {
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

  // Mock activities for admin
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 'act-1',
      message: 'New user registered: USR-2024-156',
      timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      type: 'info',
      metadata: { role: 'admin', userId: 'ADM-001', title: 'User Registration' }
    },
    {
      id: 'act-2',
      message: 'System backup completed successfully',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      type: 'success',
      metadata: { role: 'admin', userId: 'ADM-001', title: 'System Maintenance' }
    },
    {
      id: 'act-3',
      message: 'High priority ticket escalated: TKT-2024-089',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      type: 'warning',
      metadata: { role: 'admin', userId: 'ADM-001', title: 'Support Alert' }
    },
    {
      id: 'act-4',
      message: 'Security update applied to all servers',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      type: 'action',
      metadata: { role: 'admin', userId: 'ADM-001', title: 'Security Update' }
    },
    {
      id: 'act-5',
      message: 'Monthly report generated and sent',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      type: 'info',
      metadata: { role: 'admin', userId: 'ADM-001', title: 'Report Generated' }
    }
  ]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
    { id: 'directory', label: 'Directory', path: '/admin/directory' },
    { id: 'create', label: 'Create', path: '/admin/create' },
    { id: 'assign', label: 'Assign', path: '/admin/assign' },
    { id: 'archive', label: 'Archive', path: '/admin/archive' },
    { id: 'support', label: 'Support', path: '/admin/support' },
  ];

  const handleLogout = () => {
    console.log('Admin logout');
    // Implement logout logic
  };

  // Admin-specific overview cards (4 cards)
  const overviewCards = [
    { id: 'users', title: 'Total Users', dataKey: 'userCount', color: 'black', subtitle: 'System users' },
    { id: 'tickets', title: 'Open Support Tickets', dataKey: 'ticketCount', color: 'blue', subtitle: 'Awaiting resolution' },
    { id: 'priority', title: 'High Priority', dataKey: 'highPriorityCount', color: 'red', subtitle: 'Critical issues' },
    { id: 'uptime', title: 'Days Online', dataKey: 'daysOnline', color: 'green', subtitle: 'System uptime' }
  ];

  // Mock data - replace with actual API data
  const overviewData = {
    userCount: 156,
    ticketCount: 23,
    highPriorityCount: 4,
    daysOnline: 247
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <MyHubSection
        hubName="Administrator Hub"
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={setActiveTab}
        onLogout={handleLogout}
        userId="ADM-001"
        role="admin"
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
                emptyMessage="No recent system activity"
              />
            </>
          ) : (
            <>
              <h2>Admin {activeTab} content</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}