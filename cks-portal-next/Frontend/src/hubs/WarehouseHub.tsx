/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: WarehouseHub.tsx
 *
 * Description:
 * Warehouse Hub orchestrator component
 *
 * Responsibilities:
 * - Orchestrate warehouse role hub interface
 * - Manage tab navigation and content rendering
 *
 * Role in system:
 * - Primary interface for warehouse users
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

interface WarehouseHubProps {
  initialTab?: string;
}

export default function WarehouseHub({ initialTab = 'dashboard' }: WarehouseHubProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

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

  // Mock activities for warehouse
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 'act-1',
      message: 'New shipment received: 500 units of product SKU-123',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      type: 'success',
      metadata: { role: 'warehouse', userId: 'WHS-001', title: 'Shipment Received' }
    },
    {
      id: 'act-2',
      message: 'Low stock alert: Product SKU-456 below threshold',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      type: 'warning',
      metadata: { role: 'warehouse', userId: 'WHS-001', title: 'Stock Alert' }
    },
    {
      id: 'act-3',
      message: 'Order WO-2024-089 prepared for delivery',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      type: 'info',
      metadata: { role: 'warehouse', userId: 'WHS-001', title: 'Order Prepared' }
    },
    {
      id: 'act-4',
      message: 'Inventory audit completed for Section A',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      type: 'success',
      metadata: { role: 'warehouse', userId: 'WHS-001', title: 'Audit Complete' }
    },
    {
      id: 'act-5',
      message: 'Restocking order placed for 10 items',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      type: 'action',
      metadata: { role: 'warehouse', userId: 'WHS-001', title: 'Restock Ordered' }
    }
  ]);

    const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/warehouse/dashboard' },
    { id: 'profile', label: 'My Profile', path: '/warehouse/profile' },
    { id: 'services', label: 'My Services', path: '/warehouse/services' },
    { id: 'inventory', label: 'Inventory', path: '/warehouse/inventory' },
    { id: 'orders', label: 'Orders', path: '/warehouse/orders' },
    { id: 'deliveries', label: 'Deliveries', path: '/warehouse/deliveries' },
    { id: 'reports', label: 'Reports', path: '/warehouse/reports' },
    { id: 'support', label: 'Support', path: '/warehouse/support' }
  ];

  const handleLogout = () => {
    console.log('Warehouse Hub logout');
    // Implement logout logic
  };

  // Warehouse-specific overview cards (5 cards)
  const overviewCards = [
    { id: 'products', title: 'Product Count', dataKey: 'productCount', color: 'purple' },
    { id: 'lowstock', title: 'Low Stock', dataKey: 'lowStockCount', color: 'red' },
    { id: 'orders', title: 'Pending Orders', dataKey: 'pendingOrders', color: 'orange' },
    { id: 'deliveries', title: 'Pending Deliveries', dataKey: 'pendingDeliveries', color: 'blue' },
    { id: 'status', title: 'Account Status', dataKey: 'accountStatus', color: 'green' }
  ];

  // Mock data - replace with actual API data
  const overviewData = {
    productCount: '2,456',
    lowStockCount: 23,
    pendingOrders: 34,
    pendingDeliveries: 12,
    accountStatus: 'Active'
  };

  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <MyHubSection
        hubName="Warehouse Hub"
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={setActiveTab}
        onLogout={handleLogout}
        userId="WHS-001"
        role="warehouse"
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
                emptyMessage="No recent warehouse activity"
              />

              {/* Communication Hub */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <NewsPreview onViewAll={() => console.log('View all news')} />
                <MemosPreview onViewAll={() => console.log('View memos')} />
              </div>
            </>
          ) : activeTab === 'profile' ? (
            <ProfileInfoCard
              role="warehouse"
              profileData={{
                name: 'Central Distribution Warehouse',
                warehouseId: 'WHS-001',
                address: '999 Logistics Parkway, Dallas, TX 75201',
                phone: '(555) 012-3456',
                email: 'central@cks-warehouse.com',
                territory: 'Central Region',
                mainContact: 'Kevin Thompson',
                startDate: '2017-09-12'
              }}
              accountManager={{
                name: 'Jennifer Brown',
                id: 'MGR-006',
                email: 'jennifer.brown@cks.com',
                phone: '(555) 123-4567'
              }}
              primaryColor="#8b5cf6"
              onUpdatePhoto={() => console.log('Update photo')}
              onContactManager={() => console.log('Contact manager')}
              onScheduleMeeting={() => console.log('Schedule meeting')}
            />
          ) : (
            <>
              <h2>Warehouse Hub - {activeTab}</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </>
          )}
        </div>
      </Scrollbar>
    </div>
  );
}
