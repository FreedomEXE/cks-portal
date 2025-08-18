import React from 'react';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  colorClass?: string;
};

export default function Badge({ className = '', colorClass = 'border-ink-200 text-ink-700', ...props }: BadgeProps) {
  return <span {...props} className={["badge", colorClass, className].filter(Boolean).join(' ')} />;
}
