/*-----------------------------------------------
  Property of Freedom_EXE  (c) 2026
-----------------------------------------------*/
import React from 'react';
import Button, { type ButtonProps } from '../../../buttons/Button';

export type ActionKind = 'primary' | 'secondary' | 'danger';

export interface ActionDescriptor {
  id?: string;
  label: string;
  onClick: () => void | Promise<void>;
  variant?: ActionKind;
  size?: ButtonProps['size'];
  disabled?: boolean;
  title?: string; // tooltip
}

export interface ActionBarProps {
  actions: ActionDescriptor[];
  align?: 'left' | 'right';
}

export function ActionBar({ actions, align = 'left' }: ActionBarProps) {
  if (!actions || actions.length === 0) return null;
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    marginTop: 16,
    justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
    flexWrap: 'wrap',
  };

  return (
    <div style={containerStyle}>
      {actions.map((a, idx) => (
        <Button
          key={a.id || `${a.label}-${idx}`}
          variant={a.variant === 'danger' ? 'danger' : a.variant === 'secondary' ? 'secondary' : 'primary'}
          size={a.size || 'md'}
          onClick={a.onClick}
          disabled={a.disabled}
          title={a.title}
        >
          {a.label}
        </Button>
      ))}
    </div>
  );
}

export default ActionBar;
