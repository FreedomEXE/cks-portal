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

function formatHeaderTitle(view: CalendarView, anchorDate: Date, days: number): string {
  const range = getCalendarRange(view, anchorDate, days);
  if (view === 'agenda') {
    return `Next ${days} days`;
  }
  return range.label;
}

function formatHeaderSubtitle(view: CalendarView): string {
  if (view === 'day') {
    return 'Daily schedule';
  }
  if (view === 'week') {
    return 'Weekly schedule';
  }
  if (view === 'month') {
    return 'Monthly schedule';
  }
  return 'Upcoming schedule';
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'slate' | 'sky' | 'amber' | 'emerald';
}) {
  const toneClasses =
    tone === 'sky'
      ? 'border-sky-200/80 bg-[linear-gradient(180deg,rgba(240,249,255,0.98),rgba(224,242,254,0.82))] text-sky-950'
      : tone === 'amber'
        ? 'border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,251,235,0.98),rgba(254,243,199,0.85))] text-amber-950'
        : tone === 'emerald'
          ? 'border-emerald-200/80 bg-[linear-gradient(180deg,rgba(236,253,245,0.98),rgba(209,250,229,0.85))] text-emerald-950'
          : 'border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,245,249,0.85))] text-slate-950';

  return (
    <div className={`relative overflow-hidden rounded-[22px] border px-4 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.05)] ${toneClasses}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500/90">{label}</div>
      <div className="mt-1.5 text-2xl font-black leading-none">{value}</div>
      <div className="mt-1.5 text-xs font-medium text-slate-500/80">
        {value === 0 ? 'Quiet window' : value === 1 ? '1 event in view' : `${value} events in view`}
      </div>
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
          ? 'bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.22)]'
          : 'bg-transparent text-slate-600 hover:bg-white hover:text-slate-900'
      }`}
    >
      {label}
    </button>
  );
}

function CalendarHeaderControls({ extraActions }: { extraActions?: ReactNode }) {
  const { view, setView, goToToday, shiftRange } = useCalendarContext();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {extraActions}
        <button
          type="button"
          onClick={() => shiftRange(-1)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:text-slate-900"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={goToToday}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:text-slate-900"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => shiftRange(1)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:text-slate-900"
        >
          Next
        </button>
        <div className="flex items-center gap-1 rounded-[18px] border border-slate-200 bg-slate-50 p-1 shadow-sm">
          <ViewButton value="agenda" label="Agenda" activeView={view} onSelect={setView} />
          <ViewButton value="month" label="Month" activeView={view} onSelect={setView} />
          <ViewButton value="week" label="Week" activeView={view} onSelect={setView} />
          <ViewButton value="day" label="Day" activeView={view} onSelect={setView} />
        </div>
      </div>
    </div>
  );
}

function CalendarTabContent({
  title,
  scopeType,
  scopeId,
  testMode,
  agendaTitle,
  agendaDescription,
  agendaEmptyMessage,
  headerActions,
}: {
  title: string;
  scopeType?: string;
  scopeId?: string;
  testMode?: 'include' | 'exclude' | 'only';
  agendaTitle?: string;
  agendaDescription?: string;
  agendaEmptyMessage?: string;
  headerActions?: ReactNode;
}) {
  const { days, view, anchorDate } = useCalendarContext();
  const range = getCalendarRange(view, anchorDate, days);
  const { data } = useCalendarSummary(
    view === 'agenda'
      ? { days, scopeType, scopeId, testMode }
      : { start: range.start, end: range.end, scopeType, scopeId, testMode, limit: 500 },
  );
  const controls = <CalendarHeaderControls extraActions={headerActions} />;
  const headerTitle = formatHeaderTitle(view, anchorDate, days);
  const headerSubtitle = formatHeaderSubtitle(view);

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-4 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{headerSubtitle}</div>
            <div className="text-2xl font-black tracking-[-0.04em] text-slate-950">{headerTitle}</div>
          </div>
          {controls}
        </div>
      </section>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
        <SummaryCard label="Total" value={data?.total ?? 0} tone="slate" />
        <SummaryCard label="Scheduled" value={data?.scheduled ?? 0} tone="sky" />
        <SummaryCard label="In Progress" value={data?.inProgress ?? 0} tone="amber" />
        <SummaryCard label="Completed" value={data?.completed ?? 0} tone="emerald" />
      </div>
      {view === 'agenda' ? (
        <CalendarAgenda
          scopeType={scopeType}
          scopeId={scopeId}
          testMode={testMode}
          title={agendaTitle}
          description={agendaDescription}
          emptyMessage={agendaEmptyMessage}
          showHeader={false}
          headerActions={undefined}
        />
      ) : (
        <CalendarFull
          scopeType={scopeType}
          scopeId={scopeId}
          testMode={testMode}
          title={agendaTitle}
          description={agendaDescription}
          showHeader={false}
          headerActions={undefined}
        />
      )}
    </div>
  );
}

export function CalendarTab({
  title = 'Calendar',
  scopeType,
  scopeId,
  testMode,
  agendaTitle,
  agendaDescription,
  agendaEmptyMessage,
  headerActions,
}: {
  title?: string;
  scopeType?: string;
  scopeId?: string;
  testMode?: 'include' | 'exclude' | 'only';
  agendaTitle?: string;
  agendaDescription?: string;
  agendaEmptyMessage?: string;
  headerActions?: ReactNode;
}) {
  return (
    <PageWrapper title={title} showHeader headerSrOnly>
      <CalendarProvider initialView="month">
        <CalendarTabContent
          title={title}
          scopeType={scopeType}
          scopeId={scopeId}
          testMode={testMode}
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
