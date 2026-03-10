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
    <div className={`relative overflow-hidden rounded-[26px] border p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] ${toneClasses}`}>
      <div className="absolute inset-x-4 top-0 h-px bg-white/70" />
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500/90">{label}</div>
      <div className="mt-2 text-3xl font-black leading-none">{value}</div>
      <div className="mt-2 text-xs font-medium text-slate-500/80">
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
  const { view, setView, anchorDate, days, goToToday, shiftRange } = useCalendarContext();
  const range = getCalendarRange(view, anchorDate, days);

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        {extraActions}
        <button
          type="button"
          onClick={() => shiftRange(-1)}
          className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur hover:border-slate-200 hover:text-slate-900"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={goToToday}
          className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur hover:border-slate-200 hover:text-slate-900"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => shiftRange(1)}
          className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur hover:border-slate-200 hover:text-slate-900"
        >
          Next
        </button>
        <div className="flex items-center gap-1 rounded-[18px] border border-white/70 bg-white/75 p-1 shadow-sm backdrop-blur">
          <ViewButton value="agenda" label="Agenda" activeView={view} onSelect={setView} />
          <ViewButton value="month" label="Month" activeView={view} onSelect={setView} />
          <ViewButton value="week" label="Week" activeView={view} onSelect={setView} />
          <ViewButton value="day" label="Day" activeView={view} onSelect={setView} />
        </div>
      </div>
      <div className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-sm">
        {range.label}
      </div>
    </div>
  );
}

function CalendarTabContent({
  scopeType,
  scopeId,
  testMode,
  agendaTitle,
  agendaDescription,
  agendaEmptyMessage,
  headerActions,
}: {
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

  return (
    <div className="relative flex flex-col gap-5">
      <div className="absolute inset-x-0 top-0 -z-10 h-64 rounded-[36px] bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_36%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_34%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(248,250,252,0.7))]" />

      <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(248,250,252,0.86))] p-6 shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Read only calendar infrastructure
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-[2.6rem]">
              Schedule intelligence across the ecosystem.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              High-signal timeline surfaces for service visits, deliveries, and operational activity. Every event stays tied to its source workflow and opens the existing entity modal.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">Source-driven</span>
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-sky-900">Modal-integrated</span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-900">Scope-aware</span>
            </div>
          </div>
          {controls}
        </div>
      </section>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
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
          headerActions={undefined}
        />
      ) : (
        <CalendarFull
          scopeType={scopeType}
          scopeId={scopeId}
          testMode={testMode}
          title={agendaTitle}
          description={agendaDescription}
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
