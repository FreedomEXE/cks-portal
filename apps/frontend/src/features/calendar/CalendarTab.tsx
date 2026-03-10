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
import { CalendarProvider, useCalendarContext } from './CalendarProvider';
import CalendarAgenda from './CalendarAgenda';

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</div>
      <div className="mt-1.5 text-2xl font-extrabold text-slate-900">{value}</div>
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
  const { days } = useCalendarContext();
  const { data } = useCalendarSummary(days, scopeType, scopeId);

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
        <SummaryCard label="Total" value={data?.total ?? 0} />
        <SummaryCard label="Scheduled" value={data?.scheduled ?? 0} />
        <SummaryCard label="In Progress" value={data?.inProgress ?? 0} />
        <SummaryCard label="Completed" value={data?.completed ?? 0} />
      </div>
      <CalendarAgenda
        scopeType={scopeType}
        scopeId={scopeId}
        title={agendaTitle}
        description={agendaDescription}
        emptyMessage={agendaEmptyMessage}
        headerActions={headerActions}
      />
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
      <CalendarProvider>
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
