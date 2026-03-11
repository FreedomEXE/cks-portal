/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: CalendarFull.tsx
 *
 * Description:
 * Full read-only calendar surface for the dedicated hub tab.
 *
 * Responsibilities:
 * - Render month, week, and day calendar views from ranged event data
 * - Keep event drill-down wired to the shared modal system
 *
 * Role in system:
 * - Used only by the main Calendar tab; embedded widgets stay agenda-first
 *
 * Notes:
 * - This is intentionally read-only and reuses the existing calendar API
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import { useModals } from '../../contexts/ModalProvider';
import { useCalendarEvents, type CalendarEventItem } from '../../shared/api/calendar';
import { getCalendarRange, useCalendarContext } from './CalendarProvider';
import type { ReactNode } from 'react';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const EVENT_TONE_CLASSES: Record<string, string> = {
  service: 'border-sky-200/80 bg-[linear-gradient(135deg,rgba(240,249,255,0.98),rgba(224,242,254,0.92))] text-sky-950 shadow-[0_10px_24px_rgba(14,165,233,0.12)]',
  service_visit: 'border-sky-200/80 bg-[linear-gradient(135deg,rgba(240,249,255,0.98),rgba(224,242,254,0.92))] text-sky-950 shadow-[0_10px_24px_rgba(14,165,233,0.12)]',
  delivery: 'border-emerald-200/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.98),rgba(209,250,229,0.92))] text-emerald-950 shadow-[0_10px_24px_rgba(16,185,129,0.12)]',
  product_order: 'border-emerald-200/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.98),rgba(209,250,229,0.92))] text-emerald-950 shadow-[0_10px_24px_rgba(16,185,129,0.12)]',
  training: 'border-amber-200/80 bg-[linear-gradient(135deg,rgba(255,251,235,0.98),rgba(254,243,199,0.92))] text-amber-950 shadow-[0_10px_24px_rgba(245,158,11,0.12)]',
  default: 'border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(241,245,249,0.92))] text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.08)]',
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  scheduled: 'border-sky-200 bg-sky-50 text-sky-900',
  in_progress: 'border-amber-200 bg-amber-50 text-amber-900',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  cancelled: 'border-rose-200 bg-rose-50 text-rose-900',
};

function addDays(value: Date, days: number): Date {
  const next = new Date(value.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfMonth(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1, 0, 0, 0, 0));
}

function isSameUtcDay(left: Date, right: Date): boolean {
  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  );
}

function toneForEvent(event: CalendarEventItem): string {
  return (
    EVENT_TONE_CLASSES[event.eventType] ||
    EVENT_TONE_CLASSES[event.eventCategory || ''] ||
    EVENT_TONE_CLASSES[event.sourceType] ||
    EVENT_TONE_CLASSES.default
  );
}

