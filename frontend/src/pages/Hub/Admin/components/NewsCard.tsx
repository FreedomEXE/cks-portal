/**
 * File: NewsCard.tsx
 *
 * Description:
 *   Small card component for News & Updates entries.
 *
 * Functionality:
 *   Displays a title and optional date in a styled row.
 *
 * Importance:
 *   Used in Admin hub’s News & Updates section.
 *
 * Connections:
 *   Consumed within AdminHub.
 */

/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import React from 'react';

export default function NewsCard({ title, date }: { title: string; date?: string; }) {
  return (
    <div className="ui-card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <div className="title" style={{ fontSize: 18 }}>{title}</div>
      {date && <div style={{ color: '#6b7280', fontSize: 13 }}>{date}</div>}
    </div>
  );
}
