/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: CalendarTab.tsx
 *
 * Description:
 * Main read-only calendar hub surface.
 *
 * Responsibilities:
 * - Render summary badges
 * - Compose the provider and agenda view
 *
 * Role in system:
 * - Mounted inside each hub's Calendar tab
 *
 * Notes:
 * - Events are sourced from other domains; no creation flows live here
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import { PageWrapper } from '@cks/ui';
import type { ReactNode } from 'react';
import { useCalendarSummary } from '../../shared/api/calendar';
import { CalendarProvider, getCalendarRange, type CalendarView, useCalendarContext } from './CalendarProvider';
import CalendarAgenda from './CalendarAgenda';
import CalendarFull from './CalendarFull';

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</div>
      <div className="mt-1.5 text-2xl font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

function ViewButton({
  value,
  label,
  activeView,
  onSelect,
}: {
  value: CalendarView;
  label: string;
  activeView: CalendarView;
  onSelect: (value: CalendarView) => void;
}) {
  const isActive = activeView === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
        isActive
          ? 'bg-slate-900 text-white shadow-sm'
          : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
      }`}
    >
      {label}
    </button>
  );
}

function CalendarHeaderControls({ extraActions }: { extraActions?: ReactNode }) {
  const { view, setView, anchorDate, days, goToToday, shiftRange } = useCalendarContext();
  const range = getCalendarRange(view, anchorDate, days);

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        {extraActions}
        <button
          type="button"
          onClick={() => shiftRange(-1)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={goToToday}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => shiftRange(1)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
        >
          Next
        </button>
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <ViewButton value="agenda" label="Agenda" activeView={view} onSelect={setView} />
          <ViewButton value="month" label="Month" activeView={view} onSelect={setView} />
          <ViewButton value="week" label="Week" activeView={view} onSelect={setView} />
          <ViewButton value="day" label="Day" activeView={view} onSelect={setView} />
        </div>
      </div>
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{range.label}</div>
    </div>
  );
}

function CalendarTabContent({
  scopeType,
  scopeId,
  agendaTitle,
  agendaDescription,
  agendaEmptyMessage,
  headerActions,
}: {
  scopeType?: string;
  scopeId?: string;
  agendaTitle?: string;
  agendaDescription?: string;
  agendaEmptyMessage?: string;
  headerActions?: ReactNode;
}) {
  const { days, view, anchorDate } = useCalendarContext();
  const range = getCalendarRange(view, anchorDate, days);
  const { data } = useCalendarSummary(
    view === 'agenda'
      ? { days, scopeType, scopeId }
      : { start: range.start, end: range.end, scopeType, scopeId, limit: 500 },
  );
  const controls = <CalendarHeaderControls extraActions={headerActions} />;

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
        <SummaryCard label="Total" value={data?.total ?? 0} />
        <SummaryCard label="Scheduled" value={data?.scheduled ?? 0} />
        <SummaryCard label="In Progress" value={data?.inProgress ?? 0} />
        <SummaryCard label="Completed" value={data?.completed ?? 0} />
      </div>
      {view === 'agenda' ? (
        <CalendarAgenda
          scopeType={scopeType}
          scopeId={scopeId}
          title={agendaTitle}
          description={agendaDescription}
          emptyMessage={agendaEmptyMessage}
          headerActions={controls}
        />
      ) : (
        <CalendarFull
          scopeType={scopeType}
          scopeId={scopeId}
          title={agendaTitle}
          description={agendaDescription}
          headerActions={controls}
        />
      )}
    </div>
  );
}

export function CalendarTab({
  title = 'Calendar',
  scopeType,
  scopeId,
  agendaTitle,
  agendaDescription,
  agendaEmptyMessage,
  headerActions,
}: {
  title?: string;
  scopeType?: string;
  scopeId?: string;
  agendaTitle?: string;
  agendaDescription?: string;
  agendaEmptyMessage?: string;
  headerActions?: ReactNode;
}) {
  return (
    <PageWrapper title={title} showHeader headerSrOnly>
      <CalendarProvider initialView="month">
        <CalendarTabContent
          scopeType={scopeType}
          scopeId={scopeId}
          agendaTitle={agendaTitle}
          agendaDescription={agendaDescription}
          agendaEmptyMessage={agendaEmptyMessage}
          headerActions={headerActions}
        />
      </CalendarProvider>
    </PageWrapper>
  );
}

export default CalendarTab;
