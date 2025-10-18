import type { CardConfig } from '../OverviewSection';

export const adminOverviewCards: CardConfig[] = [
  { id: 'users', title: 'Total Users', dataKey: 'userCount', color: 'blue' },
  { id: 'tickets', title: 'Open Support Tickets', dataKey: 'ticketCount', color: 'orange' },
  { id: 'priority', title: 'High Priority', dataKey: 'highPriorityCount', color: 'red' },
  { id: 'days', title: 'Days Online', dataKey: 'daysOnline', color: 'green' },
];
