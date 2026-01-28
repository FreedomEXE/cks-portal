import React from 'react';

export interface OverviewDetailItem {
  primary: string;
  secondary?: string;
  meta?: string;
}

export interface OverviewDetailPanelProps {
  title: string;
  subtitle?: string;
  items: OverviewDetailItem[];
  emptyMessage?: string;
  onClose: () => void;
}

export default function OverviewDetailPanel({
  title,
  subtitle,
  items,
  emptyMessage = 'No details to show.',
  onClose,
}: OverviewDetailPanelProps) {
  return (
    <div
      className="ui-card"
      style={{
        marginTop: 16,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{subtitle}</div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 999,
            padding: '6px 12px',
            background: '#fff',
            color: '#374151',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>

      {items.length === 0 ? (
        <div style={{ color: '#6b7280', fontSize: 13 }}>{emptyMessage}</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item, index) => (
            <li
              key={`${item.primary}-${index}`}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: 8,
                paddingBottom: 10,
                borderBottom: '1px solid #f3f4f6',
              }}
            >
              <div style={{ minWidth: 180 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.primary}</div>
                {item.secondary && (
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{item.secondary}</div>
                )}
              </div>
              {item.meta && (
                <div style={{ fontSize: 12, color: '#4b5563', marginLeft: 'auto' }}>{item.meta}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
