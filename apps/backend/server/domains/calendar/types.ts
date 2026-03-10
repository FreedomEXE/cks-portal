/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: types.ts
 *
 * Description:
 * Calendar domain types shared across routes, service, and store layers.
 *
 * Responsibilities:
 * - Define read-model event shapes
 * - Define query contracts and projection input types
 *
 * Role in system:
 * - Shared by the calendar domain implementation
 *
 * Notes:
 * - Source domains remain authoritative for write semantics
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import type { HubRole } from '../profile/types.js';

export type CalendarScopeType = 'user' | 'center' | 'service' | 'crew' | 'order' | 'warehouse';

export interface CalendarEventParticipant {
  participantId: string;
  participantRole: string;
  participationType: string;
  notify: boolean;
}

export interface CalendarEventRecord {
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
  participants: CalendarEventParticipant[];
}

export interface CalendarAgendaDay {
  date: string;
  label: string;
  events: CalendarEventRecord[];
}

export interface CalendarSummary {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export interface CalendarEventsQuery {
  viewerRole: HubRole;
  viewerCode: string | null;
  accessibleIds?: string[];
  start: string;
  end: string;
  scopeType?: CalendarScopeType;
  scopeId?: string;
  eventTypes?: string[] | string;
  statuses?: string[] | string;
  limit?: number;
}

export interface CalendarAgendaQuery {
  viewerRole: HubRole;
  viewerCode: string | null;
  accessibleIds?: string[];
  start?: string;
  end?: string;
  days?: number;
  scopeType?: CalendarScopeType;
  scopeId?: string;
  limit?: number;
}

export interface CalendarProjectionParticipant {
  participantId: string;
  participantRole: string;
  participationType?: string;
  notify?: boolean;
}

export interface UpsertCalendarProjectionInput {
  generatorKey: string;
  eventType: string;
  eventCategory: string | null;
  title: string;
  description?: string | null;
  plannedStartAt: string;
  plannedEndAt?: string | null;
  actualStartAt?: string | null;
  actualEndAt?: string | null;
  allDay?: boolean;
  timezone?: string;
  status: string;
  priority?: string;
  sourceType: string;
  sourceId: string;
  sourceAction?: string | null;
  centerId?: string | null;
  warehouseId?: string | null;
  locationName?: string | null;
  locationAddress?: string | null;
  metadata?: Record<string, unknown>;
  tags?: string[];
  createdBy?: string;
  createdByRole?: string;
  updatedBy?: string | null;
  sourceVersion?: string | null;
  sourceHash?: string | null;
  participants?: CalendarProjectionParticipant[];
}
