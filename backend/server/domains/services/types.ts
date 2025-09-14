export interface ServiceEntity {
  service_id: number;
  service_name: string;
  description?: string | null;
  category_id?: number | null;
  unit?: string | null;
  price?: number | null;
  status?: 'active' | 'inactive' | 'discontinued';
  archived?: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ServicesQuery {
  q?: string;
  category?: string;
  status?: 'active' | 'inactive' | 'discontinued';
  limit?: number;
  offset?: number;
}

export interface ServicesRouteConfig {
  capabilities: {
    view: string;
    create?: string;
    update?: string;
    approve?: string;
    admin?: string;
  };
  features: {
    catalog: boolean;
    pricing?: boolean;
    approval?: boolean;
    templates?: boolean;
  };
  scope: 'global' | 'ecosystem';
  roleCode: string;
}

