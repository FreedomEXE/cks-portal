/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: MemosPreview.tsx
 *
 * Description:
 * Memos/Mail preview widget for dashboard display
 *
 * Responsibilities:
 * - Display memos preview card with empty state
 * - Show mail icon and placeholder text
 * - Provide "View Mailbox" button
 *
 * Role in system:
 * - Used in all role hub dashboards to show memos preview
 *
 * Notes:
 * Placeholder component for MVP - functionality to be added later
 * Currently labeled as "Mail" but will transition to "Memos"
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import React from 'react';

export interface MemoItem {
  id: string;
  subject: string;
  date: Date;
}

export interface MemosPreviewProps {
  title?: string;
  items?: MemoItem[];
  onViewAll?: () => void;
  color?: string;
}

export default function MemosPreview({
  title = 'Memos',
  items = [],
  onViewAll,
  color = '#3b7af7'
}: MemosPreviewProps) {
  return (
    <div className="ui-card" style={{ padding: 16 }}>
      <div style={{
        marginBottom: 16,
        color: color,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 14,
        fontWeight: 600
      }}>
        {title}
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📧</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
            No Messages
          </div>
          <div style={{ fontSize: 12 }}>
            Internal messages and notifications will appear here
          </div>
        </div>
      ) : (
        <div style={{ padding: '8px 0' }}>
          {/* Future: Memo items will be displayed here */}
          {items.slice(0, 3).map((item) => (
            <div key={item.id} style={{
              padding: '8px 0',
              borderBottom: '1px solid #f3f4f6',
              fontSize: 13,
              color: '#374151'
            }}>
              <div style={{ fontWeight: 500 }}>{item.subject}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                {new Date(item.date).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onViewAll}
        style={{
          width: '100%',
          padding: '8px 16px',
          fontSize: 12,
          backgroundColor: color + '15',
          color: color,
          border: `1px solid ${color}`,
          borderRadius: 4,
          cursor: 'pointer',
          marginTop: 8,
          fontWeight: 500,
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = color + '25';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = color + '15';
        }}
      >
        View Memos
      </button>
    </div>
  );
}