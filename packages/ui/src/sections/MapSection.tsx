/**
 * MapSection - Embedded map display for static tracking
 *
 * Uses an iframe embed URL to avoid API keys for MVP.
 */

import React from 'react';
import styles from './Section.module.css';

export interface MapSectionProps {
  title?: string;
  mapUrl: string;
  mapLink?: string;
  caption?: string;
  height?: number;
}

export function MapSection({ title, mapUrl, mapLink, caption, height = 260 }: MapSectionProps) {
  return (
    <section className={styles.section}>
      {title && <h3 className={styles.sectionTitle}>{title}</h3>}
      <div className={styles.mapFrame} style={{ height }}>
        <iframe
          title={title || 'Map'}
          src={mapUrl}
          className={styles.mapIframe}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      {(caption || mapLink) && (
        <div className={styles.mapMeta}>
          {caption && <span className={styles.mapCaption}>{caption}</span>}
          {mapLink && (
            <a className={styles.mapLink} href={mapLink} target="_blank" rel="noreferrer">
              Open in Maps
            </a>
          )}
        </div>
      )}
    </section>
  );
}

export default MapSection;
