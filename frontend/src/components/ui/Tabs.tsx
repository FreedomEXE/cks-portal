import React from 'react';

export type TabsProps = {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
};

export default function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
  return (
    <div className={["flex gap-2", className].join(' ')}>
      {tabs.map(t => (
        <button
          key={t.key}
          className={["btn", active === t.key ? 'bg-ink-50' : 'btn-ghost'].join(' ')}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
