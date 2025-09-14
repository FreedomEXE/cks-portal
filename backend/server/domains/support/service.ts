import { SupportQuery, SupportTicket, SupportStatus } from './types';
import * as repo from './repository';

export async function list(query: SupportQuery): Promise<SupportTicket[]> {
  const q: SupportQuery = {
    limit: Math.min(Math.max(query.limit || 25, 1), 200),
    page: Math.max(query.page || 1, 1),
    status: query.status,
    priority: query.priority,
  };
  return await repo.listTickets(q);
}

export async function create(subject: string, description: string | undefined, priority: 'low'|'medium'|'high'|'urgent', createdBy: string): Promise<SupportTicket> {
  return await repo.createTicket({ subject, description, priority, created_by: createdBy });
}

export async function updateStatus(ticketId: number, status: SupportStatus): Promise<SupportTicket | null> {
  return await repo.updateTicketStatus(ticketId, status);
}

