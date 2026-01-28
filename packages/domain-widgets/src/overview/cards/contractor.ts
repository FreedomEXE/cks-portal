import type { CardConfig } from '../OverviewSection';

export const contractorOverviewCards: CardConfig[] = [
  { id: 'active-services', title: 'Active Services', dataKey: 'activeServices', color: 'purple' },
  { id: 'my-customers', title: 'My Customers', dataKey: 'myCustomers', color: 'yellow' },
  { id: 'pending-orders', title: 'Pending Orders', dataKey: 'pendingOrders', color: 'blue' },
  { id: 'account-status', title: 'Account Status', dataKey: 'accountStatus', color: 'green' },
];
