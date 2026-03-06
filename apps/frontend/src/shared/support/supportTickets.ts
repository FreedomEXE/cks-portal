import { uploadSupportScreenshot, type HubSupportTicketsResponse } from '../api/hub';
import type { SupportTicket, SupportTicketFormPayload } from '@cks/domain-widgets';

type TicketStatus = 'Open' | 'In Progress' | 'Waiting On User' | 'Escalated' | 'Resolved' | 'Closed' | 'Cancelled';

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
  if (normalized === 'resolved') {
    return 'Resolved';
  }
  if (normalized === 'closed') {
    return 'Closed';
  }
  if (normalized === 'cancelled') {
    return 'Cancelled';
  }
  if (normalized === 'escalated') {
    return 'Escalated';
  }
  if (normalized === 'waiting_on_user' || normalized === 'waiting-on-user') {
    return 'Waiting On User';
  }
  if (normalized === 'in-progress' || normalized === 'in_progress') {
    return 'In Progress';
  }
  return 'Open';
}

function formatIssueType(value?: string | null): string {
  const normalized = (value || '').trim().replace(/_/g, ' ');
  if (!normalized) return 'Support Request';
  return normalized
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
}

export function buildSupportTickets(supportData?: HubSupportTicketsResponse | null): SupportTicket[] {
  if (!supportData) {
    return [];
  }

  return (supportData.tickets ?? []).map((item) => ({
    ticketId: item.id,
    subject: item.subject || 'Untitled',
    issueType: formatIssueType(item.issueType),
    priority: (item.priority || 'MEDIUM').charAt(0) + (item.priority || 'MEDIUM').slice(1).toLowerCase(),
    status: mapSupportStatus(item.status),
    statusCode: item.status,
    submittedBy: item.submittedBy,
    assignedTo: item.assignedTo || null,
    commentCount: Number(item.commentCount || 0),
    resolvedAt: item.resolvedAt || null,
    dateCreated: formatSupportDate(item.submittedDate),
    lastUpdated: formatSupportDate(item.updatedDate || item.submittedDate),
  }));
}

const MAX_SUPPORT_SCREENSHOT_BYTES = 5 * 1024 * 1024;

export async function mapSupportIssuePayload(payload: SupportTicketFormPayload): Promise<{
  issueType: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  subject: string;
  description: string;
  stepsToReproduce?: string;
  screenshotUrl?: string;
}> {
  let screenshotUrl = '';
  const screenshotFile = payload.screenshotFile ?? null;
  if (screenshotFile) {
    if (screenshotFile.size > MAX_SUPPORT_SCREENSHOT_BYTES) {
      throw new Error('Screenshot must be 5 MB or smaller.');
    }
    const upload = await uploadSupportScreenshot(screenshotFile);
    screenshotUrl = upload.imageUrl ?? '';
  }

  const priorityValue = payload.priority.toUpperCase();
  const priority =
    priorityValue === 'LOW' || priorityValue === 'HIGH' || priorityValue === 'CRITICAL'
      ? priorityValue
      : 'MEDIUM';

  const mapped = {
    issueType: payload.issueType.trim() || 'General Question',
    priority,
    subject: payload.subject.trim(),
    description: payload.description.trim(),
    stepsToReproduce: payload.stepsToReproduce.trim() || undefined,
    screenshotUrl: screenshotUrl.trim() || undefined,
  };

  return mapped;
}
