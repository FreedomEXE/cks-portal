/**
 * KeyValueGridSection - 2-4 column grid of label/value pairs
 *
 * Grid layout for compact display of metadata.
 * More space-efficient than vertical list.
 */

import React from 'react';
import styles from './Section.module.css';

export interface KeyValueGridSectionProps {
  title?: string;
  columns?: 2 | 3 | 4;
  fields: Array<{
    label: string;
    value: string | React.ReactNode;
  }>;
}

export function KeyValueGridSection({ title, columns = 2, fields }: KeyValueGridSectionProps) {
  return (
    <section className={styles.section}>
      {title && <h3 className={styles.sectionTitle}>{title}</h3>}
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }}
      >
        {fields.map((field, idx) => (
          <div key={idx} className={styles.field}>
            <label className={styles.label}>{field.label}</label>
            <div className={styles.value}>{field.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default KeyValueGridSection;
