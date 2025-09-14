export type Timeframe = 'week' | 'month' | 'quarter' | 'year';

export interface ReportsRouteConfig {
  capabilities: {
    view: string;
    create?: string;
    export?: string;
  };
  features: {
    performance?: boolean;
    financial?: boolean;
    operational?: boolean;
    custom?: boolean;
    scheduling?: boolean;
  };
  scope: 'global' | 'ecosystem' | 'entity';
  roleCode: string;
}

export interface OrderStatusCount {
  status: string;
  count: number;
}

export interface RevenuePoint {
  period: string; // YYYY-MM
  revenue: number; // total_amount sum
}

