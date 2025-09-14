export interface ArchiveRouteConfig {
  capabilities: {
    view: string;
    restore?: string;
  };
  features: {
    orders?: boolean;
  };
  scope: 'global' | 'ecosystem' | 'entity';
  roleCode: string;
}

export interface ArchivedOrder {
  order_id: number;
  status: 'archived';
  customer_id?: string | null;
  contractor_id?: string | null;
  total_amount?: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

