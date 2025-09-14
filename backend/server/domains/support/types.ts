export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type SupportPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportTicket {
  ticket_id: number;
  subject: string;
  description?: string | null;
  status: SupportStatus;
  priority: SupportPriority;
  created_by: string;
  assigned_to?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface SupportQuery {
  status?: SupportStatus;
  priority?: SupportPriority;
  limit?: number;
  page?: number;
}

export interface SupportRouteConfig {
  capabilities: {
    view: string;
    create?: string;
    update?: string;
    resolve?: string;
  };
  features: {
    tickets: boolean;
    knowledge?: boolean;
    escalation?: boolean;
    analytics?: boolean;
  };
  scope: 'global' | 'ecosystem' | 'entity';
  roleCode: string;
}

