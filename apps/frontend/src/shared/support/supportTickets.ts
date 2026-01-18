import type { HubReportsResponse, HubReportItem } from '../api/hub';
import type { SupportTicket, SupportTicketFormPayload } from '@cks/domain-widgets';

type TicketStatus = 'Open' | 'In Progress' | 'Resolved';

function formatSupportDate(value?: string | null): string {
  if (!value) {
    return 'N/A';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function mapSupportStatus(status?: string | null): TicketStatus {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'closed' || normalized === 'resolved') {
    return 'Resolved';
  }
  if (normalized === 'in-progress' || normalized === 'in_progress') {
    return 'In Progress';
  }
  return 'Open';
}

function mapIssueType(item: HubReportItem): string {
  const category = item.category?.trim();
  if (category) {
    return category;
  }
  return item.type === 'feedback' ? 'Feature Request' : 'Support Request';
}

export function buildSupportTickets(reportsData?: HubReportsResponse | null): SupportTicket[] {
  if (!reportsData) {
    return [];
  }

  const items = [...(reportsData.reports ?? []), ...(reportsData.feedback ?? [])];
  return items.map((item) => ({
    ticketId: item.id,
    subject: item.title || 'Untitled',
    issueType: mapIssueType(item),
    priority: 'Medium',
    status: mapSupportStatus(item.status),
    dateCreated: formatSupportDate(item.submittedDate),
    lastUpdated: formatSupportDate(item.submittedDate),
  }));
}

export function mapSupportIssuePayload(payload: SupportTicketFormPayload): {
  type: 'report' | 'feedback';
  category: string;
  title: string;
  description: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
} {
  const issueType = payload.issueType.trim();
  const description = payload.stepsToReproduce
    ? `${payload.description}\n\nSteps to reproduce:\n${payload.stepsToReproduce}`
    : payload.description;

  if (issueType === 'Feature Request') {
    return {
      type: 'feedback',
      category: 'System Enhancement',
      title: payload.subject.trim(),
      description,
    };
  }

  let category = 'Other';
  if (issueType === 'Bug Report' || issueType === 'Technical Support') {
    category = 'System Bug';
  } else if (issueType === 'Account Issue') {
    category = 'Other';
  } else if (issueType === 'General Question') {
    category = 'Other';
  }

  const priorityValue = payload.priority.toUpperCase();
  const priority = priorityValue === 'LOW' || priorityValue === 'HIGH' ? priorityValue : 'MEDIUM';

  return {
    type: 'report',
    category,
    title: payload.subject.trim(),
    description,
    priority,
  };
}
