import { SupportQuery, SupportTicket, SupportStatus } from './types';
export declare function list(query: SupportQuery): Promise<SupportTicket[]>;
export declare function create(subject: string, description: string | undefined, priority: 'low' | 'medium' | 'high' | 'urgent', createdBy: string): Promise<SupportTicket>;
export declare function updateStatus(ticketId: number, status: SupportStatus): Promise<SupportTicket | null>;
//# sourceMappingURL=service.d.ts.map