/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: service.ts
 *
 * Description:
 * Calendar service layer for scope-aware read access.
 *
 * Responsibilities:
 * - Resolve viewer scope using the existing hub scope graph
 * - Delegate event, agenda, and summary reads to the calendar store
 *
 * Role in system:
 * - Used by calendar routes to keep RBAC logic centralized
 *
 * Notes:
 * - Reuses the existing scope domain instead of introducing parallel RBAC
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import type { HubRole } from '../profile/types.js';
import { normalizeIdentity } from '../identity/customIdGenerator.js';
import { getRoleScope } from '../scope/service.js';
import { getCalendarEventById, getCalendarSummary, listCalendarAgenda, listCalendarEvents } from './store.js';
import type {
  CalendarAgendaDay,
  CalendarAgendaQuery,
  CalendarEventRecord,
  CalendarEventsQuery,
  CalendarSummary,
  CalendarTestMode,
} from './types.js';

function isCalendarInfraUnavailable(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const code = 'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
  return code === '42P01' || code === '42703';
}

function collectScopeIds(value: unknown, ids: Set<string>, parentKey?: string): void {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach((item) => collectScopeIds(item, ids, parentKey));
    return;
  }
  if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, nestedValue]) => {
      collectScopeIds(nestedValue, ids, key);
    });
    return;
  }
  if (typeof value !== 'string' || !parentKey) {
    return;
  }
  const normalizedKey = parentKey.toLowerCase();
  if (normalizedKey === 'id' || normalizedKey.endsWith('id')) {
    const normalized = normalizeIdentity(value);
    if (normalized) {
      ids.add(normalized);
    }
  }
}

async function resolveAccessibleIds(viewerRole: HubRole, viewerCode: string | null): Promise<string[] | undefined> {
  if (viewerRole === 'admin') {
    return undefined;
  }
  const normalizedViewerCode = normalizeIdentity(viewerCode ?? null);
  if (!normalizedViewerCode) {
    return undefined;
  }
  const ids = new Set<string>([normalizedViewerCode]);
  const scope = await getRoleScope(viewerRole, normalizedViewerCode);
  if (scope) {
    ids.add(scope.cksCode);
    collectScopeIds(scope.relationships, ids);
  }
  return Array.from(ids);
}

function deriveTestMode(
  viewerRole: HubRole,
  viewerCode: string | null,
  requestedMode: CalendarTestMode | undefined,
): CalendarTestMode {
  if (viewerRole === 'admin') {
    return requestedMode ?? 'exclude';
  }
  const normalizedViewerCode = normalizeIdentity(viewerCode ?? null);
  return normalizedViewerCode?.includes('-TEST') ? 'only' : 'exclude';
}

export async function fetchCalendarEvents(input: CalendarEventsQuery): Promise<CalendarEventRecord[]> {
  try {
    return await listCalendarEvents({
      ...input,
      testMode: deriveTestMode(input.viewerRole, input.viewerCode, input.testMode),
      accessibleIds: await resolveAccessibleIds(input.viewerRole, input.viewerCode),
    });
  } catch (error) {
    if (isCalendarInfraUnavailable(error)) {
      return [];
    }
    throw error;
  }
}

export async function fetchCalendarEventById(input: {
  eventId: string;
  viewerRole: HubRole;
  viewerCode: string | null;
}): Promise<CalendarEventRecord | null> {
  try {
    return await getCalendarEventById({
      ...input,
      accessibleIds: await resolveAccessibleIds(input.viewerRole, input.viewerCode),
    });
  } catch (error) {
    if (isCalendarInfraUnavailable(error)) {
      return null;
    }
    throw error;
  }
}

export async function fetchCalendarAgenda(input: CalendarAgendaQuery): Promise<CalendarAgendaDay[]> {
  try {
    return await listCalendarAgenda({
      ...input,
      testMode: deriveTestMode(input.viewerRole, input.viewerCode, input.testMode),
      accessibleIds: await resolveAccessibleIds(input.viewerRole, input.viewerCode),
    });
  } catch (error) {
    if (isCalendarInfraUnavailable(error)) {
      return [];
    }
    throw error;
  }
}

export async function fetchCalendarSummary(input: CalendarAgendaQuery): Promise<CalendarSummary> {
  try {
    return await getCalendarSummary({
      ...input,
      testMode: deriveTestMode(input.viewerRole, input.viewerCode, input.testMode),
      accessibleIds: await resolveAccessibleIds(input.viewerRole, input.viewerCode),
    });
  } catch (error) {
    if (isCalendarInfraUnavailable(error)) {
      return {
        total: 0,
        scheduled: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
      };
    }
    throw error;
  }
}
