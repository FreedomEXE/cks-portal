import React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className = '', ...props }: InputProps) {
  return <input {...props} className={["input", className].filter(Boolean).join(' ')} />;
}
