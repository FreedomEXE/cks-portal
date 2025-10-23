/**
 * HistoryTab - Universal Entity Lifecycle Timeline
 *
 * Displays chronological history of entity lifecycle events.
 * Works for ANY entity type (orders, reports, services, etc.)
 *
 * Usage:
 * ```tsx
 * <HistoryTab
 *   entityType="order"
 *   entityId="PO-001"
 * />
 * ```
 */

import React, { useEffect, useState } from 'react';

interface LifecycleEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  actor: string | null;
  actorRole: string | null;
  reason: string | null;
  metadata: Record<string, any>;
}

export interface HistoryTabProps {
  /** Entity type (order, report, service, etc.) */
  entityType: string;

  /** Entity ID */
  entityId: string;

  /** Optional limit for number of events to display */
  limit?: number;
}

/**
 * Format ISO timestamp to human-readable format
 */
function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Get color for event type badge
 */
function getEventColor(type: string): { bg: string; text: string } {
  if (type.includes('created')) return { bg: '#dbeafe', text: '#1e40af' };
  if (type.includes('archived')) return { bg: '#f3f4f6', text: '#6b7280' };
  if (type.includes('restored')) return { bg: '#d1fae5', text: '#065f46' };
  if (type.includes('deleted') || type.includes('hard_deleted')) return { bg: '#fee2e2', text: '#991b1b' };
  if (type.includes('approved') || type.includes('accepted')) return { bg: '#d1fae5', text: '#065f46' };
  if (type.includes('rejected') || type.includes('cancelled')) return { bg: '#fef3c7', text: '#92400e' };
  return { bg: '#f3f4f6', text: '#374151' };
}

/**
 * Format event type for display (remove entity prefix, capitalize)
 */
function formatEventType(type: string): string {
  // Remove entity prefix (e.g., "order_created" → "created")
  const parts = type.split('_');
  if (parts.length > 1) {
    parts.shift(); // Remove first part (entity type)
  }
  const cleaned = parts.join(' ');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function HistoryTab({ entityType, entityId, limit }: HistoryTabProps) {
  const [events, setEvents] = useState<LifecycleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const url = `/api/activity/entity/${entityType}/${entityId}${limit ? `?limit=${limit}` : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch history: ${response.statusText}`);
        }

        const data = await response.json();

        if (cancelled) return;

        if (data.success && Array.isArray(data.data)) {
          setEvents(data.data);
        } else {
          throw new Error('Invalid response format');
        }

        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error('[HistoryTab] Failed to fetch history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load history');
        setIsLoading(false);
      }
    };

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [entityType, entityId, limit]);

  if (isLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
        Loading history...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#dc2626' }}>
        Error: {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
        No lifecycle events found for this {entityType}.
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 24px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#111827' }}>
        Lifecycle Timeline
      </h3>

      <div style={{ position: 'relative' }}>
        {/* Timeline line */}
        <div
          style={{
            position: 'absolute',
            left: '11px',
            top: '12px',
            bottom: '12px',
            width: '2px',
            backgroundColor: '#e5e7eb',
          }}
        />

        {/* Timeline events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {events.map((event, index) => {
            const color = getEventColor(event.type);
            const formattedType = formatEventType(event.type);

            return (
              <div key={event.id || index} style={{ position: 'relative', paddingLeft: '36px' }}>
                {/* Timeline dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: '0',
                    top: '4px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: color.bg,
                    border: `3px solid ${color.text}`,
                  }}
                />

                {/* Event card */}
                <div
                  style={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '12px',
                  }}
                >
                  {/* Event header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: color.bg,
                        color: color.text,
                      }}
                    >
                      {formattedType}
                    </span>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>

                  {/* Event description */}
                  {event.description && (
                    <div style={{ fontSize: '14px', color: '#374151', marginBottom: '6px' }}>
                      {event.description}
                    </div>
                  )}

                  {/* Event metadata */}
                  <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {event.actor && (
                      <span>
                        <strong>By:</strong> {event.actor}
                        {event.actorRole && ` (${event.actorRole})`}
                      </span>
                    )}
                    {event.reason && (
                      <span>
                        <strong>Reason:</strong> {event.reason}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HistoryTab;
