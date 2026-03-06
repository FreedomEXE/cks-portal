/*-----------------------------------------------
  Property of Freedom_EXE  (c) 2026
-----------------------------------------------*/

import useSWR from 'swr';
import { apiFetch, type ApiResponse } from '../shared/api/client';

export interface SupportTicketComment {
  commentId: number;
  ticketId: string;
  authorId: string;
  authorRole: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
}

export interface NormalizedSupportTicket {
  id: string;
  ticketId: string;
  issueType: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  subject: string;
  description: string;
  stepsToReproduce: string | null;
  screenshotUrl: string | null;
  status: 'open' | 'in_progress' | 'waiting_on_user' | 'escalated' | 'resolved' | 'closed' | 'cancelled';
  createdById: string;
  createdByRole: string;
  assignedTo: string | null;
  submittedDate: string;
  updatedDate: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  actionTaken: string | null;
  reopenedCount: number;
  commentCount: number;
  cksManager: string | null;
  comments: SupportTicketComment[];
}

export interface UseTicketDetailsParams {
  ticketId: string | null;
}

function normalizeTicket(raw: any): NormalizedSupportTicket {
  return {
    id: raw?.id || '',
    ticketId: raw?.id || '',
    issueType: raw?.issueType || 'general_question',
    priority: raw?.priority || 'MEDIUM',
    subject: raw?.subject || '',
    description: raw?.description || '',
    stepsToReproduce: raw?.stepsToReproduce ?? null,
    screenshotUrl: raw?.screenshotUrl ?? null,
    status: raw?.status || 'open',
    createdById: raw?.submittedBy || '',
    createdByRole: raw?.submittedRole || 'unknown',
    assignedTo: raw?.assignedTo ?? null,
    submittedDate: raw?.submittedDate || '',
    updatedDate: raw?.updatedDate || '',
    resolvedBy: raw?.resolvedBy ?? null,
    resolvedAt: raw?.resolvedAt ?? null,
    resolutionNotes: raw?.resolutionNotes ?? null,
    actionTaken: raw?.actionTaken ?? null,
    reopenedCount: Number(raw?.reopenedCount || 0),
    commentCount: Number(raw?.commentCount || 0),
    cksManager: raw?.cksManager ?? null,
    comments: Array.isArray(raw?.comments) ? raw.comments : [],
  };
}

export function useTicketDetails(params: UseTicketDetailsParams) {
  const { ticketId } = params;
  const swrKey = ticketId ? `/support/tickets/${encodeURIComponent(ticketId)}/details` : null;

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<any>>(
    swrKey,
    (url) => apiFetch<ApiResponse<any>>(url),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const ticket = data?.data ? normalizeTicket(data.data) : null;

  return {
    ticket,
    isLoading,
    error: error || null,
    refresh: () => mutate?.(),
  };
}

