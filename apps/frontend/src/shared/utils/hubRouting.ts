type ScheduleRouteView = 'agenda' | 'month' | 'week' | 'day';

const TAB_SLUG_TO_ID: Record<string, string> = {
  schedule: 'calendar',
  calendar: 'calendar',
};

const TAB_ID_TO_SLUG: Record<string, string> = {
  calendar: 'schedule',
};

const KNOWN_HUB_TAB_SLUGS = new Set([
  'dashboard',
  'profile',
  'ecosystem',
  'ecosystems',
  'schedule',
  'calendar',
  'directory',
  'create',
  'assign',
  'archive',
  'inventory',
  'services',
  'deliveries',
  'orders',
  'reports',
  'support',
]);

const VALID_SCHEDULE_VIEWS = new Set<ScheduleRouteView>(['agenda', 'month', 'week', 'day']);
const DEFAULT_SCHEDULE_VIEW: ScheduleRouteView = 'month';

function normalizeSegment(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function tabSlugToId(slug: string): string {
  const normalized = normalizeSegment(slug);
  return TAB_SLUG_TO_ID[normalized] ?? normalized;
}

export function tabIdToSlug(id: string): string {
  const normalized = normalizeSegment(id);
  return TAB_ID_TO_SLUG[normalized] ?? normalized;
}

export function isKnownHubTabSlug(slug: string | null | undefined): boolean {
  const normalized = normalizeSegment(slug);
  return normalized.length > 0 && KNOWN_HUB_TAB_SLUGS.has(normalized);
}

export function parseScheduleView(value: string | null | undefined): ScheduleRouteView {
  const normalized = normalizeSegment(value);
  return VALID_SCHEDULE_VIEWS.has(normalized as ScheduleRouteView)
    ? (normalized as ScheduleRouteView)
    : DEFAULT_SCHEDULE_VIEW;
}

export function parseScheduleDate(value: string | null | undefined): Date {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date();
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function toScheduleDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function isTodayScheduleDate(value: Date): boolean {
  return toScheduleDateKey(value) === toScheduleDateKey(new Date());
}

export function buildSchedulePath(
  view: ScheduleRouteView,
  anchorDate: Date,
  options?: { forceDateSegment?: boolean },
): string {
  if (view === DEFAULT_SCHEDULE_VIEW && isTodayScheduleDate(anchorDate)) {
    return '/hub/schedule';
  }
  if (view === 'agenda') {
    return '/hub/schedule/agenda';
  }
  if (!options?.forceDateSegment && isTodayScheduleDate(anchorDate)) {
    return `/hub/schedule/${view}`;
  }
  return `/hub/schedule/${view}/${toScheduleDateKey(anchorDate)}`;
}

export function buildLegacyHubRedirect(searchParams: URLSearchParams): string | null {
  const legacyTab = normalizeSegment(searchParams.get('tab'));
  if (!legacyTab) {
    return null;
  }

  const activeTabId = tabSlugToId(legacyTab);
  const canonicalSlug = tabIdToSlug(activeTabId);
  if (!isKnownHubTabSlug(canonicalSlug)) {
    return '/hub';
  }

  const next = new URLSearchParams(searchParams);
  next.delete('tab');

  let path = canonicalSlug === 'dashboard' ? '/hub' : `/hub/${canonicalSlug}`;
  if (canonicalSlug === 'schedule') {
    const rawDate = next.get('date');
    path = buildSchedulePath(
      parseScheduleView(next.get('view')),
      parseScheduleDate(next.get('date')),
      { forceDateSegment: Boolean(rawDate) },
    );
    next.delete('view');
    next.delete('date');
  }

  const query = next.toString();
  return query ? `${path}?${query}` : path;
}
