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
import CalendarFull from './CalendarFull';

type PrimaryCalendarView = Exclude<CalendarView, 'agenda'>;

function normalizePrimaryView(view: CalendarView): PrimaryCalendarView {
  return view === 'agenda' ? 'month' : view;
}

function formatHeaderTitle(view: CalendarView, anchorDate: Date, days: number): string {
  return getCalendarRange(normalizePrimaryView(view), anchorDate, days).label;
}

function formatHeaderEyebrow(view: CalendarView): string {
  const normalizedView = normalizePrimaryView(view);

  if (normalizedView === 'day') {
    return 'Daily Schedule';
  }
  if (normalizedView === 'week') {
    return 'Weekly Schedule';
  }
  if (normalizedView === 'month') {
    return 'Monthly Schedule';
  }
  return 'Monthly Schedule';
}

function getResetLabel(view: CalendarView): string {
  const normalizedView = normalizePrimaryView(view);
  if (normalizedView === 'day') {
    return 'Today';
  }
  if (normalizedView === 'week') {
    return 'This Week';
  }
  return 'This Month';
}

function getSummarySubtitle(value: number, view: CalendarView): string {
  if (value === 0) {
    return 'Quiet window';
  }

  const normalizedView = normalizePrimaryView(view);
  const unit = normalizedView === 'day' ? 'today' : normalizedView === 'week' ? 'this week' : 'this month';
  return value === 1 ? `1 event ${unit}` : `${value} events ${unit}`;
}

function SummaryCard({
  label,
  value,
  tone,
  view,
}: {
  label: string;
  value: number;
  tone: 'slate' | 'sky' | 'amber' | 'emerald';
  view: CalendarView;
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
        {getSummarySubtitle(value, view)}
      </div>
    </div>
  );
}

function CalendarHeaderControls({ extraActions }: { extraActions?: ReactNode }) {
  const { view, goToToday, shiftRange } = useCalendarContext();

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
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
        {getResetLabel(view)}
      </button>
      <button
        type="button"
        onClick={() => shiftRange(1)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:text-slate-900"
      >
        Next
      </button>
      {extraActions}
    </div>
  );
}

function HeaderContextLine({ scopeLabel, identityLabel }: { scopeLabel?: string; identityLabel?: string }) {
  const parts = [scopeLabel, identityLabel].filter(Boolean);
  if (parts.length === 0) {
    return null;
  }
  return <div className="text-sm font-semibold text-slate-500">{parts.join(' · ')}</div>;
}

function CalendarHeader({
  scopeLabel,
  identityLabel,
  headerMeta,
  headerActions,
}: {
  scopeLabel?: string;
  identityLabel?: string;
  headerMeta?: ReactNode;
  headerActions?: ReactNode;
}) {
  const { days, view, anchorDate } = useCalendarContext();

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-5 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 space-y-3 xl:flex-1">
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            {formatHeaderEyebrow(view)}
          </div>
          <div className="text-3xl font-black tracking-[-0.05em] text-slate-950">
            {formatHeaderTitle(view, anchorDate, days)}
          </div>
          <HeaderContextLine scopeLabel={scopeLabel} identityLabel={identityLabel} />
          {headerMeta}
        </div>
        <div className="xl:min-w-[220px]">
          <CalendarHeaderControls extraActions={headerActions} />
        </div>
      </div>
    </section>
  );
}

function CalendarTabContent({
  scopeType,
  scopeId,
  scopeIds,
  testMode,
  agendaTitle,
  agendaDescription,
  agendaEmptyMessage,
  headerActions,
  headerMeta,
  renderDayView,
  scopeLabel,
  identityLabel,
}: {
  scopeType?: string;
  scopeId?: string;
  scopeIds?: string[];
  testMode?: 'include' | 'exclude' | 'only';
  agendaTitle?: string;
  agendaDescription?: string;
  agendaEmptyMessage?: string;
  headerActions?: ReactNode;
  headerMeta?: ReactNode;
  renderDayView?: (props: { scopeType?: string; scopeId?: string; scopeIds?: string[]; testMode?: 'include' | 'exclude' | 'only' }) => ReactNode;
  scopeLabel?: string;
  identityLabel?: string;
}) {
  const { days, view, anchorDate } = useCalendarContext();
  const normalizedView = normalizePrimaryView(view);
  const range = getCalendarRange(normalizedView, anchorDate, days);
  const { data } = useCalendarSummary(
    { start: range.start, end: range.end, scopeType, scopeId, testMode, limit: 500 },
  );

  return (
    <div className="flex flex-col gap-4">
      <CalendarHeader
        scopeLabel={scopeLabel}
        identityLabel={identityLabel}
        headerMeta={headerMeta}
        headerActions={headerActions}
      />

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
        <SummaryCard label="Total" value={data?.total ?? 0} tone="slate" view={normalizedView} />
        <SummaryCard label="Scheduled" value={data?.scheduled ?? 0} tone="sky" view={normalizedView} />
        <SummaryCard label="In Progress" value={data?.inProgress ?? 0} tone="amber" view={normalizedView} />
        <SummaryCard label="Completed" value={data?.completed ?? 0} tone="emerald" view={normalizedView} />
      </div>
      <CalendarFull
        scopeType={scopeType}
        scopeId={scopeId}
        scopeIds={scopeIds}
        testMode={testMode}
        title={agendaTitle}
        description={agendaDescription}
        showHeader={false}
        headerActions={undefined}
        renderDayView={renderDayView}
      />
    </div>
  );
}

export function CalendarTab({
  title = 'Schedule',
  scopeType,
  scopeId,
  scopeIds,
  testMode,
  agendaTitle,
  agendaDescription,
  agendaEmptyMessage,
  headerActions,
  headerMeta,
  scopeLabel,
  identityLabel,
  initialDays,
  initialView,
  initialAnchorDate,
  providerKey,
  onStateChange,
  renderDayView,
}: {
  title?: string;
  scopeType?: string;
  scopeId?: string;
  scopeIds?: string[];
  testMode?: 'include' | 'exclude' | 'only';
  agendaTitle?: string;
  agendaDescription?: string;
  agendaEmptyMessage?: string;
  headerActions?: ReactNode;
  headerMeta?: ReactNode;
  scopeLabel?: string;
  identityLabel?: string;
  initialDays?: number;
  initialView?: CalendarView;
  initialAnchorDate?: Date;
  providerKey?: string;
  onStateChange?: (state: { days: number; view: CalendarView; anchorDate: Date }) => void;
  renderDayView?: (props: { scopeType?: string; scopeId?: string; scopeIds?: string[]; testMode?: 'include' | 'exclude' | 'only' }) => ReactNode;
}) {
  return (
    <PageWrapper title={title} showHeader headerSrOnly>
      <CalendarProvider
        key={providerKey}
        initialDays={initialDays}
        initialView={initialView ?? 'month'}
        initialAnchorDate={initialAnchorDate}
        onStateChange={onStateChange}
      >
        <CalendarTabContent
          scopeType={scopeType}
          scopeId={scopeId}
          scopeIds={scopeIds}
          testMode={testMode}
          agendaTitle={agendaTitle}
          agendaDescription={agendaDescription}
          agendaEmptyMessage={agendaEmptyMessage}
          headerActions={headerActions}
          headerMeta={headerMeta}
          scopeLabel={scopeLabel}
          identityLabel={identityLabel}
          renderDayView={renderDayView}
        />
      </CalendarProvider>
    </PageWrapper>
  );
}

export default CalendarTab;
