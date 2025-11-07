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
 *   getAuthToken={() => clerk.session.getToken()}  // Optional auth
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

  /** Optional pre-loaded events (if provided, skips API fetch) */
  events?: LifecycleEvent[];

  /** Optional function to get auth token for API calls */
  getAuthToken?: () => Promise<string | null>;
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
  // Important: check decertified before certified because "decertified" contains "certified"
  if (type.includes('decertified')) return { bg: '#fef3c7', text: '#92400e' };
  if (type.includes('certified')) return { bg: '#d1fae5', text: '#065f46' };
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

// Strip leading verb for timeline descriptions
function stripLeadingVerb(description: string): string {
  const verbs = [
    'Created', 'Seeded', 'Archived', 'Restored', 'Deleted', 'Completed',
    'Cancelled', 'Delivered', 'Accepted', 'Approved', 'Rejected', 'Failed',
    'Updated', 'Certified', 'Uncertified', 'Assigned'
  ];
  // Try multi-word first (e.g., Hard Deleted) if ever added
  const multi = /^(Hard Deleted)\s+(.+)$/i;
  const m = description.match(multi);
  if (m) return m[2];
  for (const v of verbs) {
    const re = new RegExp('^' + v + '\\s+(.+)$');
    const mm = description.match(re);
    if (mm) return mm[1];
  }
  return description;
}

// For created-type events, prefer showing just the final ID token
function extractLastIdToken(description: string): string | null {
  const match = description.match(/([A-Z]{2,}-\d+)/gi);
  if (!match || match.length === 0) return null;
  return match[match.length - 1];
}

function extractFirstIdToken(description: string): string | null {
  const match = description.match(/([A-Z]{2,}-\d+)/i);
  return match ? match[1].toUpperCase() : null;
}

// Compute the ID-only timeline description for an event.
function computeTimelineText(event: LifecycleEvent, fallbackEntityId?: string): string {
  const type = event.type || '';
  const metadata = (event.metadata || {}) as Record<string, any>;
  const stripped = stripLeadingVerb(event.description || '');

  // Assignment shapes
  if (type === 'crew_assigned_to_center') {
    const a = (metadata.crewId as string) || extractFirstIdToken(stripped);
    const b = (metadata.centerId as string) || extractLastIdToken(stripped);
    if (a && b) return `${a} to ${b}`;
  }
  if (type === 'contractor_assigned_to_manager') {
    const a = (metadata.contractorId as string) || extractFirstIdToken(stripped);
    const b = (metadata.managerId as string) || extractLastIdToken(stripped);
    if (a && b) return `${a} to ${b}`;
  }
  if (type === 'customer_assigned_to_contractor') {
    const a = (metadata.customerId as string) || extractFirstIdToken(stripped);
    const b = (metadata.contractorId as string) || extractLastIdToken(stripped);
    if (a && b) return `${a} to ${b}`;
  }
  if (type === 'center_assigned_to_customer') {
    const a = (metadata.centerId as string) || extractFirstIdToken(stripped);
    const b = (metadata.customerId as string) || extractLastIdToken(stripped);
    if (a && b) return `${a} to ${b}`;
  }
  if (type === 'order_assigned_to_warehouse') {
    const a = extractFirstIdToken(stripped); // order id may be in description
    const b = (metadata.warehouseId as string) || extractLastIdToken(stripped);
    if (a && b) return `${a} to ${b}`;
  }

  // Certifications
  if (type === 'catalog_service_certified' || type === 'catalog_service_decertified') {
    const userId = (metadata.userId as string) || extractFirstIdToken(stripped);
    const serviceId = extractLastIdToken(stripped) || (fallbackEntityId || null);
    if (userId && serviceId) return `${userId} for ${serviceId}`;
  }

  // Generic lifecycle/status: prefer ID from description, but avoid mixing catalog vs instance IDs
  const last = extractLastIdToken(stripped);
  const first = extractFirstIdToken(stripped);
  let extracted = last || first || null;

  const fb = (fallbackEntityId || '').toUpperCase();
  if (fb) {
    // If fallback looks like a scoped service (CEN-XXX-SRV-###) but extracted is unscoped SRV-###, prefer fallback
    const fallbackIsScopedService = /-[A-Z]{3}-\d{3}-SRV-\d+$/i.test(fb) || /^(?:[A-Z]{3}-\d{3}-)SRV-\d+$/i.test(fb);
    const extractedIsCatalogService = !!(extracted && /^SRV-\d+$/i.test(extracted));
    if (fallbackIsScopedService && extractedIsCatalogService) {
      return fb;
    }
  }

  return extracted || fb || '';
}

/**
 * Format actor display for event metadata
 * Admin → "Admin"
 * User with ID → "MGR-012" (uppercase)
 * User without ID → "Manager" (title-cased role)
 * No info → "System"
 */
function formatActor(actorId?: string | null, actorRole?: string | null): string {
  const role = (actorRole || '').trim().toLowerCase();
  const id = (actorId || '').trim();

  if (role === 'admin') return 'Admin';
  if (id) return id.toUpperCase();
  if (role) return role.charAt(0).toUpperCase() + role.slice(1);
  return 'System';
}

export function HistoryTab({ entityType, entityId, limit, events: providedEvents, getAuthToken }: HistoryTabProps) {
  const [fetchedEvents, setFetchedEvents] = useState<LifecycleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(!providedEvents);
  const [error, setError] = useState<string | null>(null);

  // Use provided events if available, otherwise use fetched events
  const rawEvents = providedEvents || fetchedEvents;

  // Sort events descending by timestamp (newest → oldest)
  const events = [...rawEvents].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  useEffect(() => {
    // Skip fetch if events were provided
    if (providedEvents) {
      return;
    }

    let cancelled = false;

    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const url = `/api/activity/entity/${entityType}/${entityId}${limit ? `?limit=${limit}` : ''}`;

        // Build fetch options with auth if available
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (getAuthToken) {
          try {
            const token = await getAuthToken();
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
          } catch (authErr) {
            console.warn('[HistoryTab] Failed to get auth token:', authErr);
          }
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
          throw new Error(`Failed to fetch history: ${response.statusText}`);
        }

        const data = await response.json();

        if (cancelled) return;

        if (data.success && Array.isArray(data.data)) {
          setFetchedEvents(data.data);
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
  }, [entityType, entityId, limit, providedEvents, getAuthToken]);

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
            const isCreated = /_created$/i.test(event.type);
            let badgeLabel = (isCreated && (event.metadata?.origin === 'seed')) ? 'Seeded' : formattedType;
            // Normalize assignment/certification labels
            if (/_assigned_/.test(event.type)) {
              badgeLabel = 'Assigned';
            } else if (/decertified$/.test(event.type)) {
              badgeLabel = 'Uncertified';
            } else if (/certified$/.test(event.type)) {
              badgeLabel = 'Certified';
            }

            // Compute timeline display description
            const displayDescription = computeTimelineText(event, entityId);

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
                      {badgeLabel}
                    </span>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>

                  {/* Event description */}
                  {displayDescription && (
                    <div style={{ fontSize: '14px', color: '#374151', marginBottom: '6px' }}>
                      {displayDescription}
                    </div>
                  )}

                  {/* Event metadata */}
                  <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {(event.actor || event.actorRole) && (
                      <span>
                        <strong>By:</strong> {formatActor(event.actor, event.actorRole)}
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
