/**
 * DeletedBanner Component
 *
 * Shows at the top of modals/views to indicate an entity was deleted.
 * Displays deletion timestamp and actor.
 *
 * Usage:
 * ```tsx
 * {order.isDeleted && (
 *   <DeletedBanner
 *     deletedAt={order.deletedAt}
 *     deletedBy={order.deletedBy}
 *     entityType="order"
 *     entityId={order.order_id}
 *   />
 * )}
 * ```
 */

import React from 'react';

export interface DeletedBannerProps {
  /** ISO timestamp of deletion */
  deletedAt?: string;

  /** User/actor who deleted the entity */
  deletedBy?: string;

  /** Entity type (order, service, user, etc.) */
  entityType?: string;

  /** Entity ID */
  entityId?: string;

  /** Optional custom message */
  message?: string;

  /** Minimal tombstone mode (when snapshot is missing) */
  isTombstone?: boolean;
}

export function DeletedBanner({
  deletedAt,
  deletedBy,
  entityType = 'entity',
  entityId,
  message,
  isTombstone = false,
}: DeletedBannerProps) {
  const formattedDate = deletedAt
    ? new Date(deletedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Unknown date';

  const actorDisplay = deletedBy || 'Unknown user';

  const defaultMessage = isTombstone
    ? `This ${entityType} was permanently deleted and detailed data is no longer available.`
    : `This ${entityType} has been permanently deleted from the system.`;

  return (
    <div
      style={{
        backgroundColor: '#fee2e2',
        borderLeft: '4px solid #dc2626',
        padding: '12px 16px',
        marginBottom: '16px',
        borderRadius: '4px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
        {/* Icon */}
        <div
          style={{
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
              stroke="#dc2626"
              strokeWidth="2"
            />
            <path
              d="M10 6V10"
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="10" cy="13" r="1" fill="#dc2626" />
          </svg>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 600,
              color: '#991b1b',
              marginBottom: '4px',
              fontSize: '14px',
            }}
          >
            Deleted {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </div>

          <div style={{ color: '#7f1d1d', fontSize: '13px', lineHeight: '1.5' }}>
            {message || defaultMessage}
          </div>

          <div
            style={{
              color: '#991b1b',
              fontSize: '12px',
              marginTop: '8px',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <span style={{ fontWeight: 500 }}>Deleted:</span>{' '}
              <span>{formattedDate}</span>
            </div>
            <div>
              <span style={{ fontWeight: 500 }}>By:</span>{' '}
              <span>{actorDisplay}</span>
            </div>
            {entityId && (
              <div>
                <span style={{ fontWeight: 500 }}>ID:</span>{' '}
                <span style={{ fontFamily: 'monospace' }}>{entityId}</span>
              </div>
            )}
          </div>

          {isTombstone && (
            <div
              style={{
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#fef2f2',
                borderRadius: '3px',
                fontSize: '12px',
                color: '#7f1d1d',
              }}
            >
              <strong>Note:</strong> This deletion occurred before detailed snapshot
              retention was implemented. Only basic information is available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
