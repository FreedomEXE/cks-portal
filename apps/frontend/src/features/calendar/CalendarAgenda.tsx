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
  scheduled: 'border border-sky-200 bg-sky-50 text-sky-700',
  in_progress: 'border border-amber-200 bg-amber-50 text-amber-800',
  completed: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  cancelled: 'border border-rose-200 bg-rose-50 text-rose-700',
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
          <div className="text-lg font-black tracking-[-0.03em] text-slate-950">{title}</div>
          <div className="text-sm text-slate-500">{description}</div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {headerActions}
          {showWindowSelector ? (
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="rounded-[16px] border border-slate-200/80 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.06)] focus:border-slate-400 focus:outline-none"
            >
              <option value={7}>Next 7 days</option>
              <option value={14}>Next 14 days</option>
              <option value={30}>Next 30 days</option>
            </select>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-[28px] border border-slate-200/80 bg-white px-6 py-6 text-sm text-slate-500 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          Loading calendar...
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-6 text-sm text-rose-800 shadow-[0_18px_48px_rgba(244,63,94,0.12)]">
          Failed to load calendar.
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] px-6 py-8 text-center shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-[10px] font-black uppercase tracking-[0.14em] text-white">
            0
          </div>
          <div className="mt-4 text-sm font-semibold text-slate-900">No events scheduled</div>
          <div className="mt-1 text-sm text-slate-500">{emptyMessage}</div>
        </div>
      ) : (
        data.map((day) => (
          <section
            key={day.date}
            className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] shadow-[0_18px_48px_rgba(15,23,42,0.08)]"
          >
            <div className="border-b border-slate-200/80 bg-[linear-gradient(90deg,rgba(248,250,252,0.95),rgba(255,255,255,0.9))] px-5 py-4">
              <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Day slate</div>
              <div className="mt-1 text-sm font-black tracking-[-0.02em] text-slate-950">{day.label}</div>
            </div>
            <div className="flex flex-col px-2 py-2">
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
                    className={`grid gap-3 rounded-[22px] border-0 bg-transparent px-3 py-3 text-left transition-[transform,background-color,box-shadow] sm:grid-cols-[170px_minmax(0,1fr)_auto] sm:items-center ${
                      event.openTargetId ? 'cursor-pointer hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]' : 'cursor-default'
                    }`}
                  >
                    <div className="rounded-[18px] bg-slate-100/80 px-3 py-2 text-sm font-semibold text-slate-700">
                      {event.allDay ? 'All day' : formatEventTime(event.plannedStartAt, event.plannedEndAt)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black tracking-[-0.02em] text-slate-950">
                        {event.title}
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-500">
                        {[event.eventType, event.locationName || event.centerId || event.warehouseId].filter(Boolean).join(' • ')}
                      </div>
                    </div>
                    <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-black capitalize ${statusClasses}`}>
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
