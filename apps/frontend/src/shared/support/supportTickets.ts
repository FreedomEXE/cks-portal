import { uploadSupportScreenshot, type HubSupportTicketsResponse } from '../api/hub';
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

export function buildSupportTickets(supportData?: HubSupportTicketsResponse | null): SupportTicket[] {
  if (!supportData) {
    return [];
  }

  return (supportData.tickets ?? []).map((item) => ({
    ticketId: item.id,
    subject: item.subject || 'Untitled',
    issueType: item.issueType || 'Support Request',
    priority: (item.priority || 'MEDIUM').charAt(0) + (item.priority || 'MEDIUM').slice(1).toLowerCase(),
    status: mapSupportStatus(item.status),
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
