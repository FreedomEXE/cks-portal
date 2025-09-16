/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: ManagerHub.tsx
 *
 * Description:
 * Manager Hub orchestrator component
 *
 * Responsibilities:
 * - Orchestrate manager role hub interface
 * - Manage tab navigation and content rendering
 *
 * Role in system:
 * - Primary interface for manager users
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

export default function ManagerHub() {
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

  // Mock activities for manager - showing activities from various roles
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 'act-1',
      message: 'System maintenance scheduled for this weekend',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      type: 'warning',
      metadata: { role: 'admin', userId: 'ADM-001', title: 'Admin Notice' }
    },
    {
      id: 'act-2',
      message: 'Assigned CON-001 to new project',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      type: 'action',
      metadata: { role: 'manager', userId: 'MGR-001', title: 'Manager Action' }
    },
    {
      id: 'act-3',
      message: 'New Contractor Created: CON-002 (Network Solutions)',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      type: 'success',
      metadata: { role: 'contractor', userId: 'CON-002', title: 'Contractor Update' }
    },
    {
      id: 'act-4',
      message: 'Service request SR-2024-055 submitted for review',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      type: 'info',
      metadata: { role: 'customer', userId: 'CUS-005', title: 'Customer Request' }
    },
    {
      id: 'act-5',
      message: 'Equipment check-in completed at Center CTR-003',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      type: 'success',
      metadata: { role: 'center', userId: 'CEN-003', title: 'Center Activity' }
    },
    {
      id: 'act-6',
      message: 'Crew member CRW-007 completed safety training',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      type: 'success',
      metadata: { role: 'crew', userId: 'CRW-007', title: 'Crew Update' }
    },
    {
      id: 'act-7',
      message: 'Low inventory alert: Parts needed for upcoming jobs',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      type: 'warning',
      metadata: { role: 'warehouse', userId: 'WHS-001', title: 'Warehouse Alert' }
    },
    {
      id: 'act-8',
      message: 'Weekly report generated and available for review',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      type: 'info',
      metadata: { role: 'system', userId: 'SYSTEM', title: 'System Report' }
    }
  ]);

    const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/manager/dashboard' },
    { id: 'profile', label: 'My Profile', path: '/manager/profile' },
    { id: 'ecosystem', label: 'My Ecosystem', path: '/manager/ecosystem' },
    { id: 'services', label: 'My Services', path: '/manager/services' },
    { id: 'orders', label: 'Orders', path: '/manager/orders' },
    { id: 'reports', label: 'Reports', path: '/manager/reports' },
    { id: 'support', label: 'Support', path: '/manager/support' }
  ];

  const handleLogout = () => {
    console.log('Manager Hub logout');
    // Implement logout logic
  };

  // Manager-specific overview cards (6 cards)
  const overviewCards = [
    { id: 'contractors', title: 'My Contractors', dataKey: 'contractorCount', color: 'blue', subtitle: 'Total contractors managed' },
    { id: 'customers', title: 'My Customers', dataKey: 'customerCount', color: 'green', subtitle: 'Total customers served' },
    { id: 'centers', title: 'My Centers', dataKey: 'centerCount', color: 'purple', subtitle: 'Service centers managed' },
    { id: 'crew', title: 'My Crew', dataKey: 'crewCount', color: 'orange', subtitle: 'Total crew members' },
    { id: 'orders', title: 'Pending Orders', dataKey: 'pendingOrders', color: 'red', subtitle: 'Orders requiring attention' },
    { id: 'status', title: 'Account Status', dataKey: 'accountStatus', color: 'green', subtitle: 'Current account status' }
  ];

  // Mock data - replace with actual API data
  const overviewData = {
    contractorCount: 3,
    customerCount: 12,
    centerCount: 4,
    crewCount: 8,
    pendingOrders: 7,
    accountStatus: 'Active'
  };


  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <MyHubSection
        hubName="Manager Hub"
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={setActiveTab}
        onLogout={handleLogout}
        userId="MGR-001"
        role="manager"
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
                emptyMessage="No recent manager activity"
              />
            </>
          ) : (
            <>
              <h2>Manager Hub - {activeTab}</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}