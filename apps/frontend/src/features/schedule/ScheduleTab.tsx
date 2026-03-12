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
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import CalendarTab from '../calendar/CalendarTab';
import type { CalendarView } from '../calendar/CalendarProvider';
import type { HubRole, HubRoleScopeResponse } from '../../shared/api/hub';
import { useScheduleScopeControls, type AdminScheduleManagerOption } from './scopeControls';
import ScheduleDayPlan from './ScheduleDayPlan';
import { buildSchedulePath, parseScheduleDate, parseScheduleView, toScheduleDateKey } from '../../shared/utils/hubRouting';

interface ScheduleTreeNode {
  user: {
    id: string;
    role: string;
    name: string;
  };
  type?: string;
  children?: ScheduleTreeNode[];
}
const DEFAULT_VIEW: CalendarView = 'month';
const DEFAULT_DAYS = 14;

function parseDays(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_DAYS;
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
  const navigate = useNavigate();
  const { view: viewParam, date: dateParam } = useParams<{ view?: string; date?: string }>();
  const [searchParams] = useSearchParams();

  // Primary state from route path segments
  const initialView = parseScheduleView(viewParam) as CalendarView;
  const initialAnchorDate = parseScheduleDate(dateParam);
  // Secondary state remains in query params
  const initialDays = parseDays(searchParams.get('days'));

  const providerKey = useMemo(
    () => `${initialView}:${initialDays}:${toScheduleDateKey(initialAnchorDate)}`,
    [initialAnchorDate, initialDays, initialView],
  );

  const handleStateChange = useCallback(
    (state: { days: number; view: CalendarView; anchorDate: Date }) => {
      const path = buildSchedulePath(state.view, state.anchorDate);

      // Only keep secondary/filter query params
      const next = new URLSearchParams(searchParams);
      // Remove legacy keys that no longer belong in query params
      next.delete('tab');
      next.delete('view');
      next.delete('date');

      if (state.view === 'agenda' && state.days !== DEFAULT_DAYS) {
        next.set('days', String(state.days));
      } else {
        next.delete('days');
      }

      const qs = next.toString();
      const fullPath = qs ? `${path}?${qs}` : path;
      navigate(fullPath, { replace: true });
    },
    [navigate, searchParams],
  );

  const {
    scopeType,
    scopeId,
    scopeIds,
    scopeTree,
    testMode,
    headerActions: scopeHeaderActions,
  } = useScheduleScopeControls({
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
      scopeIds={scopeIds}
      testMode={testMode}
      initialView={initialView}
      initialDays={initialDays}
      initialAnchorDate={initialAnchorDate}
      providerKey={providerKey}
      onStateChange={handleStateChange}
      renderDayView={(props) => (
        <ScheduleDayPlan
          viewerRole={viewerRole}
          scopeType={props.scopeType}
          scopeId={props.scopeId}
          scopeIds={props.scopeIds}
          testMode={props.testMode}
          scopeTree={scopeTree}
        />
      )}
    />
  );
}

export default ScheduleTab;
