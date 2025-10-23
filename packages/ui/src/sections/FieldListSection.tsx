/**
 * FieldListSection - Vertical list of label/value pairs
 *
 * Simple, vertical layout for key-value metadata.
 * Common for most entity detail views.
 */

import React from 'react';
import styles from './Section.module.css';

export interface FieldListSectionProps {
  title?: string;
  fields: Array<{
    label: string;
    value: string | React.ReactNode;
  }>;
}

export function FieldListSection({ title, fields }: FieldListSectionProps) {
  return (
    <section className={styles.section}>
      {title && <h3 className={styles.sectionTitle}>{title}</h3>}
      <div className={styles.fieldList}>
        {fields.map((field, idx) => (
          <div key={idx} className={styles.fieldItem}>
            <label className={styles.fieldLabel}>{field.label}</label>
            <div className={styles.fieldValue}>{field.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FieldListSection;
