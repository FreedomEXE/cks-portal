/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: ContractorHub.tsx
 *
 * Description:
 * Contractor Hub orchestrator component
 *
 * Responsibilities:
 * - Orchestrate contractor role hub interface
 * - Manage tab navigation and content rendering
 *
 * Role in system:
 * - Primary interface for contractor users
 *
 * Notes:
 * Uses MyHubSection for navigation
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import React, { useState, useEffect } from 'react';
import { Scrollbar } from '../../../packages/ui/src/Scrollbar';
import MyHubSection from '../../../packages/ui/src/navigation/MyHubSection';
import OverviewSection from '../../../packages/domain-widgets/src/overview';
import { RecentActivity, type Activity } from '../../../packages/domain-widgets/src/activity';
import { NewsPreview } from '../../../packages/domain-widgets/src/news';
import { MemosPreview } from '../../../packages/domain-widgets/src/memos';
import { ProfileInfoCard } from '../../../packages/domain-widgets/src/profile';

export default function ContractorHub() {
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

  // Mock activities for contractor
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 'act-1',
      message: 'New service request assigned: SR-2024-002',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      type: 'action',
      metadata: { role: 'contractor', userId: 'CON-001', title: 'New Assignment' }
    },
    {
      id: 'act-2',
      message: 'Completed service for Customer CUS-003',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      type: 'success',
      metadata: { role: 'contractor', userId: 'CON-001', title: 'Job Completed' }
    },
    {
      id: 'act-3',
      message: 'Crew member CRW-005 joined your team',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      type: 'info',
      metadata: { role: 'crew', userId: 'CRW-005', title: 'Team Update' }
    },
    {
      id: 'act-4',
      message: 'Invoice INV-2024-089 approved',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      type: 'success',
      metadata: { role: 'contractor', userId: 'CON-001', title: 'Payment Update' }
    },
    {
      id: 'act-5',
      message: 'Equipment maintenance scheduled for next week',
      timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000), // 3 days ago
      type: 'warning',
      metadata: { role: 'contractor', userId: 'CON-001', title: 'Maintenance Alert' }
    }
  ]);

    const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/contractor/dashboard' },
    { id: 'profile', label: 'My Profile', path: '/contractor/profile' },
    { id: 'ecosystem', label: 'My Ecosystem', path: '/contractor/ecosystem' },
    { id: 'services', label: 'My Services', path: '/contractor/services' },
    { id: 'orders', label: 'Orders', path: '/contractor/orders' },
    { id: 'reports', label: 'Reports', path: '/contractor/reports' },
    { id: 'support', label: 'Support', path: '/contractor/support' }
  ];

  const handleLogout = () => {
    console.log('Contractor Hub logout');
    // Implement logout logic
  };

  // Contractor-specific overview cards (6 cards)
  const overviewCards = [
    { id: 'services', title: 'Active Services', dataKey: 'serviceCount', color: 'blue' },
    { id: 'customers', title: 'Active Customers', dataKey: 'customerCount', color: 'green' },
    { id: 'centers', title: 'Active Centers', dataKey: 'centerCount', color: 'purple' },
    { id: 'crew', title: 'Active Crew', dataKey: 'crewCount', color: 'orange' },
    { id: 'orders', title: 'Pending Orders', dataKey: 'pendingOrders', color: 'red' },
    { id: 'status', title: 'Account Status', dataKey: 'accountStatus', color: 'green' }
  ];

  // Mock data - replace with actual API data
  const overviewData = {
    serviceCount: 8,
    customerCount: 15,
    centerCount: 6,
    crewCount: 12,
    pendingOrders: 5,
    accountStatus: 'Active'
  };

  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <MyHubSection
        hubName="Contractor Hub"
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={setActiveTab}
        onLogout={handleLogout}
        userId="CON-001"
        role="contractor"
      />

      {/* Content Area */}
      <Scrollbar style={{
        flex: 1,
        padding: '24px'
      }}>
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
                emptyMessage="No recent contractor activity"
              />

              {/* Communication Hub */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <NewsPreview color="#10b981" onViewAll={() => console.log('View all news')} />
                <MemosPreview color="#10b981" onViewAll={() => console.log('View memos')} />
              </div>
            </>
          ) : activeTab === 'profile' ? (
            <ProfileInfoCard
              role="contractor"
              profileData={{
                name: 'ABC Contracting Services',
                contractorId: 'CON-001',
                address: '456 Industrial Blvd, Denver, CO 80202',
                phone: '(555) 234-5678',
                email: 'contact@abccontracting.com',
                website: 'www.abccontracting.com',
                mainContact: 'Michael Johnson',
                startDate: '2020-03-20'
              }}
              accountManager={{
                name: 'Sarah Williams',
                id: 'MGR-002',
                email: 'sarah.williams@cks.com',
                phone: '(555) 345-6789'
              }}
              primaryColor="#10b981"
              onUpdatePhoto={() => console.log('Update photo')}
              onContactManager={() => console.log('Contact manager')}
              onScheduleMeeting={() => console.log('Schedule meeting')}
            />
          ) : (
            <>
              <h2>Contractor Hub - {activeTab}</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </>
          )}
        </div>
      </Scrollbar>
    </div>
  );
}
