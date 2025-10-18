import React from 'react';
import { formatStatus, getStatusColors } from '../utils/formatters';

export interface StatusBadgeProps {
  status: string | null | undefined;
  variant?: 'badge' | 'pill';
  className?: string;
}

/**
 * StatusBadge - Centralized status badge component
 *
 * Displays status with consistent colors across all views.
 * Uses getStatusColors() for centralized color logic.
 * Handles compound statuses like "pending_warehouse", "pending_manager", etc.
 *
 * @param status - The status string (e.g., "pending_warehouse", "approved", "cancelled")
 * @param variant - Visual style: "badge" (rounded corners) or "pill" (fully rounded)
 * @param className - Optional additional CSS classes
 */
export function StatusBadge({ status, variant = 'badge', className = '' }: StatusBadgeProps) {
  if (!status) return null;

  const colors = getStatusColors(status);
  const text = formatStatus(status);

  const baseStyles: React.CSSProperties = {
    display: 'inline-block',
    padding: variant === 'pill' ? '4px 12px' : '4px 12px',
    borderRadius: variant === 'pill' ? '9999px' : '4px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    backgroundColor: colors.bg,
    color: colors.fg,
    flexShrink: 0,
  };

  return (
    <span style={baseStyles} className={className}>
      {text}
    </span>
  );
}

export default StatusBadge;
