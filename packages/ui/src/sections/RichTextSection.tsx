/**
 * RichTextSection - Text content display
 *
 * Renders plain text or markdown content.
 * Used for descriptions, notes, instructions, etc.
 */

import React from 'react';
import styles from './Section.module.css';

export interface RichTextSectionProps {
  title?: string;
  content: string;
  markdown?: boolean; // Future: support markdown rendering
}

export function RichTextSection({ title, content, markdown = false }: RichTextSectionProps) {
  return (
    <section className={styles.section}>
      {title && <h3 className={styles.sectionTitle}>{title}</h3>}
      <div className={styles.richText}>
        {markdown ? (
          // Future: Add markdown renderer
          <p>{content}</p>
        ) : (
          <p>{content}</p>
        )}
      </div>
    </section>
  );
}

export default RichTextSection;
