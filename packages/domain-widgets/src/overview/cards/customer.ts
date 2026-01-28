import type { CardConfig } from '../OverviewSection';

export const customerOverviewCards: CardConfig[] = [
  { id: 'active-services', title: 'Active Services', dataKey: 'activeServices', color: 'green' },
  { id: 'my-centers', title: 'My Centers', dataKey: 'myCenters', color: 'orange' },
  { id: 'pending-orders', title: 'Pending Orders', dataKey: 'pendingOrders', color: 'blue' },
  { id: 'account-status', title: 'Account Status', dataKey: 'accountStatus', color: 'green' },
];
