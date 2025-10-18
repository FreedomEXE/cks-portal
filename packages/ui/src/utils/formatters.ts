/**
 * Shared formatting utilities for consistent display across all modals
 */

/**
 * Format timezone to user-friendly name
 * Maps IANA timezone codes to readable names
 */
export function formatTimezone(tz: string | null | undefined): string {
  if (!tz) return '';

  const timezoneMap: Record<string, string> = {
    'America/Toronto': 'Eastern/Canada',
    'America/New_York': 'Eastern/USA',
    'America/Detroit': 'Eastern/USA',
    'America/Chicago': 'Central/USA',
    'America/Denver': 'Mountain/USA',
    'America/Los_Angeles': 'Pacific/USA',
    'America/Phoenix': 'Mountain/USA',
    'America/Anchorage': 'Alaska/USA',
    'Pacific/Honolulu': 'Hawaii/USA',
    'America/Halifax': 'Atlantic/Canada',
    'America/St_Johns': 'Newfoundland/Canada',
    'America/Vancouver': 'Pacific/Canada',
    'America/Edmonton': 'Mountain/Canada',
    'America/Winnipeg': 'Central/Canada',
    'America/Montreal': 'Eastern/Canada',
  };

  return timezoneMap[tz] || tz;
}

/**
 * Format status string for display
 * - Replaces underscores/hyphens with spaces
 * - Capitalizes each word
 */
export function formatStatus(status: string | null | undefined): string {
  if (!status) return '—';

  return status
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get status badge colors
 * Returns { bg, fg } for background and foreground colors
 * Centralized color palette for consistent status display across all components
 */
export function getStatusColors(status: string | null | undefined): { bg: string; fg: string } {
  const normalized = (status || '').toLowerCase().replace(/_/g, '-');

  // Pending statuses - Yellow
  if (normalized.includes('pending') || normalized.includes('awaiting') || normalized.includes('waiting')) {
    return { bg: '#fef3c7', fg: '#92400e' };
  }

  // Success statuses - Green
  if (
    normalized === 'delivered' ||
    normalized === 'completed' ||
    normalized === 'approved' ||
    normalized === 'active' ||
    normalized === 'service-created' ||
    normalized === 'crew-assigned' ||
    normalized === 'requested'
  ) {
    return { bg: '#dcfce7', fg: '#065f46' };
  }

  // In-progress/accepted statuses - Yellow (not fully complete)
  if (normalized === 'accepted' || normalized === 'crew-requested' || normalized === 'manager-accepted') {
    return { bg: '#fef3c7', fg: '#92400e' };
  }

  // Error/Cancelled statuses - Red
  if (normalized === 'cancelled' || normalized === 'rejected' || normalized === 'failed') {
    return { bg: '#fee2e2', fg: '#991b1b' };
  }

  // In progress statuses - Blue
  if (normalized === 'in-progress' || normalized === 'processing') {
    return { bg: '#dbeafe', fg: '#1e40af' };
  }

  // Archived - Grey with slight tint
  if (normalized === 'archived') {
    return { bg: '#f3f4f6', fg: '#4b5563' };
  }

  // Default - Grey
  return { bg: '#f3f4f6', fg: '#4b5563' };
}
