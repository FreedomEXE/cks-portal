/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: Button.tsx
 *
 * Description:
 * Reusable button component with multiple variants and sizes
 *
 * Responsibilities:
 * - Provide consistent button styling across the application
 * - Support different visual variants (primary, secondary, danger, etc.)
 * - Handle different sizes for various use cases
 * - Manage hover and disabled states
 *
 * Role in system:
 * - Core UI component used throughout all interfaces
 *
 * Notes:
 * Replaces inline button styles with consistent component
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import React from 'react';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  roleColor?: string; // Optional role-based color for primary variant
}

export default function Button({
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  children,
  type = 'button',
  roleColor,
}: ButtonProps) {
  // Base styles
  const baseStyles: React.CSSProperties = {
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s',
    fontWeight: 600,
    borderRadius: 6,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
  };

  // Size styles
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: '4px 8px',
      fontSize: 12,
    },
    md: {
      padding: '8px 16px',
      fontSize: 14,
    },
    lg: {
      padding: '12px 24px',
      fontSize: 16,
    },
  };

  // Variant styles
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: roleColor || '#3b82f6',
      color: '#ffffff',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: '#374151',
      border: '1px solid #d1d5db',
    },
    danger: {
      backgroundColor: '#ef4444',
      color: '#ffffff',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#374151',
    },
    link: {
      backgroundColor: 'transparent',
      color: '#3b82f6',
      textDecoration: 'underline',
      padding: 0,
      borderRadius: 0,
    },
  };

  // Combine styles
  const combinedStyles = {
    ...baseStyles,
    ...(variant !== 'link' ? sizeStyles[size] : {}),
    ...variantStyles[variant],
  };

  // Handle hover effects
  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    const button = e.currentTarget;
    switch (variant) {
      case 'primary':
        button.style.backgroundColor = roleColor ? shadeColor(roleColor, -20) : '#2563eb';
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        break;
      case 'secondary':
        button.style.backgroundColor = '#f3f4f6';
        break;
      case 'danger':
        button.style.backgroundColor = '#dc2626';
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        break;
      case 'ghost':
        button.style.backgroundColor = '#f3f4f6';
        break;
      case 'link':
        button.style.textDecoration = 'none';
        break;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    const button = e.currentTarget;
    button.style.backgroundColor = variantStyles[variant].backgroundColor as string;
    button.style.transform = 'none';
    button.style.boxShadow = variantStyles[variant].boxShadow || 'none';
    if (variant === 'link') {
      button.style.textDecoration = 'underline';
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || variant === 'link') return;
    e.currentTarget.style.transform = 'scale(0.95)';
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || variant === 'link') return;
    e.currentTarget.style.transform = 'none';
  };

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={combinedStyles}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {children}
    </button>
  );
}

// Helper function to shade colors
function shadeColor(color: string, percent: number): string {
  // Handle hex colors
  if (color.startsWith('#')) {
    const num = parseInt(color.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      '#' +
      (
        0x1000000 +
        (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 0 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }
  return color;
}