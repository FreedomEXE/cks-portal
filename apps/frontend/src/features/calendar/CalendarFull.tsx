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
  service: 'border-sky-200 bg-sky-50 text-sky-900',
  service_visit: 'border-sky-200 bg-sky-50 text-sky-900',
  delivery: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  product_order: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  training: 'border-amber-200 bg-amber-50 text-amber-900',
  default: 'border-slate-200 bg-slate-50 text-slate-900',
};

function addDays(value: Date, days: number): Date {
  const next = new Date(value.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfMonth(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1, 0, 0, 0, 0));
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
  return grouped;
}

function CalendarEventPill({ event, compact = false }: { event: CalendarEventItem; compact?: boolean }) {
  const modals = useModals();
  const tone = toneForEvent(event);

  return (
    <button
      type="button"
      onClick={() => {
        if (event.openTargetId) {
          modals.openById(event.openTargetId);
        }
      }}
      className={`w-full rounded-lg border px-2.5 py-2 text-left transition-colors hover:brightness-[0.98] ${tone} ${
        event.openTargetId ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className={`truncate font-bold ${compact ? 'text-[11px]' : 'text-sm'}`}>{event.title}</div>
      <div className={`${compact ? 'mt-0.5 text-[10px]' : 'mt-1 text-[11px]'} opacity-80`}>
        {event.allDay ? 'All day' : formatEventTime(event.plannedStartAt, event.plannedEndAt)}
      </div>
      {!compact ? (
        <div className="mt-1 truncate text-[11px] opacity-70">
          {[event.eventType, event.locationName || event.centerId || event.warehouseId].filter(Boolean).join(' • ')}
        </div>
      ) : null}
    </button>
  );
}

function EmptyRangeNotice({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-4 text-sm text-slate-500">
      {message}
    </div>
  );
}

function MonthView({ events }: { events: CalendarEventItem[] }) {
  const { anchorDate } = useCalendarContext();
  const monthStart = startOfMonth(anchorDate);
  const range = getCalendarRange('month', anchorDate, 42);
  const gridStart = new Date(range.start);
  const dates = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  const eventsByDate = groupEventsByDate(events);

  return (
    <div className="flex flex-col gap-3">
      {events.length === 0 ? <EmptyRangeNotice message="No scheduled events in this month view yet." /> : null}
      <div className="grid grid-cols-7 gap-2">
        {DAY_LABELS.map((label) => (
          <div key={label} className="px-2 pb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
            {label}
          </div>
        ))}
        {dates.map((date) => {
          const key = date.toISOString().slice(0, 10);
          const dayEvents = eventsByDate.get(key) ?? [];
          const isCurrentMonth = date.getUTCMonth() === monthStart.getUTCMonth();
          return (
            <div
              key={key}
              className={`flex min-h-[132px] flex-col gap-2 rounded-2xl border p-3 shadow-sm ${
                isCurrentMonth ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${isCurrentMonth ? 'text-slate-900' : 'text-slate-400'}`}>
                  {date.getUTCDate()}
                </span>
                <span className="text-[10px] uppercase tracking-[0.08em] text-slate-400">
                  {date.toLocaleDateString('en-CA', { month: 'short', timeZone: 'UTC' })}
                </span>
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
  );
}

function WeekView({ events }: { events: CalendarEventItem[] }) {
  const { anchorDate } = useCalendarContext();
  const range = getCalendarRange('week', anchorDate, 7);
  const weekStart = new Date(range.start);
  const dates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const eventsByDate = groupEventsByDate(events);

  return (
    <div className="flex flex-col gap-3">
      {events.length === 0 ? <EmptyRangeNotice message="No scheduled events in this week view yet." /> : null}
      <div className="grid gap-3 lg:grid-cols-7">
        {dates.map((date) => {
          const key = date.toISOString().slice(0, 10);
          const dayEvents = eventsByDate.get(key) ?? [];
          return (
            <section key={key} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                  {date.toLocaleDateString('en-CA', { weekday: 'short', timeZone: 'UTC' })}
                </div>
                <div className="mt-1 text-sm font-bold text-slate-900">{formatDayLabel(date, false)}</div>
              </div>
              <div className="flex min-h-[180px] flex-col gap-2 p-3">
                {dayEvents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-xs text-slate-400">
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

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Selected day</div>
        <div className="mt-1 text-lg font-bold text-slate-900">{formatDayLabel(anchorDate)}</div>
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
  );
}

export function CalendarFull({
  scopeType,
  scopeId,
  title = 'Calendar',
  description = 'Read-only projection of scheduled activity across the platform.',
  headerActions,
}: {
  scopeType?: string;
  scopeId?: string;
  title?: string;
  description?: string;
  headerActions?: ReactNode;
}) {
  const { view, anchorDate, days } = useCalendarContext();
  const range = getCalendarRange(view === 'agenda' ? 'month' : view, anchorDate, days);
  const { data = [], isLoading, error } = useCalendarEvents({
    start: range.start,
    end: range.end,
    scopeType,
    scopeId,
    limit: 500,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-bold text-slate-900">{title}</div>
          <div className="text-sm text-slate-500">{description}</div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          {headerActions}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-6 text-sm text-slate-500 shadow-sm">
          Loading calendar...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-6 py-6 text-sm text-rose-800 shadow-sm">
          Failed to load calendar.
        </div>
      ) : view === 'month' ? (
        <MonthView events={data} />
      ) : view === 'week' ? (
        <WeekView events={data} />
      ) : (
        <DayView events={data} />
      )}
    </div>
  );
}

export default CalendarFull;
