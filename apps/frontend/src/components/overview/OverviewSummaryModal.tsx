import React from 'react';
import { BaseViewModal, EntityHeaderCard } from '@cks/ui';

export interface OverviewSummaryItem {
  primary: string;
  secondary?: string;
  meta?: string;
}

export interface OverviewSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  items: OverviewSummaryItem[];
  emptyMessage?: string;
  accentColor?: string;
}

const COLOR_MAP: Record<string, string> = {
  blue: '#3b82f6',
  green: '#10b981',
  purple: '#8b5cf6',
  orange: '#f97316',
  red: '#ef4444',
  yellow: '#eab308',
  gray: '#6b7280',
  black: '#111827',
};

export default function OverviewSummaryModal({
  isOpen,
  onClose,
  title,
  subtitle,
  items,
  emptyMessage = 'No details to show.',
  accentColor = '#3b82f6',
}: OverviewSummaryModalProps) {
  const resolvedAccent = COLOR_MAP[accentColor] || accentColor;

  return (
    <BaseViewModal
      isOpen={isOpen}
      onClose={onClose}
      accentColor={resolvedAccent}
      card={(
        <EntityHeaderCard
          id={title}
          typeLabel="OVERVIEW"
          name={subtitle}
          accentColor={resolvedAccent}
        />
      )}
    >
      <div style={{ padding: '4px 4px 16px' }}>
        {items.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: 14 }}>{emptyMessage}</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {items.map((item, index) => (
              <div
                key={`${item.primary}-${index}`}
                className="ui-card"
                style={{
                  padding: 14,
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{item.primary}</div>
                  {item.secondary && (
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{item.secondary}</div>
                  )}
                </div>
                {item.meta && (
                  <div style={{ fontSize: 12, color: '#4b5563', marginLeft: 'auto' }}>{item.meta}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </BaseViewModal>
  );
}
