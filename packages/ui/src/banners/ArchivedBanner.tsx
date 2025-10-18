/**
 * ArchivedBanner Component
 *
 * Shows at the top of modals/views to indicate an entity was archived.
 * Displays archive timestamp, actor, and scheduled deletion date.
 *
 * Usage:
 * ```tsx
 * {archiveMetadata && (
 *   <ArchivedBanner
 *     archivedAt={archiveMetadata.archivedAt}
 *     archivedBy={archiveMetadata.archivedBy}
 *     reason={archiveMetadata.reason}
 *     scheduledDeletion={archiveMetadata.scheduledDeletion}
 *     entityType="order"
 *     entityId={order.orderId}
 *   />
 * )}
 * ```
 */

import React from 'react';

export interface ArchivedBannerProps {
  /** ISO timestamp of archive action */
  archivedAt?: string;

  /** User/actor who archived the entity */
  archivedBy?: string;

  /** Optional reason for archiving */
  reason?: string;

  /** ISO timestamp when entity will be permanently deleted */
  scheduledDeletion?: string;

  /** Entity type (order, service, user, etc.) */
  entityType?: string;

  /** Entity ID */
  entityId?: string;

  /** Optional custom message */
  message?: string;
}

export function ArchivedBanner({
  archivedAt,
  archivedBy,
  reason,
  scheduledDeletion,
  entityType = 'entity',
  entityId,
  message,
}: ArchivedBannerProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown date';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formattedArchiveDate = formatDate(archivedAt);
  const formattedDeletionDate = formatDate(scheduledDeletion);
  const actorDisplay = archivedBy || 'Unknown user';

  const defaultMessage = `This ${entityType} has been archived and is scheduled for deletion.`;

  return (
    <div
      style={{
        backgroundColor: '#f3f4f6',
        borderLeft: '4px solid #9ca3af',
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
              d="M5 3C5 2.44772 5.44772 2 6 2H14C14.5523 2 15 2.44772 15 3V4H17C17.5523 4 18 4.44772 18 5C18 5.55228 17.5523 6 17 6H16V16C16 17.1046 15.1046 18 14 18H6C4.89543 18 4 17.1046 4 16V6H3C2.44772 6 2 5.55228 2 5C2 4.44772 2.44772 4 3 4H5V3Z"
              stroke="#6b7280"
              strokeWidth="1.5"
              fill="none"
            />
            <path d="M8 8V14M12 8V14" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 600,
              color: '#374151',
              marginBottom: '4px',
              fontSize: '14px',
            }}
          >
            Archived {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </div>

          <div style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.5' }}>
            {message || defaultMessage}
          </div>

          {reason && (
            <div
              style={{
                color: '#6b7280',
                fontSize: '13px',
                marginTop: '6px',
                fontStyle: 'italic',
              }}
            >
              <span style={{ fontWeight: 500 }}>Reason:</span> {reason}
            </div>
          )}

          <div
            style={{
              color: '#4b5563',
              fontSize: '12px',
              marginTop: '8px',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <span style={{ fontWeight: 500 }}>Archived:</span>{' '}
              <span>{formattedArchiveDate}</span>
            </div>
            <div>
              <span style={{ fontWeight: 500 }}>By:</span>{' '}
              <span>{actorDisplay}</span>
            </div>
            {scheduledDeletion && (
              <div>
                <span style={{ fontWeight: 500 }}>Scheduled Deletion:</span>{' '}
                <span>{formattedDeletionDate}</span>
              </div>
            )}
            {entityId && (
              <div>
                <span style={{ fontWeight: 500 }}>ID:</span>{' '}
                <span style={{ fontFamily: 'monospace' }}>{entityId}</span>
              </div>
            )}
          </div>

          {scheduledDeletion && (
            <div
              style={{
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#e5e7eb',
                borderRadius: '3px',
                fontSize: '12px',
                color: '#374151',
              }}
            >
              <strong>Note:</strong> This {entityType} will be permanently deleted on{' '}
              {formattedDeletionDate} unless restored.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
