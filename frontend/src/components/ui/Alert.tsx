import React from 'react';

export type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'error' | 'warn' | 'default';
};

export default function Alert({ variant = 'default', className = '', ...props }: AlertProps) {
  const base = 'alert';
  const v = variant === 'error' ? 'alert-error' : variant === 'warn' ? 'alert-warn' : 'alert';
  return <div {...props} className={[base, v, className].filter(Boolean).join(' ')} />;
}
