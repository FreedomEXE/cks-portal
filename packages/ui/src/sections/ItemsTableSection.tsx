/**
 * ItemsTableSection - Table with columns and rows
 *
 * For displaying lists of items (products, procedures, etc.)
 * Supports custom column definitions.
 */

import React from 'react';
import styles from './Section.module.css';

export interface ItemsTableSectionProps {
  title?: string;
  columns: Array<{
    key: string;
    label: string;
  }>;
  rows: Array<Record<string, string | number | React.ReactNode>>;
}

export function ItemsTableSection({ title, columns, rows }: ItemsTableSectionProps) {
  return (
    <section className={styles.section}>
      {title && <h3 className={styles.sectionTitle}>{title}</h3>}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={col.key}>{row[col.key] ?? '-'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ItemsTableSection;