function formatEventTime(start: string, end: string | null): string {
  const startDate = new Date(start);
  const startText = startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (!end) return startText;
  const endDate = new Date(end);
  const endText = endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${startText} - ${endText}`;
}

function formatDayLabel(value: Date, includeWeekday = true): string {
  return value.toLocaleDateString('en-CA', {
    weekday: includeWeekday ? 'short' : undefined,
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function groupEventsByDate(events: CalendarEventItem[]): Map<string, CalendarEventItem[]> {
  const grouped = new Map<string, CalendarEventItem[]>();
  for (const event of events) {
    const key = event.plannedStartAt.slice(0, 10);
    const bucket = grouped.get(key) ?? [];
    bucket.push(event);
    grouped.set(key, bucket);
  }
  grouped.forEach((bucket) =>
    bucket.sort((left, right) => left.plannedStartAt.localeCompare(right.plannedStartAt)),
  );
  return grouped;
}

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

function getPrimaryLocation(event: CalendarEventItem): string | null {
  return event.locationName || event.centerId || event.warehouseId || null;
}

function CalendarEventPill({ event, compact = false }: { event: CalendarEventItem; compact?: boolean }) {
  const modals = useModals();
  const tone = toneForEvent(event);
  const statusTone = STATUS_BADGE_CLASSES[event.status] || STATUS_BADGE_CLASSES.scheduled;
  const location = getPrimaryLocation(event);
  const meta = [event.eventType, location].filter(Boolean);

  return (
    <button
      type="button"
      onClick={() => {
        if (event.openTargetId) {
          modals.openById(event.openTargetId);
        }
      }}
      className={`w-full rounded-[20px] border px-3 py-3 text-left transition-[transform,box-shadow,filter] hover:-translate-y-0.5 hover:brightness-[0.99] ${tone} ${
        event.openTargetId ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`${compact ? 'text-[10px]' : 'text-[11px]'} font-black uppercase tracking-[0.12em] opacity-75`}>
          {event.allDay ? 'All day' : formatEventTime(event.plannedStartAt, event.plannedEndAt)}
        </div>
        {!compact ? (
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${statusTone}`}>
            {formatStatusLabel(event.status)}
          </span>
        ) : null}
      </div>
      <div className={`mt-2 truncate font-black tracking-[-0.02em] ${compact ? 'text-[11px]' : 'text-sm'}`}>{event.title}</div>
      <div className={`${compact ? 'mt-1 text-[10px]' : 'mt-2 text-[11px]'} opacity-75`}>
        {meta.join(' • ')}
      </div>
      {!compact && event.description ? (
        <div className="mt-2 line-clamp-2 text-[11px] leading-5 opacity-70">
          {event.description}
        </div>
      ) : null}
    </button>
  );
}

function EmptyRangeNotice({ message }: { message: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/90 px-5 py-5 text-sm text-slate-500 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="font-semibold text-slate-900">No events in this view</div>
      <div className="mt-1">{message}</div>
    </div>
  );
}

function MonthView({ events }: { events: CalendarEventItem[] }) {
  const { anchorDate, focusDate } = useCalendarContext();
  const monthStart = startOfMonth(anchorDate);
  const range = getCalendarRange('month', anchorDate, 42);
  const gridStart = new Date(range.start);
  const dates = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  const eventsByDate = groupEventsByDate(events);
  const today = new Date();

  return (
    <div className="flex flex-col gap-3">
      {events.length === 0 ? <EmptyRangeNotice message="No scheduled events in this month view yet." /> : null}
      <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-3 shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
        <div className="grid grid-cols-7 gap-2">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="rounded-2xl bg-slate-900 px-3 py-2 text-center text-[11px] font-black uppercase tracking-[0.12em] text-white"
          >
            {label}
          </div>
        ))}
        {dates.map((date) => {
          const key = date.toISOString().slice(0, 10);
          const dayEvents = eventsByDate.get(key) ?? [];
          const isCurrentMonth = date.getUTCMonth() === monthStart.getUTCMonth();
          const isToday = isSameUtcDay(date, today);
          const isSelected = isSameUtcDay(date, anchorDate);
          return (
            <div
              key={key}
              className={`flex min-h-[150px] flex-col gap-2 rounded-[24px] border p-3 transition-shadow ${
                isSelected
                  ? 'border-slate-900 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.14)]'
                  : isCurrentMonth
                    ? 'border-slate-200/80 bg-white/95 shadow-[0_10px_28px_rgba(15,23,42,0.06)]'
                    : 'border-slate-100 bg-slate-50/90'
              } hover:border-slate-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)]`}
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => focusDate(date, 'day')}
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black transition-transform hover:scale-[1.03] ${
                    isToday ? 'bg-slate-900 text-white' : isCurrentMonth ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {date.getUTCDate()}
                </button>
                <div className="flex items-center gap-1">
                  {isToday ? (
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                      Today
                    </span>
                  ) : null}
                  <span className="text-[10px] uppercase tracking-[0.08em] text-slate-400">
                    {date.toLocaleDateString('en-CA', { month: 'short', timeZone: 'UTC' })}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <CalendarEventPill key={event.eventId} event={event} compact />
                ))}
                {dayEvents.length > 3 ? (
                  <div className="px-1 text-[11px] font-semibold text-slate-500">
                    +{dayEvents.length - 3} more
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

function WeekView({ events }: { events: CalendarEventItem[] }) {
  const { anchorDate, focusDate } = useCalendarContext();
  const range = getCalendarRange('week', anchorDate, 7);
  const weekStart = new Date(range.start);
  const dates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const eventsByDate = groupEventsByDate(events);
  const today = new Date();

  return (
    <div className="flex flex-col gap-3">
      {events.length === 0 ? <EmptyRangeNotice message="No scheduled events in this week view yet." /> : null}
      <div className="grid gap-3 lg:grid-cols-7">
        {dates.map((date) => {
          const key = date.toISOString().slice(0, 10);
          const dayEvents = eventsByDate.get(key) ?? [];
          const isToday = isSameUtcDay(date, today);
          return (
            <section
              key={key}
              className={`overflow-hidden rounded-[26px] border shadow-[0_18px_48px_rgba(15,23,42,0.08)] ${
                isToday ? 'border-slate-900 bg-white' : 'border-slate-200/80 bg-white/95'
              } transition-shadow hover:border-slate-300 hover:shadow-[0_18px_48px_rgba(15,23,42,0.12)]`}
            >
              <div className={`border-b px-4 py-4 ${isToday ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50'}`}>
                <div className={`text-xs font-black uppercase tracking-[0.12em] ${isToday ? 'text-white/70' : 'text-slate-500'}`}>
                  {date.toLocaleDateString('en-CA', { weekday: 'short', timeZone: 'UTC' })}
                </div>
                <button
                  type="button"
                  onClick={() => focusDate(date, 'day')}
                  className={`mt-1 text-sm font-black tracking-[-0.02em] ${isToday ? 'text-white' : 'text-slate-900'} hover:underline`}
                >
                  {formatDayLabel(date, false)}
                </button>
              </div>
              <div className="flex min-h-[220px] flex-col gap-2 p-3">
                {dayEvents.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-slate-200 px-3 py-5 text-center text-xs text-slate-400">
                    No events
                  </div>
                ) : (
                  dayEvents.map((event) => <CalendarEventPill key={event.eventId} event={event} compact />)
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ events }: { events: CalendarEventItem[] }) {
  const { anchorDate } = useCalendarContext();
  const nextEvent = events[0] ?? null;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_340px]">
      <div className="flex flex-col gap-3">
        <div className="rounded-[30px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] px-6 py-5 shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Selected day</div>
          <div className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">{formatDayLabel(anchorDate)}</div>
          <div className="mt-2 text-sm text-slate-500">
            {events.length === 0 ? 'No scheduled activity yet.' : `${events.length} event${events.length === 1 ? '' : 's'} on this date.`}
          </div>
        </div>
        {events.length === 0 ? (
          <EmptyRangeNotice message="No scheduled events on this day yet." />
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((event) => (
              <CalendarEventPill key={event.eventId} event={event} />
            ))}
          </div>
        )}
      </div>
      <aside className="flex flex-col gap-3">
        <div className="rounded-[28px] border border-slate-200/80 bg-slate-900 px-5 py-5 text-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/60">Next up</div>
          {nextEvent ? (
            <>
              <div className="mt-3 text-lg font-black tracking-[-0.03em]">{nextEvent.title}</div>
              <div className="mt-2 text-sm text-white/70">
                {nextEvent.allDay ? 'All day' : formatEventTime(nextEvent.plannedStartAt, nextEvent.plannedEndAt)}
              </div>
              <div className="mt-1 text-sm text-white/60">
                {[nextEvent.eventType, getPrimaryLocation(nextEvent)].filter(Boolean).join(' • ')}
              </div>
            </>
          ) : (
            <div className="mt-3 text-sm text-white/70">Nothing scheduled yet.</div>
          )}
        </div>
        <div className="rounded-[28px] border border-slate-200/80 bg-white/95 px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">View cues</div>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-slate-900" />
              <span className="text-sm text-slate-600">Today is anchored in dark ink.</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-sky-400" />
              <span className="text-sm text-slate-600">Service activity uses sky tones.</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="text-sm text-slate-600">Delivery activity uses emerald tones.</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function CalendarFull({
  scopeType,
  scopeId,
  testMode,
  title = 'Schedule',
  description = 'Read-only schedule view across the selected scope.',
  showHeader = true,
  headerActions,
}: {
  scopeType?: string;
  scopeId?: string;
  testMode?: 'include' | 'exclude' | 'only';
  title?: string;
  description?: string;
  showHeader?: boolean;
  headerActions?: ReactNode;
}) {
  const { view, anchorDate, days } = useCalendarContext();
  const range = getCalendarRange(view === 'agenda' ? 'month' : view, anchorDate, days);
  const { data = [], isLoading, error } = useCalendarEvents({
    start: range.start,
    end: range.end,
    scopeType,
    scopeId,
    testMode,
    limit: 500,
  });
  const grouped = groupEventsByDate(data);
  const selectedKey = anchorDate.toISOString().slice(0, 10);
  const selectedDayEvents = grouped.get(selectedKey) ?? [];
  const nextEvent = data.find((event) => new Date(event.plannedStartAt).getTime() >= Date.now()) ?? data[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      {showHeader ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-black tracking-[-0.03em] text-slate-950">{title}</div>
            <div className="text-sm text-slate-500">{description}</div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            {headerActions}
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-[28px] border border-slate-200/80 bg-white px-6 py-6 text-sm text-slate-500 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          Loading schedule...
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-6 text-sm text-rose-800 shadow-[0_18px_48px_rgba(244,63,94,0.12)]">
          Failed to load schedule.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            {view === 'month' ? <MonthView events={data} /> : view === 'week' ? <WeekView events={data} /> : <DayView events={data} />}
          </div>
          {view !== 'day' ? (
            <aside className="flex flex-col gap-3">
              <div className="rounded-[28px] border border-slate-200/80 bg-slate-900 px-5 py-5 text-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/60">Focused day</div>
                <div className="mt-3 text-2xl font-black tracking-[-0.04em]">
                  {anchorDate.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                </div>
                <div className="mt-1 text-sm text-white/70">
                  {selectedDayEvents.length === 0
                    ? 'No events on the anchored date.'
                    : `${selectedDayEvents.length} event${selectedDayEvents.length === 1 ? '' : 's'} on the anchored date.`}
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  {selectedDayEvents.slice(0, 3).map((event) => (
                    <CalendarEventPill key={event.eventId} event={event} compact />
                  ))}
                </div>
              </div>
              <div className="rounded-[28px] border border-slate-200/80 bg-white/95 px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Next event</div>
                {nextEvent ? (
                  <>
                    <div className="mt-3 text-lg font-black tracking-[-0.03em] text-slate-950">{nextEvent.title}</div>
                    <div className="mt-2 text-sm text-slate-600">
                      {nextEvent.allDay ? 'All day' : formatEventTime(nextEvent.plannedStartAt, nextEvent.plannedEndAt)}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {[nextEvent.eventType, getPrimaryLocation(nextEvent)].filter(Boolean).join(' • ')}
                    </div>
                  </>
                ) : (
                  <div className="mt-3 text-sm text-slate-500">No upcoming event in this range yet.</div>
                )}
              </div>
            </aside>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default CalendarFull;
