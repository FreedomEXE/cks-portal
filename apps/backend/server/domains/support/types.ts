/*-----------------------------------------------
  Property of Freedom_EXE  (c) 2026
-----------------------------------------------*/

export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_on_user'
  | 'escalated'
  | 'resolved'
  | 'closed'
  | 'cancelled';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SupportTicket {
  ticketId: string;
  issueType: string;
  priority: TicketPriority;
  subject: string;
  description: string;
  stepsToReproduce: string | null;
  screenshotUrl: string | null;
  status: TicketStatus;
  createdById: string;
  createdByRole: string;
  cksManager: string | null;
  assignedTo: string | null;
  resolutionNotes: string | null;
  actionTaken: string | null;
  resolvedById: string | null;
  resolvedAt: string | null;
  reopenedCount: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface SupportTicketComment {
  commentId: number;
  ticketId: string;
  authorId: string;
  authorRole: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
}

export interface CreateSupportTicketInput {
  issueType: string;
  priority: TicketPriority;
  subject: string;
  description: string;
  stepsToReproduce?: string | null;
  screenshotUrl?: string | null;
  createdByRole: string;
  createdById: string;
}

export interface HubSupportTicketItem {
  id: string;
  issueType: string;
  priority: TicketPriority;
  subject: string;
  description: string;
  stepsToReproduce: string | null;
  screenshotUrl: string | null;
  status: TicketStatus;
  submittedBy: string;
  submittedRole: string;
  assignedTo: string | null;
  submittedDate: string;
  updatedDate: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  actionTaken: string | null;
  reopenedCount: number;
  commentCount: number;
}

export interface HubSupportTicketsPayload {
  role: string;
  cksCode: string;
  tickets: HubSupportTicketItem[];
}

export interface SupportTicketDetails extends HubSupportTicketItem {
  cksManager: string | null;
  comments: SupportTicketComment[];
}

export interface UpdateTicketStatusInput {
  status: TicketStatus;
  notes?: string;
  actionTaken?: string;
  actorId: string;
}

export interface AssignTicketInput {
  assigneeId: string;
  actorId: string;
}

export interface AddTicketCommentInput {
  body: string;
  isInternal?: boolean;
  authorId: string;
  authorRole: string;
}

export interface ReopenTicketInput {
  actorId: string;
  reason?: string;
}
