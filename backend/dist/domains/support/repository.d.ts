import { SupportQuery, SupportTicket, SupportStatus } from './types';
export declare function listTickets(query: SupportQuery): Promise<SupportTicket[]>;
export declare function createTicket(input: Pick<SupportTicket, 'subject' | 'description' | 'priority' | 'created_by'>): Promise<SupportTicket>;
export declare function updateTicketStatus(ticketId: number, status: SupportStatus): Promise<SupportTicket | null>;
//# sourceMappingURL=repository.d.ts.map