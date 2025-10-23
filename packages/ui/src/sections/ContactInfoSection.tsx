/**
 * ContactInfoSection - Name/Address/Phone/Email display
 *
 * Standardized contact information layout.
 * Used for requestors, destinations, service providers, etc.
 */

import React from 'react';
import styles from './Section.module.css';

export interface ContactInfoSectionProps {
  title?: string;
  contact: {
    name?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  };
}

export function ContactInfoSection({ title, contact }: ContactInfoSectionProps) {
  return (
    <section className={styles.section}>
      {title && <h3 className={styles.sectionTitle}>{title}</h3>}
      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <div className={styles.value}>{contact.name || '-'}</div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Address</label>
          <div className={styles.value}>{contact.address || '-'}</div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Phone</label>
          <div className={styles.value}>{contact.phone || '-'}</div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <div className={styles.value}>{contact.email || '-'}</div>
        </div>
      </div>
    </section>
  );
}

export default ContactInfoSection;
