/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: calendar.ts
 *
 * Description:
 * Frontend API hooks for the read-only calendar surface.
 *
 * Responsibilities:
 * - Define shared calendar DTOs
 * - Fetch agenda and summary data via SWR
 *
 * Role in system:
 * - Used by calendar feature components
 *
 * Notes:
 * - Reuses apiFetch and existing auth token flow
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import useSWR from 'swr';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { apiFetch, type ApiResponse } from './client';

export interface CalendarParticipant {
  participantId: string;
  participantRole: string;
  participationType: string;
  notify: boolean;
}

export interface CalendarEventItem {
  eventId: string;
  eventType: string;
  eventCategory: string | null;
  title: string;
  description: string | null;
  plannedStartAt: string;
  plannedEndAt: string | null;
  actualStartAt: string | null;
  actualEndAt: string | null;
  allDay: boolean;
  timezone: string;
  status: string;
  priority: string;
  sourceType: string;
  sourceId: string;
  sourceAction: string | null;
  centerId: string | null;
  warehouseId: string | null;
  locationName: string | null;
  locationAddress: string | null;
  metadata: Record<string, unknown>;
  tags: string[];
  updatedAt: string;
  version: number;
  openTargetId: string | null;
  openTargetType: string | null;
  participants: CalendarParticipant[];
}

export interface CalendarAgendaDay {
  date: string;
  label: string;
  events: CalendarEventItem[];
}

export interface CalendarSummary {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export interface CalendarQueryRange {
  start?: string;
  end?: string;
  days?: number;
  scopeType?: string;
  scopeId?: string;
  testMode?: 'include' | 'exclude' | 'only';
  limit?: number;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function useCalendarAgenda(days = 14, scopeType?: string, scopeId?: string, testMode?: CalendarQueryRange['testMode']) {
  const { getToken } = useClerkAuth();
  const key = `/calendar/agenda${buildQuery({ days, scopeType, scopeId, testMode })}`;
  return useSWR(key, (path: string) =>
    apiFetch<ApiResponse<CalendarAgendaDay[]>>(path, { getToken }).then((response) => response.data ?? []),
  );
}

export function useCalendarEvents({ start, end, scopeType, scopeId, testMode, limit = 500, enabled = true }: CalendarQueryRange & { enabled?: boolean }) {
  const { getToken } = useClerkAuth();
  const key = enabled ? `/calendar/events${buildQuery({ start, end, scopeType, scopeId, testMode, limit })}` : null;
  return useSWR(key, (path: string) =>
    apiFetch<ApiResponse<CalendarEventItem[]>>(path, { getToken }).then((response) => response.data ?? []),
  );
}

export function useCalendarSummary({ days = 30, start, end, scopeType, scopeId, testMode, limit = 500 }: CalendarQueryRange) {
  const { getToken } = useClerkAuth();
  const key = `/calendar/summary${buildQuery({ days, start, end, scopeType, scopeId, testMode, limit })}`;
  return useSWR(key, (path: string) =>
    apiFetch<ApiResponse<CalendarSummary>>(path, { getToken }).then((response) => response.data),
  );
}
