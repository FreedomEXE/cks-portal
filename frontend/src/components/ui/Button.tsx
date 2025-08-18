import React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'default';
};

export default function Button({ variant = 'default', className = '', ...props }: ButtonProps) {
  const base = 'btn';
  const v = variant === 'primary' ? 'btn-primary' : variant === 'ghost' ? 'btn-ghost' : 'btn';
  return <button {...props} className={[base, v, className].filter(Boolean).join(' ')} />;
}
