import React from 'react';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export default function Select({ className = '', children, ...props }: SelectProps) {
  return <select {...props} className={["select", className].filter(Boolean).join(' ')}>{children}</select>;
}
