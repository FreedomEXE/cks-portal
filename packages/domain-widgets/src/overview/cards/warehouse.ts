import type { CardConfig } from '../OverviewSection';

export const warehouseOverviewCards: CardConfig[] = [
  { id: 'active-services', title: 'Active Services', dataKey: 'activeServices', color: 'purple' },
  { id: 'inventory', title: 'Inventory', dataKey: 'inventoryCount', color: 'purple' },
  { id: 'low-stock', title: 'Low Stock', dataKey: 'lowStockItems', color: 'red' },
  { id: 'pending-orders', title: 'Pending Orders', dataKey: 'pendingOrders', color: 'blue' },
  { id: 'account-status', title: 'Account Status', dataKey: 'accountStatus', color: 'green' },
];
