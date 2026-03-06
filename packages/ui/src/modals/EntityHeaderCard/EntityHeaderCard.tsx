/**
 * EntityHeaderCard - Standardized Modal Header
 *
 * Universal header card for all entity modals.
 * Displays entity ID, type label, name, and optional status.
 *
 * Usage:
 * ```tsx
 * <EntityHeaderCard
 *   id="MGR-012"
 *   typeLabel="MANAGER"
 *   name="Jane Doe"
 *   accentColor="#3b82f6"
 *   status={{ value: 'active', text: 'ACTIVE' }}
 * />
 * ```
 */

import React from 'react';
import styles from './EntityHeaderCard.module.css';

export interface EntityHeaderCardProps {
  /** Entity ID (e.g., "MGR-012", "ORD-100") */
  id: string;

  /** Type label in grey uppercase (e.g., "MANAGER", "ORDER") */
  typeLabel: string;

  /** Optional name to display */
  name?: string;

  /** Accent color for top border/accent bar */
  accentColor: string;

  /** Optional status badge */
  status?: {
    value: string;
    text?: string;
  };

  /** Optional image URL to display as a thumbnail */
  imageUrl?: string;

  /** Optional additional content slot */
  children?: React.ReactNode;
}

export function EntityHeaderCard({
  id,
  typeLabel,
  name,
  accentColor,
  status,
  imageUrl,
  children,
}: EntityHeaderCardProps) {
  const [imgError, setImgError] = React.useState(false);
  const showImage = !!imageUrl && !imgError;

  return (
    <div className={styles.card}>
      {/* Accent bar at top */}
      <div
        className={styles.accentBar}
        style={{ backgroundColor: accentColor }}
      />

      {/* Header content */}
      <div className={styles.content}>
        {/* ID and Type Label row */}
        <div className={styles.topRow}>
          <div className={styles.idGroup}>
            <span className={styles.id}>{id}</span>
            <span className={styles.typeLabel}>{typeLabel}</span>
          </div>

          {/* Status badge (if provided) */}
          {status && (
            <div
              className={styles.statusBadge}
              data-status={status.value}
            >
              {status.text || status.value.toUpperCase()}
            </div>
          )}
        </div>

        {/* Image + Name row (if image provided) */}
        {showImage ? (
          <div className={styles.imageRow}>
            <img
              src={imageUrl}
              alt={name || id}
              className={styles.thumbnail}
              onError={() => setImgError(true)}
            />
            <div className={styles.imageRowText}>
              {name && <div className={styles.name}>{name}</div>}
            </div>
          </div>
        ) : (
          /* Name only (no image) */
          name && <div className={styles.name}>{name}</div>
        )}

        {/* Additional content slot */}
        {children}
      </div>
    </div>
  );
}

export default EntityHeaderCard;
