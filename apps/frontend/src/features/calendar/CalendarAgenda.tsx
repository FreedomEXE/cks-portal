/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: CalendarAgenda.tsx
 *
 * Description:
 * Agenda-first calendar view for upcoming source-driven events.
 *
 * Responsibilities:
 * - Render grouped agenda rows
 * - Let users open related entities through the shared modal system
 *
 * Role in system:
 * - Used by the main calendar tab and future embedded widgets
 *
 * Notes:
 * - Styling follows the existing frontend utility-class approach
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import type { ReactNode } from 'react';
import { useModals } from '../../contexts/ModalProvider';
import { useCalendarAgenda } from '../../shared/api/calendar';
import { useCalendarContext } from './CalendarProvider';

const STATUS_BADGE_CLASSES: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

function formatEventTime(start: string, end: string | null): string {
  const startDate = new Date(start);
  const startText = startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (!end) return startText;
  const endDate = new Date(end);
  const endText = endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${startText} - ${endText}`;
}

export function CalendarAgenda({
  scopeType,
  scopeId,
  title = 'Upcoming Events',
  description = 'Read-only projection of scheduled activity across the platform.',
  emptyMessage = 'No scheduled events in this window yet.',
  showWindowSelector = true,
  headerActions,
}: {
  scopeType?: string;
  scopeId?: string;
  title?: string;
  description?: string;
  emptyMessage?: string;
  showWindowSelector?: boolean;
  headerActions?: ReactNode;
}) {
  const { days, setDays } = useCalendarContext();
  const { data, isLoading, error } = useCalendarAgenda(days, scopeType, scopeId);
  const modals = useModals();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-bold text-slate-900">{title}</div>
          <div className="text-sm text-slate-500">{description}</div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {headerActions}
          {showWindowSelector ? (
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none"
            >
              <option value={7}>Next 7 days</option>
              <option value={14}>Next 14 days</option>
              <option value={30}>Next 30 days</option>
            </select>
          ) : null}
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
      ) : !data || data.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-6 text-sm text-slate-500 shadow-sm">
          {emptyMessage}
        </div>
      ) : (
        data.map((day) => (
          <section key={day.date} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900">
              {day.label}
            </div>
            <div className="flex flex-col">
              {day.events.map((event) => {
                const statusClasses = STATUS_BADGE_CLASSES[event.status] || STATUS_BADGE_CLASSES.scheduled;
                return (
                  <button
                    key={event.eventId}
                    type="button"
                    onClick={() => {
                      if (event.openTargetId) {
                        modals.openById(event.openTargetId);
                      }
                    }}
                    className={`grid gap-3 border-0 border-t border-slate-100 bg-transparent px-5 py-4 text-left transition-colors sm:grid-cols-[160px_minmax(0,1fr)_auto] sm:items-center ${
                      event.openTargetId ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-700">
                      {event.allDay ? 'All day' : formatEventTime(event.plannedStartAt, event.plannedEndAt)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-slate-900">
                        {event.title}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-slate-500">
                        {[event.eventType, event.locationName || event.centerId || event.warehouseId].filter(Boolean).join(' • ')}
                      </div>
                    </div>
                    <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${statusClasses}`}>
                      {event.status.replace('_', ' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

export default CalendarAgenda;
