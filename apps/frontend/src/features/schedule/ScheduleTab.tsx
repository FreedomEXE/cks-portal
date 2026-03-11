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
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import CalendarTab from '../calendar/CalendarTab';
import type { CalendarView } from '../calendar/CalendarProvider';
import type { HubRole, HubRoleScopeResponse } from '../../shared/api/hub';
import { useScheduleScopeControls, type AdminScheduleManagerOption } from './scopeControls';

interface ScheduleTreeNode {
  user: {
    id: string;
    role: string;
    name: string;
  };
  type?: string;
  children?: ScheduleTreeNode[];
}

const VALID_VIEWS: CalendarView[] = ['agenda', 'month', 'week', 'day'];

function parseView(value: string | null): CalendarView {
  if (value && VALID_VIEWS.includes(value as CalendarView)) {
    return value as CalendarView;
  }
  return 'month';
}

function parseDays(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 14;
  }
  return parsed;
}

function parseAnchorDate(value: string | null): Date {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date();
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

export function ScheduleTab({
  title = 'Schedule',
  agendaTitle = 'Upcoming Schedule',
  agendaDescription = 'Read-only schedule view across the selected scope.',
  agendaEmptyMessage = 'No scheduled work in this window yet.',
  headerActions,
  viewerRole,
  viewerCode,
  scopeData,
  adminScopeTree,
  adminManagerOptions,
  selectedAdminManagerId,
  onSelectedAdminManagerIdChange,
  showTestEcosystems,
  onShowTestEcosystemsChange,
}: {
  title?: string;
  agendaTitle?: string;
  agendaDescription?: string;
  agendaEmptyMessage?: string;
  headerActions?: ReactNode;
  viewerRole?: HubRole | 'admin';
  viewerCode?: string | null;
  scopeData?: HubRoleScopeResponse | null;
  adminScopeTree?: ScheduleTreeNode | null;
  adminManagerOptions?: AdminScheduleManagerOption[];
  selectedAdminManagerId?: string | null;
  onSelectedAdminManagerIdChange?: (managerId: string | null) => void;
  showTestEcosystems?: boolean;
  onShowTestEcosystemsChange?: (value: boolean) => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = parseView(searchParams.get('view'));
  const initialDays = parseDays(searchParams.get('days'));
  const initialAnchorDate = parseAnchorDate(searchParams.get('date'));
  const providerKey = useMemo(
    () => `${initialView}:${initialDays}:${initialAnchorDate.toISOString().slice(0, 10)}`,
    [initialAnchorDate, initialDays, initialView],
  );
  const handleStateChange = useCallback(
    (state: { days: number; view: CalendarView; anchorDate: Date }) => {
      const next = new URLSearchParams(searchParams);
      next.set('tab', 'schedule');
      next.set('view', state.view);
      next.set('date', state.anchorDate.toISOString().slice(0, 10));
      next.set('days', String(state.days));
      if (next.toString() !== searchParams.toString()) {
        setSearchParams(next, { replace: true });
      }
    },
    [searchParams, setSearchParams],
  );
  const { scopeType, scopeId, testMode, headerActions: scopeHeaderActions } = useScheduleScopeControls({
    viewerRole,
    viewerCode,
    scopeData,
    adminScopeTree,
    adminManagerOptions,
    selectedAdminManagerId,
    onSelectedAdminManagerIdChange,
    showTestEcosystems,
    onShowTestEcosystemsChange,
    extraActions: headerActions,
  });

  return (
    <CalendarTab
      title={title}
      agendaTitle={agendaTitle}
      agendaDescription={agendaDescription}
      agendaEmptyMessage={agendaEmptyMessage}
      headerActions={scopeHeaderActions}
      scopeType={scopeType}
      scopeId={scopeId}
      testMode={testMode}
      initialView={initialView}
      initialDays={initialDays}
      initialAnchorDate={initialAnchorDate}
      providerKey={providerKey}
      onStateChange={handleStateChange}
    />
  );
}

export default ScheduleTab;
