import React from 'react';

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export default function Card({ className = '', ...props }: CardProps) {
  return <div {...props} className={["card", className].filter(Boolean).join(' ')} />;
}
