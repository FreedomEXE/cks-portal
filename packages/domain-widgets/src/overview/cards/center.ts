import type { CardConfig } from '../OverviewSection';

export const centerOverviewCards: CardConfig[] = [
  { id: 'active-services', title: 'Active Services', dataKey: 'activeServices', color: 'green' },
  { id: 'active-crew', title: 'Active Crew', dataKey: 'activeCrew', color: 'red' },
  { id: 'pending-orders', title: 'Pending Orders', dataKey: 'pendingOrders', color: 'blue' },
  { id: 'account-status', title: 'Account Status', dataKey: 'accountStatus', color: 'orange' },
];

