/**
 * AvailabilitySection - Timezone/Days/Window display
 *
 * Displays availability windows for orders and services.
 * Formats timezone and time windows consistently.
 */

import React from 'react';
import styles from './Section.module.css';
import { formatTimezone } from '../utils/formatters';

export interface AvailabilitySectionProps {
  title?: string;
  availability: {
    tz?: string | null;
    days?: string[];
    window?: { start: string; end: string } | null;
  };
}

export function AvailabilitySection({ title = 'Availability', availability }: AvailabilitySectionProps) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.label}>Timezone</label>
          <div className={styles.value}>
            {availability.tz ? formatTimezone(availability.tz) : '-'}
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Days</label>
          <div className={styles.value}>
            {availability.days && availability.days.length > 0
              ? availability.days.join(', ')
              : '-'}
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Window</label>
          <div className={styles.value}>
            {availability.window
              ? `${availability.window.start} - ${availability.window.end}`
              : '-'}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AvailabilitySection;
