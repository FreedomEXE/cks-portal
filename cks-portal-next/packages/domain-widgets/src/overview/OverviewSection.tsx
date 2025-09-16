/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: OverviewSection.tsx
 *
 * Description:
 * Renders a grid of OverviewCards for overview dashboards
 *
 * Responsibilities:
 * - Map card configurations to OverviewCard components
 * - Handle responsive grid layout
 * - Pass data values to individual cards
 * - Support loading states for all cards
 *
 * Role in system:
 * - Used by all role hubs to display overview metrics
 *
 * Notes:
 * Each hub provides its own card configuration
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import React from 'react';
import OverviewCard from '../../../ui/src/cards/OverviewCard';

export interface CardConfig {
  id: string;
  title: string;
  dataKey: string;
  subtitle?: string;
  color?: string;
  onClick?: () => void;
}

export interface OverviewSectionProps {
  cards: CardConfig[];
  data: Record<string, any>;
  loading?: boolean;
  title?: string;
}

export default function OverviewSection({
  cards,
  data,
  loading = false,
  title = 'Overview'
}: OverviewSectionProps) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{
        fontSize: 20,
        fontWeight: 700,
        color: '#111827',
        marginBottom: 16
      }}>
        {title}
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        maxWidth: '100%'
      }}>
        {cards.map((card) => {
          const value = data[card.dataKey];
          const displayValue = value !== undefined ? value : '-';

          return (
            <OverviewCard
              key={card.id}
              title={card.title}
              value={displayValue}
              subtitle={card.subtitle}
              color={card.color}
              onClick={card.onClick}
              loading={loading}
            />
          );
        })}
      </div>
    </div>
  );
}