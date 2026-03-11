/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: ScheduleTab.tsx
 *
 * Description:
 * User-facing Schedule workspace shell built on top of the existing
 * read-only calendar infrastructure.
 *
 * Responsibilities:
 * - Present the product as "Schedule" instead of "Calendar"
 * - Preserve the current calendar-backed functionality while the
 *   broader Schedule domain is implemented in later slices
 *
 * Role in system:
 * - Main hub tab surface for schedule browsing across roles
 *
 * Notes:
 * - This wrapper intentionally reuses CalendarTab for now
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import type { ReactNode } from 'react';
import CalendarTab from '../calendar/CalendarTab';

export function ScheduleTab({
  title = 'Schedule',
  agendaTitle = 'Upcoming Schedule',
  agendaDescription = 'Read-only schedule view across the selected scope.',
  agendaEmptyMessage = 'No scheduled work in this window yet.',
  headerActions,
  scopeType,
  scopeId,
  testMode,
}: {
  title?: string;
  agendaTitle?: string;
  agendaDescription?: string;
  agendaEmptyMessage?: string;
  headerActions?: ReactNode;
  scopeType?: string;
  scopeId?: string;
  testMode?: 'include' | 'exclude' | 'only';
}) {
  return (
    <CalendarTab
      title={title}
      agendaTitle={agendaTitle}
      agendaDescription={agendaDescription}
      agendaEmptyMessage={agendaEmptyMessage}
      headerActions={headerActions}
      scopeType={scopeType}
      scopeId={scopeId}
      testMode={testMode}
    />
  );
}

export default ScheduleTab;
