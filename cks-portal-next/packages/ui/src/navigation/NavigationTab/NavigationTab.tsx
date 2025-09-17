/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: NavigationTab.tsx
 *
 * Description:
 * Individual navigation tab component
 *
 * Responsibilities:
 * - Render individual tab button
 * - Handle active state styling
 * - Display optional count badge
 * - Manage hover and disabled states
 *
 * Role in system:
 * - Reusable tab component for navigation systems
 *
 * Notes:
 * Can be composed within TabContainer for full navigation
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import React from 'react';

export interface NavigationTabProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  count?: number;
  disabled?: boolean;
  variant?: 'default' | 'pills' | 'underline';
  activeColor?: string;
}

export function NavigationTab({
  label,
  isActive = false,
  onClick,
  count,
  disabled = false,
  variant = 'default',
  activeColor = '#eab308'
}: NavigationTabProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const getTabStyles = () => {
    const baseStyles: React.CSSProperties = {
      position: 'relative',
      padding: variant === 'pills' ? '8px 16px' : '10px 16px',
      fontSize: '14px',
      fontWeight: isActive ? '600' : '400',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      userSelect: 'none',
      opacity: disabled ? 0.5 : 1,
      border: 'none',
      background: 'transparent',
      fontFamily: 'inherit'
    };

    if (variant === 'pills') {
      return {
        ...baseStyles,
        padding: '8px 16px',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
        backgroundColor: isActive ? activeColor : isHovered && !disabled ? '#f3f4f6' : 'white',
        color: isActive ? '#ffffff' : disabled ? '#9ca3af' : '#111827',
        fontSize: '14px',
        fontWeight: '600'
      };
    }

    if (variant === 'underline') {
      return {
        ...baseStyles,
        borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
        color: isActive ? '#3b82f6' : disabled ? '#9ca3af' : isHovered && !disabled ? '#1f2937' : '#6b7280',
        paddingBottom: '12px'
      };
    }

    // default variant
    return {
      ...baseStyles,
      backgroundColor: isActive ? '#f3f4f6' : isHovered && !disabled ? '#f9fafb' : 'transparent',
      color: isActive ? '#1f2937' : disabled ? '#9ca3af' : '#4b5563',
      borderRadius: '4px'
    };
  };

  const badgeStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '20px',
    height: '20px',
    padding: '0 6px',
    fontSize: '11px',
    fontWeight: '600',
    borderRadius: '10px',
    backgroundColor: isActive ?
      (variant === 'pills' ? 'rgba(255,255,255,0.2)' : '#3b82f6') :
      '#e5e7eb',
    color: isActive ?
      (variant === 'pills' ? '#ffffff' : '#ffffff') :
      '#4b5563'
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <button
      style={getTabStyles()}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      type="button"
      aria-pressed={isActive}
      aria-disabled={disabled}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span style={badgeStyles}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

export default NavigationTab;