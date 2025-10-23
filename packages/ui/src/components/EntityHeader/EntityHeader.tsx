/**
 * EntityHeader - Universal Header for All Entity Modals
 *
 * THE ONLY HEADER component. Used by orders, reports, services, users, etc.
 * Takes a data configuration (HeaderConfig) and renders a consistent layout.
 *
 * Philosophy:
 * - ONE component for all entities
 * - Purely presentational (no state, no tab logic)
 * - Customization via data configuration
 * - Same visual design for consistency
 */

import React from 'react';
import styles from './EntityHeader.module.css';
import StatusBadge from '../../badges/StatusBadge';

export interface HeaderField {
  label: string;
  value: string | React.ReactNode;
}

export interface HeaderConfig {
  id: string;
  type?: string;
  status: string;
  statusText?: string;
  fields: HeaderField[];
  badges?: React.ReactNode[];
}

export interface EntityHeaderProps {
  config: HeaderConfig;
}

/**
 * EntityHeader - Renders entity header from configuration
 *
 * Usage:
 * ```tsx
 * <EntityHeader config={{
 *   id: "PO-001",
 *   type: "Product Order",
 *   status: "pending",
 *   fields: [
 *     { label: "Requested By", value: "John Doe" },
 *     { label: "Destination", value: "Building A" }
 *   ]
 * }} />
 * ```
 */
export function EntityHeader({ config }: EntityHeaderProps) {
  const { id, type, status, statusText, fields, badges } = config;

  return (
    <div className={styles.entityHeader}>
      {/* Header Row: ID + Type + Badges + Status */}
      <div className={styles.headerRow}>
        <div className={styles.entityInfo}>
          <span className={styles.entityId}>{id}</span>
          {type && <span className={styles.entityType}>{type}</span>}
        </div>
        <div className={styles.badgeContainer}>
          {badges?.map((badge, idx) => (
            <React.Fragment key={idx}>{badge}</React.Fragment>
          ))}
          <StatusBadge status={status} variant="badge" />
        </div>
      </div>

      {/* Metadata Fields */}
      {fields.length > 0 && (
        <div className={styles.fieldsContainer}>
          {fields.map((field, idx) => (
            <div key={idx} className={styles.field}>
              <span className={styles.fieldLabel}>{field.label}:</span>
              <span className={styles.fieldValue}>{field.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EntityHeader;
