/**
 * NotesSection - Notes with optional metadata
 *
 * For cancellation reasons, rejection notes, special instructions, etc.
 * Optionally displays author and timestamp.
 */

import React from 'react';
import styles from './Section.module.css';

export interface NotesSectionProps {
  title?: string;
  content: string;
  author?: string;
  timestamp?: string;
}

export function NotesSection({ title, content, author, timestamp }: NotesSectionProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  return (
    <section className={styles.section}>
      {title && <h3 className={styles.sectionTitle}>{title}</h3>}
      <div className={styles.notes}>{content}</div>
      {(author || timestamp) && (
        <div className={styles.notesMetadata}>
          {author && <span className={styles.notesAuthor}>By: {author}</span>}
          {timestamp && <span className={styles.notesTimestamp}>On: {formatDate(timestamp)}</span>}
        </div>
      )}
    </section>
  );
}

export default NotesSection;
